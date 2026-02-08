# BSU Chat - Bakı Dövlət Universiteti Chat Platforması

## 📋 Layihə Haqqında

BSU Chat - Bakı Dövlət Universitetinin 16 fakültəsi üçün real-time mesajlaşma platforması. Tələbələr öz fakültələrinə görə qrup söhbətlərində iştirak edə, şəxsi mesajlaşa və bir-birilə əlaqə saxlaya bilərlər.

## 🌟 Əsas Xüsusiyyətlər

### İstifadəçi Funksiyaları
- ✅ **Qeydiyyat və Autentifikasiya**
  - @bsu.edu.az email validasiyası
  - +994 telefon nömrəsi formatı
  - 3 təsdiqlənmə sualı (minimum 2 doğru cavab)
  - Şifrəli giriş sistemi

- 💬 **16 Fakültə üçün Qrup Chatları**
  - Mexanika-riyaziyyat fakültəsi
  - Tətbiqi riyaziyyat və kibernetika fakültəsi
  - Fizika fakültəsi
  - Kimya fakültəsi
  - Biologiya fakültəsi
  - Ekologiya və torpaqşünaslıq fakültəsi
  - Coğrafiya fakültəsi
  - Geologiya fakültəsi
  - Filologiya fakültəsi
  - Tarix fakültəsi
  - Beynəlxalq münasibətlər və iqtisadiyyat fakültəsi
  - Hüquq fakültəsi
  - Jurnalistika fakültəsi
  - İnformasiya və sənəd menecmenti fakültəsi
  - Şərqşünaslıq fakültəsi
  - Sosial elmlər və psixologiya fakültəsi

- 🔒 **Şəxsi Mesajlaşma**
  - İstənilən istifadəçi ilə şəxsi danışıq
  - Əngəlləmə funksiyası
  - Şikayət sistemi

- 👤 **Profil İdarəetməsi**
  - Ad, soyad dəyişikliyi
  - Fakültə, dərəcə, kurs yeniləmə

### Admin Paneli
- 📋 **Qaydalar İdarəetməsi**
- ℹ️ **Haqqında Bölməsi**
- 👥 **İstifadəçilər İdarəetməsi**
  - Bütün istifadəçilərin siyahısı
  - Aktiv/Deaktiv statusu dəyişmə
  - İstifadəçi sayı statistikası

- ⚠️ **Şübhəli Hesablar** (8+ şikayət)
- 📰 **Günün Mövzusu**
- 🚫 **Nalayiq Sözlər Filtri**
- ⏰ **Mesaj Avtomatik Silinmə Vaxtı**
  - Qrup chat mesajları üçün
  - Şəxsi mesajlar üçün

- 👔 **Alt Admin Yaratma** (Yalnız Super Admin)

## 🔧 Texnologiyalar

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Socket.IO** - Real-time kommunikasiya
- **PostgreSQL** - Database
- **bcrypt** - Şifrələmə
- **express-session** - Session idarəetməsi

### Frontend
- **HTML5/CSS3** - Struktur və dizayn
- **Vanilla JavaScript** - İnteraktivlik
- **Socket.IO Client** - Real-time mesajlaşma

### Database
- **PostgreSQL** (Render.com-da host edilir)
- Bağlantı məlumatları `.env` faylında

## 📦 Quraşdırma

### Lokal Development

```bash
# Repository klonla
git clone https://github.com/yupi9327-lab/bduuu.git
cd bduuu

# Dependencies yüklə
npm install

# Environment variables
# .env faylını düzəlt və database məlumatlarını əlavə et

# Database migration
npm run migrate

# Serveri başlat
npm start
```

### Environment Variables

```env
DATABASE_URL=postgresql://user:password@host:5432/database
SESSION_SECRET=your_secret_key
PORT=3000
NODE_ENV=production
```

## 🚀 Render.com Deployment

### 1. Render.com-da PostgreSQL Database Yarat

1. Render.com dashboard-a daxil ol
2. "New +" → "PostgreSQL" seç
3. Database adı: `bdu_xeq0` (və ya istənilən ad)
4. Database yaradıldıqdan sonra **Internal Database URL** kopyala

