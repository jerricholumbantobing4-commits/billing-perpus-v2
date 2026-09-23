// ================= API ROUTES =================
const express = require('express');
const router = express.Router();

// Controllers
const pcController = require('../controllers/pcController');
const sessionController = require('../controllers/sessionController');
const queueController = require('../controllers/queueController');
const userController = require('../controllers/userController');

// Middleware
const { validateStartSession, validateMoveSession } = require('../middleware/validator');

// ================= PC ROUTES =================
router.get('/pcs', pcController.getAllPCs);
router.post('/pcs', pcController.addPC);
router.delete('/pcs/:id', pcController.deletePC);
router.put('/pcs/:id/maintenance', pcController.setMaintenance);

// ================= SESSION ROUTES =================
router.post('/sessions/start', validateStartSession, sessionController.startSession);
router.post('/sessions/end', sessionController.endSession);
router.post('/sessions/pause', sessionController.pauseSession);
router.post('/sessions/resume', sessionController.resumeSession);
router.post('/sessions/extend', sessionController.extendTime);
router.post('/sessions/reduce', sessionController.reduceTime);
router.post('/sessions/move', validateMoveSession, sessionController.moveSession);
router.get('/sessions/history', sessionController.getHistory);

// ================= QUEUE ROUTES =================
router.get('/queue', queueController.getQueue);
router.post('/queue', queueController.addQueue);
router.delete('/queue/:id', queueController.removeQueue);

// ================= USER ROUTES =================
router.get('/users/daily-activity', userController.getDailyActivity);
router.delete('/users/:username/daily-activity', userController.deleteUserActivity);
router.post('/users/reset-all-quotas', userController.resetAllQuotas);
router.post('/users/crud-quota', userController.crudQuota);

// ================= HEALTH CHECK =================
router.get('/health', (req, res) => {
  res.json({ success: true, status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;