'use client';

import { Flex, Button, Heading, TextField, Dialog, IconButton, Text, Box } from '@radix-ui/themes';
import { useBuilderStore } from '@/store/useBuilderStore';
import { Download, Upload, Globe, Save } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState, useRef } from 'react';
import { PDFDocument } from '@/lib/pdf-generator';

const PDFDownloadLink = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
    {
        ssr: false,
        loading: () => <Button disabled variant="outline">Loading PDF...</Button>,
    }
);

export function Header() {
    const layout = useBuilderStore((state) => state.layout);
    const updateReportTitle = useBuilderStore((state) => state.updateReportTitle);
    const replaceLayout = useBuilderStore((state) => state.replaceLayout);

    // State restored
    const [isGenerating, setIsGenerating] = useState(false);
    const [publishDialogOpen, setPublishDialogOpen] = useState(false);
    const [publishPath, setPublishPath] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [feedback, setFeedback] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({ open: false, title: '', message: '', type: 'info' });

    const showFeedback = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setFeedback({ open: true, title, message, type });
    };

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            const { pdf } = await import('@react-pdf/renderer');
            // Timeout to allow UI to update
            await new Promise(resolve => setTimeout(resolve, 100));

            const blob = await pdf(<PDFDocument layout={layout} />).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${layout.title.toLowerCase().replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showFeedback('Success', 'PDF generated and downloaded successfully.', 'success');
        } catch (error) {
            console.error('PDF Generation failed', error);
            showFeedback('Error', 'Failed to generate PDF. Please check that all images are valid URLs.', 'error');
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
                    showFeedback('Success', 'Layout imported successfully.', 'success');
                } else {
                    showFeedback('Error', 'Invalid layout JSON format.', 'error');
                }
            } catch (err) {
                showFeedback('Error', 'Failed to parse JSON file.', 'error');
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = '';
    };

    const handlePublish = () => {
        if (!publishPath) return;
        // Save to localStorage with prefix
        const key = `report_${publishPath}`;
        localStorage.setItem(key, JSON.stringify(layout));
        setPublishDialogOpen(false);

        // Show feedback modal with link
        setFeedback({
            open: true,
            title: 'Published Successfully',
            message: `Your report is now live at /${publishPath}`,
            type: 'success'
        });
    };

    return (
        <Flex
            justify="between"
            align="center"
            px="4"
            py="3"
            className="border-b border-gray-200 bg-white"
        >
            <Flex align="center" gap="4">
                <Heading size="4" className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Gazistat Builder
                </Heading>
                <TextField.Root
                    value={layout.title}
                    onChange={(e) => updateReportTitle(e.target.value)}
                    placeholder="Report Title"
                    variant="surface"
                    className="w-[300px]"
                />
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

                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={16} />
                    Import
                </Button>
                <Button variant="outline" onClick={handleExportJSON}>
                    <Download size={16} />
                    Export
                </Button>

                <Dialog.Root open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
                    <Dialog.Trigger>
                        <Button variant="soft" color="indigo">
                            <Globe size={16} />
                            Publish to Route
                        </Button>
                    </Dialog.Trigger>
                    <Dialog.Content style={{ maxWidth: 450 }}>
                        <Dialog.Title>Publish Report</Dialog.Title>
                        <Dialog.Description size="2" mb="4">
                            Enter a path slug to make this report accessible (e.g. 2025/Q4/sales).
                        </Dialog.Description>

                        <Flex direction="column" gap="3">
                            <label>
                                <Text as="div" size="2" mb="1" weight="bold">Route Path</Text>
                                <TextField.Root
                                    value={publishPath}
                                    onChange={(e) => setPublishPath(e.target.value)}
                                    placeholder="e.g. 2025/sales"
                                />
                            </label>
                        </Flex>

                        <Flex gap="3" mt="4" justify="end">
                            <Dialog.Close>
                                <Button variant="soft" color="gray">Cancel</Button>
                            </Dialog.Close>
                            <Button onClick={handlePublish}>Publish</Button>
                        </Flex>
                    </Dialog.Content>
                </Dialog.Root>

                <Button variant='classic' onClick={handleDownload} disabled={isGenerating}>
                    {isGenerating ? 'Generating...' : 'Publish PDF'}
                </Button>
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
                        {feedback.title === 'Published Successfully' && (
                            <Button variant="soft" onClick={() => window.open(`/${publishPath}`, '_blank')}>
                                Open Report
                            </Button>
                        )}
                        <Dialog.Close>
                            <Button>Close</Button>
                        </Dialog.Close>
                    </Flex>
                </Dialog.Content>
            </Dialog.Root>
        </Flex>
    );
}
