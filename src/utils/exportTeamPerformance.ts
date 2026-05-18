import type { TeamPerformanceMetrics } from "@/hooks/useTeamPerformance";
import {
  addPdfFooters,
  addPdfReportHeader,
  csvSectionTitle,
  downloadTextFile,
  drawPdfDottedRowSeparator,
  drawPdfSectionHeader,
  createPdfPageBreaker,
  getExportTimestamp,
  writeCsvReportHeader,
} from "@/utils/exportTheme";

interface TeamPerformanceExportData {
  teamMetrics: TeamPerformanceMetrics[];
  academicYear?: string;
  dateRange?: string;
  currencySymbol?: string;
}

export function exportTeamPerformanceToCSV(data: TeamPerformanceExportData) {
  const { teamMetrics, academicYear, dateRange, currencySymbol = "£" } = data;
  const { fileDate } = getExportTimestamp();
  const lines: string[] = [];
  writeCsvReportHeader(lines, "Team Performance Report", { academicYear, dateRange });
  let csv = lines.join("\n");
  csv += csvSectionTitle("Team Performance Summary");
  csv += `\n`;
  
  // Calculate team totals
  const teamTotals = teamMetrics.reduce(
    (acc, user) => ({
      totalLeads: acc.totalLeads + user.total_leads_assigned,
      totalConversions: acc.totalConversions + user.total_conversions,
      totalFollowups: acc.totalFollowups + user.total_followups_recorded,
    }),
    { totalLeads: 0, totalConversions: 0, totalFollowups: 0 }
  );
  
  const teamAvgConversionRate =
    teamTotals.totalLeads > 0
      ? (teamTotals.totalConversions / teamTotals.totalLeads) * 100
      : 0;
  
  const teamAvgComplianceRate =
    teamMetrics.reduce((sum, u) => sum + u.followup_compliance_rate, 0) /
    teamMetrics.length;
  
  csv += `Team Total Leads,${teamTotals.totalLeads}\n`;
  csv += `Team Total Conversions,${teamTotals.totalConversions}\n`;
  csv += `Team Average Conversion Rate,${teamAvgConversionRate.toFixed(2)}%\n`;
  csv += `Team Average Compliance Rate,${teamAvgComplianceRate.toFixed(2)}%\n`;
  csv += `Team Total Follow-ups,${teamTotals.totalFollowups}\n`;
  csv += csvSectionTitle("Individual Performance");
  csv += `\n`;
  csv += `Name,Role,Leads Assigned,Conversions,Conversion Rate,Follow-ups,Compliance Rate,Avg Time to 1st FU (hours)\n`;
  
  teamMetrics.forEach(user => {
    csv += `${user.full_name},${user.role},${user.total_leads_assigned},${user.total_conversions},${user.conversion_rate.toFixed(2)}%,${user.total_followups_recorded},${user.followup_compliance_rate.toFixed(2)}%,${user.avg_time_to_first_followup_hours ? Math.round(user.avg_time_to_first_followup_hours) : "N/A"}\n`;
  });
  
  csv += csvSectionTitle("End of Report");
  downloadTextFile(csv, `Urban_Hub_Team_Performance_${fileDate}.csv`, "text/csv;charset=utf-8;");
}

