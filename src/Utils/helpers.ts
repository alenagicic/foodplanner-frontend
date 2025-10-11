declare const html2canvas: (element: HTMLElement, options?: any) => Promise<any>;

interface JsPDFModule {
    jsPDF: new (orientation: string, unit: string, format: string) => any;
}

interface PdfOptions {
    htmlHeader: string;
    htmlString: string;
    filename?: string;
}

function generatePdfFilename(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `pdf-${crypto.randomUUID()}.pdf`;
    }
    return `pdf-${Date.now()}.pdf`;
}

export async function generateAndDownloadPdf(
    options: PdfOptions
): Promise<string> {

    const { htmlHeader, htmlString, filename = generatePdfFilename() } = options;
    
    const jsPDFModule: JsPDFModule = (window as any).jspdf;

    if (!jsPDFModule || !html2canvas) {
        throw new Error("PDF generation failed: Required libraries (jsPDF or html2canvas) are not loaded in the window scope.");
    }

    const { jsPDF } = jsPDFModule;
    let contentElement: HTMLDivElement | null = null;
    let finalFilename = filename;

    try {
        contentElement = document.createElement('div');
        contentElement.id = 'pdf-staging-' + generatePdfFilename().replace('.pdf', ''); 

        contentElement.style.width = '794px';
        contentElement.style.position = 'absolute';
        contentElement.style.left = '-9999px';
        contentElement.style.overflow = 'hidden';
        contentElement.style.backgroundColor = 'white';
        contentElement.style.padding = "2rem";
        
        document.body.appendChild(contentElement);

        contentElement.innerHTML = htmlHeader + htmlString;

        const canvas: HTMLCanvasElement = await html2canvas(contentElement, {
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: true,
        });

        const pdf: any = new jsPDF('p', 'mm', 'a4');

        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        pdf.save(finalFilename);

        return finalFilename;

    } catch (error) {
        console.error("Error during PDF generation and download:", error);
        throw error;
    } finally {
        if (contentElement && document.body.contains(contentElement)) {
            setTimeout(() => {
                document.body.removeChild(contentElement as HTMLDivElement);
            }, 100);
        }
    }
}