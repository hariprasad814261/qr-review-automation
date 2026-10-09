import { NextResponse } from "next/server";
import { incrementScanCount } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = (searchParams.get("code") || "").trim().toUpperCase();

    if (code) {
      // Fire and forget scan increment
      incrementScanCount(code).catch((err) => {
        console.warn("Scan increment background warning:", err);
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
