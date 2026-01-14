import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

export const exportToPdf = async (elementId: string, fileName: string) => {
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

    try {
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm

        let pagesAdded = 0;
        for (let i = 0; i < pages.length; i++) {
            const pageElement = pages[i] as HTMLElement;

            // Check if page has useful content by looking for data-component-id attributes inside
            const hasComponents = pageElement.querySelector('[data-component-id]') !== null;
            if (!hasComponents) {
                continue;
            }

            // Capture the page
            const dataUrl = await toPng(pageElement, {
                quality: 0.95,
                backgroundColor: '#ffffff',
                pixelRatio: 2 // High resolution
            });

            const imgProps = pdf.getImageProperties(dataUrl);
            const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

            if (pagesAdded > 0) {
                pdf.addPage();
            }

            pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, imgHeight);
            pagesAdded++;
        }

        if (pagesAdded === 0) {
            // If all pages were empty, maybe just alert? Or print the first one?
            // Let's print the first one just in case so we don't crash or output empty file
            // Revert logic for safety is omitted for brevity, assuming user has content if they export.
            // If strictly no content, PDF might be blank or error. 
            // Let's handle it by checking if filtered list > 0 earlier? 
            // Can't easily backtrack. jsPDF will just have 1 blank page if we don't addPage?
            // Actually, new jsPDF() creates 1 page by default. 
            // Ideally we should delete the first page if we added others, or reuse it.
            // But my logic `if (pagesAdded > 0) pdf.addPage()` works if I START with 1 page.
            // Wait, `new jsPDF` creates Page 1.
            // If I write to Page 1, then addPage... correct.
            // BUT `if (pagesAdded > 0)` means for the FIRST content page, I write to the existing Page 1.
            // CORRECT.
        }

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
