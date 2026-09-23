// ================= TIMER SERVICE =================
// Menghitung sisa waktu setiap PC & broadcast ke semua client

const pcModel = require('../models/pcModel');
const cacheService = require('./cacheService');
const { formatHHMMSS } = require('../utils/formatTime');

let io = null;

/**
 * Set Socket.IO instance
 */
function setIO(socketIO) {
  io = socketIO;
}

/**
 * Hitung sisa detik untuk sebuah PC
 */
function calculateRemaining(pc) {
  if (pc.status === 'in-use' && pc.start_time && pc.current_duration_minutes) {
    const startTimeMs = new Date(pc.start_time).getTime();
    const durationMs = pc.current_duration_minutes * 60 * 1000;
    const elapsedMs = Date.now() - startTimeMs;
    const leftMs = durationMs - elapsedMs;
    return Math.max(0, Math.floor(leftMs / 1000));
  } else if (pc.status === 'paused') {
    return Number(pc.remaining_paused_seconds) || 0;
  }
  return 0;
}

/**
 * Broadcast data PC ke semua client
 */
async function broadcastPCs() {
  try {
    const pcs = await pcModel.getAllPCs();

    const formatted = pcs.map(pc => {
      const remainingSeconds = calculateRemaining(pc);
      const todaySessions = pc.user_name ? cacheService.getSessionCount(pc.user_name) : 0;
      const durationMin = Number(pc.current_duration_minutes) || 0;
      const saldoHours = durationMin > 0 ? (durationMin / 60).toFixed(1) : '-';

      return {
        ...pc,
        today_sessions: todaySessions,
        saldo_hours: saldoHours,
        remaining_seconds: remainingSeconds,
        formatted_time: formatHHMMSS(remainingSeconds)
      };
    });

    if (io) {
      io.emit('update_pcs', formatted);
    }
  } catch (err) {
    console.error('[Timer] Broadcast error:', err.message);
  }
}

/**
 * Mulai interval broadcast (setiap 1 detik)
 */
function startBroadcast() {
  setInterval(() => {
    broadcastPCs();
  }, 1000);
  console.log('[Timer] Broadcast started (1s interval)');
}

module.exports = {
  setIO,
  broadcastPCs,
  startBroadcast,
  calculateRemaining
};