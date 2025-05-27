import { Notification, Post, User, Comment } from '../models/index.js';

/**
 * 알림 생성 헬퍼 함수
 * @param {number} userId - 알림을 받을 사용자 ID
 * @param {number} senderId - 알림을 발생시킨 사용자 ID
 * @param {'like'|'comment'|'follow'} type - 알림 타입
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
                link = `/comments/post/${postId}`;
                const repostedPost = await Post.findByPk(postId);
                if (repostedPost) {
                    preview = repostedPost.content.substring(0, 100);
                }
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