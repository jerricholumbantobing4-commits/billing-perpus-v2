// ================= AUTH MIDDLEWARE =================
// Untuk sekarang, auth dinonaktifkan (Admin tidak perlu login)
// Bisa diaktifkan nanti kalau perlu

function auth(req, res, next) {
  // Auth tidak diaktifkan — biarkan semua request lewat
  next();
}

module.exports = { auth };