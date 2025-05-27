// 읽지 않은 알림 개수 조회
router.get('/count', isAuthenticated, async (req, res) => {
    try {
        const count = await Notification.count({
            where: {
                userId: req.user.id,
                read: false
            }
        });
        res.json({ count });
    } catch (error) {
        console.error('Error getting notification count:', error);
        res.status(500).json({ error: '알림 개수를 가져오는데 실패했습니다.' });
    }
}); 