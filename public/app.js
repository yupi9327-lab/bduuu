// Global variables
let socket;
let currentUser = null;
let currentRoom = null;
let verificationQuestions = [];
let badWords = [];

// Bakı saatı əldə etmək
function getBakuTime() {
    return new Date().toLocaleString('az-AZ', { 
        timeZone: 'Asia/Baku',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Notification göstər
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Ekran dəyiş
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Doğrulama sualları yüklə
async function loadVerificationQuestions() {
    try {
        const response = await fetch('/api/auth/verification-questions');
        const data = await response.json();
        
        if (data.success) {
            verificationQuestions = data.questions;
        }
    } catch (error) {
        console.error('Doğrulama sualları yüklənmə xətası:', error);
    }
}

// Doğrulama ekranı göstər
function showVerification() {
    // Form validasiyası
    const fullName = document.getElementById('register-fullname').value;
    const emailPrefix = document.getElementById('register-email-prefix').value;
    const phone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;
    const faculty = document.getElementById('register-faculty').value;
    const degree = document.getElementById('register-degree').value;
    const course = document.getElementById('register-course').value;
    
    if (!fullName || !emailPrefix || !phone || !password || !faculty || !degree || !course) {
        showNotification('Bütün sahələr doldurulmalıdır', 'error');
        return;
    }
    
    if (phone.length !== 9 || !/^\d+$/.test(phone)) {
        showNotification('Telefon nömrəsi 9 rəqəm olmalıdır', 'error');
        return;
    }
    
    // Doğrulama suallarını göstər
    const container = document.getElementById('verification-questions');
    container.innerHTML = '';
    
    verificationQuestions.forEach((q, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'verification-question';
        questionDiv.innerHTML = `
            <h4>${index + 1}. ${q.question}</h4>
            <div class="verification-options">
                <div class="verification-option">
                    <input type="radio" name="q${index}" value="1" id="q${index}_1">
                    <label for="q${index}_1">1</label>
                </div>
                <div class="verification-option">
                    <input type="radio" name="q${index}" value="2" id="q${index}_2">
                    <label for="q${index}_2">2</label>
                </div>
                <div class="verification-option">
                    <input type="radio" name="q${index}" value="3" id="q${index}_3">
                    <label for="q${index}_3">3</label>
                </div>
                <div class="verification-option">
                    <input type="radio" name="q${index}" value="əsas" id="q${index}_esas">
                    <label for="q${index}_esas">Əsas korpus</label>
                </div>
            </div>
        `;
        container.appendChild(questionDiv);
    });
    
    showScreen('verification-screen');
}

// Qeydiyyat göndər
async function submitRegistration() {
    try {
        // Form məlumatları
        const fullName = document.getElementById('register-fullname').value;
        const emailPrefix = document.getElementById('register-email-prefix').value;
        const email = `${emailPrefix}@bsu.edu.az`;
        const phone = `+994${document.getElementById('register-phone').value}`;
        const password = document.getElementById('register-password').value;
        const faculty = document.getElementById('register-faculty').value;
        const degree = document.getElementById('register-degree').value;
        const course = parseInt(document.getElementById('register-course').value);
        
        // Doğrulama cavabları
        const verificationAnswers = verificationQuestions.map((q, index) => {
            const selected = document.querySelector(`input[name="q${index}"]:checked`);
            if (!selected) {
                throw new Error('Bütün sualları cavablandırın');
            }
            return {
                question: q.question,
                userAnswer: selected.value,
                correctAnswer: q.correctAnswer,
                isCorrect: selected.value === q.correctAnswer
            };
        });
        
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                phone,
                fullName,
                faculty,
                degree,
                course,
                verificationAnswers
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Qeydiyyat uğurlu! Daxil ola bilərsiniz', 'success');
            showScreen('login-screen');
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        showNotification(error.message || 'Qeydiyyat xətası', 'error');
    }
}

// Giriş
async function handleLogin(event) {
    event.preventDefault();
    
    try {
        const emailPrefix = document.getElementById('login-email-prefix').value;
        const email = `${emailPrefix}@bsu.edu.az`;
        const password = document.getElementById('login-password').value;
        
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            initializeChat();
            showNotification('Xoş gəldiniz!', 'success');
            showScreen('chat-screen');
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        showNotification('Giriş xətası', 'error');
    }
}

// Admin giriş
async function handleAdminLogin(event) {
    event.preventDefault();
    
    try {
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;
        
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Admin girişi uğurlu', 'success');
            loadAdminPanel();
            showScreen('admin-panel-screen');
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        showNotification('Admin giriş xətası', 'error');
    }
}

// Chat initialize
function initializeChat() {
    // Socket.IO bağlantı
    socket = io();
    
    socket.on('connect', () => {
        console.log('Socket bağlandı');
        socket.emit('user:join', currentUser.id);
    });
    
    socket.on('message:group:new', (data) => {
        if (currentRoom === data.faculty) {
            addMessageToUI(data, false);
        }
    });
    
    socket.on('message:private:new', (data) => {
        // Şəxsi mesaj gəldikdə
        addMessageToUI(data, data.senderId === currentUser.id);
    });
    
    // Fakültələr yüklə
    loadFaculties();
    
    // Günün mövzusunu yüklə
    loadDailyTopic();
    
    // Filtr sözlərini yüklə
    loadBadWords();
}

// Fakültələr yüklə
async function loadFaculties() {
    try {
        const response = await fetch('/api/auth/faculties');
        const data = await response.json();
        
        if (data.success) {
            const list = document.getElementById('faculties-list');
            list.innerHTML = '';
            
            data.faculties.forEach(faculty => {
                const item = document.createElement('div');
                item.className = 'faculty-item';
                item.textContent = faculty.name;
                item.onclick = () => joinRoom(faculty.name);
                list.appendChild(item);
            });
        }
    } catch (error) {
        console.error('Fakültələr yüklənmə xətası:', error);
    }
}

// Otağa qoşul
async function joinRoom(faculty) {
    currentRoom = faculty;
    socket.emit('room:join', faculty);
    
    document.getElementById('current-room-name').textContent = faculty;
    document.querySelectorAll('.faculty-item').forEach(item => {
        item.classList.remove('active');
        if (item.textContent === faculty) {
            item.classList.add('active');
        }
    });
    
    // Mesajları yüklə
    loadGroupMessages(faculty);
    hideFaculties();
}

// Qrup mesajları yüklə
async function loadGroupMessages(faculty) {
    try {
        const response = await fetch(`/api/chat/group/${encodeURIComponent(faculty)}`);
        const data = await response.json();
        
        if (data.success) {
            const container = document.getElementById('messages-container');
            container.innerHTML = '';
            
            data.messages.forEach(msg => {
                addMessageToUI({
                    id: msg.id,
                    message: msg.message,
                    userName: msg.full_name,
                    userFaculty: msg.faculty,
                    userDegree: msg.degree,
                    userCourse: msg.course,
                    userId: msg.user_id,
                    createdAt: msg.created_at
                }, msg.user_id === currentUser.id);
            });
            
            scrollToBottom();
        }
    } catch (error) {
        console.error('Mesajlar yüklənmə xətası:', error);
    }
}

// Mesaj göndər
function sendMessage() {
    const input = document.getElementById('message-input');
    let message = input.value.trim();
    
    if (!message || !currentRoom) return;
    
    // Filtr tətbiq et
    message = applyBadWordsFilter(message);
    
    socket.emit('message:group', {
        faculty: currentRoom,
        userId: currentUser.id,
        message,
        userName: currentUser.fullName,
        userFaculty: currentUser.faculty,
        userDegree: currentUser.degree,
        userCourse: currentUser.course
    });
    
    input.value = '';
}

// Mesajı UI-a əlavə et
function addMessageToUI(data, isOwn) {
    const container = document.getElementById('messages-container');
    const wasAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwn ? 'own' : ''}`;
    
    const initials = data.userName ? data.userName.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${initials}</div>
        <div class="message-content">
            <div class="message-bubble">
                ${!isOwn ? `
                <div class="message-header">
                    <span class="message-name">${data.userName}</span>
                    <span class="message-info">${data.userFaculty} • ${data.userDegree} • ${data.userCourse}-ci kurs</span>
                </div>
                ` : ''}
                <div class="message-text">${data.message}</div>
                <div class="message-time">${getBakuTime()}</div>
                <div class="message-menu" onclick="showMessageMenu(event, ${data.userId}, '${data.userName}')">⋮</div>
            </div>
        </div>
    `;
    
    container.appendChild(messageDiv);
    
    if (wasAtBottom) {
        scrollToBottom();
    }
}

// Mesaj menyu göstər
function showMessageMenu(event, userId, userName) {
    event.stopPropagation();
    
    if (userId === currentUser.id) return;
    
    const existingMenu = document.querySelector('.message-dropdown');
    if (existingMenu) existingMenu.remove();
    
    const menu = document.createElement('div');
    menu.className = 'message-dropdown active';
    menu.innerHTML = `
        <div class="dropdown-item" onclick="openPrivateChat(${userId}, '${userName}')">💬 Şəxsi mesaj</div>
        <div class="dropdown-item" onclick="blockUser(${userId})">🚫 Əngəllə</div>
        <div class="dropdown-item" onclick="reportUser(${userId})">⚠️ Şikayət et</div>
    `;
    
    event.target.parentElement.appendChild(menu);
    
    setTimeout(() => {
        document.addEventListener('click', function closeMenu() {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        });
    }, 0);
}

// Şəxsi chat aç
function openPrivateChat(userId, userName) {
    // TODO: Şəxsi chat funksionallığı
    showNotification(`${userName} ilə şəxsi chat açılır...`, 'info');
}

// İstifadəçi əngəllə
async function blockUser(userId) {
    try {
        const response = await fetch('/api/chat/block', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                blockerId: currentUser.id,
                blockedId: userId
            })
        });
        
        const data = await response.json();
        showNotification(data.message, data.success ? 'success' : 'error');
    } catch (error) {
        showNotification('Əngəlləmə xətası', 'error');
    }
}

