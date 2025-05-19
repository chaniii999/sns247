import { DataTypes } from 'sequelize';
import { sequelize } from './index.js';

const Comment = sequelize.define('Comment', {
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
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    postId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Posts',
            key: 'id'
        }
    }
}, {
    timestamps: true,
    paranoid: true
});

Comment.associate = (models) => {
    Comment.belongsTo(models.User, {
        foreignKey: 'authorId',
        as: 'author'
    });
    Comment.belongsTo(models.Post, {
        foreignKey: 'postId',
        as: 'post'
    });
};

export default Comment;
