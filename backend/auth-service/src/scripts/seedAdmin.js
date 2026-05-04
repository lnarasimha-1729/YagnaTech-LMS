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

        const email = process.argv[2] || 'admin@gmail.com';
        const password = process.argv[3] || 'admin123';
        const name = process.argv[4] || 'Admin';

        let adminRole = await Role.findOne({ where: { role: 'admin' } });
        if (!adminRole) {
            adminRole = await Role.create({ roleId: generateRoleID('R'), role: 'admin' });
            console.log(`Created admin role roleId=${adminRole.roleId}`);
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const existing = await User.findOne({ where: { email } });

        if (existing) {
            await existing.update({ passwordHash, roleId: adminRole.roleId, profileStatus: 'active' });
            console.log(`Updated user ${email} (userId=${existing.userId}) to role=admin with new password`);
        } else {
            const user = await User.create({
                userId: generateUserID(),
                email,
                passwordHash,
                name,
                phone: '0000000000',
                dob: '2000-01-01',
                gender: 'male',
                roleId: adminRole.roleId,
                profileStatus: 'active',
            });
            console.log(`Created admin user userId=${user.userId} email=${email}`);
        }

        console.log(`Login with: email=${email} password=${password}`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
