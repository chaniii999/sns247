import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  likes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  replies: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  reposts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  originalPostId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Posts',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  paranoid: true,
  indexes: [
    {
      fields: ['authorId']
    }
  ]
});

Post.associate = (models) => {
  Post.belongsTo(models.User, {
    foreignKey: 'authorId',
    as: 'author'
  });
  Post.belongsTo(models.Post, {
    foreignKey: 'originalPostId',
    as: 'originalPost'
  });
  Post.hasMany(models.Post, {
    foreignKey: 'originalPostId',
    as: 'repostList'
  });
  Post.belongsToMany(models.User, {
    through: models.Like,
    as: 'likedBy',
    foreignKey: 'PostId',
    otherKey: 'UserId'
  });
  Post.belongsToMany(models.User, {
    through: 'Reposts',
    as: 'repostedBy',
    foreignKey: 'PostId',
    otherKey: 'UserId'
  });
  Post.hasMany(models.Comment, {
    foreignKey: 'postId',
    as: 'comments'
  });
};

export default Post;
