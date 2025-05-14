import express from 'express';
import { Post, User } from '../models/index.js';

const router = express.Router();

// 현재 로그인한 사용자의 프로필 페이지
router.get('/', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  res.redirect(`/profile/${req.user.id}`);
});

// 프로필 페이지 조회
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId, {
      attributes: ['id', 'name', 'email', 'profileImage', 'createdAt']
    });

    if (!user) {
      return res.status(404).send('사용자를 찾을 수 없습니다.');
    }

    // 사용자의 게시물 조회
    const posts = await Post.findAll({
      where: { authorId: req.params.userId },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email', 'profileImage']
        },
        {
          model: User,
          as: 'likedBy',
          attributes: ['id'],
          through: { attributes: [] }
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.render('profile', {
      layout: 'layouts/main',
      title: `${user.name}의 프로필`,
      headerTitle: user.name,
      backButton: { url: '/feed' },
      currentPage: 'profile',
      user: req.user,
      profileUser: user,
      posts: posts,
      currentUser: req.user
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).send('프로필 조회 중 오류가 발생했습니다.');
  }
});

// 프로필 이름 업데이트
router.post('/update-name', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    try {
        const { name } = req.body;
        
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: '이름은 비워둘 수 없습니다.' });
        }

        await User.update(
            { name: name.trim() },
            { where: { id: req.user.id } }
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating name:', error);
        res.status(500).json({ error: '이름 변경 중 오류가 발생했습니다.' });
    }
});

export default router;
