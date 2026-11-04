import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';
import wantedSpaceRoutes from './routes/wantedSpace.routes';

const app = express();

// Trust Railway and reverse proxies for accurate client IP rate-limiting
app.set('trust proxy', 1);

// Ensure uploads folder exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Security headers with cross-origin resource sharing for static image uploads
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Serve static uploads
app.use('/uploads', express.static(uploadsDir));

// Serve property assets from frontend public directory if available
const frontendPublicDir = path.resolve(__dirname, '../../frontend/public');
if (fs.existsSync(frontendPublicDir)) {
  app.use('/indian-properties', express.static(path.join(frontendPublicDir, 'indian-properties')));
  app.use('/properties', express.static(path.join(frontendPublicDir, 'properties')));
}

// CORS — allow production domain + localhost for development
const configuredOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((u) => u.trim().replace(/\/$/, ''))
  .filter(Boolean);

const ALLOWED_ORIGINS = new Set([
  'https://veeduvadagaikkuchennai.com',
  'https://www.veeduvadagaikkuchennai.com',
  'https://veeduvadagaiku-web-te54.vercel.app',
  ...configuredOrigins,
]);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/$/, '');
    if (ALLOWED_ORIGINS.has(cleanOrigin)) return callback(null, true);
    // In development, allow any localhost port
    if (process.env.NODE_ENV !== 'production' && /^http:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true);
    }
    // Allow any Vercel deployment URL for this project (production, preview, branch deploys)
    if (
      cleanOrigin.endsWith('.vercel.app') &&
      cleanOrigin.includes('veeduvadagaiku')
    ) {
      return callback(null, true);
    }
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Visit-Id'],
}));

// Rate limiting
app.use(generalLimiter);

// Body parsing — raw body saved for webhook signature verification
app.use((req, res, next) => {
  if (req.path === '/api/payments/webhook') {
    next(); // handled separately with express.raw in the route
  } else {
    express.json({ limit: '10mb' })(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0-base64-images',
    timestamp: new Date().toISOString(),
    service: 'Veedu Vadagaikku Chennai API',
  });
});

// API routes
app.use('/api', routes);
app.use('/wanted-spaces', wantedSpaceRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
