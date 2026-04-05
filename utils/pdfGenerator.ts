import { jsPDF } from "jspdf";

export const generatePDF = (
  content: string,
  filename: string = "medical-report.pdf",
) => {
  const doc = new jsPDF();

  // Basic styling
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("MediAI Medical Report", 20, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);

  doc.line(20, 35, 190, 35);

  doc.setFontSize(12);

  // Split text to fit page width
  const splitText = doc.splitTextToSize(content, 170);

  let y = 45;
  for (let i = 0; i < splitText.length; i++) {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    doc.text(splitText[i], 20, y);
    y += 7;
  }

  doc.save(filename);
};
