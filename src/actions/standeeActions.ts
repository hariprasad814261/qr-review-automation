"use server";

import { revalidatePath } from "next/cache";
import { 
  getStandeeByCode, 
  upsertStandeeRecord, 
  getAllStandees, 
  incrementScanCount,
  deleteStandeeRecord,
  duplicateShopRecord
} from "@/lib/supabase/admin";
import { 
  ActivationSchema, 
  UpdateStandeeSchema, 
  normalizeWhatsAppNumber,
  resolveToDirectGoogleReviewUrl 
} from "@/lib/validations";
import { 
  ActionResponse, 
  ActivateStandeeInput, 
  Standee, 
  UpdateStandeeInput,
  SaveShopDesignInput 
} from "@/types/database";

const MASTER_PIN = process.env.ADMIN_MASTER_PIN || "8824";


/**
 * Real-time verification of the Field Master PIN
 */
export async function verifyMasterPin(pin: string): Promise<ActionResponse<{ valid: boolean }>> {
  if (!pin || pin.trim() !== MASTER_PIN.trim()) {
    return {
      success: false,
      error: "Invalid Master PIN. Access denied.",
      data: { valid: false }
    };
  }

  return {
    success: true,
    message: "Master PIN authenticated successfully.",
    data: { valid: true }
  };
}

/**
 * On-site Field Activation Action
 */
