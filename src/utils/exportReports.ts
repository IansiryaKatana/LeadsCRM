import { LEAD_STATUS_CONFIG, ROOM_CHOICE_CONFIG, getSourceConfig, STAY_DURATION_CONFIG } from "@/types/crm";
import type { DashboardStats } from "@/hooks/useDashboardStats";

interface ExportData {
  stats: DashboardStats;
  monthlyData: Array<{ month: string; leads: number; converted: number; revenue: number }>;
  roomDistribution: Array<{ name: string; value: number }>;
  statusDistribution: Array<{ name: string; value: number; fill: string }>;
  dateRange: string;
  currencySymbol?: string;
  sources?: Array<{ slug: string; name: string; icon: string }>;
  leads?: Array<{
    full_name: string;
    email: string;
    phone: string;
    source: string;
    room_choice: string;
    stay_duration: string;
    lead_status: string;
    potential_revenue: number;
    academic_year: string;
    is_hot: boolean;
    created_at: string;
    landing_page?: string | null;
    contact_reason?: string | null;
    contact_message?: string | null;
    keyworker_length_of_stay?: string | null;
    keyworker_preferred_date?: string | null;
  }>;
}

// Generate ASCII bar chart for CSV
function generateASCIIChart(data: Array<{ name: string; value: number }>, maxWidth = 40): string {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  return data
    .map(item => {
      const barLength = Math.round((item.value / maxValue) * maxWidth);
      const bar = "█".repeat(barLength);
      return `${item.name.padEnd(20)} │${bar} ${item.value}`;
    })
    .join("\n");
}

// Generate ASCII pie representation
function generateASCIIPie(data: Array<{ name: string; value: number }>): string {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return "No data available";
  
  return data
    .map(item => {
      const percentage = ((item.value / total) * 100).toFixed(1);
      const barLength = Math.round((item.value / total) * 20);
      const bar = "▓".repeat(barLength);
      return `${item.name.padEnd(20)} │${bar} ${item.value} (${percentage}%)`;
    })
    .join("\n");
}

