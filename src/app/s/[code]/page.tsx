import { getStandeeByCode, incrementScanCount } from "@/lib/supabase/admin";
import { CustomerRatingView } from "@/components/CustomerRatingView";
import { AdminActivationForm } from "@/components/AdminActivationForm";
import { Metadata } from "next";

interface PageProps {
  params: {
    code: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const code = params.code?.toUpperCase();
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

  // Routing Decision:
  // If standee does NOT exist OR is_active === false -> Render AdminActivationForm
  if (!standee || !standee.is_active) {
    return <AdminActivationForm code={serialCode} />;
  }

  // If standee is configured for direct target modes, redirect immediately
  if (standee.qr_target_mode === "direct_google" && standee.google_review_url) {
    const { formatDirectGoogleReviewUrl } = await import("@/lib/validations");
    const target = formatDirectGoogleReviewUrl(standee.google_review_url.trim());
    if (target.startsWith("http://") || target.startsWith("https://")) {
      const { redirect } = await import("next/navigation");
      redirect(target);
    }
  }

  if (standee.qr_target_mode === "direct_whatsapp" && standee.whatsapp_number) {
    const clean = standee.whatsapp_number.replace(/[^0-9]/g, "");
    if (clean) {
      const { redirect } = await import("next/navigation");
      redirect(`https://wa.me/${clean}`);
    }
  }

  if (standee.qr_target_mode === "custom_url" && standee.custom_qr_url) {
    const target = standee.custom_qr_url.trim();
    if (target.startsWith("http://") || target.startsWith("https://")) {
      const { redirect } = await import("next/navigation");
      redirect(target);
    }
  }

  // Ensure standee.google_review_url is direct format for CustomerRatingView
  if (standee.google_review_url) {
    const { formatDirectGoogleReviewUrl } = await import("@/lib/validations");
    standee.google_review_url = formatDirectGoogleReviewUrl(standee.google_review_url);
  }

  // Otherwise (smart_filter mode) -> Render CustomerRatingView
  return <CustomerRatingView standee={standee} />;
}
