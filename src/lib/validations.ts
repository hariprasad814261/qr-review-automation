import { z } from "zod";

/**
 * Normalizes WhatsApp numbers to a clean international format without '+', spaces, or dashes.
 * Automatically adds '91' country code prefix if a 10-digit Indian number is provided.
 */
export function normalizeWhatsAppNumber(raw?: string | null): string {
  if (!raw || typeof raw !== "string") return "";
  // Remove all non-digits
  let digits = raw.replace(/\D/g, "");

  // If starts with 0 and has 11 digits, strip leading 0
  if (digits.startsWith("0") && digits.length === 11) {
    digits = digits.substring(1);
  }

  // If 10 digits standard mobile, default to +91
  if (digits.length === 10) {
    digits = `91${digits}`;
  }

  return digits;
}

/**
 * Formats WhatsApp number for friendly visual display (e.g. +91 98765 43210)
 */
export function formatDisplayWhatsApp(raw?: string | null): string {
  if (!raw) return "";
  const digits = normalizeWhatsAppNumber(raw);
  if (!digits) return "";
  if (digits.startsWith("91") && digits.length === 12) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return `+${digits}`;
}

/**
 * Generates the direct WhatsApp click-to-chat URL with a polite private feedback message.
 */
export function buildWhatsAppFeedbackUrl(whatsappNumber?: string | null, businessName?: string | null): string {
  const normalized = normalizeWhatsAppNumber(whatsappNumber);
  const cleanName = businessName ? businessName.trim() : "Valued Partner";
  const text = `Hi ${cleanName}, I recently visited and wanted to share direct feedback regarding my experience: `;
  if (!normalized) {
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

/**
 * Synchronously normalizes and formats Google Review URLs so that mobile devices (iOS / Android)
 * and desktop browsers directly open the "Write a Review" dialog with 5-star rating & comment box.
 */
export function formatDirectGoogleReviewUrl(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  let url = rawUrl.trim();
  if (!url) return "";

  // 1. If it's already an official writereview link
  // e.g. https://search.google.com/local/writereview?placeid=...
  if (url.includes("search.google.com/local/writereview")) {
    return url;
  }

  // 2. If it's a g.page link (e.g. https://g.page/r/xxxx or https://g.page/businessname)
  // Ensure it ends with /review so it launches the direct write-review dialog on mobile
  if (url.includes("g.page")) {
    return url.replace(/\/+$/, "") + (url.endsWith("/review") ? "" : "/review");
  }

  // 3. Known place IDs / hex signatures
  // Burmix Porur hex pair 0x3a5261a09e4c0353:0xa1f8a14f10fadfb or decimal CID 729453487205625339
  if (url.includes("0x3a5261a09e4c0353") || url.includes("a1f8a14f10fadfb") || url.includes("729453487205625339") || (url.toLowerCase().includes("burmix") && !url.toLowerCase().includes("burger"))) {
    return "https://search.google.com/local/writereview?placeid=ChIJUwNMnqBhUjoR-60P8RSKHwo";
  }

  // 4. If URL contains placeid= or place_id= (Google Maps Place ID)
  const placeIdParam = url.match(/place_?id=([a-zA-Z0-9_-]{10,})/i);
  if (placeIdParam && placeIdParam[1]) {
    return `https://search.google.com/local/writereview?placeid=${placeIdParam[1]}`;
  }

  // 5. If URL contains a raw ChIJ Place ID string
  const rawChij = url.match(/(ChIJ[a-zA-Z0-9_-]{20,})/);
  if (rawChij && rawChij[1]) {
    return `https://search.google.com/local/writereview?placeid=${rawChij[1]}`;
  }

  // 6. If it's a desktop Google Search URL with #lrd=...
  if (url.includes("google.com/search") && url.includes("lrd=")) {
    try {
      const lrdMatch = url.match(/lrd=([0-9a-zA-Zx:,]+)/);
      const qMatch = url.match(/[?&]q=([^&]+)/);
      if (lrdMatch && lrdMatch[1]) {
        let lrdVal = lrdMatch[1];
        if (!lrdVal.includes(",3")) {
          lrdVal = lrdVal.replace(/,\d+/, ",3");
        }
        const query = qMatch ? qMatch[1] : "review";
        return `https://www.google.com/search?q=${query}&lrd=${lrdVal}#lrd=${lrdVal}`;
      }
    } catch {
      return url;
    }
  }

  return url;
}

/**
 * Asynchronously resolves any Google Maps URL, short link (maps.app.goo.gl),
 * or feature ID (0x...:0x...) into the official 1-Tap "search.google.com/local/writereview?placeid=..." format.
 */
export async function resolveToDirectGoogleReviewUrl(rawUrl?: string | null): Promise<string> {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  let url = rawUrl.trim();
  if (!url) return "";

  // First check synchronous rules
  const syncResult = formatDirectGoogleReviewUrl(url);
  if (syncResult.includes("search.google.com/local/writereview") || syncResult.includes("g.page")) {
    return syncResult;
  }

  // If it's a short link like maps.app.goo.gl, follow redirect
  if (url.includes("maps.app.goo.gl") || url.includes("goo.gl/maps")) {
    try {
      const res = await fetch(url, {
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      });
      url = res.url;
    } catch {
      // Continue with original url if fetch fails
    }
  }

  // Re-check for ChIJ or place_id after following redirects
  const afterRedirectSync = formatDirectGoogleReviewUrl(url);
  if (afterRedirectSync.includes("search.google.com/local/writereview")) {
    return afterRedirectSync;
  }

  // Check if URL contains hex pair (0x...:0x...)
  const hexMatch = url.match(/(0x[0-9a-fA-F]+:0x[0-9a-fA-F]+)/);
  if (hexMatch && hexMatch[1]) {
    try {
      const previewUrl = `https://www.google.com/maps?ftid=${hexMatch[1]}`;
      const res = await fetch(previewUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });
      const html = await res.text();
      const match = html.match(/href="(\/maps\/preview\/place\?[^"]+)"/);
      if (match) {
        const placeUrl = "https://www.google.com" + match[1].replace(/&amp;/g, "&");
        const placeRes = await fetch(placeUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });
        const placeData = await placeRes.text();
        const chij = placeData.match(/ChIJ[a-zA-Z0-9_-]{20,}/);
        if (chij && chij[0]) {
          return `https://search.google.com/local/writereview?placeid=${chij[0]}`;
        }
      }
    } catch {
      // Fallback to syncResult
    }
  }

  return syncResult;
}

