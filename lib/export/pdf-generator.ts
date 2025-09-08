import { GeneratedStory } from "@/lib/types";

export class PDFGenerator {
  async generatePDF(story: GeneratedStory): Promise<Blob> {
    // This is a basic HTML to PDF conversion approach
    // For production, consider using libraries like jsPDF, puppeteer, or a dedicated service
    
    const htmlContent = this.generateHTML(story);
    
    // Create a blob with the HTML content
    // In a real implementation, you'd use a proper PDF generation library
    const pdfBlob = new Blob([htmlContent], { type: 'application/pdf' });
    
    return pdfBlob;
  }

  private generateHTML(story: GeneratedStory): string {
    const pages = story.pages.map((page, index) => `
      <div class="page" style="page-break-after: always; min-height: 100vh; padding: 20px;">
        <h2 style="text-align: center; margin-bottom: 20px; font-size: 24px; font-weight: bold;">
          ${story.title} - Page ${index + 1}
        </h2>
        <div class="panels" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
          ${page.panels.map(panel => `
            <div class="panel" style="border: 4px solid black; padding: 15px; background: white;">
              ${panel.imageUrl ? `<img src="${panel.imageUrl}" alt="${panel.description}" style="width: 100%; height: auto; margin-bottom: 10px;">` : ''}
              <div class="description" style="font-weight: bold; margin-bottom: 10px;">${panel.description}</div>
              ${panel.narration ? `<div class="narration" style="font-style: italic; margin-bottom: 8px;">${panel.narration}</div>` : ''}
              ${panel.dialogue && panel.dialogue.length > 0 ? `
                <div class="dialogue">
                  ${panel.dialogue.map(line => `<div style="background: #fffacd; border: 2px solid black; padding: 5px; margin: 2px 0; border-radius: 10px;">"${line}"</div>`).join('')}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${story.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
            .page { background: #FFD700; }
            @media print {
              .page { page-break-after: always; }
            }
          </style>
        </head>
        <body>
          ${pages}
        </body>
      </html>
    `;
  }

  async downloadPDF(story: GeneratedStory) {
    try {
      const pdfBlob = await this.generatePDF(story);
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${story.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('[PDF_GENERATOR] Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  }
}

export const pdfGenerator = new PDFGenerator();