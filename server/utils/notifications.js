import { Notification, Post, User, Comment } from '../models/index.js';

/**
 * 알림 생성 헬퍼 함수
 * @param {number} userId - 알림을 받을 사용자 ID
 * @param {number} senderId - 알림을 발생시킨 사용자 ID
 * @param {'like'|'comment'|'follow'|'repost'} type - 알림 타입
 * @param {number|null} postId - 관련 게시물 ID (필요시)
 */
export const createNotification = async (userId, senderId, type, postId = null) => {
    try {
        // 자신의 활동에 대한 알림은 생성하지 않음
        if (userId === senderId) {
            return;
        }

        let link = '';
        let preview = '';

        switch (type) {
            case 'like':
                link = `/comments/post/${postId}`;
                const post = await Post.findByPk(postId);
                if (post) {
                    preview = post.content.substring(0, 100);
                }
                break;
            case 'comment':
                link = `/comments/post/${postId}`;
                const commentedPost = await Post.findByPk(postId);
                if (commentedPost) {
                    // 게시글 내용과 댓글 내용을 모두 저장
                    const comment = await Comment.findOne({
                        where: { postId: postId },
                        order: [['createdAt', 'DESC']],
                        limit: 1
                    });
                    if (comment) {
                        preview = JSON.stringify({
                            postContent: commentedPost.content.substring(0, 100),
                            commentContent: comment.content.substring(0, 100)
                        });
                    }
                }
                break;
            case 'follow':
                link = `/profile/${senderId}`;
                break;
            case 'repost':
                // 리포스트 알림 생성
                const repostedPost = await Post.findByPk(postId);
                if (repostedPost) {
                    link = `/comments/post/${postId}`;
                    preview = repostedPost.content.substring(0, 100);
                }
                break;
        }

        const notification = await Notification.create({
            userId,
            senderId,
            type,
            postId,
            link,
            preview,
            read: false
        });

        // 알림 생성 후 실시간으로 전송
        const io = global.io;
        if (io) {
            const sender = await User.findByPk(senderId, {
                attributes: ['id', 'name', 'email', 'profileImage']
            });

            // 알림 데이터 구성
            const notificationData = {
                ...notification.toJSON(),
                sender,
                createdAt: new Date().toISOString()
            };

            // 해당 사용자의 룸으로 알림 전송
            io.to(`user_${userId}`).emit('newNotification', notificationData);
            console.log(`Notification sent to user_${userId}:`, notificationData);
        }

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
}; 