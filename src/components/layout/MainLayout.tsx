'use client';

import { Flex, Grid, Box, Card, Text } from '@radix-ui/themes';
import { Sidebar } from './Sidebar';
import { Canvas } from './Canvas';
import { PropertiesPanel } from './PropertiesPanel';
import { Header } from './Header';
import { DeleteZone } from './DeleteZone';
import {
    DndContext,
    DragOverlay,
    CollisionDetection,
    useSensor,
    useSensors,
    PointerSensor,
    DragEndEvent,
    DragStartEvent,
    pointerWithin,
} from '@dnd-kit/core';
import { useState } from 'react';
import { ComponentType, ComponentSchema, ContainerFlexComponent } from '@/types/schema';
import { useBuilderStore } from '@/store/useBuilderStore';
import { Type, LayoutTemplate, Square, FileText, Image as ImageIcon, Minus, MoveVertical, BarChart3, Rows, Columns, AlertCircle, Move } from 'lucide-react';

const componentLabels: Record<string, string> = {
    heading: 'Başlık',
    text: 'Metin Bloğu',
    'metric-card': 'Metrik Kartı',
    image: 'Görsel',
    divider: 'Ayırıcı',
    spacer: 'Boşluk',
    'data-view': 'Veri Görünümü',
    'container-flex': 'Kapsayıcı',
    row: 'Satır',
    column: 'Sütun',
    alert: 'Uyarı',
};

function findComponent(components: ComponentSchema[], id: string): ComponentSchema | undefined {
    for (const component of components) {
        if (component.id === id) return component;
        if ('children' in component && Array.isArray(component.children)) {
            const found = findComponent(component.children, id);
            if (found) return found;
        }
    }
    return undefined;
}

const pointerCollisionDetection: CollisionDetection = (args) => {
    const collisions = pointerWithin(args).filter((collision) => collision.id !== args.active.id);
    const deleteTarget = collisions.find((collision) => collision.id === 'delete-zone');
    if (deleteTarget) return [deleteTarget];

    const componentTargets = collisions.filter((collision) =>
        args.droppableContainers.find((container) => container.id === collision.id)?.data.current?.type !== 'page'
    );
    const pageTargets = collisions.filter((collision) =>
        args.droppableContainers.find((container) => container.id === collision.id)?.data.current?.type === 'page'
    );

    return [...componentTargets, ...pageTargets];
};