### 2. Web Service Yarat

1. Render.com-da "New +" → "Web Service" seç
2. GitHub repository-ni bağla: `yupi9327-lab/bduuu`
3. Aşağıdakı parametrləri təyin et:

**Build Settings:**
```
Build Command: npm install
Start Command: npm start
```

**Environment Variables:**
```
DATABASE_URL = [Render PostgreSQL Internal URL]
SESSION_SECRET = bsu_chat_secret_key_major_ursa_618
NODE_ENV = production
```

### 3. Database Migration

Service deploy edildikdən sonra Render Shell-də:

```bash
npm run migrate
```

## 🔐 Admin Girişi

**Super Admin:**
- İstifadəçi adı: `618ursamajor618major`
- Şifrə: `majorursa618`

## 📊 Database Strukturu

### Cədvəllər
- `users` - İstifadəçi məlumatları
- `group_messages` - Qrup chat mesajları
- `private_messages` - Şəxsi mesajlar
- `blocks` - Əngəlləmə məlumatları
- `reports` - Şikayətlər
- `admin_settings` - Admin panel parametrləri
- `sub_admins` - Alt adminlər
- `session` - Session məlumatları

## 🌐 URL-lər

- **GitHub Repository**: https://github.com/yupi9327-lab/bduuu
- **Render.com Deployment**: [Deploy edildikdən sonra əlavə ediləcək]

## 🛠️ API Endpoints

### Auth
- `POST /api/auth/register` - Qeydiyyat
- `POST /api/auth/login` - Giriş
- `POST /api/auth/logout` - Çıxış
- `GET /api/auth/session` - Session yoxlama
- `GET /api/auth/faculties` - Fakültələr siyahısı
- `GET /api/auth/verification-questions` - Təsdiqləmə sualları

### Chat
- `GET /api/chat/group/:faculty` - Qrup mesajları
- `GET /api/chat/private/:otherUserId` - Şəxsi mesajlar
- `POST /api/chat/block` - İstifadəçi əngəllə
- `POST /api/chat/unblock` - Əngəli götür
- `POST /api/chat/report` - Şikayət et

### Admin
- `POST /api/admin/login` - Admin girişi
- `GET /api/admin/rules` - Qaydalar əldə et
- `POST /api/admin/rules` - Qaydalar yenilə
- `GET /api/admin/about` - Haqqında əldə et
- `POST /api/admin/about` - Haqqında yenilə
- `POST /api/admin/users` - Bütün istifadəçilər
- `POST /api/admin/users/toggle-status` - İstifadəçi statusunu dəyiş
- `POST /api/admin/suspicious-users` - Şübhəli hesablar

### Users
- `GET /api/users/:userId` - İstifadəçi məlumatları
- `PUT /api/users/:userId` - Profil yenilə

## 🎨 Dizayn Xüsusiyyətləri

- Modern gradient rənglər
- Responsive dizayn (mobil və desktop)
- Animasiyalı mesaj görünməsi
- Yumru künclü mesaj baloncukları
- Dairəvi profil avatar-ları
- Auto-scroll funksiyası
- Real-time notification-lar

## ⚡ Performans Xüsusiyyətləri

- Socket.IO ilə real-time əlaqə
- Bakı saatına görə tarix/saat
- Mesaj avtomatik silinmə (konfiqurasiya edilə bilən)
- Nalayiq sözlər filtri
- Database indexləri ilə sürətli sorğular

## 🔄 Gələcək Təkmilləşdirmələr

- [ ] Şəxsi chat UI-ı təkmilləşdirmə
- [ ] Fayl və şəkil göndərmə
- [ ] Emoji dəstəyi
- [ ] Axtarış funksiyası
- [ ] İstifadəçi online/offline statusu
- [ ] Push notification-lar
- [ ] Mesaj oxundu işarəsi

## 📝 Lisenziya

Bu layihə Bakı Dövlət Universiteti tələbələri üçün hazırlanmışdır.

## 👨‍💻 Komanda

BSU Chat Development Team

---

**Son Yeniləmə**: 2025-01-15
**Versiya**: 1.0.0
**Status**: ✅ Production Ready
