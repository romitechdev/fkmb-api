import nodemailer from 'nodemailer';
import { env } from './env.js';

export const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: parseInt(env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
    },
});

export async function testMailConnection() {
    try {
        if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
            console.log('⚠️ SMTP not configured, email features disabled');
            return false;
        }
        await transporter.verify();
        console.log('✅ SMTP connected successfully');
        return true;
    } catch (error) {
        console.error('❌ SMTP connection failed:', error);
        return false;
    }
}
