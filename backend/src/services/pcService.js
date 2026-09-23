// ================= PC SERVICE =================
const pcModel = require('../models/pcModel');
const sessionModel = require('../models/sessionModel');
const cacheService = require('./cacheService');
const timerService = require('./timerService');
const { cleanStr } = require('../utils/cleanStr');

/**
 * Tambah PC baru
 */
async function addPC({ code, location }) {
  const cleanCode = cleanStr(code);
  const cleanLocation = cleanStr(location, '-');
  if (!cleanCode) throw new Error('Kode PC wajib diisi');

  const id = await pcModel.addPC(cleanCode, cleanLocation);
  await timerService.broadcastPCs();
  return { success: true, id };
}

/**
 * Hapus PC
 */
async function deletePC(pcId) {
  const pc = await pcModel.getPCById(pcId);
  if (pc && pc.current_session_id) {
    await sessionModel.closeSession(pc.current_session_id);
  }
  await pcModel.deletePC(pcId);
  await cacheService.refreshCache();
  await timerService.broadcastPCs();
  return { success: true };
}

/**
 * Set status maintenance
 */
async function setMaintenance(pcId, status) {
  const pc = await pcModel.getPCById(pcId);
  if (pc && pc.current_session_id) {
    await sessionModel.closeSession(pc.current_session_id);
  }
  await pcModel.updatePC(pcId, {
    STATUS: status,
    username: null,
    purpose: null,
    current_start_time: null,
    current_duration_minutes: null,
    remaining_paused_seconds: null,
    current_session_id: null
  });
  await cacheService.refreshCache();
  await timerService.broadcastPCs();
  return { success: true };
}

module.exports = {
  addPC,
  deletePC,
  setMaintenance
};