"use client";

import React, { useState, useEffect } from "react";
import { Standee } from "@/types/database";
import { CustomerRatingView } from "./CustomerRatingView";
import { AdminActivationForm } from "./AdminActivationForm";
import { formatDirectGoogleReviewUrl } from "@/lib/validations";

interface StandeeResolverClientProps {
  code: string;
  initialStandee?: Standee | null;
}

export function StandeeResolverClient({ code, initialStandee }: StandeeResolverClientProps) {
  const [standee, setStandee] = useState<Standee | null>(initialStandee || null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("qr_custom_standees_v1");
        if (raw) {
          const map = JSON.parse(raw);
          const local = map[code.toUpperCase()];
          if (local && local.is_active) {
            setStandee((prev) => ({ ...(prev || {}), ...local }));
          }
        }
      } catch (e) {
        console.warn("Client resolver hydration warning:", e);
      }
    }
  }, [code]);

  // If active and target mode is direct redirect, handle it
  useEffect(() => {
    if (standee && standee.is_active) {
      if (standee.qr_target_mode === "direct_google" && standee.google_review_url) {
        const directUrl = formatDirectGoogleReviewUrl(standee.google_review_url);
        if (directUrl.startsWith("http://") || directUrl.startsWith("https://")) {
          window.location.href = directUrl;
        }
      } else if (standee.qr_target_mode === "direct_whatsapp" && standee.whatsapp_number) {
        const clean = standee.whatsapp_number.replace(/[^0-9]/g, "");
        if (clean) {
          window.location.href = `https://wa.me/${clean}`;
        }
      } else if (standee.qr_target_mode === "custom_url" && standee.custom_qr_url) {
        const target = standee.custom_qr_url.trim();
        if (target.startsWith("http://") || target.startsWith("https://")) {
          window.location.href = target;
        }
      }
    }
  }, [standee]);

  // If active, show 5-Star Rating Router View
  if (standee && standee.is_active) {
    return <CustomerRatingView standee={standee} />;
  }

  // Otherwise, render Field Activation Form
  return (
    <AdminActivationForm
      code={code}
      initialData={standee}
      onActivated={(activatedStandee) => setStandee(activatedStandee)}
    />
  );
}
