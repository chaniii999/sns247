const express = require('express');
const router = express.Router();
const { User, Post } = require('../models');
const { Op } = require('sequelize');

// 검색 페이지 렌더링
router.get('/', (req, res) => {
    res.render('search', { 
        currentUser: req.user,
        title: '검색'
    });
});

// 검색 API
router.get('/api', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.json({ users: [], posts: [] });
        }

        // 사용자 검색
        const users = await User.findAll({
            where: {
                [Op.or]: [
                    { name: { [Op.like]: `%${query}%` } },
                    { email: { [Op.like]: `%${query}%` } }
                ]
            },
            attributes: ['id', 'name', 'email', 'profileImage'],
            limit: 10
        });

        // 게시물 검색
        const posts = await Post.findAll({
            where: {
                content: { [Op.like]: `%${query}%` }
            },
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'name', 'email', 'profileImage']
            }],
            order: [['createdAt', 'DESC']],
            limit: 10
        });

        res.json({ users, posts });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: '검색 중 오류가 발생했습니다.' });
    }
});

module.exports = router; 