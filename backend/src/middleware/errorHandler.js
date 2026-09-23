// ================= ERROR HANDLER MIDDLEWARE =================

/**
 * Handle 404 Not Found
 */
function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
}

/**
 * Global error handler
 */
function errorHandler(err, req, res, next) {
  console.error('[Error]', err.message);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal server error'
  });
}

module.exports = { notFound, errorHandler };