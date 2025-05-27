const express = require('express');
const router = express.Router();
const { Post, User, Notification } = require('../models');
const { isAuthenticated } = require('../middleware/auth');

// 리포스트 생성
router.post('/repost', isAuthenticated, async (req, res) => {
    try {
        const { postId, content } = req.body;
        
        // 원본 게시물 찾기
        const originalPost = await Post.findByPk(postId, {
            include: [
                { model: User, as: 'author' },
                { model: User, as: 'likedBy' }
            ]
        });

        if (!originalPost) {
            return res.status(404).json({ error: '원본 게시물을 찾을 수 없습니다.' });
        }

        // 리포스트 생성
        const repost = await Post.create({
            content,
            authorId: req.user.id,
            originalPostId: postId
        });

        // 원본 게시물의 리포스트 수 증가
        await originalPost.increment('reposts');

        // 알림 생성
        if (originalPost.authorId !== req.user.id) {
            await Notification.create({
                userId: originalPost.authorId,
                type: 'repost',
                postId: repost.id,
                link: `/comments/post/${repost.id}`,
                preview: content.substring(0, 100)
            });
        }

        res.json({ success: true, repost });
    } catch (error) {
        console.error('Error creating repost:', error);
        res.status(500).json({ error: '리포스트 생성에 실패했습니다.' });
    }
});

module.exports = router; 