import type { FollowUpAnalytics } from "@/hooks/useFollowUpAnalytics";
import {
  addPdfFooters,
  addPdfReportHeader,
  csvSectionTitle,
  downloadTextFile,
  drawPdfDottedRowSeparator,
  drawPdfSectionHeader,
  createPdfPageBreaker,
  escapeCsvValue,
  generateASCIIChart,
  getExportTimestamp,
  writeCsvReportHeader,
} from "@/utils/exportTheme";

interface FollowUpExportData {
  analytics: FollowUpAnalytics;
  academicYear?: string;
  dateRange?: string;
}

export function exportFollowUpAnalyticsToCSV(data: FollowUpExportData) {
  const { analytics, academicYear, dateRange } = data;
  const { fileDate } = getExportTimestamp();
  const lines: string[] = [];
  writeCsvReportHeader(lines, "Follow-Up Analytics Report", { academicYear, dateRange });
  let csv = lines.join("\n");
  csv += csvSectionTitle("Follow-Up Metrics");
  csv += `\n`;
  csv += `Metric,Value\n`;
  csv += `Total Leads,${analytics.totalLeads}\n`;
  csv += `Leads with 3+ Follow-ups,${analytics.leadsWith3PlusFollowups}\n`;
  csv += `Compliance Rate,${analytics.complianceRate.toFixed(2)}%\n`;
  csv += `Average Follow-ups to Conversion,${analytics.averageFollowupsToConversion.toFixed(2)}\n`;
  csv += `Average Time to First Follow-up,${Math.round(analytics.averageTimeToFirstFollowup)} hours\n`;
  csv += `Average Follow-up Interval,${Math.round(analytics.averageFollowupInterval)} hours\n`;
  csv += `Follow-up Response Rate,${analytics.followupResponseRate.toFixed(2)}%\n`;
  csv += `Overdue Follow-ups,${analytics.overdueFollowups}\n`;
  csv += `Upcoming Follow-ups,${analytics.upcomingFollowups}\n`;
  csv += csvSectionTitle("Follow-Up Type Effectiveness");
  csv += `\n`;
  csv += `Type,Count,Conversion Rate\n`;
  analytics.followupTypeEffectiveness.forEach(item => {
    csv += `${item.type},${item.count},${item.conversionRate.toFixed(2)}%\n`;
  });
  csv += `\n`;
  csv += `Follow-up Type Effectiveness Chart:\n`;
  csv += generateASCIIChart(
    analytics.followupTypeEffectiveness.map(item => ({
      name: item.type,
      value: item.conversionRate,
    })),
    30
  );
  csv += `\n`;
  csv += csvSectionTitle("End of Report");
  downloadTextFile(csv, `Urban_Hub_FollowUp_Analytics_${fileDate}.csv`, "text/csv;charset=utf-8;");
}

