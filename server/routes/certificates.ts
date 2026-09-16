import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { queryAll, queryOne, execute } from '../db/database';
import { authenticate, optionalAuthenticate, AuthenticatedUser } from '../security/auth';
import { requireRole } from '../security/permissions';
import { logAudit } from '../services/audit_service';
import { createNotification } from '../services/notification_service';
import { generateCertificatePDF } from '../services/pdf_service';
import { generateQRCodeDataURL } from '../services/qr_service';

const router = express.Router();

// Get student's certificates
router.get('/my', authenticate, async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user as AuthenticatedUser;

  const certificates = queryAll<any>(
    `SELECT cert.*, e.title as event_title, e.start_datetime as event_date,
            c.name as club_name, p.name as student_name, p.student_id as student_roll
     FROM certificates cert
     JOIN events e ON e.id = cert.event_id
     JOIN clubs c ON c.id = e.club_id
     JOIN profiles p ON p.user_id = cert.student_id
     WHERE cert.student_id = ?
     ORDER BY cert.issued_at DESC`,
    [user.id]
  );

  const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  for (const c of certificates) {
    c.verificationUrl = `${appUrl}/verify/certificate/${c.certificate_id}`;
  }

  res.json({ certificates });
});

// List all certificates (public / admin)
router.get('/', optionalAuthenticate, async (req: Request, res: Response): Promise<void> => {
  const certificates = queryAll<any>(
    `SELECT cert.*, e.title as event_title, e.start_datetime as event_date,
            c.name as club_name, p.name as student_name, p.student_id as student_roll
     FROM certificates cert
     JOIN events e ON e.id = cert.event_id
     JOIN clubs c ON c.id = e.club_id
     JOIN profiles p ON p.user_id = cert.student_id
     ORDER BY cert.issued_at DESC`
  );

  const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  for (const c of certificates) {
    c.verificationUrl = `${appUrl}/verify/certificate/${c.certificate_id}`;
    c.certificate_number = c.certificate_id;
    c.recipient_name = c.student_name;
    c.type = c.certificate_type;
    c.issue_date = c.issued_at;
    c.verification_hash = c.verification_token;
  }

  res.json({ certificates });
});

// Single certificate
router.get('/:id', optionalAuthenticate, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const cert = queryOne<any>(
    `SELECT cert.*, e.title as event_title, e.start_datetime as event_date,
            c.name as club_name, p.name as student_name, p.student_id as student_roll
     FROM certificates cert
     JOIN events e ON e.id = cert.event_id
     JOIN clubs c ON c.id = e.club_id
     JOIN profiles p ON p.user_id = cert.student_id
     WHERE cert.id = ? OR cert.certificate_id = ?`,
    [id, id]
  );

  if (!cert) {
    res.status(404).json({ error: 'Certificate not found' });
    return;
  }

  const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const verificationUrl = `${appUrl}/verify/certificate/${cert.certificate_id}`;
  const qrDataUrl = await generateQRCodeDataURL(verificationUrl);

  res.json({
    certificate: {
      ...cert,
      verificationUrl,
      qrDataUrl
    }
  });
});

// Issue certificates to event attendees (Single or Batch)
router.post('/issue', authenticate, requireRole(['SUPER_ADMIN', 'FACULTY_COORDINATOR', 'CLUB_ADMIN']), async (req: Request, res: Response): Promise<void> => {
  const { event_id, student_ids, recipient_id, certificate_type, type } = req.body;

  let actualEventId = event_id;
  if (!actualEventId) {
    const firstEvt = queryOne<any>('SELECT id FROM events LIMIT 1');
    actualEventId = firstEvt?.id || 'evt-1';
  }

  const students: string[] = Array.isArray(student_ids) && student_ids.length > 0
    ? student_ids
    : (recipient_id ? [recipient_id] : []);

  if (students.length === 0) {
    res.status(400).json({ error: 'event_id and an array of student_ids or recipient_id are required' });
    return;
  }

  const event = queryOne<any>('SELECT * FROM events WHERE id = ?', [actualEventId]);
  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }

  const issuedList: any[] = [];

  for (const studentId of students) {
    // Check if certificate already exists
    const existing = queryOne('SELECT id, certificate_id FROM certificates WHERE event_id = ? AND student_id = ?', [event_id, studentId]);
    if (existing) {
      continue;
    }

    // Verify attendance
    const attendance = queryOne('SELECT id FROM event_attendance WHERE event_id = ? AND user_id = ?', [event_id, studentId]);
    if (!attendance) {
      // Must be an attendee to receive certificate
      continue;
    }

    const countRow = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM certificates');
    const seq = (countRow?.count || 0) + 1;
    const certCode = `CERT-2026-${String(seq).padStart(5, '0')}`;
    const id = `cert-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const verifyToken = `TOKEN-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    execute(
      `INSERT INTO certificates (id, certificate_id, student_id, event_id, certificate_type, verification_token, status)
       VALUES (?, ?, ?, ?, ?, ?, 'VALID')`,
      [id, certCode, studentId, event_id, certificate_type || 'PARTICIPATION', verifyToken]
    );

    logAudit((req as any).user.id, 'CERTIFICATE_ISSUED', 'CERTIFICATE', id, {
      certificateId: certCode,
      studentId,
      eventId: event_id
    });

    await createNotification(
      studentId,
      'CERTIFICATE_AVAILABLE',
      `Certificate Issued: ${event.title}`,
      `Your verified certificate of ${certificate_type || 'PARTICIPATION'} is ready to download.`,
      { certificateId: certCode }
    );

    issuedList.push({ id, certCode, certificate_number: certCode, certificateId: certCode, studentId });
  }

  res.status(201).json({
    message: `Issued ${issuedList.length} certificates successfully`,
    issued: issuedList,
    certificate: issuedList[0] || null
  });
});

// Download PDF
router.get('/:id/pdf', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const cert = queryOne<any>(
    `SELECT cert.*, e.title as event_title, c.name as club_name,
            p.name as student_name, p.student_id as student_roll
     FROM certificates cert
     JOIN events e ON e.id = cert.event_id
     JOIN clubs c ON c.id = e.club_id
     JOIN profiles p ON p.user_id = cert.student_id
     WHERE cert.id = ? OR cert.certificate_id = ?`,
    [id, id]
  );

  if (!cert) {
    res.status(404).json({ error: 'Certificate record not found' });
    return;
  }

  const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const verificationUrl = `${appUrl}/verify/certificate/${cert.certificate_id}`;

  const pdfBuffer = await generateCertificatePDF({
    certificateId: cert.certificate_id,
    studentName: cert.student_name,
    studentId: cert.student_roll,
    eventName: cert.event_title,
    clubName: cert.club_name,
    certificateType: cert.certificate_type,
    issuedAt: cert.issued_at,
    verificationUrl
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=certificate-${cert.certificate_id}.pdf`);
  res.send(pdfBuffer);
});

export default router;
