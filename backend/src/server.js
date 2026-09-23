// ================= SERVER ENTRY POINT =================
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

const env = require('./config/env');
const { testConnection } = require('./config/database');
const cacheService = require('./services/cacheService');
const routes = require('./api/routes');
const { setupSocket } = require('./api/socket');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// ================= INIT APP =================
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: env.CORS_ORIGIN, methods: ['GET', 'POST'] }
});

// ================= MIDDLEWARE =================
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limit
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: { success: false, error: 'Terlalu banyak request, coba lagi nanti' }
});
app.use('/api', limiter);

// ================= STATIC FILES =================
app.use(express.static(path.join(__dirname, '..', 'public')));

// ================= ROUTES =================
app.use('/api', routes);

// Serve admin.html dan user.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});
app.get('/user', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'user.html'));
});

// ================= ERROR HANDLER =================
app.use(notFound);
app.use(errorHandler);

// ================= SOCKET.IO =================
setupSocket(io);

// ================= START SERVER =================
async function startServer() {
  // Test koneksi database
  const dbOK = await testConnection();
  if (!dbOK) {
    console.error('❌ Database tidak terhubung. Server tidak dijalankan.');
    process.exit(1);
  }

  // Refresh cache awal
  await cacheService.refreshCache();

  // Jalankan server
  server.listen(env.PORT, env.HOST, () => {
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('  🚀 BILLING PERPUS V.2 — BACKEND');
    console.log('═══════════════════════════════════════════');
    console.log(`  ✅ Server running on http://${env.HOST}:${env.PORT}`);
    console.log(`  📊 Admin Panel: http://localhost:${env.PORT}/admin`);
    console.log(`  👤 User Widget: http://localhost:${env.PORT}/user?pc=PC-01`);
    console.log(`  🌍 Mode: ${env.NODE_ENV}`);
    console.log('═══════════════════════════════════════════');
    console.log('');
  });
}

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});

// Start!
startServer();