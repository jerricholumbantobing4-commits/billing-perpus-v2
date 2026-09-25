// ================= SESSION SERVICE =================
const pcModel = require('../models/pcModel');
const sessionModel = require('../models/sessionModel');
const queueModel = require('../models/queueModel');
const cacheService = require('./cacheService');
const timerService = require('./timerService');
const { cleanStr } = require('../utils/cleanStr');

/**
 * Hitung sisa detik dari sebuah PC
 * NOTE: pc.start_time adalah ALIAS dari current_start_time (lihat pcModel.js)
 */
function calculateRemainingSeconds(pc) {
  if (!pc) return 0;

  if (pc.status === 'paused') {
    return Number(pc.remaining_paused_seconds) || 0;
  }

  if (pc.status === 'in-use') {
    // ⚠️ PAKAI pc.start_time (bukan current_start_time!)
    if (!pc.start_time || !pc.current_duration_seconds) return 0;

    const startMs = new Date(pc.start_time).getTime();
    const durationMs = Number(pc.current_duration_seconds) * 1000;
    const elapsedMs = Date.now() - startMs;
    const leftMs = durationMs - elapsedMs;

    return Math.max(0, Math.floor(leftMs / 1000));
  }

  return 0;
}

/**
 * Mulai sesi baru
 */
