import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { Post, User, Like, Comment } from '../models/index.js';
import isAuthenticated from '../middleware/auth.js';
import { createNotification } from '../utils/notifications.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

// 모든 라우트에 인증 미들웨어 적용
router.use(isAuthenticated);

// 게시물 작성
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const post = await Post.create({
      content: req.body.content,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
      authorId: req.user.id
    });
    res.redirect('/feed');
  } catch (error) {
    console.error('Error creating post:', error);
    res.redirect('/feed');
  }
});

// 게시물 목록 조회
router.get('/', async (req, res) => {
  try {
    const posts = await Post.findAll({
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
        },
        {
          model: Comment,
          as: 'comments',
          include: [{
            model: User,
            as: 'commentAuthor',
            attributes: ['id', 'name', 'email', 'profileImage']
          }]
        },
        {
          model: Post,
          as: 'originalPost',
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'name', 'email', 'profileImage']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // 각 게시물에 댓글 수와 좋아요 상태 추가
    const postsWithCounts = posts.map(post => {
      const postJson = post.toJSON();
      postJson.commentCount = post.Comments.length;
      postJson.isLiked = post.likedBy.some(user => user.id === req.user.id);
      return postJson;
    });

    res.render('feed', { 
      user: req.user,
      posts: postsWithCounts,
      currentUser: req.user,
      currentPage: 'feed'
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).send('게시물을 불러오는 중 오류가 발생했습니다.');
  }
});

// 좋아요 토글 라우트
router.post('/:postId/like', async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.postId, {
      include: [
        {
          model: User,
          as: 'likedBy',
          attributes: ['id'],
          through: { attributes: [] }
        }
      ]
    });

    if (!post) {
      return res.status(404).json({ error: '게시물을 찾을 수 없습니다.' });
    }

    // 이미 좋아요를 눌렀는지 확인
    const existingLike = await Like.findOne({
      where: {
        UserId: req.user.id,
        PostId: req.params.postId
      }
    });

    if (existingLike) {
      // 좋아요 취소
      await existingLike.destroy();
      await post.update({
        likes: Math.max(0, post.likes - 1)
      });
      return res.json({ 
        liked: false, 
        likes: post.likes,
        message: '좋아요가 취소되었습니다.' 
      });
    } else {
      // 좋아요 추가
      await Like.create({
        UserId: req.user.id,
        PostId: req.params.postId
      });
      await post.update({
        likes: post.likes + 1
      });
      await createNotification(post.authorId, req.user.id, 'like', post.id);
      return res.json({ 
        liked: true, 
        likes: post.likes,
        message: '좋아요가 추가되었습니다.' 
      });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: '좋아요 처리 중 오류가 발생했습니다.' });
  }
});

// 게시물 수정
router.put('/:postId', async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ error: '게시물을 찾을 수 없습니다.' });
    }

    // 권한 확인
    if (post.authorId !== req.user.id) {
      return res.status(403).json({ error: '게시물을 수정할 권한이 없습니다.' });
    }

    // 게시물 수정
    await post.update({
      content: req.body.content
    });

    res.json({ message: '게시물이 수정되었습니다.' });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: '게시물 수정 중 오류가 발생했습니다.' });
  }
});

// 게시물 삭제
router.delete('/:postId', async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ error: '게시물을 찾을 수 없습니다.' });
    }

    // 권한 확인
    if (post.authorId !== req.user.id) {
      return res.status(403).json({ error: '게시물을 삭제할 권한이 없습니다.' });
    }

    // 게시물 삭제
    await post.destroy();

    res.json({ message: '게시물이 삭제되었습니다.' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: '게시물 삭제 중 오류가 발생했습니다.' });
  }
});

// 리포스트 라우트
router.post('/:postId/repost', async (req, res) => {
  try {
    const originalPost = await Post.findByPk(req.params.postId, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email', 'profileImage']
        }
      ]
    });

    if (!originalPost) {
      return res.status(404).json({ error: '게시물을 찾을 수 없습니다.' });
    }

    // 리포스트 게시물 생성
    const repost = await Post.create({
      content: req.body.content || `리포스트: ${originalPost.content}`,
      authorId: req.user.id,
      originalPostId: originalPost.id,
      imageUrl: originalPost.imageUrl
    });

    // 원본 게시물의 리포스트 수 증가
    await originalPost.update({
      reposts: originalPost.reposts + 1
    });

    // 알림 생성
    if (originalPost.authorId !== req.user.id) {
      await createNotification(
        originalPost.authorId,
        req.user.id,
        'repost',
        originalPost.id
      );
    }

    // 리포스트된 게시물 정보 반환
    const repostWithDetails = await Post.findByPk(repost.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email', 'profileImage']
        },
        {
          model: Post,
          as: 'originalPost',
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'name', 'email', 'profileImage']
            }
          ]
        }
      ]
    });

    res.json({ 
      message: '리포스트가 완료되었습니다.',
      repost: repostWithDetails
    });
  } catch (error) {
    console.error('Error reposting:', error);
    res.status(500).json({ error: '리포스트 처리 중 오류가 발생했습니다.' });
  }
});

export default router;
