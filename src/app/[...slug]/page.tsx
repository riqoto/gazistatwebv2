'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Box, Flex, Heading, Text, Card } from '@radix-ui/themes';
import { LayoutJSON } from '@/types/schema';
import { ComponentRenderer } from '@/components/canvas/ComponentRenderer'; // We will use this directly but need to handle read-only

export default function ViewerPage() {
    const params = useParams();
    const slug = params?.slug; // Array of strings if [...slug]
    const [layout, setLayout] = useState<LayoutJSON | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (slug) {
            // Construct key from slug: e.g. ['2025', 'Q4', 'report'] -> 'report_2025/Q4/report'
            const path = Array.isArray(slug) ? slug.join('/') : slug;
            const key = `report_${path}`;

            try {
                const saved = localStorage.getItem(key);
                if (saved) {
                    setLayout(JSON.parse(saved));
                } else {
                    setError(`Report not found at path: ${path}`);
                }
            } catch (e) {
                setError('Failed to load report.');
            }
        }
    }, [slug]);

    if (error) {
        return (
            <Flex align="center" justify="center" height="100vh" direction="column" gap="4">
                <Heading color="red">404 Report Not Found</Heading>
                <Text>{error}</Text>
            </Flex>
        );
    }

    if (!layout) {
        return (
            <Flex align="center" justify="center" height="100vh">
                <Text>Loading report...</Text>
            </Flex>
        );
    }

    // Extract headings for sidebar navigation
    const sections = layout?.components.filter(c => c.type === 'heading') || [];

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
                        <Text size="1" weight="bold" color="gray" mb="2">SECTIONS</Text>
                        {sections.length === 0 ? (
                            <Text size="2" color="gray">No sections defined</Text>
                        ) : (
                            sections.map((section: any) => (
                                <Box
                                    key={section.id}
                                    className="p-2 hover:bg-gray-100 rounded cursor-pointer transition-colors"
                                    onClick={() => handleScrollTo(section.id)}
                                >
                                    <Text size="2">{section.content || 'Untitled Section'}</Text>
                                </Box>
                            ))
                        )}
                    </Flex>
                </Box>
            </Box>

            {/* Main Content Area */}
            <Box className="flex-grow h-full overflow-y-auto p-8 flex justify-center items-center bg-gray-50">
                <Card size="4" style={{ minHeight: '200mm', backgroundColor: 'white', padding: 0, marginBottom: '50px' }}>
                    <Box p="8">
                        {/* Title removed as requested */}
                        <Flex direction="column" gap="2" className=''>
                            {layout.components
                                .sort((a, b) => a.order - b.order)
                                .map((component) => (
                                    <div key={component.id} id={`comp-${component.id}`} style={{ position: 'relative' }}>
                                        <div >
                                            <ComponentRenderer component={component} />
                                        </div>
                                    </div>
                                ))}
                        </Flex>
                    </Box>
                </Card>
            </Box>
        </Flex >
    );
}
