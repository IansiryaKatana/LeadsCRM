import type { DashboardStats } from "@/hooks/useDashboardStats";
import {
  EXPORT_BRAND_NAME,
  createExcelStyles,
  applyExcelRowStyle,
  csvSectionTitle,
  downloadBlob,
  downloadTextFile,
  escapeCsvValue,
  generateASCIIChart,
  generateASCIIPie,
  getExportTimestamp,
  addPdfReportHeader,
  drawPdfSectionHeader,
  drawPdfDottedRowSeparator,
  drawPdfTableCellText,
  getPdfColumnWidths,
  createPdfPageBreaker,
  addPdfFooters,
  writeCsvReportHeader,
} from "@/utils/exportTheme";
import {
  type LeadExportProfile,
  type RawLeadForExport,
  getLeadExportColumns,
  formatLeadExportRow,
  formatLeadExportDisplayValue,
} from "@/utils/exportLeadColumns";

export interface ExportData {
  stats: DashboardStats;
  monthlyData: Array<{ month: string; leads: number; converted: number }>;
  roomDistribution: Array<{ name: string; value: number }>;
  statusDistribution: Array<{ name: string; value: number; fill: string }>;
  dateRange: string;
  currencySymbol?: string;
  sources?: Array<{ slug: string; name: string; icon: string }>;
  leads?: RawLeadForExport[];
  leadProfile?: LeadExportProfile;
  reportTitle?: string;
}

export function exportToCSV(data: ExportData) {
  const {
    stats,
    monthlyData,
    roomDistribution,
    statusDistribution,
    dateRange,
    currencySymbol = "£",
    leads,
    leadProfile = "default",
    reportTitle = "Performance Analytics Report",
  } = data;
  const { fileDate } = getExportTimestamp();
  const lines: string[] = [];
  writeCsvReportHeader(lines, reportTitle, { dateRange });

  let csv = lines.join("\n");
  csv += csvSectionTitle("Summary Statistics");
  csv += `\n`;
  csv += `Metric,Value\n`;
  csv += `Total Leads,${stats.totalLeads}\n`;
  csv += `Conversion Rate,${stats.conversionRate.toFixed(2)}%\n`;
  csv += `New Leads,${stats.newLeads}\n`;
  csv += `High Interest,${stats.highInterest}\n`;
  csv += `Converted,${stats.converted}\n`;
  csv += `Closed,${stats.closed}\n`;
  csv += `\n`;
  csv += `═══════════════════════════════════════════════════════════════\n`;
  csv += `MONTHLY PERFORMANCE\n`;
  csv += `═══════════════════════════════════════════════════════════════\n`;
  csv += `\n`;
  csv += `Month,Total Leads,Converted\n`;
  monthlyData.forEach(month => {
    csv += `${month.month},${month.leads},${month.converted}\n`;
  });
  csv += `\n`;
  csv += `Monthly Leads Chart (Visual Representation):\n`;
  csv += generateASCIIChart(
    monthlyData.map(m => ({ name: m.month, value: m.leads })),
    30
  );
  csv += `\n`;
  csv += `\n`;
  csv += `Monthly Converted Chart (Visual Representation):\n`;
  csv += generateASCIIChart(
    monthlyData.map(m => ({ name: m.month, value: m.converted })),
    30
  );
  csv += `\n`;
  csv += `\n`;
  csv += `═══════════════════════════════════════════════════════════════\n`;
  csv += `ROOM DISTRIBUTION\n`;
  csv += `═══════════════════════════════════════════════════════════════\n`;
  csv += `\n`;
  csv += `Room Type,Count,Percentage\n`;
  const roomTotal = roomDistribution.reduce((sum, r) => sum + r.value, 0);
  roomDistribution.forEach(room => {
    const percentage = roomTotal > 0 ? ((room.value / roomTotal) * 100).toFixed(1) : "0.0";
    csv += `${room.name},${room.value},${percentage}%\n`;
  });
  csv += `\n`;
  csv += `Room Distribution Chart (Visual Representation):\n`;
  csv += generateASCIIPie(roomDistribution);
  csv += `\n`;
  csv += `\n`;
  csv += `═══════════════════════════════════════════════════════════════\n`;
  csv += `LEAD STATUS BREAKDOWN\n`;
  csv += `═══════════════════════════════════════════════════════════════\n`;
  csv += `\n`;
  csv += `Status,Count,Percentage\n`;
  const statusTotal = statusDistribution.reduce((sum, s) => sum + s.value, 0);
  statusDistribution.forEach(status => {
    const percentage = statusTotal > 0 ? ((status.value / statusTotal) * 100).toFixed(1) : "0.0";
    csv += `${status.name},${status.value},${percentage}%\n`;
  });
  csv += `\n`;
  csv += `Status Distribution Chart (Visual Representation):\n`;
  csv += generateASCIIChart(statusDistribution, 30);
  csv += `\n`;
  if (leads && leads.length > 0) {
    const columns = getLeadExportColumns(leadProfile, currencySymbol);
    csv += csvSectionTitle(`Lead Records (${leads.length} total)`);
    csv += columns.map((c) => escapeCsvValue(c.header)).join(",") + "\n";
    leads.forEach((lead) => {
      csv +=
        columns
          .map((col) => {
            const raw = formatLeadExportRow(lead, col, data.sources, currencySymbol);
            const display = formatLeadExportDisplayValue(raw, col, currencySymbol);
            return escapeCsvValue(display);
          })
          .join(",") + "\n";
    });
    csv += "\n";
  }

  csv += csvSectionTitle("End of Report");

  downloadTextFile(csv, `Urban_Hub_Report_${fileDate}.csv`, "text/csv;charset=utf-8;");
}

