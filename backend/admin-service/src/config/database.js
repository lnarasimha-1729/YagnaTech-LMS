const { Sequelize } = require('sequelize');
const env = require('./env');

const sequelize = new Sequelize(
    env.db.name,
    env.db.user,
    env.db.pass,
    {
        host: env.db.host,
        port: env.db.port,
        dialect: env.db.dialect,
        logging: false,
        define: { underscored: false, freezeTableName: true },
        pool: {
            max: 10,
            min: 0,
            acquire: 60000,
            idle: 10000,
            evict: 15000,
        },
        retry: {
            max: 3,
            match: [
                /ECONNRESET/,
                /ETIMEDOUT/,
                /EHOSTUNREACH/,
                /SequelizeConnectionError/,
                /SequelizeConnectionRefusedError/,
                /SequelizeHostNotFoundError/,
                /SequelizeHostNotReachableError/,
                /SequelizeInvalidConnectionError/,
                /SequelizeConnectionTimedOutError/,
                /ER_NET_READ_INTERRUPTED/,
                /Got timeout reading communication packets/,
            ],
        },
        dialectOptions: {
            connectTimeout: 60000,
            enableKeepAlive: true,
            keepAliveInitialDelay: 10000,
        },
    }
);

module.exports = sequelize;
