// ================= CACHE SERVICE =================
// Menyimpan jumlah sesi harian per user di memory
// untuk menghindari query berulang ke database

const sessionModel = require('../models/sessionModel');

let dailySessionCache = {};

/**
 * Refresh cache dari database
 */
async function refreshCache() {
  try {
    const rows = await sessionModel.getTodaySessionCountsAll();
    dailySessionCache = {};
    rows.forEach(r => {
      dailySessionCache[r.username] = r.total;
    });
    console.log('[Cache] Refreshed:', Object.keys(dailySessionCache).length, 'user(s)');
  } catch (err) {
    console.error('[Cache] Error refresh:', err.message);
  }
}

/**
 * Ambil jumlah sesi hari ini dari cache
 */
function getSessionCount(username) {
  if (!username) return 0;
  return dailySessionCache[username] || 0;
}

/**
 * Ambil seluruh cache
 */
function getCache() {
  return dailySessionCache;
}

module.exports = {
  refreshCache,
  getSessionCount,
  getCache
};