// ================= PC MODEL =================
const { pool } = require('../config/database');

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
      current_duration_seconds,
      current_start_time as start_time,
      remaining_paused_seconds,
      current_session_id
    FROM pcs 
    ORDER BY id ASC
  `);
  return rows;
}

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
      current_duration_seconds,
      current_start_time as start_time,
      remaining_paused_seconds,
      current_session_id
    FROM pcs 
    WHERE id = ?
  `, [pcId]);
  return rows[0] || null;
}

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
      current_duration_seconds,
      current_start_time as start_time,
      remaining_paused_seconds,
      current_session_id
    FROM pcs 
    WHERE CODE = ?
  `, [code]);
  return rows[0] || null;
}

async function addPC(code, location) {
  const [result] = await pool.query(
    'INSERT INTO pcs (CODE, location, STATUS) VALUES (?, ?, ?)',
    [code, location, 'available']
  );
  return result.insertId;
}

async function updatePC(pcId, fields) {
  const columnMap = {
    'status': 'STATUS',
    'username': 'username',
    'user_name': 'username',
    'purpose': 'purpose',
    'current_user_type': 'current_user_type',
    'current_duration_minutes': 'current_duration_minutes',
    'current_duration_seconds': 'current_duration_seconds',
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
  
  const validPairs = keys
    .map((k, i) => ({ key: k, value: values[i] }))
    .filter(pair => {
      if (!pair.key || pair.key === 'NaN') return false;
      if (typeof pair.value === 'number' && isNaN(pair.value)) return false;
      return true;
    });

  if (validPairs.length === 0) return;

  const setClause = validPairs.map(p => {
    const col = columnMap[p.key] || p.key;
    return `${col} = ?`;
  }).join(', ');

  const finalValues = validPairs.map(p => p.value);
  finalValues.push(pcId);

  await pool.query(`UPDATE pcs SET ${setClause} WHERE id = ?`, finalValues);
}

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