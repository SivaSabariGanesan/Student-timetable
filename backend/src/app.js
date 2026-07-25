import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import env from './config/env.js';
import { errorHandler, notFound } from './middleware/error.js';
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import roomRoutes from './routes/rooms.js';
import facultyRoutes from './routes/faculty.js';
import exploreRoutes from './routes/explore.js';
import dashboardRoutes from './routes/dashboard.js';
import storeRoutes from './routes/store.js';
import userRoutes from './routes/users.js';

const app = express();

// ─── Security headers (V5) ───────────────────────────────────────────────────
// helmet() sets X-Content-Type-Options, X-Frame-Options, X-XSS-Protection,
// Referrer-Policy, and more by default. We layer on a strict CSP here.
app.use(helmet({
  // crossOriginResourcePolicy: allow the frontend (different port in dev) to
  // load API responses, but restrict it to same-site in production.
  crossOriginResourcePolicy: { policy: env.nodeEnv === 'production' ? 'same-site' : 'cross-origin' },

  // Content-Security-Policy: the API only serves JSON — no HTML, no scripts,
  // no media. Lock it down hard so even a misconfigured endpoint can't be used
  // to serve injected content.
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      scriptSrc:  ["'none'"],
      styleSrc:   ["'none'"],
      imgSrc:     ["'none'"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],   // equivalent of X-Frame-Options: DENY
      formAction:  ["'none'"],
    },
  },

  // HSTS: tell browsers to only ever connect over HTTPS for the next year.
  // includeSubDomains and preload are appropriate once you're on a real domain.
  hsts: env.nodeEnv === 'production'
    ? { maxAge: 31536000, includeSubDomains: true }
    : false,

  // Referrer-Policy: don't leak the URL to third parties.
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// Permissions-Policy: opt out of every sensitive browser feature the API
// doesn't use. Helmet doesn't set this header yet, so we add it manually.
app.use((_req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  next();
});

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = env.corsOrigin.split(',').map((s) => s.trim().replace(/\/$/, ''));
app.use(cors({
  origin: (origin, cb) => {
    // Allow server-to-server (no Origin header) only in development.
    if (!origin) {
      return env.nodeEnv === 'production' ? cb(new Error('CORS: no origin')) : cb(null, true);
    }
    const normalized = origin.replace(/\/$/, '');
    if (allowedOrigins.some((o) => o === normalized)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ─── Body parsing ─────────────────────────────────────────────────────────────
// Limit request body size to prevent large-payload DoS.
app.use(express.json({ limit: '16kb' }));
app.use(cookieParser());

// ─── Global rate limiter ──────────────────────────────────────────────────────
// V3: The login endpoint has its own tighter limiter (10 req/15 min) defined
// in routes/auth.js. This global limiter is a backstop for all other /api routes.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});
app.use('/api/', globalLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/students',  studentRoutes);
app.use('/api/rooms',     roomRoutes);
app.use('/api/faculty',   facultyRoutes);
app.use('/api/explore',   exploreRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/store',     storeRoutes);
app.use('/api/users',     userRoutes);

// Health check — intentionally unauthenticated (used by infra probes only).
// Returns minimal info so it can't be used to fingerprint the app.
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ─── Error handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
