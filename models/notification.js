const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Notification = sequelize.define('Notification', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        senderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        type: {
            type: DataTypes.ENUM('like', 'comment', 'follow'),
            allowNull: false
        },
        postId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Posts',
                key: 'id'
            }
        },
        link: {
            type: DataTypes.STRING,
            allowNull: false
        },
        preview: {
            type: DataTypes.STRING,
            allowNull: true
        },
        read: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        timestamps: true
    });

    Notification.associate = (models) => {
        Notification.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
        Notification.belongsTo(models.User, {
            foreignKey: 'senderId',
            as: 'sender'
        });
        Notification.belongsTo(models.Post, {
            foreignKey: 'postId',
            as: 'post'
        });
    };

    return Notification;
}; 