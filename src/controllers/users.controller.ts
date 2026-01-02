import { Response } from 'express';
import { db } from '../config/database.js';
import { users, roles, departemen } from '../db/schema/index.js';
import { eq, and, isNull, like, or, sql, asc, desc } from 'drizzle-orm';
import { hashPassword } from '../utils/password.js';
import { generateRandomToken } from '../utils/password.js';
import {
    successResponse,
    createdResponse,
    errorResponse,
    notFoundResponse,
    badRequestResponse,
} from '../utils/response.js';
import { sendWelcomeEmail } from '../services/mail.service.js';
import { AuthRequest, PaginationQuery } from '../types/index.js';
import { parsePagination, createPaginationMeta } from '../utils/pagination.js';
import { z } from 'zod';
import * as XLSX from 'xlsx';

// Validation schemas
const optionalString = z.string().optional().transform(v => v === '' ? undefined : v);
const optionalUuid = z.preprocess(
    (v) => (v === '' || v === null ? undefined : v),
    z.string().uuid('Invalid UUID').optional()
);
const nullableString = z.preprocess(
    (v) => (v === '' ? null : v),
    z.string().nullable().optional()
);
const nullableUuid = z.preprocess(
    (v) => (v === '' ? null : v),
    z.string().uuid('Invalid UUID').nullable().optional()
);

export const createUserSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters').optional(),
    name: z.string().min(1, 'Name is required'),
    nim: optionalString,
    phone: optionalString,
    fakultas: optionalString,
    prodi: optionalString,
    angkatan: optionalString,
    roleId: optionalUuid,
    departemenId: optionalUuid,
    isActive: z.boolean().default(true),
    sendWelcomeEmail: z.boolean().default(false),
});

export const updateUserSchema = z.object({
    email: z.string().email('Invalid email format').optional(),
    name: z.string().min(1, 'Name is required').optional(),
    nim: nullableString,
    phone: nullableString,
    fakultas: nullableString,
    prodi: nullableString,
    angkatan: nullableString,
    avatar: nullableString,
    roleId: nullableUuid,
    departemenId: nullableUuid,
    isActive: z.boolean().optional(),
});

export const idParamSchema = z.object({
    id: z.string().uuid('Invalid ID'),
});

// Controllers
export async function getUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
        const query = req.query as PaginationQuery & { roleId?: string };
        const { page, limit, offset } = parsePagination(query);
        const search = query.search?.toLowerCase();
        const roleId = query.roleId;

        // Build where conditions
        const conditions = [isNull(users.deletedAt)];

        if (search) {
            conditions.push(
                or(
                    like(sql`LOWER(${users.name})`, `%${search}%`),
                    like(sql`LOWER(${users.email})`, `%${search}%`),
                    like(sql`LOWER(${users.nim})`, `%${search}%`)
                )!
            );
        }

        if (roleId) {
            conditions.push(eq(users.roleId, roleId));
        }

        const whereClause = and(...conditions);

        // Get total count
        const [{ count }] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(users)
            .where(whereClause);

        // Get users with pagination
        const userList = await db
            .select({
                id: users.id,
                email: users.email,
                name: users.name,
                nim: users.nim,
                phone: users.phone,
                fakultas: users.fakultas,
                prodi: users.prodi,
                angkatan: users.angkatan,
                avatar: users.avatar,
                roleId: users.roleId,
                departemenId: users.departemenId,
                isActive: users.isActive,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
                roleName: roles.name,
                departemenName: departemen.name,
            })
            .from(users)
            .leftJoin(roles, eq(users.roleId, roles.id))
            .leftJoin(departemen, eq(users.departemenId, departemen.id))
            .where(whereClause)
            .orderBy(query.sortOrder === 'desc' ? desc(users.createdAt) : asc(users.createdAt))
            .limit(limit)
            .offset(offset);

        const meta = createPaginationMeta(count, page, limit);
        successResponse(res, userList, 'Users retrieved successfully', 200, meta);
    } catch (error) {
        console.error('Get users error:', error);
        errorResponse(res, 'Failed to get users');
    }
}

