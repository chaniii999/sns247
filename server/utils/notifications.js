import { Notification, Post, User } from '../models/index.js';

/**
 * 알림 생성 헬퍼 함수
 * @param {number} userId - 알림을 받을 사용자 ID
 * @param {number} senderId - 알림을 발생시킨 사용자 ID
 * @param {'like'|'comment'|'follow'} type - 알림 타입
 * @param {number|null} postId - 관련 게시물 ID (필요시)
 */
export const createNotification = async (userId, senderId, type, postId = null) => {
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