export async function exportFollowUpAnalyticsToExcel(data: FollowUpExportData) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Urban Hub Students Accommodations";
  workbook.created = new Date();
  
  const { analytics, academicYear, dateRange } = data;
  const date = new Date().toLocaleDateString("en-GB");
  const time = new Date().toLocaleTimeString("en-GB");
  
  // Define styles
  const headerStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, size: 16, color: { argb: "FFFFFFFF" } },
    fill: {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF51A6FF" },
    },
    alignment: { vertical: "middle", horizontal: "center" },
  };
  
  const sectionHeaderStyle = {
    font: { bold: true, size: 14, color: { argb: "FF51A6FF" } },
    fill: {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF0F8FF" },
    },
    alignment: { vertical: "middle", horizontal: "left" },
  };
  
  const tableHeaderStyle = {
    font: { bold: true, size: 11 },
    fill: {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF0F0F0" },
    },
    alignment: { vertical: "middle", horizontal: "center" },
  };
  
  const cellStyle = {
    font: { size: 10 },
    alignment: { vertical: "middle", horizontal: "left" },
  };
  
  const numberCellStyle = {
    ...cellStyle,
    alignment: { vertical: "middle", horizontal: "right" },
  };
  
  // Create worksheet
  const worksheet = workbook.addWorksheet("Follow-Up Analytics");
  worksheet.columns = [{ width: 30 }, { width: 20 }];
  
  let rowIndex = 1;
  
  // Header
  const headerRow = worksheet.addRow(["Urban Hub Students Accommodations - Follow-Up Analytics Report"]);
  headerRow.height = 30;
  worksheet.mergeCells(`A${rowIndex}:B${rowIndex}`);
  headerRow.getCell(1).style = headerStyle;
  rowIndex++;
  
  // Metadata
  worksheet.addRow([`Generated: ${date} at ${time}`]);
  worksheet.getRow(rowIndex).getCell(1).style = { ...cellStyle, font: { size: 9, italic: true } };
  worksheet.mergeCells(`A${rowIndex}:B${rowIndex}`);
  rowIndex++;
  
  if (academicYear) {
    worksheet.addRow([`Academic Year: ${academicYear}`]);
    worksheet.getRow(rowIndex).getCell(1).style = { ...cellStyle, font: { size: 9, italic: true } };
    worksheet.mergeCells(`A${rowIndex}:B${rowIndex}`);
    rowIndex++;
  }
  
  if (dateRange) {
    worksheet.addRow([`Date Range: ${dateRange}`]);
    worksheet.getRow(rowIndex).getCell(1).style = { ...cellStyle, font: { size: 9, italic: true } };
    worksheet.mergeCells(`A${rowIndex}:B${rowIndex}`);
    rowIndex++;
  }
  
  rowIndex += 2;
  
  // Metrics Section
  const metricsHeaderRow = worksheet.addRow(["Follow-Up Metrics"]);
  metricsHeaderRow.height = 25;
  worksheet.mergeCells(`A${rowIndex}:B${rowIndex}`);
  metricsHeaderRow.getCell(1).style = sectionHeaderStyle;
  rowIndex++;
  
  const metricsTableHeader = worksheet.addRow(["Metric", "Value"]);
  metricsTableHeader.height = 20;
  metricsTableHeader.getCell(1).style = tableHeaderStyle;
  metricsTableHeader.getCell(2).style = tableHeaderStyle;
  rowIndex++;
  
  const metricsData = [
    ["Total Leads", analytics.totalLeads.toLocaleString()],
    ["Leads with 3+ Follow-ups", analytics.leadsWith3PlusFollowups.toLocaleString()],
    ["Compliance Rate", `${analytics.complianceRate.toFixed(2)}%`],
    ["Average Follow-ups to Conversion", analytics.averageFollowupsToConversion.toFixed(2)],
    ["Average Time to First Follow-up", `${Math.round(analytics.averageTimeToFirstFollowup)} hours`],
    ["Average Follow-up Interval", `${Math.round(analytics.averageFollowupInterval)} hours`],
    ["Follow-up Response Rate", `${analytics.followupResponseRate.toFixed(2)}%`],
    ["Overdue Follow-ups", analytics.overdueFollowups.toLocaleString()],
    ["Upcoming Follow-ups", analytics.upcomingFollowups.toLocaleString()],
  ];
  
  metricsData.forEach(([metric, value]) => {
    const row = worksheet.addRow([metric, value]);
    row.height = 18;
    row.getCell(1).style = cellStyle;
    row.getCell(2).style = numberCellStyle;
    rowIndex++;
  });
  
  rowIndex += 2;
  
  // Type Effectiveness Section
  const typeHeaderRow = worksheet.addRow(["Follow-up Type Effectiveness"]);
  typeHeaderRow.height = 25;
  worksheet.mergeCells(`A${rowIndex}:C${rowIndex}`);
  typeHeaderRow.getCell(1).style = sectionHeaderStyle;
  rowIndex++;
  
  const typeTableHeader = worksheet.addRow(["Type", "Count", "Conversion Rate"]);
  typeTableHeader.height = 20;
  typeTableHeader.getCell(1).style = tableHeaderStyle;
  typeTableHeader.getCell(2).style = tableHeaderStyle;
  typeTableHeader.getCell(3).style = tableHeaderStyle;
  rowIndex++;
  
  analytics.followupTypeEffectiveness.forEach(item => {
    const row = worksheet.addRow([
      item.type,
      item.count,
      `${item.conversionRate.toFixed(2)}%`,
    ]);
    row.height = 18;
    row.getCell(1).style = cellStyle;
    row.getCell(2).style = numberCellStyle;
    row.getCell(3).style = numberCellStyle;
    rowIndex++;
  });
  
  // Generate Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `Urban_Hub_FollowUp_Analytics_${date.replace(/\//g, "-")}.xlsx`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportFollowUpAnalyticsToPDF(data: FollowUpExportData) {
  const { jsPDF } = await import("jspdf");
  
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = margin;
  
  const { analytics, academicYear, dateRange } = data;
  const { fileDate } = getExportTimestamp();

  const checkPageBreak = createPdfPageBreaker(
    doc,
    margin,
    () => yPos,
    (y) => {
      yPos = y;
    }
  );

  yPos = addPdfReportHeader(doc, {
    title: "Follow-Up Analytics Report",
    academicYear,
    dateRange,
    margin,
  });

  yPos = drawPdfSectionHeader(doc, "Follow-Up Metrics", yPos, margin, pageWidth);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  
  const metricsData = [
    ["Total Leads", analytics.totalLeads.toLocaleString()],
    ["Leads with 3+ Follow-ups", analytics.leadsWith3PlusFollowups.toLocaleString()],
    ["Compliance Rate", `${analytics.complianceRate.toFixed(2)}%`],
    ["Avg Follow-ups to Conversion", analytics.averageFollowupsToConversion.toFixed(2)],
    ["Avg Time to First Follow-up", `${Math.round(analytics.averageTimeToFirstFollowup)} hours`],
    ["Avg Follow-up Interval", `${Math.round(analytics.averageFollowupInterval)} hours`],
    ["Response Rate", `${analytics.followupResponseRate.toFixed(2)}%`],
    ["Overdue Follow-ups", analytics.overdueFollowups.toLocaleString()],
    ["Upcoming Follow-ups", analytics.upcomingFollowups.toLocaleString()],
  ];
  
  const cellHeight = 7;
  const colWidth = (pageWidth - 2 * margin) / 2;
  
  metricsData.forEach((row, index) => {
    checkPageBreak(cellHeight + 2);
    doc.text(row[0], margin + 2, yPos);
    doc.text(row[1], margin + colWidth + 2, yPos);
    if (index < metricsData.length - 1) {
      drawPdfDottedRowSeparator(doc, margin, yPos + 2, pageWidth - margin);
    }
    yPos += cellHeight;
  });
  
  yPos += 10;
  checkPageBreak(20);
  
  yPos = drawPdfSectionHeader(doc, "Follow-up Type Effectiveness", yPos, margin, pageWidth);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  
  const typeHeaders = ["Type", "Count", "Conversion Rate"];
  const typeColWidths = [60, 30, 50];
  
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, cellHeight, "F");
  doc.setFont("helvetica", "bold");
  let xPos = margin + 2;
  typeHeaders.forEach((header, i) => {
    doc.text(header, xPos, yPos);
    xPos += typeColWidths[i];
  });
  
  yPos += cellHeight;
  doc.setFont("helvetica", "normal");
  
  analytics.followupTypeEffectiveness.forEach((item) => {
    checkPageBreak(cellHeight + 2);
    xPos = margin + 2;
    doc.text(item.type, xPos, yPos);
    xPos += typeColWidths[0];
    doc.text(item.count.toString(), xPos, yPos);
    xPos += typeColWidths[1];
    doc.text(`${item.conversionRate.toFixed(2)}%`, xPos, yPos);
    drawPdfDottedRowSeparator(doc, margin, yPos + 2, pageWidth - margin);
    yPos += cellHeight;
  });

  addPdfFooters(doc);
  doc.save(`Urban_Hub_FollowUp_Analytics_${fileDate}.pdf`);
}

