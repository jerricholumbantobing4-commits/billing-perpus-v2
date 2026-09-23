// ================= DATABASE CONNECTION =================
const mysql = require('mysql2/promise');
const env = require('./env');

// Buat pool koneksi MySQL
const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+07:00',
  dateStrings: false
});

// Test koneksi
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('[DB] ✅ Terhubung ke MySQL:', env.DB_NAME);
    connection.release();
    return true;
  } catch (err) {
    console.error('[DB] ❌ Gagal terhubung ke MySQL:', err.message);
    return false;
  }
}

module.exports = { pool, testConnection };