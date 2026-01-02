import { Response } from 'express';
import { db } from '../config/database.js';
import { users, roles } from '../db/schema/index.js';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { hashPassword, comparePassword, generateRandomToken } from '../utils/password.js';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt.js';
import {
    successResponse,
    errorResponse,
    unauthorizedResponse,
    badRequestResponse
} from '../utils/response.js';
import { sendPasswordResetEmail } from '../services/mail.service.js';
import { AuthRequest } from '../types/index.js';
import { z } from 'zod';

// Validation schemas
export const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email format'),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// Controllers
export async function login(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { email, password } = req.body;

        // Find user with role
        const [user] = await db
            .select({
                id: users.id,
                email: users.email,
                password: users.password,
                name: users.name,
                roleId: users.roleId,
                isActive: users.isActive,
                deletedAt: users.deletedAt,
                roleName: roles.name,
            })
            .from(users)
            .leftJoin(roles, eq(users.roleId, roles.id))
            .where(eq(users.email, email.toLowerCase()))
            .limit(1);

        if (!user) {
            unauthorizedResponse(res, 'Invalid email or password');
            return;
        }

        if (user.deletedAt) {
            unauthorizedResponse(res, 'Account has been deleted');
            return;
        }

        if (!user.isActive) {
            unauthorizedResponse(res, 'Account is inactive');
            return;
        }

        // Verify password
        const isValidPassword = await comparePassword(password, user.password);
        if (!isValidPassword) {
            unauthorizedResponse(res, 'Invalid email or password');
            return;
        }

        // Generate tokens
        const tokens = generateTokenPair({
            userId: user.id,
            email: user.email,
            roleId: user.roleId || undefined,
            roleName: user.roleName || undefined,
        });

        // Save refresh token
        await db
            .update(users)
            .set({ refreshToken: tokens.refreshToken, updatedAt: new Date() })
            .where(eq(users.id, user.id));

        successResponse(res, {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.roleName || 'anggota',
            },
            ...tokens,
        }, 'Login successful');
    } catch (error) {
        console.error('Login error:', error);
        errorResponse(res, 'Login failed');
    }
}

export async function refreshToken(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { refreshToken: token } = req.body;

        // Verify refresh token
        const payload = verifyRefreshToken(token);
        if (!payload) {
            unauthorizedResponse(res, 'Invalid refresh token');
            return;
        }

        // Find user and verify refresh token matches
        const [user] = await db
            .select({
                id: users.id,
                email: users.email,
                name: users.name,
                roleId: users.roleId,
                isActive: users.isActive,
                refreshToken: users.refreshToken,
                roleName: roles.name,
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

        if (!user || user.refreshToken !== token) {
            unauthorizedResponse(res, 'Invalid refresh token');
            return;
        }

        if (!user.isActive) {
            unauthorizedResponse(res, 'Account is inactive');
            return;
        }

        // Generate new tokens
        const tokens = generateTokenPair({
            userId: user.id,
            email: user.email,
            roleId: user.roleId || undefined,
            roleName: user.roleName || undefined,
        });

        // Save new refresh token
        await db
            .update(users)
            .set({ refreshToken: tokens.refreshToken, updatedAt: new Date() })
            .where(eq(users.id, user.id));

        successResponse(res, tokens, 'Token refreshed successfully');
    } catch (error) {
        console.error('Refresh token error:', error);
        errorResponse(res, 'Token refresh failed');
    }
}

export async function forgotPassword(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { email } = req.body;

        // Find user
        const [user] = await db
            .select({ id: users.id, name: users.name, email: users.email })
            .from(users)
            .where(
                and(
                    eq(users.email, email.toLowerCase()),
                    isNull(users.deletedAt)
                )
            )
            .limit(1);

        // Always return success to prevent email enumeration
        if (!user) {
            successResponse(res, null, 'If the email exists, a reset link will be sent');
            return;
        }

        // Generate reset token
        const resetToken = generateRandomToken(64);
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Save reset token
        await db
            .update(users)
            .set({
                resetToken,
                resetTokenExpiry,
                updatedAt: new Date()
            })
            .where(eq(users.id, user.id));

        // Send email
        await sendPasswordResetEmail(user.email, resetToken, user.name);

        successResponse(res, null, 'If the email exists, a reset link will be sent');
    } catch (error) {
        console.error('Forgot password error:', error);
        errorResponse(res, 'Failed to process request');
    }
}

export async function resetPassword(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { token, password } = req.body;

        // Find user with valid reset token
        const [user] = await db
            .select({ id: users.id })
            .from(users)
            .where(
                and(
                    eq(users.resetToken, token),
                    gt(users.resetTokenExpiry, new Date()),
                    isNull(users.deletedAt)
                )
            )
            .limit(1);

        if (!user) {
            badRequestResponse(res, 'Invalid or expired reset token');
            return;
        }

        // Hash new password
        const hashedPassword = await hashPassword(password);

        // Update password and clear reset token
        await db
            .update(users)
            .set({
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
                refreshToken: null, // Invalidate all sessions
                updatedAt: new Date()
            })
            .where(eq(users.id, user.id));

        successResponse(res, null, 'Password reset successfully');
    } catch (error) {
        console.error('Reset password error:', error);
        errorResponse(res, 'Failed to reset password');
    }
}

export async function changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user!.id;

        // Get current password hash
        const [user] = await db
            .select({ id: users.id, password: users.password })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!user) {
            errorResponse(res, 'User not found', 404);
            return;
        }

        // Verify current password
        const isValidPassword = await comparePassword(currentPassword, user.password);
        if (!isValidPassword) {
            badRequestResponse(res, 'Current password is incorrect');
            return;
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Update password
        await db
            .update(users)
            .set({
                password: hashedPassword,
                refreshToken: null, // Invalidate all sessions
                updatedAt: new Date()
            })
            .where(eq(users.id, userId));

        successResponse(res, null, 'Password changed successfully');
    } catch (error) {
        console.error('Change password error:', error);
        errorResponse(res, 'Failed to change password');
    }
}

export async function logout(req: AuthRequest, res: Response): Promise<void> {
    try {
        const userId = req.user!.id;

        // Clear refresh token
        await db
            .update(users)
            .set({ refreshToken: null, updatedAt: new Date() })
            .where(eq(users.id, userId));

        successResponse(res, null, 'Logged out successfully');
    } catch (error) {
        console.error('Logout error:', error);
        errorResponse(res, 'Logout failed');
    }
}

export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
        const userId = req.user!.id;

        const [user] = await db
            .select({
                id: users.id,
                email: users.email,
                name: users.name,
                nim: users.nim,
                phone: users.phone,
                avatar: users.avatar,
                roleId: users.roleId,
                departemenId: users.departemenId,
                isActive: users.isActive,
                createdAt: users.createdAt,
                roleName: roles.name,
            })
            .from(users)
            .leftJoin(roles, eq(users.roleId, roles.id))
            .where(eq(users.id, userId))
            .limit(1);

        if (!user) {
            errorResponse(res, 'User not found', 404);
            return;
        }

        successResponse(res, user, 'Profile retrieved successfully');
    } catch (error) {
        console.error('Get profile error:', error);
        errorResponse(res, 'Failed to get profile');
    }
}
