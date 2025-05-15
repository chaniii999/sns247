// index.js
import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sequelize } from './server/models/index.js';
import passport from './server/config/passport.js';
import authRoutes from './server/routes/auth.js';
import postRoutes from './server/routes/posts.js';
import User from './server/models/User.js';
import Post from './server/models/Post.js';
import Like from './server/models/Like.js';
import profileRouter from './server/routes/profile.js';
import commentRoutes from './server/routes/comments.js';
import Comment from './server/models/Comment.js';
import searchRoutes from './server/routes/search.js';
import notificationRoutes from './server/routes/notifications.js';

// 환경 변수 설정
dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// 대시보드 라우트를 피드로 변경
app.get('/dashboard', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.redirect('/feed');
});

// 데이터베이스 연결 및 테이블 동기화
const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // force: false로 변경하여 기존 테이블 유지
    await sequelize.sync({ force: false });
    
    console.log('Database synchronized successfully');
  } catch (error) {
    console.error('Error synchronizing database:', error);
  }
};

syncDatabase();

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
