import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { JwtPayload } from '../types/index.js';

export function generateAccessToken(payload: Omit<JwtPayload, 'type'>): string {
    return jwt.sign(
        { ...payload, type: 'access' },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
    );
}

export function generateRefreshToken(payload: Omit<JwtPayload, 'type'>): string {
    return jwt.sign(
        { ...payload, type: 'refresh' },
        env.JWT_REFRESH_SECRET,
        { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions
    );
}

export function verifyAccessToken(token: string): JwtPayload | null {
    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
        if (decoded.type !== 'access') {
            return null;
        }
        return decoded;
    } catch {
        return null;
    }
}

export function verifyRefreshToken(token: string): JwtPayload | null {
    try {
        const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
        if (decoded.type !== 'refresh') {
            return null;
        }
        return decoded;
    } catch {
        return null;
    }
}

export function generateTokenPair(payload: Omit<JwtPayload, 'type'>): {
    accessToken: string;
    refreshToken: string;
} {
    return {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
    };
}
