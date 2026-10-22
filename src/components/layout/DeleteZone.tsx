'use client';

import { useDroppable } from '@dnd-kit/core';
import { Trash2 } from 'lucide-react';
import { Box, Text } from '@radix-ui/themes';

interface DeleteZoneProps {
    isVisible: boolean;
}

export function DeleteZone({ isVisible }: DeleteZoneProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: 'delete-zone',
    });

    if (!isVisible) return null;

    return (
        <Box
            ref={setNodeRef}
            className={`fixed bottom-6 right-6 transition-all duration-200 ${isOver ? 'scale-105' : ''
                }`}
            style={{
                width: '176px',
                minHeight: '64px',
                borderRadius: '12px',
                backgroundColor: isOver ? '#ef4444' : '#f87171',
                opacity: isOver ? 1 : 0.96,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 16px',
                boxShadow: '0 8px 24px rgba(239, 68, 68, 0.24)',
                zIndex: 50,
            }}
        >
            <Box className="flex items-center gap-2">
                <Trash2 size={20} color="white" strokeWidth={2.5} />
                <Text
                    size="2"
                    weight="bold"
                    style={{ color: 'white', textAlign: 'center' }}
                >
                    Silmek için bırak
                </Text>
            </Box>
        </Box>
    );
}
