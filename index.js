// index.js
// 해당 앱의 main함수의 역할을 한다.
// 도메인 경로 설정, port 설정, DB 연동 함수가 구현되어있음.
import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sequelize } from './server/models/index.js';
import passport from './server/config/passport.js';
import authRoutes from './server/routes/auth.js';
import postRoutes from './server/routes/posts.js';
import profileRouter from './server/routes/profile.js';
import commentRoutes from './server/routes/comments.js';
import searchRoutes from './server/routes/search.js';
import notificationRoutes from './server/routes/notifications.js';
import { createServer } from 'http';
import { Server } from 'socket.io';

// 환경 변수 설정
dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const httpServer = createServer(app);
const io = new Server(httpServer);

// Socket.IO를 전역으로 설정
global.io = io;

// views 디렉토리 설정
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 세션 설정
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
  }
}));

// Passport 초기화
app.use(passport.initialize());
app.use(passport.session());

// 정적 파일 제공 설정
app.use(express.static('public'));

// 라우트 설정
app.use('/auth', authRoutes);
app.use('/feed', postRoutes);
app.use('/posts', postRoutes);
app.use('/profile', profileRouter);
app.use('/comments', commentRoutes);
app.use('/search', searchRoutes);
app.use('/notifications', notificationRoutes);

// 루트 경로 리다이렉션
app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect('/feed');
  } else {
    res.redirect('/login');
  }
});

// 로그인 페이지 라우트 추가
app.get('/login', (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect('/feed');
  } else {
    res.render('login');
  }
});

// 데이터베이스 연결 및 테이블 동기화
const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('DB 연결 성공!');
    
    // force: false로 변경하여 기존 테이블 유지
    await sequelize.sync({ force: false });
    
    console.log('DB 동기화 성공!');
  } catch (error) {
    console.error('ERROR DB 연결 및 동기화 실패! 내용:', error);
  }
};

syncDatabase();

// Socket.IO 연결 처리
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // 사용자 인증 및 소켓 연결
    socket.on('authenticate', (userId) => {
        socket.join(`user_${userId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// 서버 시작
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



