import { toJpeg, toPng } from 'html-to-image';
import jsPDF from 'jspdf';

export const exportToPdf = async (
    elementId: string,
    fileName: string,
    onProgress?: (completed: number, total: number) => void,
) => {
    // Try to find individual pages first
    const pages = document.querySelectorAll('.page-container');

    if (pages.length === 0) {
        // Fallback to single element logic if no pages found
        const element = document.getElementById(elementId);
        if (!element) {
            throw new Error(`Element with id ${elementId} not found`);
        }
        // ... (We could keep the old logic for fallback, but for now let's reuse logic by wrapping it)
        // Just treat this element as one page
        return exportSingleElement(element as HTMLElement, fileName);
    }

    if (pages.length > 500) {
        throw new Error('PDF export supports up to 500 pages at a time.');
    }

    try {
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm

        let pagesAdded = 0;
        const pixelRatio = pages.length > 100 ? 1 : pages.length > 30 ? 1.25 : 1.5;
        for (let i = 0; i < pages.length; i++) {
            const pageElement = pages[i] as HTMLElement;
            try {
                const dataUrl = await toJpeg(pageElement, {
                    backgroundColor: '#ffffff',
                    quality: 0.82,
                    pixelRatio,
                    skipAutoScale: true,
                });
                if (pagesAdded > 0) pdf.addPage();
                pdf.addImage(dataUrl, 'JPEG', 0, 0, imgWidth, pageHeight, undefined, 'FAST');
                pagesAdded++;
            } catch (error) {
                throw new Error(`Could not render report page ${i + 1}: ${error instanceof Error ? error.message : 'unknown rendering error'}`);
            }
            onProgress?.(i + 1, pages.length);
            await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        }

        if (pagesAdded === 0) throw new Error('There is no page content to export.');

        pdf.save(fileName);
        return true;
    } catch (error) {
        console.error('Export failed:', error);
        throw error;
    }
};

const exportSingleElement = async (element: HTMLElement, fileName: string) => {
    try {
        const dataUrl = await toPng(element, {
            quality: 0.95,
            backgroundColor: '#ffffff',
            pixelRatio: 2
        });

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const imgWidth = 210;
        const pageHeight = 297;

        const imgProps = pdf.getImageProperties(dataUrl);
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        pdf.save(fileName);
        return true;
    } catch (error) {
        console.error('Export failed:', error);
        throw error;
    }
}
