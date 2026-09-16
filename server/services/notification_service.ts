import crypto from 'crypto';
import { execute } from '../db/database';

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  data?: Record<string, any>
): Promise<string> {
  const id = `notif-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const dataJson = data ? JSON.stringify(data) : null;

  execute(
    `INSERT INTO notifications (id, user_id, type, title, message, data_json)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, userId, type, title, message, dataJson]
  );

  // Email abstraction: If RESEND_API_KEY is configured, dispatch asynchronously
  if (process.env.RESEND_API_KEY) {
    try {
      // Mock/Real Resend dispatch
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.SMTP_FROM || 'noreply@techclubs.edu',
          to: 'student@techclubs.edu',
          subject: title,
          html: `<div style="font-family:sans-serif;padding:20px;"><h2>${title}</h2><p>${message}</p></div>`
        })
      }).catch(e => console.warn('[Email Notification] Resend call failed:', e.message));
    } catch (e) {
      console.warn('[Email Notification] Dispatch error:', e);
    }
  } else {
    // Development fallback logger
    console.log(`[Notification Service] Dispatched to User ${userId} [${type}]: ${title}`);
  }

  return id;
}
