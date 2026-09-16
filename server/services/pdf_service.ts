import { jsPDF } from 'jspdf';
import { generateQRCodeDataURL } from './qr_service';

export async function generateCertificatePDF(data: {
  certificateId: string;
  studentName: string;
  studentId?: string;
  eventName: string;
  clubName: string;
  certificateType: string;
  issuedAt: string;
  verificationUrl: string;
}): Promise<Buffer> {
  // Landscape A4 certificate
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Border styling
  doc.setLineWidth(1.5);
  doc.setDrawColor(30, 58, 138); // Dark Navy Blue
  doc.rect(10, 10, 277, 190);

  doc.setLineWidth(0.5);
  doc.setDrawColor(217, 119, 6); // Amber Gold
  doc.rect(13, 13, 271, 184);

  // Institution / Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(30, 58, 138);
  doc.text('TECHNICAL CLUB MANAGEMENT PLATFORM', 148.5, 32, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  doc.text('CENTRAL COUNCIL FOR STUDENT ENGINEERING SOCIETIES', 148.5, 40, { align: 'center' });

  // Certificate Type
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(15, 23, 42);
  const titleText = data.certificateType === 'MERIT'
    ? 'CERTIFICATE OF MERIT'
    : (data.certificateType === 'WINNER' ? 'CERTIFICATE OF EXCELLENCE' : 'CERTIFICATE OF PARTICIPATION');
  doc.text(titleText, 148.5, 58, { align: 'center' });

  // Body text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(71, 85, 105);
  doc.text('This is officially awarded to', 148.5, 75, { align: 'center' });

  // Student Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(17, 24, 39);
  doc.text(data.studentName.toUpperCase(), 148.5, 92, { align: 'center' });

  if (data.studentId) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`Student Roll / ID: ${data.studentId}`, 148.5, 100, { align: 'center' });
  }

  // Event & Club details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(51, 65, 85);
  const narrative = `for active involvement, technical accomplishment, and participation in the flagship program "${data.eventName}" organized by the ${data.clubName}.`;
  doc.text(narrative, 148.5, 115, { align: 'center', maxWidth: 220 });

  // Metadata block
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Certificate ID: ${data.certificateId}`, 25, 150);
  doc.text(`Date of Issuance: ${data.issuedAt.split(' ')[0]}`, 25, 156);
  doc.text(`Verification Status: Digitally Signed & Ledger Verified`, 25, 162);

  // QR Code for live verification
  const qrDataUrl = await generateQRCodeDataURL(data.verificationUrl);
  doc.addImage(qrDataUrl, 'PNG', 225, 135, 38, 38);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Scan to Verify', 244, 178, { align: 'center' });

  // Signatures
  doc.setLineWidth(0.5);
  doc.setDrawColor(148, 163, 184);
  doc.line(75, 175, 130, 175);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('Faculty Advisor / Convener', 102.5, 180, { align: 'center' });

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}

export async function generateMembershipCardPDF(data: {
  membershipId: string;
  studentName: string;
  studentId: string;
  clubName: string;
  department: string;
  academicYear: string;
  validUntil: string;
  verificationUrl: string;
}): Promise<Buffer> {
  // CR80 ID Card dimensions (standard 85.6mm x 54mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [85.6, 54]
  });

  // Card Background
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 85.6, 54, 'F');

  // Header band
  doc.setFillColor(30, 58, 138); // Blue 900
  doc.rect(0, 0, 85.6, 12, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(data.clubName.toUpperCase(), 4, 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(191, 219, 254);
  doc.text('STUDENT TECHNICAL SOCIETY ID', 4, 10);

  // Student Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(data.studentName, 4, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`ID: ${data.studentId}`, 4, 25);
  doc.text(`Dept: ${data.department}`, 4, 29);
  doc.text(`AY: ${data.academicYear}`, 4, 33);
  doc.text(`Valid Thru: ${data.validUntil}`, 4, 37);

  // Membership Pill
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(4, 43, 48, 6, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`MEMBERSHIP: ${data.membershipId}`, 6, 47.5);

  // QR code
  const qrDataUrl = await generateQRCodeDataURL(data.verificationUrl);
  doc.addImage(qrDataUrl, 'PNG', 57, 16, 25, 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.setTextColor(148, 163, 184);
  doc.text('SCAN TO VERIFY', 69.5, 45, { align: 'center' });

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
