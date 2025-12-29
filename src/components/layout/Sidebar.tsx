'use client';

import { Box, Heading, Flex, Card, Text, ScrollArea, Separator as RadixSeparator, IconButton } from '@radix-ui/themes';
import { useDraggable } from '@dnd-kit/core';
import { ComponentType } from '@/types/schema';
import { Type, LayoutTemplate, Square, FileText, Image as ImageIcon, Minus, MoveVertical, BarChartIcon, ChevronDown, ChevronRight, Columns, Rows, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface SidebarItemProps {
    type: ComponentType | string;
    label: string;
    icon: React.ReactNode;
}

export function SidebarItem({ type, label, icon }: SidebarItemProps) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `sidebar - ${type} `,
        data: {
            type,
            label,
            isSidebarItem: true,
        },
    });

    const style = {
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
    };

    return (
        <Card
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            variant="classic"
            className="hover:border-primary-400 hover:shadow-sm transition-all cursor-pointer"
        >
            <Flex gap="2" align="center">
                <Box className="text-gray-500">{icon}</Box>
                <Text size="2" weight="medium">{label}</Text>
            </Flex>
        </Card>
    );
}

function SidebarSection({ title, children }: { title: string, children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <Box>
            <Flex
                align="center"
                justify="between"
                className="cursor-pointer mb-2 hover:bg-gray-50 rounded p-1"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Text size="1" color="gray" weight="bold" className="uppercase select-none">{title}</Text>
                <IconButton variant="ghost" size="1" color="gray">
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </IconButton>
            </Flex>
            {isOpen && (
                <Flex direction="column" gap="2" className="pl-1">
                    {children}
                </Flex>
            )}
        </Box>
    );
}

export function Sidebar() {
    return (
        <ScrollArea type="auto" scrollbars="vertical" style={{ height: '100%' }}>

            <Box className="border-r border-gray-200 bg-white h-full flex flex-col">
                <Box p="4" className="border-b border-gray-100">
                    <Heading size="3" >Toolbox</Heading>
                </Box>
                <Box p="4">
                    <Flex direction="column" gap="4">

                        <SidebarSection title="Typography">
                            <SidebarItem type="heading" label="Heading" icon={<Type size={16} />} />
                            <SidebarItem type="text" label="Text Block" icon={<FileText size={16} />} />
                        </SidebarSection>

                        <RadixSeparator size="4" />

                        <SidebarSection title="Media & Content">
                            <SidebarItem type="image" label="Image" icon={<ImageIcon size={16} />} />
                            <SidebarItem type="data-view" label="Data View" icon={<BarChartIcon size={16} />} />
                        </SidebarSection>

                        <RadixSeparator size="4" />

                        <SidebarSection title="Layout & Spacing">
                            <SidebarItem type="row" label="Row" icon={<Rows size={16} />} />
                            <SidebarItem type="column" label="Column" icon={<Columns size={16} />} />
                            <SidebarItem type="metric-card" label="Metric Card" icon={<Square size={16} />} />
                            <SidebarItem type="divider" label="Divider" icon={<Minus size={16} />} />
                            <SidebarItem type="spacer" label="Spacer" icon={<MoveVertical size={16} />} />
                        </SidebarSection>

                        <RadixSeparator size="4" />

                        <SidebarSection title="Components">
                            <SidebarItem type="alert" label="Alert" icon={<AlertCircle size={16} />} />
                        </SidebarSection>

                    </Flex>
                </Box>
            </Box >

        </ScrollArea>
    );
}
