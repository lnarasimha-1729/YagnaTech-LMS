import 'dotenv/config';
import bcrypt from 'bcrypt';
import sequelize from '../db/index.js';
import User from '../db/models/User.js';
import Role from '../db/models/Role.js';
import { generateUserID, generateRoleID } from '../utils/uidGeneration.js';

(async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();

        const email = process.argv[2] || 'college-admin@gmail.com';
        const password = process.argv[3] || 'college123';
        const name = process.argv[4] || 'College Admin';
        const collegeId = process.argv[5] || 'COLLEGE001';

        let adminRole = await Role.findOne({ where: { role: 'admin' } });
        if (!adminRole) {
            adminRole = await Role.create({ roleId: generateRoleID('R'), role: 'admin' });
            console.log(`Created admin role roleId=${adminRole.roleId}`);
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const existing = await User.findOne({ where: { email } });

        if (existing) {
            await existing.update({ 
                passwordHash, 
                roleId: adminRole.roleId, 
                profileStatus: 'active',
                collegeId
            });
            console.log(`Updated user ${email} (userId=${existing.userId}) to college admin with collegeId=${collegeId}`);
        } else {
            const user = await User.create({
                userId: generateUserID(),
                email,
                passwordHash,
                name,
                phone: '9999999999',
                dob: '2000-01-01',
                gender: 'male',
                roleId: adminRole.roleId,
                profileStatus: 'active',
                collegeId
            });
            console.log(`Created college admin user userId=${user.userId} email=${email} collegeId=${collegeId}`);
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
