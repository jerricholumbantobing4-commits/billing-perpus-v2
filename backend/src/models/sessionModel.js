// ================= SESSION MODEL =================
const { pool } = require('../config/database');

/**
 * Hitung sesi hari ini untuk user
 */
async function getTodaySessionCount(username) {
  if (!username) return 0;
  const [rows] = await pool.query(
    `SELECT COUNT(*) as total FROM pc_sessions 
     WHERE username = ? AND DATE(start_time) = CURDATE()`,
    [username]
  );
  return rows[0].total || 0;
}

/**
 * Buat sesi baru
 */
async function createSession(code, username, purpose) {
  const [result] = await pool.query(
    'INSERT INTO pc_sessions (code, username, purpose, start_time) VALUES (?, ?, ?, NOW())',
    [code, username, purpose]
  );
  return result.insertId;
}

/**
 * Tutup sesi (set end_time)
 */
async function closeSession(sessionId) {
  if (!sessionId) return;
  await pool.query(
    'UPDATE pc_sessions SET end_time = NOW() WHERE id = ? AND end_time IS NULL',
    [sessionId]
  );
}

/**
 * Ambil 100 riwayat sesi terakhir
 */
async function getSessionHistory(limit = 100) {
  const [rows] = await pool.query(
    `SELECT id, code, username, purpose, start_time, end_time 
     FROM pc_sessions ORDER BY id DESC LIMIT ?`,
    [limit]
  );
  return rows;
}

/**
 * Ambil aktivitas harian per user (group by username)
 */
async function getDailyActivity() {
  const [rows] = await pool.query(`
    SELECT username, COUNT(*) as total_sessions 
    FROM pc_sessions 
    WHERE DATE(start_time) = CURDATE() 
      AND username IS NOT NULL 
      AND username != ''
    GROUP BY username
    ORDER BY total_sessions DESC
  `);
  return rows;
}

/**
 * Hapus aktivitas harian user
 */
async function deleteUserDailyActivity(username) {
  await pool.query(
    'DELETE FROM pc_sessions WHERE username = ? AND DATE(start_time) = CURDATE()',
    [username]
  );
}

/**
 * Reset semua kuota harian
 */
async function resetAllDailyQuotas() {
  await pool.query('DELETE FROM pc_sessions WHERE DATE(start_time) = CURDATE()');
}

/**
 * Ambil semua user dengan sesi hari ini (untuk cache)
 */
async function getTodaySessionCountsAll() {
  const [rows] = await pool.query(`
    SELECT username, COUNT(*) as total 
    FROM pc_sessions 
    WHERE DATE(start_time) = CURDATE() 
      AND username IS NOT NULL 
      AND username != ''
    GROUP BY username
  `);
  return rows;
}

module.exports = {
  getTodaySessionCount,
  createSession,
  closeSession,
  getSessionHistory,
  getDailyActivity,
  deleteUserDailyActivity,
  resetAllDailyQuotas,
  getTodaySessionCountsAll
};