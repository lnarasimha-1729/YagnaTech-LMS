const { Sequelize } = require('sequelize');
const env = require('./env');

/**
 * Second Sequelize handle pointed at auth-service's database (lucy_devdb).
 * Used READ-ONLY by the College Dashboard endpoint to count students,
 * pre/post-assessment attempts, etc. for the caller's college.
 *
 * We don't define models here — raw SQL via `query()` is cheaper for the
 * aggregate counts the dashboard needs and avoids duplicating the User schema.
 */
const authSequelize = new Sequelize(
    env.authDb.name,
    env.authDb.user,
    env.authDb.pass,
    {
        host: env.authDb.host,
        port: env.authDb.port,
        dialect: env.authDb.dialect,
        logging: false,
        define: { underscored: false, freezeTableName: true },
        pool: { max: 5, min: 0, acquire: 60000, idle: 10000 },
        retry: {
            max: 2,
            match: [/ECONNRESET/, /ETIMEDOUT/, /SequelizeConnectionError/],
        },
        dialectOptions: {
            connectTimeout: 60000,
            enableKeepAlive: true,
            keepAliveInitialDelay: 10000,
        },
    }
);

module.exports = authSequelize;
