import { NextResponse } from "next/server";
import { 
  getAllStandees, 
  getStandeeByCode, 
  upsertStandeeRecord, 
  deleteStandeeRecord 
} from "@/lib/supabase/admin";
import { 
  normalizeWhatsAppNumber, 
  resolveToDirectGoogleReviewUrl, 
  formatDirectGoogleReviewUrl 
} from "@/lib/validations";
import { SaveShopDesignInput, Standee } from "@/types/database";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (code) {
      const standee = await getStandeeByCode(code.toUpperCase());
      return NextResponse.json({ success: true, data: standee });
    }

    const all = await getAllStandees();
    return NextResponse.json({ success: true, data: all });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch standees";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: SaveShopDesignInput = await request.json();

    if (!body.serial_code || !body.serial_code.trim()) {
      return NextResponse.json({ success: false, error: "Serial code is required." }, { status: 400 });
    }

    if (!body.business_name || !body.business_name.trim()) {
      return NextResponse.json({ success: false, error: "Business name is required." }, { status: 400 });
    }

    const cleanCode = body.serial_code.trim().toUpperCase();
    const oldCode = body.original_serial_code ? body.original_serial_code.trim().toUpperCase() : cleanCode;
    const cleanWhatsApp = body.whatsapp_number ? normalizeWhatsAppNumber(body.whatsapp_number) : null;
    
    // If customer code was renamed/edited, migrate from old code
    if (oldCode && oldCode !== cleanCode) {
      try {
        await deleteStandeeRecord(oldCode);
      } catch (e) {
        console.warn("Notice: Old standee migration cleanup:", e);
      }
    }

    // Safely resolve review URL
    let directReviewUrl: string | null = null;
    if (body.google_review_url && body.google_review_url.trim()) {
      try {
        directReviewUrl = await resolveToDirectGoogleReviewUrl(body.google_review_url.trim());
      } catch {
        directReviewUrl = formatDirectGoogleReviewUrl(body.google_review_url.trim());
      }
    }

    const recordToSave: Partial<Standee> & { serial_code: string } = {
      serial_code: cleanCode,
      business_name: body.business_name.trim(),
      google_review_url: directReviewUrl,
      whatsapp_number: cleanWhatsApp,
      is_active: body.is_active !== undefined ? body.is_active : true,
      logo_url: body.logo_url || null,
      theme: body.theme || "luxury-dark",
      primary_color: body.primary_color || "#F59E0B",
      accent_color: body.accent_color || "#D97706",
      background_color: body.background_color || "#0F172A",
      headline: body.headline || "Rate Your Experience",
      subheadline: body.subheadline || "Point your camera to scan • Rate in 5 seconds",
      cta_text: body.cta_text || "Review us on Google",
      qr_target_mode: body.qr_target_mode || "direct_google",
      custom_qr_url: body.custom_qr_url ? body.custom_qr_url.trim() : null,
      qr_style: {
        dot_color: body.primary_color || "#000000",
        corner_color: body.primary_color || "#000000",
        center_logo: Boolean(body.logo_url),
      }
    };

    const saved = await upsertStandeeRecord(recordToSave);

    return NextResponse.json({
      success: true,
      message: `Shop '${body.business_name}' (#${cleanCode}) saved successfully!`,
      data: saved,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save shop design";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    if (!code) {
      return NextResponse.json({ success: false, error: "Serial code required." }, { status: 400 });
    }
    const deleted = await deleteStandeeRecord(code.toUpperCase());
    return NextResponse.json({ success: deleted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Delete error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
