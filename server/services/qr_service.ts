import QRCode from 'qrcode';

export async function generateQRCodeDataURL(payload: string): Promise<string> {
  try {
    return await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      scale: 8,
      color: {
        dark: '#1e293b',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('[QR Service] Error generating QR code:', err);
    throw err;
  }
}

export async function generateQRCodeSVG(payload: string): Promise<string> {
  try {
    return await QRCode.toString(payload, {
      type: 'svg',
      errorCorrectionLevel: 'H',
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('[QR Service] Error generating SVG QR code:', err);
    throw err;
  }
}
