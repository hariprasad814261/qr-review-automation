import { getStandeeByCode, incrementScanCount } from "@/lib/supabase/admin";
import { StandeeResolverClient } from "@/components/StandeeResolverClient";
import { Metadata } from "next";

// ISR: Cache statically at the edge, background revalidate at most once every 60s
export const revalidate = 60;
export const dynamicParams = true;

interface PageProps {
  params: {
    code: string;
  };
}

// Pre-render core standees (including Bomix ST-101) at build time for millisecond mobile loads
export async function generateStaticParams() {
  return [
    { code: "ST-101" },
    { code: "ST-102" },
    { code: "ST-103" },
    { code: "ST-104" },
  ];
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

  // Fetch standee from Supabase / in-memory cache
  const standee = await getStandeeByCode(serialCode);

  // Asynchronously increment scan counter for analytics (fire and forget)
  incrementScanCount(serialCode).catch((err) => {
    console.error(`Failed to increment scan for ${serialCode}:`, err);
  });

  return <StandeeResolverClient code={serialCode} initialStandee={standee} />;
}

