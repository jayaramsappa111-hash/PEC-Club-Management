import express, { Request, Response } from 'express';
import { queryAll } from '../db/database';

const router = express.Router();

router.get('/', (req: Request, res: Response): void => {
  const query = req.query.q ? String(req.query.q).trim() : '';

  if (!query) {
    res.json({
      clubs: [],
      events: [],
      projects: [],
      resources: [],
      announcements: [],
      tools: []
    });
    return;
  }

  const pattern = `%${query}%`;

  const clubs = queryAll(
    'SELECT id, name, slug, logo, description, domains FROM clubs WHERE name LIKE ? OR description LIKE ? OR domains LIKE ? LIMIT 6',
    [pattern, pattern, pattern]
  );

  const events = queryAll(
    'SELECT id, title, slug, event_type, start_datetime, venue, poster, status FROM events WHERE title LIKE ? OR description LIKE ? LIMIT 6',
    [pattern, pattern]
  );

  const projects = queryAll(
    "SELECT id, title, description, domain, technologies, status, is_featured FROM projects WHERE (title LIKE ? OR description LIKE ? OR technologies LIKE ?) AND status = 'PUBLISHED' LIMIT 6",
    [pattern, pattern, pattern]
  );

  const resources = queryAll(
    "SELECT id, title, description, type, domain, technology, difficulty, file_url FROM resources WHERE (title LIKE ? OR description LIKE ? OR technology LIKE ?) AND status = 'PUBLISHED' LIMIT 6",
    [pattern, pattern, pattern]
  );

  const announcements = queryAll(
    "SELECT id, title, content, category, publish_at FROM announcements WHERE (title LIKE ? OR content LIKE ?) AND status = 'PUBLISHED' LIMIT 5",
    [pattern, pattern]
  );

  const tools = queryAll(
    'SELECT id, name, category, purpose, official_url FROM tools WHERE name LIKE ? OR purpose LIKE ? OR description LIKE ? LIMIT 5',
    [pattern, pattern, pattern]
  );

  res.json({
    query,
    results: {
      clubs,
      events,
      projects,
      resources,
      announcements,
      tools
    }
  });
});

export default router;
