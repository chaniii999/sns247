import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import session from 'express-session';
import passport from 'passport';
import { sequelize } from './config/database.js';
import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import commentRoutes from './routes/comments.js';
import profileRoutes from './routes/profile.js';
import notificationRoutes from './routes/notifications.js';
import searchRoutes from './routes/search.js';
import './config/passport.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// 세션 설정
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

// Passport 초기화
app.use(passport.initialize());
app.use(passport.session());

// 라우트 설정
app.use('/auth', authRoutes);
app.use('/posts', postRoutes);
app.use('/comments', commentRoutes);
app.use('/profile', profileRoutes);
app.use('/notifications', notificationRoutes);
app.use('/search', searchRoutes);

// Socket.IO 연결 처리
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('Client connected');

  // 사용자 인증
  socket.on('authenticate', (userId) => {
    connectedUsers.set(userId, socket.id);
    console.log(`User ${userId} authenticated`);
  });

  // 알림 전송
  socket.on('sendNotification', (data) => {
    const targetSocketId = connectedUsers.get(data.userId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('newNotification', data);
    }
  });

  // 알림 읽음 처리
  socket.on('notificationRead', (data) => {
    const targetSocketId = connectedUsers.get(data.userId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('notificationRead', data);
    }
  });

  // 모든 알림 읽음 처리
  socket.on('notificationsRead', (data) => {
    const targetSocketId = connectedUsers.get(data.userId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('allNotificationsRead', data);
    }
  });

  // 연결 해제
  socket.on('disconnect', () => {
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        break;
      }
    }
    console.log('Client disconnected');
  });
});

// 데이터베이스 연결 및 서버 시작
sequelize.sync()
  .then(() => {
    console.log('DB 동기화 성공!');
    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('DB 동기화 실패:', err);
  }); 