'use client';

import { Flex, Button, Heading, TextField, Dialog, IconButton, Text, Box, DropdownMenu } from '@radix-ui/themes';
import { useBuilderStore } from '@/store/useBuilderStore';
import { Download, Upload, Globe, Save, Cloud, Trash2, ChevronDown, FileJson, FileType, LogOut, User } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState, useRef, useEffect } from 'react';
import { exportToPdf } from '@/lib/export-utils';
import { exportToDocx, importFromDocx } from '@/lib/docx-utils';
import { saveReport, saveUserReportDraft } from '@/lib/supabase';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { AuthWrapper } from '@/components/auth/AuthWrapper';
import Link from 'next/link';

export function Header() {
    const layout = useBuilderStore((state) => state.layout);
    const updateReportTitle = useBuilderStore((state) => state.updateReportTitle);
    const replaceLayout = useBuilderStore((state) => state.replaceLayout);
    const reportId = useBuilderStore((state) => state.reportId);
    const { user, signOut } = useAuth();

    // State restored
    const [isGenerating, setIsGenerating] = useState(false);
    const [operation, setOperation] = useState<{ open: boolean; title: string; message: string; progress?: number }>({ open: false, title: '', message: '' });
    const [publishDialogOpen, setPublishDialogOpen] = useState(false);
    const [publishPath, setPublishPath] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const docxInputRef = useRef<HTMLInputElement>(null); // [NEW]

    const [feedback, setFeedback] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({ open: false, title: '', message: '', type: 'info' });

    const showFeedback = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setFeedback({ open: true, title, message, type });
    };

    const handleDownload = async () => {
        setIsGenerating(true);
        setOperation({ open: true, title: 'PDF hazırlanıyor', message: 'Sayfalar sırayla görüntüye dönüştürülüyor.' });
        try {
            await new Promise(resolve => setTimeout(resolve, 100)); // Allow UI flush

            await exportToPdf('canvas-content', `${layout.title.toLowerCase().replace(/\s+/g, '_')}.pdf`, (completed, total) => {
                setOperation({ open: true, title: 'PDF hazırlanıyor', message: `Sayfa ${completed} / ${total} işleniyor`, progress: Math.round(completed / total * 100) });
            });

            setOperation({ open: false, title: '', message: '' });
            showFeedback('Başarılı', 'PDF başarıyla oluşturuldu ve indirildi.', 'success');
        } catch (error) {
            console.error('PDF Generation failed', error);
            setOperation({ open: false, title: '', message: '' });
            showFeedback('Hata', 'PDF oluşturulamadı. Lütfen rapor içeriğini kontrol edin.', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleExportJSON = async () => {
        setOperation({ open: true, title: 'JSON yedeği hazırlanıyor', message: 'Rapor verileri dosyaya dönüştürülüyor.' });
        try {
            await new Promise(resolve => setTimeout(resolve, 50));
            const dataStr = JSON.stringify(layout);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${layout.title.toLowerCase().replace(/\s+/g, '_')}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            setOperation({ open: false, title: '', message: '' });
        } catch (error) {
            console.error('JSON export failed', error);
            setOperation({ open: false, title: '', message: '' });
            showFeedback('Hata', 'JSON yedeği oluşturulamadı.', 'error');
        }
    };

    const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setOperation({ open: true, title: 'JSON yedeği içe aktarılıyor', message: 'Dosya okunuyor ve rapor yapısı doğrulanıyor.' });
        void file.text().then((text) => {
            const json = JSON.parse(text);
            if (!json || typeof json.title !== 'string' || !Array.isArray(json.pages) || !json.pages.every((page: unknown) =>
                typeof page === 'object' && page !== null && Array.isArray((page as { components?: unknown }).components))) {
                throw new Error('Geçersiz rapor JSON biçimi.');
            }
            replaceLayout(json);
            setOperation({ open: false, title: '', message: '' });
            showFeedback('Başarılı', 'Düzen başarıyla içe aktarıldı.', 'success');
        }).catch((error: unknown) => {
            console.error('JSON import failed', error);
            setOperation({ open: false, title: '', message: '' });
            showFeedback('Hata', error instanceof Error ? error.message : 'JSON dosyası ayrıştırılamadı.', 'error');
        }).finally(() => {
        e.target.value = '';
        });
    };

    const handleExportDocx = async () => {
        setOperation({ open: true, title: 'Word dosyası hazırlanıyor', message: 'İçerik ve görseller işleniyor.' });
        try {
            await exportToDocx(layout, layout.title.toLowerCase().replace(/\s+/g, '_'), (completed, total, message) => {
                setOperation({ open: true, title: 'Word dosyası hazırlanıyor', message, progress: Math.round(completed / total * 90) });
            });
            setOperation({ open: false, title: '', message: '' });
            showFeedback('Başarılı', 'Word dosyası oluşturuldu.', 'success');
        } catch (error) {
            console.error('DOCX Export failed', error);
            setOperation({ open: false, title: '', message: '' });
            showFeedback('Hata', 'Word dosyası oluşturulamadı.', 'error');
        }
    };

    const handleImportDocx = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setOperation({ open: true, title: 'Word dosyası içe aktarılıyor', message: 'Dosya okunuyor ve sayfa grupları hazırlanıyor.' });
            await new Promise(resolve => setTimeout(resolve, 50));
            const importedPages = await importFromDocx(file);
            if (importedPages.length > 0) {
                if (useBuilderStore.getState().layout.pages.length + importedPages.length > 500) {
                    throw new Error('A report can contain up to 500 pages. Remove existing pages before importing this document.');
                }
                useBuilderStore.getState().appendPages(importedPages);
                setOperation({ open: false, title: '', message: '' });
                showFeedback('Başarılı', `${importedPages.length} sayfa içe aktarıldı.`, 'success');
            } else {
                setOperation({ open: false, title: '', message: '' });
                showFeedback('Bilgi', 'Dokümandan içe aktarılacak içerik bulunamadı veya boş.', 'info');
            }
        } catch (error) {
            console.error('DOCX Import failed', error);
            setOperation({ open: false, title: '', message: '' });
            showFeedback('Hata', error instanceof Error ? error.message : 'Word dosyası okunamadı.', 'error');
        }
        e.target.value = '';
    };

    const [isPublishing, setIsPublishing] = useState(false);

    const handlePublish = async () => {
        if (!publishPath) return;
        setIsPublishing(true);
        setOperation({ open: true, title: 'Web raporu yayınlanıyor', message: 'Rapor güvenli biçimde sunucuya gönderiliyor.' });

        try {
            if (!user) throw new Error('Giriş yapmanız gerekiyor.');
            const { error } = await saveReport(publishPath, layout, user.id);
            if (error) {
                setOperation({ open: false, title: '', message: '' });
                console.error("Publish error:", error);
                const errorMsg = (error as any).message || 'Bilinmeyen hata';
                const errorDetails = (error as any).details || '';
                showFeedback('Yayınlama Hatası', `Rapor yayınlanırken bir sorun oluştu: ${errorMsg} ${errorDetails}`, 'error');
            } else {
                const { error: draftError } = await saveUserReportDraft(reportId, user.id, layout, publishPath);
                if (draftError) throw draftError;
                setOperation({ open: false, title: '', message: '' });
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
            setOperation({ open: false, title: '', message: '' });
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
                        <DropdownMenu.Item asChild>
                            <Link href="/dashboard">Raporlarım</Link>
                        </DropdownMenu.Item>
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

            <Dialog.Root open={operation.open}>
                <Dialog.Content style={{ maxWidth: 440 }} onEscapeKeyDown={(event) => event.preventDefault()} onPointerDownOutside={(event) => event.preventDefault()}>
                    <Dialog.Title>{operation.title}</Dialog.Title>
                    <Dialog.Description size="2" mb="3">{operation.message}</Dialog.Description>
                    <Box className="h-2 overflow-hidden rounded bg-gray-200" aria-label="İşlem ilerlemesi">
                        <Box className="h-full bg-blue-600 transition-all" style={{ width: `${operation.progress ?? 8}%` }} />
                    </Box>
                    <Text size="1" color="gray" mt="2">Büyük belgelerde işlem birkaç dakika sürebilir. Bu pencereyi açık tutun.</Text>
                </Dialog.Content>
            </Dialog.Root>
        </Flex>
    );
}
