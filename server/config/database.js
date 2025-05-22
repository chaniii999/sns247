import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();



// 데이터베이스 연결 config
const sequelize = new Sequelize(
  process.env.DB_NAME || 'sns247',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'qwer1234',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,  // SQL 쿼리 로그 비활성화
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: true
    },
    // 데이터베이스 파일 저장 설정 추가
    storage: './database.sqlite',  // SQLite를 사용하는 경우
    // 또는 MySQL을 사용하는 경우
    dialectOptions: {
      charset: 'utf8mb4'
    }
  }
);


export { sequelize };
export default sequelize;
