'use client';

import { Box, Flex, Text, Button, IconButton } from '@radix-ui/themes';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useBuilderStore } from '@/store/useBuilderStore';
import { ComponentRenderer } from '@/components/canvas/ComponentRenderer';
import { useState } from 'react';
import { Plus, Trash, Minus, Maximize } from 'lucide-react';
import { Page } from '@/types/schema';

interface PageSheetProps {
    page: Page;
    isActive: boolean;
    onActivate: () => void;
    onDelete: () => void;
    canDelete: boolean;
}

function PageSheet({ page, isActive, onActivate, onDelete, canDelete }: PageSheetProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: page.id,
        data: {
            type: 'page',
            pageId: page.id
        }
    });
    const selectedComponentIds = useBuilderStore((state) => state.selectedComponentIds);

    return (
        <Box className="relative mb-8 group">
            <Box className="absolute -left-32 top-0 bottom-0 w-32 gap-4 items-center justify-center flex opacity-50 group-hover:opacity-100 transition-opacity">
                <Text size="2" weight="bold" color="gray">{page.name}</Text>
                {canDelete && (
                    <IconButton variant="ghost" color="red" onClick={onDelete} title="Sayfayı Sil">
                        <Trash size={16} />
                    </IconButton>
                )}
            </Box>

            <div
                ref={setNodeRef}
                style={{ height: '297mm' }}
                id={`page-${page.id}`} // Helper ID for PDF export
                className={`page-container bg-white shadow-lg w-[210mm] p-8 transition-colors relative overflow-hidden ${isOver ? 'ring-2 ring-gazi-sky-400 bg-gazi-sky-50' : ''
                    } ${isActive ? 'ring-1 ring-gray-400' : ''}`}
                onClick={onActivate}
            >
                {page.components.length === 0 ? (
                    <Flex justify="center" align="center" direction="column" className="h-full border-2 border-dashed border-gray-200 rounded-lg min-h-[200px] p-8">
                        <Text color="gray">Bileşenleri buraya sürükleyin</Text>
                    </Flex>
                ) : (
                    <SortableContext id={page.id} items={page.components.map(c => c.id)} strategy={verticalListSortingStrategy}>
                        {page.components.map((component) => (
                            <div key={component.id} data-component-id={component.id}>
                                <ComponentRenderer
                                    component={component}
                                    isSelected={selectedComponentIds.includes(component.id)}
                                />
                            </div>
                        ))}
                    </SortableContext>
                )}
            </div>
        </Box>
    );
}

export function Canvas() {
    const pages = useBuilderStore((state) => state.layout.pages);
    const activePageId = useBuilderStore((state) => state.activePageId);
    const setActivePage = useBuilderStore((state) => state.setActivePage);
    const addPage = useBuilderStore((state) => state.addPage);
    const removePage = useBuilderStore((state) => state.removePage);

    // Selection State
    const selectComponents = useBuilderStore((state) => state.selectComponents);
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
    const [selectionCurrent, setSelectionCurrent] = useState({ x: 0, y: 0 });

    const handlePointerDown = (e: React.PointerEvent) => {
        // Only start selection if clicking directly on the canvas background (not on a component)
        if (e.target !== e.currentTarget && !(e.target as HTMLElement).classList.contains('canvas-area')) {
            return;
        }

        setIsSelecting(true);
        setSelectionStart({ x: e.clientX, y: e.clientY });
        setSelectionCurrent({ x: e.clientX, y: e.clientY });
        selectComponents([]);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isSelecting) return;
        setSelectionCurrent({ x: e.clientX, y: e.clientY });
    };

    const handlePointerUp = () => {
        if (!isSelecting) return;
        setIsSelecting(false);

        const left = Math.min(selectionStart.x, selectionCurrent.x);
        const top = Math.min(selectionStart.y, selectionCurrent.y);
        const width = Math.abs(selectionCurrent.x - selectionStart.x);
        const height = Math.abs(selectionCurrent.y - selectionStart.y);

        const selectionRect = { left, top, right: left + width, bottom: top + height };
        const newSelectedIds: string[] = [];
        const componentElements = document.querySelectorAll('[data-component-id]');

        componentElements.forEach((el) => {
            const rect = el.getBoundingClientRect();
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

    // Zoom State
    const [zoom, setZoom] = useState(1);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
    const handleResetZoom = () => setZoom(1);

    return (
        <Flex
            justify="center"
            align="start"
            className="h-full overflow-auto p-16 canvas-area bg-gray-100 relative"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            <Flex
                direction="column"
                align="center"
                gap="8"
                style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top center',
                    transition: 'transform 0.2s ease-in-out'
                }}
            >
                {pages.map((page) => (
                    <PageSheet
                        key={page.id}
                        page={page}
                        isActive={page.id === activePageId}
                        onActivate={() => setActivePage(page.id)}
                        onDelete={() => removePage(page.id)}
                        canDelete={pages.length > 1}
                    />
                ))}

                <Button
                    variant="soft"
                    size="3"
                    className="mt-4 mb-20 w-[210mm] border-dashed border-2 bg-transparent hover:bg-white"
                    onClick={addPage}
                >
                    <Plus size={20} />
                    Yeni Sayfa Ekle
                </Button>
            </Flex>

            {/* Zoom Controls */}
            <Flex
                className="fixed bottom-8 right-85 bg-white shadow-lg rounded-full p-2 border border-gray-200 z-50"
                align="center"
                gap="2"
            >
                <IconButton variant="ghost" onClick={handleZoomOut} disabled={zoom <= 0.5} radius="full">
                    <Minus size={16} />
                </IconButton>
                <Text size="1" className="w-[40px] text-center select-none font-medium">
                    {Math.round(zoom * 100)}%
                </Text>
                <IconButton variant="ghost" onClick={handleZoomIn} disabled={zoom >= 2} radius="full">
                    <Plus size={16} />
                </IconButton>
                <IconButton variant="ghost" onClick={handleResetZoom} color="gray" radius="full" title="Sıfırla">
                    <Maximize size={14} />
                </IconButton>
            </Flex>

            {isSelecting && <div style={selectionBoxStyle} />}
        </Flex>
    );
}
