// ================= SESSION CONTROLLER =================
const sessionService = require('../services/sessionService');
const sessionModel = require('../models/sessionModel');

/**
 * POST /api/sessions/start — Mulai sesi
 */
async function startSession(req, res) {
  try {
    const result = await sessionService.startSession(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/sessions/end — Akhiri sesi
 */
async function endSession(req, res) {
  try {
    const { pcId } = req.body;
    const result = await sessionService.endSession(pcId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/sessions/pause — Jeda
 */
async function pauseSession(req, res) {
  try {
    const { pcId } = req.body;
    const result = await sessionService.pauseSession(pcId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/sessions/resume — Lanjut
 */
async function resumeSession(req, res) {
  try {
    const { pcId } = req.body;
    const result = await sessionService.resumeSession(pcId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/sessions/extend — Tambah waktu
 */
async function extendTime(req, res) {
  try {
    const { pcId, addMinutes } = req.body;
    const result = await sessionService.extendTime(pcId, addMinutes);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/sessions/reduce — Kurangi waktu
 */
async function reduceTime(req, res) {
  try {
    const { pcId, reduceMinutes, reason } = req.body;
    const result = await sessionService.reduceTime(pcId, reduceMinutes, reason);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/sessions/move — Pindah PC
 */
async function moveSession(req, res) {
  try {
    const { fromPcId, toPcId } = req.body;
    const result = await sessionService.moveSession(fromPcId, toPcId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/sessions/history — Riwayat sesi
 */
async function getHistory(req, res) {
  try {
    const rows = await sessionModel.getSessionHistory(100);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  startSession,
  endSession,
  pauseSession,
  resumeSession,
  extendTime,
  reduceTime,
  moveSession,
  getHistory
};