'use client';

import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { useDndContext } from '@dnd-kit/core';
import { Box } from '@radix-ui/themes';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { ComponentSchema } from '@/types/schema';
import { useBuilderStore } from '@/store/useBuilderStore';
import { AlertElement } from './elements/AlertElement';
import { ColumnElement } from './elements/ColumnElement';
import { ContainerFlexElement } from './elements/ContainerFlexElement';
import { DataViewElement } from './elements/DataViewElement';
import { DividerElement } from './elements/DividerElement';
import { HeadingElement } from './elements/HeadingElement';
import { ImageElement } from './elements/ImageElement';
import { MetricCardElement } from './elements/MetricCardElement';
import { RowElement } from './elements/RowElement';
import { SpacerElement } from './elements/SpacerElement';
import { TextElement } from './elements/TextElement';
import { GripVertical } from 'lucide-react';

interface ComponentRendererProps {
    component: ComponentSchema;
    isSelected?: boolean;
    readOnly?: boolean;
}

export function ComponentRenderer({ component, isSelected = false, readOnly = false }: ComponentRendererProps) {
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
    const { active, over } = useDndContext();
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
        id: component.id,
        disabled: readOnly,
    });
    const selectComponent = useBuilderStore((state) => state.selectComponent);
    const removeComponent = useBuilderStore((state) => state.removeComponent);
    const moveComponent = useBuilderStore((state) => state.moveComponent);
    const updateComponent = useBuilderStore((state) => state.updateComponent);
    const selectedComponentIds = useBuilderStore((state) => state.selectedComponentIds);
    const styles = component.styles ?? {};
    const componentIsSelected = isSelected || selectedComponentIds.includes(component.id);
    const isDropTarget = !readOnly && over?.id === component.id && active?.id !== component.id;
    const activeRect = active?.rect.current.translated;
    const insertAfter = Boolean(
        activeRect && over && activeRect.top + activeRect.height / 2 > over.rect.top + over.rect.height / 2
    );
    const update = (updates: Partial<ComponentSchema>) => updateComponent(component.id, updates);
    const select = () => selectComponent(component.id);

    useEffect(() => {
        if (!contextMenu) return;

        const closeMenu = () => setContextMenu(null);
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') closeMenu();
        };
        document.addEventListener('pointerdown', closeMenu);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('pointerdown', closeMenu);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [contextMenu]);

    const renderElement = () => {
        switch (component.type) {
            case 'heading':
                return <HeadingElement component={component} styles={styles} readOnly={readOnly} isSelected={componentIsSelected} onUpdate={update} onSelect={select} />;
            case 'text':
                return <TextElement component={component} styles={styles} readOnly={readOnly} isSelected={componentIsSelected} onUpdate={update} onSelect={select} />;
            case 'metric-card':
                return <MetricCardElement component={component} styles={styles} readOnly={readOnly} isSelected={componentIsSelected} onUpdate={update} onSelect={select} />;
            case 'image':
                return <ImageElement component={component} styles={styles} readOnly={readOnly} isSelected={componentIsSelected} onUpdate={update} onSelect={select} />;
            case 'divider':
                return <DividerElement component={component} styles={styles} readOnly={readOnly} isSelected={componentIsSelected} onUpdate={update} onSelect={select} />;
            case 'spacer':
                return <SpacerElement component={component} styles={styles} readOnly={readOnly} isSelected={componentIsSelected} onUpdate={update} onSelect={select} />;
            case 'data-view':
                return <DataViewElement component={component} styles={styles} readOnly={readOnly} isSelected={componentIsSelected} onUpdate={update} onSelect={select} />;
            case 'container-flex':
                return <ContainerFlexElement component={component} styles={styles} readOnly={readOnly} isSelected={componentIsSelected} onUpdate={update} onSelect={select} />;
            case 'row':
                return <RowElement component={component} styles={styles} readOnly={readOnly} isSelected={componentIsSelected} onUpdate={update} onSelect={select} />;
            case 'column':
                return <ColumnElement component={component} styles={styles} readOnly={readOnly} isSelected={componentIsSelected} onUpdate={update} onSelect={select} />;
            case 'alert':
                return <AlertElement component={component} styles={styles} readOnly={readOnly} isSelected={componentIsSelected} onUpdate={update} onSelect={select} />;
            default:
                return null;
        }
    };

    return (
        <Box
            ref={!readOnly ? setNodeRef : undefined}
            style={{
                width: component.type === 'divider' ? (styles.width ?? '100%') : 'fit-content',
                maxWidth: '100%',
                position: 'relative',
                marginTop: styles.marginTop,
                marginBottom: styles.marginBottom,
                marginLeft: styles.textAlign === 'center' || styles.textAlign === 'right' ? 'auto' : undefined,
                marginRight: styles.textAlign === 'center' ? 'auto' : undefined,
                transform: !readOnly ? CSS.Transform.toString(transform) : undefined,
                transition: !readOnly ? transition : undefined,
                opacity: isDragging ? 0.5 : 1,
                outline: !readOnly && componentIsSelected ? '2px solid #627d98' : '2px solid transparent',
                outlineOffset: '-2px',
            }}
            onClick={(event) => {
                if (readOnly) return;
                event.stopPropagation();
                select();
            }}
            onContextMenu={(event) => {
                if (readOnly) return;
                event.preventDefault();
                event.stopPropagation();
                select();
                setContextMenu({
                    x: Math.min(event.clientX, window.innerWidth - 176),
                    y: Math.min(event.clientY, window.innerHeight - 136),
                });
            }}
            className={!readOnly ? 'group relative max-w-full' : 'relative max-w-full'}
            data-component-id={component.id}
        >
            {!readOnly && (
                <button
                    type="button"
                    aria-label="Bileşeni taşımak için sürükle"
                    title="Taşımak için sürükle"
                    ref={setActivatorNodeRef}
                    {...attributes}
                    {...listeners}
                    style={{ touchAction: 'none' }}
                    className="absolute -left-7 top-1/2 z-20 flex h-8 w-6 -translate-y-1/2 cursor-grab items-center justify-center rounded border border-slate-200 bg-white text-slate-500 opacity-0 shadow-sm transition-opacity hover:bg-sky-50 hover:text-sky-700 focus:opacity-100 group-hover:opacity-100 active:cursor-grabbing"
                >
                    <GripVertical size={16} aria-hidden="true" />
                </button>
            )}
            {renderElement()}
            {isDropTarget && (
                <div
                    aria-hidden="true"
                    className={`pointer-events-none absolute left-0 right-0 z-30 h-[3px] rounded-full bg-sky-500 shadow-[0_0_0_3px_rgba(14,165,233,0.16)] transition-all duration-100 ${insertAfter ? '-bottom-1' : '-top-1'}`}
                />
            )}
            {contextMenu && typeof document !== 'undefined' && createPortal(
                <div
                    role="menu"
                    aria-label="Eleman işlemleri"
                    className="fixed z-[10000] min-w-40 overflow-hidden rounded-md border border-gray-200 bg-white p-1 shadow-lg"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onPointerDown={(event) => event.stopPropagation()}
                    onContextMenu={(event) => event.preventDefault()}
                >
                    <button
                        type="button"
                        role="menuitem"
                        className="block w-full rounded px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                            moveComponent(component.id, -1);
                            setContextMenu(null);
                        }}
                    >Yukarı al</button>
                    <button
                        type="button"
                        role="menuitem"
                        className="block w-full rounded px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                            moveComponent(component.id, 1);
                            setContextMenu(null);
                        }}
                    >Aşağı al</button>
                    <div className="my-1 border-t border-gray-100" />
                    <button
                        type="button"
                        role="menuitem"
                        className="block w-full rounded px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                        onClick={() => {
                            removeComponent(component.id);
                            setContextMenu(null);
                        }}
                    >Sil</button>
                </div>,
                document.body
            )}
        </Box>
    );
}