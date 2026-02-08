const express = require('express');
const pool = require('../db');

const router = express.Router();

// İstifadəçi məlumatlarını əldə et
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      'SELECT id, email, phone, full_name, faculty, degree, course, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'İstifadəçi tapılmadı' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('İstifadəçi məlumatları əldə etmə xətası:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// İstifadəçi məlumatlarını yenilə
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { fullName, faculty, degree, course } = req.body;

    // Validation
    if (!fullName || !faculty || !degree || !course) {
      return res.status(400).json({ success: false, message: 'Bütün sahələr doldurulmalıdır' });
    }

    if (course < 1 || course > 6) {
      return res.status(400).json({ success: false, message: 'Kurs 1-6 arasında olmalıdır' });
    }

    await pool.query(
      'UPDATE users SET full_name = $1, faculty = $2, degree = $3, course = $4 WHERE id = $5',
      [fullName, faculty, degree, course, userId]
    );

    res.json({ success: true, message: 'Məlumatlar yeniləndi' });
  } catch (error) {
    console.error('İstifadəçi məlumatları yenilənmə xətası:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// Fakültəyə görə istifadəçilər
router.get('/faculty/:faculty', async (req, res) => {
  try {
    const { faculty } = req.params;

    const result = await pool.query(
      'SELECT id, full_name, faculty, degree, course FROM users WHERE faculty = $1 AND is_active = true ORDER BY full_name ASC',
      [faculty]
    );

    res.json({ success: true, users: result.rows });
  } catch (error) {
    console.error('Fakültəyə görə istifadəçilər əldə etmə xətası:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// İstifadəçi axtar (ad və ya email ilə)
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;

    const result = await pool.query(
      `SELECT id, full_name, email, faculty, degree, course 
       FROM users 
       WHERE (LOWER(full_name) LIKE LOWER($1) OR LOWER(email) LIKE LOWER($1)) 
       AND is_active = true 
       ORDER BY full_name ASC 
       LIMIT 20`,
      [`%${query}%`]
    );

    res.json({ success: true, users: result.rows });
  } catch (error) {
    console.error('İstifadəçi axtarış xətası:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

module.exports = router;