export function exportToCSV(data: ExportData) {
  const { stats, monthlyData, roomDistribution, statusDistribution, dateRange, currencySymbol = "" } = data;
  const date = new Date().toLocaleDateString("en-GB");
  const time = new Date().toLocaleTimeString("en-GB");
  
  let csv = `ISKA Leads CRM - Reports Export\n`;
  csv += `Generated: ${date} at ${time}\n`;
  csv += `Date Range: ${dateRange}\n`;
  csv += `\n`;
  csv += `═══════════════════════════════════════════════════════════════\n`;
  csv += `SUMMARY STATISTICS\n`;
  csv += `═══════════════════════════════════════════════════════════════\n`;
  csv += `\n`;
  csv += `Metric,Value\n`;
  csv += `Total Leads,${stats.totalLeads}\n`;
  csv += `Conversion Rate,${stats.conversionRate.toFixed(2)}%\n`;
  csv += `Total Revenue,${currencySymbol} ${stats.totalRevenue.toLocaleString()}\n`;
  csv += `New Leads,${stats.newLeads}\n`;
  csv += `High Interest,${stats.highInterest}\n`;
  csv += `Converted,${stats.converted}\n`;
  csv += `Closed,${stats.closed}\n`;
  csv += `\n`;
  csv += `═══════════════════════════════════════════════════════════════\n`;
  csv += `MONTHLY PERFORMANCE\n`;
  csv += `═══════════════════════════════════════════════════════════════\n`;
  csv += `\n`;
  csv += `Month,Total Leads,Converted,Revenue (${currencySymbol})\n`;
  monthlyData.forEach(month => {
    csv += `${month.month},${month.leads},${month.converted},${month.revenue.toLocaleString()}\n`;
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
  csv += `\n`;
  csv += `═══════════════════════════════════════════════════════════════\n`;
  csv += `END OF REPORT\n`;
  csv += `═══════════════════════════════════════════════════════════════\n`;
  
  // Download CSV
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `Urban_Hub_Report_${date.replace(/\//g, "-")}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportToExcel(data: ExportData) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ISKA Leads CRM";
  workbook.created = new Date();
  
  const { stats, monthlyData, roomDistribution, statusDistribution, dateRange, currencySymbol = "" } = data;
  const date = new Date().toLocaleDateString("en-GB");
  const time = new Date().toLocaleTimeString("en-GB");
  
  // Define styles
  const headerStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, size: 16, color: { argb: "FFFFFFFF" } },
    fill: {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF51A6FF" }, // Primary blue
    },
    alignment: { vertical: "middle", horizontal: "center" },
    border: {
      top: { style: "thin", color: { argb: "FF51A6FF" } },
      bottom: { style: "thin", color: { argb: "FF51A6FF" } },
      left: { style: "thin", color: { argb: "FF51A6FF" } },
      right: { style: "thin", color: { argb: "FF51A6FF" } },
    },
  };
  
  const sectionHeaderStyle = {
    font: { bold: true, size: 14, color: { argb: "FF51A6FF" } },
    fill: {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF0F8FF" }, // Light blue background
    },
    alignment: { vertical: "middle", horizontal: "left" },
    border: {
      top: { style: "thin", color: { argb: "FF51A6FF" } },
      bottom: { style: "thin", color: { argb: "FF51A6FF" } },
      left: { style: "thin", color: { argb: "FF51A6FF" } },
      right: { style: "thin", color: { argb: "FF51A6FF" } },
    },
  };
  
  const tableHeaderStyle = {
    font: { bold: true, size: 11, color: { argb: "FF000000" } },
    fill: {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF0F0F0" }, // Light gray
    },
    alignment: { vertical: "middle", horizontal: "center" },
    border: {
      top: { style: "thin", color: { argb: "FFC8C8C8" } },
      bottom: { style: "thin", color: { argb: "FFC8C8C8" } },
      left: { style: "thin", color: { argb: "FFC8C8C8" } },
      right: { style: "thin", color: { argb: "FFC8C8C8" } },
    },
  };
  
  const cellStyle = {
    font: { size: 10 },
    alignment: { vertical: "middle", horizontal: "left" },
    border: {
      top: { style: "thin", color: { argb: "FFE0E0E0" } },
      bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
      left: { style: "thin", color: { argb: "FFE0E0E0" } },
      right: { style: "thin", color: { argb: "FFE0E0E0" } },
    },
  };
  
  const numberCellStyle = {
    ...cellStyle,
    alignment: { vertical: "middle", horizontal: "right" },
  };
  
  // Create main worksheet
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
  
  // Header Row
  const headerRow = worksheet.addRow(["Urban Hub Students Accommodations - Performance Analytics Report"]);
  worksheet.addRow(["Intellectual Property of Ian Katana"]);
  headerRow.height = 30;
  worksheet.mergeCells(`A${rowIndex}:E${rowIndex}`);
  headerRow.getCell(1).style = headerStyle;
  rowIndex++;
  
  // Metadata rows
  worksheet.addRow([`Generated: ${date} at ${time}`]);
  worksheet.getRow(rowIndex).getCell(1).style = { ...cellStyle, font: { size: 9, italic: true } };
  worksheet.mergeCells(`A${rowIndex}:E${rowIndex}`);
  rowIndex++;
  
  worksheet.addRow([`Date Range: ${dateRange}`]);
  worksheet.getRow(rowIndex).getCell(1).style = { ...cellStyle, font: { size: 9, italic: true } };
  worksheet.mergeCells(`A${rowIndex}:E${rowIndex}`);
  rowIndex += 2;
  
  // Summary Statistics Section
  const summaryHeaderRow = worksheet.addRow(["Summary Statistics"]);
  summaryHeaderRow.height = 25;
  worksheet.mergeCells(`A${rowIndex}:B${rowIndex}`);
  summaryHeaderRow.getCell(1).style = sectionHeaderStyle;
  rowIndex++;
  
  // Summary table header
  const summaryTableHeader = worksheet.addRow(["Metric", "Value"]);
  summaryTableHeader.height = 20;
  summaryTableHeader.getCell(1).style = tableHeaderStyle;
  summaryTableHeader.getCell(2).style = tableHeaderStyle;
  rowIndex++;
  
  // Summary data
  const summaryData = [
    ["Total Leads", stats.totalLeads.toLocaleString()],
    ["Conversion Rate", `${stats.conversionRate.toFixed(2)}%`],
    ["Total Revenue", `${currencySymbol} ${stats.totalRevenue.toLocaleString()}`],
    ["New Leads", stats.newLeads.toLocaleString()],
    ["High Interest", stats.highInterest.toLocaleString()],
    ["Converted", stats.converted.toLocaleString()],
    ["Closed", stats.closed.toLocaleString()],
  ];
  
  summaryData.forEach(([metric, value]) => {
    const row = worksheet.addRow([metric, value]);
    row.height = 18;
    row.getCell(1).style = cellStyle;
    row.getCell(2).style = numberCellStyle;
    rowIndex++;
  });
  
  rowIndex += 2;
  
  // Monthly Performance Section
  const monthlyHeaderRow = worksheet.addRow(["Monthly Performance"]);
  monthlyHeaderRow.height = 25;
  worksheet.mergeCells(`A${rowIndex}:E${rowIndex}`);
  monthlyHeaderRow.getCell(1).style = sectionHeaderStyle;
  rowIndex++;
  
  // Monthly table header
  const monthlyTableHeader = worksheet.addRow([
    "Month",
    "Total Leads",
    "Converted",
    `Revenue (${currencySymbol})`,
  ]);
  monthlyTableHeader.height = 20;
  monthlyTableHeader.getCell(1).style = tableHeaderStyle;
  monthlyTableHeader.getCell(2).style = tableHeaderStyle;
  monthlyTableHeader.getCell(3).style = tableHeaderStyle;
  monthlyTableHeader.getCell(4).style = tableHeaderStyle;
  rowIndex++;
  
  // Monthly data
  monthlyData.forEach((month) => {
    const row = worksheet.addRow([
      month.month,
      month.leads,
      month.converted,
      month.revenue,
    ]);
    row.height = 18;
    row.getCell(1).style = cellStyle;
    row.getCell(2).style = numberCellStyle;
    row.getCell(3).style = numberCellStyle;
    row.getCell(4).style = numberCellStyle;
    rowIndex++;
  });
  
  rowIndex += 2;
  
  // Room Distribution Section
  const roomHeaderRow = worksheet.addRow(["Room Distribution"]);
  roomHeaderRow.height = 25;
  worksheet.mergeCells(`A${rowIndex}:C${rowIndex}`);
  roomHeaderRow.getCell(1).style = sectionHeaderStyle;
  rowIndex++;
  
  const roomTotal = roomDistribution.reduce((sum, r) => sum + r.value, 0);
  const roomTableHeader = worksheet.addRow(["Room Type", "Count", "Percentage"]);
  roomTableHeader.height = 20;
  roomTableHeader.getCell(1).style = tableHeaderStyle;
  roomTableHeader.getCell(2).style = tableHeaderStyle;
  roomTableHeader.getCell(3).style = tableHeaderStyle;
  rowIndex++;
  
  roomDistribution.forEach((room) => {
    const percentage = roomTotal > 0 ? ((room.value / roomTotal) * 100).toFixed(1) : "0.0";
    const row = worksheet.addRow([room.name, room.value, `${percentage}%`]);
    row.height = 18;
    row.getCell(1).style = cellStyle;
    row.getCell(2).style = numberCellStyle;
    row.getCell(3).style = numberCellStyle;
    rowIndex++;
  });
  
  rowIndex += 2;
  
  // Status Distribution Section
  const statusHeaderRow = worksheet.addRow(["Lead Status Breakdown"]);
  statusHeaderRow.height = 25;
  worksheet.mergeCells(`A${rowIndex}:C${rowIndex}`);
  statusHeaderRow.getCell(1).style = sectionHeaderStyle;
  rowIndex++;
  
  const statusTotal = statusDistribution.reduce((sum, s) => sum + s.value, 0);
  const statusTableHeader = worksheet.addRow(["Status", "Count", "Percentage"]);
  statusTableHeader.height = 20;
  statusTableHeader.getCell(1).style = tableHeaderStyle;
  statusTableHeader.getCell(2).style = tableHeaderStyle;
  statusTableHeader.getCell(3).style = tableHeaderStyle;
  rowIndex++;
  
  statusDistribution.forEach((status) => {
    const percentage = statusTotal > 0 ? ((status.value / statusTotal) * 100).toFixed(1) : "0.0";
    const row = worksheet.addRow([status.name, status.value, `${percentage}%`]);
    row.height = 18;
    row.getCell(1).style = cellStyle;
    row.getCell(2).style = numberCellStyle;
    row.getCell(3).style = numberCellStyle;
    rowIndex++;
  });
  
  // Add Lead Records Section if leads are provided
  if (data.leads && data.leads.length > 0) {
    rowIndex += 2;
    
    const leadsHeaderRow = worksheet.addRow([`Lead Records (${data.leads.length} total)`]);
    leadsHeaderRow.height = 25;
    worksheet.mergeCells(`A${rowIndex}:J${rowIndex}`);
    leadsHeaderRow.getCell(1).style = sectionHeaderStyle;
    rowIndex++;
    
    // Update column widths for leads table
    worksheet.columns = [
      { width: 25 }, // Name
      { width: 30 }, // Email
      { width: 18 }, // Phone
      { width: 15 }, // Source
      { width: 15 }, // Room
      { width: 15 }, // Duration
      { width: 18 }, // Status
      { width: 15 }, // Revenue
      { width: 15 }, // Academic Year
      { width: 12 }, // Hot
      { width: 20 }, // Created Date
    ];
    
    const leadsTableHeader = worksheet.addRow([
      "Full Name",
      "Email",
      "Phone",
      "Source",
      "Room Choice",
      "Stay Duration",
      "Status",
      `Revenue (${currencySymbol})`,
      "Academic Year",
      "Hot Lead",
      "Created Date",
    ]);
    leadsTableHeader.height = 20;
    for (let i = 1; i <= 11; i++) {
      leadsTableHeader.getCell(i).style = tableHeaderStyle;
    }
    rowIndex++;
    
    data.leads.forEach((lead) => {
      const createdDate = new Date(lead.created_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      
      const row = worksheet.addRow([
        lead.full_name,
        lead.email,
        lead.phone,
        getSourceConfig(lead.source, data.sources || []).label,
        ROOM_CHOICE_CONFIG[lead.room_choice as keyof typeof ROOM_CHOICE_CONFIG]?.label || lead.room_choice,
        STAY_DURATION_CONFIG[lead.stay_duration as keyof typeof STAY_DURATION_CONFIG]?.label || lead.stay_duration,
        LEAD_STATUS_CONFIG[lead.lead_status as keyof typeof LEAD_STATUS_CONFIG]?.label || lead.lead_status,
        lead.potential_revenue || 0,
        lead.academic_year || "N/A",
        lead.is_hot ? "Yes" : "No",
        createdDate,
      ]);
      row.height = 18;
      for (let i = 1; i <= 11; i++) {
        if (i === 8) {
          // Revenue column
          row.getCell(i).style = numberCellStyle;
        } else {
          row.getCell(i).style = cellStyle;
        }
      }
      rowIndex++;
    });
  }
  
  // Generate Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `Urban_Hub_Report_${date.replace(/\//g, "-")}.xlsx`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportToPDF(data: ExportData) {
  // Dynamic import to avoid loading jspdf unless needed
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
  
  const { stats, monthlyData, roomDistribution, statusDistribution, dateRange, currencySymbol = "" } = data;
  const date = new Date().toLocaleDateString("en-GB");
  const time = new Date().toLocaleTimeString("en-GB");
  
  // Helper function to add new page if needed
  const checkPageBreak = (requiredHeight: number) => {
    if (yPos + requiredHeight > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };
  
  // Beautiful Header
  doc.setFillColor(81, 166, 255); // Primary blue
  doc.rect(0, 0, pageWidth, 50, "F");
  
  // Add subtle accent line at bottom of header (using lighter blue)
  doc.setFillColor(120, 180, 255);
  doc.rect(0, 45, pageWidth, 5, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("Urban Hub Students Accommodations", margin, 25);
  doc.setFontSize(10);
  doc.text("Intellectual Property of Ian Katana", margin, 32);
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Performance Analytics Report", margin, 35);
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(`Generated: ${date} at ${time}`, pageWidth - margin, 25, { align: "right" });
  doc.text(`Date Range: ${dateRange}`, pageWidth - margin, 32, { align: "right" });
  
  yPos = 60;
  
  // Summary Statistics Section with styled header
  doc.setFillColor(240, 248, 255);
  doc.rect(margin - 2, yPos - 8, pageWidth - 2 * margin + 4, 12, "F");
  doc.setDrawColor(81, 166, 255);
  doc.setLineWidth(0.5);
  doc.rect(margin - 2, yPos - 8, pageWidth - 2 * margin + 4, 12, "S");
  
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(81, 166, 255);
  doc.text("Summary Statistics", margin, yPos);
  yPos += 12;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  
  const statsData = [
    ["Metric", "Value"],
    ["Total Leads", stats.totalLeads.toLocaleString()],
    ["Conversion Rate", `${stats.conversionRate.toFixed(2)}%`],
    ["Total Revenue", `${currencySymbol} ${stats.totalRevenue.toLocaleString()}`],
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
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2);
    }
    
    yPos += cellHeight;
  });
  
  yPos += 10;
  checkPageBreak(20);
  
  yPos += 5;
  checkPageBreak(30);
  
  // Monthly Performance Section with styled header
  doc.setFillColor(240, 248, 255);
  doc.rect(margin - 2, yPos - 8, pageWidth - 2 * margin + 4, 12, "F");
  doc.setDrawColor(81, 166, 255);
  doc.setLineWidth(0.5);
  doc.rect(margin - 2, yPos - 8, pageWidth - 2 * margin + 4, 12, "S");
  
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(81, 166, 255);
  doc.text("Monthly Performance", margin, yPos);
  yPos += 12;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  
  const monthlyHeaders = ["Month", "Leads", "Converted", `Revenue (${currencySymbol})`];
  const colWidths = [30, 30, 30, 50];
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
    xPos += colWidths[2];
    doc.text(month.revenue.toLocaleString(), xPos, yPos);
    
    doc.setDrawColor(200, 200, 200);
    doc.line(startX, yPos + 2, pageWidth - margin, yPos + 2);
    yPos += cellHeight;
  });
  
  yPos += 5;
  checkPageBreak(30);
  
  // Room Distribution Section with styled header
  doc.setFillColor(240, 248, 255);
  doc.rect(margin - 2, yPos - 8, pageWidth - 2 * margin + 4, 12, "F");
  doc.setDrawColor(81, 166, 255);
  doc.setLineWidth(0.5);
  doc.rect(margin - 2, yPos - 8, pageWidth - 2 * margin + 4, 12, "S");
  
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(81, 166, 255);
  doc.text("Room Distribution", margin, yPos);
  yPos += 12;
  
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
    
    doc.setDrawColor(200, 200, 200);
    doc.line(startX, yPos + 2, pageWidth - margin, yPos + 2);
    yPos += cellHeight;
  });
  
  yPos += 5;
  checkPageBreak(30);
  
  // Status Distribution Section with styled header
  doc.setFillColor(240, 248, 255);
  doc.rect(margin - 2, yPos - 8, pageWidth - 2 * margin + 4, 12, "F");
  doc.setDrawColor(81, 166, 255);
  doc.setLineWidth(0.5);
  doc.rect(margin - 2, yPos - 8, pageWidth - 2 * margin + 4, 12, "S");
  
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(81, 166, 255);
  doc.text("Lead Status Breakdown", margin, yPos);
  yPos += 12;
  
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
    
    doc.setDrawColor(200, 200, 200);
    doc.line(startX, yPos + 2, pageWidth - margin, yPos + 2);
    yPos += cellHeight;
  });
  
  // Lead Records Section if leads are provided
  if (data.leads && data.leads.length > 0) {
    yPos += 5;
    checkPageBreak(30);
    
    // Lead Records Section with styled header
    doc.setFillColor(240, 248, 255);
    doc.rect(margin - 2, yPos - 8, pageWidth - 2 * margin + 4, 12, "F");
    doc.setDrawColor(81, 166, 255);
    doc.setLineWidth(0.5);
    doc.rect(margin - 2, yPos - 8, pageWidth - 2 * margin + 4, 12, "S");
    
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(81, 166, 255);
    doc.text(`Lead Records (${data.leads.length} total)`, margin, yPos);
    yPos += 12;
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    
    // Lead table headers - using smaller font for more columns
    const leadHeaders = ["Name", "Email", "Phone", "Source", "Room", "Status", `Revenue (${currencySymbol})`, "Date"];
    const leadColWidths = [25, 35, 20, 18, 18, 20, 25, 20];
    const leadStartX = margin;
    
    // Header
    doc.setFillColor(240, 240, 240);
    doc.rect(leadStartX, yPos - 5, pageWidth - 2 * margin, cellHeight, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    xPos = leadStartX + 1;
    leadHeaders.forEach((header, i) => {
      doc.text(header, xPos, yPos);
      xPos += leadColWidths[i];
    });
    
    yPos += cellHeight;
    doc.setFont("helvetica", "normal");
    
    // Lead data rows
    data.leads.forEach((lead) => {
      checkPageBreak(cellHeight + 2);
      const createdDate = new Date(lead.created_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      
      xPos = leadStartX + 1;
      doc.text(lead.full_name.substring(0, 20), xPos, yPos);
      xPos += leadColWidths[0];
      doc.text(lead.email.substring(0, 25), xPos, yPos);
      xPos += leadColWidths[1];
      doc.text(lead.phone.substring(0, 15), xPos, yPos);
      xPos += leadColWidths[2];
      doc.text(getSourceConfig(lead.source, data.sources || []).label.substring(0, 12), xPos, yPos);
      xPos += leadColWidths[3];
      doc.text((ROOM_CHOICE_CONFIG[lead.room_choice as keyof typeof ROOM_CHOICE_CONFIG]?.label || lead.room_choice).substring(0, 12), xPos, yPos);
      xPos += leadColWidths[4];
      doc.text((LEAD_STATUS_CONFIG[lead.lead_status as keyof typeof LEAD_STATUS_CONFIG]?.label || lead.lead_status).substring(0, 12), xPos, yPos);
      xPos += leadColWidths[5];
      doc.text((lead.potential_revenue || 0).toString(), xPos, yPos);
      xPos += leadColWidths[6];
      doc.text(createdDate, xPos, yPos);
      
      doc.setDrawColor(200, 200, 200);
      doc.line(leadStartX, yPos + 2, pageWidth - margin, yPos + 2);
      yPos += cellHeight;
    });
  }
  
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
      "Urban Hub Students Accommodations - Confidential",
      pageWidth / 2,
      pageHeight - 5,
      { align: "center" }
    );
  }
  
  // Save PDF
  doc.save(`Urban_Hub_Report_${date.replace(/\//g, "-")}.pdf`);
}

