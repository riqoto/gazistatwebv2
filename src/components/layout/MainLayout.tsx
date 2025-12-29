'use client';

import { Flex, Grid, Box, Card, Text } from '@radix-ui/themes';
import { Sidebar, SidebarItem } from './Sidebar';
import { Canvas } from './Canvas';
import { PropertiesPanel } from './PropertiesPanel';
import { Header } from './Header';
import { DeleteZone } from './DeleteZone';
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    DragEndEvent,
    DragStartEvent,
    closestCenter,
} from '@dnd-kit/core';
import { useState } from 'react';
import { ComponentType, ComponentSchema } from '@/types/schema';
import { useBuilderStore } from '@/store/useBuilderStore';
import { Type, LayoutTemplate, Square, FileText } from 'lucide-react';

export function MainLayout() {
    const [activeSidebarItem, setActiveSidebarItem] = useState<{ type: ComponentType; label: string } | null>(null);
    const [isDraggingComponent, setIsDraggingComponent] = useState(false);
    const addComponent = useBuilderStore((state) => state.addComponent);
    const addComponentToParent = useBuilderStore((state) => state.addComponentToParent);
    const insertComponentAt = useBuilderStore((state) => state.insertComponentAt);
    const reorderComponents = useBuilderStore((state) => state.reorderComponents);
    const removeComponent = useBuilderStore((state) => state.removeComponent);
    const layout = useBuilderStore((state) => state.layout);

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
            // Dragging an existing component
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

        // Case 1: Dragging from sidebar to add new component
        if (active.data.current?.isSidebarItem) {
            const sidebarType = active.data.current.type;
            const nanoId = () => Math.random().toString(36).substr(2, 9);

            let type: ComponentType = sidebarType as ComponentType;
            let extraProps: any = {};

            if (sidebarType === 'container-flex-row') {
                type = 'container-flex';
                extraProps = {
                    direction: 'row',
                    gap: 10,
                    children: [],
                    styles: {
                        width: '100%',
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
                        width: '100%',
                        paddingTop: 10, paddingRight: 10, paddingBottom: 10, paddingLeft: 10,
                        borderStyle: 'dashed', borderWidth: 1, borderColor: '#ccc'
                    }
                };
            }

            const newComponent: any = {
                id: `${type}-${nanoId()}`,
                type,
                order: layout.components.length,
                ...extraProps,
                styles: { ...extraProps.styles },
                // Default props based on type
                ...(type === 'heading' ? { content: 'New Heading', styles: { fontSize: 32, fontWeight: 'bold' } } : {}),
                ...(type === 'text' ? { content: 'Lorem ipsum dolor sit amet...' } : {}),
                ...(type === 'metric-card' ? { label: 'Metric', value: '000' } : {}),
                ...(type === 'container-flex' && !extraProps.direction ? { children: [], direction: 'row' } : {}),
                ...(type === 'image' ? { src: 'https://via.placeholder.com/300x200', alt: 'Placeholder', width: 300, height: 200 } : {}),
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
                ...(type === 'row' ? { type: 'row', children: [], gap: 10, alignItems: 'center', justifyContent: 'flex-start', styles: { width: '100%', padding: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: '#e5e7eb' } } : {}),
                ...(type === 'column' ? { type: 'column', children: [], gap: 10, alignItems: 'stretch', styles: { width: '100%', padding: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: '#e5e7eb' } } : {}),
                ...(type === 'alert' ? { type: 'alert', variant: 'info', title: 'Info', content: 'This is an information alert.', styles: { marginBottom: 10 } } : {}),
            };

            // If dropped over an existing component, checking if it's a container or just reordering
            if (over.id !== 'canvas-droppable') {
                const overId = over.id as string;

                // Helper to check if target is a container
                // We need to check the actual component type from the layout
                // Since we don't have a direct lookup map here, we traverse to find it.
                // A simpler way: we assume components with children support nesting.
                // Or better, we check if the ID starts with row/column/container-flex if we trust ID conventions,
                // BUT the IDs are generated. So we need to find the component.

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

                const targetComponent = findComponentById(layout.components, overId);
                const isContainer = targetComponent && (
                    targetComponent.type === 'row' ||
                    targetComponent.type === 'column' ||
                    targetComponent.type === 'container-flex'
                );

                if (isContainer) {
                    addComponentToParent(overId, newComponent as ComponentSchema);
                    return;
                }

                // If not a container, just insert at index (sibling)
                const overIndex = layout.components.findIndex(c => c.id === over.id);
                if (overIndex !== -1) {
                    insertComponentAt(newComponent as ComponentSchema, overIndex);
                    return;
                }
            }

            // Otherwise add to end
            addComponent(newComponent as ComponentSchema);
        }
        // Case 2: Reordering existing components
        else if (active.id !== over.id) {
            reorderComponents(active.id as string, over.id as string);
        }
    };

    const renderDragOverlay = () => {
        if (!activeSidebarItem) return null;

        // Mimic the SidebarItem appearance
        let icon = null;
        if (activeSidebarItem.type === 'heading') icon = <Type size={16} />;
        else if (activeSidebarItem.type === 'text') icon = <FileText size={16} />;
        else if (activeSidebarItem.type === 'metric-card') icon = <Square size={16} />;
        else if (activeSidebarItem.type === 'container-flex') icon = <LayoutTemplate size={16} />;

        return (
            <Card
                variant="classic"
                className="w-[200px] shadow-lg border-primary-500 bg-white opacity-90 cursor-grabbing"
            >
                <Flex gap="2" align="center">
                    <Box className="text-gray-500">{icon}</Box>
                    <Text size="2" weight="medium">{activeSidebarItem.label}</Text>
                </Flex>
            </Card>
        );
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <Flex direction="column" height="100vh" className="max-h-screen">
                <Header />
                <Grid columns="250px 1fr 320px" rows="100%" flexGrow="1" gap="0" className="overflow-hidden">
                    <Sidebar />
                    <Box className="bg-secondary-50 overflow-hidden relative">
                        <Canvas />
                    </Box>
                    <PropertiesPanel />
                </Grid>
            </Flex>
            <DragOverlay>
                {renderDragOverlay()}
            </DragOverlay>
            <DeleteZone isVisible={isDraggingComponent} />
        </DndContext>
    );
}
