import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Standee } from "@/types/database";
import fs from "fs";
import path from "path";
import os from "os";

const supabaseUrl = 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  process.env.SUPABASE_URL || 
  process.env.STORAGE_URL || 
  process.env.DATABASE_URL || 
  "";

const serviceRoleKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.STORAGE_SERVICE_ROLE_KEY || 
  process.env.DATABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_SECRET_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  process.env.STORAGE_ANON_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  "";

const isLiveSupabase = Boolean(
  supabaseUrl && 
  serviceRoleKey && 
  !supabaseUrl.includes("mock-") && 
  !serviceRoleKey.includes("mock-")
);

export const supabaseAdmin = isLiveSupabase
  ? createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// Clean SVG sample logos as data URIs for demo shops
const BISTRO_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%23F59E0B"><circle cx="50" cy="50" r="46" fill="%23261C14" stroke="%23F59E0B" stroke-width="4"/><path d="M30 40h34c0 14-8 24-17 24s-17-10-17-24zm38 5h6a6 6 0 0 1 0 12h-6V45zM26 70h42v4H26z" fill="%23F59E0B"/><path d="M40 24c-2 4 2 8 0 12M50 24c-2 4 2 8 0 12" stroke="%23F59E0B" stroke-width="2" stroke-linecap="round" fill="none"/></svg>`;

const DENTAL_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23F0FDFA" stroke="%230D9488" stroke-width="4"/><path d="M50 22c-14 0-22 9-22 20 0 13 7 26 12 38 3 5 6 8 10 8s7-3 10-8c5-12 12-25 12-38 0-11-8-20-22-20zm-8 24a6 6 0 1 1 0-12 6 6 0 0 1 0 12zm16 0a6 6 0 1 1 0-12 6 6 0 0 1 0 12z" fill="%230D9488"/></svg>`;

const SALON_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%231E1B4B" stroke="%23FB7185" stroke-width="4"/><path d="M34 26a10 10 0 0 0-10 10c0 5 3 9 7 10l12 28 8-4-11-26a10 10 0 0 0 4-8 10 10 0 0 0-10-10zm32 0a10 10 0 0 1 10 10c0 3-1 6-3 8l-11 26 8 4 12-28c4-1 7-5 7-10a10 10 0 0 0-10-10 10 10 0 0 0-8 4l-5 8-5-8a10 10 0 0 0-8-4z" fill="%23FB7185"/></svg>`;

// Local JSON file persistence for local dev / offline testing
const TMP_DB_PATH = path.join(os.tmpdir(), "qr_inventory_db.json");
let memoryStore: Record<string, Standee> | null = null;

function getInitialDemoStore(): Record<string, Standee> {
  const now = new Date().toISOString();
  return {
    "ST-101": {
      id: "10100000-0000-0000-0000-000000000101",
      serial_code: "ST-101",
      business_name: "The Velvet Bistro & Coffee",
      google_review_url: "https://maps.app.goo.gl/example",
      whatsapp_number: "919876543210",
      is_active: true,
      scan_count: 42,
      last_scanned_at: now,
      created_at: now,
      updated_at: now,
      theme: "warm-hospitality",
      primary_color: "#D97706",
      accent_color: "#F59E0B",
      background_color: "#181411",
      headline: "Loved Your Brew & Bites?",
      subheadline: "Point your camera to rate your experience in 5 seconds",
      cta_text: "Review us on Google",
      logo_url: BISTRO_LOGO,
      qr_style: {
        dot_color: "#78350F",
        corner_color: "#D97706",
        center_logo: true,
      },
    },
    "ST-102": {
      id: "10200000-0000-0000-0000-000000000102",
      serial_code: "ST-102",
      business_name: "Apex Dental & Orthodontics",
      google_review_url: "https://maps.app.goo.gl/dental-example",
      whatsapp_number: "919876543211",
      is_active: true,
      scan_count: 19,
      last_scanned_at: now,
      created_at: now,
      updated_at: now,
      theme: "clean-white",
      primary_color: "#0D9488",
      accent_color: "#14B8A6",
      background_color: "#FFFFFF",
      headline: "How Was Your Smile Visit?",
      subheadline: "Quick feedback helps our clinic care for you even better",
      cta_text: "Leave a 5-Star Review",
      logo_url: DENTAL_LOGO,
      qr_style: {
        dot_color: "#0F766E",
        corner_color: "#0D9488",
        center_logo: true,
      },
    },
    "ST-103": {
      id: "10300000-0000-0000-0000-000000000103",
      serial_code: "ST-103",
      business_name: "Luxe Studio & Day Spa",
      google_review_url: "https://maps.app.goo.gl/salon-example",
      whatsapp_number: "919876543212",
      is_active: true,
      scan_count: 67,
      last_scanned_at: now,
      created_at: now,
      updated_at: now,
      theme: "luxury-dark",
      primary_color: "#E11D48",
      accent_color: "#FB7185",
      background_color: "#0F172A",
      headline: "Loving Your Fresh New Look?",
      subheadline: "Scan to rate your styling session in 5 seconds",
      cta_text: "Rate Your Stylist",
      logo_url: SALON_LOGO,
      qr_style: {
        dot_color: "#BE123C",
        corner_color: "#E11D48",
        center_logo: true,
      },
    },
  };
}

