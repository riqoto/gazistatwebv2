'use client';

import { Box, Heading, Flex, Button, TextField, Separator, Text, ScrollArea, Select } from '@radix-ui/themes';
import { useBuilderStore } from '@/store/useBuilderStore';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { Trash2 } from 'lucide-react';
import { ComponentStyles, ComponentSchema } from '@/types/schema';
import { SpacingControl } from '@/components/properties/SpacingControl';
import { TypographyControl } from '@/components/properties/TypographyControl';
import { AppearanceControl } from '@/components/properties/AppearanceControl';
import { LayoutControl } from '@/components/properties/LayoutControl';
import { DataViewControl } from '@/components/properties/DataViewControl';
import { ImageUpload } from '@/components/properties/ImageUpload';
import { useCallback } from 'react';

export function PropertiesPanel() {
    const selectedComponentIds = useBuilderStore((state) => state.selectedComponentIds);
    const layout = useBuilderStore((state) => state.layout);
    const updateComponent = useBuilderStore((state) => state.updateComponent);
    const selectComponent = useBuilderStore((state) => state.selectComponent);

    // Recursive search for selected component
    const findComponent = (components: ComponentSchema[], id: string): ComponentSchema | undefined => {
        if (!components) return undefined;
        for (const component of components) {
            if (component.id === id) return component;
            if ('children' in component && Array.isArray(component.children)) {
                const found = findComponent(component.children, id);
                if (found) return found;
            }
        }
        return undefined;
    };

    // Helper to search across all pages
    const findComponentGlobal = (id: string): ComponentSchema | undefined => {
        if (!layout.pages) return undefined;
        for (const page of layout.pages) {
            const found = findComponent(page.components, id);
            if (found) return found;
        }
        return undefined;
    };

    // Get selected component before any early returns
    const selectedComponentId = selectedComponentIds[0];
    const selectedComponent = selectedComponentId
        ? findComponentGlobal(selectedComponentId)
        : undefined;

    // Define all hooks before any conditional returns
    const handleStyleChange = useCallback((newStyles: ComponentStyles) => {
        if (selectedComponent) {
            updateComponent(selectedComponent.id, { styles: newStyles });
        }
    }, [selectedComponent, updateComponent]);

    if (selectedComponentIds.length === 0) {
        return (
            <Box className="border-l border-gray-200 bg-white h-full p-4">
                <Text color="gray" size="2">Özelliklerini düzenlemek için bir bileşen seçin.</Text>
            </Box>
        );
    }

    if (selectedComponentIds.length > 1) {
        return (
            <Box className="border-l border-gray-200 bg-white h-full p-4">
                <Flex direction="column" gap="4">
                    <Box>
                        <Heading size="3">Çoklu Seçim</Heading>
                        <Text color="gray" size="2">{selectedComponentIds.length} öğe seçildi</Text>
                    </Box>
                    <Text color="gray" size="1">Toplu düzenleme henüz desteklenmiyor.</Text>

                    <SimpleTooltip content="Seçilen tüm bileşenleri sil">
                        <Button
                            color="red"
                            variant="soft"
                            className="w-full"
                            onClick={() => {
                                useBuilderStore.getState().removeComponents(selectedComponentIds);
                                selectComponent(null);
                            }}
                        >
                            <Trash2 size={16} />
                            Seçilenleri Sil ({selectedComponentIds.length})
                        </Button>
                    </SimpleTooltip>
                </Flex>
            </Box>
        );
    }

    if (!selectedComponent) {
        return (
            <Box className="border-l border-gray-200 bg-white h-full p-4">
                <Text color="gray" size="2">Bileşen bulunamadı.</Text>
            </Box>
        );
    }

    const handleDelete = () => {
        useBuilderStore.getState().removeComponent(selectedComponent.id);
        selectComponent(null);
    };

    const renderSpecificFields = () => {
        switch (selectedComponent.type) {
            case 'heading':
            case 'text':
                return (
                    <Box mb="4">
                        <Text as="div" size="2" mb="1" weight="bold">İçerik</Text>
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
                            <Text as="div" size="2" mb="1" weight="bold">Etiket</Text>
                            <TextField.Root
                                value={(selectedComponent as any).label}
                                onChange={(e) => updateComponent(selectedComponent.id, { label: e.target.value } as any)}
                            />
                        </Box>
                        <Box>
                            <Text as="div" size="2" mb="1" weight="bold">Değer</Text>
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
                        <ImageUpload
                            value={(selectedComponent as any).src}
                            onChange={(url) => updateComponent(selectedComponent.id, { src: url } as any)}
                        />
                    </Box>
                );
            case 'divider':
                return (
                    <Box mb="4">
                        <Text as="div" size="2" mb="1" weight="bold">Kalınlık</Text>
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
                        <Text as="div" size="2" mb="1" weight="bold">Yükseklik</Text>
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
                            <Text as="div" size="2" mb="1" weight="bold">Varyant</Text>
                            <Select.Root
                                value={(selectedComponent as any).variant}
                                onValueChange={(val) => updateComponent(selectedComponent.id, { variant: val } as any)}
                            >
                                <Select.Trigger />
                                <Select.Content>
                                    <Select.Item value="info">Bilgi</Select.Item>
                                    <Select.Item value="success">Başarılı</Select.Item>
                                    <Select.Item value="warning">Uyarı</Select.Item>
                                    <Select.Item value="error">Hata</Select.Item>
                                </Select.Content>
                            </Select.Root>
                        </Box>
                        <Box mb="2">
                            <Text as="div" size="2" mb="1" weight="bold">Başlık</Text>
                            <TextField.Root
                                value={(selectedComponent as any).title || ''}
                                onChange={(e) => updateComponent(selectedComponent.id, { title: e.target.value } as any)}
                            />
                        </Box>
                        <Box>
                            <Text as="div" size="2" mb="1" weight="bold">İçerik</Text>
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
                            <Text as="div" size="2" mb="1" weight="bold">Boşluk</Text>
                            <TextField.Root
                                type="number"
                                value={(selectedComponent as any).gap}
                                onChange={(e) => updateComponent(selectedComponent.id, { gap: parseInt(e.target.value) } as any)}
                            />
                        </Box>
                        <Box mb="2">
                            <Text as="div" size="2" mb="1" weight="bold">Öğeleri Hizala</Text>
                            <Select.Root
                                value={(selectedComponent as any).alignItems}
                                onValueChange={(val) => updateComponent(selectedComponent.id, { alignItems: val } as any)}
                            >
                                <Select.Trigger />
                                <Select.Content>
                                    <Select.Item value="flex-start">Başlangıç</Select.Item>
                                    <Select.Item value="center">Merkez</Select.Item>
                                    <Select.Item value="flex-end">Son</Select.Item>
                                    <Select.Item value="stretch">Uzat</Select.Item>
                                </Select.Content>
                            </Select.Root>
                        </Box>
                        <Box>
                            <Text as="div" size="2" mb="1" weight="bold">İçeriği Hizala</Text>
                            <Select.Root
                                value={(selectedComponent as any).justifyContent}
                                onValueChange={(val) => updateComponent(selectedComponent.id, { justifyContent: val } as any)}
                            >
                                <Select.Trigger />
                                <Select.Content>
                                    <Select.Item value="flex-start">Başlangıç</Select.Item>
                                    <Select.Item value="center">Merkez</Select.Item>
                                    <Select.Item value="flex-end">Son</Select.Item>
                                    <Select.Item value="space-between">Aralarında</Select.Item>
                                    <Select.Item value="space-around">Çevresinde</Select.Item>
                                    <Select.Item value="space-evenly">Eşit</Select.Item>
                                </Select.Content>
                            </Select.Root>
                        </Box>
                    </Box>
                );
            case 'column':
                return (
                    <Box mb="4">
                        <Box mb="2">
                            <Text as="div" size="2" mb="1" weight="bold">Boşluk</Text>
                            <TextField.Root
                                type="number"
                                value={(selectedComponent as any).gap}
                                onChange={(e) => updateComponent(selectedComponent.id, { gap: parseInt(e.target.value) } as any)}
                            />
                        </Box>
                        <Box>
                            <Text as="div" size="2" mb="1" weight="bold">Öğeleri Hizala</Text>
                            <Select.Root
                                value={(selectedComponent as any).alignItems}
                                onValueChange={(val) => updateComponent(selectedComponent.id, { alignItems: val } as any)}
                            >
                                <Select.Trigger />
                                <Select.Content>
                                    <Select.Item value="flex-start">Başlangıç</Select.Item>
                                    <Select.Item value="center">Merkez</Select.Item>
                                    <Select.Item value="flex-end">Son</Select.Item>
                                    <Select.Item value="stretch">Uzat</Select.Item>
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
        <ScrollArea type="auto" className='w-[350px]' scrollbars="vertical" style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e0 #f7fafc',
            padding: 4
        }}>
            <Box className="border-gray-200 bg-white flex flex-col w-full h-full rounded">
                <Box p="4" className="border-b border-gray-100 bg-gray-50 flex-shrink-0 rounded-t">
                    <Heading size="3">Özellikler</Heading>
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
                    <SimpleTooltip content="Bu bileşeni rapordan kalıcı olarak sil">
                        <Button color="red" variant="soft" className="w-full" onClick={handleDelete}>
                            <Trash2 size={16} />
                            Bileşeni Sil
                        </Button>
                    </SimpleTooltip>
                </Box>
            </Box>
        </ScrollArea >

    );
}
