'use client';

import { useState, useRef } from 'react';
import { Button, Text, Flex, Box, TextField, IconButton } from '@radix-ui/themes';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { uploadImage } from '@/lib/supabase';
import { SimpleTooltip } from '@/components/ui/tooltip';

interface ImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    label?: string;
}

export function ImageUpload({ value, onChange, label = 'Görsel URL veya Yükle' }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            setError('Lütfen geçerli bir görsel dosyası seçin.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            setError('Görsel boyutu 5MB\'dan küçük olmalıdır.');
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            const url = await uploadImage(file);
            onChange(url);
        } catch (err: any) {
            console.error('Upload failed:', err);
            setError('Yükleme başarısız oldu. Lütfen tekrar deneyin.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <Flex direction="column" gap="2">
            <Flex justify="between" align="center">
                <Text as="label" size="2" weight="bold">{label}</Text>
            </Flex>
            <Box p="2" className="bg-amber-50 border border-amber-200 rounded">
                <Text size="1" color="amber" weight="bold">
                    ⚠️ Bu bir demodur, önemli verileri yüklemeyin.
                </Text>
            </Box>

            <Flex gap="2">
                <TextField.Root
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="https://example.com/image.jpg"
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
                                onClick={() => onChange('')}
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
                    accept="image/*"
                    className="hidden"
                />

                <SimpleTooltip content="Bilgisayardan görsel yükle">
                    <Button
                        variant="soft"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    </Button>
                </SimpleTooltip>
            </Flex>

            {error && (
                <Text size="1" color="red">{error}</Text>
            )}

            {value && (
                <Box mt="2" className="relative group rounded overflow-hidden border border-gray-200 bg-gray-50 aspect-video">
                    <img
                        src={value}
                        alt="Preview"
                        className="w-full h-full object-contain"
                    />
                </Box>
            )}
        </Flex>
    );
}
