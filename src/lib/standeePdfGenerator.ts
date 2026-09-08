import { jsPDF } from "jspdf";
import { StandeeTheme } from "@/types/database";

export interface StandeePdfOptions {
  serial_code: string;
  business_name: string;
  theme: StandeeTheme;
  headline?: string;
  subheadline?: string;
  cta_text?: string;
  primary_color?: string;
  accent_color?: string;
  background_color?: string;
  logo_url?: string | null;
  qr_data_url: string; // High-res PNG data URL of the branded QR code
}

type RGB = [number, number, number];

interface ThemePalette {
  bg: RGB;
  cardBg: RGB;
  borderColor: RGB;
  titleColor: RGB;
  subtitleColor: RGB;
  starColor: RGB;
  badgeBg: RGB;
  badgeText: RGB;
  isDark: boolean;
}

function hexToRgb(hex: string, defaultRgb: RGB): RGB {
  try {
    const clean = hex.replace("#", "");
    if (clean.length === 6) {
      const r = parseInt(clean.substring(0, 2), 16);
      const g = parseInt(clean.substring(2, 4), 16);
      const b = parseInt(clean.substring(4, 6), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        return [r, g, b];
      }
    }
  } catch {}
  return defaultRgb;
}

function getThemePalette(theme: StandeeTheme, customPrimary?: string, customBg?: string): ThemePalette {
  const defaultStar: RGB = [245, 158, 11];
  const primaryRgb: RGB = customPrimary ? hexToRgb(customPrimary, defaultStar) : defaultStar;


  switch (theme) {
    case "clean-white":
      return {
        bg: [255, 255, 255],
        cardBg: [255, 255, 255],
        borderColor: [226, 232, 240],
        titleColor: [15, 23, 42],
        subtitleColor: [100, 116, 139],
        starColor: primaryRgb,
        badgeBg: [248, 250, 252],
        badgeText: [51, 65, 85],
        isDark: false,
      };
    case "warm-hospitality":
      return {
        bg: hexToRgb(customBg || "#181411", [24, 20, 17]),
        cardBg: [30, 24, 20],
        borderColor: [68, 54, 44],
        titleColor: [255, 247, 237],
        subtitleColor: [217, 119, 6],
        starColor: primaryRgb,
        badgeBg: [38, 28, 20],
        badgeText: [251, 191, 36],
        isDark: true,
      };
    case "vibrant-gradient":
      return {
        bg: hexToRgb(customBg || "#0F172A", [15, 23, 42]),
        cardBg: [20, 27, 45],
        borderColor: [51, 65, 85],
        titleColor: [255, 255, 255],
        subtitleColor: [148, 163, 184],
        starColor: primaryRgb,
        badgeBg: [30, 41, 59],
        badgeText: primaryRgb,
        isDark: true,
      };
    case "classic-google":
      return {
        bg: [255, 255, 255],
        cardBg: [255, 255, 255],
        borderColor: [218, 220, 224],
        titleColor: [32, 33, 36],
        subtitleColor: [95, 99, 104],
        starColor: [251, 188, 5], // Google Gold
        badgeBg: [241, 243, 244],
        badgeText: [26, 115, 232], // Google Blue
        isDark: false,
      };
    case "luxury-dark":
    default:
      return {
        bg: hexToRgb(customBg || "#0A0E1A", [10, 14, 26]),
        cardBg: [15, 23, 42],
        borderColor: [30, 41, 59],
        titleColor: [255, 255, 255],
        subtitleColor: [148, 163, 184],
        starColor: primaryRgb,
        badgeBg: [15, 23, 42],
        badgeText: primaryRgb,
        isDark: true,
      };
  }
}

/**
 * Draws a 5-pointed vector star on jsPDF canvas
 */
function drawPdfStar(
  doc: jsPDF,
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  fillColor: [number, number, number]
) {
  const points = 5;
  const angleStep = Math.PI / points;
  let startAngle = Math.PI / 2;

  const coords: [number, number][] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const currAngle = startAngle + i * angleStep;
    const x = cx + r * Math.cos(currAngle);
    const y = cy - r * Math.sin(currAngle);
    coords.push([x, y]);
  }

  doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
  doc.setDrawColor(fillColor[0], fillColor[1], fillColor[2]);

  // Render polygon
  const lines: number[][] = [];
  for (let i = 1; i < coords.length; i++) {
    lines.push([coords[i][0] - coords[i - 1][0], coords[i][1] - coords[i - 1][1]]);
  }
  doc.lines(lines, coords[0][0], coords[0][1], [1, 1], "F", true);
}

/**
 * Generates a print-ready 4.0 x 6.0 inch 300 DPI vector PDF document
 */
