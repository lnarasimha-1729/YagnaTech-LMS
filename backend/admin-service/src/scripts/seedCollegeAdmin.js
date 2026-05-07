const bcrypt = require('bcryptjs');
const { sequelize, User } = require('../models');

(async () => {
    try {
        await sequelize.authenticate();
        const email = process.argv[2] || 'college-admin@gmail.com';
        const password = process.argv[3] || 'college123';
        const name = process.argv[4] || 'College Admin';
        const collegeId = process.argv[5] || 'COLLEGE001';

        const existing = await User.findOne({ where: { email } });
        if (existing) {
            console.log(`User ${email} already exists (id=${existing.id}, role=${existing.role}). Updating password and college_id.`);
            await existing.update({ 
                password: await bcrypt.hash(password, 10), 
                role: 'admin', 
                status: 1,
                college_id: collegeId
            });
        } else {
            const created = await User.create({
                name, 
                email, 
                role: 'admin', 
                status: 1,
                college_id: collegeId,
                password: await bcrypt.hash(password, 10),
            });
            console.log(`Created college admin id=${created.id} email=${email} college_id=${collegeId}`);
        }
        console.log(`\n✅ Login with:`);
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        console.log(`   College ID: ${collegeId}\n`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
