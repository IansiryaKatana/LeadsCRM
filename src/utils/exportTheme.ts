import type ExcelJS from "exceljs";
import type { jsPDF } from "jspdf";

/** Urban Hub export brand — matches CRM primary (#51A6FF). */
export const EXPORT_THEME = {
  primary: { r: 81, g: 166, b: 255, argb: "FF51A6FF" },
  primaryLight: { r: 240, g: 248, b: 255, argb: "FFF0F8FF" },
  tableHeader: { argb: "FFF4F6F8" },
  border: { argb: "FFE2E8F0" },
  borderStrong: { argb: "FF51A6FF" },
  textMuted: { argb: "FF64748B" },
  fontFamily: "Calibri, Arial, Helvetica, sans-serif",
  pdfFont: "helvetica" as const,
} as const;

export const EXPORT_BRAND_NAME = "Urban Hub Students Accommodations";

/** Reserved space at page bottom for footer lines (mm). */
export const PDF_FOOTER_RESERVED_MM = 18;

export function getPdfContentBottomY(pageHeight: number, margin = 15): number {
  return pageHeight - margin - PDF_FOOTER_RESERVED_MM;
}

export function createPdfPageBreaker(
  doc: jsPDF,
  margin: number,
  getY: () => number,
  setY: (y: number) => void
): (requiredHeight: number) => boolean {
  return (requiredHeight: number) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    const bottom = getPdfContentBottomY(pageHeight, margin);
    if (getY() + requiredHeight > bottom) {
      doc.addPage();
      setY(margin);
      return true;
    }
    return false;
  };
}

export function getExportTimestamp(): { date: string; time: string; fileDate: string } {
  const now = new Date();
  const date = now.toLocaleDateString("en-GB");
  const time = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const fileDate = date.replace(/\//g, "-");
  return { date, time, fileDate };
}

export function escapeCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function csvSectionTitle(title: string): string {
  return `\n${"═".repeat(63)}\n${title.toUpperCase()}\n${"═".repeat(63)}\n\n`;
}

export function downloadTextFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateASCIIChart(
  data: Array<{ name: string; value: number }>,
  maxWidth = 40
): string {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  return data
    .map((item) => {
      const barLength = Math.round((item.value / maxValue) * maxWidth);
      const bar = "█".repeat(barLength);
      return `${item.name.padEnd(20)} │${bar} ${item.value}`;
    })
    .join("\n");
}

export function generateASCIIPie(data: Array<{ name: string; value: number }>): string {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return "No data available";
  return data
    .map((item) => {
      const percentage = ((item.value / total) * 100).toFixed(1);
      const barLength = Math.round((item.value / total) * 20);
      const bar = "▓".repeat(barLength);
      return `${item.name.padEnd(20)} │${bar} ${item.value} (${percentage}%)`;
    })
    .join("\n");
}

export function createExcelStyles() {
  const headerStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, size: 16, color: { argb: "FFFFFFFF" }, name: "Calibri" },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: EXPORT_THEME.primary.argb } },
    alignment: { vertical: "middle", horizontal: "center", wrapText: true },
    border: {
      top: { style: "thin", color: { argb: EXPORT_THEME.borderStrong.argb } },
      bottom: { style: "thin", color: { argb: EXPORT_THEME.borderStrong.argb } },
      left: { style: "thin", color: { argb: EXPORT_THEME.borderStrong.argb } },
      right: { style: "thin", color: { argb: EXPORT_THEME.borderStrong.argb } },
    },
  };

  const metaStyle: Partial<ExcelJS.Style> = {
    font: { size: 9, italic: true, color: { argb: EXPORT_THEME.textMuted.argb }, name: "Calibri" },
    alignment: { vertical: "middle", horizontal: "left" },
  };

  const sectionHeaderStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, size: 12, color: { argb: "FFFFFFFF" }, name: "Calibri" },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: EXPORT_THEME.primary.argb } },
    alignment: { vertical: "middle", horizontal: "left", indent: 1 },
  };

  const tableHeaderStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, size: 10, color: { argb: "FF1E293B" }, name: "Calibri" },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: EXPORT_THEME.tableHeader.argb } },
    alignment: { vertical: "middle", horizontal: "center", wrapText: true },
    border: {
      top: { style: "thin", color: { argb: EXPORT_THEME.border.argb } },
      bottom: { style: "medium", color: { argb: EXPORT_THEME.borderStrong.argb } },
      left: { style: "thin", color: { argb: EXPORT_THEME.border.argb } },
      right: { style: "thin", color: { argb: EXPORT_THEME.border.argb } },
    },
  };

  const cellStyle: Partial<ExcelJS.Style> = {
    font: { size: 10, name: "Calibri" },
    alignment: { vertical: "middle", horizontal: "left", wrapText: false },
    border: {
      top: { style: "thin", color: { argb: EXPORT_THEME.border.argb } },
      bottom: { style: "thin", color: { argb: EXPORT_THEME.border.argb } },
      left: { style: "thin", color: { argb: EXPORT_THEME.border.argb } },
      right: { style: "thin", color: { argb: EXPORT_THEME.border.argb } },
    },
  };

  const numberCellStyle: Partial<ExcelJS.Style> = {
    ...cellStyle,
    alignment: { vertical: "middle", horizontal: "right" },
  };

  const monoCellStyle: Partial<ExcelJS.Style> = {
    ...cellStyle,
    font: { size: 9, name: "Consolas" },
  };

  return {
    headerStyle,
    metaStyle,
    sectionHeaderStyle,
    tableHeaderStyle,
    cellStyle,
    numberCellStyle,
    monoCellStyle,
  };
}

