'use client';

import { Box, Heading, Flex, Button, TextField, Separator, Text, ScrollArea, Select } from '@radix-ui/themes';
import { useBuilderStore } from '@/store/useBuilderStore';
import { Trash2 } from 'lucide-react';
import { ComponentStyles, ComponentSchema } from '@/types/schema';
import { SpacingControl } from '@/components/properties/SpacingControl';
import { TypographyControl } from '@/components/properties/TypographyControl';
import { AppearanceControl } from '@/components/properties/AppearanceControl';
import { LayoutControl } from '@/components/properties/LayoutControl';
import { DataViewControl } from '@/components/properties/DataViewControl';

export function PropertiesPanel() {
    const selectedComponentIds = useBuilderStore((state) => state.selectedComponentIds);
    const layout = useBuilderStore((state) => state.layout);
    const updateComponent = useBuilderStore((state) => state.updateComponent);
    const selectComponent = useBuilderStore((state) => state.selectComponent);

    // Recursive search for selected component
    const findComponent = (components: ComponentSchema[], id: string): ComponentSchema | undefined => {
        for (const component of components) {
            if (component.id === id) return component;
            if ('children' in component && Array.isArray(component.children)) {
                const found = findComponent(component.children, id);
                if (found) return found;
            }
        }
        return undefined;
    };

    if (selectedComponentIds.length === 0) {
        return (
            <Box className="border-l border-gray-200 bg-white h-full p-4">
                <Text color="gray" size="2">Select a component to edit its properties.</Text>
            </Box>
        );
    }

    if (selectedComponentIds.length > 1) {
        return (
            <Box className="border-l border-gray-200 bg-white h-full p-4">
                <Flex direction="column" gap="2">
                    <Heading size="3">Multiple Selection</Heading>
                    <Text color="gray" size="2">{selectedComponentIds.length} items selected</Text>
                    <Text color="gray" size="1">Bulk editing is not supported yet.</Text>
                </Flex>
            </Box>
        );
    }

    const selectedComponentId = selectedComponentIds[0];
    const selectedComponent = findComponent(layout.components, selectedComponentId);

    if (!selectedComponent) {
        return (
            <Box className="border-l border-gray-200 bg-white h-full p-4">
                <Text color="gray" size="2">Component not found.</Text>
            </Box>
        );
    }

    const handleDelete = () => {
        useBuilderStore.getState().removeComponent(selectedComponent.id);
        selectComponent(null);
    };

    const handleStyleChange = (newStyles: ComponentStyles) => {
        updateComponent(selectedComponent.id, { styles: newStyles });
    };

    const renderSpecificFields = () => {
        switch (selectedComponent.type) {
            case 'heading':
            case 'text':
                return (
                    <Box mb="4">
                        <Text as="div" size="2" mb="1" weight="bold">Content</Text>
                        <TextField.Root
                            value={(selectedComponent as any).content}
                            onChange={(e) => updateComponent(selectedComponent.id, { content: e.target.value } as any)}
                        />
                    </Box>
                );
            case 'metric-card':
                return (
                    <Box mb="4">
                        <Box mb="2">
                            <Text as="div" size="2" mb="1" weight="bold">Label</Text>
                            <TextField.Root
                                value={(selectedComponent as any).label}
                                onChange={(e) => updateComponent(selectedComponent.id, { label: e.target.value } as any)}
                            />
                        </Box>
                        <Box>
                            <Text as="div" size="2" mb="1" weight="bold">Value</Text>
                            <TextField.Root
                                value={(selectedComponent as any).value}
                                onChange={(e) => updateComponent(selectedComponent.id, { value: e.target.value } as any)}
                            />
                        </Box>
                    </Box>
                );
            case 'image':
                return (
                    <Box mb="4">
                        <Text as="div" size="2" mb="1" weight="bold">Image URL</Text>
                        <TextField.Root
                            value={(selectedComponent as any).src}
                            onChange={(e) => updateComponent(selectedComponent.id, { src: e.target.value } as any)}
                        />
                    </Box>
                );
            case 'divider':
                return (
                    <Box mb="4">
                        <Text as="div" size="2" mb="1" weight="bold">Thickness</Text>
                        <TextField.Root
                            type="number"
                            value={(selectedComponent as any).thickness}
                            onChange={(e) => updateComponent(selectedComponent.id, { thickness: parseInt(e.target.value) } as any)}
                        />
                    </Box>
                );
            case 'spacer':
                return (
                    <Box mb="4">
                        <Text as="div" size="2" mb="1" weight="bold">Height</Text>
                        <TextField.Root
                            type="number"
                            value={(selectedComponent as any).height}
                            onChange={(e) => updateComponent(selectedComponent.id, { height: parseInt(e.target.value) } as any)}
                        />
                    </Box>
                );
            case 'data-view':
                return (
                    <DataViewControl
                        component={selectedComponent as any}
                        onUpdate={(updates) => updateComponent(selectedComponent.id, updates as any)}
                    />
                );
            case 'alert':
                return (
                    <Box mb="4">
                        <Box mb="2">
                            <Text as="div" size="2" mb="1" weight="bold">Variant</Text>
                            <Select.Root
                                value={(selectedComponent as any).variant}
                                onValueChange={(val) => updateComponent(selectedComponent.id, { variant: val } as any)}
                            >
                                <Select.Trigger />
                                <Select.Content>
                                    <Select.Item value="info">Info</Select.Item>
                                    <Select.Item value="success">Success</Select.Item>
                                    <Select.Item value="warning">Warning</Select.Item>
                                    <Select.Item value="error">Error</Select.Item>
                                </Select.Content>
                            </Select.Root>
                        </Box>
                        <Box mb="2">
                            <Text as="div" size="2" mb="1" weight="bold">Title</Text>
                            <TextField.Root
                                value={(selectedComponent as any).title || ''}
                                onChange={(e) => updateComponent(selectedComponent.id, { title: e.target.value } as any)}
                            />
                        </Box>
                        <Box>
                            <Text as="div" size="2" mb="1" weight="bold">Content</Text>
                            <TextField.Root
                                value={(selectedComponent as any).content}
                                onChange={(e) => updateComponent(selectedComponent.id, { content: e.target.value } as any)}
                            />
                        </Box>
                    </Box>
                );
            case 'row':
                return (
                    <Box mb="4">
                        <Box mb="2">
                            <Text as="div" size="2" mb="1" weight="bold">Gap</Text>
                            <TextField.Root
                                type="number"
                                value={(selectedComponent as any).gap}
                                onChange={(e) => updateComponent(selectedComponent.id, { gap: parseInt(e.target.value) } as any)}
                            />
                        </Box>
                        <Box mb="2">
                            <Text as="div" size="2" mb="1" weight="bold">Align Items</Text>
                            <Select.Root
                                value={(selectedComponent as any).alignItems}
                                onValueChange={(val) => updateComponent(selectedComponent.id, { alignItems: val } as any)}
                            >
                                <Select.Trigger />
                                <Select.Content>
                                    <Select.Item value="flex-start">Start</Select.Item>
                                    <Select.Item value="center">Center</Select.Item>
                                    <Select.Item value="flex-end">End</Select.Item>
                                    <Select.Item value="stretch">Stretch</Select.Item>
                                </Select.Content>
                            </Select.Root>
                        </Box>
                        <Box>
                            <Text as="div" size="2" mb="1" weight="bold">Justify Content</Text>
                            <Select.Root
                                value={(selectedComponent as any).justifyContent}
                                onValueChange={(val) => updateComponent(selectedComponent.id, { justifyContent: val } as any)}
                            >
                                <Select.Trigger />
                                <Select.Content>
                                    <Select.Item value="flex-start">Start</Select.Item>
                                    <Select.Item value="center">Center</Select.Item>
                                    <Select.Item value="flex-end">End</Select.Item>
                                    <Select.Item value="space-between">Space Between</Select.Item>
                                    <Select.Item value="space-around">Space Around</Select.Item>
                                    <Select.Item value="space-evenly">Space Evenly</Select.Item>
                                </Select.Content>
                            </Select.Root>
                        </Box>
                    </Box>
                );
            case 'column':
                return (
                    <Box mb="4">
                        <Box mb="2">
                            <Text as="div" size="2" mb="1" weight="bold">Gap</Text>
                            <TextField.Root
                                type="number"
                                value={(selectedComponent as any).gap}
                                onChange={(e) => updateComponent(selectedComponent.id, { gap: parseInt(e.target.value) } as any)}
                            />
                        </Box>
                        <Box>
                            <Text as="div" size="2" mb="1" weight="bold">Align Items</Text>
                            <Select.Root
                                value={(selectedComponent as any).alignItems}
                                onValueChange={(val) => updateComponent(selectedComponent.id, { alignItems: val } as any)}
                            >
                                <Select.Trigger />
                                <Select.Content>
                                    <Select.Item value="flex-start">Start</Select.Item>
                                    <Select.Item value="center">Center</Select.Item>
                                    <Select.Item value="flex-end">End</Select.Item>
                                    <Select.Item value="stretch">Stretch</Select.Item>
                                </Select.Content>
                            </Select.Root>
                        </Box>
                    </Box>
                );
            case 'container-flex':
                return null;
            default:
                return null;
        }
    };

    const styles = selectedComponent.styles || {};

    return (
        <ScrollArea type="auto" className='w-[320px]' scrollbars="vertical" style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e0 #f7fafc',
            padding: 16
        }}>
            <Box className="border-gray-200 bg-white flex flex-col w-full h-full">
                <Box p="4" className="border-b border-gray-100 bg-gray-50 flex-shrink-0">
                    <Heading size="3">Properties</Heading>
                    <Text size="1" color="gray">ID: {selectedComponent.id}</Text>
                </Box>

                <Flex direction="column" gap="4">
                    {renderSpecificFields()}

                    <Separator size="4" />

                    <LayoutControl styles={styles} onChange={handleStyleChange} />
                    <Separator size="4" />

                    <SpacingControl styles={styles} onChange={handleStyleChange} />
                    <Separator size="4" />

                    {(selectedComponent.type === 'heading' || selectedComponent.type === 'text' || selectedComponent.type === 'metric-card') && (
                        <>
                            <TypographyControl styles={styles} onChange={handleStyleChange} />
                            <Separator size="4" />
                        </>
                    )}

                    <AppearanceControl styles={styles} onChange={handleStyleChange} />

                </Flex>

                <Box p="4" className="border-t border-gray-100">
                    <Button color="red" variant="soft" className="w-full" onClick={handleDelete}>
                        <Trash2 size={16} />
                        Delete Component
                    </Button>
                </Box>
            </Box>
        </ScrollArea >

    );
}
