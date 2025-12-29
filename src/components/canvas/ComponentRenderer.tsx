'use client';

import { ComponentSchema, DataViewComponent } from '@/types/schema';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box, Heading, Text, Card, Flex, Callout } from '@radix-ui/themes';
import { useBuilderStore } from '@/store/useBuilderStore';
import { DataViewRenderer } from './DataViewRenderer';
import { Info, CheckCircle, TriangleAlert, AlertOctagon } from 'lucide-react';

interface ComponentRendererProps {
    component: ComponentSchema;
    isSelected?: boolean;
}

export function ComponentRenderer({ component, isSelected }: ComponentRendererProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: component.id });

    const selectComponent = useBuilderStore((state) => state.selectComponent);

    const styles = component.styles || {};

    const style: React.CSSProperties = {
        // Transform from dnd-kit
        transform: CSS.Transform.toString(transform),
        transition,

        // Interactions
        opacity: isDragging ? 0.5 : 1,
        outline: isSelected ? '2px solid var(--color-primary-500)' : '2px solid transparent',
        outlineOffset: '-2px',

        // Spacing
        paddingTop: styles.paddingTop,
        paddingRight: styles.paddingRight,
        paddingBottom: styles.paddingBottom,
        paddingLeft: styles.paddingLeft,
        marginTop: styles.marginTop,
        marginBottom: styles.marginBottom,

        // Typography
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        textAlign: styles.textAlign,
        color: styles.color,
        lineHeight: styles.lineHeight,

        // Appearance
        backgroundColor: styles.backgroundColor,
        borderColor: styles.borderColor,
        borderWidth: styles.borderWidth,
        borderStyle: styles.borderStyle,
        borderRadius: styles.borderRadius,

        // Layout
        width: styles.width,
        height: styles.height,
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        selectComponent(component.id);
    };

    const renderContent = () => {
        switch (component.type) {
            case 'heading':
                return (
                    <Heading
                        style={{
                            fontSize: component.styles?.fontSize || undefined,
                            color: (component.styles?.color as string) || 'inherit'
                        }}
                    >
                        {(component as any).content}
                    </Heading>
                );
            case 'text':
                return (
                    <Text>
                        {(component as any).content}
                    </Text>
                );
            case 'metric-card':
                return (
                    <Card>
                        <Flex direction="column" gap="1">
                            <Text size="2" color="gray">{(component as any).label}</Text>
                            <Heading size="6">{(component as any).value}</Heading>
                        </Flex>
                    </Card>
                );
            case 'image':
                const src = (component as any).src;
                if (!src) {
                    return (
                        <Flex
                            justify="center"
                            align="center"
                            className="bg-gray-100 border-2 border-dashed border-gray-300 rounded text-gray-400"
                            style={{
                                width: (component as any).width || '100%',
                                height: (component as any).height || '200px',
                                minHeight: '100px'
                            }}
                        >
                            <Flex direction="column" align="center" gap="2">
                                <Box>📷</Box>
                                <Text size="2">Image Placeholder</Text>
                            </Flex>
                        </Flex>
                    );
                }
                return (
                    <Box className="relative group">
                        <img
                            src={src}
                            alt={(component as any).alt}
                            draggable={false}
                            style={{
                                width: (component as any).width,
                                height: (component as any).height,
                                maxWidth: '100%',
                                objectFit: 'cover',
                                userSelect: 'none',
                                pointerEvents: 'none'
                            }}
                        />
                    </Box>
                );
            case 'divider':
                return (
                    <Box py="2">
                        <Box
                            style={{
                                borderTopWidth: (component as any).thickness,
                                borderTopStyle: (component as any).style || 'solid',
                                borderColor: (component.styles?.color as string) || '#e5e7eb'
                            }}
                        />
                    </Box>
                );
            case 'spacer':
                return <Box style={{ height: (component as any).height }} />;

            case 'data-view':
                return (
                    <Box className="w-full overflow-hidden border border-gray-200 rounded p-4 bg-white">
                        <DataViewRenderer component={component as DataViewComponent} />
                    </Box>
                );
            case 'container-flex':
                const children = (component as any).children || [];
                const direction = (component as any).direction || 'row';
                const gap = (component as any).gap || 0;
                const alignItems = (component as any).alignItems || 'stretch';
                const justifyContent = (component as any).justifyContent || 'flex-start';

                return (
                    <Flex
                        direction={direction}
                        gap={`${gap}px`}
                        align={alignItems === 'flex-start' ? 'start' : alignItems === 'flex-end' ? 'end' : alignItems}
                        justify={justifyContent === 'flex-start' ? 'start' : justifyContent === 'flex-end' ? 'end' : justifyContent === 'space-between' ? 'between' : justifyContent}
                        className="min-h-[50px] border border-dashed border-gray-200"
                        style={{ width: '100%' }}
                    >
                        {children.length === 0 ? (
                            <Text size="1" color="gray" className="p-2">Empty Container</Text>
                        ) : (
                            children.map((child: ComponentSchema) => (
                                <Box key={child.id} className="relative group">
                                    {/* 
                                        Note: We are not wrapping children in SortableContext here yet 
                                        because nested SortableContext requires a distinct IDs and collision detection setup.
                                        For now, we just render them recursively. 
                                     */}
                                    <ComponentRenderer component={child} />
                                </Box>
                            ))
                        )}
                    </Flex>
                );
            case 'row':
                const rowChildren = (component as any).children || [];
                const rowGap = (component as any).gap || 0;
                const rowAlign = (component as any).alignItems || 'center';
                const rowJustify = (component as any).justifyContent || 'flex-start';

                return (
                    <Flex
                        direction="row"
                        gap={`${rowGap}px`}
                        align={rowAlign === 'flex-start' ? 'start' : rowAlign === 'flex-end' ? 'end' : rowAlign}
                        justify={rowJustify === 'flex-start' ? 'start' : rowJustify === 'flex-end' ? 'end' : rowJustify === 'space-between' ? 'between' : rowJustify}
                        className="min-h-[50px] border border-dashed border-gray-200"
                        style={{ width: '100%' }}
                    >
                        {rowChildren.length === 0 ? (
                            <Text size="1" color="gray" className="p-2">Empty Row</Text>
                        ) : (
                            rowChildren.map((child: ComponentSchema) => (
                                <Box key={child.id} className="relative group">
                                    <ComponentRenderer component={child} />
                                </Box>
                            ))
                        )}
                    </Flex>
                );
            case 'column':
                const colChildren = (component as any).children || [];
                const colGap = (component as any).gap || 0;
                const colAlign = (component as any).alignItems || 'stretch';

                return (
                    <Flex
                        direction="column"
                        gap={`${colGap}px`}
                        align={colAlign === 'flex-start' ? 'start' : colAlign === 'flex-end' ? 'end' : colAlign}
                        className="min-h-[50px] border border-dashed border-gray-200"
                        style={{ width: '100%' }}
                    >
                        {colChildren.length === 0 ? (
                            <Text size="1" color="gray" className="p-2">Empty Column</Text>
                        ) : (
                            colChildren.map((child: ComponentSchema) => (
                                <Box key={child.id} className="relative group">
                                    <ComponentRenderer component={child} />
                                </Box>
                            ))
                        )}
                    </Flex>
                );
            case 'alert':
                const variant = (component as any).variant || 'info';
                let icon = <Info size={16} />;
                let color: 'blue' | 'green' | 'amber' | 'red' = 'blue';

                if (variant === 'success') {
                    icon = <CheckCircle size={16} />;
                    color = 'green';
                } else if (variant === 'warning') {
                    icon = <TriangleAlert size={16} />;
                    color = 'amber';
                } else if (variant === 'error') {
                    icon = <AlertOctagon size={16} />;
                    color = 'red';
                }

                return (
                    <Callout.Root color={color}>
                        <Callout.Icon>
                            {icon}
                        </Callout.Icon>
                        <Callout.Text>
                            {(component as any).content}
                        </Callout.Text>
                    </Callout.Root>
                );
            default:
                return <Text>Unknown Component</Text>;
        }
    }

    return (
        <Box
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={handleClick}
            onPointerDown={(e) => {
                e.stopPropagation();
                listeners?.onPointerDown?.(e);
            }}
            className="relative mb-2 select-none hover:border-gray-300 transition-colors rounded p-1"
            data-component-id={component.id}
        >
            {renderContent()}
        </Box>
    );
}