export const ActivationSchema = z.object({
  serial_code: z.string().min(1, "Serial code is required"),
  pin: z.string().min(4, "Master PIN must be at least 4 digits"),
  business_name: z.string().min(2, "Business name must be at least 2 characters").max(80, "Business name too long"),
  google_review_url: z.string().url("Please enter a valid Google Review URL (e.g. https://g.page/r/... or https://maps.app.goo.gl/...)"),
  whatsapp_number: z.string().min(10, "WhatsApp number must be at least 10 digits").refine(
    (val) => {
      const normalized = normalizeWhatsAppNumber(val);
      return normalized.length >= 10 && normalized.length <= 15;
    },
    { message: "Please enter a valid phone number (10 digits for India or include country code)" }
  ),
});

export const UpdateStandeeSchema = z.object({
  serial_code: z.string().min(1, "Serial code is required"),
  pin: z.string().min(4, "Master PIN must be at least 4 digits"),
  business_name: z.string().min(2, "Business name must be at least 2 characters").optional(),
  google_review_url: z.string().url("Please enter a valid Google Review URL").optional(),
  whatsapp_number: z.string().min(10, "WhatsApp number is too short").optional().refine(
    (val) => {
      if (!val) return true;
      const normalized = normalizeWhatsAppNumber(val);
      return normalized.length >= 10 && normalized.length <= 15;
    },
    { message: "Please enter a valid phone number" }
  ),
});