// İstifadəçi şikayət et
async function reportUser(userId) {
    try {
        const response = await fetch('/api/chat/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                reporterId: currentUser.id,
                reportedId: userId
            })
        });
        
        const data = await response.json();
        showNotification(data.message, data.success ? 'success' : 'error');
    } catch (error) {
        showNotification('Şikayət xətası', 'error');
    }
}

// Aşağı scroll
function scrollToBottom() {
    const container = document.getElementById('messages-container');
    container.scrollTop = container.scrollHeight;
}

// Günün mövzusu yüklə
async function loadDailyTopic() {
    try {
        const response = await fetch('/api/admin/daily-topic');
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('daily-topic').textContent = data.dailyTopic;
        }
    } catch (error) {
        console.error('Günün mövzusu yüklənmə xətası:', error);
    }
}

// Filtr sözləri yüklə
async function loadBadWords() {
    try {
        const response = await fetch('/api/admin/bad-words', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'system', password: 'system' })
        });
        
        const data = await response.json();
        
        if (data.success && data.badWords) {
            badWords = data.badWords.split(',').map(w => w.trim().toLowerCase());
        }
    } catch (error) {
        console.error('Filtr sözləri yüklənmə xətası:', error);
    }
}

// Filtr tətbiq et
function applyBadWordsFilter(message) {
    let filtered = message;
    badWords.forEach(word => {
        if (word) {
            const regex = new RegExp(word, 'gi');
            filtered = filtered.replace(regex, '*'.repeat(word.length));
        }
    });
    return filtered;
}

