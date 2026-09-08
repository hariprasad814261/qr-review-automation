import QRCode from "qrcode";

export interface BrandedQrOptions {
  text: string;
  size?: number;
  dotColor?: string;
  bgColor?: string;
  logoUrl?: string | null;
  cornerColor?: string;
}

/**
 * Generates a high-resolution, branded QR code with Level-H error correction
 * and an optional embedded circular/rounded shop logo.
 */
export async function generateBrandedQrDataUrl(options: BrandedQrOptions): Promise<string> {
  const {
    text,
    size = 1200,
    dotColor = "#000000",
    bgColor = "#FFFFFF",
    logoUrl,
  } = options;

  if (typeof window === "undefined") {
    return "";
  }

  // 1. Create off-screen canvas
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not acquire 2D canvas context");
  }

  // 2. Render base QR code with High error correction (30% redundancy)
  await QRCode.toCanvas(canvas, text, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: size,
    color: {
      dark: dotColor,
      light: bgColor,
    },
  });

  // 3. If logoUrl is present, overlay centered logo badge
  if (logoUrl) {
    try {
      const logoImg = await loadImage(logoUrl);
      
      // Target logo dimension: ~22% of total QR size (safe margin for Level H)
      const logoSize = Math.floor(size * 0.22);
      const center = size / 2;
      const x = center - logoSize / 2;
      const y = center - logoSize / 2;
      const padding = Math.floor(logoSize * 0.12);

      // Draw white circular/rounded backing pill to isolate logo from QR dots
      ctx.save();
      ctx.fillStyle = bgColor;
      ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
      ctx.shadowBlur = Math.floor(size * 0.02);
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = Math.floor(size * 0.005);

      const radius = (logoSize + padding * 2) / 2;
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Subtle protective border around badge
      ctx.save();
      ctx.strokeStyle = dotColor;
      ctx.lineWidth = Math.max(2, Math.floor(size * 0.004));
      ctx.beginPath();
      ctx.arc(center, center, radius - 1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Clip circular area and draw logo
      ctx.save();
      ctx.beginPath();
      ctx.arc(center, center, logoSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(logoImg, x, y, logoSize, logoSize);
      ctx.restore();
    } catch (err) {
      console.warn("Could not render logo in QR code overlay:", err);
    }
  }

  return canvas.toDataURL("image/png");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Trigger browser download for a data URL or Blob URL
 */
export function downloadDataUrl(dataUrl: string, filename: string) {
  if (typeof window === "undefined") return;
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
