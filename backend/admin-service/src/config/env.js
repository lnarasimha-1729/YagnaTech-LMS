require('dotenv').config();

module.exports = {
    port: Number(process.env.PORT || 5000),
    env: process.env.NODE_ENV || 'development',
    appUrl: process.env.APP_URL || 'http://localhost:5000',
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    jwt: {
        secret: process.env.JWT_SECRET || 'change-me-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    db: {
        name: process.env.DB_NAME,
        user: process.env.DB_USER,
        pass: process.env.DB_PASS,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: process.env.DB_DIALECT || 'mysql',
    },
    // Read-only handle to auth-service's DB (lucy_devdb). Used by the College
    // Dashboard endpoint for cross-DB counts. Same RDS host/credentials, different schema.
    authDb: {
        name: process.env.AUTH_DB_NAME || 'lucy_devdb',
        user: process.env.DB_USER,
        pass: process.env.DB_PASS,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: process.env.DB_DIALECT || 'mysql',
    },
    mail: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        from: process.env.SMTP_FROM,
    },
};
