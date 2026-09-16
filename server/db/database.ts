import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

function resolveDatabasePath(): string {
  if (process.env.DATABASE_PATH) {
    return process.env.DATABASE_PATH;
  }
  if (process.env.DATABASE_DIR) {
    return path.join(process.env.DATABASE_DIR, 'database.sqlite');
  }
  if (process.env.VERCEL) {
    return '/tmp/database.sqlite';
  }

  const preferredDir = path.join(process.cwd(), 'data');
  try {
    if (!fs.existsSync(preferredDir)) {
      fs.mkdirSync(preferredDir, { recursive: true });
    }
    const testFile = path.join(preferredDir, '.write_test');
    fs.writeFileSync(testFile, '1');
    fs.unlinkSync(testFile);
    return path.join(preferredDir, 'database.sqlite');
  } catch {
    const tmpDir = '/tmp';
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    return path.join(tmpDir, 'database.sqlite');
  }
}

const DB_PATH = resolveDatabasePath();
const DB_DIR = path.dirname(DB_PATH);
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export const db = new DatabaseSync(DB_PATH);

// Enable WAL mode & foreign keys for concurrency & data integrity
try {
  db.exec('PRAGMA journal_mode = WAL;');
} catch {
  db.exec('PRAGMA journal_mode = DELETE;');
}
db.exec('PRAGMA foreign_keys = ON;');

export function queryAll<T = any>(sql: string, params: (string | number | null | undefined)[] = []): T[] {
  const stmt = db.prepare(sql);
  return stmt.all(...params) as T[];
}

export function queryOne<T = any>(sql: string, params: (string | number | null | undefined)[] = []): T | undefined {
  const stmt = db.prepare(sql);
  return stmt.get(...params) as T | undefined;
}

export function execute(sql: string, params: (string | number | null | undefined)[] = []): { changes: number | bigint; lastInsertRowid: number | bigint } {
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}
