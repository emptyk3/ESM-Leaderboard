import QRCode from "qrcode";
import sharp from "sharp";

const qrOptions = {
  width: 1200,
  margin: 4,
  errorCorrectionLevel: "H" as const,
  color: { dark: "#050505", light: "#FFFFFF" },
};

export function registrationQrDataUrlFor(targetUrl: string) {
  return QRCode.toDataURL(targetUrl, qrOptions);
}

export async function registrationQrPngFor(targetUrl: string) {
  const qr = await QRCode.toBuffer(targetUrl, { ...qrOptions, type: "png" });
  const caption = Buffer.from(
    `<svg width="1600" height="1900" xmlns="http://www.w3.org/2000/svg"><rect width="1600" height="1900" fill="#fff"/><text x="800" y="110" text-anchor="middle" font-family="Arial,sans-serif" font-size="54" font-weight="700" fill="#050505">Bei eSports Mostviertel registrieren</text><text x="800" y="185" text-anchor="middle" font-family="Arial,sans-serif" font-size="25" fill="#245F00">QR-Code scannen und Mitgliedskonto anlegen</text></svg>`,
  );
  return sharp(caption)
    .composite([{ input: qr, left: 200, top: 350 }])
    .png()
    .toBuffer();
}
