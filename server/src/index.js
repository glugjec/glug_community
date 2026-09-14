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

async function autoSeedIfEmpty() {
  try {
    const { Post } = await import('./models/Post.js');
    const count = await Post.countDocuments();
    if (count === 0) {
      console.log('[Database] Database is empty. Auto-seeding initial GLUG content...');
      const { User } = await import('./models/User.js');
      const { Comment } = await import('./models/Comment.js');
      const { Vote } = await import('./models/Vote.js');

      const passwordHash = await User.hashPassword('glug1234');
      const admin = await User.create({
        username: 'admin',
        email: 'admin@glug.dev',
        passwordHash,
        role: 'admin',
        bio: 'GLUG Club Admin & Linux Enthusiast. Welcome to our open source portal!',
        skills: ['Linux Kernel', 'DevOps', 'Docker', 'C/C++', 'Rust'],
      });

      const studentAlex = await User.create({
        username: 'alex_c',
        email: 'alex@glug.dev',
        passwordHash,
        role: 'student',
        bio: '1st Year Computer Science student exploring open source and Arch Linux.',
        skills: ['Python', 'Bash', 'Git', 'Linux'],
      });

      const studentPriya = await User.create({
        username: 'priya_dev',
        email: 'priya@glug.dev',
        passwordHash,
        role: 'student',
        bio: 'Web dev & systems programming lover. Contributing to FOSS projects.',
        skills: ['React', 'Node.js', 'Go', 'Linux CLI'],
      });

      const p1 = await Post.create({
        author: admin._id,
        title: 'Welcome to GLUG! Getting Started Guide for First-Year Students',
        body: `Welcome to the GNU/Linux User Group! 🐧\n\nIf you are a first-year student or just starting your journey into Linux and open source, here are the first 3 steps to take:\n1. Open our in-browser Linux Terminal on the Home page to practice bash navigation.\n2. Try the online Compiler for your C / Python lab assignments.\n3. Check out the Resources section for recommended distros and tools.\n\nFeel free to ask any questions in the help category!`,
        category: 'general',
        tags: ['welcome', 'first-year', 'getting-started', 'linux'],
        voteScore: 12,
        commentCount: 2,
        isPinned: true,
      });

      const p2 = await Post.create({
        author: studentAlex._id,
        title: 'Dual-booting Ubuntu with Windows 11 — Safe Partitioning Tips?',
        body: `Hey everyone! I'm planning to dual boot Ubuntu 24.04 alongside Windows 11 on my laptop for our college programming labs. Should I disable BitLocker first? What swap space size do you recommend for 16GB RAM?`,
        category: 'help',
        tags: ['ubuntu', 'dual-boot', 'windows11', 'partitioning'],
        voteScore: 8,
        commentCount: 2,
        isPinned: false,
      });

      const p3 = await Post.create({
        author: studentPriya._id,
        title: 'Upcoming Workshop: Git & GitHub from Zero to Open Source Contributor',
        body: `Mark your calendars! We are hosting a hands-on session on Git workflows, resolving merge conflicts, branching strategies, and submitting your very first pull request on open-source repositories.\n\nDate: Saturday, 4:00 PM\nLocation: CS Lab 2 & Online Stream`,
        category: 'events',
        tags: ['workshop', 'git', 'github', 'opensource'],
        voteScore: 15,
        commentCount: 1,
        isPinned: true,
      });

      const p4 = await Post.create({
        author: admin._id,
        title: 'Top 10 CLI Tools Every Developer Should Know in 2026',
        body: `Ditch the slow GUI tools and supercharge your terminal workflow:\n- htop / btop: visual process monitor\n- ripgrep (rg): blazing fast grep replacement\n- fd: intuitive find alternative\n- tmux: terminal multiplexer\n- bat: cat with syntax highlighting and git integration\n\nWhat are your go-to terminal tools?`,
        category: 'linux',
        tags: ['cli', 'tools', 'bash', 'terminal', 'productivity'],
        voteScore: 18,
        commentCount: 0,
        isPinned: false,
      });

      const p5 = await Post.create({
        author: studentAlex._id,
        title: 'Building a simple shell in C — First Year Systems Project',
        body: `Just completed my first mini shell project implementing fork(), execvp(), and pipe handling! Learned a lot about POSIX system calls and file descriptors. Open to code review feedback!`,
        category: 'projects',
        tags: ['c-lang', 'posix', 'shell', 'systems'],
        voteScore: 9,
        commentCount: 1,
        isPinned: false,
      });

      const c1 = await Comment.create({
        post: p1._id,
        author: studentAlex._id,
        body: 'So excited to be here! The browser terminal is super convenient for practicing while on campus.',
      });

      await Comment.create({
        post: p1._id,
        author: admin._id,
        body: 'Glad you like it, Alex! Check out the nano editor inside the terminal as well.',
        parentComment: c1._id,
      });

      const c2 = await Comment.create({
        post: p2._id,
        author: admin._id,
        body: 'Definitely back up your BitLocker recovery key first before touching partition tables! With 16GB RAM, a 4GB-8GB swap file is plenty unless you use hibernation.',
      });

      await Comment.create({
        post: p2._id,
        author: studentPriya._id,
        body: '+1 to BitLocker key backup. Also make sure "Fast Startup" is disabled in Windows power settings so Linux can mount your drives cleanly.',
        parentComment: c2._id,
      });

      const c3 = await Comment.create({
        post: p3._id,
        author: studentAlex._id,
        body: 'Will there be a recording for students who have lab exams during that slot?',
      });

      const c4 = await Comment.create({
        post: p5._id,
        author: studentPriya._id,
        body: 'Awesome work! Handling SIGINT and zombie processes with waitpid() was the trickiest part when I built one. Share the repo link!',
      });

      await Vote.create({ user: admin._id, post: p3._id, value: 1 });
      await Vote.create({ user: studentAlex._id, post: p3._id, value: 1 });
      await Vote.create({ user: studentPriya._id, post: p1._id, value: 1 });

      console.log('[Database] Demo GLUG content seeded successfully.');
    }
  } catch (err) {
    console.warn('[Database] Auto-seed check skipped or failed:', err.message);
  }
}

async function startServer() {
  try {
    await connectDB();
    await autoSeedIfEmpty();
    app.listen(PORT, () => {
      console.log(`🚀 GLUG API server running on http://localhost:${PORT}`);
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


