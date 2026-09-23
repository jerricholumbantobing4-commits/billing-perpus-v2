// ================= VALIDATOR MIDDLEWARE =================

/**
 * Validasi body request untuk start session
 */
function validateStartSession(req, res, next) {
  const { pcId, userName } = req.body;
  if (!pcId) return res.status(400).json({ success: false, error: 'pcId wajib diisi' });
  if (!userName || String(userName).trim().length === 0) {
    return res.status(400).json({ success: false, error: 'userName wajib diisi' });
  }
  next();
}

/**
 * Validasi body untuk move session
 */
function validateMoveSession(req, res, next) {
  const { fromPcId, toPcId } = req.body;
  if (!fromPcId || !toPcId) {
    return res.status(400).json({ success: false, error: 'fromPcId & toPcId wajib' });
  }
  if (String(fromPcId) === String(toPcId)) {
    return res.status(400).json({ success: false, error: 'PC asal & tujuan tidak boleh sama' });
  }
  next();
}

module.exports = { validateStartSession, validateMoveSession };