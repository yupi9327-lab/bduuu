const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');

const router = express.Router();

// Fakültələr və korpus məlumatları
const FACULTIES = [
  { name: 'Mexanika-riyaziyyat fakültəsi', corpus: '3' },
  { name: 'Tətbiqi riyaziyyat və kibernetika fakültəsi', corpus: '3' },
  { name: 'Fizika fakültəsi', corpus: 'əsas' },
  { name: 'Kimya fakültəsi', corpus: 'əsas' },
  { name: 'Biologiya fakültəsi', corpus: 'əsas' },
  { name: 'Ekologiya və torpaqşünaslıq fakültəsi', corpus: 'əsas' },
  { name: 'Coğrafiya fakültəsi', corpus: 'əsas' },
  { name: 'Geologiya fakültəsi', corpus: 'əsas' },
  { name: 'Filologiya fakültəsi', corpus: '1' },
  { name: 'Tarix fakültəsi', corpus: '3' },
  { name: 'Beynəlxalq münasibətlər və iqtisadiyyat fakültəsi', corpus: '1' },
  { name: 'Hüquq fakültəsi', corpus: '1' },
  { name: 'Jurnalistika fakültəsi', corpus: '2' },
  { name: 'İnformasiya və sənəd menecmenti fakültəsi', corpus: '2' },
  { name: 'Şərqşünaslıq fakültəsi', corpus: '2' },
  { name: 'Sosial elmlər və psixologiya fakültəsi', corpus: '2' }
];

// Qeydiyyat
router.post('/register', async (req, res) => {
  try {
    const { email, password, phone, fullName, faculty, degree, course, verificationAnswers } = req.body;

    // Validation
    if (!email || !password || !phone || !fullName || !faculty || !degree || !course) {
      return res.status(400).json({ success: false, message: 'Bütün sahələr doldurulmalıdır' });
    }

    // Email formatı yoxlanışı (@bsu.edu.az)
    if (!email.endsWith('@bsu.edu.az')) {
      return res.status(400).json({ success: false, message: 'Email @bsu.edu.az ilə bitməlidir' });
    }

    // Telefon formatı yoxlanışı (+994 ilə başlamalı və 13 simvol)
    if (!phone.startsWith('+994') || phone.length !== 13) {
      return res.status(400).json({ success: false, message: 'Telefon nömrəsi düzgün formatda deyil (+994XXXXXXXXX)' });
    }

    // Kurs yoxlanışı (1-6 arası)
    if (course < 1 || course > 6) {
      return res.status(400).json({ success: false, message: 'Kurs 1-6 arasında olmalıdır' });
    }

    // Doğrulama yoxlanışı - minimum 2 doğru cavab
    const correctAnswers = verificationAnswers.filter(answer => answer.isCorrect).length;
    if (correctAnswers < 2) {
      return res.status(400).json({ success: false, message: 'Minimum 2 sual doğru cavablanmalıdır' });
    }

    // İstifadəçi artıq qeydiyyatdan keçibmi?
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR phone = $2',
      [email, phone]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Bu email və ya telefon artıq qeydiyyatdan keçib' });
    }

    // Şifrəni hash et
    const hashedPassword = await bcrypt.hash(password, 10);

    // İstifadəçini database-ə əlavə et
    const result = await pool.query(
      'INSERT INTO users (email, password, phone, full_name, faculty, degree, course) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, full_name, faculty, degree, course',
      [email, hashedPassword, phone, fullName, faculty, degree, course]
    );

    res.json({ 
      success: true, 
      message: 'Qeydiyyat uğurla tamamlandı',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Qeydiyyat xətası:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// Giriş
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email və şifrə daxil edilməlidir' });
    }

    // İstifadəçini tap
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Email və ya şifrə səhvdir' });
    }

    const user = result.rows[0];

    // İstifadəçi aktiv deyilsə
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Hesabınız deaktiv edilib' });
    }

    // Şifrəni yoxla
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Email və ya şifrə səhvdir' });
    }

    // Session-a saxla
    req.session.userId = user.id;
    req.session.userEmail = user.email;

    res.json({ 
      success: true, 
      message: 'Giriş uğurlu',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        faculty: user.faculty,
        degree: user.degree,
        course: user.course
      }
    });

  } catch (error) {
    console.error('Giriş xətası:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// Çıxış
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Çıxış zamanı xəta baş verdi' });
    }
    res.json({ success: true, message: 'Çıxış uğurlu' });
  });
});

// Session yoxlama
router.get('/session', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Aktiv session yoxdur' });
  }

  try {
    const result = await pool.query(
      'SELECT id, email, full_name, faculty, degree, course, is_active FROM users WHERE id = $1',
      [req.session.userId]
    );

    if (result.rows.length === 0 || !result.rows[0].is_active) {
      req.session.destroy();
      return res.status(401).json({ success: false, message: 'İstifadəçi tapılmadı və ya deaktivdir' });
    }

    res.json({ 
      success: true, 
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Session yoxlama xətası:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// Fakültələr siyahısı və korpus məlumatları
router.get('/faculties', (req, res) => {
  res.json({ success: true, faculties: FACULTIES });
});

// Random 3 doğrulama sualı al
router.get('/verification-questions', (req, res) => {
  const shuffled = [...FACULTIES].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 3);
  
  const questions = selected.map((faculty, index) => ({
    id: FACULTIES.indexOf(faculty),
    question: `${faculty.name} hansı korpusda yerləşir?`,
    correctAnswer: faculty.corpus
  }));

  res.json({ success: true, questions });
});

module.exports = router;
