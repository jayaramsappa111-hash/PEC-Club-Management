import express, { Request, Response } from 'express';
import { queryAll, queryOne } from '../db/database';
import { authenticate } from '../security/auth';
import { requireRole } from '../security/permissions';
import { generateExcelBuffer } from '../services/excel_service';
import { jsPDF } from 'jspdf';

const router = express.Router();

// Report Data query with filters
router.get('/data', authenticate, requireRole(['SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'FACULTY_COORDINATOR', 'CLUB_ADMIN']), (req: Request, res: Response) => {
  const { type, club_id, department_id, event_id } = req.query;

  if (type === 'event') {
    let sql = `
      SELECT er.id as registration_id, er.status as reg_status, er.created_at as registered_at,
             p.name as student_name, p.student_id as student_roll, p.course, u.email,
             e.title as event_title, e.start_datetime as event_date, c.name as club_name,
             ea.check_in_time, ea.status as attendance_status,
             ef.rating as feedback_rating, ef.comments as feedback_comments
      FROM event_registrations er
      JOIN events e ON e.id = er.event_id
      JOIN clubs c ON c.id = e.club_id
      JOIN users u ON u.id = er.user_id
      JOIN profiles p ON p.user_id = er.user_id
      LEFT JOIN event_attendance ea ON ea.registration_id = er.id
      LEFT JOIN event_feedback ef ON ef.event_id = e.id AND ef.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (event_id) {
      sql += ' AND er.event_id = ?';
      params.push(event_id);
    }
    if (club_id) {
      sql += ' AND e.club_id = ?';
      params.push(club_id);
    }
    sql += ' ORDER BY er.created_at ASC';
    const rows = queryAll(sql, params);
    res.json({ reportType: 'event', data: rows });
    return;
  }

  if (type === 'club') {
    let sql = `
      SELECT m.membership_id, m.status as membership_status, m.joined_at, m.valid_until,
             p.name as student_name, p.student_id as student_roll, p.course, p.phone, u.email,
             c.name as club_name, d.name as department_name, ay.name as academic_year
      FROM memberships m
      JOIN clubs c ON c.id = m.club_id
      JOIN users u ON u.id = m.user_id
      JOIN profiles p ON p.user_id = m.user_id
      LEFT JOIN departments d ON d.id = c.department_id
      JOIN academic_years ay ON ay.id = m.academic_year_id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (club_id) {
      sql += ' AND m.club_id = ?';
      params.push(club_id);
    }
    sql += ' ORDER BY m.joined_at DESC';
    const rows = queryAll(sql, params);
    res.json({ reportType: 'club', data: rows });
    return;
  }

  // Default: System Summary report
  const summaryRows = queryAll(`
    SELECT c.name as club_name, c.status as club_status, d.name as department_name,
           (SELECT COUNT(*) FROM memberships m WHERE m.club_id = c.id AND m.status = 'ACTIVE') as active_members,
           (SELECT COUNT(*) FROM events e WHERE e.club_id = c.id) as total_events,
           (SELECT COUNT(*) FROM event_attendance ea JOIN events e ON e.id = ea.event_id WHERE e.club_id = c.id) as total_attendance,
           (SELECT COUNT(*) FROM certificates cert JOIN events e ON e.id = cert.event_id WHERE e.club_id = c.id) as certificates_issued
    FROM clubs c
    LEFT JOIN departments d ON d.id = c.department_id
    ORDER BY active_members DESC
  `);
  res.json({ reportType: 'summary', data: summaryRows });
});

// Export to Excel (XLSX)
router.get('/export/excel', authenticate, requireRole(['SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'FACULTY_COORDINATOR', 'CLUB_ADMIN']), (req: Request, res: Response) => {
  const { type, club_id, event_id } = req.query;

  let sheetName = 'Report';
  let data: Record<string, any>[] = [];

  if (type === 'event') {
    sheetName = 'Event Registrations';
    const params: any[] = [];
    let sql = `
      SELECT er.id as Registration_ID, p.name as Student_Name, p.student_id as Student_Roll,
             u.email as Email, p.course as Course, e.title as Event_Title, er.status as Reg_Status,
             COALESCE(ea.status, 'ABSENT') as Attendance_Status, ea.check_in_time as Check_In_Time,
             ef.rating as Feedback_Rating, ef.comments as Comments
      FROM event_registrations er
      JOIN events e ON e.id = er.event_id
      JOIN users u ON u.id = er.user_id
      JOIN profiles p ON p.user_id = er.user_id
      LEFT JOIN event_attendance ea ON ea.registration_id = er.id
      LEFT JOIN event_feedback ef ON ef.event_id = e.id AND ef.user_id = u.id
      WHERE 1=1
    `;
    if (event_id) {
      sql += ' AND er.event_id = ?';
      params.push(event_id);
    }
    data = queryAll(sql, params);
  } else if (type === 'club') {
    sheetName = 'Club Memberships';
    const params: any[] = [];
    let sql = `
      SELECT m.membership_id as Membership_ID, p.name as Student_Name, p.student_id as Student_Roll,
             u.email as Email, c.name as Club_Name, m.status as Status, m.joined_at as Joined_Date,
             m.valid_until as Valid_Until, ay.name as Academic_Year
      FROM memberships m
      JOIN clubs c ON c.id = m.club_id
      JOIN users u ON u.id = m.user_id
      JOIN profiles p ON p.user_id = m.user_id
      JOIN academic_years ay ON ay.id = m.academic_year_id
      WHERE 1=1
    `;
    if (club_id) {
      sql += ' AND m.club_id = ?';
      params.push(club_id);
    }
    data = queryAll(sql, params);
  } else {
    sheetName = 'System Activity Summary';
    data = queryAll(`
      SELECT c.name as Club_Name, c.status as Club_Status, d.name as Department,
             (SELECT COUNT(*) FROM memberships m WHERE m.club_id = c.id AND m.status = 'ACTIVE') as Active_Members,
             (SELECT COUNT(*) FROM events e WHERE e.club_id = c.id) as Total_Events,
             (SELECT COUNT(*) FROM event_attendance ea JOIN events e ON e.id = ea.event_id WHERE e.club_id = c.id) as Total_Attendance,
             (SELECT COUNT(*) FROM certificates cert JOIN events e ON e.id = cert.event_id WHERE e.club_id = c.id) as Certificates_Issued
      FROM clubs c
      LEFT JOIN departments d ON d.id = c.department_id
    `);
  }

  const excelBuffer = generateExcelBuffer(sheetName, data.length > 0 ? data : [{ message: 'No records available for criteria' }]);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=${sheetName.replace(/\s+/g, '_')}_${Date.now()}.xlsx`);
  res.send(excelBuffer);
});

// Export to PDF
router.get('/export/pdf', authenticate, requireRole(['SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'FACULTY_COORDINATOR', 'CLUB_ADMIN']), (req: Request, res: Response) => {
  const { type, club_id } = req.query;

  const doc = new jsPDF();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 58, 138);
  doc.text('TECHNICAL CLUB MANAGEMENT PLATFORM', 14, 20);

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(`Official Analytical Report - ${type ? String(type).toUpperCase() : 'SUMMARY'}`, 14, 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated at: ${new Date().toISOString()} | Authorized Academic Export`, 14, 34);

  // Table summary
  const params: any[] = [];
  let sql = `
    SELECT c.name as club_name, c.status as club_status,
           (SELECT COUNT(*) FROM memberships m WHERE m.club_id = c.id AND m.status = 'ACTIVE') as active_members,
           (SELECT COUNT(*) FROM events e WHERE e.club_id = c.id) as total_events,
           (SELECT COUNT(*) FROM event_attendance ea JOIN events e ON e.id = ea.event_id WHERE e.club_id = c.id) as total_attendance
    FROM clubs c
    WHERE 1=1
  `;
  if (club_id) {
    sql += ' AND c.id = ?';
    params.push(club_id);
  }
  sql += ' ORDER BY active_members DESC';

  const rows = queryAll<any>(sql, params);

  let y = 46;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('Club Name', 14, y);
  doc.text('Status', 90, y);
  doc.text('Members', 120, y);
  doc.text('Events', 150, y);
  doc.text('Attendance', 175, y);

  doc.setLineWidth(0.3);
  doc.setDrawColor(203, 213, 225);
  doc.line(14, y + 2, 196, y + 2);

  y += 8;
  doc.setFont('helvetica', 'normal');
  for (const r of rows) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(r.club_name.slice(0, 36), 14, y);
    doc.text(r.club_status, 90, y);
    doc.text(String(r.active_members), 120, y);
    doc.text(String(r.total_events), 150, y);
    doc.text(String(r.total_attendance), 175, y);
    y += 7;
  }

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Technical_Club_Report_${Date.now()}.pdf`);
  res.send(pdfBuffer);
});

export default router;
