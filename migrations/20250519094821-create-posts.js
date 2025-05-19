'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Posts', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      authorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      imageUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      likes: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      replies: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      reposts: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      originalPostId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Posts',
          key: 'id'
        }
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // 인덱스 추가
    await queryInterface.addIndex('Posts', ['authorId'], {
      name: 'posts_author_id_idx'
    });
    await queryInterface.addIndex('Posts', ['originalPostId'], {
      name: 'posts_original_post_id_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Posts');
  }
};
