import { db } from '../config/database';
import { roles, users, departemen, kegiatan, kepengurusan, kas, kasDetail, arsip } from '../db/schema/index';
import { hashPassword } from '../utils/password';
import { ROLE_PERMISSIONS } from '../types/index';
import { eq } from 'drizzle-orm';

async function seed() {
    console.log('🌱 Starting database seeding...');

    try {
        // Create roles
        console.log('Creating roles...');
        const rolesToInsert = [
            {
                name: 'admin',
                description: 'Administrator dengan akses penuh',
                permissions: ROLE_PERMISSIONS.admin,
            },
            {
                name: 'pengurus',
                description: 'Pengurus organisasi FKMB',
                permissions: ROLE_PERMISSIONS.pengurus,
            },
            {
                name: 'bendahara',
                description: 'Bendahara organisasi FKMB',
                permissions: ROLE_PERMISSIONS.bendahara,
            },
            {
                name: 'anggota',
                description: 'Anggota biasa FKMB',
                permissions: ROLE_PERMISSIONS.anggota,
            },
        ];

        const insertedRoles = await db
            .insert(roles)
            .values(rolesToInsert)
            .onConflictDoNothing()
            .returning();

        console.log(`✅ Created ${insertedRoles.length} roles`);

        // Get admin role
        const [adminRole] = await db
            .select()
            .from(roles)
            .where(eq(roles.name, 'admin'))
            .limit(1);

        // Create default admin user
        console.log('Creating default admin user...');
        const adminPassword = await hashPassword('admin123');

        const [adminUser] = await db
            .insert(users)
            .values({
                email: 'admin@fkmb.unesa.ac.id',
                password: adminPassword,
                name: 'Admin FKMB',
                roleId: adminRole?.id,
                isActive: true,
            })
            .onConflictDoNothing()
            .returning();

        if (adminUser) {
            console.log('✅ Created admin user: admin@fkmb.unesa.ac.id / admin123');
        } else {
            console.log('ℹ️ Admin user already exists');
        }

        // Create default departemen
        console.log('Creating departemen...');
        const departemenList = [
            { name: 'Badan Pengurus Harian', description: 'BPH - Pengurus inti organisasi' },
            { name: 'Departemen Pendidikan', description: 'Mengelola kegiatan pendidikan dan akademik' },
            { name: 'Departemen Minat Bakat', description: 'Mengelola pengembangan minat dan bakat' },
            { name: 'Departemen Sosial', description: 'Mengelola kegiatan sosial kemasyarakatan' },
            { name: 'Departemen Komunikasi', description: 'Mengelola komunikasi dan publikasi' },
            { name: 'Departemen Kewirausahaan', description: 'Mengelola kegiatan kewirausahaan' },
        ];

        const insertedDepartemen = await db
            .insert(departemen)
            .values(departemenList)
            .onConflictDoNothing()
            .returning();

        console.log(`✅ Created ${insertedDepartemen.length} departemen`);

        // Get anggota role for dummy users
        const [anggotaRole] = await db
            .select()
            .from(roles)
            .where(eq(roles.name, 'anggota'))
            .limit(1);

        // Get all departemen for random assignment
        const allDepartemen = await db.select().from(departemen);

        // Create 10 dummy users with NIM@mhs.unesa.ac.id format
        console.log('Creating dummy users...');
        const dummyPassword = await hashPassword('password123');

        const dummyUsers = [
            { nim: '25051214046', name: 'Ahmad Fauzi', fakultas: 'Teknik', prodi: 'S1 Informatika', angkatan: '2025' },
            { nim: '25051214047', name: 'Siti Aisyah', fakultas: 'Teknik', prodi: 'S1 Informatika', angkatan: '2025' },
            { nim: '25051214048', name: 'Budi Santoso', fakultas: 'Teknik', prodi: 'S1 Informatika', angkatan: '2025' },
            { nim: '25051214049', name: 'Dewi Lestari', fakultas: 'Teknik', prodi: 'S1 Teknik Elektro', angkatan: '2025' },
            { nim: '25051214050', name: 'Rizky Pratama', fakultas: 'Teknik', prodi: 'S1 Teknik Elektro', angkatan: '2025' },
            { nim: '24051214031', name: 'Nurul Hidayah', fakultas: 'Teknik', prodi: 'S1 Informatika', angkatan: '2024' },
            { nim: '24051214032', name: 'Fajar Ramadhan', fakultas: 'Teknik', prodi: 'S1 Informatika', angkatan: '2024' },
            { nim: '24051214033', name: 'Indah Permata', fakultas: 'Teknik', prodi: 'S1 Sistem Informasi', angkatan: '2024' },
            { nim: '23051214021', name: 'Agus Wijaya', fakultas: 'Teknik', prodi: 'S1 Informatika', angkatan: '2023' },
            { nim: '23051214022', name: 'Maya Sari', fakultas: 'Teknik', prodi: 'S1 Informatika', angkatan: '2023' },
        ];

        let insertedUsersCount = 0;
        for (let i = 0; i < dummyUsers.length; i++) {
            const user = dummyUsers[i];
            const randomDept = allDepartemen[i % allDepartemen.length];

            try {
                await db.insert(users).values({
                    email: `${user.nim}@mhs.unesa.ac.id`,
                    password: dummyPassword,
                    name: user.name,
                    nim: user.nim,
                    phone: `08${Math.floor(1000000000 + Math.random() * 9000000000).toString().slice(0, 10)}`,
                    fakultas: user.fakultas,
                    prodi: user.prodi,
                    angkatan: user.angkatan,
                    roleId: anggotaRole?.id,
                    departemenId: randomDept?.id,
                    isActive: true,
                }).onConflictDoNothing();
                insertedUsersCount++;
            } catch (e) {
                // Skip if user already exists
            }
        }
        console.log(`✅ Created ${insertedUsersCount} dummy users`);

        // Get all users for reference
        const allUsers = await db.select().from(users);
        const adminUserRef = allUsers.find(u => u.email === 'admin@fkmb.unesa.ac.id');

        // Create 5 dummy kegiatan
        console.log('Creating dummy kegiatan...');
        const kegiatanList = [
            { name: 'Rapat Koordinasi BPH', description: 'Rapat koordinasi bulanan BPH FKMB', location: 'Ruang Rapat A', type: 'rapat', status: 'completed' },
            { name: 'Workshop Kepemimpinan', description: 'Pelatihan kepemimpinan untuk pengurus', location: 'Aula Teknik', type: 'pelatihan', status: 'upcoming' },
            { name: 'FKMB Cup 2025', description: 'Kompetisi olahraga antar mahasiswa', location: 'Lapangan Unesa', type: 'event', status: 'upcoming' },
            { name: 'Bakti Sosial', description: 'Kegiatan sosial ke panti asuhan', location: 'Panti Asuhan Kasih', type: 'event', status: 'upcoming' },
            { name: 'Seminar Teknologi', description: 'Seminar teknologi terkini untuk mahasiswa', location: 'Gedung T7', type: 'seminar', status: 'completed' },
        ];

        const insertedKegiatan = [];
        for (let i = 0; i < kegiatanList.length; i++) {
            const kg = kegiatanList[i];
            const dept = allDepartemen[i % allDepartemen.length];
            const startDate = new Date();
            startDate.setDate(startDate.getDate() + (i * 7) - 14);

            const [inserted] = await db.insert(kegiatan).values({
                name: kg.name,
                description: kg.description,
                location: kg.location,
                startDate,
                endDate: new Date(startDate.getTime() + 3600000 * 3),
                type: kg.type,
                status: kg.status,
                departemenId: dept?.id,
                createdBy: adminUserRef?.id,
            }).onConflictDoNothing().returning();
            if (inserted) insertedKegiatan.push(inserted);
        }
        console.log(`✅ Created ${insertedKegiatan.length} kegiatan`);

        // Create 5 dummy kepengurusan
        console.log('Creating dummy kepengurusan...');
        const jabatanList = ['Ketua', 'Wakil Ketua', 'Sekretaris', 'Bendahara', 'Koordinator'];
        let insertedKepengCount = 0;
        for (let i = 0; i < Math.min(5, allUsers.length); i++) {
            const user = allUsers[i];
            const dept = allDepartemen[i % allDepartemen.length];
            try {
                await db.insert(kepengurusan).values({
                    userId: user.id,
                    departemenId: dept.id,
                    jabatan: jabatanList[i % jabatanList.length],
                    periode: '2024/2025',
                    startDate: '2024-09-01',
                    isActive: true,
                }).onConflictDoNothing();
                insertedKepengCount++;
            } catch (e) {
                // Skip duplicates
            }
        }
        console.log(`✅ Created ${insertedKepengCount} kepengurusan`);

        // Create 1 kas period with 5 transactions
        console.log('Creating dummy kas...');
        const [kasRecord] = await db.insert(kas).values({
            periode: '2024/2025',
            saldoAwal: '5000000',
            saldoAkhir: '7500000',
            description: 'Kas periode 2024/2025',
            isActive: true,
        }).onConflictDoNothing().returning();

        if (kasRecord) {
            const kasDetailList = [
                { tanggal: '2024-10-01', jenis: 'pemasukan' as const, kategori: 'Iuran Anggota', description: 'Iuran bulanan anggota Oktober', jumlah: '1000000' },
                { tanggal: '2024-10-05', jenis: 'pengeluaran' as const, kategori: 'Operasional', description: 'Pembelian ATK', jumlah: '250000' },
                { tanggal: '2024-10-10', jenis: 'pemasukan' as const, kategori: 'Sponsor', description: 'Sponsorship acara workshop', jumlah: '2000000' },
                { tanggal: '2024-10-15', jenis: 'pengeluaran' as const, kategori: 'Kegiatan', description: 'Konsumsi rapat koordinasi', jumlah: '500000' },
                { tanggal: '2024-10-20', jenis: 'pemasukan' as const, kategori: 'Iuran Anggota', description: 'Iuran bulanan anggota November', jumlah: '1000000' },
            ];

            for (const detail of kasDetailList) {
                await db.insert(kasDetail).values({
                    kasId: kasRecord.id,
                    tanggal: detail.tanggal,
                    jenis: detail.jenis,
                    kategori: detail.kategori,
                    description: detail.description,
                    jumlah: detail.jumlah,
                    createdBy: adminUserRef?.id,
                }).onConflictDoNothing();
            }
            console.log(`✅ Created 1 kas with 5 transactions`);
        }

        // Create 5 dummy arsip
        console.log('Creating dummy arsip...');
        const arsipList = [
            { title: 'SK Pengurus 2024/2025', category: 'SK', fileType: 'pdf' },
            { title: 'Laporan Pertanggungjawaban 2023', category: 'Laporan', fileType: 'pdf' },
            { title: 'Dokumentasi Workshop Kepemimpinan', category: 'Dokumentasi', fileType: 'zip' },
            { title: 'Proposal FKMB Cup 2025', category: 'Proposal', fileType: 'docx' },
            { title: 'Notulensi Rapat BPH', category: 'Notulensi', fileType: 'pdf' },
        ];

        for (let i = 0; i < arsipList.length; i++) {
            const ar = arsipList[i];
            const dept = allDepartemen[i % allDepartemen.length];
            await db.insert(arsip).values({
                title: ar.title,
                description: `${ar.category} - ${ar.title}`,
                category: ar.category,
                fileUrl: `/uploads/arsip/dummy_${i + 1}.${ar.fileType}`,
                fileType: ar.fileType,
                fileSize: Math.floor(Math.random() * 5000000) + 100000,
                departemenId: dept?.id,
                uploadedBy: adminUserRef?.id,
            }).onConflictDoNothing();
        }
        console.log(`✅ Created 5 arsip`);

        console.log('\n🎉 Database seeding completed successfully!');
        console.log('\n📋 Default credentials:');
        console.log('   Email: admin@fkmb.unesa.ac.id');
        console.log('   Password: admin123');
        console.log('\n   Dummy users: [NIM]@mhs.unesa.ac.id / password123');
        console.log('\n⚠️  Please change the default password after first login!');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    }
}

seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