// Sidebar göstər/gizlət
function showFaculties() {
    document.getElementById('faculties-sidebar').classList.add('active');
}

function hideFaculties() {
    document.getElementById('faculties-sidebar').classList.remove('active');
}

// Profil göstər
async function showProfile() {
    document.getElementById('profile-modal').classList.add('active');
    document.getElementById('profile-fullname').value = currentUser.fullName;
    document.getElementById('profile-degree').value = currentUser.degree;
    document.getElementById('profile-course').value = currentUser.course;
    
    // Fakültələri yüklə
    const response = await fetch('/api/auth/faculties');
    const data = await response.json();
    
    if (data.success) {
        const select = document.getElementById('profile-faculty');
        select.innerHTML = '';
        data.faculties.forEach(f => {
            const option = document.createElement('option');
            option.value = f.name;
            option.textContent = f.name;
            if (f.name === currentUser.faculty) option.selected = true;
            select.appendChild(option);
        });
    }
}

function hideProfile() {
    document.getElementById('profile-modal').classList.remove('active');
}

// Profil yenilə
async function updateProfile() {
    try {
        const fullName = document.getElementById('profile-fullname').value;
        const faculty = document.getElementById('profile-faculty').value;
        const degree = document.getElementById('profile-degree').value;
        const course = parseInt(document.getElementById('profile-course').value);
        
        const response = await fetch(`/api/users/${currentUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, faculty, degree, course })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser.fullName = fullName;
            currentUser.faculty = faculty;
            currentUser.degree = degree;
            currentUser.course = course;
            
            showNotification('Profil yeniləndi', 'success');
            hideProfile();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        showNotification('Profil yenilənmə xətası', 'error');
    }
}

// Qaydalar göstər
async function showRules() {
    try {
        const response = await fetch('/api/admin/rules');
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('rules-content').textContent = data.rules;
            document.getElementById('rules-modal').classList.add('active');
        }
    } catch (error) {
        showNotification('Qaydalar yüklənmə xətası', 'error');
    }
}

function hideRules() {
    document.getElementById('rules-modal').classList.remove('active');
}

// Çıxış
async function handleLogout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        if (socket) socket.disconnect();
        currentUser = null;
        currentRoom = null;
        showScreen('welcome-screen');
        showNotification('Çıxış edildi', 'info');
    } catch (error) {
        showNotification('Çıxış xətası', 'error');
    }
}

// Admin panel
async function loadAdminPanel() {
    loadAdminRules();
    loadAdminAbout();
    loadAdminTopic();
}

function showAdminSection(section) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    const sectionMap = {
        'rules': 'admin-rules',
        'about': 'admin-about',
        'users': 'admin-users',
        'suspicious': 'admin-suspicious',
        'topic': 'admin-topic',
        'filter': 'admin-filter',
        'delete-time': 'admin-delete-time',
        'sub-admins': 'admin-sub-admins'
    };
    
    document.getElementById(sectionMap[section]).classList.add('active');
    event.target.classList.add('active');
    
    if (section === 'users') loadAdminUsers();
    if (section === 'suspicious') loadSuspiciousUsers();
    if (section === 'filter') loadAdminFilter();
    if (section === 'delete-time') loadDeleteTime();
    if (section === 'sub-admins') loadSubAdmins();
}

async function loadAdminRules() {
    const response = await fetch('/api/admin/rules');
    const data = await response.json();
    if (data.success) {
        document.getElementById('rules-textarea').value = data.rules;
    }
}

async function saveRules() {
    const rules = document.getElementById('rules-textarea').value;
    const response = await fetch('/api/admin/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules, username: '618ursamajor618major', password: 'majorursa618' })
    });
    const data = await response.json();
    showNotification(data.message, data.success ? 'success' : 'error');
}

async function loadAdminAbout() {
    const response = await fetch('/api/admin/about');
    const data = await response.json();
    if (data.success) {
        document.getElementById('about-textarea').value = data.about;
    }
}

async function saveAbout() {
    const about = document.getElementById('about-textarea').value;
    const response = await fetch('/api/admin/about', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ about, username: '618ursamajor618major', password: 'majorursa618' })
    });
    const data = await response.json();
    showNotification(data.message, data.success ? 'success' : 'error');
}

async function loadAdminTopic() {
    const response = await fetch('/api/admin/daily-topic');
    const data = await response.json();
    if (data.success) {
        document.getElementById('topic-input').value = data.dailyTopic;
    }
}

async function saveTopic() {
    const dailyTopic = document.getElementById('topic-input').value;
    const response = await fetch('/api/admin/daily-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailyTopic, username: '618ursamajor618major', password: 'majorursa618' })
    });
    const data = await response.json();
    showNotification(data.message, data.success ? 'success' : 'error');
}

async function loadAdminUsers() {
    const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: '618ursamajor618major', password: 'majorursa618' })
    });
    const data = await response.json();
    
    if (data.success) {
        const container = document.getElementById('users-table');
        document.getElementById('users-count').textContent = data.users.length;
        container.innerHTML = '';
        
        data.users.forEach(user => {
            const row = document.createElement('div');
            row.className = 'user-row';
            row.innerHTML = `
                <div><strong>Ad:</strong> ${user.full_name}<br><strong>Email:</strong> ${user.email}</div>
                <div><strong>Fakültə:</strong> ${user.faculty}</div>
                <div><strong>Dərəcə:</strong> ${user.degree}<br><strong>Kurs:</strong> ${user.course}</div>
                <div><strong>Telefon:</strong> ${user.phone}</div>
                <button class="btn-toggle ${user.is_active ? 'active' : 'inactive'}" 
                        onclick="toggleUserStatus(${user.id}, ${!user.is_active})">
                    ${user.is_active ? 'Aktiv' : 'Deaktiv'}
                </button>
            `;
            container.appendChild(row);
        });
    }
}

async function toggleUserStatus(userId, isActive) {
    const response = await fetch('/api/admin/users/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isActive, username: '618ursamajor618major', password: 'majorursa618' })
    });
    const data = await response.json();
    showNotification(data.message, data.success ? 'success' : 'error');
    if (data.success) loadAdminUsers();
}

async function loadSuspiciousUsers() {
    const response = await fetch('/api/admin/suspicious-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: '618ursamajor618major', password: 'majorursa618' })
    });
    const data = await response.json();
    
    if (data.success) {
        const container = document.getElementById('suspicious-table');
        container.innerHTML = '';
        
        if (data.users.length === 0) {
            container.innerHTML = '<p>Şübhəli hesab yoxdur</p>';
            return;
        }
        
        data.users.forEach(user => {
            const row = document.createElement('div');
            row.className = 'user-row';
            row.innerHTML = `
                <div><strong>Ad:</strong> ${user.full_name}<br><strong>Email:</strong> ${user.email}</div>
                <div><strong>Fakültə:</strong> ${user.faculty}</div>
                <div><strong>Şikayət:</strong> ${user.report_count}</div>
                <div><strong>Telefon:</strong> ${user.phone}</div>
                <button class="btn-toggle ${user.is_active ? 'active' : 'inactive'}" 
                        onclick="toggleUserStatus(${user.id}, ${!user.is_active})">
                    ${user.is_active ? 'Aktiv' : 'Deaktiv'}
                </button>
            `;
            container.appendChild(row);
        });
    }
}

async function loadAdminFilter() {
    const response = await fetch('/api/admin/bad-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: '618ursamajor618major', password: 'majorursa618' })
    });
    const data = await response.json();
    if (data.success) {
        document.getElementById('filter-textarea').value = data.badWords;
    }
}

async function saveFilter() {
    const badWords = document.getElementById('filter-textarea').value;
    const response = await fetch('/api/admin/bad-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badWords, username: '618ursamajor618major', password: 'majorursa618' })
    });
    const data = await response.json();
    showNotification(data.message, data.success ? 'success' : 'error');
}

async function loadDeleteTime() {
    const response = await fetch('/api/admin/message-delete-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: '618ursamajor618major', password: 'majorursa618' })
    });
    const data = await response.json();
    if (data.success) {
        document.getElementById('group-delete-time').value = data.groupTime;
        document.getElementById('private-delete-time').value = data.privateTime;
    }
}

async function saveDeleteTime() {
    const groupTime = parseInt(document.getElementById('group-delete-time').value) || 0;
    const privateTime = parseInt(document.getElementById('private-delete-time').value) || 0;
    
    const response = await fetch('/api/admin/message-delete-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupTime, privateTime, username: '618ursamajor618major', password: 'majorursa618' })
    });
    const data = await response.json();
    showNotification(data.message, data.success ? 'success' : 'error');
}

async function loadSubAdmins() {
    const response = await fetch('/api/admin/sub-admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: '618ursamajor618major', password: 'majorursa618' })
    });
    const data = await response.json();
    
    if (data.success) {
        const container = document.getElementById('sub-admins-list');
        container.innerHTML = '<h3>Alt Adminlər Siyahısı</h3>';
        
        data.subAdmins.forEach(admin => {
            const row = document.createElement('div');
            row.className = 'user-row';
            row.innerHTML = `
                <div><strong>İstifadəçi adı:</strong> ${admin.username}</div>
                <div><strong>Yaradılma tarixi:</strong> ${new Date(admin.created_at).toLocaleDateString('az-AZ')}</div>
                <button class="btn-toggle inactive" onclick="deleteSubAdmin(${admin.id})">Sil</button>
            `;
            container.appendChild(row);
        });
    }
}

async function createSubAdmin() {
    const username = document.getElementById('sub-admin-username').value;
    const password = document.getElementById('sub-admin-password').value;
    
    if (!username || !password) {
        showNotification('İstifadəçi adı və şifrə daxil edin', 'error');
        return;
    }
    
    const response = await fetch('/api/admin/sub-admin/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, username: '618ursamajor618major', password: 'majorursa618' })
    });
    const data = await response.json();
    showNotification(data.message, data.success ? 'success' : 'error');
    
    if (data.success) {
        document.getElementById('sub-admin-username').value = '';
        document.getElementById('sub-admin-password').value = '';
        loadSubAdmins();
    }
}

async function deleteSubAdmin(adminId) {
    if (!confirm('Bu alt admini silmək istədiyinizdən əminsiniz?')) return;
    
    const response = await fetch('/api/admin/sub-admin/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, username: '618ursamajor618major', password: 'majorursa618' })
    });
    const data = await response.json();
    showNotification(data.message, data.success ? 'success' : 'error');
    if (data.success) loadSubAdmins();
}

function handleAdminLogout() {
    showScreen('welcome-screen');
    showNotification('Admin çıxış edildi', 'info');
}

// Səhifə yüklənəndə
document.addEventListener('DOMContentLoaded', async () => {
    await loadVerificationQuestions();
    
    // Session yoxla
    try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            initializeChat();
            showScreen('chat-screen');
        }
    } catch (error) {
        console.log('Session yoxdur');
    }
});
