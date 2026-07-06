import { jsPDF } from 'jspdf';

interface PaymentData {
  amount: number;
  date: string;
  payment_mode: string;
  reference_id?: string;
  tds_amount?: number;
}

interface CaseData {
  client_name: string;
  mobile?: string;
  email?: string;
  case_type?: string;
  court?: string;
  district?: string;
  file_no?: string;
  registration_no?: string;
  fees_quoted?: number;
  id: string;
}

interface ReceiptData {
  firmName: string;
  caseData: CaseData;
  payments: PaymentData[];
  feesPaid: number;
}

// Format currency without ₹ symbol (jsPDF default fonts don't support it)
const formatINR = (amount: number): string => {
  const rounded = Math.round(amount * 100) / 100;
  return `Rs. ${rounded.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const generateReceipt = (data: ReceiptData) => {
  const { firmName, caseData, payments, feesPaid } = data;

  const doc = new jsPDF();

  // Colors
  const orange: [number, number, number] = [249, 115, 22];
  const gray: [number, number, number] = [148, 163, 184];
  const dark: [number, number, number] = [30, 41, 59];
  const white: [number, number, number] = [255, 255, 255];
  const lightGray: [number, number, number] = [241, 245, 249];

  let yPos = 20;

  // ─── HEADER ───
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...orange);
  doc.text(firmName, 105, yPos, { align: 'center' });

  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...gray);
  doc.text('Legal Office Management System', 105, yPos, { align: 'center' });

  yPos += 5;
  doc.setDrawColor(...orange);
  doc.setLineWidth(0.6);
  doc.line(20, yPos, 190, yPos);

  yPos += 12;

  // ─── RECEIPT INFO ───
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...dark);
  doc.text('PAYMENT RECEIPT', 190, yPos, { align: 'right' });

  yPos += 6;
  const receiptNo = `VD-${caseData.id.slice(-6).toUpperCase()}-${new Date().getFullYear()}`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text(`Receipt No: ${receiptNo}`, 190, yPos, { align: 'right' });

  yPos += 5;
  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  doc.text(`Date: ${today}`, 190, yPos, { align: 'right' });

  yPos += 15;

  // ─── CLIENT & CASE DETAILS ───
  const leftCol = 20;
  const rightCol = 110;

  const addField = (x: number, y: number, label: string, value: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.text(label, x, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...dark);
    doc.text(value || '-', x, y + 5);
    return y + 12;
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...dark);
  doc.text('CLIENT DETAILS', leftCol, yPos);
  doc.text('CASE DETAILS', rightCol, yPos);

  yPos += 8;

  let leftY = yPos;
  leftY = addField(leftCol, leftY, 'Client Name', caseData.client_name);
  leftY = addField(leftCol, leftY, 'Mobile', caseData.mobile || '-');
  leftY = addField(leftCol, leftY, 'Email', caseData.email || '-');

  let rightY = yPos;
  rightY = addField(rightCol, rightY, 'Case Type', caseData.case_type || '-');
  rightY = addField(rightCol, rightY, 'Court', caseData.court || '-');
  rightY = addField(rightCol, rightY, 'District', caseData.district || '-');
  rightY = addField(rightCol, rightY, 'File No', caseData.file_no || '-');
  rightY = addField(rightCol, rightY, 'Reg No', caseData.registration_no || '-');

  yPos = Math.max(leftY, rightY) + 8;

  // ─── PAYMENT SUMMARY BOX ───
  const feesQuoted = Math.round((caseData.fees_quoted || 0) * 100) / 100;
  const balance = Math.round((feesQuoted - feesPaid) * 100) / 100;

  doc.setFillColor(...lightGray);
  doc.rect(20, yPos, 170, 28, 'F');
  doc.setDrawColor(...gray);
  doc.setLineWidth(0.3);
  doc.rect(20, yPos, 170, 28);

  const col1X = 50, col2X = 105, col3X = 160;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text('FEES QUOTED', col1X, yPos + 9, { align: 'center' });
  doc.text('FEES PAID', col2X, yPos + 9, { align: 'center' });
  doc.text('BALANCE DUE', col3X, yPos + 9, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...dark);
  doc.text(formatINR(feesQuoted), col1X, yPos + 20, { align: 'center' });
  doc.text(formatINR(feesPaid), col2X, yPos + 20, { align: 'center' });

  if (balance === 0) doc.setTextColor(34, 197, 94);
  else if (balance > 0) doc.setTextColor(...orange);
  else doc.setTextColor(239, 68, 68);
  doc.text(formatINR(Math.abs(balance)), col3X, yPos + 20, { align: 'center' });

  yPos += 38;

  // ─── PAYMENT HISTORY ───
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...dark);
  doc.text('PAYMENT HISTORY', 20, yPos);

  yPos += 8;

  if (payments.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...gray);
    doc.text('No payments recorded', 105, yPos + 10, { align: 'center' });
    yPos += 20;
  } else {
    const tableTop = yPos;
    const rowHeight = 9;

    // Header
    doc.setFillColor(...dark);
    doc.rect(20, tableTop, 170, rowHeight, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...white);
    doc.text('SR', 25, tableTop + 6);
    doc.text('DATE', 40, tableTop + 6);
    doc.text('AMOUNT', 75, tableTop + 6);
    doc.text('MODE', 110, tableTop + 6);
    doc.text('REFERENCE', 140, tableTop + 6);
    doc.text('TDS', 175, tableTop + 6);

    yPos += rowHeight;

    payments.forEach((payment, index) => {
      if (index % 2 === 1) {
        doc.setFillColor(...lightGray);
        doc.rect(20, yPos, 170, rowHeight, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...dark);

      doc.text(`${index + 1}`, 25, yPos + 6);

      const date = new Date(payment.date);
      const formattedDate = date.toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
      doc.text(formattedDate, 40, yPos + 6);
      doc.text(formatINR(payment.amount), 75, yPos + 6);
      doc.text((payment.payment_mode || '-').toUpperCase(), 110, yPos + 6);
      doc.text(payment.reference_id || '-', 140, yPos + 6);
      doc.text(formatINR(payment.tds_amount || 0), 175, yPos + 6);

      yPos += rowHeight;

      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
    });

    doc.setDrawColor(...gray);
    doc.setLineWidth(0.3);
    doc.rect(20, tableTop, 170, (payments.length + 1) * rowHeight);
  }

  // ─── FOOTER ───
  yPos = 275;
  doc.setDrawColor(...orange);
  doc.setLineWidth(0.5);
  doc.line(20, yPos, 190, yPos);

  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...dark);
  doc.text('Thank you for your payment', 20, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(firmName, 190, yPos, { align: 'right' });

  yPos += 5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(...gray);
  doc.text('This is a computer generated receipt and does not require a signature', 105, yPos, { align: 'center' });

  // ─── SAVE ───
  const cleanName = caseData.client_name.replace(/[^a-zA-Z0-9]/g, '-');
  const dateStr = new Date().toLocaleDateString('en-IN').replace(/\//g, '-');
  const filename = `VakilDesk-Receipt-${cleanName}-${dateStr}.pdf`;

  doc.save(filename);
};
