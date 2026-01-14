'use client';

import { Box, Heading, Flex, Card, Text, ScrollArea, Separator as RadixSeparator, IconButton } from '@radix-ui/themes';
import { useDraggable } from '@dnd-kit/core';
import { ComponentType } from '@/types/schema';
import { Type, LayoutTemplate, Square, FileText, Image as ImageIcon, Minus, MoveVertical, BarChartIcon, ChevronDown, ChevronRight, Columns, Rows, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { SimpleTooltip } from '@/components/ui/tooltip';

interface SidebarItemProps {
    type: ComponentType | string;
    label: string;
    icon: React.ReactNode;
    disabled?: boolean;
    description?: string;
}

export function SidebarItem({ type, label, icon, disabled = false, description }: SidebarItemProps) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `sidebar - ${type} `,
        data: {
            type,
            label,
            isSidebarItem: true,
        },
        disabled,
    });

    const style = {
        opacity: disabled ? 0.5 : isDragging ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'grab',
    };

    const defaultDescription = disabled
        ? "Bu özellik şu anda geliştirme aşamasındadır."
        : `Raporunuza ${label.toLowerCase()} ekleyin.`;

    const finalDescription = description || defaultDescription;

    return (
        <SimpleTooltip content={finalDescription} side="right">
            <Card
                ref={disabled ? undefined : setNodeRef}
                style={style}
                {...(disabled ? {} : listeners)}
                {...(disabled ? {} : attributes)}
                variant="classic"
                className={disabled ? "transition-all border-gray-200 bg-gray-50" : "hover:border-primary-400 hover:shadow-sm transition-all cursor-pointer"}
            >
                <Flex gap="2" align="center">
                    <Box className={disabled ? "text-gray-400" : "text-primary-600"}>{icon}</Box>
                    <Text size="2" weight="medium" color={disabled ? "gray" : undefined}>
                        {label} {disabled && <span className="text-gray-400 text-xs">[geliştiriliyor]</span>}
                    </Text>
                </Flex>
            </Card>
        </SimpleTooltip>
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
                    <Heading size="3" >Araç Kutusu</Heading>
                </Box>
                <Box p="4">
                    <Flex direction="column" gap="4">

                        <SidebarSection title="Tipografi">
                            <SidebarItem type="heading" label="Başlık" icon={<Type size={16} />} description="Bölüm başlıkları oluşturmak için kullanılır." />
                            <SidebarItem type="text" label="Metin Bloğu" icon={<FileText size={16} />} description="Paragraf ve detaylı metin içerikleri ekle." />
                        </SidebarSection>

                        <RadixSeparator size="4" />

                        <SidebarSection title="Medya ve İçerik">
                            <SidebarItem type="image" label="Görsel" icon={<ImageIcon size={16} />} description="Bilgisayarınızdan resim yükleyin." />
                            <SidebarItem type="data-view" label="Veri Görünümü" icon={<BarChartIcon size={16} />} description="Grafik ve tablolarla veri görselleştirin." />
                        </SidebarSection>

                        <RadixSeparator size="4" />

                        <SidebarSection title="Düzen ve Boşluk">
                            <SidebarItem type="row" label="Satır" icon={<Rows size={16} />} disabled description="Yatay düzen oluşturucu (Geliştirme aşamasında)" />
                            <SidebarItem type="column" label="Sütun" icon={<Columns size={16} />} disabled description="Dikey düzen oluşturucu (Geliştirme aşamasında)" />
                            <SidebarItem type="metric-card" label="Metrik Kartı" icon={<Square size={16} />} description="Önemli sayısal verileri vurgulayın (KPI)." />
                            <SidebarItem type="divider" label="Ayırıcı" icon={<Minus size={16} />} description="Bölümler arasına çizgi ekle." />
                            <SidebarItem type="spacer" label="Boşluk" icon={<MoveVertical size={16} />} description="Bölümler arasına dikey boşluk ekle." />
                        </SidebarSection>

                        <RadixSeparator size="4" />

                        <SidebarSection title="Bileşenler">
                            <SidebarItem type="alert" label="Uyarı" icon={<AlertCircle size={16} />} description="Önemli notlar ve uyarı mesajları için renkli kutular." />
                        </SidebarSection>

                    </Flex>
                </Box>
            </Box >

        </ScrollArea>
    );
}