export async function getUserById(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const [user] = await db
            .select({
                id: users.id,
                email: users.email,
                name: users.name,
                nim: users.nim,
                phone: users.phone,
                fakultas: users.fakultas,
                prodi: users.prodi,
                angkatan: users.angkatan,
                avatar: users.avatar,
                roleId: users.roleId,
                departemenId: users.departemenId,
                isActive: users.isActive,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
                roleName: roles.name,
                departemenName: departemen.name,
            })
            .from(users)
            .leftJoin(roles, eq(users.roleId, roles.id))
            .leftJoin(departemen, eq(users.departemenId, departemen.id))
            .where(
                and(
                    eq(users.id, id),
                    isNull(users.deletedAt)
                )
            )
            .limit(1);

        if (!user) {
            notFoundResponse(res, 'User not found');
            return;
        }

        successResponse(res, user, 'User retrieved successfully');
    } catch (error) {
        console.error('Get user error:', error);
        errorResponse(res, 'Failed to get user');
    }
}

export async function createUser(req: AuthRequest, res: Response): Promise<void> {
    try {
        const data = req.body;

        // Check if email already exists
        const [existingUser] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, data.email.toLowerCase()))
            .limit(1);

        if (existingUser) {
            errorResponse(res, 'Email already exists', 409);
            return;
        }

        // Generate temporary password if not provided
        const password = data.password || generateRandomToken(12);
        const hashedPassword = await hashPassword(password);

        // Create user
        const [newUser] = await db
            .insert(users)
            .values({
                email: data.email.toLowerCase(),
                password: hashedPassword,
                name: data.name,
                nim: data.nim,
                phone: data.phone,
                fakultas: data.fakultas,
                prodi: data.prodi,
                angkatan: data.angkatan,
                roleId: data.roleId,
                departemenId: data.departemenId,
                isActive: data.isActive ?? true,
            })
            .returning({
                id: users.id,
                email: users.email,
                name: users.name,
                nim: users.nim,
                phone: users.phone,
                fakultas: users.fakultas,
                prodi: users.prodi,
                angkatan: users.angkatan,
                roleId: users.roleId,
                departemenId: users.departemenId,
                isActive: users.isActive,
                createdAt: users.createdAt,
            });

        // Send welcome email with temporary password
        if (data.sendWelcomeEmail && !data.password) {
            await sendWelcomeEmail(data.email, data.name, password);
        }

        createdResponse(res, newUser, 'User created successfully');
    } catch (error) {
        console.error('Create user error:', error);
        errorResponse(res, 'Failed to create user');
    }
}

export async function updateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const data = req.body;

        // Check if user exists
        const [existingUser] = await db
            .select({ id: users.id })
            .from(users)
            .where(
                and(
                    eq(users.id, id),
                    isNull(users.deletedAt)
                )
            )
            .limit(1);

        if (!existingUser) {
            notFoundResponse(res, 'User not found');
            return;
        }

        // Check email uniqueness if updating email
        if (data.email) {
            const [emailExists] = await db
                .select({ id: users.id })
                .from(users)
                .where(
                    and(
                        eq(users.email, data.email.toLowerCase()),
                        sql`${users.id} != ${id}`
                    )
                )
                .limit(1);

            if (emailExists) {
                errorResponse(res, 'Email already exists', 409);
                return;
            }
        }

        // Update user
        const [updatedUser] = await db
            .update(users)
            .set({
                ...data,
                email: data.email?.toLowerCase(),
                updatedAt: new Date(),
            })
            .where(eq(users.id, id))
            .returning({
                id: users.id,
                email: users.email,
                name: users.name,
                nim: users.nim,
                phone: users.phone,
                fakultas: users.fakultas,
                prodi: users.prodi,
                angkatan: users.angkatan,
                avatar: users.avatar,
                roleId: users.roleId,
                departemenId: users.departemenId,
                isActive: users.isActive,
                updatedAt: users.updatedAt,
            });

        successResponse(res, updatedUser, 'User updated successfully');
    } catch (error) {
        console.error('Update user error:', error);
        errorResponse(res, 'Failed to update user');
    }
}

