import express from 'express';
import { Notification, User, Post } from '../models/index.js';
import isAuthenticated from '../middleware/auth.js';

const router = express.Router();

// 알림 목록 조회
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: { userId: req.user.id },
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['id', 'name', 'email', 'profileImage']
                },
                {
                    model: Post,
                    as: 'post',
                    attributes: ['id', 'content']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        // 알림 링크 수정
        const formattedNotifications = notifications.map(notification => {
            if (notification.type === 'like' || notification.type === 'comment') {
                notification.link = `/comments/post/${notification.postId}`;
            }
            return notification;
        });

        res.render('notifications', {
            currentUser: req.user,
            notifications: formattedNotifications,
            currentPage: 'notifications'
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).send('알림을 불러오는 중 오류가 발생했습니다.');
    }
});

// 알림 읽음 처리
router.post('/:notificationId/read', isAuthenticated, async (req, res) => {
    try {
        const notification = await Notification.findByPk(req.params.notificationId);
        
        if (!notification) {
            return res.status(404).json({ error: '알림을 찾을 수 없습니다.' });
        }

        if (notification.userId !== req.user.id) {
            return res.status(403).json({ error: '권한이 없습니다.' });
        }

        await notification.update({ read: true });
        res.json({ message: '알림이 읽음 처리되었습니다.' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: '알림 처리 중 오류가 발생했습니다.' });
    }
});

// 읽지 않은 알림 카운트 조회
router.get('/unread-count', isAuthenticated, async (req, res) => {
    try {
        const count = await Notification.count({
            where: {
                userId: req.user.id,
                read: false
            }
        });

        res.json({ count });
    } catch (error) {
        console.error('Error fetching unread notification count:', error);
        res.status(500).json({ error: '알림 카운트 조회 중 오류가 발생했습니다.' });
    }
});

export default router; 