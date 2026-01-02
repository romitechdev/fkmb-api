import QRCode from 'qrcode';

export async function generateQRCode(data: string): Promise<string> {
    try {
        const qrCodeDataUrl = await QRCode.toDataURL(data, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff',
            },
        });
        return qrCodeDataUrl;
    } catch (error) {
        throw new Error('Failed to generate QR code');
    }
}

export async function generateQRCodeBuffer(data: string): Promise<Buffer> {
    try {
        return QRCode.toBuffer(data, {
            errorCorrectionLevel: 'M',
            type: 'png',
            width: 300,
            margin: 2,
        });
    } catch (error) {
        throw new Error('Failed to generate QR code buffer');
    }
}
