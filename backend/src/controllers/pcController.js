// ================= PC CONTROLLER =================
const pcService = require('../services/pcService');
const timerService = require('../services/timerService');

/**
 * GET /api/pcs — Ambil semua PC
 */
async function getAllPCs(req, res) {
  try {
    const pcModel = require('../models/pcModel');
    const cacheService = require('../services/cacheService');
    const { formatHHMMSS } = require('../utils/formatTime');

    const pcs = await pcModel.getAllPCs();
    const formatted = pcs.map(pc => {
      const remaining = timerService.calculateRemaining(pc);
      const todaySessions = pc.user_name ? cacheService.getSessionCount(pc.user_name) : 0;
      const durationMin = Number(pc.current_duration_minutes) || 0;
      const saldoHours = durationMin > 0 ? (durationMin / 60).toFixed(1) : '-';
      return {
        ...pc,
        today_sessions: todaySessions,
        saldo_hours: saldoHours,
        formatted_time: formatHHMMSS(remaining)
      };
    });
    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/pcs — Tambah PC
 */
async function addPC(req, res) {
  try {
    const result = await pcService.addPC(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

/**
 * DELETE /api/pcs/:id — Hapus PC
 */
async function deletePC(req, res) {
  try {
    const result = await pcService.deletePC(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

/**
 * PUT /api/pcs/:id/maintenance — Set maintenance
 */
async function setMaintenance(req, res) {
  try {
    const { status } = req.body;
    const result = await pcService.setMaintenance(req.params.id, status);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

module.exports = { getAllPCs, addPC, deletePC, setMaintenance };