export function applyExcelRowStyle(
  row: ExcelJS.Row,
  cellCount: number,
  styles: ReturnType<typeof createExcelStyles>,
  options?: { numericColumns?: number[]; monoColumns?: number[] }
): void {
  row.height = row.height ?? 20;
  for (let i = 1; i <= cellCount; i++) {
    if (options?.numericColumns?.includes(i)) {
      row.getCell(i).style = styles.numberCellStyle;
    } else if (options?.monoColumns?.includes(i)) {
      row.getCell(i).style = styles.monoCellStyle;
    } else {
      row.getCell(i).style = styles.cellStyle;
    }
  }
}

export function addPdfReportHeader(
  doc: jsPDF,
  options: {
    title: string;
    dateRange?: string;
    academicYear?: string;
    margin?: number;
  }
): number {
  const margin = options.margin ?? 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const { date, time } = getExportTimestamp();

  const headerHeight = options.academicYear && options.dateRange ? 54 : 50;

  doc.setFillColor(EXPORT_THEME.primary.r, EXPORT_THEME.primary.g, EXPORT_THEME.primary.b);
  doc.rect(0, 0, pageWidth, headerHeight, "F");
  doc.setFillColor(120, 180, 255);
  doc.rect(0, headerHeight - 5, pageWidth, 5, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont(EXPORT_THEME.pdfFont, "bold");
  doc.setFontSize(20);
  doc.text(EXPORT_BRAND_NAME, margin, 20);

  doc.setFont(EXPORT_THEME.pdfFont, "normal");
  doc.setFontSize(9);
  doc.text(`Generated: ${date} at ${time}`, margin, 28);
  let titleY = 40;
  if (options.academicYear) {
    doc.text(`Academic Year: ${options.academicYear}`, margin, 34);
    titleY = 46;
  } else if (options.dateRange) {
    doc.text(options.dateRange, margin, 34);
    titleY = 42;
  }
  if (options.academicYear && options.dateRange) {
    doc.text(options.dateRange, margin, 40);
    titleY = 46;
  }

  doc.setFontSize(12);
  doc.setFont(EXPORT_THEME.pdfFont, "bold");
  doc.text(options.title, margin, titleY);

  return headerHeight + 8;
}

export function drawPdfDottedRowSeparator(
  doc: jsPDF,
  x1: number,
  y: number,
  x2: number
): void {
  doc.setDrawColor(186, 198, 212);
  doc.setLineWidth(0.2);
  const dashed = doc as jsPDF & { setLineDashPattern?: (pattern: number[], offset: number) => void };
  if (typeof dashed.setLineDashPattern === "function") {
    dashed.setLineDashPattern([0.6, 1.4], 0);
  }
  doc.line(x1, y, x2, y);
  if (typeof dashed.setLineDashPattern === "function") {
    dashed.setLineDashPattern([], 0);
  }
}

export function drawPdfSectionHeader(
  doc: jsPDF,
  title: string,
  yPos: number,
  margin: number,
  pageWidth: number
): number {
  const barHeight = 10;
  doc.setFillColor(EXPORT_THEME.primary.r, EXPORT_THEME.primary.g, EXPORT_THEME.primary.b);
  doc.rect(margin - 2, yPos - 7, pageWidth - 2 * margin + 4, barHeight, "F");
  doc.setFont(EXPORT_THEME.pdfFont, "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(title, margin, yPos);
  doc.setTextColor(0, 0, 0);
  return yPos + 12;
}

export function addPdfFooters(doc: jsPDF, footerLabel?: string): void {
  const totalPages = doc.getNumberOfPages();
  const label = footerLabel ?? `${EXPORT_BRAND_NAME} — Confidential`;

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const footerTop = pageHeight - PDF_FOOTER_RESERVED_MM + 4;

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(15, footerTop, pageWidth - 15, footerTop);

    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.setFont(EXPORT_THEME.pdfFont, "normal");
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 11,
      { align: "center" }
    );
    doc.text(label, pageWidth / 2, pageHeight - 6, { align: "center" });
  }
}

/** Fit text to a PDF table cell; truncates with ellipsis when needed. */
export function drawPdfTableCellText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  options?: { mono?: boolean; fontSize?: number }
): void {
  const fontSize = options?.fontSize ?? 7;
  doc.setFontSize(fontSize);
  if (options?.mono) {
    doc.setFont("courier", "normal");
  } else {
    doc.setFont(EXPORT_THEME.pdfFont, "normal");
  }
  const value = String(text || "—");
  const lines = doc.splitTextToSize(value, Math.max(maxWidth - 2, 8));
  const line = Array.isArray(lines) ? lines[0] : lines;
  const display =
    Array.isArray(lines) && lines.length > 1 && typeof line === "string" && line.length >= 3
      ? `${line.slice(0, Math.max(0, line.length - 1))}…`
      : line;
  doc.text(typeof display === "string" ? display : value, x, y);
}

export function getPdfColumnWidths(
  columns: Array<{ width: number }>,
  tableWidth: number
): number[] {
  const total = columns.reduce((sum, col) => sum + col.width, 0);
  return columns.map((col) => (col.width / total) * tableWidth);
}

export function writeCsvReportHeader(
  lines: string[],
  reportTitle: string,
  meta: { dateRange?: string; academicYear?: string; sourceName?: string }
): void {
  const { date, time } = getExportTimestamp();
  lines.push(`${EXPORT_BRAND_NAME} — ${reportTitle}`);
  lines.push(`Generated: ${date} at ${time}`);
  if (meta.sourceName) lines.push(`Source: ${meta.sourceName}`);
  if (meta.academicYear) lines.push(`Academic Year: ${meta.academicYear}`);
  if (meta.dateRange) lines.push(`Date Range: ${meta.dateRange}`);
  lines.push("");
}
