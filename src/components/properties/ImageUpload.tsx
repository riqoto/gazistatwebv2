'use client';

import { useState, useRef, useCallback } from 'react';
import { Button, Text, Flex, Box, TextField, IconButton } from '@radix-ui/themes';
import { Upload, X, Loader2, Image as ImageIcon, FileWarning, Crop, Shield } from 'lucide-react';
import { uploadImage } from '@/lib/supabase';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { SecureImage } from '@/components/ui/SecureImage';
import { ImageCropper } from '@/components/ui/ImageCropper';
import { validateImageFile, isAllowedImageUrl } from '@/utils/file-validation';

interface ImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    label?: string;
}

// ─── Rate Limiter ────────────────────────────────────────────────────────────

const RATE_LIMIT_MS = 3000;
let lastUploadTime = 0;

function isRateLimited(): boolean {
    const now = Date.now();
    if (now - lastUploadTime < RATE_LIMIT_MS) return true;
    lastUploadTime = now;
    return false;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ImageUpload({ value, onChange, label = 'Görsel URL veya Yükle' }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationInfo, setValidationInfo] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cropper state
    const [cropperOpen, setCropperOpen] = useState(false);
    const [cropperSrc, setCropperSrc] = useState<string | null>(null);
    const [pendingObjectUrl, setPendingObjectUrl] = useState<string | null>(null);

    // Cleanup object URLs to prevent memory leaks
    const cleanupObjectUrl = useCallback(() => {
        if (pendingObjectUrl) {
            URL.revokeObjectURL(pendingObjectUrl);
            setPendingObjectUrl(null);
        }
    }, [pendingObjectUrl]);

    // ─── File Selection Handler ──────────────────────────────────────────────

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        setValidationInfo(null);

        // Step 1: Validate file before anything else
        const validation = await validateImageFile(file);
        if (!validation.isValid) {
            setError(validation.error || 'Geçersiz dosya.');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        // Step 2: Create object URL and open cropper
        cleanupObjectUrl();
        const objectUrl = URL.createObjectURL(file);
        setPendingObjectUrl(objectUrl);
        setCropperSrc(objectUrl);
        setCropperOpen(true);

        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ─── Cropper Complete Handler ────────────────────────────────────────────

    const handleCropComplete = async (croppedFile: File) => {
        // Rate limit check
        if (isRateLimited()) {
            setError('Çok hızlı yükleme yapıyorsunuz. Lütfen birkaç saniye bekleyin.');
            cleanupObjectUrl();
            return;
        }

        setIsUploading(true);
        setError(null);
        setValidationInfo('Görsel güvenlik taramasından geçiriliyor...');

        try {
            // The upload pipeline already validates + re-encodes
            const { publicUrl } = await uploadImage(croppedFile);
            onChange(publicUrl);
            setValidationInfo(null);
        } catch (err: any) {
            console.error('Upload failed:', err);
            setError(err?.message || 'Yükleme başarısız oldu. Lütfen tekrar deneyin.');
            setValidationInfo(null);
        } finally {
            setIsUploading(false);
            cleanupObjectUrl();
        }
    };

    // ─── Cropper Cancel Handler ──────────────────────────────────────────────

    const handleCropCancel = () => {
        setCropperOpen(false);
        setCropperSrc(null);
        cleanupObjectUrl();
    };

    // ─── URL Input Handler ───────────────────────────────────────────────────

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        setError(null);

        if (url && !isAllowedImageUrl(url)) {
            setError('Yalnızca HTTPS ile Supabase depolama alanındaki görseller kabul edilir.');
            return;
        }

        onChange(url);
    };

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <>
            <Flex direction="column" gap="2">
                <Flex justify="between" align="center">
                    <Text as="label" size="2" weight="bold">{label}</Text>
                    <SimpleTooltip content="Görseller güvenlik taramasından geçirilir, EXIF verileri temizlenir">
                        <Flex align="center" gap="1" className="text-green-600">
                            <Shield size={12} />
                            <Text size="1" color="green">Güvenli</Text>
                        </Flex>
                    </SimpleTooltip>
                </Flex>

                <Box p="2" className="bg-amber-50 border flex flex-row items-center gap-2 border-amber-200 rounded">
                    <FileWarning className='text-amber-900 flex-shrink-0' size={16} />
                    <Text size="1" color="amber" weight="bold">
                        Bu bir demodur, önemli verileri yüklemeyin.
                    </Text>
                </Box>

                <Flex gap="2">
                    <TextField.Root
                        value={value}
                        onChange={handleUrlChange}
                        placeholder="https://...supabase.co/.../image.jpg"
                        className="flex-1"
                    >
                        <TextField.Slot>
                            <ImageIcon size={14} />
                        </TextField.Slot>
                        {value && (
                            <TextField.Slot>
                                <IconButton
                                    size="1"
                                    variant="ghost"
                                    color="gray"
                                    onClick={() => {
                                        onChange('');
                                        setError(null);
                                    }}
                                >
                                    <X size={14} />
                                </IconButton>
                            </TextField.Slot>
                        )}
                    </TextField.Root>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                    />

                    <SimpleTooltip content="Bilgisayardan görsel yükle (kırpma ile)">
                        <Button
                            variant="soft"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Flex align="center" gap="1">
                                    <Upload size={16} />
                                    <Crop size={14} />
                                </Flex>
                            )}
                        </Button>
                    </SimpleTooltip>
                </Flex>

                {/* Validation info */}
                {validationInfo && (
                    <Flex align="center" gap="1" className="text-blue-600">
                        <Loader2 size={12} className="animate-spin" />
                        <Text size="1" color="blue">{validationInfo}</Text>
                    </Flex>
                )}

                {/* Error display */}
                {error && (
                    <Text size="1" color="red">{error}</Text>
                )}

                {/* Preview */}
                {value && (
                    <Box mt="2" className="relative group rounded overflow-hidden border border-gray-200 bg-gray-50 aspect-video">
                        <SecureImage
                            src={value}
                            alt="Preview"
                            className="w-full h-full object-contain"
                        />
                    </Box>
                )}
            </Flex>

            {/* Cropper Dialog */}
            <ImageCropper
                imageSrc={cropperSrc}
                open={cropperOpen}
                onOpenChange={setCropperOpen}
                onCropComplete={handleCropComplete}
                onCancel={handleCropCancel}
            />
        </>
    );
}
