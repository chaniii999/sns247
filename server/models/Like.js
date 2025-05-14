import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Like = sequelize.define('Like', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['UserId', 'PostId'],
      name: 'unique_user_post'
    }
  ]
});

export default Like;