export async function activateStandeeAction(
  rawInput: ActivateStandeeInput
): Promise<ActionResponse<Standee>> {
  try {
    const parsed = ActivationSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message || "Validation failed.",
      };
    }

    const { serial_code, pin, business_name, google_review_url, whatsapp_number } = parsed.data;

    // Verify PIN
    if (pin.trim() !== MASTER_PIN.trim()) {
      return {
        success: false,
        error: "Incorrect Master PIN. Standee activation locked.",
      };
    }

    const cleanWhatsApp = normalizeWhatsAppNumber(whatsapp_number);
    const directReviewUrl = await resolveToDirectGoogleReviewUrl(google_review_url);

    const updatedStandee = await upsertStandeeRecord({
      serial_code,
      business_name: business_name.trim(),
      google_review_url: directReviewUrl,
      whatsapp_number: cleanWhatsApp,
      is_active: true,
    });

    revalidatePath(`/s/${serial_code}`);
    revalidatePath("/admin/batch");

    return {
      success: true,
      message: `Standee #${serial_code} successfully activated for ${business_name}!`,
      data: updatedStandee,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown activation error";
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Discreet in-place link and business updater
 */
export async function updateStandeeAction(
  rawInput: UpdateStandeeInput
): Promise<ActionResponse<Standee>> {
  try {
    const parsed = UpdateStandeeSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message || "Validation failed.",
      };
    }

    const { serial_code, pin, business_name, google_review_url, whatsapp_number } = parsed.data;

    if (pin.trim() !== MASTER_PIN.trim()) {
      return {
        success: false,
        error: "Incorrect Master PIN. Standee update locked.",
      };
    }

    const existing = await getStandeeByCode(serial_code);
    if (!existing) {
      return {
        success: false,
        error: `Standee #${serial_code} does not exist in inventory.`,
      };
    }

    const updatePayload: Partial<Standee> & { serial_code: string } = {
      serial_code,
    };

    if (business_name) updatePayload.business_name = business_name.trim();
    if (google_review_url) {
      updatePayload.google_review_url = await resolveToDirectGoogleReviewUrl(google_review_url);
    }
    if (whatsapp_number) updatePayload.whatsapp_number = normalizeWhatsAppNumber(whatsapp_number);

    const updatedStandee = await upsertStandeeRecord(updatePayload);

    revalidatePath(`/s/${serial_code}`);
    revalidatePath("/admin/batch");

    return {
      success: true,
      message: `Standee #${serial_code} updated successfully!`,
      data: updatedStandee,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Update failed";
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Reset an active standee back to unlinked state
 */
export async function resetStandeeAction(
  serial_code: string,
  pin: string
): Promise<ActionResponse<Standee>> {
  if (pin.trim() !== MASTER_PIN.trim()) {
    return {
      success: false,
      error: "Master PIN required to reset standee.",
    };
  }

  const updatedStandee = await upsertStandeeRecord({
    serial_code,
    business_name: null,
    google_review_url: null,
    whatsapp_number: null,
    is_active: false,
  });

  revalidatePath(`/s/${serial_code}`);
  revalidatePath("/admin/batch");

  return {
    success: true,
    message: `Standee #${serial_code} has been reset to unlinked state.`,
    data: updatedStandee,
  };
}

/**
 * Record a scan event asynchronously
 */
export async function recordScanAction(serial_code: string): Promise<void> {
  await incrementScanCount(serial_code);
}

/**
 * Save custom shop design & branding from Studio
 */
export async function saveShopDesignAction(
  input: SaveShopDesignInput
): Promise<ActionResponse<Standee>> {
  try {
    if (!input.serial_code || !input.serial_code.trim()) {
      return {
        success: false,
        error: "Serial code is required.",
      };
    }

    if (!input.business_name || !input.business_name.trim()) {
      return {
        success: false,
        error: "Business name is required.",
      };
    }

    const cleanCode = input.serial_code.trim().toUpperCase();
    const cleanWhatsApp = input.whatsapp_number ? normalizeWhatsAppNumber(input.whatsapp_number) : null;
    const directReviewUrl = input.google_review_url ? await resolveToDirectGoogleReviewUrl(input.google_review_url) : null;

    const recordToSave: Partial<Standee> & { serial_code: string } = {
      serial_code: cleanCode,
      business_name: input.business_name.trim(),
      google_review_url: directReviewUrl,
      whatsapp_number: cleanWhatsApp,
      is_active: input.is_active !== undefined ? input.is_active : true,
      logo_url: input.logo_url || null,
      theme: input.theme || "luxury-dark",
      primary_color: input.primary_color || "#F59E0B",
      accent_color: input.accent_color || "#D97706",
      background_color: input.background_color || "#0F172A",
      headline: input.headline || "Rate Your Experience",
      subheadline: input.subheadline || "Point your camera to scan • Rate in 5 seconds",
      cta_text: input.cta_text || "Review us on Google",
      qr_target_mode: input.qr_target_mode || "direct_google",
      custom_qr_url: input.custom_qr_url ? input.custom_qr_url.trim() : null,
      qr_style: {
        dot_color: input.primary_color || "#000000",
        corner_color: input.primary_color || "#000000",
        center_logo: Boolean(input.logo_url),
      }
    };

    const saved = await upsertStandeeRecord(recordToSave);


    revalidatePath(`/s/${cleanCode}`);
    revalidatePath("/admin/batch");
    revalidatePath("/admin/studio");

    return {
      success: true,
      message: `Shop '${input.business_name}' design saved successfully!`,
      data: saved,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to save shop design";
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Delete a shop standee record
 */
export async function deleteShopAction(
  serial_code: string
): Promise<ActionResponse<{ deleted: boolean }>> {
  try {
    const success = await deleteStandeeRecord(serial_code.trim().toUpperCase());
    revalidatePath("/admin/batch");
    revalidatePath("/admin/studio");
    return {
      success,
      message: success ? `Shop #${serial_code} deleted successfully.` : "Shop not found.",
      data: { deleted: success }
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Delete failed",
    };
  }
}

/**
 * Duplicate a shop profile with a new serial code
 */
export async function duplicateShopAction(
  source_code: string,
  new_code: string
): Promise<ActionResponse<Standee>> {
  try {
    const cloned = await duplicateShopRecord(
      source_code.trim().toUpperCase(),
      new_code.trim().toUpperCase()
    );
    if (!cloned) {
      return {
        success: false,
        error: `Source shop #${source_code} not found.`,
      };
    }
    revalidatePath("/admin/batch");
    return {
      success: true,
      message: `Cloned into #${cloned.serial_code} successfully!`,
      data: cloned,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Duplicate failed",
    };
  }
}

