const express = require('express');
const router = express.Router();
const { Notification, User, Post } = require('../models');
const { Op } = require('sequelize');

// 알림 페이지 렌더링
router.get('/', async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: { userId: req.user.id },
            include: [{
                model: User,
                as: 'sender',
                attributes: ['id', 'name', 'email', 'profileImage']
            }],
            order: [['createdAt', 'DESC']],
            limit: 50
        });

        res.render('notifications', {
            currentUser: req.user,
            notifications,
            title: '알림'
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).send('알림을 불러오는 중 오류가 발생했습니다.');
    }
});

// 알림 읽음 처리
router.post('/:id/read', async (req, res) => {
    try {
        const notification = await Notification.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });

        if (!notification) {
            return res.status(404).json({ error: '알림을 찾을 수 없습니다.' });
        }

        await notification.update({ read: true });
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: '알림 읽음 처리 중 오류가 발생했습니다.' });
    }
});

// 알림 생성 헬퍼 함수
const createNotification = async (userId, senderId, type, postId = null) => {
    try {
        let link = '';
        let preview = '';

        switch (type) {
            case 'like':
                link = `/posts/${postId}`;
                const post = await Post.findByPk(postId);
                if (post) {
                    preview = post.content.substring(0, 100);
                }
                break;
            case 'comment':
                link = `/posts/${postId}`;
                const commentedPost = await Post.findByPk(postId);
                if (commentedPost) {
                    preview = commentedPost.content.substring(0, 100);
                }
                break;
            case 'follow':
                link = `/profile/${senderId}`;
                break;
        }

        await Notification.create({
            userId,
            senderId,
            type,
            postId,
            link,
            preview,
            read: false
        });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

module.exports = {
    router,
    createNotification
}; 