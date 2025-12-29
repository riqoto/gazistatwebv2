'use client';

import { Box, Flex, Text } from '@radix-ui/themes';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useBuilderStore } from '@/store/useBuilderStore';
import { ComponentRenderer } from '@/components/canvas/ComponentRenderer';
import { useState } from 'react';

export function Canvas() {
    const { setNodeRef, isOver } = useDroppable({ id: 'canvas-droppable' });
    const components = useBuilderStore((state) => state.layout.components);
    const selectedComponentIds = useBuilderStore((state) => state.selectedComponentIds);
    const selectComponents = useBuilderStore((state) => state.selectComponents);

    // Selection State
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
    const [selectionCurrent, setSelectionCurrent] = useState({ x: 0, y: 0 });

    const handlePointerDown = (e: React.PointerEvent) => {
        // Only start selection if clicking directly on the canvas background (not on a component)
        // ComponentRenderer stops propagation, so this should only fire for background.
        if (e.target !== e.currentTarget && !(e.target as HTMLElement).classList.contains('canvas-area')) {
            return;
        }

        // Get relative coordinates within the scrollable container
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left + e.currentTarget.scrollTop; // Adjust for scroll if needed, but currentTarget is the scroll container?
        // Actually, the Flex container is scrollable "h-full overflow-auto p-8"
        // Let's use simple client logic relative to viewport and adjust overlay position

        setIsSelecting(true);
        setSelectionStart({ x: e.clientX, y: e.clientY });
        setSelectionCurrent({ x: e.clientX, y: e.clientY });

        // Clear selection if not holding shift (future improvement), for now simple reset
        selectComponents([]);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isSelecting) return;
        setSelectionCurrent({ x: e.clientX, y: e.clientY });
    };

    const handlePointerUp = () => {
        if (!isSelecting) return;
        setIsSelecting(false);

        // Calculate final selection
        const left = Math.min(selectionStart.x, selectionCurrent.x);
        const top = Math.min(selectionStart.y, selectionCurrent.y);
        const width = Math.abs(selectionCurrent.x - selectionStart.x);
        const height = Math.abs(selectionCurrent.y - selectionStart.y);

        // Find intersecting components
        // We use DOM rects for collision detection
        const selectionRect = { left, top, right: left + width, bottom: top + height };

        const newSelectedIds: string[] = [];

        // Helper to check all components inside container recursively
        // A better approach is to query all elements with data-component-id in the DOM
        const componentElements = document.querySelectorAll('[data-component-id]');

        componentElements.forEach((el) => {
            const rect = el.getBoundingClientRect();
            // Check intersection
            const isIntersecting = !(rect.right < selectionRect.left ||
                rect.left > selectionRect.right ||
                rect.bottom < selectionRect.top ||
                rect.top > selectionRect.bottom);

            if (isIntersecting) {
                const id = el.getAttribute('data-component-id');
                if (id) newSelectedIds.push(id);
            }
        });

        if (newSelectedIds.length > 0) {
            selectComponents(newSelectedIds);
        }
    };

    const selectionBoxStyle: React.CSSProperties = {
        position: 'fixed',
        left: Math.min(selectionStart.x, selectionCurrent.x),
        top: Math.min(selectionStart.y, selectionCurrent.y),
        width: Math.abs(selectionCurrent.x - selectionStart.x),
        height: Math.abs(selectionCurrent.y - selectionStart.y),
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        border: '1px solid #3b82f6',
        pointerEvents: 'none',
        zIndex: 9999
    };

    return (
        <Flex
            justify="center"
            align="start"
            className="h-full overflow-auto p-8 canvas-area"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            <Box
                ref={setNodeRef}
                className={`bg-white shadow-lg w-[210mm] min-h-[297mm] p-8 transition-colors ${isOver ? 'ring-2 ring-primary-200 bg-primary-50' : ''
                    }`}
            >
                {components.length === 0 ? (
                    <Flex justify="center" align="center" height="100vh" className="border-2 border-dashed border-gray-200 rounded-lg h-[200px]">
                        <Text color="gray">Drag components here</Text>
                    </Flex>
                ) : (
                    <SortableContext items={components.map(c => c.id)} strategy={verticalListSortingStrategy}>
                        {components.map((component) => (
                            <ComponentRenderer
                                key={component.id}
                                component={component}
                                isSelected={selectedComponentIds.includes(component.id)}
                            />
                        ))}
                    </SortableContext>
                )}
            </Box>

            {isSelecting && <div style={selectionBoxStyle} />}
        </Flex>
    );
}
