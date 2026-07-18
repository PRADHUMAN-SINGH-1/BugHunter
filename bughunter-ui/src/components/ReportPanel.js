import jsPDF from "jspdf";
import { Download, FileText, FileType2 } from "lucide-react";

const download = (name, type, content) => {
  const href = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = href;
  link.download = name;
  link.click();
  URL.revokeObjectURL(href);
};

export function ReportPanel({ report }) {
  if (!report?.markdown) return null;
  const markdown = report.markdown;
  const exportPdf = () => {
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const lines = pdf.splitTextToSize(markdown, 170);
    let y = 18;
    lines.forEach((line) => {
      if (y > 280) { pdf.addPage(); y = 18; }
      pdf.text(line, 20, y);
      y += 5;
    });
    pdf.save("bughunter-ai-security-report.pdf");
  };
  return <section className="report-panel panel"><div><p className="eyebrow">SECURITY REPORT</p><h2>Shareable, evidence-backed report</h2><p>Export the current assessment for your engineering or security team.</p></div><div className="report-actions"><button onClick={() => download("bughunter-ai-report.md", "text/markdown", markdown)}><FileText size={16} /> Markdown</button><button className="primary-button" onClick={exportPdf}><FileType2 size={16} /> PDF <Download size={15} /></button></div></section>;
}