export async function exportToExcel(data: ExportData) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = EXPORT_BRAND_NAME;
  workbook.created = new Date();

  const {
    stats,
    monthlyData,
    roomDistribution,
    statusDistribution,
    dateRange,
    currencySymbol = "£",
    leadProfile = "default",
    reportTitle = "Performance Analytics Report",
  } = data;
  const { date, time, fileDate } = getExportTimestamp();
  const styles = createExcelStyles();
  const mergeWidth = 8;

  const worksheet = workbook.addWorksheet("Performance Report");
  
  // Set column widths
  worksheet.columns = [
    { width: 25 },
    { width: 20 },
    { width: 20 },
    { width: 20 },
    { width: 20 },
  ];
  
  let rowIndex = 1;
  
  const headerRow = worksheet.addRow([`${EXPORT_BRAND_NAME} — ${reportTitle}`]);
  headerRow.height = 32;
  worksheet.mergeCells(rowIndex, 1, rowIndex, mergeWidth);
  headerRow.getCell(1).style = styles.headerStyle;
  rowIndex++;

  worksheet.addRow([`Generated: ${date} at ${time}`]);
  worksheet.mergeCells(rowIndex, 1, rowIndex, mergeWidth);
  worksheet.getRow(rowIndex).getCell(1).style = styles.metaStyle;
  rowIndex++;

  worksheet.addRow([`Date Range: ${dateRange}`]);
  worksheet.mergeCells(rowIndex, 1, rowIndex, mergeWidth);
  worksheet.getRow(rowIndex).getCell(1).style = styles.metaStyle;
  rowIndex += 2;
  
  // Summary Statistics Section
  const summaryHeaderRow = worksheet.addRow(["Summary Statistics"]);
  summaryHeaderRow.height = 25;
  worksheet.mergeCells(`A${rowIndex}:B${rowIndex}`);
  summaryHeaderRow.getCell(1).style = styles.sectionHeaderStyle;
  rowIndex++;
  
  // Summary table header
  const summaryTableHeader = worksheet.addRow(["Metric", "Value"]);
  summaryTableHeader.height = 20;
  summaryTableHeader.getCell(1).style = styles.tableHeaderStyle;
  summaryTableHeader.getCell(2).style = styles.tableHeaderStyle;
  rowIndex++;
  
  // Summary data
  const summaryData = [
    ["Total Leads", stats.totalLeads.toLocaleString()],
    ["Conversion Rate", `${stats.conversionRate.toFixed(2)}%`],
    ["New Leads", stats.newLeads.toLocaleString()],
    ["High Interest", stats.highInterest.toLocaleString()],
    ["Converted", stats.converted.toLocaleString()],
    ["Closed", stats.closed.toLocaleString()],
  ];
  
  summaryData.forEach(([metric, value]) => {
    const row = worksheet.addRow([metric, value]);
    row.height = 18;
    row.getCell(1).style = styles.cellStyle;
    row.getCell(2).style = styles.numberCellStyle;
    rowIndex++;
  });
  
  rowIndex += 2;
  
  // Monthly Performance Section
  const monthlyHeaderRow = worksheet.addRow(["Monthly Performance"]);
  monthlyHeaderRow.height = 25;
  worksheet.mergeCells(`A${rowIndex}:D${rowIndex}`);
  monthlyHeaderRow.getCell(1).style = styles.sectionHeaderStyle;
  rowIndex++;
  
  // Monthly table header
  const monthlyTableHeader = worksheet.addRow(["Month", "Total Leads", "Converted"]);
  monthlyTableHeader.height = 20;
  monthlyTableHeader.getCell(1).style = styles.tableHeaderStyle;
  monthlyTableHeader.getCell(2).style = styles.tableHeaderStyle;
  monthlyTableHeader.getCell(3).style = styles.tableHeaderStyle;
  rowIndex++;
  
  // Monthly data
  monthlyData.forEach((month) => {
    const row = worksheet.addRow([month.month, month.leads, month.converted]);
    row.height = 18;
    row.getCell(1).style = styles.cellStyle;
    row.getCell(2).style = styles.numberCellStyle;
    row.getCell(3).style = styles.numberCellStyle;
    rowIndex++;
  });
  
  rowIndex += 2;
  
  // Room Distribution Section
  const roomHeaderRow = worksheet.addRow(["Room Distribution"]);
  roomHeaderRow.height = 25;
  worksheet.mergeCells(`A${rowIndex}:C${rowIndex}`);
  roomHeaderRow.getCell(1).style = styles.sectionHeaderStyle;
  rowIndex++;
  
  const roomTotal = roomDistribution.reduce((sum, r) => sum + r.value, 0);
  const roomTableHeader = worksheet.addRow(["Room Type", "Count", "Percentage"]);
  roomTableHeader.height = 20;
  roomTableHeader.getCell(1).style = styles.tableHeaderStyle;
  roomTableHeader.getCell(2).style = styles.tableHeaderStyle;
  roomTableHeader.getCell(3).style = styles.tableHeaderStyle;
  rowIndex++;
  
  roomDistribution.forEach((room) => {
    const percentage = roomTotal > 0 ? ((room.value / roomTotal) * 100).toFixed(1) : "0.0";
    const row = worksheet.addRow([room.name, room.value, `${percentage}%`]);
    row.height = 18;
    row.getCell(1).style = styles.cellStyle;
    row.getCell(2).style = styles.numberCellStyle;
    row.getCell(3).style = styles.numberCellStyle;
    rowIndex++;
  });
  
  rowIndex += 2;
  
  // Status Distribution Section
  const statusHeaderRow = worksheet.addRow(["Lead Status Breakdown"]);
  statusHeaderRow.height = 25;
  worksheet.mergeCells(`A${rowIndex}:C${rowIndex}`);
  statusHeaderRow.getCell(1).style = styles.sectionHeaderStyle;
  rowIndex++;
  
  const statusTotal = statusDistribution.reduce((sum, s) => sum + s.value, 0);
  const statusTableHeader = worksheet.addRow(["Status", "Count", "Percentage"]);
  statusTableHeader.height = 20;
  statusTableHeader.getCell(1).style = styles.tableHeaderStyle;
  statusTableHeader.getCell(2).style = styles.tableHeaderStyle;
  statusTableHeader.getCell(3).style = styles.tableHeaderStyle;
  rowIndex++;
  
  statusDistribution.forEach((status) => {
    const percentage = statusTotal > 0 ? ((status.value / statusTotal) * 100).toFixed(1) : "0.0";
    const row = worksheet.addRow([status.name, status.value, `${percentage}%`]);
    row.height = 18;
    row.getCell(1).style = styles.cellStyle;
    row.getCell(2).style = styles.numberCellStyle;
    row.getCell(3).style = styles.numberCellStyle;
    rowIndex++;
  });

  if (data.leads && data.leads.length > 0) {
    const leadColumns = getLeadExportColumns(leadProfile, currencySymbol);
    rowIndex += 2;

    const leadsHeaderRow = worksheet.addRow([`Lead Records (${data.leads.length} total)`]);
    leadsHeaderRow.height = 26;
    worksheet.mergeCells(rowIndex, 1, rowIndex, Math.max(leadColumns.length, 4));
    leadsHeaderRow.getCell(1).style = styles.sectionHeaderStyle;
    rowIndex++;

    worksheet.columns = leadColumns.map((col) => ({ width: col.width }));

    const leadsTableHeader = worksheet.addRow(leadColumns.map((c) => c.header));
    leadsTableHeader.height = 22;
    leadColumns.forEach((_, i) => {
      leadsTableHeader.getCell(i + 1).style = styles.tableHeaderStyle;
    });
    rowIndex++;

    const numericCols = leadColumns
      .map((c, i) => (c.numeric ? i + 1 : -1))
      .filter((i) => i > 0);
    const monoCols = leadColumns
      .map((c, i) => (c.mono ? i + 1 : -1))
      .filter((i) => i > 0);

    data.leads.forEach((lead) => {
      const rowValues = leadColumns.map((col) => {
        const raw = formatLeadExportRow(lead, col, data.sources, currencySymbol);
        if (col.numeric && typeof raw === "number") return raw;
        return formatLeadExportDisplayValue(raw, col, currencySymbol);
      });
      const row = worksheet.addRow(rowValues);
      applyExcelRowStyle(row, leadColumns.length, styles, {
        numericColumns: numericCols,
        monoColumns: monoCols,
      });
      rowIndex++;
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `Urban_Hub_Report_${fileDate}.xlsx`
  );
}

export async function exportToPDF(data: ExportData) {
  // Dynamic import to avoid loading jspdf unless needed
  const { jsPDF } = await import("jspdf");
  
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  
  const margin = 15;
  let yPos = margin;
  let pageWidth = doc.internal.pageSize.getWidth();

  const {
    stats,
    monthlyData,
    roomDistribution,
    statusDistribution,
    dateRange,
    currencySymbol = "£",
    leadProfile = "default",
    reportTitle = "Performance Analytics Report",
  } = data;
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
    title: reportTitle,
    dateRange,
    margin,
  });

  yPos = drawPdfSectionHeader(doc, "Summary Statistics", yPos, margin, pageWidth);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  
  const statsData = [
    ["Metric", "Value"],
    ["Total Leads", stats.totalLeads.toLocaleString()],
    ["Conversion Rate", `${stats.conversionRate.toFixed(2)}%`],
    ["New Leads", stats.newLeads.toLocaleString()],
    ["High Interest", stats.highInterest.toLocaleString()],
    ["Converted", stats.converted.toLocaleString()],
    ["Closed", stats.closed.toLocaleString()],
  ];
  
  // Draw stats table
  const cellHeight = 7;
  const colWidth = (pageWidth - 2 * margin) / 2;
  
  statsData.forEach((row, index) => {
    checkPageBreak(cellHeight + 2);
    
    if (index === 0) {
      // Header row
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPos - 5, colWidth * 2, cellHeight, "F");
      doc.setFont("helvetica", "bold");
    } else {
      doc.setFont("helvetica", "normal");
    }
    
    doc.text(row[0], margin + 2, yPos);
    doc.text(row[1], margin + colWidth + 2, yPos);
    
    if (index < statsData.length - 1) {
      drawPdfDottedRowSeparator(doc, margin, yPos + 2, pageWidth - margin);
    }
    
    yPos += cellHeight;
  });
  
  yPos += 10;
  checkPageBreak(20);
  
  yPos += 5;
  checkPageBreak(30);
  
  yPos = drawPdfSectionHeader(doc, "Monthly Performance", yPos, margin, pageWidth);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  
  const monthlyHeaders = ["Month", "Leads", "Converted"];
  const colWidths = [45, 45, 45];
  const startX = margin;
  
  // Header
  doc.setFillColor(240, 240, 240);
  doc.rect(startX, yPos - 5, pageWidth - 2 * margin, cellHeight, "F");
  doc.setFont("helvetica", "bold");
  let xPos = startX + 2;
  monthlyHeaders.forEach((header, i) => {
    doc.text(header, xPos, yPos);
    xPos += colWidths[i];
  });
  
  yPos += cellHeight;
  doc.setFont("helvetica", "normal");
  
  monthlyData.forEach((month) => {
    checkPageBreak(cellHeight + 2);
    xPos = startX + 2;
    doc.text(month.month, xPos, yPos);
    xPos += colWidths[0];
    doc.text(month.leads.toString(), xPos, yPos);
    xPos += colWidths[1];
    doc.text(month.converted.toString(), xPos, yPos);
    
    drawPdfDottedRowSeparator(doc, startX, yPos + 2, pageWidth - margin);
    yPos += cellHeight;
  });
  
  yPos += 5;
  checkPageBreak(30);

  yPos = drawPdfSectionHeader(doc, "Room Distribution", yPos, margin, pageWidth);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  
  const roomTotal = roomDistribution.reduce((sum, r) => sum + r.value, 0);
  const roomHeaders = ["Room Type", "Count", "Percentage"];
  const roomColWidths = [60, 30, 40];
  
  // Header
  doc.setFillColor(240, 240, 240);
  doc.rect(startX, yPos - 5, pageWidth - 2 * margin, cellHeight, "F");
  doc.setFont("helvetica", "bold");
  xPos = startX + 2;
  roomHeaders.forEach((header, i) => {
    doc.text(header, xPos, yPos);
    xPos += roomColWidths[i];
  });
  
  yPos += cellHeight;
  doc.setFont("helvetica", "normal");
  
  roomDistribution.forEach((room) => {
    checkPageBreak(cellHeight + 2);
    const percentage = roomTotal > 0 ? ((room.value / roomTotal) * 100).toFixed(1) : "0.0";
    xPos = startX + 2;
    doc.text(room.name, xPos, yPos);
    xPos += roomColWidths[0];
    doc.text(room.value.toString(), xPos, yPos);
    xPos += roomColWidths[1];
    doc.text(`${percentage}%`, xPos, yPos);
    
    drawPdfDottedRowSeparator(doc, startX, yPos + 2, pageWidth - margin);
    yPos += cellHeight;
  });
  
  yPos += 5;
  checkPageBreak(30);

  yPos = drawPdfSectionHeader(doc, "Lead Status Breakdown", yPos, margin, pageWidth);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  
  const statusTotal = statusDistribution.reduce((sum, s) => sum + s.value, 0);
  const statusHeaders = ["Status", "Count", "Percentage"];
  const statusColWidths = [60, 30, 40];
  
  // Header
  doc.setFillColor(240, 240, 240);
  doc.rect(startX, yPos - 5, pageWidth - 2 * margin, cellHeight, "F");
  doc.setFont("helvetica", "bold");
  xPos = startX + 2;
  statusHeaders.forEach((header, i) => {
    doc.text(header, xPos, yPos);
    xPos += statusColWidths[i];
  });
  
  yPos += cellHeight;
  doc.setFont("helvetica", "normal");
  
  statusDistribution.forEach((status) => {
    checkPageBreak(cellHeight + 2);
    const percentage = statusTotal > 0 ? ((status.value / statusTotal) * 100).toFixed(1) : "0.0";
    xPos = startX + 2;
    doc.text(status.name, xPos, yPos);
    xPos += statusColWidths[0];
    doc.text(status.value.toString(), xPos, yPos);
    xPos += statusColWidths[1];
    doc.text(`${percentage}%`, xPos, yPos);
    
    drawPdfDottedRowSeparator(doc, startX, yPos + 2, pageWidth - margin);
    yPos += cellHeight;
  });
  
  if (data.leads && data.leads.length > 0) {
    const leadColumns = getLeadExportColumns(leadProfile, currencySymbol);
    const useLandscape = leadColumns.length > 6;
    if (useLandscape) {
      doc.addPage("a4", "landscape");
      yPos = margin;
    } else {
      yPos += 5;
      checkPageBreak(30);
    }

    pageWidth = doc.internal.pageSize.getWidth();
    const leadFontSize = leadColumns.length > 9 ? 6 : 7;
    const leadCellHeight = 7;
    const tableWidth = pageWidth - 2 * margin;
    const colWidths = getPdfColumnWidths(leadColumns, tableWidth);
    const leadStartX = margin;

    const drawLeadTableHeader = () => {
      checkPageBreak(leadCellHeight + 6);
      yPos = drawPdfSectionHeader(
        doc,
        `Lead Records (${data.leads.length} total)`,
        yPos,
        margin,
        pageWidth
      );
      doc.setFontSize(leadFontSize);
      doc.setFont("helvetica", "bold");
      doc.setFillColor(244, 246, 248);
      doc.rect(leadStartX, yPos - 5, tableWidth, leadCellHeight, "F");
      let headerX = leadStartX + 1;
      leadColumns.forEach((col, i) => {
        drawPdfTableCellText(doc, col.header, headerX, yPos, colWidths[i], {
          fontSize: leadFontSize,
        });
        headerX += colWidths[i];
      });
      yPos += leadCellHeight;
      doc.setFont("helvetica", "normal");
    };

    drawLeadTableHeader();

    data.leads.forEach((lead) => {
      if (checkPageBreak(leadCellHeight + 4)) {
        drawLeadTableHeader();
      }
      let rowX = leadStartX + 1;
      leadColumns.forEach((col, i) => {
        const raw = formatLeadExportRow(lead, col, data.sources, currencySymbol);
        const display = formatLeadExportDisplayValue(raw, col, currencySymbol);
        drawPdfTableCellText(doc, String(display), rowX, yPos, colWidths[i], {
          mono: col.mono,
          fontSize: leadFontSize,
        });
        rowX += colWidths[i];
      });
      drawPdfDottedRowSeparator(doc, leadStartX, yPos + 2, leadStartX + tableWidth);
      yPos += leadCellHeight;
    });
  }

  addPdfFooters(doc);
  doc.save(`Urban_Hub_Report_${fileDate}.pdf`);
}

