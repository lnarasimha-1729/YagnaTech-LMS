const { Sequelize } = require('sequelize');
const env = require('./env');

const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: 'mysql',
  logging: env.nodeEnv === 'development' ? (msg) => console.log(`[sql] ${msg}`) : false,
  define: {
    underscored: true,
    timestamps: true,
  },
  pool: { max: 15, min: 0, idle: 10000, acquire: 30000 },
});

module.exports = sequelize;
