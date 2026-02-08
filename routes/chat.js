const express = require('express');
const pool = require('../db');

const router = express.Router();

// Qrup mesajları əldə et
router.get('/group/:faculty', async (req, res) => {
  try {
    const { faculty } = req.params;
    const { limit = 50 } = req.query;

    const result = await pool.query(`
      SELECT gm.id, gm.message, gm.created_at, 
             u.id as user_id, u.full_name, u.faculty, u.degree, u.course
      FROM group_messages gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.faculty = $1
      ORDER BY gm.created_at DESC
      LIMIT $2
    `, [faculty, limit]);

    res.json({ success: true, messages: result.rows.reverse() });
  } catch (error) {
    console.error('Qrup mesajları əldə etmə xətası:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// Şəxsi mesajlar əldə et
router.get('/private/:otherUserId', async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId tələb olunur' });
    }

    const result = await pool.query(`
      SELECT pm.id, pm.message, pm.created_at, pm.sender_id, pm.receiver_id,
             u.full_name as sender_name, u.faculty as sender_faculty, 
             u.degree as sender_degree, u.course as sender_course
      FROM private_messages pm
      JOIN users u ON pm.sender_id = u.id
      WHERE (pm.sender_id = $1 AND pm.receiver_id = $2) 
         OR (pm.sender_id = $2 AND pm.receiver_id = $1)
      ORDER BY pm.created_at ASC
      LIMIT 100
    `, [userId, otherUserId]);

    res.json({ success: true, messages: result.rows });
  } catch (error) {
    console.error('Şəxsi mesajlar əldə etmə xətası:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// Əngəlləmə
router.post('/block', async (req, res) => {
  try {
    const { blockerId, blockedId } = req.body;

    if (!blockerId || !blockedId) {
      return res.status(400).json({ success: false, message: 'blockerId və blockedId tələb olunur' });
    }

    if (blockerId === blockedId) {
      return res.status(400).json({ success: false, message: 'Özünüzü əngəlləyə bilməzsiniz' });
    }

    // Artıq əngəllənib yoxla
    const existing = await pool.query(
      'SELECT id FROM blocks WHERE blocker_id = $1 AND blocked_id = $2',
      [blockerId, blockedId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Artıq əngəllənib' });
    }

    await pool.query(
      'INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2)',
      [blockerId, blockedId]
    );

    res.json({ success: true, message: 'İstifadəçi əngəlləndi' });
  } catch (error) {
    console.error('Əngəlləmə xətası:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// Əngəli götür
router.post('/unblock', async (req, res) => {
  try {
    const { blockerId, blockedId } = req.body;

    await pool.query(
      'DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2',
      [blockerId, blockedId]
    );

    res.json({ success: true, message: 'Əngəl götürüldü' });
  } catch (error) {
    console.error('Əngəl götürmə xətası:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// Əngəllənmiş istifadəçilər siyahısı
router.get('/blocked/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(`
      SELECT u.id, u.full_name, u.faculty, u.degree, u.course
      FROM blocks b
      JOIN users u ON b.blocked_id = u.id
      WHERE b.blocker_id = $1
      ORDER BY b.created_at DESC
    `, [userId]);

    res.json({ success: true, blockedUsers: result.rows });
  } catch (error) {
    console.error('Əngəllənmiş istifadəçilər əldə etmə xətası:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// Əngəlləmə statusu yoxla
router.get('/is-blocked', async (req, res) => {
  try {
    const { userId1, userId2 } = req.query;

    if (!userId1 || !userId2) {
      return res.status(400).json({ success: false, message: 'userId1 və userId2 tələb olunur' });
    }

    const result = await pool.query(
      'SELECT id FROM blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)',
      [userId1, userId2]
    );

    res.json({ success: true, isBlocked: result.rows.length > 0 });
  } catch (error) {
    console.error('Əngəlləmə status yoxlama xətası:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// Şikayət et
router.post('/report', async (req, res) => {
  try {
    const { reporterId, reportedId, reason } = req.body;

    if (!reporterId || !reportedId) {
      return res.status(400).json({ success: false, message: 'reporterId və reportedId tələb olunur' });
    }

    if (reporterId === reportedId) {
      return res.status(400).json({ success: false, message: 'Özünüzü şikayət edə bilməzsiniz' });
    }

    await pool.query(
      'INSERT INTO reports (reporter_id, reported_id, reason) VALUES ($1, $2, $3)',
      [reporterId, reportedId, reason || 'Səbəb göstərilməyib']
    );

    res.json({ success: true, message: 'Şikayət göndərildi' });
  } catch (error) {
    console.error('Şikayət etmə xətası:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

module.exports = router;
