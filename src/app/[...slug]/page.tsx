'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Box, Flex, Heading, Text, Card } from '@radix-ui/themes';
import { LayoutJSON } from '@/types/schema';
import { getReport } from '@/lib/supabase'; // [NEW]
import { ComponentRenderer } from '@/components/canvas/ComponentRenderer'; // We will use this directly but need to handle read-only

export default function ViewerPage() {
    const params = useParams();
    const slug = params?.slug; // Array of strings if [...slug]
    const [layout, setLayout] = useState<LayoutJSON | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (slug) {
            // Construct key from slug: e.g. ['2025', 'Q4', 'report'] -> '2025/Q4/report'
            const path = Array.isArray(slug) ? slug.join('/') : slug;
            // No more "report_" prefix needed since we use clean slugs in DB.
            // Wait, saveReport uses publishPath directly.

            const fetchReport = async () => {
                try {
                    const data = await getReport(path);
                    if (data) {
                        setLayout(data);
                    } else {
                        setError(`Rapor bulunamadı: ${path}`);
                    }
                } catch (e) {
                    console.error(e);
                    setError('Rapor yüklenirken hata oluştu.');
                }
            };

            fetchReport();
        }
    }, [slug]);

    if (error) {
        return (
            <Flex align="center" justify="center" height="100vh" direction="column" gap="4">
                <Heading color="red">404 Rapor Bulunamadı</Heading>
                <Text>{error}</Text>
            </Flex>
        );
    }

    if (!layout) {
        return (
            <Flex align="center" justify="center" height="100vh">
                <Text>Rapor yüklünüyor...</Text>
            </Flex>
        );
    }

    // Extract headings for sidebar navigation
    const sections = layout?.pages?.flatMap(page =>
        page.components.filter(c => c.type === 'heading')
    ) || [];

    const handleScrollTo = (id: string) => {
        const el = document.getElementById(`comp-${id}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <Flex className="min-h-screen bg-gray-50 h-screen overflow-hidden">
            {/* Navigation Sidebar */}
            <Box className="w-[250px] bg-white border-r border-gray-200 h-full flex flex-col shrink-0">
                <Box p="4" className="border-b border-gray-100">
                    <Heading size="3">{layout.title}</Heading>
                </Box>
                <Box className="flex-grow overflow-y-auto p-4">
                    <Flex direction="column" gap="2">
                        <Text size="1" weight="bold" color="gray" mb="2">BÖLÜMLER</Text>
                        {sections.length === 0 ? (
                            <Text size="2" color="gray">Tanımlanmış bölüm yok</Text>
                        ) : (
                            sections.map((section: any) => (
                                <Box
                                    key={section.id}
                                    className="p-2 hover:bg-gray-100 rounded cursor-pointer transition-colors"
                                    onClick={() => handleScrollTo(section.id)}
                                >
                                    <Text size="2">{section.content || 'Başlıksız Bölüm'}</Text>
                                </Box>
                            ))
                        )}
                    </Flex>
                </Box>
            </Box>

            {/* Main Content Area */}
            <Box className="flex-grow h-full overflow-y-auto bg-gray-50">
                <Box p="8" className="w-full max-w-[1600px] mx-auto">
                    <Flex direction="column" gap="8" className='pb-20'>
                        {layout.pages?.filter(p => p.components.length > 0).map((page) => (
                            <Card key={page.id} id={`page-${page.id}`} className="page-container bg-white shadow-sm p-8 min-h-[600px] w-full relative">
                                <Flex direction="column" gap="2" className='p-4'>
                                    {page.components.map((component) => (
                                        <div key={component.id} id={`comp-${component.id}`} style={{ position: 'relative' }}>
                                            <div className=''>
                                                <ComponentRenderer component={component} readOnly={true} />
                                            </div>
                                        </div>
                                    ))}
                                </Flex>
                            </Card>
                        ))}
                    </Flex>
                </Box>
            </Box>
        </Flex >
    );
}