export async function deleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        // Check if user exists
        const [existingUser] = await db
            .select({ id: users.id })
            .from(users)
            .where(
                and(
                    eq(users.id, id),
                    isNull(users.deletedAt)
                )
            )
            .limit(1);

        if (!existingUser) {
            notFoundResponse(res, 'User not found');
            return;
        }

        // Hard delete - permanently remove from database
        await db
            .delete(users)
            .where(eq(users.id, id));

        successResponse(res, null, 'User deleted successfully');
    } catch (error) {
        console.error('Delete user error:', error);
        errorResponse(res, 'Failed to delete user');
    }
}

// Export users to Excel
export async function exportUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
        const query = req.query as { roleId?: string };

        let whereClause = isNull(users.deletedAt);
        if (query.roleId) {
            whereClause = and(whereClause, eq(users.roleId, query.roleId))!;
        }

        const userList = await db
            .select({
                id: users.id,
                email: users.email,
                name: users.name,
                nim: users.nim,
                phone: users.phone,
                fakultas: users.fakultas,
                prodi: users.prodi,
                angkatan: users.angkatan,
                roleName: roles.name,
                departemenName: departemen.name,
                isActive: users.isActive,
                createdAt: users.createdAt,
            })
            .from(users)
            .leftJoin(roles, eq(users.roleId, roles.id))
            .leftJoin(departemen, eq(users.departemenId, departemen.id))
            .where(whereClause)
            .orderBy(asc(users.name));

        // Transform data for Excel
        const excelData = userList.map((u, index) => ({
            'No': index + 1,
            'Email': u.email,
            'Nama': u.name,
            'NIM': u.nim || '',
            'No. HP': u.phone || '',
            'Fakultas': u.fakultas || '',
            'Prodi': u.prodi || '',
            'Angkatan': u.angkatan || '',
            'Role': u.roleName || '',
            'Departemen': u.departemenName || '',
            'Status': u.isActive ? 'Aktif' : 'Tidak Aktif',
            'Terdaftar': u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID') : '',
        }));

        // Create workbook and worksheet
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Anggota');

        // Set column widths
        worksheet['!cols'] = [
            { wch: 5 },  // No
            { wch: 30 }, // Email
            { wch: 25 }, // Nama
            { wch: 15 }, // NIM
            { wch: 15 }, // No. HP
            { wch: 20 }, // Fakultas
            { wch: 25 }, // Prodi
            { wch: 10 }, // Angkatan
            { wch: 12 }, // Role
            { wch: 20 }, // Departemen
            { wch: 12 }, // Status
            { wch: 15 }, // Terdaftar
        ];

        // Generate buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Send file
        const filename = `data-anggota-${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    } catch (error) {
        console.error('Export users error:', error);
        errorResponse(res, 'Failed to export users');
    }
}

// Download import template
export async function downloadTemplate(req: AuthRequest, res: Response): Promise<void> {
    try {
        // Get roles and departemen for reference
        const roleList = await db.select({ name: roles.name }).from(roles).where(isNull(roles.deletedAt));
        const deptList = await db.select({ name: departemen.name }).from(departemen).where(isNull(departemen.deletedAt));

        // Create template data with example
        const templateData = [
            {
                'Email *': 'contoh@mhs.unesa.ac.id',
                'Nama *': 'Nama Lengkap',
                'NIM': '25051214001',
                'No. HP': '081234567890',
                'Fakultas': 'Teknik',
                'Prodi': 'Teknik Informatika',
                'Angkatan': '2025',
                'Role': 'anggota',
                'Departemen': '',
                'Password': 'password123',
            },
        ];

        // Create workbook
        const workbook = XLSX.utils.book_new();

        // Main template sheet
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        worksheet['!cols'] = [
            { wch: 30 }, // Email
            { wch: 25 }, // Nama
            { wch: 15 }, // NIM
            { wch: 15 }, // No. HP
            { wch: 20 }, // Fakultas
            { wch: 25 }, // Prodi
            { wch: 10 }, // Angkatan
            { wch: 12 }, // Role
            { wch: 20 }, // Departemen
            { wch: 15 }, // Password
        ];
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Import');

        // Reference sheet for roles
        const rolesSheet = XLSX.utils.json_to_sheet(roleList.map(r => ({ 'Daftar Role': r.name })));
        XLSX.utils.book_append_sheet(workbook, rolesSheet, 'Daftar Role');

        // Reference sheet for departemen
        const deptSheet = XLSX.utils.json_to_sheet(deptList.map(d => ({ 'Daftar Departemen': d.name })));
        XLSX.utils.book_append_sheet(workbook, deptSheet, 'Daftar Departemen');

        // Generate buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Send file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="template-import-anggota.xlsx"');
        res.send(buffer);
    } catch (error) {
        console.error('Download template error:', error);
        errorResponse(res, 'Failed to download template');
    }
}

// Import users from Excel
export async function importUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
        if (!req.file) {
            badRequestResponse(res, 'File Excel diperlukan');
            return;
        }

        // Parse Excel file
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, string>[];

        if (jsonData.length === 0) {
            badRequestResponse(res, 'File Excel kosong');
            return;
        }

        // Get roles and departemen maps
        const roleList = await db.select().from(roles).where(isNull(roles.deletedAt));
        const deptList = await db.select().from(departemen).where(isNull(departemen.deletedAt));
        const roleMap = new Map(roleList.map(r => [r.name?.toLowerCase(), r.id]));
        const deptMap = new Map(deptList.map(d => [d.name?.toLowerCase(), d.id]));
        const anggotaRoleId = roleMap.get('anggota');

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[],
        };

        for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i];
            const rowNum = i + 2; // Excel row number (1-indexed + header)

            try {
                const email = row['Email *'] || row['Email'];
                const name = row['Nama *'] || row['Nama'];

                if (!email || !name) {
                    results.failed++;
                    results.errors.push(`Baris ${rowNum}: Email dan Nama wajib diisi`);
                    continue;
                }

                // Check if email already exists
                const [existingUser] = await db
                    .select({ id: users.id })
                    .from(users)
                    .where(eq(users.email, email))
                    .limit(1);

                if (existingUser) {
                    results.failed++;
                    results.errors.push(`Baris ${rowNum}: Email ${email} sudah terdaftar`);
                    continue;
                }

                // Get role ID
                const roleName = (row['Role'] || 'anggota').toLowerCase();
                const roleId = roleMap.get(roleName) || anggotaRoleId;

                // Get departemen ID
                const deptName = (row['Departemen'] || '').toLowerCase();
                const departemenId = deptName ? deptMap.get(deptName) : null;

                // Hash password
                const password = row['Password'] || 'password123';
                const hashedPassword = await hashPassword(password);

                // Insert user
                await db.insert(users).values({
                    email,
                    password: hashedPassword,
                    name,
                    nim: row['NIM'] || null,
                    phone: row['No. HP'] || null,
                    fakultas: row['Fakultas'] || null,
                    prodi: row['Prodi'] || null,
                    angkatan: row['Angkatan'] || null,
                    roleId: roleId || null,
                    departemenId: departemenId || null,
                    isActive: true,
                });

                results.success++;
            } catch (err) {
                results.failed++;
                results.errors.push(`Baris ${rowNum}: Gagal menyimpan data`);
                console.error(`Import row ${rowNum} error:`, err);
            }
        }

        successResponse(res, results, `Import selesai: ${results.success} berhasil, ${results.failed} gagal`);
    } catch (error) {
        console.error('Import users error:', error);
        errorResponse(res, 'Gagal mengimpor data');
    }
}
