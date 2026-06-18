import { Case } from '../types';
import * as XLSX from 'xlsx';

// Helper function to format date in Indian format
const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const exportToCSV = (cases: Case[], filename: string = 'cases.csv') => {
  // Ensure filename has .csv extension
  if (!filename.endsWith('.csv')) {
    filename = filename.replace(/\.[^/.]+$/, '') + '.csv';
  }

  const headers = [
    'SR',
    'Client Name',
    'File No',
    'Next Date',
    'Stamp No',
    'Reg No',
    'Status',
    'Case Type',
    'Court',
    'Fees Quoted',
    'Parties',
  ];

  const rows = cases.map((caseItem, index) => [
    index + 1,
    caseItem.clientName,
    caseItem.fileNo,
    formatDate(caseItem.nextDate),
    caseItem.stampNo,
    caseItem.regNo,
    caseItem.status,
    caseItem.caseType,
    caseItem.court,
    caseItem.feesQuoted || 0,
    caseItem.partiesName,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => {
          const cellStr = String(cell);
          // Escape quotes and wrap in quotes if contains comma or quote
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        })
        .join(',')
    ),
  ].join('\n');

  // Add BOM for Excel to recognize UTF-8
  const BOM = '\uFEFF';
  downloadFile(BOM + csvContent, filename, 'text/csv;charset=utf-8');
};

export const exportToExcel = (cases: Case[], filename: string = 'cases.xlsx') => {
  // Ensure .xlsx extension
  filename = filename.replace(/\.[^/.]+$/, '') + '.xlsx';

  const headers = [
    'SR',
    'Client Name',
    'File No',
    'Next Date',
    'Stamp No',
    'Reg No',
    'Status',
    'Case Type',
    'Court',
    'Fees Quoted',
    'Parties',
  ];

  const rows = cases.map((caseItem, index) => [
    index + 1,
    caseItem.clientName,
    caseItem.fileNo,
    formatDate(caseItem.nextDate),
    caseItem.stampNo,
    caseItem.regNo,
    caseItem.status,
    caseItem.caseType,
    caseItem.court,
    caseItem.feesQuoted || 0,
    caseItem.partiesName,
  ]);

  // Build a genuine .xlsx workbook (opens in Excel with no warnings)
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Reasonable column widths
  worksheet['!cols'] = [
    { wch: 5 }, { wch: 22 }, { wch: 12 }, { wch: 13 }, { wch: 12 },
    { wch: 14 }, { wch: 10 }, { wch: 18 }, { wch: 22 }, { wch: 12 }, { wch: 30 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Cases');
  XLSX.writeFile(workbook, filename);
};

export const exportToPDF = (cases: Case[], _filename: string = 'cases.pdf') => {
  const headers = [
    'SR',
    'Client Name',
    'File No',
    'Next Date',
    'Status',
    'Case Type',
    'Fees',
  ];

  const rows = cases.map((caseItem, index) => [
    index + 1,
    caseItem.clientName,
    caseItem.fileNo,
    formatDate(caseItem.nextDate),
    caseItem.status,
    caseItem.caseType,
    `₹${(caseItem.feesQuoted || 0).toLocaleString()}`,
  ]);

  // Create HTML content for PDF
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Case Management Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 20px; background: #fff; }
          .header { text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #FF6B00, #FFA500); color: white; border-radius: 10px; }
          .header h1 { font-size: 24px; margin-bottom: 5px; }
          .header p { font-size: 12px; opacity: 0.9; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
          th { background: linear-gradient(135deg, #FF6B00, #FFA500); color: white; padding: 12px 8px; text-align: left; font-weight: 600; }
          td { padding: 10px 8px; border-bottom: 1px solid #eee; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          tr:hover { background-color: #fff3e0; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
          .total { margin-top: 20px; text-align: right; font-size: 14px; font-weight: bold; }
          @media print {
            body { margin: 0; }
            .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>VakilDesk - Case Management Report</h1>
          <p>Generated on: ${formatDate(new Date())} | Total Cases: ${cases.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              ${headers.map((h) => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
        <div class="total">
          Total Fees: ₹${cases.reduce((sum, c) => sum + (c.feesQuoted || 0), 0).toLocaleString()}
        </div>
        <div class="footer">
          <p>This report was generated from VakilDesk - Legal Office Management System</p>
        </div>
      </body>
    </html>
  `;

  // Open print dialog
  const printWindow = window.open('', '_blank', 'height=800,width=1000');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  }
};

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, 100);
};

export default downloadFile;
