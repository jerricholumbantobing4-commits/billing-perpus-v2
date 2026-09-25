// ================= TIMER SERVICE =================
const pcModel = require('../models/pcModel');
const cacheService = require('./cacheService');
const { formatHHMMSS } = require('../utils/formatTime');

let io = null;
let autoEndCallback = null;

function setIO(socketIO) { io = socketIO; }
function setAutoEndCallback(callback) { autoEndCallback = callback; }

function calculateRemaining(pc) {
  if (!pc) return 0;
  if (pc.status === 'paused') return Number(pc.remaining_paused_seconds) || 0;
  if (pc.status === 'in-use') {
    if (!pc.start_time || !pc.current_duration_seconds) return 0;
    const startTimeMs = new Date(pc.start_time).getTime();
    const durationMs = Number(pc.current_duration_seconds) * 1000;
    const elapsedMs = Date.now() - startTimeMs;
    const leftMs = durationMs - elapsedMs;
    return Math.max(0, Math.floor(leftMs / 1000));
  }
  return 0;
}

async function broadcastPCs() {
  try {
    const pcs = await pcModel.getAllPCs();
    const formatted = pcs.map(pc => {
      const remainingSeconds = calculateRemaining(pc);
      const todaySessions = pc.user_name ? cacheService.getSessionCount(pc.user_name) : 0;
      const durationSec = Number(pc.current_duration_seconds) || 0;
      const saldoHours = durationSec > 0 ? (durationSec / 3600).toFixed(2) : '-';
      return {
        ...pc,
        today_sessions: todaySessions,
        saldo_hours: saldoHours,
        remaining_seconds: remainingSeconds,
        formatted_time: formatHHMMSS(remainingSeconds)
      };
    });
    if (io) io.emit('update_pcs', formatted);
  } catch (err) {
    console.error('[Timer] Broadcast error:', err.message);
  }
}

async function checkExpiredSessions() {
  try {
    const pcs = await pcModel.getAllPCs();
    for (const pc of pcs) {
      if (pc.status !== 'in-use') continue;
      const remaining = calculateRemaining(pc);
      if (remaining <= 0) {
        console.log(`[Timer] ⏰ Waktu habis untuk ${pc.code} (user: ${pc.user_name})`);
        if (autoEndCallback) await autoEndCallback(pc.id);
      }
    }
  } catch (err) {
    console.error('[Timer] Check expired error:', err.message);
  }
}

function startBroadcast() {
  setInterval(() => broadcastPCs(), 1000);
  setInterval(() => checkExpiredSessions(), 2000);
  console.log('[Timer] Broadcast + Auto-end started');
}

module.exports = {
  setIO,
  setAutoEndCallback,
  broadcastPCs,
  startBroadcast,
  calculateRemaining,
  checkExpiredSessions
};