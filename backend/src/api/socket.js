// ================= SOCKET.IO HANDLER =================
const pcModel = require('../models/pcModel');
const queueModel = require('../models/queueModel');
const sessionModel = require('../models/sessionModel');
const cacheService = require('../services/cacheService');
const timerService = require('../services/timerService');
const sessionService = require('../services/sessionService');
const pcService = require('../services/pcService');
const { formatHHMMSS } = require('../utils/formatTime');

function setupSocket(io) {
  console.log('[Socket] Handler initialized');
  global.io = io;
  timerService.setIO(io);
  timerService.startBroadcast();

  io.on('connection', async (socket) => {
    console.log('[Socket] Client connected:', socket.id);

    // ================= INIT =================
    try {
      const pcs = await pcModel.getAllPCs();
      const formatted = pcs.map(pc => {
        const remaining = timerService.calculateRemaining(pc);
        const todaySessions = pc.user_name ? cacheService.getSessionCount(pc.user_name) : 0;
        const durationMin = Number(pc.current_duration_minutes) || 0;
        const saldoHours = durationMin > 0 ? (durationMin / 60).toFixed(1) : '-';
        return {
          ...pc,
          today_sessions: todaySessions,
          saldo_hours: saldoHours,
          formatted_time: formatHHMMSS(remaining)
        };
      });
      socket.emit('init_pcs', formatted);
      const queue = await queueModel.getQueue();
      socket.emit('broadcast_queue', queue);
    } catch (err) {
      console.error('[Socket] Init error:', err.message);
    }

    // ================= PC MANAGEMENT =================
    socket.on('add_pc', async (data, callback) => {
      try {
        const result = await pcService.addPC(data);
        if (callback) callback(result);
      } catch (err) {
        if (callback) callback({ error: err.message });
      }
    });

    socket.on('delete_pc', async (data, callback) => {
      try {
        const result = await pcService.deletePC(data.pcId);
        if (callback) callback(result);
      } catch (err) {
        if (callback) callback({ error: err.message });
      }
    });

    socket.on('set_pc_maintenance', async (data, callback) => {
      try {
        const result = await pcService.setMaintenance(data.pcId, data.status);
        if (callback) callback(result);
      } catch (err) {
        if (callback) callback({ error: err.message });
      }
    });

    // ================= SESSION MANAGEMENT =================
    socket.on('start_session', async (data, callback) => {
      try {
        const result = await sessionService.startSession(data);
        if (callback) callback(result);
      } catch (err) {
        console.error('[Socket] start_session error:', err.message);
        if (callback) callback({ error: err.message });
      }
    });

    socket.on('end_session', async (data, callback) => {
      try {
        const result = await sessionService.endSession(data.pcId);
        if (callback) callback(result);
      } catch (err) {
        if (callback) callback({ error: err.message });
      }
    });

    socket.on('pause_session', async (data, callback) => {
      try {
        const result = await sessionService.pauseSession(data.pcId);
        if (callback) callback(result);
      } catch (err) {
        if (callback) callback({ error: err.message });
      }
    });

    socket.on('resume_session', async (data, callback) => {
      try {
        const result = await sessionService.resumeSession(data.pcId);
        if (callback) callback(result);
      } catch (err) {
        if (callback) callback({ error: err.message });
      }
    });

    socket.on('extend_time', async (data, callback) => {
      try {
        const result = await sessionService.extendTime(data.pcId, data.addMinutes);
        if (callback) callback(result);
      } catch (err) {
        if (callback) callback({ error: err.message });
      }
    });

    socket.on('reduce_time', async (data, callback) => {
      try {
        const result = await sessionService.reduceTime(data.pcId, data.reduceMinutes, data.reason);
        if (callback) callback(result);
      } catch (err) {
        if (callback) callback({ error: err.message });
      }
    });

    socket.on('move_session', async (data, callback) => {
      try {
        const result = await sessionService.moveSession(data.fromPcId, data.toPcId);
        if (callback) callback(result);
      } catch (err) {
        if (callback) callback({ error: err.message });
      }
    });

    // ================= QUEUE =================
    socket.on('get_queue', async (data, callback) => {
      try {
        const rows = await queueModel.getQueue();
        if (callback) callback(rows);
        else socket.emit('broadcast_queue', rows);
      } catch (err) {
        if (callback) callback([]);
      }
    });

    socket.on('add_queue', async (data, callback) => {
      try {
        await queueModel.addQueue(data.user_name, data.purpose, Number(data.duration_minutes) || 60);
        const rows = await queueModel.getQueue();
        io.emit('broadcast_queue', rows);
        if (callback) callback({ success: true });
      } catch (err) {
        if (callback) callback({ error: err.message });
      }
    });

    socket.on('remove_queue', async (id) => {
      try {
        await queueModel.removeQueue(id);
        const rows = await queueModel.getQueue();
        io.emit('broadcast_queue', rows);
      } catch (err) {
        console.error('[Socket] remove_queue error:', err.message);
      }
    });

    // ================= ADMIN CHAT =================
    socket.on('admin_send_chat', async (data, callback) => {
      try {
        io.emit('receive_admin_chat', {
          pcId: data.pcId,
          message: data.message,
          timestamp: new Date()
        });
        if (callback) callback({ success: true });
      } catch (err) {
        if (callback) callback({ error: err.message });
      }
    });

    // ================= USER MANAGEMENT =================
    socket.on('get_daily_activity', async (data, callback) => {
      try {
        const rows = await sessionModel.getDailyActivity();
        if (callback) callback(rows);
      } catch (err) {
        if (callback) callback([]);
      }
    });

    socket.on('delete_user_daily_activity', async (data, callback) => {
      try {
        await sessionModel.deleteUserDailyActivity(data.username);
        await cacheService.refreshCache();
        await timerService.broadcastPCs();
        if (callback) callback({ message: `Aktivitas "${data.username}" dihapus` });
      } catch (err) {
        if (callback) callback({ message: err.message });
      }
    });

    socket.on('reset_all_daily_quotas', async (data, callback) => {
      try {
        await sessionModel.resetAllDailyQuotas();
        await cacheService.refreshCache();
        await timerService.broadcastPCs();
        if (callback) callback({ message: 'Semua kuota dibersihkan' });
      } catch (err) {
        if (callback) callback({ message: err.message });
      }
    });

    socket.on('admin_crud_user_quota', async (data, callback) => {
      try {
        const { pool } = require('../config/database');
        const { oldName, newName, newCount } = data;
        const cleanOld = oldName?.trim() || '';
        const cleanNew = newName?.trim() || '';
        const targetCount = Number(newCount) || 0;

        if (cleanOld && cleanOld !== cleanNew) {
          await pool.query(
            `UPDATE pc_sessions SET username = ? WHERE username = ? AND DATE(start_time) = CURDATE()`,
            [cleanNew, cleanOld]
          );
        }

        const [current] = await pool.query(
          `SELECT COUNT(*) as cnt FROM pc_sessions WHERE username = ? AND DATE(start_time) = CURDATE()`,
          [cleanNew]
        );
        const currentCnt = Number(current[0].cnt) || 0;
        const diff = targetCount - currentCnt;

        if (diff > 0) {
          for (let i = 0; i < diff; i++) {
            await pool.query(
              `INSERT INTO pc_sessions (code, username, purpose, start_time) VALUES ('MANUAL', ?, 'Manual Edit Admin', NOW())`,
              [cleanNew]
            );
          }
        } else if (diff < 0) {
          const [rowsToDelete] = await pool.query(
            `SELECT id FROM pc_sessions WHERE username = ? AND DATE(start_time) = CURDATE() ORDER BY id DESC LIMIT ?`,
            [cleanNew, Math.abs(diff)]
          );
          for (const r of rowsToDelete) {
            await pool.query('DELETE FROM pc_sessions WHERE id = ?', [r.id]);
          }
        }

        await cacheService.refreshCache();
        await timerService.broadcastPCs();
        if (callback) callback({ message: `Data user "${cleanNew}" diperbarui` });
      } catch (err) {
        if (callback) callback({ error: err.message });
      }
    });

    // ================= SESSION HISTORY =================
    socket.on('get_session_history', async (data, callback) => {
      try {
        const rows = await sessionModel.getSessionHistory(100);
        if (callback) callback(rows);
      } catch (err) {
        if (callback) callback([]);
      }
    });

    // ================= DISCONNECT =================
    socket.on('disconnect', () => {
      console.log('[Socket] Client disconnected:', socket.id);
    });
  });
}

module.exports = { setupSocket };