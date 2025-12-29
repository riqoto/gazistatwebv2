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
            className={`fixed bottom-0 right-0 transition-all duration-300 ${isOver ? 'scale-110' : ''
                }`}
            style={{
                width: '200px',
                height: '200px',
                borderRadius: '100% 0 0 0',
                backgroundColor: isOver ? '#ef4444' : '#f87171',
                opacity: isOver ? 1 : 0.9,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'flex-end',
                padding: '20px',
                boxShadow: '0 -4px 20px rgba(239, 68, 68, 0.4)',
                zIndex: 50,
            }}
        >
            <Box className="flex flex-col items-center gap-2 mb-8 mr-8">
                <Trash2 size={32} color="white" strokeWidth={2.5} />
                <Text
                    size="2"
                    weight="bold"
                    style={{ color: 'white', textAlign: 'center' }}
                >
                    Drop to Delete
                </Text>
            </Box>
        </Box>
    );
}
