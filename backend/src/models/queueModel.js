// ================= QUEUE MODEL =================
const { pool } = require('../config/database');

/**
 * Ambil semua antrean
 */
async function getQueue() {
  const [rows] = await pool.query(
    'SELECT id, user_name, purpose, duration_minutes, created_at FROM pc_queues ORDER BY created_at ASC'
  );
  return rows;
}

/**
 * Tambah ke antrean
 */
async function addQueue(userName, purpose, durationMinutes) {
  const [result] = await pool.query(
    'INSERT INTO pc_queues (user_name, purpose, duration_minutes) VALUES (?, ?, ?)',
    [userName, purpose, durationMinutes]
  );
  return result.insertId;
}

/**
 * Hapus dari antrean
 */
async function removeQueue(queueId) {
  await pool.query('DELETE FROM pc_queues WHERE id = ?', [queueId]);
}

/**
 * Hapus antrean berdasarkan nama user
 */
async function removeQueueByUser(userName) {
  await pool.query('DELETE FROM pc_queues WHERE user_name = ?', [userName]);
}

module.exports = {
  getQueue,
  addQueue,
  removeQueue,
  removeQueueByUser
};