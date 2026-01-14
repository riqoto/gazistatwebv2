import { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType } from 'docx';
import mammoth from 'mammoth';
import { saveAs } from 'file-saver';
import { v4 as uuidv4 } from 'uuid';
import { LayoutJSON, ComponentSchema } from '@/types/schema';

// --- EXPORT LOGIC ---

export const exportToDocx = async (layout: LayoutJSON, filename: string) => {
    const docChildren: (Paragraph)[] = [];

    // Title
    docChildren.push(
        new Paragraph({
            text: layout.title || 'Rapor',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
        })
    );

    // Process Pages
    for (const page of layout.pages) {
        // Page Title
        docChildren.push(
            new Paragraph({
                text: page.name,
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 200, after: 100 },
                pageBreakBefore: docChildren.length > 1, // Page break for subsequent pages
            })
        );

        // Process Components recursively
        await processComponents(page.components, docChildren);
    }

    const doc = new Document({
        sections: [
            {
                properties: {},
                children: docChildren,
            },
        ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, filename.endsWith('.docx') ? filename : `${filename}.docx`);
};

const processComponents = async (components: ComponentSchema[], docChildren: (Paragraph)[]) => {
    if (!components) return;

    for (const component of components) {
        switch (component.type) {
            case 'heading':
                docChildren.push(
                    new Paragraph({
                        text: (component as any).content || '',
                        heading: HeadingLevel.HEADING_2, // Map internal heading to H2 for now
                        spacing: { before: 120, after: 60 },
                    })
                );
                break;
            case 'text':
                docChildren.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: (component as any).content || '',
                            }),
                        ],
                        spacing: { after: 120 },
                    })
                );
                break;
            case 'image':
                const src = (component as any).src;
                if (src) {
                    try {
                        // Fetch image if it's a URL, or use base64
                        const imageBuffer = await fetchImage(src);
                        if (imageBuffer) {
                            docChildren.push(
                                new Paragraph({
                                    children: [
                                        new ImageRun({
                                            data: new Uint8Array(imageBuffer) as any,
                                            transformation: {
                                                width: 400, // Default width
                                                height: 400,
                                            },
                                        } as any),
                                    ],
                                    alignment: AlignmentType.CENTER,
                                    spacing: { after: 120 },
                                })
                            );
                        }
                    } catch (e) {
                        console.error('Failed to load image for DOCX export', e);
                        docChildren.push(
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: `[Görsel Yüklenemedi: ${src}]`,
                                        color: 'FF0000'
                                    })
                                ]
                            })
                        );
                    }
                }
                break;
            case 'row':
            case 'column':
                // For layout containers, recurse
                if ((component as any).children) {
                    await processComponents((component as any).children, docChildren);
                }
                break;
            default:
                // Skip unsupported or add placeholder
                // docChildren.push(new Paragraph({ text: `[${component.type} skipped]` }));
                break;
        }
    }
};

const fetchImage = async (url: string): Promise<ArrayBuffer | null> => {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        return await response.arrayBuffer();
    } catch (error) {
        return null; // Handle local files or cors issues
    }
};

// --- IMPORT LOGIC ---

export const importFromDocx = async (file: File): Promise<ComponentSchema[]> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const html = result.value;
        const messages = result.messages; // Any warnings

        if (messages.length > 0) {
            console.warn('Mammoth import warnings:', messages);
        }

        return parseHtmlToComponents(html);
    } catch (error) {
        console.error("Error importing DOCX:", error);
        throw error;
    }
};

const parseHtmlToComponents = (html: string): ComponentSchema[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const components: ComponentSchema[] = [];

    const elements = Array.from(doc.body.children);

    elements.forEach((el) => {
        if (el.tagName.match(/^H[1-6]$/)) {
            components.push({
                id: uuidv4(),
                type: 'heading',
                content: el.textContent || '',
                styles: {},
            } as any);
        } else if (el.tagName === 'P') {
            // Check for images inside p
            const img = el.querySelector('img');
            if (img) {
                components.push({
                    id: uuidv4(),
                    type: 'image',
                    src: img.src, // Mammoth converts images to base64 data URIs by default
                    styles: {},
                    alt: img.alt || 'Imported Image'
                } as any);
                // If there is text alongside image, add it as text component? 
                // For simplicity, let's treat it as image block if it has image.
            } else if (el.textContent?.trim()) {
                components.push({
                    id: uuidv4(),
                    type: 'text',
                    content: el.textContent || '',
                    styles: {},
                } as any);
            }
        } else if (el.tagName === 'TABLE') {
            // Basic table support - maybe convert to text or just skip for now as we don't have a generic table component yet (only data-view)
            // For now, let's extract text
            const text = el.textContent || '';
            if (text.trim()) {
                components.push({
                    id: uuidv4(),
                    type: 'text',
                    content: `[Tablo Verisi]: ${text}`,
                    styles: {},
                } as any);
            }
        } else if (el.tagName === 'IMG') {
            components.push({
                id: uuidv4(),
                type: 'image',
                src: (el as HTMLImageElement).src,
                styles: {},
                alt: (el as HTMLImageElement).alt || 'Imported Image'
            } as any);
        }
    });

    return components;
};
