// ================= SESSION SERVICE =================
const pcModel = require('../models/pcModel');
const sessionModel = require('../models/sessionModel');
const queueModel = require('../models/queueModel');
const cacheService = require('./cacheService');
const timerService = require('./timerService');
const { cleanStr } = require('../utils/cleanStr');

/**
 * Mulai sesi baru
 */
async function startSession({ pcId, userName, purpose, durationMinutes }) {
  const cleanUser = cleanStr(userName);
  const cleanPurpose = cleanStr(purpose, '-');

  if (!cleanUser) throw new Error('Nama user wajib diisi');

  // Cek kuota harian
  const currentCount = await sessionModel.getTodaySessionCount(cleanUser);
  if (currentCount >= 2) {
    throw new Error(`Akses ditolak! ${cleanUser} sudah ${currentCount}x pakai hari ini (max 2).`);
  }

  const durMin = Number(durationMinutes) > 0 ? Number(durationMinutes) : 60;

  // Update PC
  await pcModel.updatePC(pcId, {
    STATUS: 'in-use',
    username: cleanUser,
    purpose: cleanPurpose,
    current_start_time: new Date(),
    current_duration_minutes: durMin,
    remaining_paused_seconds: null
  });

  // Buat baris riwayat
  const pc = await pcModel.getPCById(pcId);
  const sessionId = await sessionModel.createSession(pc.code, cleanUser, cleanPurpose);
  await pcModel.updatePC(pcId, { current_session_id: sessionId });

  // Hapus dari antrean
  await queueModel.removeQueueByUser(cleanUser);

  // Refresh cache & broadcast
  await cacheService.refreshCache();
  await timerService.broadcastPCs();

  return {
    success: true,
    today_sessions: currentCount + 1,
    message: `Sesi dimulai (${currentCount + 1}/2, durasi ${durMin} menit)`
  };
}

/**
 * Akhiri sesi
 */
async function endSession(pcId) {
  const pc = await pcModel.getPCById(pcId);
  if (pc && pc.current_session_id) {
    await sessionModel.closeSession(pc.current_session_id);
  }

  await pcModel.updatePC(pcId, {
    STATUS: 'available',
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

/**
 * Jeda sesi
 */
async function pauseSession(pcId) {
  const pc = await pcModel.getPCById(pcId);
  if (!pc || pc.status !== 'in-use') {
    throw new Error('PC tidak sedang aktif');
  }

  const leftMs = (pc.current_duration_minutes * 60 * 1000) - (Date.now() - new Date(pc.current_start_time).getTime());
  const leftSec = Math.max(0, Math.floor(leftMs / 1000));

  await pcModel.updatePC(pcId, {
    status: 'paused',
    remaining_paused_seconds: leftSec
  });

  await timerService.broadcastPCs();
  return { success: true };
}

/**
 * Lanjutkan sesi
 */
async function resumeSession(pcId) {
  const pc = await pcModel.getPCById(pcId);
  if (!pc || pc.status !== 'paused') {
    throw new Error('PC tidak dalam status paused');
  }

  const savedSec = Number(pc.remaining_paused_seconds) || 0;
  const newDurMin = Math.max(1, Math.ceil(savedSec / 60));

  await pcModel.updatePC(pcId, {
    status: 'in-use',
    current_duration_minutes: newDurMin,
    current_start_time: new Date(),
    remaining_paused_seconds: null
  });

  await timerService.broadcastPCs();
  return { success: true };
}

/**
 * Tambah waktu
 */
async function extendTime(pcId, addMinutes) {
  const addMin = Number(addMinutes) || 0;
  const pc = await pcModel.getPCById(pcId);
  if (!pc) throw new Error('PC tidak ditemukan');

  if (pc.status === 'paused') {
    const addSec = addMin * 60;
    await pcModel.updatePC(pcId, {
      remaining_paused_seconds: (pc.remaining_paused_seconds || 0) + addSec,
      current_duration_minutes: (pc.current_duration_minutes || 0) + addMin
    });
  } else {
    await pcModel.updatePC(pcId, {
      current_duration_minutes: (pc.current_duration_minutes || 0) + addMin
    });
  }

  await timerService.broadcastPCs();
  return { success: true, message: `+${addMin} menit ditambahkan` };
}

/**
 * Kurangi waktu
 */
async function reduceTime(pcId, reduceMinutes, reason) {
  const redMin = Number(reduceMinutes) || 0;
  const pc = await pcModel.getPCById(pcId);
  if (!pc) throw new Error('PC tidak ditemukan');

  if (pc.status === 'in-use') {
    await pcModel.updatePC(pcId, {
      current_duration_minutes: Math.max(1, (pc.current_duration_minutes || 0) - redMin)
    });
  } else if (pc.status === 'paused') {
    const newPausedSec = Math.max(0, (pc.remaining_paused_seconds || 0) - (redMin * 60));
    await pcModel.updatePC(pcId, {
      remaining_paused_seconds: newPausedSec
    });
  } else {
    throw new Error('PC tidak sedang aktif/di-pause');
  }

  await timerService.broadcastPCs();
  return { success: true, message: `-${redMin} menit (${reason || '-'})` };
}

/**
 * Pindah sesi ke PC lain
 */
async function moveSession(fromPcId, toPcId) {
  const fromPc = await pcModel.getPCById(fromPcId);
  const toPc = await pcModel.getPCById(toPcId);

  if (!fromPc || !toPc) throw new Error('PC asal/tujuan tidak ditemukan');
  if (fromPc.status !== 'in-use' && fromPc.status !== 'paused') throw new Error('PC asal tidak aktif');
  if (toPc.status !== 'available') throw new Error('PC tujuan tidak kosong');

  // Hitung sisa
  let remainingSeconds = 0;
  if (fromPc.status === 'in-use') {
    const leftMs = (fromPc.current_duration_minutes * 60 * 1000) - (Date.now() - new Date(fromPc.current_start_time).getTime());
    remainingSeconds = Math.max(0, Math.floor(leftMs / 1000));
  } else {
    remainingSeconds = Number(fromPc.remaining_paused_seconds) || 0;
  }
  const remainingMinutes = Math.max(1, Math.ceil(remainingSeconds / 60));

  // Pindah ke PC tujuan
  if (fromPc.status === 'in-use') {
    await pcModel.updatePC(toPcId, {
      STATUS: 'in-use',
      username: fromPc.username,
      purpose: fromPc.purpose,
      current_start_time: new Date(),
      current_duration_minutes: remainingMinutes,
      remaining_paused_seconds: null,
      current_session_id: fromPc.current_session_id
    });
  } else {
    await pcModel.updatePC(toPcId, {
      STATUS: 'paused',
      username: fromPc.username,
      purpose: fromPc.purpose,
      current_start_time: null,
      current_duration_minutes: remainingMinutes,
      remaining_paused_seconds: remainingSeconds,
      current_session_id: fromPc.current_session_id
    });
  }

  // Kosongkan PC asal
  await pcModel.updatePC(fromPcId, {
    STATUS: 'available',
    username: null,
    purpose: null,
    current_start_time: null,
    current_duration_minutes: null,
    remaining_paused_seconds: null,
    current_session_id: null
  });

  await timerService.broadcastPCs();
  return { success: true, message: `Pindah dari ${fromPc.code} ke ${toPc.code}` };
}

module.exports = {
  startSession,
  endSession,
  pauseSession,
  resumeSession,
  extendTime,
  reduceTime,
  moveSession
};