import { Response, NextFunction } from 'express';
import { forbiddenResponse } from '../utils/response.js';
import { AuthRequest, RoleName, ROLE_PERMISSIONS } from '../types/index.js';

// Check if user has required role(s)
export function requireRole(...allowedRoles: RoleName[]) {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            forbiddenResponse(res, 'Authentication required');
            return;
        }

        const userRole = req.user.roleName as RoleName | undefined;

        // Admin has access to everything
        if (userRole === 'admin') {
            next();
            return;
        }

        if (!userRole || !allowedRoles.includes(userRole)) {
            forbiddenResponse(res, 'Insufficient permissions');
            return;
        }

        next();
    };
}

// Check if user has required permission(s)
export function requirePermission(...requiredPermissions: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            forbiddenResponse(res, 'Authentication required');
            return;
        }

        const userRole = req.user.roleName as RoleName | undefined;

        // Admin has all permissions
        if (userRole === 'admin') {
            next();
            return;
        }

        const userPermissions = req.user.permissions || [];
        const rolePermissions = userRole ? ROLE_PERMISSIONS[userRole] || [] : [];
        const allPermissions = [...new Set([...userPermissions, ...rolePermissions])];

        const hasAllPermissions = requiredPermissions.every(
            (permission) => allPermissions.includes(permission)
        );

        if (!hasAllPermissions) {
            forbiddenResponse(res, 'Insufficient permissions');
            return;
        }

        next();
    };
}

// Check if user is accessing their own resource or has admin role
export function requireSelfOrRole(...allowedRoles: RoleName[]) {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            forbiddenResponse(res, 'Authentication required');
            return;
        }

        const userRole = req.user.roleName as RoleName | undefined;
        const resourceUserId = req.params.id || req.params.userId;

        // Admin has access to everything
        if (userRole === 'admin') {
            next();
            return;
        }

        // Check if accessing own resource
        if (resourceUserId && req.user.id === resourceUserId) {
            next();
            return;
        }

        // Check if user has allowed role
        if (userRole && allowedRoles.includes(userRole)) {
            next();
            return;
        }

        forbiddenResponse(res, 'Insufficient permissions');
    };
}

// Shortcut for admin only routes
export function adminOnly(req: AuthRequest, res: Response, next: NextFunction): void {
    if (!req.user) {
        forbiddenResponse(res, 'Authentication required');
        return;
    }

    if (req.user.roleName !== 'admin') {
        forbiddenResponse(res, 'Admin access required');
        return;
    }

    next();
}
