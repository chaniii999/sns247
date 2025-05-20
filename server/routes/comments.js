import express from 'express';
import { Post, Comment, User } from '../models/index.js';
import isAuthenticated from '../middleware/auth.js';
import { sequelize } from '../config/database.js';

const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(isAuthenticated);

// 특정 게시물의 댓글 페이지 조회
router.get('/post/:postId', async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.postId, {
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

        if (!post) {
            return res.status(404).send('게시물을 찾을 수 없습니다.');
        }

        // 댓글 조회
        const comments = await Comment.findAll({
            where: { postId: req.params.postId },
            include: [
                {
                    model: User,
                    as: 'commentAuthor',
                    attributes: ['id', 'name', 'email', 'profileImage']
                }
            ],
            order: [['createdAt', 'ASC']]
        });

        res.render('post-detail', {
            layout: 'layouts/main',
            title: '게시물',
            headerTitle: '게시물',
            backButton: { url: '/feed' },
            currentPage: 'post-detail',
            user: req.user,
            post: post,
            comments: comments,
            currentUser: req.user
        });
    } catch (error) {
        console.error('Error fetching post and comments:', error);
        res.status(500).send('게시물 조회 중 오류가 발생했습니다.');
    }
});

// 댓글 작성
router.post('/post/:postId', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    try {
        const { content } = req.body;
        
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: '댓글 내용을 입력해주세요.' });
        }

        // 트랜잭션 시작
        const result = await sequelize.transaction(async (t) => {
            // 댓글 생성
            const comment = await Comment.create({
                content: content.trim(),
                authorId: req.user.id,
                postId: req.params.postId
            }, { transaction: t });

            // 게시물의 replies 카운트 증가
            await Post.increment('replies', {
                where: { id: req.params.postId },
                transaction: t
            });

            // 작성자 정보를 포함하여 댓글 반환
            const commentWithAuthor = await Comment.findByPk(comment.id, {
                include: [
                    {
                        model: User,
                        as: 'commentAuthor',
                        attributes: ['id', 'name', 'email', 'profileImage']
                    }
                ],
                transaction: t
            });

            return commentWithAuthor;
        });

        res.json(result);
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ error: '댓글 작성 중 오류가 발생했습니다.' });
    }
});

// 댓글 수정
router.put('/:commentId', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    try {
        const comment = await Comment.findByPk(req.params.commentId);
        
        if (!comment) {
            return res.status(404).json({ error: '댓글을 찾을 수 없습니다.' });
        }

        if (comment.authorId !== req.user.id) {
            return res.status(403).json({ error: '댓글을 수정할 권한이 없습니다.' });
        }

        const { content } = req.body;
        
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: '댓글 내용을 입력해주세요.' });
        }

        await comment.update({
            content: content.trim()
        });

        const updatedComment = await Comment.findByPk(comment.id, {
            include: [
                {
                    model: User,
                    as: 'commentAuthor',
                    attributes: ['id', 'name', 'email', 'profileImage']
                }
            ]
        });

        res.json(updatedComment);
    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(500).json({ error: '댓글 수정 중 오류가 발생했습니다.' });
    }
});

// 댓글 삭제
router.delete('/:commentId', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    try {
        const comment = await Comment.findByPk(req.params.commentId);
        
        if (!comment) {
            return res.status(404).json({ error: '댓글을 찾을 수 없습니다.' });
        }

        // 댓글 작성자 확인
        if (comment.authorId !== req.user.id) {
            return res.status(403).json({ error: '댓글을 삭제할 권한이 없습니다.' });
        }

        // 트랜잭션 시작
        await sequelize.transaction(async (t) => {
            // 댓글 삭제
            await comment.destroy({ transaction: t });

            // 게시물의 replies 카운트 감소
            await Post.decrement('replies', {
                where: { id: comment.postId },
                transaction: t
            });
        });

        res.json({ message: '댓글이 삭제되었습니다.' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ error: '댓글 삭제 중 오류가 발생했습니다.' });
    }
});

export default router;
