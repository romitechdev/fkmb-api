import { Response, NextFunction } from 'express';
import { db } from '../config/database.js';
import { users, roles } from '../db/schema/index.js';
import { eq, isNull, and } from 'drizzle-orm';
import { verifyAccessToken } from '../utils/jwt.js';
import { unauthorizedResponse } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';

export async function authMiddleware(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            unauthorizedResponse(res, 'No token provided');
            return;
        }

        const token = authHeader.substring(7);
        const payload = verifyAccessToken(token);

        if (!payload) {
            unauthorizedResponse(res, 'Invalid or expired token');
            return;
        }

        // Get user from database with role
        const [user] = await db
            .select({
                id: users.id,
                email: users.email,
                password: users.password,
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
                refreshToken: users.refreshToken,
                resetToken: users.resetToken,
                resetTokenExpiry: users.resetTokenExpiry,
                deletedAt: users.deletedAt,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
                roleName: roles.name,
                permissions: roles.permissions,
            })
            .from(users)
            .leftJoin(roles, eq(users.roleId, roles.id))
            .where(
                and(
                    eq(users.id, payload.userId),
                    isNull(users.deletedAt)
                )
            )
            .limit(1);

        if (!user) {
            unauthorizedResponse(res, 'User not found');
            return;
        }

        if (!user.isActive) {
            unauthorizedResponse(res, 'User account is inactive');
            return;
        }

        req.user = {
            ...user,
            roleName: user.roleName || undefined,
            permissions: user.permissions || [],
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        unauthorizedResponse(res, 'Authentication failed');
    }
}

// Optional auth - doesn't fail if no token, but sets user if valid
export async function optionalAuthMiddleware(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            next();
            return;
        }

        const token = authHeader.substring(7);
        const payload = verifyAccessToken(token);

        if (!payload) {
            next();
            return;
        }

        const [user] = await db
            .select({
                id: users.id,
                email: users.email,
                password: users.password,
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
                refreshToken: users.refreshToken,
                resetToken: users.resetToken,
                resetTokenExpiry: users.resetTokenExpiry,
                deletedAt: users.deletedAt,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
                roleName: roles.name,
                permissions: roles.permissions,
            })
            .from(users)
            .leftJoin(roles, eq(users.roleId, roles.id))
            .where(
                and(
                    eq(users.id, payload.userId),
                    isNull(users.deletedAt),
                    eq(users.isActive, true)
                )
            )
            .limit(1);

        if (user) {
            req.user = {
                ...user,
                roleName: user.roleName || undefined,
                permissions: user.permissions || [],
            };
        }

        next();
    } catch (error) {
        next();
    }
}
