const bcrypt = require('bcryptjs');
const { sequelize, User } = require('../models');

(async () => {
    try {
        await sequelize.authenticate();
        const email = process.argv[2] || 'root@admin.com';
        const password = process.argv[3] || 'password123';
        const name = process.argv[4] || 'Root Admin';

        const existing = await User.findOne({ where: { email } });
        if (existing) {
            console.log(`User ${email} already exists (id=${existing.id}, role=${existing.role}). Updating password.`);
            await existing.update({ password: await bcrypt.hash(password, 10), role: 'admin', status: 1 });
        } else {
            const created = await User.create({
                name, email, role: 'admin', status: 1,
                password: await bcrypt.hash(password, 10),
            });
            console.log(`Created admin id=${created.id} email=${email}`);
        }
        console.log(`Login with: email=${email} password=${password}`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
