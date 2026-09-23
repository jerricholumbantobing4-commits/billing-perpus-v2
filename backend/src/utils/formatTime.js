// ================= FORMAT TIME UTILITIES =================

/**
 * Format detik ke format H.MM.SS
 * Contoh: 3661 → "1.01.01"
 */
function formatHHMMSS(totalSeconds) {
  const secs = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  const remainderSecs = secs % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${hrs}.${pad(mins)}.${pad(remainderSecs)}`;
}

/**
 * Format timestamp ke jam lokal Indonesia
 */
function formatClock(date = new Date()) {
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta'
  });
}

/**
 * Format tanggal lengkap Indonesia
 */
function formatDate(date = new Date()) {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta'
  });
}

module.exports = { formatHHMMSS, formatClock, formatDate };