import { getStandeeByCode, getAllStandees } from "@/lib/supabase/admin";
import { StandeeStudio } from "@/components/StandeeStudio";
import { Metadata } from "next";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Standee & QR Customizer Studio | Operations Control",
  description: "Custom-build and design print-ready standees and branded QR codes for shops.",
};

interface StudioPageProps {
  searchParams: {
    code?: string;
  };
}

export default async function AdminStudioPage({ searchParams }: StudioPageProps) {
  const code = searchParams.code?.toUpperCase();
  let standee = code ? await getStandeeByCode(code) : null;
  if (!standee) {
    const all = await getAllStandees();
    standee = all.find((s) => s.serial_code === "ST-101") || all[0] || null;
  }
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.URL || "";

  return <StandeeStudio initialStandee={standee} appBaseUrl={baseUrl} />;
}
