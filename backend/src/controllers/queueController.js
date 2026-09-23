// ================= QUEUE CONTROLLER =================
const queueModel = require('../models/queueModel');
const { cleanStr } = require('../utils/cleanStr');

/**
 * GET /api/queue — Ambil antrean
 */
async function getQueue(req, res) {
  try {
    const rows = await queueModel.getQueue();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/queue — Tambah antrean
 */
async function addQueue(req, res) {
  try {
    const { user_name, purpose, duration_minutes } = req.body;
    const cleanUser = cleanStr(user_name);
    if (!cleanUser) throw new Error('Nama wajib diisi');

    await queueModel.addQueue(cleanUser, cleanStr(purpose, '-'), Number(duration_minutes) || 60);
    const rows = await queueModel.getQueue();

    if (global.io) global.io.emit('broadcast_queue', rows);

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

/**
 * DELETE /api/queue/:id — Hapus antrean
 */
async function removeQueue(req, res) {
  try {
    await queueModel.removeQueue(req.params.id);
    const rows = await queueModel.getQueue();
    if (global.io) global.io.emit('broadcast_queue', rows);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

module.exports = { getQueue, addQueue, removeQueue };