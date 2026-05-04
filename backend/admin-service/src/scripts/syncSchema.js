const { sequelize } = require('../models');

(async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ alter: false });
        const [tables] = await sequelize.query('SHOW TABLES');
        console.log('Schema synced. Tables:');
        tables.forEach((t) => console.log(' -', Object.values(t)[0]));
        process.exit(0);
    } catch (e) {
        console.error('Sync failed:', e.message);
        process.exit(1);
    }
})();
