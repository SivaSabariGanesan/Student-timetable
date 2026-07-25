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

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = env.corsOrigin.split(',').map((s) => s.trim().replace(/\/$/, ''));
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const normalized = origin.replace(/\/$/, '');
    if (allowedOrigins.some((o) => o === normalized)) return cb(null, true);
    cb(null, false);
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/explore', exploreRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/store', storeRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(notFound);
app.use(errorHandler);

export default app;
