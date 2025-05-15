import express from 'express';
import { User, Post } from '../models/index.js';
import isAuthenticated from '../middleware/auth.js';

const router = express.Router();

// 검색 페이지 렌더링
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const query = req.query.q || '';
        let users = [];
        let posts = [];

        if (query) {
            // 사용자 검색
            users = await User.findAll({
                where: {
                    [Op.or]: [
                        { name: { [Op.like]: `%${query}%` } },
                        { email: { [Op.like]: `%${query}%` } }
                    ]
                },
                attributes: ['id', 'name', 'email', 'profileImage']
            });

            // 게시물 검색
            posts = await Post.findAll({
                where: {
                    content: { [Op.like]: `%${query}%` }
                },
                include: [
                    {
                        model: User,
                        as: 'author',
                        attributes: ['id', 'name', 'email', 'profileImage']
                    }
                ],
                order: [['createdAt', 'DESC']]
            });
        }

        res.render('search', {
            currentUser: req.user,
            users,
            posts,
            query,
            currentPage: 'search'
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).send('검색 중 오류가 발생했습니다.');
    }
});

export default router; 