export async function exportTeamPerformanceToExcel(data: TeamPerformanceExportData) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Urban Hub Students Accommodations";
  workbook.created = new Date();
  
  const { teamMetrics, academicYear, dateRange, currencySymbol = "" } = data;
  const date = new Date().toLocaleDateString("en-GB");
  const time = new Date().toLocaleTimeString("en-GB");
  
  // Calculate team totals
  const teamTotals = teamMetrics.reduce(
    (acc, user) => ({
      totalLeads: acc.totalLeads + user.total_leads_assigned,
      totalConversions: acc.totalConversions + user.total_conversions,
      totalFollowups: acc.totalFollowups + user.total_followups_recorded,
    }),
    { totalLeads: 0, totalConversions: 0, totalFollowups: 0 }
  );
  
  const teamAvgConversionRate =
    teamTotals.totalLeads > 0
      ? (teamTotals.totalConversions / teamTotals.totalLeads) * 100
      : 0;
  
  const teamAvgComplianceRate =
    teamMetrics.reduce((sum, u) => sum + u.followup_compliance_rate, 0) /
    teamMetrics.length;
  
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
  const worksheet = workbook.addWorksheet("Team Performance");
  worksheet.columns = [
    { width: 25 }, // Name
    { width: 15 }, // Role
    { width: 15 }, // Leads
    { width: 15 }, // Conversions
    { width: 18 }, // Conversion Rate
    { width: 15 }, // Follow-ups
    { width: 18 }, // Compliance
    { width: 20 }, // Avg Time
  ];
  
  let rowIndex = 1;
  
  // Header
  const headerRow = worksheet.addRow(["Urban Hub Students Accommodations - Team Performance Report"]);
  headerRow.height = 30;
  worksheet.mergeCells(`A${rowIndex}:H${rowIndex}`);
  headerRow.getCell(1).style = headerStyle;
  rowIndex++;
  
  // Metadata
  worksheet.addRow([`Generated: ${date} at ${time}`]);
  worksheet.getRow(rowIndex).getCell(1).style = { ...cellStyle, font: { size: 9, italic: true } };
  worksheet.mergeCells(`A${rowIndex}:H${rowIndex}`);
  rowIndex++;
  
  if (academicYear) {
    worksheet.addRow([`Academic Year: ${academicYear}`]);
    worksheet.getRow(rowIndex).getCell(1).style = { ...cellStyle, font: { size: 9, italic: true } };
    worksheet.mergeCells(`A${rowIndex}:H${rowIndex}`);
    rowIndex++;
  }
  
  if (dateRange) {
    worksheet.addRow([`Date Range: ${dateRange}`]);
    worksheet.getRow(rowIndex).getCell(1).style = { ...cellStyle, font: { size: 9, italic: true } };
    worksheet.mergeCells(`A${rowIndex}:H${rowIndex}`);
    rowIndex++;
  }
  
  rowIndex += 2;
  
  // Team Summary Section
  const summaryHeaderRow = worksheet.addRow(["Team Performance Summary"]);
  summaryHeaderRow.height = 25;
  worksheet.mergeCells(`A${rowIndex}:B${rowIndex}`);
  summaryHeaderRow.getCell(1).style = sectionHeaderStyle;
  rowIndex++;
  
  const summaryTableHeader = worksheet.addRow(["Metric", "Value"]);
  summaryTableHeader.height = 20;
  summaryTableHeader.getCell(1).style = tableHeaderStyle;
  summaryTableHeader.getCell(2).style = tableHeaderStyle;
  rowIndex++;
  
  const summaryData = [
    ["Total Leads", teamTotals.totalLeads.toLocaleString()],
    ["Total Conversions", teamTotals.totalConversions.toLocaleString()],
    ["Average Conversion Rate", `${teamAvgConversionRate.toFixed(2)}%`],
    ["Average Compliance Rate", `${teamAvgComplianceRate.toFixed(2)}%`],
    ["Total Follow-ups", teamTotals.totalFollowups.toLocaleString()],
  ];
  
  summaryData.forEach(([metric, value]) => {
    const row = worksheet.addRow([metric, value]);
    row.height = 18;
    row.getCell(1).style = cellStyle;
    row.getCell(2).style = numberCellStyle;
    rowIndex++;
  });
  
  rowIndex += 2;
  
  // Individual Performance Section
  const individualHeaderRow = worksheet.addRow(["Individual Performance"]);
  individualHeaderRow.height = 25;
  worksheet.mergeCells(`A${rowIndex}:H${rowIndex}`);
  individualHeaderRow.getCell(1).style = sectionHeaderStyle;
  rowIndex++;
  
  const individualTableHeader = worksheet.addRow([
    "Name",
    "Role",
    "Leads Assigned",
    "Conversions",
    "Conversion Rate",
    "Follow-ups",
    "Compliance Rate",
    "Avg Time to 1st FU",
  ]);
  individualTableHeader.height = 20;
  for (let i = 1; i <= 8; i++) {
    individualTableHeader.getCell(i).style = tableHeaderStyle;
  }
  rowIndex++;
  
  teamMetrics.forEach(user => {
    const row = worksheet.addRow([
      user.full_name,
      user.role,
      user.total_leads_assigned,
      user.total_conversions,
      `${user.conversion_rate.toFixed(2)}%`,
      user.total_followups_recorded,
      `${user.followup_compliance_rate.toFixed(2)}%`,
      user.avg_time_to_first_followup_hours ? `${Math.round(user.avg_time_to_first_followup_hours)}h` : "N/A",
    ]);
    row.height = 18;
    for (let i = 1; i <= 8; i++) {
      if (i === 3 || i === 4 || i === 6) {
        row.getCell(i).style = numberCellStyle;
      } else {
        row.getCell(i).style = cellStyle;
      }
    }
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
  link.setAttribute("download", `Urban_Hub_Team_Performance_${date.replace(/\//g, "-")}.xlsx`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportTeamPerformanceToPDF(data: TeamPerformanceExportData) {
  const { jsPDF } = await import("jspdf");
  
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = margin;
  
  const { teamMetrics, academicYear, dateRange } = data;
  const { fileDate } = getExportTimestamp();

  const teamTotals = teamMetrics.reduce(
    (acc, user) => ({
      totalLeads: acc.totalLeads + user.total_leads_assigned,
      totalConversions: acc.totalConversions + user.total_conversions,
      totalFollowups: acc.totalFollowups + user.total_followups_recorded,
    }),
    { totalLeads: 0, totalConversions: 0, totalFollowups: 0 }
  );

  const teamAvgConversionRate =
    teamTotals.totalLeads > 0
      ? (teamTotals.totalConversions / teamTotals.totalLeads) * 100
      : 0;

  const teamAvgComplianceRate =
    teamMetrics.reduce((sum, u) => sum + u.followup_compliance_rate, 0) /
    teamMetrics.length;

  const checkPageBreak = createPdfPageBreaker(
    doc,
    margin,
    () => yPos,
    (y) => {
      yPos = y;
    }
  );
  
  yPos = addPdfReportHeader(doc, {
    title: "Team Performance Report",
    academicYear,
    dateRange,
    margin,
  });

  yPos = drawPdfSectionHeader(doc, "Team Performance Summary", yPos, margin, pageWidth);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  
  const summaryData = [
    ["Total Leads", teamTotals.totalLeads.toLocaleString()],
    ["Total Conversions", teamTotals.totalConversions.toLocaleString()],
    ["Average Conversion Rate", `${teamAvgConversionRate.toFixed(2)}%`],
    ["Average Compliance Rate", `${teamAvgComplianceRate.toFixed(2)}%`],
    ["Total Follow-ups", teamTotals.totalFollowups.toLocaleString()],
  ];
  
  const cellHeight = 7;
  const colWidth = (pageWidth - 2 * margin) / 2;
  
  summaryData.forEach((row, index) => {
    checkPageBreak(cellHeight + 2);
    doc.text(row[0], margin + 2, yPos);
    doc.text(row[1], margin + colWidth + 2, yPos);
    if (index < summaryData.length - 1) {
      drawPdfDottedRowSeparator(doc, margin, yPos + 2, pageWidth - margin);
    }
    yPos += cellHeight;
  });
  
  yPos += 10;
  checkPageBreak(20);
  
  yPos = drawPdfSectionHeader(doc, "Individual Performance", yPos, margin, pageWidth);
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  
  const headers = ["Name", "Role", "Leads", "Conv", "Rate", "FU", "Compl"];
  const colWidths = [34, 22, 16, 14, 16, 14, 18];
  
  // Header
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, cellHeight, "F");
  doc.setFont("helvetica", "bold");
  let xPos = margin + 1;
  headers.forEach((header, i) => {
    doc.text(header, xPos, yPos);
    xPos += colWidths[i];
  });
  
  yPos += cellHeight;
  doc.setFont("helvetica", "normal");
  
  teamMetrics.forEach((user) => {
    checkPageBreak(cellHeight + 2);
    xPos = margin + 1;
    doc.text(user.full_name.substring(0, 20), xPos, yPos);
    xPos += colWidths[0];
    doc.text(user.role.substring(0, 12), xPos, yPos);
    xPos += colWidths[1];
    doc.text(user.total_leads_assigned.toString(), xPos, yPos);
    xPos += colWidths[2];
    doc.text(user.total_conversions.toString(), xPos, yPos);
    xPos += colWidths[3];
    doc.text(`${user.conversion_rate.toFixed(1)}%`, xPos, yPos);
    xPos += colWidths[4];
    doc.text(user.total_followups_recorded.toString(), xPos, yPos);
    xPos += colWidths[5];
    doc.text(`${user.followup_compliance_rate.toFixed(1)}%`, xPos, yPos);
    drawPdfDottedRowSeparator(doc, margin, yPos + 2, pageWidth - margin);
    yPos += cellHeight;
  });
  
  addPdfFooters(doc);
  doc.save(`Urban_Hub_Team_Performance_${fileDate}.pdf`);
}

