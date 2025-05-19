import sequelize from '../config/database.js';
import User from './User.js';
import Post from './Post.js';
import Like from './Like.js';
import Comment from './Comment.js';
import NotificationFactory from './notification.js';

const Notification = NotificationFactory(sequelize);

// User와 Post 관계 설정
Post.belongsTo(User, { as: 'author', foreignKey: 'authorId' });
User.hasMany(Post, { foreignKey: 'authorId' });

// Like 관계 설정
Post.belongsToMany(User, { 
  through: Like,
  as: 'likedBy',
  foreignKey: 'PostId',
  otherKey: 'UserId'
});
User.belongsToMany(Post, { 
  through: Like,
  as: 'likedPosts',
  foreignKey: 'UserId',
  otherKey: 'PostId'
});

// Comment 관계 설정
Comment.belongsTo(User, { as: 'commentAuthor', foreignKey: 'authorId' });
Comment.belongsTo(Post, { foreignKey: 'postId' });
User.hasMany(Comment, { foreignKey: 'authorId' });
Post.hasMany(Comment, { foreignKey: 'postId', as: 'comments' });

// Repost 관계 설정
Post.belongsTo(Post, { as: 'originalPost', foreignKey: 'originalPostId' });
Post.hasMany(Post, { as: 'repostList', foreignKey: 'originalPostId' });

// Notification 관계 설정
Notification.associate?.({ User, Post });

// 모델 간의 관계 설정이 필요한 경우 여기에 추가

export {
  sequelize,
  User,
  Post,
  Like,
  Comment,
  Notification
};
