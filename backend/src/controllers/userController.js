// ================= USER CONTROLLER =================
const sessionModel = require('../models/sessionModel');
const cacheService = require('../services/cacheService');
const timerService = require('../services/timerService');
const { cleanStr } = require('../utils/cleanStr');

/**
 * GET /api/users/daily-activity — Aktivitas hari ini
 */
async function getDailyActivity(req, res) {
  try {
    const rows = await sessionModel.getDailyActivity();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * DELETE /api/users/:username/daily-activity — Hapus aktivitas user
 */
async function deleteUserActivity(req, res) {
  try {
    const username = cleanStr(req.params.username);
    await sessionModel.deleteUserDailyActivity(username);
    await cacheService.refreshCache();
    await timerService.broadcastPCs();
    res.json({ success: true, message: `Aktivitas "${username}" dihapus` });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/users/reset-all-quotas — Reset semua kuota
 */
async function resetAllQuotas(req, res) {
  try {
    await sessionModel.resetAllDailyQuotas();
    await cacheService.refreshCache();
    await timerService.broadcastPCs();
    res.json({ success: true, message: 'Semua kuota hari ini dibersihkan' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/users/crud-quota — Manual CRUD quota
 */
async function crudQuota(req, res) {
  try {
    const { oldName, newName, newCount } = req.body;
    const cleanOld = cleanStr(oldName);
    const cleanNew = cleanStr(newName);
    const targetCount = Number(newCount) || 0;

    const { pool } = require('../config/database');

    if (cleanOld && cleanOld !== cleanNew) {
      await pool.query(
        `UPDATE pc_sessions SET username = ? WHERE username = ? AND DATE(start_time) = CURDATE()`,
        [cleanNew, cleanOld]
      );
    }

    const [current] = await pool.query(
      `SELECT COUNT(*) as cnt FROM pc_sessions WHERE username = ? AND DATE(start_time) = CURDATE()`,
      [cleanNew]
    );
    const currentCnt = Number(current[0].cnt) || 0;
    const diff = targetCount - currentCnt;

    if (diff > 0) {
      for (let i = 0; i < diff; i++) {
        await pool.query(
          `INSERT INTO pc_sessions (code, username, purpose, start_time) VALUES ('MANUAL', ?, 'Manual Edit Admin', NOW())`,
          [cleanNew]
        );
      }
    } else if (diff < 0) {
      const [rowsToDelete] = await pool.query(
        `SELECT id FROM pc_sessions WHERE username = ? AND DATE(start_time) = CURDATE() ORDER BY id DESC LIMIT ?`,
        [cleanNew, Math.abs(diff)]
      );
      for (const r of rowsToDelete) {
        await pool.query('DELETE FROM pc_sessions WHERE id = ?', [r.id]);
      }
    }

    await cacheService.refreshCache();
    await timerService.broadcastPCs();
    res.json({ success: true, message: `Data user "${cleanNew}" diperbarui` });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

module.exports = {
  getDailyActivity,
  deleteUserActivity,
  resetAllQuotas,
  crudQuota
};