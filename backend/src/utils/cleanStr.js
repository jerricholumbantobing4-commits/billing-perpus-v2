// ================= STRING UTILITIES =================

/**
 * Bersihkan string dari whitespace berlebih
 */
function cleanStr(str, fallback = '') {
  if (typeof str !== 'string') return fallback;
  return str.trim() || fallback;
}

/**
 * Sanitasi input untuk mencegah XSS
 */
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

/**
 * Validasi username (huruf, angka, spasi, max 50 char)
 */
function isValidUsername(str) {
  if (typeof str !== 'string') return false;
  const trimmed = str.trim();
  if (trimmed.length < 1 || trimmed.length > 50) return false;
  return /^[a-zA-Z0-9\s._-]+$/.test(trimmed);
}

module.exports = { cleanStr, sanitize, isValidUsername };