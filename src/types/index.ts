import { Request } from 'express';
import { User } from '../db/schema/users.js';

export interface AuthRequest extends Request {
    user?: User & {
        roleName?: string;
        permissions?: string[];
    };
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    errors?: Array<{ field: string; message: string }>;
    meta?: PaginationMeta;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface PaginationQuery {
    page?: string;
    limit?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface JwtPayload {
    userId: string;
    email: string;
    roleId?: string;
    roleName?: string;
    type: 'access' | 'refresh';
}

export type RoleName = 'admin' | 'pengurus' | 'bendahara' | 'anggota';

export const PERMISSIONS = {
    // Users
    USERS_READ: 'users:read',
    USERS_CREATE: 'users:create',
    USERS_UPDATE: 'users:update',
    USERS_DELETE: 'users:delete',

    // Roles
    ROLES_READ: 'roles:read',
    ROLES_CREATE: 'roles:create',
    ROLES_UPDATE: 'roles:update',
    ROLES_DELETE: 'roles:delete',

    // Departemen
    DEPARTEMEN_READ: 'departemen:read',
    DEPARTEMEN_CREATE: 'departemen:create',
    DEPARTEMEN_UPDATE: 'departemen:update',
    DEPARTEMEN_DELETE: 'departemen:delete',

    // Kepengurusan
    KEPENGURUSAN_READ: 'kepengurusan:read',
    KEPENGURUSAN_CREATE: 'kepengurusan:create',
    KEPENGURUSAN_UPDATE: 'kepengurusan:update',
    KEPENGURUSAN_DELETE: 'kepengurusan:delete',

    // Kegiatan
    KEGIATAN_READ: 'kegiatan:read',
    KEGIATAN_CREATE: 'kegiatan:create',
    KEGIATAN_UPDATE: 'kegiatan:update',
    KEGIATAN_DELETE: 'kegiatan:delete',

    // Absensi
    ABSENSI_READ: 'absensi:read',
    ABSENSI_CREATE: 'absensi:create',
    ABSENSI_UPDATE: 'absensi:update',
    ABSENSI_DELETE: 'absensi:delete',

    // Kas
    KAS_READ: 'kas:read',
    KAS_CREATE: 'kas:create',
    KAS_UPDATE: 'kas:update',
    KAS_DELETE: 'kas:delete',

    // Arsip
    ARSIP_READ: 'arsip:read',
    ARSIP_CREATE: 'arsip:create',
    ARSIP_UPDATE: 'arsip:update',
    ARSIP_DELETE: 'arsip:delete',
} as const;

export const ROLE_PERMISSIONS: Record<RoleName, string[]> = {
    admin: Object.values(PERMISSIONS),
    pengurus: [
        PERMISSIONS.USERS_READ,
        PERMISSIONS.DEPARTEMEN_READ,
        PERMISSIONS.KEPENGURUSAN_READ,
        PERMISSIONS.KEGIATAN_READ,
        PERMISSIONS.KEGIATAN_CREATE,
        PERMISSIONS.KEGIATAN_UPDATE,
        PERMISSIONS.ABSENSI_READ,
        PERMISSIONS.ABSENSI_CREATE,
        PERMISSIONS.ABSENSI_UPDATE,
        PERMISSIONS.ARSIP_READ,
        PERMISSIONS.ARSIP_CREATE,
        PERMISSIONS.ARSIP_UPDATE,
    ],
    bendahara: [
        PERMISSIONS.USERS_READ,
        PERMISSIONS.DEPARTEMEN_READ,
        PERMISSIONS.KEGIATAN_READ,
        PERMISSIONS.KAS_READ,
        PERMISSIONS.KAS_CREATE,
        PERMISSIONS.KAS_UPDATE,
        PERMISSIONS.ARSIP_READ,
        PERMISSIONS.ARSIP_CREATE,
    ],
    anggota: [
        PERMISSIONS.DEPARTEMEN_READ,
        PERMISSIONS.KEGIATAN_READ,
        PERMISSIONS.ABSENSI_CREATE,
        PERMISSIONS.ARSIP_READ,
    ],
};
