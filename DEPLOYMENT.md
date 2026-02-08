# 🚀 Render.com Deployment Təlimatı

## Addım 1: Render.com-a Daxil Ol

1. https://render.com saytına daxil ol
2. GitHub hesabınla qeydiyyatdan keç və ya daxil ol

## Addım 2: PostgreSQL Database Yarat

1. Dashboard-da **"New +"** düyməsinə klik et
2. **"PostgreSQL"** seç
3. Database parametrləri:
   - **Name**: `bdu_xeq0` (və ya istənilən ad)
   - **Database**: `bdu_xeq0`
   - **User**: avtomatik yaradılacaq
   - **Region**: seç (Frankfurt və ya yaxın region)
   - **PostgreSQL Version**: 16 (ən son versiya)
   - **Plan**: Free (başlanğıc üçün)

4. **"Create Database"** klik et
5. ⏰ Database yaradılmasını gözlə (1-2 dəqiqə)

## Addım 3: Database Məlumatlarını Kopyala

Database yaradıldıqdan sonra səhifənin yuxarısındakı **"Info"** bölməsinə keç və aşağıdakı məlumatları kopyala:

```
Internal Database URL: postgresql://bdu_xeq0_user:parol@dpg-xxx.oregon-postgres.render.com/bdu_xeq0
```

**ÖNƏMLİ**: Internal Database URL-ni kopyala (External deyil!)

## Addım 4: Web Service Yarat

1. Dashboard-a qayıt və **"New +"** → **"Web Service"** seç
2. **"Build and deploy from a Git repository"** seç
3. **"Connect repository"** → GitHub hesabını bağla
4. Repository seç: **`yupi9327-lab/bduuu`**
5. Parametrləri təyin et:

### Basic Settings:
```
Name: bsu-chat (və ya istənilən ad)
Region: Frankfurt (database ilə eyni region)
Branch: main
Root Directory: (boş burax)
Runtime: Node
Build Command: npm install
Start Command: npm start
```

### Instance Type:
```
Free (başlanğıc üçün)
```

## Addım 5: Environment Variables Əlavə Et

Səhifəni aşağı scroll et və **"Environment Variables"** bölməsinə keç:

**Əlavə et:**

1. `DATABASE_URL`
   - **Value**: (Addım 3-də kopyaladığın Internal Database URL)
   - Nümunə: `postgresql://bdu_xeq0_user:D3ph0PGPA4p7JYhn38O0yfEzbjIfzBG0@dpg-d8i7poqgzcho73hktc1g-a.oregon-postgres.render.com:5432/bdu_xeq0`

2. `SESSION_SECRET`
   - **Value**: `bsu_chat_secret_key_major_ursa_618`

3. `NODE_ENV`
   - **Value**: `production`

4. `PORT`
   - **Value**: `3000`

## Addım 6: Deploy Et

1. **"Create Web Service"** düyməsinə klik et
2. ⏰ Deploy prosesinə baxla (3-5 dəqiqə)
3. Log-larda xətalar yoxla

## Addım 7: Database Migration

Service uğurla deploy edildikdən sonra:

1. Service səhifəsində **"Shell"** bölməsinə keç
2. Aşağıdakı əmri icra et:

```bash
npm run migrate
```

3. ✅ "Database migration uğurla tamamlandı!" mesajını gözlə

## Addım 8: Saytı Test Et

1. Service səhifəsində **URL**-i tap (nümunə: `https://bsu-chat.onrender.com`)
2. URL-i açıb saytı test et:
   - Qeydiyyat funksiyası
   - Giriş
   - Chat otaqları
   - Admin paneli

## 🔧 Problemlərin Həlli

### Database bağlantı xətası
```
❌ PostgreSQL bağlantı xətası
```
**Həll**: 
- DATABASE_URL düzgün kopyalanıbmı yoxla
- Internal Database URL istifadə etdiyinə əmin ol
- Database və Web Service eyni regiondamı yoxla

### Migration xətası
```
❌ Migration xətası
```
**Həll**:
- Shell-də `npm run migrate` əmrini yenidən icra et
- Log-lara bax və xəta mesajını oxu

### Port xətası
```
Error: listen EADDRINUSE: address already in use
```
**Həll**:
- Bu xəta yaranmamalıdır (Render avtomatik port təyin edir)
- Əgər yaranarsa, Environment Variables-da PORT olduğuna əmin ol

### 503 Service Unavailable
**Həll**:
- Deploy tamamlanıbmı yoxla
- Log-larda xətalar varmı bax
- Service-i restart et

## 📊 Database Konsolu

Database-ə birbaşa daxil olmaq üçün:

1. PostgreSQL dashboard-a keç
2. **"Connect"** bölməsində **"PSQL Command"** kopyala
3. Lokal terminalda və ya Render Shell-də icra et

```bash
PGPASSWORD=parol psql -h dpg-xxx.oregon-postgres.render.com -U bdu_xeq0_user bdu_xeq0
```

**SQL sorğular:**
```sql
-- Bütün istifadəçilər
SELECT * FROM users;

-- Mesajlar sayı
SELECT COUNT(*) FROM group_messages;

-- Admin settings
SELECT * FROM admin_settings;
```

## 🎯 Super Admin Girişi

Sayt deploy edildikdən sonra admin panelə daxil ol:

1. Ana səhifədə **"Admin Paneli"** seç
2. Giriş:
   - **İstifadəçi adı**: `618ursamajor618major`
   - **Şifrə**: `majorursa618`

## ✅ Deployment Tamamlandı!

Artıq BSU Chat platforması Render.com-da işləyir və istifadəyə hazırdır! 🎉

**Sayt URL**: `https://[service-name].onrender.com`

## 📝 Qeydlər

- Free plan ilə service 15 dəqiqə aktivlik olmadıqda "sleep" moduna keçir
- İlk istək 30-50 saniyə çəkə bilər (cold start)
- Paid plan ilə bu problem yoxdur
- Database 90 gün aktivlik olmadıqda silinir (Free plan)

---

**Uğurlar! 🚀**
