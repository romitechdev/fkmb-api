import { db } from '../config/database';
import { users, roles } from '../db/schema/index';
import { hashPassword } from '../utils/password';
import { eq } from 'drizzle-orm';

async function resetPasswords() {
    console.log('🔐 Resetting passwords for all users...');

    try {
        // Get anggota role
        const [anggotaRole] = await db
            .select()
            .from(roles)
            .where(eq(roles.name, 'anggota'))
            .limit(1);

        if (!anggotaRole) {
            console.log('❌ Anggota role not found');
            return;
        }

        // Hash the default password
        const defaultPassword = await hashPassword('password123');

        // Update all users with role anggota
        const result = await db
            .update(users)
            .set({
                password: defaultPassword,
                isActive: true,
                updatedAt: new Date()
            })
            .where(eq(users.roleId, anggotaRole.id))
            .returning({ id: users.id, email: users.email });

        console.log(`✅ Reset password for ${result.length} anggota users`);
        result.forEach(u => console.log(`   - ${u.email}`));
        console.log('\n📋 New password: password123');

    } catch (error) {
        console.error('❌ Reset passwords failed:', error);
        throw error;
    }
}

resetPasswords()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
