import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false,
    pool: { max: 10, min: 0, acquire: 60000, idle: 10000, evict: 15000 },
    retry: {
      max: 3,
      match: [
        /ECONNRESET/, /ETIMEDOUT/, /EHOSTUNREACH/,
        /SequelizeConnectionError/, /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/, /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/, /SequelizeConnectionTimedOutError/,
        /ER_NET_READ_INTERRUPTED/, /Got timeout reading communication packets/,
      ],
    },
    dialectOptions: {
      connectTimeout: 60000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    },
  }
);

export default sequelize;
