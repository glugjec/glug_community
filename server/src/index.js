import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import postRoutes from './routes/posts.routes.js';
import userRoutes from './routes/user.routes.js';
import resourceRoutes from './routes/resource.routes.js';
import adminRoutes from './routes/admin.routes.js';
import compileRoutes from './routes/compile.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import chatRoutes from './routes/chat.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import eventRoutes from './routes/events.routes.js';
import { initBackgroundModerationWorker } from './utils/contentModerator.js';

const app = express();
app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));

// Ensure database connection for all incoming requests (crucial for serverless environments)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('[Database Middleware Error]', err.message);
    res.status(503).json({ error: 'Database service unavailable. Please check MongoDB Atlas connection.' });
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 50 : 500,
  skip: (req) => req.method === 'GET',
  skipSuccessfulRequests: true,
  message: { error: 'Too many failed attempts, please try again after 15 minutes' },
});

const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 600 : 3000,
  message: { error: 'Too many requests, please slow down' },
});

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'glug-api',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', compileRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/events', eventRoutes);

app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Server error',
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    initBackgroundModerationWorker();
    app.listen(PORT, () => {
      console.log(`GLUG API server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;


