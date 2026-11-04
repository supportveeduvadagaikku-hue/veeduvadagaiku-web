import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { prisma } from './config/database';
import { initFirebase } from './config/firebase';
import { startExpiryScheduler } from './services/validity.service';
import { ensureOwnerNotificationTables } from './services/ownerNotification.service';

const PORT = parseInt(process.env.PORT || '5000', 10);

async function startServer() {
  try {
    // Test database connection
    try {
      await prisma.$connect();
      console.log('[Database] Connected successfully');
      await ensureOwnerNotificationTables();
      console.log('[Database] Owner notification tables are ready');
      // Initialize automatic property validity & expiry scheduler
      startExpiryScheduler();
    } catch (dbError) {
      console.warn('[Database] PostgreSQL Database is not reachable at DATABASE_URL.');
      console.warn('[Database] Update backend/.env with your PostgreSQL credentials (local or hosted like Neon/Supabase) to enable database operations.');
    }

    // Initialize Firebase Admin
    try {
      initFirebase();
      console.log('[Firebase] Admin initialized');
    } catch (fbError) {
      console.warn('[Firebase] Admin credentials not set or invalid.');
      console.warn('[Firebase] Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in backend/.env for authentication.');
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server] Veedu Vadagaikku Chennai API running on http://0.0.0.0:${PORT}`);
      console.log(`[Server] Health check available at http://0.0.0.0:${PORT}/health`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('[Server] Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
