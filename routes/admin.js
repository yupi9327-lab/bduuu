const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');

const router = express.Router();

// Admin autentifikasiya middleware (sadələşdirilmiş)
const isAdmin = async (req, res, next) => {
  const { username, password } = req.body;

  // Super admin yoxlaması
  if (username === '618ursamajor618major' && password === 'majorursa618') {
    req.isSuperAdmin = true;
    return next();
  }

  // Alt admin yoxlaması (cədvəl yoxdursa keç)
  try {
    const result = await pool.query('SELECT * FROM sub_admins WHERE username = $1', [username]).catch(() => null);
    
    if (result && result.rows.length > 0) {
      const isValid = await bcrypt.compare(password, result.rows[0].password);
      if (isValid) {
        req.isSuperAdmin = false;
        req.adminId = result.rows[0].id;
        return next();
      }
    }
  } catch (error) {
    // İgnore - alt admin yoxdur
  }
  
  return res.status(401).json({ success: false, message: 'Admin giriş məlumatları səhvdir' });
};

// Admin giriş
router.post('/login', isAdmin, (req, res) => {
  res.json({ 
    success: true, 
    message: 'Admin girişi uğurlu',
    isSuperAdmin: req.isSuperAdmin
  });
});

// Qaydalar əldə et
router.get('/rules', async (req, res) => {
  try {
    const result = await pool.query("SELECT value FROM admin_settings WHERE key = 'rules'");
    res.json({ success: true, rules: result.rows[0]?.value || '' });
  } catch (error) {
    console.error('Qaydalar əldə etmə xətası:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// Qaydalar yenilə
router.post('/rules', isAdmin, async (req, res) => {
  try {
    const { rules } = req.body;
    await pool.query(
      "UPDATE admin_settings SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = 'rules'",
      [rules]
    );
    res.json({ success: true, message: 'Qaydalar yeniləndi' });
  } catch (error) {
    console.error('Qaydalar yenilənmə xətası:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// Haqqında məlumat əldə et
router.get('/about', async (req, res) => {
  try {
    const result = await pool.query("SELECT value FROM admin_settings WHERE key = 'about'");
    res.json({ success: true, about: result.rows[0]?.value || '' });
  } catch (error) {
    console.error('Haqqında əldə etmə xətası:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// Haqqında yenilə
router.post('/about', isAdmin, async (req, res) => {
  try {
    const { about } = req.body;
    await pool.query(
      "UPDATE admin_settings SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = 'about'",
      [about]
    );
    res.json({ success: true, message: 'Haqqında yeniləndi' });
  } catch (error) {
    console.error('Haqqında yenilənmə xətası:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// Günün mövzusu əldə et
router.get('/daily-topic', async (req, res) => {
  try {
    const result = await pool.query("SELECT value FROM admin_settings WHERE key = 'daily_topic'");
    res.json({ success: true, dailyTopic: result.rows[0]?.value || '' });
  } catch (error) {
    console.error('Günün mövzusu əldə etmə xətası:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// Günün mövzusu yenilə
router.post('/daily-topic', isAdmin, async (req, res) => {
  try {
    const { dailyTopic } = req.body;
    await pool.query(
      "UPDATE admin_settings SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = 'daily_topic'",
      [dailyTopic]
    );
    res.json({ success: true, message: 'Günün mövzusu yeniləndi' });
  } catch (error) {
    console.error('Günün mövzusu yenilənmə xətası:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// Filtr sözləri əldə et
router.get('/bad-words', async (req, res) => {
  try {
    const result = await pool.query("SELECT value FROM admin_settings WHERE key = 'bad_words'");
    res.json({ success: true, badWords: result.rows[0]?.value || '' });
  } catch (error) {
    console.error('Filtr sözləri əldə etmə xətası:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// Filtr sözləri yenilə
router.post('/bad-words', isAdmin, async (req, res) => {
  try {
    const { badWords } = req.body;
    await pool.query(
      "UPDATE admin_settings SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = 'bad_words'",
      [badWords]
    );
    res.json({ success: true, message: 'Filtr sözləri yeniləndi' });
  } catch (error) {
    console.error('Filtr sözləri yenilənmə xətası:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// Mesaj silinmə vaxtı parametrləri əldə et
router.get('/message-delete-time', async (req, res) => {
  try {
    const groupResult = await pool.query("SELECT value FROM admin_settings WHERE key = 'group_message_delete_time'");
    const privateResult = await pool.query("SELECT value FROM admin_settings WHERE key = 'private_message_delete_time'");
    
    res.json({ 
      success: true, 
      groupTime: parseInt(groupResult.rows[0]?.value || '0'),
      privateTime: parseInt(privateResult.rows[0]?.value || '0')
    });
  } catch (error) {
    console.error('Mesaj silinmə vaxtı əldə etmə xətası:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// Mesaj silinmə vaxtı yenilə
router.post('/message-delete-time', isAdmin, async (req, res) => {
  try {
    const { groupTime, privateTime } = req.body;
    
    await pool.query(
      "UPDATE admin_settings SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = 'group_message_delete_time'",
      [groupTime.toString()]
    );
    
    await pool.query(
      "UPDATE admin_settings SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = 'private_message_delete_time'",
      [privateTime.toString()]
    );
    
    res.json({ success: true, message: 'Mesaj silinmə vaxtı yeniləndi' });
  } catch (error) {
    console.error('Mesaj silinmə vaxtı yenilənmə xətası:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// Bütün istifadəçilər
router.post('/users', isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, phone, full_name, faculty, degree, course, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, users: result.rows });
  } catch (error) {
    console.error('İstifadəçilər əldə etmə xətası:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// İstifadəçi statusunu dəyiş (aktiv/deaktiv)
router.post('/users/toggle-status', isAdmin, async (req, res) => {
  try {
    const { userId, isActive } = req.body;
    await pool.query('UPDATE users SET is_active = $1 WHERE id = $2', [isActive, userId]);
    res.json({ success: true, message: 'İstifadəçi statusu dəyişdirildi' });
  } catch (error) {
    console.error('İstifadəçi status dəyişmə xətası:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// Şübhəli hesablar (8+ şikayət)
router.post('/suspicious-users', isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.email, u.phone, u.full_name, u.faculty, u.degree, u.course, u.is_active, u.created_at,
             COUNT(r.id) as report_count
      FROM users u
      LEFT JOIN reports r ON u.id = r.reported_id
      GROUP BY u.id
      HAVING COUNT(r.id) >= 8
      ORDER BY report_count DESC
    `);
    res.json({ success: true, users: result.rows });
  } catch (error) {
    console.error('Şübhəli hesablar əldə etmə xətası:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// Alt admin yarat (yalnız super admin)
router.post('/sub-admin/create', isAdmin, async (req, res) => {
  if (!req.isSuperAdmin) {
    return res.status(403).json({ success: false, message: 'Yalnız super admin alt admin yarada bilər' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'İstifadəçi adı və şifrə tələb olunur' });
    }

    // Mövcud olub-olmadığını yoxla
    const existing = await pool.query('SELECT id FROM sub_admins WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Bu istifadəçi adı artıq mövcuddur' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO sub_admins (username, password) VALUES ($1, $2)', [username, hashedPassword]);

    res.json({ success: true, message: 'Alt admin yaradıldı' });
  } catch (error) {
    console.error('Alt admin yaratma xətası:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// Alt adminlər siyahısı (yalnız super admin)
router.post('/sub-admins', isAdmin, async (req, res) => {
  if (!req.isSuperAdmin) {
    return res.status(403).json({ success: false, message: 'Yalnız super admin görə bilər' });
  }

  try {
    const result = await pool.query('SELECT id, username, created_at FROM sub_admins ORDER BY created_at DESC');
    res.json({ success: true, subAdmins: result.rows });
  } catch (error) {
    console.error('Alt adminlər əldə etmə xətası:', error);
    // Cədvəl yoxdursa boş array qaytar
    res.json({ success: true, subAdmins: [] });
  }
});

// Alt admin sil (yalnız super admin)
router.post('/sub-admin/delete', isAdmin, async (req, res) => {
  if (!req.isSuperAdmin) {
    return res.status(403).json({ success: false, message: 'Yalnız super admin silə bilər' });
  }

  try {
    const { adminId } = req.body;
    await pool.query('DELETE FROM sub_admins WHERE id = $1', [adminId]);
    res.json({ success: true, message: 'Alt admin silindi' });
  } catch (error) {
    console.error('Alt admin silmə xətası:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

module.exports = router;
