'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, Button, Flex, Text, Box, Slider } from '@radix-ui/themes';
import { getCroppedImg } from '@/utils/file-validation';
import { Check, X, RotateCcw, ZoomIn } from 'lucide-react';

interface CropArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface ImageCropperProps {
    imageSrc: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCropComplete: (file: File) => void;
    onCancel: () => void;
}

const ASPECT_OPTIONS = [
    { label: '16:9', value: 16 / 9 },
    { label: '4:3', value: 4 / 3 },
    { label: '1:1', value: 1 },
    { label: '2:3', value: 2 / 3 },
    { label: 'Serbest', value: 0 }, // 0 = free form
] as const;

export function ImageCropper({ imageSrc, open, onOpenChange, onCropComplete, onCancel }: ImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [aspect, setAspect] = useState(16 / 9);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);

    // Reset state when dialog opens
    // NOTE: Do NOT reset croppedAreaPixels here — react-easy-crop fires
    // onCropComplete on mount with the initial crop area, and resetting
    // after would clear that value, leaving the save button disabled.
    useEffect(() => {
        if (open) {
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setAspect(16 / 9);
            setPreviewUrl(null);
        }
    }, [open]);

    // ─── Live Preview ────────────────────────────────────────────────────────

    const updatePreview = useCallback(async () => {
        if (!imageSrc || !croppedAreaPixels || !previewCanvasRef.current) return;

        const canvas = previewCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        try {
            const image = new Image();
            // Do NOT set crossOrigin for blob: URLs — it taints the canvas

            image.onload = () => {
                const PREVIEW_WIDTH = 200;
                const scale = PREVIEW_WIDTH / croppedAreaPixels.width;
                const previewHeight = croppedAreaPixels.height * scale;

                canvas.width = PREVIEW_WIDTH;
                canvas.height = previewHeight;

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(
                    image,
                    croppedAreaPixels.x,
                    croppedAreaPixels.y,
                    croppedAreaPixels.width,
                    croppedAreaPixels.height,
                    0,
                    0,
                    PREVIEW_WIDTH,
                    previewHeight
                );
            };

            image.src = imageSrc;
        } catch {
            // Preview is non-critical
        }
    }, [imageSrc, croppedAreaPixels]);

    useEffect(() => {
        updatePreview();
    }, [updatePreview]);

    // ─── Crop Handlers ───────────────────────────────────────────────────────

    const onCropCompleteHandler = useCallback((_croppedArea: CropArea, croppedAreaPixels: CropArea) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        setIsSaving(true);
        try {
            const croppedImage = await getCroppedImg(
                imageSrc,
                croppedAreaPixels,
                'cropped-image.jpg'
            );
            if (croppedImage) {
                onCropComplete(croppedImage);
                onOpenChange(false);
            }
        } catch (e) {
            console.error('Crop error:', e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
    };

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Content style={{ maxWidth: 900, padding: 0, overflow: 'hidden' }}>
                <Box p="5">
                    <Dialog.Title>Görseli Düzenle</Dialog.Title>
                    <Dialog.Description size="2" color="gray">
                        Görseli kırpın ve boyutlandırın. Kırpma işlemi EXIF verilerini otomatik olarak temizler.
                    </Dialog.Description>
                </Box>

                <Flex gap="0" className="border-t border-gray-200">
                    {/* Left: Crop Area */}
                    <Box style={{ flex: '1 1 auto', position: 'relative', height: 420, background: '#1a1a1a' }}>
                        {imageSrc && (
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={aspect === 0 ? undefined : aspect}
                                onCropChange={setCrop}
                                onCropComplete={onCropCompleteHandler}
                                onZoomChange={setZoom}
                                showGrid
                                style={{
                                    containerStyle: { borderRadius: 0 },
                                }}
                            />
                        )}
                    </Box>

                    {/* Right: Preview & Controls */}
                    <Flex
                        direction="column"
                        gap="4"
                        p="4"
                        className="border-l border-gray-200 bg-gray-50"
                        style={{ width: 260, flexShrink: 0 }}
                    >
                        {/* Live Preview */}
                        <Box>
                            <Text size="2" weight="bold" mb="2" className="block">Önizleme</Text>
                            <Box
                                className="border border-gray-300 rounded bg-white overflow-hidden"
                                style={{ width: '100%', minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <canvas
                                    ref={previewCanvasRef}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: 150,
                                        objectFit: 'contain',
                                    }}
                                />
                            </Box>
                        </Box>

                        {/* Zoom Control */}
                        <Box>
                            <Flex align="center" gap="1" mb="2">
                                <ZoomIn size={14} />
                                <Text size="2" weight="bold">Yakınlaştır</Text>
                                <Text size="1" color="gray" ml="auto">{zoom.toFixed(1)}x</Text>
                            </Flex>
                            <Slider
                                value={[zoom]}
                                onValueChange={(v) => setZoom(v[0])}
                                min={1}
                                max={3}
                                step={0.05}
                            />
                        </Box>

                        {/* Aspect Ratio */}
                        <Box>
                            <Text size="2" weight="bold" mb="2" className="block">En/Boy Oranı</Text>
                            <Flex gap="2" wrap="wrap">
                                {ASPECT_OPTIONS.map((opt) => (
                                    <Button
                                        key={opt.label}
                                        size="1"
                                        variant={aspect === opt.value ? 'solid' : 'outline'}
                                        onClick={() => setAspect(opt.value)}
                                    >
                                        {opt.label}
                                    </Button>
                                ))}
                            </Flex>
                        </Box>

                        {/* Dimensions Info */}
                        {croppedAreaPixels && (
                            <Box className="bg-white rounded border border-gray-200 p-2">
                                <Text size="1" color="gray">
                                    Boyut: {Math.round(croppedAreaPixels.width)} × {Math.round(croppedAreaPixels.height)}px
                                </Text>
                            </Box>
                        )}
                    </Flex>
                </Flex>

                {/* Bottom Actions */}
                <Flex gap="3" p="4" justify="between" align="center" className="border-t border-gray-200 bg-white">
                    <Button variant="ghost" color="gray" onClick={handleReset} size="2">
                        <RotateCcw size={14} /> Sıfırla
                    </Button>

                    <Flex gap="3">
                        <Button variant="soft" color="gray" onClick={onCancel} size="2">
                            <X size={16} /> İptal
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving || !croppedAreaPixels} size="2">
                            {isSaving ? (
                                <Text size="2">İşleniyor...</Text>
                            ) : (
                                <>
                                    <Check size={16} /> Kırp ve Yükle
                                </>
                            )}
                        </Button>
                    </Flex>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
}
