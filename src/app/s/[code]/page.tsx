import { getStandeeByCode, incrementScanCount } from "@/lib/supabase/admin";
import { StandeeResolverClient } from "@/components/StandeeResolverClient";
import { Metadata } from "next";

export const revalidate = 0;

interface PageProps {
  params: {
    code: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const code = (params.code || "").toUpperCase();
  const standee = await getStandeeByCode(code);

  if (standee?.is_active && standee.business_name) {
    return {
      title: `Rate ${standee.business_name} | Smart Review`,
      description: `Leave quick feedback for ${standee.business_name}`,
    };
  }

  return {
    title: `Activate Standee #${code} | Smart Review`,
    description: "Plug-and-play smart review standee field activation.",
  };
}

export default async function StandeeResolverPage({ params }: PageProps) {
  const serialCode = (params.code || "").toUpperCase();

  // Fetch standee from Supabase / Database
  const standee = await getStandeeByCode(serialCode);

  // Asynchronously increment scan counter for analytics (fire and forget)
  incrementScanCount(serialCode).catch((err) => {
    console.error(`Failed to increment scan for ${serialCode}:`, err);
  });

  return <StandeeResolverClient code={serialCode} initialStandee={standee} />;
}
