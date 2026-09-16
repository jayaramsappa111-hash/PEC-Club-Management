import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { queryOne } from '../server/db/database';
import { seedDatabase } from '../server/db/seed';

// Import Route Handlers
import authRoutes from '../server/routes/auth';
import userRoutes from '../server/routes/users';
import clubRoutes from '../server/routes/clubs';
import membershipRoutes from '../server/routes/memberships';
import eventRoutes from '../server/routes/events';
import certificateRoutes from '../server/routes/certificates';
import projectRoutes from '../server/routes/projects';
import resourceRoutes from '../server/routes/resources';
import roadmapRoutes from '../server/routes/roadmaps';
import toolRoutes from '../server/routes/tools';
import announcementRoutes from '../server/routes/announcements';
import notificationRoutes from '../server/routes/notifications';
import analyticsRoutes from '../server/routes/analytics';
import reportRoutes from '../server/routes/reports';
import searchRoutes from '../server/routes/search';
import verifyRoutes from '../server/routes/verify';
import auditRoutes from '../server/routes/audit';
import galleryRoutes from '../server/routes/gallery';

const app = express();

// Middlewares with production CORS support
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Ensure DB is initialized lazily
let isDbSeeded = false;
let dbSeedPromise: Promise<void> | null = null;

async function ensureDbInitialized() {
  if (isDbSeeded) return;
  if (!dbSeedPromise) {
    dbSeedPromise = seedDatabase().then(() => {
      isDbSeeded = true;
    }).catch(err => {
      dbSeedPromise = null;
      console.error('[Vercel DB Init Error]:', err);
      throw err;
    });
  }
  await dbSeedPromise;
}

app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ensureDbInitialized();
    next();
  } catch (err) {
    next(err);
  }
});

// Health checks
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/health/ready', (req: Request, res: Response) => {
  try {
    const result = queryOne('SELECT 1 as alive');
    res.json({ status: 'ready', database: result?.alive === 1 ? 'connected' : 'error' });
  } catch (err: any) {
    res.status(500).json({ status: 'not_ready', error: err.message });
  }
});

// API v1 Routes
const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/', userRoutes);
apiRouter.use('/clubs', clubRoutes);
apiRouter.use('/memberships', membershipRoutes);
apiRouter.use('/events', eventRoutes);
apiRouter.use('/certificates', certificateRoutes);
apiRouter.use('/projects', projectRoutes);
apiRouter.use('/resources', resourceRoutes);
apiRouter.use('/roadmaps', roadmapRoutes);
apiRouter.use('/tools', toolRoutes);
apiRouter.use('/announcements', announcementRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/reports', reportRoutes);
apiRouter.use('/search', searchRoutes);
apiRouter.use('/verify', verifyRoutes);
apiRouter.use('/audit-logs', auditRoutes);
apiRouter.use('/gallery', galleryRoutes);

app.use('/api/v1', apiRouter);
app.use('/api', apiRouter);

// Centralized Error Handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`[Unhandled Vercel API Error] [${req.method} ${req.url}]:`, err);
  res.status(err.status || 500).json({
    code: err.code || 'INTERNAL_ERROR',
    message: err.message || 'An unexpected error occurred',
    details: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
});

export default app;
