'use client';

import { Flex, Button, Heading, TextField, Dialog, IconButton, Text, Box, DropdownMenu } from '@radix-ui/themes';
import { useBuilderStore } from '@/store/useBuilderStore';
import { Download, Upload, Globe, Save, Cloud, Trash2, ChevronDown, FileJson, FileType, LogOut, User } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState, useRef, useEffect } from 'react';
import { exportToPdf } from '@/lib/export-utils';
import { exportToDocx, importFromDocx } from '@/lib/docx-utils';
import { saveReport } from '@/lib/supabase';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { AuthWrapper } from '@/components/auth/AuthWrapper';

export function Header() {
    const layout = useBuilderStore((state) => state.layout);
    const updateReportTitle = useBuilderStore((state) => state.updateReportTitle);
    const replaceLayout = useBuilderStore((state) => state.replaceLayout);
    const { user, signOut } = useAuth();

    // State restored
    const [isGenerating, setIsGenerating] = useState(false);
    const [publishDialogOpen, setPublishDialogOpen] = useState(false);
    const [publishPath, setPublishPath] = useState('');
    const [docxExportDialogOpen, setDocxExportDialogOpen] = useState(false); // [NEW]
    const fileInputRef = useRef<HTMLInputElement>(null);
    const docxInputRef = useRef<HTMLInputElement>(null); // [NEW]

    const [feedback, setFeedback] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({ open: false, title: '', message: '', type: 'info' });

    const showFeedback = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setFeedback({ open: true, title, message, type });
    };

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 100)); // Allow UI flush

            await exportToPdf('canvas-content', `${layout.title.toLowerCase().replace(/\s+/g, '_')}.pdf`);

            showFeedback('Başarılı', 'PDF başarıyla oluşturuldu ve indirildi.', 'success');
        } catch (error) {
            console.error('PDF Generation failed', error);
            showFeedback('Hata', 'PDF oluşturulamadı. Lütfen rapor içeriğini kontrol edin.', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleExportJSON = () => {
        const dataStr = JSON.stringify(layout, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${layout.title.toLowerCase().replace(/\s+/g, '_')}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (json && json.components) {
                    replaceLayout(json);
                    showFeedback('Başarılı', 'Düzen başarıyla içe aktarıldı.', 'success');
                } else {
                    showFeedback('Hata', 'Geçersiz düzen JSON formatı.', 'error');
                }
            } catch (err) {
                showFeedback('Hata', 'JSON dosyası ayrıştırılamadı.', 'error');
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = '';
    };

    // [NEW] DOCX Handlers
    const handleExportDocx = () => {
        setDocxExportDialogOpen(true);
    };

    const startDocxExport = async () => {
        setDocxExportDialogOpen(false);
        try {
            await exportToDocx(layout, layout.title.toLowerCase().replace(/\s+/g, '_'));
            showFeedback('Başarılı', 'Word dosyası oluşturuldu.', 'success');
        } catch (error) {
            console.error('DOCX Export failed', error);
            showFeedback('Hata', 'Word dosyası oluşturulamadı.', 'error');
        }
    };

    const handleImportDocx = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const components = await importFromDocx(file);
            if (components.length > 0) {
                // Determine active page or first page
                const targetPageId = useBuilderStore.getState().activePageId;
                const pageIndex = layout.pages.findIndex(p => p.id === targetPageId);

                if (pageIndex !== -1) {
                    // Add imported components to current page
                    // Note: We need a way to bulk add components or just replace page content.
                    // The requirement is "import", implying adding to or creating content.
                    // Given store limitations on bulk add, let's iterate or update page directly
                    // Actually `addComponent` relies on hooks. Let's use `updateComponent` logic but for page.
                    // Wait, `replaceLayout` replaces everything. We likely want to append to current page.

                    // Workaround: We don't have bulk add to page action.
                    // Let's iterate addComponent
                    components.forEach(comp => {
                        useBuilderStore.getState().addComponent(comp);
                    });

                    showFeedback('Başarılı', `${components.length} bileşen içe aktarıldı.`, 'success');
                } else {
                    showFeedback('Hata', 'Aktif sayfa bulunamadı.', 'error');
                }

            } else {
                showFeedback('Bilgi', 'Dokümandan içe aktarılacak içerik bulunamadı veya boş.', 'info');
            }
        } catch (error) {
            console.error('DOCX Import failed', error);
            showFeedback('Hata', 'Word dosyası okunamadı.', 'error');
        }
        e.target.value = '';
    };

    const [isPublishing, setIsPublishing] = useState(false);

    const handlePublish = async () => {
        if (!publishPath) return;
        setIsPublishing(true);

        try {
            const { error } = await saveReport(publishPath, layout);
            if (error) {
                console.error("Publish error:", error);
                const errorMsg = (error as any).message || 'Bilinmeyen hata';
                const errorDetails = (error as any).details || '';
                showFeedback('Yayınlama Hatası', `Rapor yayınlanırken bir sorun oluştu: ${errorMsg} ${errorDetails}`, 'error');
            } else {
                setPublishDialogOpen(false);
                setFeedback({
                    open: true,
                    title: 'Başarıyla Yayınlandı',
                    message: `Raporunuz şu adreste yayında: /${publishPath}`,
                    type: 'success'
                });
            }
        } catch (err: any) {
            console.error("Publishing exception:", err);
            showFeedback('Hata', 'Rapor veritabanına kaydedilemedi.', 'error');
        } finally {
            setIsPublishing(false);
        }
    };

    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

    // Watch for layout changes to trigger "Saving..." indicator
    useEffect(() => {
        setSaveStatus('saving');
        const timer = setTimeout(() => {
            setSaveStatus('saved');
        }, 800);
        return () => clearTimeout(timer);
    }, [layout]);

    return (
        <Flex
            justify="between"
            align="center"
            px="4"
            py="3"
            className="border-b border-gray-200 bg-white"
        >
            <Flex align="center" gap="4">
                <Heading size="4" className="bg-gradient-to-r from-gray-800 to-blue-500 bg-clip-text text-transparent">
                    Gazistat
                </Heading>
                <Flex align="center" gap="3">
                    <SimpleTooltip content="Rapor başlığını düzenlemek için buraya yazın">
                        <TextField.Root
                            value={layout.title}
                            onChange={(e) => updateReportTitle(e.target.value)}
                            placeholder="Rapor Başlığı"
                            variant="surface"
                            className="w-[300px]"
                        />
                    </SimpleTooltip>
                    <SimpleTooltip content={saveStatus === 'saving' ? "Değişiklikler kaydediliyor..." : "Tüm değişiklikler tarayıcınıza kaydedildi"}>
                        <Flex align="center" gap="2" width="100px" justify="start" className="opacity-80 transition-opacity duration-200 h-full">
                            {saveStatus === 'saving' ? (
                                <Cloud size={14} className="text-gray-500 animate-pulse" />
                            ) : (
                                <Save size={14} className="text-blue-500" />
                            )}
                            <Text size="1" weight="bold" color={saveStatus === 'saving' ? 'gray' : 'blue'} className="select-none">
                                {saveStatus === 'saving' ? 'Kaydediliyor...' : 'Kaydedildi'}
                            </Text>
                        </Flex>
                    </SimpleTooltip>
                </Flex>
            </Flex>

            <Flex gap="3">
                {/* Hidden File Input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".json"
                    onChange={handleImportJSON}
                />

                {/* [NEW] DOCX Input */}
                <input
                    type="file"
                    ref={docxInputRef}
                    style={{ display: 'none' }}
                    accept=".docx"
                    onChange={handleImportDocx}
                />

                <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                        <Button variant="outline">
                            <Upload size={16} />
                            İçe Aktar
                            <ChevronDown size={14} />
                        </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content>
                        <DropdownMenu.Item onClick={() => fileInputRef.current?.click()}>
                            <Flex gap="2" align="center">
                                <FileJson size={14} />
                                JSON Dosyası
                            </Flex>
                        </DropdownMenu.Item>
                        <DropdownMenu.Item onClick={() => docxInputRef.current?.click()}>
                            <Flex gap="2" align="center">
                                <FileType size={14} />
                                Word Dosyası (.docx)
                            </Flex>
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>

                <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                        <Button variant="outline">
                            <Download size={16} />
                            Dışa Aktar
                            <ChevronDown size={14} />
                        </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content>
                        <DropdownMenu.Item onClick={handleExportJSON}>
                            <Flex gap="2" align="center">
                                <FileJson size={14} />
                                JSON Dosyası
                            </Flex>
                        </DropdownMenu.Item>
                        <DropdownMenu.Item onClick={handleExportDocx}>
                            <Flex gap="2" align="center">
                                <FileType size={14} />
                                Word Dosyası (.docx)
                            </Flex>
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>

                <Dialog.Root>
                    <SimpleTooltip content="Mevcut raporu ve tüm içeriğini silerek sıfırlayın">
                        <Dialog.Trigger>
                            <Button variant="soft" color="red">
                                <Trash2 size={16} />
                                Raporu Sil
                            </Button>
                        </Dialog.Trigger>
                    </SimpleTooltip>
                    <Dialog.Content style={{ maxWidth: 450 }}>
                        <Dialog.Title>Raporu Sil</Dialog.Title>
                        <Dialog.Description size="2" mb="4">
                            Mevcut raporu ve tüm içeriğini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                        </Dialog.Description>

                        <Flex gap="3" mt="4" justify="end">
                            <Dialog.Close>
                                <Button variant="soft" color="gray">İptal</Button>
                            </Dialog.Close>
                            <Dialog.Close>
                                <Button color="red" variant="classic" onClick={() => {
                                    useBuilderStore.getState().resetLayout();
                                    showFeedback('Başarılı', 'Rapor başarıyla silindi ve sıfırlandı.', 'success');
                                }}>
                                    Evet, Sil
                                </Button>
                            </Dialog.Close>
                        </Flex>
                    </Dialog.Content>
                </Dialog.Root>

                <Dialog.Root open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
                    <SimpleTooltip content="Raporunuzu web sitesi olarak yayınlayın ve paylaşın">
                        <Dialog.Trigger>
                            <Button variant="soft">
                                <Globe size={16} />
                                Siteyi Yayınla
                            </Button>
                        </Dialog.Trigger>
                    </SimpleTooltip>
                    <Dialog.Content style={{ maxWidth: 450 }}>
                        <Dialog.Title>Raporu Yayınla</Dialog.Title>
                        <Dialog.Description size="2" mb="4">
                            Raporun erişilebilir olması için bir yol girin <br /> (ör. fen_fakultesi/2025/memnuniyet).
                        </Dialog.Description>

                        <Flex direction="column" gap="3">
                            <label>
                                <Text as="div" size="2" mb="1" weight="bold">Yol Adresi</Text>
                                <TextField.Root
                                    value={publishPath}
                                    onChange={(e) => setPublishPath(e.target.value.replace(/^\/+/, ''))}
                                    placeholder="ör. fen_fakultesi/2025"
                                />
                            </label>
                        </Flex>

                        <Flex gap="3" mt="4" justify="end">
                            <Dialog.Close>
                                <Button variant="soft" color="gray">İptal</Button>
                            </Dialog.Close>
                            <Button variant="classic" onClick={handlePublish} disabled={isPublishing}>
                                {isPublishing ? 'Yayınlanıyor...' : 'Yayınla'}
                            </Button>
                        </Flex>
                    </Dialog.Content>
                </Dialog.Root>

                <SimpleTooltip content="Raporu PDF formatında oluşturun ve indirin">
                    <Button variant='classic' onClick={handleDownload} disabled={isGenerating}>
                        {isGenerating ? 'Oluşturuluyor...' : 'PDF Yayınla'}
                    </Button>
                </SimpleTooltip>

                <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                        <IconButton variant="soft" color="gray" radius="full">
                            <User size={18} />
                        </IconButton>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="end">
                        <DropdownMenu.Label>{user?.email}</DropdownMenu.Label>
                        <DropdownMenu.Separator />
                        <DropdownMenu.Item color="red" onClick={signOut}>
                            <LogOut size={16} />
                            Çıkış Yap
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
            </Flex>

            {/* Feedback Dialog */}
            <Dialog.Root open={feedback.open} onOpenChange={(open) => setFeedback(prev => ({ ...prev, open }))}>
                <Dialog.Content style={{ maxWidth: 400 }}>
                    <Dialog.Title color={feedback.type === 'error' ? 'red' : 'indigo'}>
                        {feedback.title}
                    </Dialog.Title>
                    <Dialog.Description size="2" mb="4">
                        {feedback.message}
                    </Dialog.Description>

                    <Flex gap="3" mt="4" justify="end">
                        {feedback.title === 'Başarıyla Yayınlandı' && (
                            <Button variant="classic" onClick={() => window.open(`/${publishPath}`, '_blank')}>
                                Raporu Aç
                            </Button>
                        )}
                        <Dialog.Close>
                            <Button>Kapat</Button>
                        </Dialog.Close>
                    </Flex>
                </Dialog.Content>
            </Dialog.Root>

            {/* DOCX Beta Warning Dialog */}
            <Dialog.Root open={docxExportDialogOpen} onOpenChange={setDocxExportDialogOpen}>
                <Dialog.Content style={{ maxWidth: 450 }}>
                    <Dialog.Title>Beta Özellik Uyarısı</Dialog.Title>
                    <Dialog.Description size="2" mb="4">
                        Word'e aktarma özelliği şu anda geliştirme aşamasındadır (BETA).
                        Bazı bileşenler veya stil özellikleri tam olarak desteklenmeyebilir veya hatalı görünebilir.
                    </Dialog.Description>

                    <Flex gap="3" mt="4" justify="end">
                        <Dialog.Close>
                            <Button variant="soft" color="gray">İptal</Button>
                        </Dialog.Close>
                        <Button variant="classic" onClick={startDocxExport}>Devam Et</Button>
                    </Flex>
                </Dialog.Content>
            </Dialog.Root>
        </Flex>
    );
}
