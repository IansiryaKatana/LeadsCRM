import type { TeamPerformanceMetrics } from "@/hooks/useTeamPerformance";

interface TeamPerformanceExportData {
  teamMetrics: TeamPerformanceMetrics[];
  academicYear?: string;
  dateRange?: string;
  currencySymbol?: string;
}

export function exportTeamPerformanceToCSV(data: TeamPerformanceExportData) {
  const { teamMetrics, academicYear, dateRange, currencySymbol = "" } = data;
  const date = new Date().toLocaleDateString("en-GB");
  const time = new Date().toLocaleTimeString("en-GB");
  
  let csv = `ISKA Leads CRM - Team Performance Report\n`;
  csv += `Generated: ${date} at ${time}\n`;
  if (academicYear) csv += `Academic Year: ${academicYear}\n`;
  if (dateRange) csv += `Date Range: ${dateRange}\n`;
  csv += `\n`;
  csv += `═══════════════════════════════════════════════════════════════\n`;
  csv += `TEAM PERFORMANCE SUMMARY\n`;
  csv += `═══════════════════════════════════════════════════════════════\n`;
  csv += `\n`;
  
  // Calculate team totals
  const teamTotals = teamMetrics.reduce(
    (acc, user) => ({
      totalLeads: acc.totalLeads + user.total_leads_assigned,
      totalConversions: acc.totalConversions + user.total_conversions,
      totalRevenue: acc.totalRevenue + user.total_revenue,
      totalFollowups: acc.totalFollowups + user.total_followups_recorded,
    }),
    { totalLeads: 0, totalConversions: 0, totalRevenue: 0, totalFollowups: 0 }
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
  csv += `Team Total Revenue,${currencySymbol} ${teamTotals.totalRevenue.toLocaleString()}\n`;
  csv += `Team Average Compliance Rate,${teamAvgComplianceRate.toFixed(2)}%\n`;
  csv += `Team Total Follow-ups,${teamTotals.totalFollowups}\n`;
  csv += `\n`;
  csv += `═══════════════════════════════════════════════════════════════\n`;
  csv += `INDIVIDUAL PERFORMANCE\n`;
  csv += `═══════════════════════════════════════════════════════════════\n`;
  csv += `\n`;
  csv += `Name,Role,Leads Assigned,Conversions,Conversion Rate,Revenue,Follow-ups,Compliance Rate,Avg Time to 1st FU (hours)\n`;
  
  teamMetrics.forEach(user => {
    csv += `${user.full_name},${user.role},${user.total_leads_assigned},${user.total_conversions},${user.conversion_rate.toFixed(2)}%,${currencySymbol} ${user.total_revenue.toLocaleString()},${user.total_followups_recorded},${user.followup_compliance_rate.toFixed(2)}%,${user.avg_time_to_first_followup_hours ? Math.round(user.avg_time_to_first_followup_hours) : "N/A"}\n`;
  });
  
  csv += `\n`;
  csv += `═══════════════════════════════════════════════════════════════\n`;
  csv += `END OF REPORT\n`;
  csv += `═══════════════════════════════════════════════════════════════\n`;
  
  // Download CSV
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `ISKA_Team_Performance_${date.replace(/\//g, "-")}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportTeamPerformanceToExcel(data: TeamPerformanceExportData) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ISKA Leads CRM";
  workbook.created = new Date();
  
  const { teamMetrics, academicYear, dateRange, currencySymbol = "" } = data;
  const date = new Date().toLocaleDateString("en-GB");
  const time = new Date().toLocaleTimeString("en-GB");
  
  // Calculate team totals
  const teamTotals = teamMetrics.reduce(
    (acc, user) => ({
      totalLeads: acc.totalLeads + user.total_leads_assigned,
      totalConversions: acc.totalConversions + user.total_conversions,
      totalRevenue: acc.totalRevenue + user.total_revenue,
      totalFollowups: acc.totalFollowups + user.total_followups_recorded,
    }),
    { totalLeads: 0, totalConversions: 0, totalRevenue: 0, totalFollowups: 0 }
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
    { width: 18 }, // Revenue
    { width: 15 }, // Follow-ups
    { width: 18 }, // Compliance
    { width: 20 }, // Avg Time
  ];
  
  let rowIndex = 1;
  
  // Header
  const headerRow = worksheet.addRow(["ISKA Leads CRM - Team Performance Report"]);
  headerRow.height = 30;
  worksheet.mergeCells(`A${rowIndex}:I${rowIndex}`);
  headerRow.getCell(1).style = headerStyle;
  rowIndex++;
  
  // Metadata
  worksheet.addRow([`Generated: ${date} at ${time}`]);
  worksheet.getRow(rowIndex).getCell(1).style = { ...cellStyle, font: { size: 9, italic: true } };
  worksheet.mergeCells(`A${rowIndex}:I${rowIndex}`);
  rowIndex++;
  
  if (academicYear) {
    worksheet.addRow([`Academic Year: ${academicYear}`]);
    worksheet.getRow(rowIndex).getCell(1).style = { ...cellStyle, font: { size: 9, italic: true } };
    worksheet.mergeCells(`A${rowIndex}:I${rowIndex}`);
    rowIndex++;
  }
  
  if (dateRange) {
    worksheet.addRow([`Date Range: ${dateRange}`]);
    worksheet.getRow(rowIndex).getCell(1).style = { ...cellStyle, font: { size: 9, italic: true } };
    worksheet.mergeCells(`A${rowIndex}:I${rowIndex}`);
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
    ["Total Revenue", `${currencySymbol} ${teamTotals.totalRevenue.toLocaleString()}`],
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
  worksheet.mergeCells(`A${rowIndex}:I${rowIndex}`);
  individualHeaderRow.getCell(1).style = sectionHeaderStyle;
  rowIndex++;
  
  const individualTableHeader = worksheet.addRow([
    "Name",
    "Role",
    "Leads Assigned",
    "Conversions",
    "Conversion Rate",
    "Revenue",
    "Follow-ups",
    "Compliance Rate",
    "Avg Time to 1st FU",
  ]);
  individualTableHeader.height = 20;
  for (let i = 1; i <= 9; i++) {
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
      `${currencySymbol} ${user.total_revenue.toLocaleString()}`,
      user.total_followups_recorded,
      `${user.followup_compliance_rate.toFixed(2)}%`,
      user.avg_time_to_first_followup_hours ? `${Math.round(user.avg_time_to_first_followup_hours)}h` : "N/A",
    ]);
    row.height = 18;
    for (let i = 1; i <= 9; i++) {
      if (i === 3 || i === 4 || i === 6 || i === 7) {
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
  link.setAttribute("download", `ISKA_Team_Performance_${date.replace(/\//g, "-")}.xlsx`);
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
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;
  
  const { teamMetrics, academicYear, dateRange, currencySymbol = "" } = data;
  const date = new Date().toLocaleDateString("en-GB");
  const time = new Date().toLocaleTimeString("en-GB");
  
  // Calculate team totals
  const teamTotals = teamMetrics.reduce(
    (acc, user) => ({
      totalLeads: acc.totalLeads + user.total_leads_assigned,
      totalConversions: acc.totalConversions + user.total_conversions,
      totalRevenue: acc.totalRevenue + user.total_revenue,
      totalFollowups: acc.totalFollowups + user.total_followups_recorded,
    }),
    { totalLeads: 0, totalConversions: 0, totalRevenue: 0, totalFollowups: 0 }
  );
  
  const teamAvgConversionRate =
    teamTotals.totalLeads > 0
      ? (teamTotals.totalConversions / teamTotals.totalLeads) * 100
      : 0;
  
  const teamAvgComplianceRate =
    teamMetrics.reduce((sum, u) => sum + u.followup_compliance_rate, 0) /
    teamMetrics.length;
  
  const checkPageBreak = (requiredHeight: number) => {
    if (yPos + requiredHeight > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };
  
  // Header
  doc.setFillColor(81, 166, 255);
  doc.rect(0, 0, pageWidth, 50, "F");
  doc.setFillColor(120, 180, 255);
  doc.rect(0, 45, pageWidth, 5, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("ISKA Leads CRM", margin, 25);
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Team Performance Report", margin, 35);
  
  doc.setFontSize(9);
  doc.text(`Generated: ${date} at ${time}`, pageWidth - margin, 25, { align: "right" });
  if (academicYear) {
    doc.text(`Academic Year: ${academicYear}`, pageWidth - margin, 32, { align: "right" });
  }
  if (dateRange) {
    doc.text(`Date Range: ${dateRange}`, pageWidth - margin, academicYear ? 39 : 32, { align: "right" });
  }
  
  yPos = 60;
  
  // Team Summary Section
  doc.setFillColor(240, 248, 255);
  doc.rect(margin - 2, yPos - 8, pageWidth - 2 * margin + 4, 12, "F");
  doc.setDrawColor(81, 166, 255);
  doc.setLineWidth(0.5);
  doc.rect(margin - 2, yPos - 8, pageWidth - 2 * margin + 4, 12, "S");
  
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(81, 166, 255);
  doc.text("Team Performance Summary", margin, yPos);
  yPos += 12;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  
  const summaryData = [
    ["Total Leads", teamTotals.totalLeads.toLocaleString()],
    ["Total Conversions", teamTotals.totalConversions.toLocaleString()],
    ["Average Conversion Rate", `${teamAvgConversionRate.toFixed(2)}%`],
    ["Total Revenue", `${currencySymbol} ${teamTotals.totalRevenue.toLocaleString()}`],
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
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2);
    }
    yPos += cellHeight;
  });
  
  yPos += 10;
  checkPageBreak(20);
  
  // Individual Performance Section
  doc.setFillColor(240, 248, 255);
  doc.rect(margin - 2, yPos - 8, pageWidth - 2 * margin + 4, 12, "F");
  doc.setDrawColor(81, 166, 255);
  doc.setLineWidth(0.5);
  doc.rect(margin - 2, yPos - 8, pageWidth - 2 * margin + 4, 12, "S");
  
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(81, 166, 255);
  doc.text("Individual Performance", margin, yPos);
  yPos += 12;
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  
  const headers = ["Name", "Role", "Leads", "Conv", "Rate", "Revenue", "FU", "Compl"];
  const colWidths = [30, 20, 15, 12, 15, 25, 12, 15];
  
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
    doc.text(`${currencySymbol}${(user.total_revenue / 1000).toFixed(0)}K`, xPos, yPos);
    xPos += colWidths[5];
    doc.text(user.total_followups_recorded.toString(), xPos, yPos);
    xPos += colWidths[6];
    doc.text(`${user.followup_compliance_rate.toFixed(1)}%`, xPos, yPos);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2);
    yPos += cellHeight;
  });
  
  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
    doc.text(
      "ISKA Leads CRM - Confidential",
      pageWidth / 2,
      pageHeight - 5,
      { align: "center" }
    );
  }
  
  doc.save(`ISKA_Team_Performance_${date.replace(/\//g, "-")}.pdf`);
}