export function MainLayout() {
    const [activeSidebarItem, setActiveSidebarItem] = useState<{ type: ComponentType; label: string } | null>(null);
    const [isDraggingComponent, setIsDraggingComponent] = useState(false);
    const addComponentToParent = useBuilderStore((state) => state.addComponentToParent);
    const insertComponentAt = useBuilderStore((state) => state.insertComponentAt);
    const reorderComponents = useBuilderStore((state) => state.reorderComponents);
    const removeComponent = useBuilderStore((state) => state.removeComponent);
    const moveComponentToPage = useBuilderStore((state) => state.moveComponentToPage);
    const layout = useBuilderStore((state) => state.layout);
    const activePageId = useBuilderStore((state) => state.activePageId);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const type = active.data.current?.type;
        const label = active.data.current?.label;
        if (active.data.current?.isSidebarItem) {
            setActiveSidebarItem({ type, label });
            setIsDraggingComponent(false);
        } else {
            const draggedComponent = layout.pages
                .map((page) => findComponent(page.components, active.id as string))
                .find((component) => component !== undefined);
            if (draggedComponent) {
                setActiveSidebarItem({
                    type: draggedComponent.type,
                    label: componentLabels[draggedComponent.type] ?? 'Bileşen',
                });
            }
            setIsDraggingComponent(true);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveSidebarItem(null);
        setIsDraggingComponent(false);

        if (!over) return;

        // Handle delete zone
        if (over.id === 'delete-zone' && !active.data.current?.isSidebarItem) {
            removeComponent(active.id as string);
            return;
        }

        // Helper to find component and its page
        const findComponentAndPage = (id: string) => {
            for (const page of layout.pages) {
                const found = findComponentById(page.components, id);
                if (found) return { component: found, page };
            }
            return null;
        };

        const findComponentById = (components: ComponentSchema[], id: string): ComponentSchema | null => {
            for (const c of components) {
                if (c.id === id) return c;
                if ('children' in c && Array.isArray(c.children)) {
                    const found = findComponentById(c.children, id);
                    if (found) return found;
                }
            }
            return null;
        };

        // Case 1: Dragging from sidebar to add new component
        if (active.data.current?.isSidebarItem) {
            const sidebarType = active.data.current.type;
            const nanoId = () => Math.random().toString(36).substr(2, 9);
            let targetPageId = activePageId;

            let type: ComponentType = sidebarType as ComponentType;
            let extraProps: Partial<ContainerFlexComponent> = {};

            if (sidebarType === 'container-flex-row') {
                type = 'container-flex';
                extraProps = {
                    direction: 'row',
                    gap: 10,
                    children: [],
                    styles: {
                        paddingTop: 10, paddingRight: 10, paddingBottom: 10, paddingLeft: 10,
                        borderStyle: 'dashed', borderWidth: 1, borderColor: '#ccc'
                    }
                };
            } else if (sidebarType === 'container-flex-col') {
                type = 'container-flex';
                extraProps = {
                    direction: 'column',
                    gap: 10,
                    children: [],
                    styles: {
                        paddingTop: 10, paddingRight: 10, paddingBottom: 10, paddingLeft: 10,
                        borderStyle: 'dashed', borderWidth: 1, borderColor: '#ccc'
                    }
                };
            }

            // Determine order based on current active page
            const activePage = layout.pages.find(p => p.id === activePageId) || layout.pages[0];
            const currentOrder = activePage?.components.length || 0;

            const newComponent = {
                id: `${type}-${nanoId()}`,
                type,
                order: currentOrder,
                ...extraProps,
                styles: { ...extraProps.styles },
                // Default props based on type
                ...(type === 'heading' ? { content: 'New Heading', styles: { fontSize: 32, fontWeight: 'bold' } } : {}),
                ...(type === 'text' ? { content: 'Lorem ipsum dolor sit amet...' } : {}),
                ...(type === 'metric-card' ? { label: 'Metric', value: '000' } : {}),
                ...(type === 'container-flex' && !extraProps.direction ? { children: [], direction: 'row' } : {}),
                ...(type === 'image' ? { src: '/images/placeholder.png', alt: 'Placeholder', width: 300, height: 200 } : {}),
                ...(type === 'divider' ? { thickness: 1, styles: { color: '#e5e7eb' }, type: 'divider' } : {}),
                ...(type === 'spacer' ? { height: 20, type: 'spacer' } : {}),
                ...(type === 'data-view' ? {
                    type: 'data-view',
                    viewType: 'table',
                    data: [
                        { name: 'Item A', value: 400, sales: 2400 },
                        { name: 'Item B', value: 300, sales: 1398 },
                        { name: 'Item C', value: 200, sales: 9800 },
                        { name: 'Item D', value: 278, sales: 3908 },
                    ],
                    config: {
                        xAxisKey: 'name',
                        yAxisKeys: ['value'],
                        columns: [{ key: 'name', label: 'Name' }, { key: 'value', label: 'Value' }]
                    }
                } : {}),
                ...(type === 'row' ? { type: 'row', children: [], gap: 10, alignItems: 'center', justifyContent: 'flex-start', styles: { paddingTop: 10, paddingRight: 10, paddingBottom: 10, paddingLeft: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: '#e5e7eb' } } : {}),
                ...(type === 'column' ? { type: 'column', children: [], gap: 10, alignItems: 'stretch', styles: { paddingTop: 10, paddingRight: 10, paddingBottom: 10, paddingLeft: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: '#e5e7eb' } } : {}),
                ...(type === 'alert' ? { type: 'alert', variant: 'info', title: 'Info', content: 'This is an information alert.', styles: { marginBottom: 10 } } : {}),
            } as ComponentSchema;

            // If dropped over a PAGE directly
            if (over.data.current?.type === 'page') {
                targetPageId = over.data.current.pageId;
                // Insert at end of that page
                insertComponentAt(newComponent, undefined, targetPageId);
                return;
            }

            // If dropped over an existing component
            if (over.id !== 'canvas-droppable') { // Legacy check, probably not needed if we check for page type above
                const overResult = findComponentAndPage(over.id as string);

                if (overResult) {
                    const { component: targetComponent, page: targetPage } = overResult;
                    targetPageId = targetPage.id;

                    const isContainer = (
                        targetComponent.type === 'row' ||
                        targetComponent.type === 'column' ||
                        targetComponent.type === 'container-flex'
                    );

                    if (isContainer) {
                        addComponentToParent(over.id as string, newComponent);
                        return;
                    }

                    // If not a container, insert as sibling
                    const overIndex = targetPage.components.findIndex(c => c.id === over.id);
                    if (overIndex !== -1) {
                        const activeRect = active.rect.current.translated;
                        const insertAfter = activeRect
                            ? activeRect.top + activeRect.height / 2 > over.rect.top + over.rect.height / 2
                            : false;
                        insertComponentAt(newComponent, overIndex + (insertAfter ? 1 : 0), targetPageId);
                        return;
                    }
                }
            }

            // Fallback: Add to end of active page
            // Check if active page is "full"
            const activePageEl = document.getElementById(`page-${activePageId}`);
            if (activePageEl) {
                // Determine actually used height by looking at the last element's position
                // A4 height is approx 1123px. p-8 is 32px top/bottom.
                // Content area starts at ~32px and should end at ~1090px (1123 - 32).

                // Get the direct children container usually handled by SortableContext or just div children
                // Since SortableContext doesn't add a wrapper div by default in this implementation (it just wraps children),
                // we can look at activePageEl.children
                const children = Array.from(activePageEl.children).filter(child =>
                    child.hasAttribute('data-component-id') // Filter only component elements, ignore properties/overlays if any
                );

                if (children.length > 0) {
                    const lastChild = children[children.length - 1];
                    const containerRect = activePageEl.getBoundingClientRect();
                    const lastChildRect = lastChild.getBoundingClientRect();

                    // Calculate relative bottom position of the last element
                    const usedHeight = lastChildRect.bottom - containerRect.top;

                    // Allow up to ~1080px (leaving ~40px buffer for bottom padding/margins)
                    if (usedHeight > 1080) {
                        alert("Bu sayfa tamamen dolu! Yeni bileşen eklenemiyor. Lütfen yeni bir sayfa oluşturun.");
                        return;
                    }
                }
            }
            insertComponentAt(newComponent, undefined, activePageId);
        }
        // Case 2: Reordering existing components
        else if (active.id !== over.id) {
            const activeResult = findComponentAndPage(active.id as string);
            const overResult = findComponentAndPage(over.id as string);

            // Handle moving to empty page
            if (over.data.current?.type === 'page') {
                if (activeResult) {
                    moveComponentToPage(
                        active.id as string,
                        activeResult.page.id,
                        over.data.current.pageId,
                        0 // Move to top of page
                    );
                }
                return;
            }

            if (activeResult && overResult) {
                // Check target page capacity if moving to a different page
                if (activeResult.page.id !== overResult.page.id) {
                    const targetPageEl = document.getElementById(`page-${overResult.page.id}`);
                    if (targetPageEl) {
                        const children = Array.from(targetPageEl.children).filter(child =>
                            child.hasAttribute('data-component-id')
                        );
                        if (children.length > 0) {
                            const lastChild = children[children.length - 1];
                            const containerRect = targetPageEl.getBoundingClientRect();
                            const lastChildRect = lastChild.getBoundingClientRect();
                            const usedHeight = lastChildRect.bottom - containerRect.top;

                            if (usedHeight > 1080) {
                                alert("Hedef sayfa dolu! Taşıma yapılamaz.");
                                return;
                            }
                        }
                    }

                    const newIndex = overResult.page.components.findIndex(c => c.id === over.id);
                    moveComponentToPage(
                        active.id as string,
                        activeResult.page.id,
                        overResult.page.id,
                        newIndex + ((active.rect.current.translated && active.rect.current.translated.top + active.rect.current.translated.height / 2 > over.rect.top + over.rect.height / 2) ? 1 : 0)
                    );
                } else {
                    // Same page reorder - no capacity check needed
                    const activeRect = active.rect.current.translated;
                    const position = activeRect && activeRect.top + activeRect.height / 2 > over.rect.top + over.rect.height / 2
                        ? 'after'
                        : 'before';
                    reorderComponents(active.id as string, over.id as string, position);
                }
            }
        }
    };

    const renderDragOverlay = () => {
        if (!activeSidebarItem) return null;

        // Mimic the SidebarItem appearance
        let icon: React.ReactNode = <Move size={18} />;
        if (activeSidebarItem.type === 'heading') icon = <Type size={16} />;
        else if (activeSidebarItem.type === 'text') icon = <FileText size={16} />;
        else if (activeSidebarItem.type === 'metric-card') icon = <Square size={16} />;
        else if (activeSidebarItem.type === 'image') icon = <ImageIcon size={16} />;
        else if (activeSidebarItem.type === 'divider') icon = <Minus size={16} />;
        else if (activeSidebarItem.type === 'spacer') icon = <MoveVertical size={16} />;
        else if (activeSidebarItem.type === 'data-view') icon = <BarChart3 size={16} />;
        else if (activeSidebarItem.type === 'row') icon = <Rows size={16} />;
        else if (activeSidebarItem.type === 'column') icon = <Columns size={16} />;
        else if (activeSidebarItem.type === 'alert') icon = <AlertCircle size={16} />;
        else if (activeSidebarItem.type === 'container-flex') icon = <LayoutTemplate size={16} />;

        return (
            <Card
                variant="classic"
                className="w-[220px] border-blue-300 bg-white shadow-xl ring-2 ring-blue-100 opacity-95 cursor-grabbing"
            >
                <Flex gap="3" align="center">
                    <Box className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">{icon}</Box>
                    <Box>
                        <Text size="2" weight="bold">{activeSidebarItem.label}</Text>
                        <Text as="div" size="1" color="gray">Bırakarak ekle veya taşı</Text>
                    </Box>
                </Flex>
            </Card>
        );
    };

    return (
        <Flex direction="column" height="100vh" className="max-h-screen">
            <Header />
            <DndContext
                sensors={sensors}
                collisionDetection={pointerCollisionDetection}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <Grid columns="250px 1fr 350px" rows="100%" flexGrow="1" gap="0" className="overflow-hidden">
                    <Sidebar />
                    <Box className="bg-gazi-sky-50 overflow-hidden relative">
                        <Canvas />
                    </Box>
                    <PropertiesPanel />
                </Grid>
                <DragOverlay>
                    {renderDragOverlay()}
                </DragOverlay>
                <DeleteZone isVisible={isDraggingComponent} />
            </DndContext>
        </Flex>
    );
}
