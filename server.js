const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const pool = require('./db');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const chatRoutes = require('./routes/chat');
const userRoutes = require('./routes/users');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// Session
const sessionMiddleware = session({
  store: new pgSession({
    pool: pool,
    tableName: 'session'
  }),
  secret: process.env.SESSION_SECRET || 'bsu_chat_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
});

app.use(sessionMiddleware);

// Socket.IO session sharing
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.IO connection handling
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('🔌 Yeni istifadəçi qoşuldu:', socket.id);

  // İstifadəçi qoşulma
  socket.on('user:join', (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit('users:online', Array.from(onlineUsers.keys()));
  });

  // Qrup chat-ə qoşulma
  socket.on('room:join', (faculty) => {
    socket.join(faculty);
    console.log(`👥 İstifadəçi ${socket.id} ${faculty} qrupuna qoşuldu`);
  });

  // Qrup mesajı göndərmə
  socket.on('message:group', async (data) => {
    try {
      const { faculty, userId, message, userName, userFaculty, userDegree, userCourse } = data;
      
      // Database-ə saxla
      const result = await pool.query(
        'INSERT INTO group_messages (faculty, user_id, message) VALUES ($1, $2, $3) RETURNING id, created_at',
        [faculty, userId, message]
      );

      const messageData = {
        id: result.rows[0].id,
        faculty,
        userId,
        message,
        userName,
        userFaculty,
        userDegree,
        userCourse,
        createdAt: result.rows[0].created_at
      };

      io.to(faculty).emit('message:group:new', messageData);
    } catch (error) {
      console.error('Qrup mesajı xətası:', error);
      socket.emit('error', { message: 'Mesaj göndərilmədi' });
    }
  });

  // Şəxsi mesaj göndərmə
  socket.on('message:private', async (data) => {
    try {
      const { senderId, receiverId, message, senderName, senderFaculty, senderDegree, senderCourse } = data;

      // Əngəlləmə yoxlanışı
      const blockCheck = await pool.query(
        'SELECT id FROM blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)',
        [senderId, receiverId]
      );

      if (blockCheck.rows.length > 0) {
        socket.emit('error', { message: 'Bu istifadəçi ilə mesajlaşma mümkün deyil' });
        return;
      }

      // Database-ə saxla
      const result = await pool.query(
        'INSERT INTO private_messages (sender_id, receiver_id, message) VALUES ($1, $2, $3) RETURNING id, created_at',
        [senderId, receiverId, message]
      );

      const messageData = {
        id: result.rows[0].id,
        senderId,
        receiverId,
        message,
        senderName,
        senderFaculty,
        senderDegree,
        senderCourse,
        createdAt: result.rows[0].created_at
      };

      // Göndərənə və qəbul edənə mesaj göndər
      socket.emit('message:private:new', messageData);
      
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('message:private:new', messageData);
      }
    } catch (error) {
      console.error('Şəxsi mesaj xətası:', error);
      socket.emit('error', { message: 'Mesaj göndərilmədi' });
    }
  });

  // İstifadəçi ayrılma
  socket.on('disconnect', () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        io.emit('users:online', Array.from(onlineUsers.keys()));
        break;
      }
    }
    console.log('🔌 İstifadəçi ayrıldı:', socket.id);
  });
});

// Mesaj avtomatik silinmə scheduler
setInterval(async () => {
  try {
    // Qrup mesajları üçün
    const groupSettings = await pool.query(
      "SELECT value FROM admin_settings WHERE key = 'group_message_delete_time'"
    );
    if (groupSettings.rows.length > 0) {
      const deleteTime = parseInt(groupSettings.rows[0].value);
      if (deleteTime > 0) {
        await pool.query(
          'DELETE FROM group_messages WHERE created_at < NOW() - INTERVAL $1',
          [`${deleteTime} minutes`]
        );
      }
    }

    // Şəxsi mesajlar üçün
    const privateSettings = await pool.query(
      "SELECT value FROM admin_settings WHERE key = 'private_message_delete_time'"
    );
    if (privateSettings.rows.length > 0) {
      const deleteTime = parseInt(privateSettings.rows[0].value);
      if (deleteTime > 0) {
        await pool.query(
          'DELETE FROM private_messages WHERE created_at < NOW() - INTERVAL $1',
          [`${deleteTime} minutes`]
        );
      }
    }
  } catch (error) {
    console.error('Mesaj silinmə xətası:', error);
  }
}, 60000); // Hər dəqiqə yoxla

// Server start
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║   🎓 BSU Chat Server İşə Başladı      ║
  ║   📡 Port: ${PORT}                       ║
  ║   🌍 URL: http://localhost:${PORT}      ║
  ╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal alındı. Server bağlanır...');
  server.close(() => {
    console.log('HTTP server bağlandı');
    pool.end(() => {
      console.log('Database connection bağlandı');
      process.exit(0);
    });
  });
});
