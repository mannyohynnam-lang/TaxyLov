import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ReportResult } from "./taxy-calc";
import { fmtEUR } from "./taxy-calc";
import { buildForm11Rows } from "./taxy-rows";

export function exportForm11Pdf(r: ReportResult) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const rows = buildForm11Rows(r);

  doc.setFontSize(16);
  doc.text("Form 11 – Extract from Accounts", 40, 50);
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(`Period: ${r.PERIOD_START} to ${r.PERIOD_END}`, 40, 68);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IE")}`, 40, 82);

  const grouped: Record<string, typeof rows> = {};
  rows.forEach((row) => {
    grouped[row.section] = grouped[row.section] ?? [];
    grouped[row.section].push(row);
  });

  let y = 110;
  for (const [section, items] of Object.entries(grouped)) {
    autoTable(doc, {
      startY: y,
      head: [[section, "Amount (EUR)"]],
      body: items.map((i) => [i.label, fmtEUR(i.value)]),
      headStyles: { fillColor: [37, 99, 168], textColor: 255, fontStyle: "bold" },
      columnStyles: { 1: { halign: "right", cellWidth: 110 } },
      styles: { fontSize: 9, cellPadding: 5 },
      margin: { left: 40, right: 40 },
    });
    // @ts-expect-error lastAutoTable injected by autotable
    y = doc.lastAutoTable.finalY + 14;
    if (y > 760) {
      doc.addPage();
      y = 50;
    }
  }

  doc.save(`form11-extract-${r.PERIOD_END}.pdf`);
}
