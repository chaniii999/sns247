import express from 'express';
import passport from '../config/passport.js';

const router = express.Router();

// Google 로그인 라우트
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email']
  })
);

// Google 콜백 라우트
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/login'
  }),
  async (req, res) => {
    try {
      // 로그인 시간 업데이트
      await req.user.update({
        lastLoginAt: new Date()
      });
      res.redirect('/feed');
    } catch (error) {
      console.error('Error updating last login time:', error);
      res.redirect('/feed');
    }
  }
);

// 로그아웃 라우트
router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/login');
  });
});

export default router;
