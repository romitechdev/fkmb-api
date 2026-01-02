import { transporter } from '../config/mail.js';
import { env } from '../config/env.js';

interface SendMailOptions {
    to: string;
    subject: string;
    html: string;
}

export async function sendMail(options: SendMailOptions): Promise<boolean> {
    try {
        if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
            console.log('SMTP not configured, skipping email send');
            return false;
        }

        await transporter.sendMail({
            from: env.SMTP_FROM || env.SMTP_USER,
            to: options.to,
            subject: options.subject,
            html: options.html,
        });

        return true;
    } catch (error) {
        console.error('Failed to send email:', error);
        return false;
    }
}

export async function sendPasswordResetEmail(
    email: string,
    resetToken: string,
    userName: string
): Promise<boolean> {
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>FKMB UNESA</h1>
        </div>
        <div class="content">
          <h2>Reset Password</h2>
          <p>Halo ${userName},</p>
          <p>Kami menerima permintaan untuk reset password akun Anda. Klik tombol di bawah ini untuk melanjutkan:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
          <p>Link ini akan kadaluarsa dalam 1 jam.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} FKMB UNESA. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    return sendMail({
        to: email,
        subject: 'Reset Password - FKMB UNESA',
        html,
    });
}

export async function sendWelcomeEmail(
    email: string,
    userName: string,
    temporaryPassword: string
): Promise<boolean> {
    const loginUrl = `${env.FRONTEND_URL}/login`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .credentials { background: #e5e7eb; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Selamat Datang di FKMB UNESA</h1>
        </div>
        <div class="content">
          <h2>Halo ${userName}!</h2>
          <p>Akun Anda telah dibuat di Sistem Informasi FKMB UNESA.</p>
          <div class="credentials">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password Sementara:</strong> ${temporaryPassword}</p>
          </div>
          <p>Silakan login dan segera ganti password Anda.</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" class="button">Login Sekarang</a>
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} FKMB UNESA. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    return sendMail({
        to: email,
        subject: 'Selamat Datang di FKMB UNESA',
        html,
    });
}