function getLocalStore(): Record<string, Standee> {
  if (memoryStore && Object.keys(memoryStore).length > 0) {
    return memoryStore;
  }
  try {
    if (fs.existsSync(TMP_DB_PATH)) {
      const raw = fs.readFileSync(TMP_DB_PATH, "utf-8");
      const arr: Standee[] = JSON.parse(raw);
      const map: Record<string, Standee> = {};
      for (const item of arr) {
        map[item.serial_code] = item;
      }
      memoryStore = map;
      return map;
    }
  } catch (e) {
    console.warn("Local store read fallback:", e);
  }
  memoryStore = getInitialDemoStore();
  return memoryStore;
}

function saveLocalStore(map: Record<string, Standee>) {
  memoryStore = map;
  try {
    fs.mkdirSync(path.dirname(TMP_DB_PATH), { recursive: true });
    fs.writeFileSync(TMP_DB_PATH, JSON.stringify(Object.values(map), null, 2), "utf-8");
  } catch (err) {
    console.warn("Non-fatal local cache write notice:", err);
  }
}

/**
 * Fetch a standee by serial code
 */
export async function getStandeeByCode(code: string): Promise<Standee | null> {
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from("standees")
        .select("*")
        .eq("serial_code", code)
        .maybeSingle();

      if (!error && data) {
        return data as Standee;
      }
    } catch (e) {
      console.warn("Supabase query fallback:", e);
    }
  }

  // Fallback to local store
  const store = getLocalStore();
  return store[code] || null;
}

/**
 * Atomically increment standee scan counter
 */
export async function incrementScanCount(code: string): Promise<void> {
  if (supabaseAdmin) {
    try {
      await supabaseAdmin.rpc("increment_standee_scan", { p_serial_code: code });
      return;
    } catch (e) {
      console.warn("Supabase RPC increment fallback:", e);
    }
  }

  // Local fallback
  const store = getLocalStore();
  if (store[code]) {
    store[code].scan_count = (store[code].scan_count || 0) + 1;
    store[code].last_scanned_at = new Date().toISOString();
    store[code].updated_at = new Date().toISOString();
    saveLocalStore(store);
  }
}

/**
 * Fetch all standees for admin inventory dashboard
 */
export async function getAllStandees(): Promise<Standee[]> {
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from("standees")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data as Standee[];
      }
    } catch (e) {
      console.warn("Supabase getAllStandees fallback:", e);
    }
  }

  const store = getLocalStore();
  return Object.values(store).sort((a, b) => (b.serial_code > a.serial_code ? 1 : -1));
}

/**
 * Activate or update a standee record
 */
export async function upsertStandeeRecord(record: Partial<Standee> & { serial_code: string }): Promise<Standee> {
  const now = new Date().toISOString();

  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from("standees")
        .upsert(
          {
            ...record,
            updated_at: now,
          },
          { onConflict: "serial_code" }
        )
        .select()
        .single();

      if (!error && data) {
        return data as Standee;
      }
      if (error) {
        console.warn("Supabase upsert error, attempting local store fallback:", error.message);
      }
    } catch (e) {
      console.warn("Supabase upsert exception fallback:", e);
    }
  }

  // Local store update
  const store = getLocalStore();
  const existing = store[record.serial_code] || {
    id: `local-${Date.now()}`,
    serial_code: record.serial_code,
    business_name: null,
    google_review_url: null,
    whatsapp_number: null,
    is_active: false,
    scan_count: 0,
    last_scanned_at: null,
    created_at: now,
    updated_at: now,
  };

  const updated: Standee = {
    ...existing,
    ...record,
    updated_at: now,
  };

  store[record.serial_code] = updated;
  saveLocalStore(store);
  return updated;
}

/**
 * Delete a standee record (Admin only)
 */
export async function deleteStandeeRecord(code: string): Promise<boolean> {
  if (supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin
        .from("standees")
        .delete()
        .eq("serial_code", code);
      if (error) {
        console.warn("Supabase delete error:", error.message);
      }
    } catch (e) {
      console.warn("Supabase delete exception:", e);
    }
  }

  const store = getLocalStore();
  if (store[code]) {
    delete store[code];
    saveLocalStore(store);
    return true;
  }
  return false;
}

/**
 * Duplicate a shop record with a new serial code
 */
export async function duplicateShopRecord(sourceCode: string, newCode: string): Promise<Standee | null> {
  const source = await getStandeeByCode(sourceCode);
  if (!source) return null;

  const duplicate: Standee = {
    ...source,
    id: `local-${Date.now()}`,
    serial_code: newCode,
    business_name: `${source.business_name || "Shop"} (Copy)`,
    scan_count: 0,
    last_scanned_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return await upsertStandeeRecord(duplicate);
}

