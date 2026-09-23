// ================= PC MODEL =================
const { pool } = require('../config/database');

/**
 * Ambil semua PC
 */
async function getAllPCs() {
  const [rows] = await pool.query(`
    SELECT 
      id, 
      CODE as code, 
      location, 
      STATUS as status, 
      username as user_name,
      purpose,
      current_user_type,
      current_duration_minutes,
      current_start_time as start_time,
      remaining_paused_seconds,
      current_session_id
    FROM pcs 
    ORDER BY id ASC
  `);
  return rows;
}

/**
 * Ambil PC berdasarkan ID
 */
async function getPCById(pcId) {
  const [rows] = await pool.query(`
    SELECT 
      id, 
      CODE as code, 
      location, 
      STATUS as status, 
      username as user_name,
      purpose,
      current_user_type,
      current_duration_minutes,
      current_start_time as start_time,
      remaining_paused_seconds,
      current_session_id
    FROM pcs 
    WHERE id = ?
  `, [pcId]);
  return rows[0] || null;
}

/**
 * Ambil PC berdasarkan kode (PC-01, PC-02, dll.)
 */
async function getPCByCode(code) {
  const [rows] = await pool.query(`
    SELECT 
      id, 
      CODE as code, 
      location, 
      STATUS as status, 
      username as user_name,
      purpose,
      current_user_type,
      current_duration_minutes,
      current_start_time as start_time,
      remaining_paused_seconds,
      current_session_id
    FROM pcs 
    WHERE CODE = ?
  `, [code]);
  return rows[0] || null;
}

/**
 * Tambah PC baru
 */
async function addPC(code, location) {
  const [result] = await pool.query(
    'INSERT INTO pcs (CODE, location, STATUS) VALUES (?, ?, ?)',
    [code, location, 'available']
  );
  return result.insertId;
}

/**
 * Update PC — mapping nama field ke nama kolom database
 */
async function updatePC(pcId, fields) {
  // Mapping: nama kode → nama kolom database
  const columnMap = {
    'status': 'STATUS',
    'STATUS': 'STATUS',
    'username': 'username',
    'user_name': 'username',
    'purpose': 'purpose',
    'current_user_type': 'current_user_type',
    'current_duration_minutes': 'current_duration_minutes',
    'current_start_time': 'current_start_time',
    'start_time': 'current_start_time',
    'remaining_paused_seconds': 'remaining_paused_seconds',
    'current_session_id': 'current_session_id',
    'code': 'CODE',
    'CODE': 'CODE',
    'location': 'location'
  };

  const keys = Object.keys(fields);
  const values = Object.values(fields);
  
  const setClause = keys.map(k => {
    const col = columnMap[k] || k;
    return `${col} = ?`;
  }).join(', ');
  
  values.push(pcId);
  
  await pool.query(`UPDATE pcs SET ${setClause} WHERE id = ?`, values);
}

/**
 * Hapus PC
 */
async function deletePC(pcId) {
  await pool.query('DELETE FROM pcs WHERE id = ?', [pcId]);
}

module.exports = {
  getAllPCs,
  getPCById,
  getPCByCode,
  addPC,
  updatePC,
  deletePC
};