'use client';

import { useRef, useState } from 'react';
import { Card, Flex, Text } from '@radix-ui/themes';
import { Image, TriangleAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ImageComponent } from '@/types/schema';
import { SecureImage } from '@/components/ui/SecureImage';
import { ElementRendererProps, getElementStyle } from './types';

interface ImageSize {
    width: number;
    height: number;
}

export function ImageElement(props: ElementRendererProps<ImageComponent>) {
    const { component, styles, readOnly, isSelected, onUpdate } = props;
    const { user } = useAuth();
    const [resizing, setResizing] = useState<ImageSize | null>(null);
    const resizeStart = useRef<{ pointerX: number; pointerY: number; width: number; height: number } | null>(null);

    const imageStyle = getElementStyle(styles);
    const currentWidth = resizing?.width ?? styles.width ?? component.width ?? 300;
    const currentHeight = resizing?.height ?? styles.height ?? component.height ?? 200;

    if (!user) {
        return (
            <Card variant="surface" style={imageStyle} className="bg-amber-50 border-amber-200">
                <Flex align="center" gap="3" p="2">
                    <TriangleAlert size={18} className="text-amber-600" />
                    <Text size="2" color="amber" weight="medium">Görseller beta sürümünde sadece kayıtlı kullanıcılara açıktır.</Text>
                </Flex>
            </Card>
        );
    }

    if (!component.src) {
        return (
            <Flex justify="center" align="center" className="bg-gray-50 border-2 border-dashed border-gray-300 rounded text-gray-400" style={{ ...imageStyle, width: styles.width ?? component.width ?? 300, height: styles.height ?? component.height ?? 200, minHeight: 100 }}>
                <Image size={20} />
            </Flex>
        );
    }

    const handleResizeStart = (event: React.PointerEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const rect = event.currentTarget.parentElement?.getBoundingClientRect();
        const width = rect?.width ?? (Number.parseFloat(String(currentWidth)) || 300);
        const height = rect?.height ?? (Number.parseFloat(String(currentHeight)) || 200);
        resizeStart.current = { pointerX: event.clientX, pointerY: event.clientY, width, height };
        event.currentTarget.setPointerCapture(event.pointerId);
        setResizing({ width, height });
    };

    const handleResizeMove = (event: React.PointerEvent<HTMLButtonElement>) => {
        const start = resizeStart.current;
        if (!start) return;
        setResizing({
            width: Math.max(24, Math.round(start.width + event.clientX - start.pointerX)),
            height: Math.max(24, Math.round(start.height + event.clientY - start.pointerY)),
        });
    };

    const finishResize = () => {
        if (resizing) {
            onUpdate({ styles: { ...styles, width: resizing.width, height: resizing.height } });
        }
        resizeStart.current = null;
        setResizing(null);
    };

    return (
        <div className="relative w-fit max-w-full" style={{ width: 'fit-content', maxWidth: '100%' }}>
            <SecureImage
                src={component.src}
                alt={component.alt ?? ''}
                draggable={false}
                width={currentWidth}
                height={currentHeight}
                style={{ ...imageStyle, width: currentWidth, height: currentHeight, maxWidth: '100%', objectFit: 'contain' }}
            />
            {!readOnly && isSelected && (
                <button
                    type="button"
                    aria-label="Resize image"
                    title="Resize image"
                    onPointerDown={handleResizeStart}
                    onPointerMove={handleResizeMove}
                    onPointerUp={finishResize}
                    onPointerCancel={finishResize}
                    onClick={(event) => event.stopPropagation()}
                    className="absolute bottom-0 right-0 z-10 h-4 w-4 cursor-se-resize touch-none border border-white bg-blue-600 shadow"
                />
            )}
        </div>
    );
}