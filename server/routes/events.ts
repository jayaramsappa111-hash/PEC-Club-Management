import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { queryAll, queryOne, execute } from '../db/database';
import { authenticate, optionalAuthenticate, AuthenticatedUser } from '../security/auth';
import { requireRole } from '../security/permissions';
import { logAudit } from '../services/audit_service';
import { createNotification } from '../services/notification_service';
import { generateQRCodeDataURL } from '../services/qr_service';

const router = express.Router();

// List events
router.get('/', optionalAuthenticate, (req: Request, res: Response, next) => {
  try {
    const { club_id, status, event_type, search } = req.query;

    let sql = `
      SELECT e.*, c.name as club_name, COALESCE(c.logo_url, c.logo) as club_logo, c.slug as club_slug,
             (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id AND er.status = 'CONFIRMED') as confirmed_registrations_count,
             (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id AND er.status = 'WAITLISTED') as waitlisted_count,
             (SELECT COUNT(*) FROM event_attendance ea WHERE ea.event_id = e.id) as attended_count,
             (SELECT AVG(rating) FROM event_feedback ef WHERE ef.event_id = e.id) as avg_rating
      FROM events e
      LEFT JOIN clubs c ON c.id = e.club_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (club_id) {
      sql += ' AND e.club_id = ?';
      params.push(club_id);
    }

    if (status) {
      sql += ' AND e.status = ?';
      params.push(status);
    }

    if (event_type) {
      sql += ' AND e.event_type = ?';
      params.push(event_type);
    }

    if (search) {
      sql += ' AND (e.title LIKE ? OR e.description LIKE ? OR e.venue LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    sql += ' ORDER BY e.start_datetime DESC';

    const events = queryAll(sql, params);
    res.json({ events });
  } catch (err) {
    next(err);
  }
});

// My Registered Events
router.get('/registrations/my', authenticate, (req: Request, res: Response): void => {
  const user = (req as any).user as AuthenticatedUser;

  const registrations = queryAll<any>(
    `SELECT er.*, e.title as event_title, e.start_datetime, e.end_datetime,
            e.venue, e.event_type, e.poster, c.name as club_name
     FROM event_registrations er
     JOIN events e ON e.id = er.event_id
     JOIN clubs c ON c.id = e.club_id
     WHERE er.user_id = ?
     ORDER BY e.start_datetime ASC`,
    [user.id]
  );

  res.json({ registrations });
});

// Single Event Details
router.get('/:id', optionalAuthenticate, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const event = queryOne<any>(
    `SELECT e.*, c.name as club_name, c.logo as club_logo, c.slug as club_slug,
            (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id AND er.status = 'CONFIRMED') as confirmed_registrations_count,
            (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id AND er.status = 'WAITLISTED') as waitlisted_count,
            (SELECT COUNT(*) FROM event_attendance ea WHERE ea.event_id = e.id) as attended_count,
            (SELECT AVG(rating) FROM event_feedback ef WHERE ef.event_id = e.id) as avg_rating,
            (SELECT COUNT(*) FROM event_feedback ef WHERE ef.event_id = e.id) as feedback_count
     FROM events e
     JOIN clubs c ON c.id = e.club_id
     WHERE e.id = ? OR e.slug = ?`,
    [id, id]
  );

  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }

  let userRegistration = null;
  let userAttendance = null;
  let userFeedback = null;

  const user = (req as any).user;
  if (user) {
    userRegistration = queryOne<any>(
      'SELECT * FROM event_registrations WHERE event_id = ? AND user_id = ?',
      [event.id, user.id]
    );

    if (userRegistration) {
      // Attach QR Data URL for ticket check-in pass
      const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
      const checkInPayload = JSON.stringify({
        eventId: event.id,
        regId: userRegistration.id,
        token: userRegistration.qr_code_token
      });
      userRegistration.qrDataUrl = await generateQRCodeDataURL(checkInPayload);
    }

    userAttendance = queryOne<any>(
      'SELECT * FROM event_attendance WHERE event_id = ? AND user_id = ?',
      [event.id, user.id]
    );

    userFeedback = queryOne<any>(
      'SELECT * FROM event_feedback WHERE event_id = ? AND user_id = ?',
      [event.id, user.id]
    );
  }

  res.json({
    event,
    userRegistration,
    userAttendance,
    userFeedback
  });
});

// Create Event
router.post('/', authenticate, requireRole(['SUPER_ADMIN', 'CLUB_ADMIN', 'FACULTY_COORDINATOR']), (req: Request, res: Response): void => {
  const user = (req as any).user as AuthenticatedUser;
  const {
    club_id, title, slug, description, event_type,
    start_datetime, end_datetime, venue, eligibility,
    capacity, registration_deadline, poster, circular
  } = req.body;

  if (!club_id || !title || !start_datetime || !end_datetime || !venue) {
    res.status(400).json({ error: 'Missing required event fields' });
    return;
  }

  const actualSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const existing = queryOne('SELECT id FROM events WHERE slug = ?', [actualSlug]);
  if (existing) {
    res.status(409).json({ error: 'An event with this slug already exists' });
    return;
  }

  const id = `evt-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const isFacultyOrSuper = user.roles.includes('SUPER_ADMIN') || user.roles.includes('FACULTY_COORDINATOR');

  execute(
    `INSERT INTO events (
      id, club_id, title, slug, description, event_type,
      start_datetime, end_datetime, venue, eligibility,
      capacity, registration_deadline, poster, circular,
      status, created_by, approved_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, club_id, title, actualSlug, description || '', event_type || 'WORKSHOP',
      start_datetime, end_datetime, venue, eligibility || 'Open to all students',
      capacity ? Number(capacity) : 100, registration_deadline || null,
      poster || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
      circular || null,
      isFacultyOrSuper ? 'REGISTRATION_OPEN' : 'PENDING_APPROVAL',
      user.id,
      isFacultyOrSuper ? user.id : null
    ]
  );

  logAudit(user.id, 'EVENT_CREATED', 'EVENT', id, { title, clubId: club_id });

  res.status(201).json({ message: 'Event created successfully', eventId: id, slug: actualSlug });
});

// Update event status
router.patch('/:id/status', authenticate, requireRole(['SUPER_ADMIN', 'FACULTY_COORDINATOR', 'CLUB_ADMIN']), (req: Request, res: Response): void => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'ONGOING', 'COMPLETED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  execute('UPDATE events SET status = ? WHERE id = ?', [status, id]);
  logAudit((req as any).user.id, 'EVENT_STATUS_CHANGED', 'EVENT', id, { status });

  res.json({ message: `Event status updated to ${status}` });
});

// Register for event
router.post('/:id/register', authenticate, async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user as AuthenticatedUser;
  const { id: eventId } = req.params;

  const event = queryOne<any>('SELECT * FROM events WHERE id = ?', [eventId]);
  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }

  if (event.status === 'CANCELLED' || event.status === 'COMPLETED') {
    res.status(400).json({ error: `Registrations are closed (Event is ${event.status})` });
    return;
  }

  // Check deadline
  if (event.registration_deadline && new Date() > new Date(event.registration_deadline)) {
    res.status(400).json({ error: 'Registration deadline has passed' });
    return;
  }

  // Check duplicate
  const existing = queryOne('SELECT id, status FROM event_registrations WHERE event_id = ? AND user_id = ?', [eventId, user.id]);
  if (existing) {
    res.status(409).json({ error: `You have already registered for this event (Status: ${existing.status})` });
    return;
  }

  // Check capacity
  const confirmedRow = queryOne<{ count: number }>(
    "SELECT COUNT(*) as count FROM event_registrations WHERE event_id = ? AND status = 'CONFIRMED'",
    [eventId]
  );
  const confirmedCount = confirmedRow?.count || 0;
  const isFull = confirmedCount >= (event.capacity || 100);

  const regStatus = isFull ? 'WAITLISTED' : 'CONFIRMED';
  const regId = `reg-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const qrToken = `QR-EVT-${eventId.slice(-4).toUpperCase()}-${user.id.slice(-4).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  execute(
    `INSERT INTO event_registrations (id, event_id, user_id, status, qr_code_token)
     VALUES (?, ?, ?, ?, ?)`,
    [regId, eventId, user.id, regStatus, qrToken]
  );

  logAudit(user.id, 'EVENT_REGISTERED', 'EVENT_REGISTRATION', regId, { eventId, status: regStatus });

  await createNotification(
    user.id,
    'EVENT_REGISTRATION',
    regStatus === 'CONFIRMED' ? `Seat Confirmed: ${event.title}` : `Waitlisted: ${event.title}`,
    regStatus === 'CONFIRMED'
      ? `You are confirmed for ${event.title}. Bring your digital entry QR code on ${event.start_datetime}.`
      : `Event capacity is currently reached. You are on the waitlist and will be auto-promoted if seats open.`,
    { eventId, registrationId: regId }
  );

  res.status(201).json({
    message: regStatus === 'CONFIRMED' ? 'Registration confirmed!' : 'Registered to waitlist',
    registrationId: regId,
    status: regStatus,
    qrToken
  });
});

// Event registrations list for Admin
router.get('/:id/registrations', authenticate, requireRole(['SUPER_ADMIN', 'FACULTY_COORDINATOR', 'CLUB_ADMIN']), (req: Request, res: Response): void => {
  const { id } = req.params;

  const registrations = queryAll(
    `SELECT er.*, p.name as student_name, p.student_id as student_roll, p.course, p.phone, u.email,
            ea.check_in_time, ea.status as attendance_status
     FROM event_registrations er
     JOIN users u ON u.id = er.user_id
     JOIN profiles p ON p.user_id = er.user_id
     LEFT JOIN event_attendance ea ON ea.registration_id = er.id
     WHERE er.event_id = ?
     ORDER BY er.created_at ASC`,
    [id]
  );

  res.json({ registrations });
});

// QR Code Check-in & Attendance Verification
router.post('/:id/attendance/check-in', authenticate, requireRole(['SUPER_ADMIN', 'FACULTY_COORDINATOR', 'CLUB_ADMIN']), async (req: Request, res: Response): Promise<void> => {
  const { id: eventId } = req.params;
  const { qrToken, registrationId } = req.body;

  if (!qrToken && !registrationId) {
    res.status(400).json({ error: 'qrToken or registrationId is required for check-in' });
    return;
  }

  let registration;
  if (qrToken) {
    registration = queryOne<any>(
      'SELECT * FROM event_registrations WHERE event_id = ? AND qr_code_token = ?',
      [eventId, qrToken]
    );
  } else {
    registration = queryOne<any>(
      'SELECT * FROM event_registrations WHERE event_id = ? AND id = ?',
      [eventId, registrationId]
    );
  }

  if (!registration) {
    res.status(404).json({ error: 'Valid registration pass not found for this event' });
    return;
  }

  if (registration.status !== 'CONFIRMED') {
    res.status(400).json({ error: `Cannot check in: Registration is ${registration.status}` });
    return;
  }

  // Prevent duplicate check-in
  const existingAttendance = queryOne('SELECT id, check_in_time FROM event_attendance WHERE registration_id = ?', [registration.id]);
  if (existingAttendance) {
    res.status(409).json({
      error: 'Student already checked in for this event',
      checkInTime: existingAttendance.check_in_time
    });
    return;
  }

  const attId = `att-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  execute(
    `INSERT INTO event_attendance (id, event_id, registration_id, user_id, status, recorded_by)
     VALUES (?, ?, ?, ?, 'PRESENT', ?)`,
    [attId, eventId, registration.id, registration.user_id, (req as any).user.id]
  );

  const studentProfile = queryOne<{ name: string; student_id: string }>(
    'SELECT name, student_id FROM profiles WHERE user_id = ?',
    [registration.user_id]
  );

  logAudit((req as any).user.id, 'ATTENDANCE_RECORDED', 'ATTENDANCE', attId, {
    eventId,
    studentId: registration.user_id,
    studentName: studentProfile?.name
  });

  await createNotification(
    registration.user_id,
    'ATTENDANCE_VERIFIED',
    'Attendance Verified!',
    'Your check-in has been validated. Thank you for participating.',
    { eventId }
  );

  res.status(201).json({
    message: 'Check-in recorded successfully',
    student: studentProfile,
    checkInTime: new Date().toISOString()
  });
});

// Self-check-in for registered students scanning the projected Event QR code
router.post('/:id/attendance/self-check-in', authenticate, async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user as AuthenticatedUser;
  const { id: eventId } = req.params;
  const { code } = req.body;

  if (code !== `PU-EVENT-CHECKIN-${eventId}` && code !== eventId) {
    res.status(400).json({ error: 'Invalid or expired event QR code' });
    return;
  }

  const registration = queryOne<any>(
    "SELECT * FROM event_registrations WHERE event_id = ? AND user_id = ? AND status = 'CONFIRMED'",
    [eventId, user.id]
  );

  if (!registration) {
    res.status(400).json({ error: 'You are not registered (or confirmed) for this event. Please register first.' });
    return;
  }

  // Prevent duplicate check-in
  const existingAttendance = queryOne('SELECT id, check_in_time FROM event_attendance WHERE registration_id = ?', [registration.id]);
  if (existingAttendance) {
    res.status(409).json({
      error: 'You have already checked in for this event',
      checkInTime: existingAttendance.check_in_time
    });
    return;
  }

  const attId = `att-self-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  execute(
    `INSERT INTO event_attendance (id, event_id, registration_id, user_id, status, recorded_by)
     VALUES (?, ?, ?, ?, 'PRESENT', ?)`,
    [attId, eventId, registration.id, user.id, user.id]
  );

  logAudit(user.id, 'ATTENDANCE_RECORDED', 'ATTENDANCE', attId, {
    eventId,
    studentId: user.id,
    method: 'SELF_QR_SCAN'
  });

  await createNotification(
    user.id,
    'ATTENDANCE_VERIFIED',
    'Attendance Verified!',
    'Your self-check-in was validated successfully using the event QR code. Enjoy the session!',
    { eventId }
  );

  res.status(201).json({
    message: 'Attendance recorded successfully!',
    checkInTime: new Date().toISOString()
  });
});

// Submit Feedback
router.post('/:id/feedback', authenticate, async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user as AuthenticatedUser;
  const { id: eventId } = req.params;
  const { rating, comments, suggestions } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    return;
  }

  // Verify attendance was recorded
  const attendance = queryOne('SELECT id FROM event_attendance WHERE event_id = ? AND user_id = ?', [eventId, user.id]);
  if (!attendance) {
    res.status(403).json({ error: 'Only verified attendees can submit feedback' });
    return;
  }

  const fbId = `fb-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  execute(
    `INSERT INTO event_feedback (id, event_id, user_id, rating, comments, suggestions)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(event_id, user_id) DO UPDATE SET
      rating = excluded.rating,
      comments = excluded.comments,
      suggestions = excluded.suggestions`,
    [fbId, eventId, user.id, rating, comments || '', suggestions || '']
  );

  res.status(201).json({ message: 'Feedback submitted successfully' });
});

// View Feedback for event
router.get('/:id/feedback', optionalAuthenticate, (req: Request, res: Response): void => {
  const { id } = req.params;
  const user = (req as any).user;
  const isAdmin = user && user.roles.some((r: string) => ['SUPER_ADMIN', 'FACULTY_COORDINATOR', 'CLUB_ADMIN'].includes(r));

  const feedbacks = queryAll(
    `SELECT ef.*, ${isAdmin ? 'p.name as student_name' : "'Anonymous Student' as student_name"}
     FROM event_feedback ef
     LEFT JOIN profiles p ON p.user_id = ef.user_id
     WHERE ef.event_id = ?
     ORDER BY ef.created_at DESC`,
    [id]
  );
  res.json({ feedbacks });
});

// Self-run migrations on load to ensure columns exist for attendance claims and certificate requests
try {
  execute("ALTER TABLE event_registrations ADD COLUMN attendance_claim_status TEXT DEFAULT 'NONE'");
} catch (e) {
  // Column already exists or handled
}
try {
  execute("ALTER TABLE event_registrations ADD COLUMN attendance_claim_time DATETIME");
} catch (e) {
  // Column already exists
}

// Student: Raise claim request for authorizing attendance and certificate eligibility
router.post('/:id/claim-attendance', authenticate, async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user as AuthenticatedUser;
  const { id: eventId } = req.params;

  const registration = queryOne<any>(
    'SELECT * FROM event_registrations WHERE event_id = ? AND user_id = ?',
    [eventId, user.id]
  );

  if (!registration) {
    res.status(404).json({ error: 'No registration pass found. You must be registered to claim attendance.' });
    return;
  }

  execute(
    `UPDATE event_registrations 
     SET attendance_claim_status = 'PENDING', attendance_claim_time = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [registration.id]
  );

  logAudit(user.id, 'ATTENDANCE_CLAIM_REQUESTED', 'EVENT_REGISTRATION', registration.id, { eventId });

  res.json({
    message: 'Attendance claim and certificate request successfully raised. Pending Coordinator validation.',
    status: 'PENDING'
  });
});

// Admin: Get all registrations with pending or approved claims
router.get('/:id/claims', authenticate, requireRole(['SUPER_ADMIN', 'FACULTY_COORDINATOR', 'CLUB_ADMIN']), (req: Request, res: Response): void => {
  const { id: eventId } = req.params;

  const claims = queryAll(
    `SELECT er.*, p.name as student_name, p.student_id as student_roll, p.course, u.email,
            ea.check_in_time, ea.status as attendance_status,
            c.id as certificate_record_id, c.certificate_id as certificate_code
     FROM event_registrations er
     JOIN users u ON u.id = er.user_id
     JOIN profiles p ON p.user_id = er.user_id
     LEFT JOIN event_attendance ea ON ea.registration_id = er.id
     LEFT JOIN certificates c ON c.student_id = er.user_id AND c.event_id = er.event_id
     WHERE er.event_id = ? AND er.attendance_claim_status IS NOT NULL AND er.attendance_claim_status != 'NONE'
     ORDER BY er.attendance_claim_time DESC`,
    [eventId]
  );

  res.json({ claims });
});

// Admin: Approve student attendance claim and immediately generate certificate
router.post('/:id/approve-claim', authenticate, requireRole(['SUPER_ADMIN', 'FACULTY_COORDINATOR', 'CLUB_ADMIN']), async (req: Request, res: Response): Promise<void> => {
  const { id: eventId } = req.params;
  const { registration_id, action, certificate_type } = req.body; // action: 'APPROVE' or 'REJECT'

  if (!registration_id || !action) {
    res.status(400).json({ error: 'registration_id and action (APPROVE or REJECT) are required' });
    return;
  }

  const registration = queryOne<any>(
    'SELECT * FROM event_registrations WHERE event_id = ? AND id = ?',
    [eventId, registration_id]
  );

  if (!registration) {
    res.status(404).json({ error: 'Registration record not found' });
    return;
  }

  const event = queryOne<any>('SELECT * FROM events WHERE id = ?', [eventId]);
  if (!event) {
    res.status(404).json({ error: 'Event details not found' });
    return;
  }

  if (action === 'REJECT') {
    execute(
      "UPDATE event_registrations SET attendance_claim_status = 'REJECTED' WHERE id = ?",
      [registration_id]
    );

    await createNotification(
      registration.user_id,
      'CLAIM_REJECTED',
      'Attendance Claim Disapproved',
      `Your attendance claim for ${event.title} was declined by the coordinator. Contact support if this is an error.`,
      { eventId }
    );

    res.json({ message: 'Claim request successfully rejected.', status: 'REJECTED' });
    return;
  }

  // Action is APPROVE: Update status
  execute(
    "UPDATE event_registrations SET attendance_claim_status = 'APPROVED' WHERE id = ?",
    [registration_id]
  );

  // 1. Record physical event attendance if not already set
  const existingAttendance = queryOne('SELECT id FROM event_attendance WHERE registration_id = ?', [registration_id]);
  if (!existingAttendance) {
    const attId = `att-claim-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    execute(
      `INSERT INTO event_attendance (id, event_id, registration_id, user_id, status, recorded_by)
       VALUES (?, ?, ?, ?, 'PRESENT', ?)`,
      [attId, eventId, registration_id, registration.user_id, (req as any).user.id]
    );
  }

  // 2. Immediately mint and generate verified digital certificate!
  const existingCert = queryOne('SELECT id, certificate_id FROM certificates WHERE event_id = ? AND student_id = ?', [eventId, registration.user_id]);
  let certCode = '';

  if (!existingCert) {
    const countRow = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM certificates');
    const seq = (countRow?.count || 0) + 1;
    certCode = `CERT-2026-${String(seq).padStart(5, '0')}`;
    const certId = `cert-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const verifyToken = `TOKEN-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    execute(
      `INSERT INTO certificates (id, certificate_id, student_id, event_id, certificate_type, verification_token, status)
       VALUES (?, ?, ?, ?, ?, ?, 'VALID')`,
      [certId, certCode, registration.user_id, eventId, certificate_type || 'PARTICIPATION', verifyToken]
    );

    logAudit((req as any).user.id, 'CERTIFICATE_ISSUED', 'CERTIFICATE', certId, {
      certificateId: certCode,
      studentId: registration.user_id,
      eventId
    });

    await createNotification(
      registration.user_id,
      'CERTIFICATE_AVAILABLE',
      'Certificate Ready!',
      `Congratulations! Your official verified certificate for "${event.title}" has been issued. Check your profile!`,
      { certificateId: certCode }
    );
  } else {
    certCode = (existingCert as any).certificate_id;
  }

  res.json({
    message: 'Attendance claim approved. Verifiable certificate generated successfully!',
    status: 'APPROVED',
    certificateCode: certCode
  });
});

export default router;