export async function createStandeePdfDoc(options: StandeePdfOptions): Promise<jsPDF> {
  // Dimensions in points: 4 x 6 inches (1 in = 72 pt)
  const widthPt = 4.0 * 72; // 288 pt
  const heightPt = 6.0 * 72; // 432 pt

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: [widthPt, heightPt],
    compress: true,
  });

  const palette = getThemePalette(options.theme, options.primary_color, options.background_color);

  // 1. Full Page Background
  doc.setFillColor(palette.bg[0], palette.bg[1], palette.bg[2]);
  doc.rect(0, 0, widthPt, heightPt, "F");

  // 2. Acrylic Card Border Guide (0.2 inch inset = 14.4 pt)
  const inset = 14.4;
  const cardW = widthPt - inset * 2;
  const cardH = heightPt - inset * 2;

  doc.setDrawColor(palette.borderColor[0], palette.borderColor[1], palette.borderColor[2]);
  doc.setLineWidth(1.2);
  doc.roundedRect(inset, inset, cardW, cardH, 12, 12, "S");

  // 3. Top Stars (5 Stars)
  const starY = 46;
  const starSpacing = 16;
  const starStartX = widthPt / 2 - 2 * starSpacing;
  for (let i = 0; i < 5; i++) {
    drawPdfStar(doc, starStartX + i * starSpacing, starY, 6.5, 3.0, palette.starColor);
  }

  // 4. Shop Logo (if present)
  let contentStartY = 64;
  if (options.logo_url) {
    try {
      const logoDim = 38;
      const logoX = (widthPt - logoDim) / 2;
      const logoY = contentStartY;
      doc.addImage(options.logo_url, "PNG", logoX, logoY, logoDim, logoDim);
      contentStartY += logoDim + 10;
    } catch (e) {
      console.warn("Could not embed logo in PDF:", e);
      contentStartY += 6;
    }
  } else {
    contentStartY += 10;
  }

  // 5. Business Name
  doc.setTextColor(palette.titleColor[0], palette.titleColor[1], palette.titleColor[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  const bName = options.business_name || "Valued Shop";
  doc.text(bName, widthPt / 2, contentStartY, { align: "center" });

  // 6. Custom Headline
  contentStartY += 18;
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(palette.titleColor[0], palette.titleColor[1], palette.titleColor[2]);
  const headline = options.headline || "RATE YOUR EXPERIENCE";
  doc.text(headline.toUpperCase(), widthPt / 2, contentStartY, { align: "center" });

  // 7. Subtitle / Instruction text
  contentStartY += 14;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(palette.subtitleColor[0], palette.subtitleColor[1], palette.subtitleColor[2]);
  const subheadline = options.subheadline || "Point your camera to scan • Rate in 5 seconds";
  doc.text(subheadline, widthPt / 2, contentStartY, { align: "center" });

  // 8. Center QR Code Container
  const qrDim = 152; // ~2.1 inches
  const qrX = (widthPt - qrDim) / 2;
  const qrY = (heightPt / 2) - (qrDim / 2) + 20;

  // Background card for QR code
  const pad = 8;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(palette.borderColor[0], palette.borderColor[1], palette.borderColor[2]);
  doc.setLineWidth(1.5);
  doc.roundedRect(qrX - pad, qrY - pad, qrDim + pad * 2, qrDim + pad * 2, 10, 10, "FD");

  // Draw QR Image
  if (options.qr_data_url) {
    doc.addImage(options.qr_data_url, "PNG", qrX, qrY, qrDim, qrDim);
  }

  // 9. CTA Text below QR
  const ctaY = qrY + qrDim + pad + 16;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(palette.starColor[0], palette.starColor[1], palette.starColor[2]);
  const cta = options.cta_text || "Leave a 5-Star Review";
  doc.text(cta, widthPt / 2, ctaY, { align: "center" });

  // 10. Serial ID & Verified Badge Pill at bottom
  const badgeW = cardW - 32;
  const badgeH = 22;
  const badgeX = (widthPt - badgeW) / 2;
  const badgeY = heightPt - inset - 30;

  doc.setFillColor(palette.badgeBg[0], palette.badgeBg[1], palette.badgeBg[2]);
  doc.setDrawColor(palette.borderColor[0], palette.borderColor[1], palette.borderColor[2]);
  doc.setLineWidth(0.8);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 6, 6, "FD");

  doc.setFontSize(8);
  doc.setFont("courier", "bold");
  doc.setTextColor(palette.badgeText[0], palette.badgeText[1], palette.badgeText[2]);
  const badgeLabel = `ID: #${options.serial_code}  •  Verified Review Standee`;
  doc.text(badgeLabel, widthPt / 2, badgeY + 14, { align: "center" });

  // 11. Edge printer registration marks
  doc.setFontSize(5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text("4x6 INCH ACRYLIC VERTICAL TENT • 300 DPI DIRECT UV PRINT", widthPt / 2, heightPt - 5, {
    align: "center",
  });

  return doc;
}

/**
 * Generates and triggers browser download of the 4x6 print-ready PDF
 */
export async function downloadStandeePdf(options: StandeePdfOptions) {
  const doc = await createStandeePdfDoc(options);
  const cleanName = (options.business_name || "Shop").toLowerCase().replace(/[^a-z0-9]/g, "_");
  doc.save(`standee_4x6_${options.serial_code}_${cleanName}.pdf`);
}
