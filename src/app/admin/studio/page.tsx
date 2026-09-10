import { getStandeeByCode, getAllStandees } from "@/lib/supabase/admin";
import { StandeeStudio } from "@/components/StandeeStudio";
import { Standee } from "@/types/database";
import { Metadata } from "next";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Standee & QR Customizer Studio | Operations Control",
  description: "Custom-build and design print-ready standees and branded QR codes for shops.",
};

interface StudioPageProps {
  searchParams: {
    code?: string;
    new?: string;
  };
}

export default async function AdminStudioPage({ searchParams }: StudioPageProps) {
  try {
    const code = searchParams?.code?.toUpperCase();
    const isNew = searchParams?.new === "true";
    let all: Standee[] = [];
    try {
      all = await getAllStandees();
    } catch (e) {
      console.warn("Failed to get standees in studio page:", e);
    }

    let standee: Standee | null = null;

    if (code && !isNew) {
      try {
        standee = await getStandeeByCode(code);
      } catch (e) {
        console.warn("Failed to get standee by code:", e);
      }
    }

    if (!standee) {
      // Generate next sequential code ST-101, ST-102, ST-103, ST-104...
      const numbers = (all || [])
        .map((s) => {
          const match = s?.serial_code?.match(/ST-(\d+)/i);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter((n) => !isNaN(n) && n > 0);
      const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : 104;
      const nextCode = `ST-${nextNum}`;

      standee = {
        id: `new-${Date.now()}`,
        serial_code: isNew || !code ? nextCode : code,
        business_name: "",
        google_review_url: "",
        whatsapp_number: "",
        is_active: true,
        scan_count: 0,
        last_scanned_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        theme: "luxury-dark",
        primary_color: "#F59E0B",
        accent_color: "#D97706",
        background_color: "#0A0E1A",
        headline: "Rate Your Experience",
        subheadline: "Point your camera to scan • Rate in 5 seconds",
        cta_text: "Review us on Google",
        logo_url: null,
        qr_target_mode: "direct_google",
      };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.URL || "";
    const componentKey = isNew ? `new-${Date.now()}` : (standee?.serial_code || code || "studio-root");

    return <StandeeStudio key={componentKey} initialStandee={standee} appBaseUrl={baseUrl} />;
  } catch (err) {
    console.error("Critical Studio page render error:", err);
    // Return empty studio with fallback rather than crashing
    return <StandeeStudio key="fallback-studio" appBaseUrl="" />;
  }
}
