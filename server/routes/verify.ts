import express, { Request, Response } from 'express';
import { queryOne } from '../db/database';

const router = express.Router();

// Public Membership Verification
router.get('/membership/:id', (req: Request, res: Response): void => {
  const { id } = req.params;

  const mem = queryOne<any>(
    `SELECT m.membership_id, m.status, m.joined_at, m.valid_until,
            c.name as club_name, c.logo as club_logo,
            p.name as student_name, p.student_id as student_roll,
            d.name as department_name, d.code as department_code,
            ay.name as academic_year_name
     FROM memberships m
     JOIN clubs c ON c.id = m.club_id
     JOIN academic_years ay ON ay.id = m.academic_year_id
     JOIN profiles p ON p.user_id = m.user_id
     LEFT JOIN departments d ON d.id = c.department_id
     WHERE m.membership_id = ? OR m.id = ?`,
    [id, id]
  );

  if (!mem) {
    res.status(404).json({
      valid: false,
      message: 'Membership not found in official institutional database'
    });
    return;
  }

  const isValid = mem.status === 'ACTIVE' && (!mem.valid_until || new Date() <= new Date(mem.valid_until));

  res.json({
    valid: isValid,
    membership: {
      membershipId: mem.membership_id,
      studentName: mem.student_name,
      studentRoll: mem.student_roll ? `${mem.student_roll.slice(0, 4)}****` : undefined,
      clubName: mem.club_name,
      department: mem.department_code || mem.department_name,
      academicYear: mem.academic_year_name,
      status: mem.status,
      validUntil: mem.valid_until,
      joinedAt: mem.joined_at
    }
  });
});

// Public Certificate Verification
router.get('/certificate/:id', (req: Request, res: Response): void => {
  const { id } = req.params;

  const cert = queryOne<any>(
    `SELECT cert.certificate_id, cert.certificate_type, cert.issued_at, cert.status,
            e.title as event_title, e.start_datetime as event_date,
            c.name as club_name, c.logo as club_logo,
            p.name as student_name, p.student_id as student_roll
     FROM certificates cert
     JOIN events e ON e.id = cert.event_id
     JOIN clubs c ON c.id = e.club_id
     JOIN profiles p ON p.user_id = cert.student_id
     WHERE cert.certificate_id = ? OR cert.id = ?`,
    [id, id]
  );

  if (!cert) {
    res.status(404).json({
      valid: false,
      message: 'Certificate credential not found in centralized verification ledger'
    });
    return;
  }

  const isValid = cert.status === 'VALID';

  res.json({
    valid: isValid,
    status: cert.status,
    certificate: {
      certificateId: cert.certificate_id,
      studentName: cert.student_name,
      eventTitle: cert.event_title,
      clubName: cert.club_name,
      certificateType: cert.certificate_type,
      issuedAt: cert.issued_at,
      status: cert.status
    }
  });
});

// Universal Code Verification (checks certificate or membership)
router.get('/:code', (req: Request, res: Response): void => {
  const { code } = req.params;

  // 1. Try certificate
  const cert = queryOne<any>(
    `SELECT cert.certificate_id, cert.certificate_type, cert.issued_at, cert.status,
            e.title as event_title, e.start_datetime as event_date,
            c.name as club_name, c.logo as club_logo,
            p.name as student_name, p.student_id as student_roll
     FROM certificates cert
     JOIN events e ON e.id = cert.event_id
     JOIN clubs c ON c.id = e.club_id
     JOIN profiles p ON p.user_id = cert.student_id
     WHERE cert.certificate_id = ? OR cert.id = ? OR cert.verification_token = ?`,
    [code, code, code]
  );

  if (cert) {
    res.json({
      valid: cert.status === 'VALID',
      type: 'CERTIFICATE',
      status: cert.status,
      title: cert.event_title,
      certificate: {
        certificateId: cert.certificate_id,
        studentName: cert.student_name,
        eventTitle: cert.event_title,
        clubName: cert.club_name,
        certificateType: cert.certificate_type,
        issuedAt: cert.issued_at,
        status: cert.status
      }
    });
    return;
  }

  // 2. Try membership
  const mem = queryOne<any>(
    `SELECT m.membership_id, m.status, m.joined_at, m.valid_until,
            c.name as club_name, c.logo as club_logo,
            p.name as student_name, p.student_id as student_roll,
            d.name as department_name, d.code as department_code,
            ay.name as academic_year_name
     FROM memberships m
     JOIN clubs c ON c.id = m.club_id
     JOIN academic_years ay ON ay.id = m.academic_year_id
     JOIN profiles p ON p.user_id = m.user_id
     LEFT JOIN departments d ON d.id = c.department_id
     WHERE m.membership_id = ? OR m.id = ?`,
    [code, code]
  );

  if (mem) {
    res.json({
      valid: mem.status === 'ACTIVE' && (!mem.valid_until || new Date() <= new Date(mem.valid_until)),
      type: 'MEMBERSHIP',
      status: mem.status,
      title: mem.club_name,
      membership: {
        membershipId: mem.membership_id,
        studentName: mem.student_name,
        studentRoll: mem.student_roll ? `${mem.student_roll.slice(0, 4)}****` : undefined,
        clubName: mem.club_name,
        department: mem.department_code || mem.department_name,
        academicYear: mem.academic_year_name,
        status: mem.status,
        validUntil: mem.valid_until,
        joinedAt: mem.joined_at
      }
    });
    return;
  }

  res.status(404).json({
    valid: false,
    message: 'Credential code or QR token could not be verified in the institutional registry.'
  });
});

export default router;
