import { GeneratedStory } from "@/lib/types";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export class PDFGenerator {
  async generatePDF(story: GeneratedStory): Promise<Blob> {
    console.log('[PDF_GENERATOR] Starting PDF generation for:', story.title);
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      floatPrecision: 16
    });

    try {
      // Add cover page if available
      if (story.coverImage) {
        console.log('[PDF_GENERATOR] Adding cover image');
        try {
          await this.addImageToPDF(pdf, story.coverImage, story.title + ' - Cover');
        } catch (error) {
          console.warn('[PDF_GENERATOR] Failed to add cover image:', error);
          this.addTitlePage(pdf, story);
        }
      } else {
        this.addTitlePage(pdf, story);
      }

      // Generate pages - each panel becomes a full page
      let pageCount = 0;
      for (let pageIndex = 0; pageIndex < story.pages.length; pageIndex++) {
        const page = story.pages[pageIndex];
        console.log(`[PDF_GENERATOR] Processing page ${pageIndex + 1}/${story.pages.length}`);

        for (let panelIndex = 0; panelIndex < page.panels.length; panelIndex++) {
          const panel = page.panels[panelIndex];
          pageCount++;
          
          console.log(`[PDF_GENERATOR] Adding panel ${panelIndex + 1} from page ${pageIndex + 1} as PDF page ${pageCount}`);
          
          // Add new page
          pdf.addPage();
          
          if (panel.imageUrl) {
            try {
              await this.addImageToPDF(pdf, panel.imageUrl, `Page ${pageCount} - ${panel.description}`);
            } catch (imageError) {
              console.warn(`[PDF_GENERATOR] Failed to add panel image, using text fallback`);
              this.addTextOnlyPanel(pdf, panel, pageCount);
            }
          } else {
            // No image available, add text-only content
            this.addTextOnlyPanel(pdf, panel, pageCount);
          }
        }
      }
      
      const pdfBlob = pdf.output('blob');
      console.log(`[PDF_GENERATOR] PDF generation completed successfully with ${pageCount + 1} pages`);
      return pdfBlob;

    } catch (error) {
      console.error('[PDF_GENERATOR] Error during PDF generation:', error);
      throw error;
    }
  }

  private addTitlePage(pdf: jsPDF, story: GeneratedStory): void {
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    const titleLines = pdf.splitTextToSize(story.title, 170);
    let yPosition = 60;
    titleLines.forEach((line: string) => {
      pdf.text(line, 105, yPosition, { align: 'center' });
      yPosition += 12;
    });

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Created on ${story.createdAt.toLocaleDateString()}`, 105, yPosition + 20, { align: 'center' });
    
    const pageCount = story.pages.reduce((acc, page) => acc + page.panels.length, 0);
    pdf.text(`${pageCount} Pages • Ages ${story.config.targetAge || '6-8'}`, 105, yPosition + 35, { align: 'center' });
    pdf.text(`${story.config.theme} • ${story.config.style}`, 105, yPosition + 50, { align: 'center' });
  }

  private async addImageToPDF(pdf: jsPDF, imageUrl: string, altText: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          // Calculate dimensions to fit the page while maintaining aspect ratio
          const pageWidth = 210; // A4 width in mm
          const pageHeight = 297; // A4 height in mm
          const margin = 10;
          const maxWidth = pageWidth - (margin * 2);
          const maxHeight = pageHeight - (margin * 2);
          
          const imgAspectRatio = img.width / img.height;
          const pageAspectRatio = maxWidth / maxHeight;
          
          let finalWidth, finalHeight;
          
          if (imgAspectRatio > pageAspectRatio) {
            // Image is wider, fit to width
            finalWidth = maxWidth;
            finalHeight = maxWidth / imgAspectRatio;
          } else {
            // Image is taller, fit to height
            finalHeight = maxHeight;
            finalWidth = maxHeight * imgAspectRatio;
          }
          
          // Center the image
          const xPos = (pageWidth - finalWidth) / 2;
          const yPos = (pageHeight - finalHeight) / 2;
          
          pdf.addImage(img, 'JPEG', xPos, yPos, finalWidth, finalHeight);
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${altText}`));
      };
      
      img.src = imageUrl;
    });
  }

  private addTextOnlyPanel(pdf: jsPDF, panel: any, pageNumber: number): void {
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Page ${pageNumber}`, 105, 30, { align: 'center' });
    
    let yPosition = 60;
    
    // Panel description
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Scene:', 20, yPosition);
    
    yPosition += 10;
    pdf.setFont('helvetica', 'normal');
    const descLines = pdf.splitTextToSize(panel.description, 170);
    descLines.forEach((line: string) => {
      pdf.text(line, 20, yPosition);
      yPosition += 7;
    });
    
    // Narration
    if (panel.narration) {
      yPosition += 10;
      pdf.setFont('helvetica', 'italic');
      pdf.text('Narration:', 20, yPosition);
      yPosition += 8;
      const narrLines = pdf.splitTextToSize(panel.narration, 170);
      narrLines.forEach((line: string) => {
        pdf.text(line, 20, yPosition);
        yPosition += 7;
      });
    }
    
    // Dialogue
    if (panel.dialogue && panel.dialogue.length > 0) {
      yPosition += 10;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Dialogue:', 20, yPosition);
      yPosition += 8;
      pdf.setFont('helvetica', 'normal');
      panel.dialogue.forEach((line: string) => {
        const dialogueLines = pdf.splitTextToSize(`"${line}"`, 170);
        dialogueLines.forEach((dialogueLine: string) => {
          pdf.text(dialogueLine, 25, yPosition);
          yPosition += 7;
        });
        yPosition += 3;
      });
    }
  }


  async downloadPDF(story: GeneratedStory) {
    try {
      console.log('[PDF_GENERATOR] Starting PDF download process');
      const pdfBlob = await this.generatePDF(story);
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `${story.title.replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, '_').toLowerCase()}_storybook.pdf`;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      URL.revokeObjectURL(url);
      
      console.log('[PDF_GENERATOR] PDF download completed:', filename);
    } catch (error) {
      console.error('[PDF_GENERATOR] Error generating PDF:', error);
      throw new Error('Failed to generate PDF. Please try again.');
    }
  }
}

export const pdfGenerator = new PDFGenerator();