async function startSession({ pcId, userName, purpose, durationMinutes }) {
  const cleanUser = cleanStr(userName);
  const cleanPurpose = cleanStr(purpose, '-');

  if (!cleanUser) throw new Error('Nama user wajib diisi');

  const currentCount = await sessionModel.getTodaySessionCount(cleanUser);
  if (currentCount >= 2) {
    throw new Error(`Akses ditolak! ${cleanUser} sudah ${currentCount}x pakai hari ini (max 2).`);
  }

  const durMin = Number(durationMinutes) > 0 ? Number(durationMinutes) : 120;
  const durSec = durMin * 60;

  const pcInfo = await pcModel.getPCById(pcId);
  if (!pcInfo) throw new Error('PC tidak ditemukan');

  const sessionId = await sessionModel.createSession(pcInfo.code, cleanUser, cleanPurpose);

  await pcModel.updatePC(pcId, {
    status: 'in-use',
    username: cleanUser,
    purpose: cleanPurpose,
    current_start_time: new Date(),
    current_duration_minutes: durMin,
    current_duration_seconds: durSec,
    remaining_paused_seconds: null,
    current_session_id: sessionId
  });

  await queueModel.removeQueueByUser(cleanUser);

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
    status: 'available',
    username: null,
    purpose: null,
    current_start_time: null,
    current_duration_minutes: null,
    current_duration_seconds: null,
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

  const leftSec = calculateRemainingSeconds(pc);

  console.log('[Pause] duration_seconds:', pc.current_duration_seconds);
  console.log('[Pause] leftSec:', leftSec);

  await pcModel.updatePC(pcId, {
    status: 'paused',
    remaining_paused_seconds: leftSec
  });

  await timerService.broadcastPCs();
  return { success: true, remaining_seconds: leftSec };
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
  const durMin = Math.ceil(savedSec / 60);

  console.log('[Resume] savedSec:', savedSec, '| durMin:', durMin);

  await pcModel.updatePC(pcId, {
    status: 'in-use',
    current_duration_minutes: durMin,
    current_duration_seconds: savedSec,
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
  if (addMin < 1) throw new Error('Jumlah menit tidak valid');

  const addSec = addMin * 60;
  const pc = await pcModel.getPCById(pcId);
  if (!pc) throw new Error('PC tidak ditemukan');

  if (pc.status !== 'in-use' && pc.status !== 'paused') {
    throw new Error('PC tidak sedang dipakai atau dijeda');
  }

  if (pc.status === 'paused') {
    await pcModel.updatePC(pcId, {
      remaining_paused_seconds: (Number(pc.remaining_paused_seconds) || 0) + addSec,
      current_duration_minutes: (Number(pc.current_duration_minutes) || 0) + addMin,
      current_duration_seconds: (Number(pc.current_duration_seconds) || 0) + addSec
    });
  } else {
    await pcModel.updatePC(pcId, {
      current_duration_minutes: (Number(pc.current_duration_minutes) || 0) + addMin,
      current_duration_seconds: (Number(pc.current_duration_seconds) || 0) + addSec
    });
  }

  await timerService.broadcastPCs();
  console.log(`[ExtendTime] ${pc.code} +${addMin} menit`);
  return { success: true, message: `+${addMin} menit ditambahkan` };
}

/**
 * Tambah waktu untuk PC yang SUDAH kosong (dari layar billing)
 */
async function extendTimeForAvailable(pcId, addMinutes, userName) {
  const addMin = Number(addMinutes) || 0;
  if (addMin < 1) throw new Error('Jumlah menit tidak valid');

  const pc = await pcModel.getPCById(pcId);
  if (!pc) throw new Error('PC tidak ditemukan');

  if (pc.status !== 'available') {
    return extendTime(pcId, addMinutes);
  }

  const cleanUser = cleanStr(userName) || 'User';
  const cleanPurpose = cleanStr(pc.purpose) || '-';
  const addSec = addMin * 60;

  const sessionId = await sessionModel.createSession(pc.code, cleanUser, cleanPurpose);

  await pcModel.updatePC(pcId, {
    status: 'in-use',
    username: cleanUser,
    purpose: cleanPurpose,
    current_start_time: new Date(),
    current_duration_minutes: addMin,
    current_duration_seconds: addSec,
    remaining_paused_seconds: null,
    current_session_id: sessionId
  });

  await cacheService.refreshCache();
  await timerService.broadcastPCs();

  console.log(`[ExtendForAvailable] ${pc.code} diaktifkan untuk ${cleanUser} +${addMin} menit`);
  return { success: true, message: `${cleanUser} dapat +${addMin} menit. Sesi dimulai.` };
}

/**
 * Kurangi waktu
 */
async function reduceTime(pcId, reduceMinutes, reason) {
  console.log('=== REDUCE TIME SERVICE ===');
  console.log('pcId:', pcId, 'reduceMinutes:', reduceMinutes, 'reason:', reason);

  const pc = await pcModel.getPCById(pcId);
  if (!pc) throw new Error('PC tidak ditemukan');

  if (pc.status !== 'in-use' && pc.status !== 'paused') {
    throw new Error('PC tidak sedang dipakai atau dijeda');
  }

  const reduceMin = Number(reduceMinutes) || 0;
  if (reduceMin < 1) throw new Error('Jumlah menit tidak valid');

  const reduceSec = reduceMin * 60;

  if (pc.status === 'paused') {
    const currentPausedSec = Number(pc.remaining_paused_seconds) || 0;
    const newPausedSec = Math.max(0, currentPausedSec - reduceSec);

    if (newPausedSec <= 0) {
      await endSession(pcId);
      console.log(`[ReduceTime] ${pc.code} -${reduceMin} menit → WAKTU HABIS (paused), auto-end`);
      return { success: true, message: 'Waktu habis saat jeda, sesi diakhiri otomatis' };
    }

    await pcModel.updatePC(pcId, {
      remaining_paused_seconds: newPausedSec,
      current_duration_minutes: Math.max(0, (Number(pc.current_duration_minutes) || 0) - reduceMin),
      current_duration_seconds: Math.max(0, (Number(pc.current_duration_seconds) || 0) - reduceSec)
    });

  } else {
    const currentDurSec = Number(pc.current_duration_seconds) || 0;
    const newDurSec = Math.max(0, currentDurSec - reduceSec);

    if (newDurSec <= 0) {
      await endSession(pcId);
      console.log(`[ReduceTime] ${pc.code} -${reduceMin} menit → WAKTU HABIS, auto-end`);
      return { success: true, message: 'Waktu habis, sesi diakhiri otomatis' };
    }

    await pcModel.updatePC(pcId, {
      current_duration_minutes: Math.max(0, (Number(pc.current_duration_minutes) || 0) - reduceMin),
      current_duration_seconds: newDurSec
    });
  }

  await timerService.broadcastPCs();
  console.log(`[ReduceTime] ${pc.code} -${reduceMin} menit${reason ? ` (${reason})` : ''}`);
  return { success: true, message: `-${reduceMin} menit berhasil` };
}

/**
 * Pindah sesi ke PC lain
 */
async function moveSession(fromPcId, toPcId) {
  const fromPc = await pcModel.getPCById(fromPcId);
  const toPc = await pcModel.getPCById(toPcId);

  if (!fromPc || !toPc) throw new Error('PC asal/tujuan tidak ditemukan');
  if (fromPc.status !== 'in-use' && fromPc.status !== 'paused') {
    throw new Error('PC asal tidak aktif');
  }
  if (toPc.status !== 'available') {
    throw new Error('PC tujuan tidak kosong');
  }

  const remainingSeconds = calculateRemainingSeconds(fromPc);
  if (remainingSeconds <= 0) {
    await endSession(fromPcId);
    throw new Error('Sesi di PC asal sudah habis, tidak bisa dipindah');
  }

  const remainingMinutes = Math.ceil(remainingSeconds / 60);
  const now = new Date();

  console.log(`[MoveSession] ${fromPc.code} → ${toPc.code} | sisa: ${remainingSeconds}s`);

  if (fromPc.status === 'in-use') {
    await pcModel.updatePC(toPcId, {
      status: 'in-use',
      username: fromPc.username,
      purpose: fromPc.purpose,
      current_start_time: now,
      current_duration_minutes: remainingMinutes,
      current_duration_seconds: remainingSeconds,
      remaining_paused_seconds: null,
      current_session_id: fromPc.current_session_id
    });
  } else {
    await pcModel.updatePC(toPcId, {
      status: 'paused',
      username: fromPc.username,
      purpose: fromPc.purpose,
      current_start_time: null,
      current_duration_minutes: remainingMinutes,
      current_duration_seconds: remainingSeconds,
      remaining_paused_seconds: remainingSeconds,
      current_session_id: fromPc.current_session_id
    });
  }

  await pcModel.updatePC(fromPcId, {
    status: 'available',
    username: null,
    purpose: null,
    current_start_time: null,
    current_duration_minutes: null,
    current_duration_seconds: null,
    remaining_paused_seconds: null,
    current_session_id: null
  });

  await cacheService.refreshCache();
  await timerService.broadcastPCs();

  return {
    success: true,
    message: `Pindah dari ${fromPc.code} ke ${toPc.code} (sisa ${remainingMinutes} menit)`
  };
}

module.exports = {
  startSession,
  endSession,
  pauseSession,
  resumeSession,
  extendTime,
  extendTimeForAvailable,
  reduceTime,
  moveSession,
  calculateRemainingSeconds
};