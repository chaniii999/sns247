import express from 'express';
import { Post, User } from '../models/index.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import isAuthenticated from '../middleware/auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 업로드 디렉토리 생성
const uploadDir = path.join(__dirname, '../../public/uploads/profiles');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer 설정
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        // 이미지 파일만 허용
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
        }
        cb(null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB 제한
    }
});

// 모든 라우트에 인증 미들웨어 적용
router.use(isAuthenticated);

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

// 프로필 사진 업데이트
router.post('/update-profile-image', upload.single('profileImage'), async (req, res) => {
    console.log('Profile image update request received');
    console.log('Request file:', req.file);
    console.log('Request user:', req.user);

    try {
        if (!req.file) {
            console.log('No file uploaded');
            return res.status(400).json({ error: '이미지 파일이 필요합니다.' });
        }

        const profileImagePath = '/uploads/profiles/' + req.file.filename;
        console.log('New profile image path:', profileImagePath);
        
        // 이전 프로필 이미지가 있다면 삭제
        const user = await User.findByPk(req.user.id);
        console.log('Current user profile image:', user.profileImage);
        
        if (user.profileImage && user.profileImage !== '/images/default-profile.png') {
            const oldImagePath = path.join(__dirname, '../../public', user.profileImage);
            console.log('Old image path:', oldImagePath);
            
            if (fs.existsSync(oldImagePath)) {
                console.log('Deleting old profile image');
                fs.unlinkSync(oldImagePath);
            }
        }

        console.log('Updating user profile image in database');
        await User.update(
            { profileImage: profileImagePath },
            { where: { id: req.user.id } }
        );

        console.log('Profile image update successful');
        res.json({ 
            success: true, 
            profileImage: profileImagePath,
            message: '프로필 사진이 업데이트되었습니다.' 
        });
    } catch (error) {
        console.error('Error updating profile image:', error);
        // 업로드된 파일이 있다면 삭제
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting uploaded file:', err);
            });
        }
        res.status(500).json({ error: '프로필 사진 업데이트 중 오류가 발생했습니다.' });
    }
});

export default router;
