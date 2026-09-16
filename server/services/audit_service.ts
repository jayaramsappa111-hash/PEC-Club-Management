import crypto from 'crypto';
import { execute } from '../db/database';

export function logAudit(
  actorId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  metadata?: Record<string, any>
): void {
  try {
    const id = `audit-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const metaStr = metadata ? JSON.stringify(metadata) : null;
    execute(
      `INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, metadata_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, actorId, action, entityType, entityId, metaStr]
    );
  } catch (err) {
    console.error('[Audit Service] Failed to write audit record:', err);
  }
}
