// 라우트 등록
const searchRouter = require('./routes/search');
const { router: notificationRouter } = require('./routes/notifications');

app.use('/search', searchRouter);
app.use('/notifications', notificationRouter); 