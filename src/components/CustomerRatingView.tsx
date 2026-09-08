"use client";

import React, { useState, useRef, useEffect } from "react";
import { Standee } from "@/types/database";
import { buildWhatsAppFeedbackUrl, formatDirectGoogleReviewUrl } from "@/lib/validations";
import { verifyMasterPin } from "@/actions/standeeActions";
import { EditStandeeModal } from "./EditStandeeModal";
import { Star, ShieldCheck, Loader2, Sparkles, Lock, ExternalLink } from "lucide-react";

interface CustomerRatingViewProps {
  standee: Standee;
}

export function CustomerRatingView({ standee: initialStandee }: CustomerRatingViewProps) {
  const [standee, setStandee] = useState<Standee>(initialStandee);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [redirectState, setRedirectState] = useState<{
    target: "google" | "whatsapp" | null;
    message: string;
  }>({ target: null, message: "" });

  // Long press for field edit (4 seconds)
  const [longPressProgress, setLongPressProgress] = useState(0);
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [authenticatedPin, setAuthenticatedPin] = useState("");

  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const businessName = standee.business_name || "Valued Business Partner";
  const googleReviewUrl = standee.google_review_url || "https://google.com";
  const whatsappNumber = standee.whatsapp_number || "919876543210";
  const brandColor = standee.primary_color || "#F59E0B";
  const headline = standee.headline || "Rate Your Experience";
  const subheadline = standee.subheadline || "How was your overall experience today? Tap to share quick feedback.";

  // Handle star click and routing
  const handleStarClick = (rating: number) => {
    if (selectedRating !== null) return; // Prevent double taps
    setSelectedRating(rating);

    // Haptic feedback if supported on mobile
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(25);
      } catch {}
    }

    if (rating >= 4) {
      // 4 or 5 stars -> Google Reviews
      const directGoogleUrl = formatDirectGoogleReviewUrl(googleReviewUrl);
      setRedirectState({
        target: "google",
        message: "Opening Google 5★ Review Form...",
      });

      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.href = directGoogleUrl;
        }
      }, 350);
    } else {
      // 1, 2, or 3 stars -> WhatsApp Private Feedback
      const waUrl = buildWhatsAppFeedbackUrl(whatsappNumber, businessName);
      setRedirectState({
        target: "whatsapp",
        message: "Connecting to Owner's Private Feedback...",
      });

      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.href = waUrl;
        }
      }, 300);
    }
  };

  // Long press handler on business name (4s operator bypass)
  const startLongPress = () => {
    setLongPressProgress(0);
    const startTime = Date.now();
    const DURATION = 4000; // 4 seconds

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / DURATION) * 100, 100);
      setLongPressProgress(progress);
    }, 50);

    pressTimerRef.current = setTimeout(() => {
      clearInterval(progressIntervalRef.current!);
      setLongPressProgress(0);
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate([40, 60, 40]);
        } catch {}
      }
      setShowPinPrompt(true);
    }, DURATION);
  };

  const cancelLongPress = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setLongPressProgress(0);
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinLoading(true);
    setPinError("");

    const res = await verifyMasterPin(pinInput);
    setPinLoading(false);

    if (res.success) {
      setAuthenticatedPin(pinInput);
      setShowPinPrompt(false);
      setPinInput("");
      setShowEditModal(true);
    } else {
      setPinError(res.error || "Incorrect Master PIN");
    }
  };

  useEffect(() => {
    return () => {
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 select-none">
      
      {/* Background Ambient Glow customized to shop's brand color */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[360px] h-[360px] rounded-full blur-[110px] opacity-20"
          style={{ backgroundColor: brandColor }}
        />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[280px] h-[280px] bg-emerald-500/5 rounded-full blur-[90px]" />
      </div>

      {/* Main Review Card */}
      <div className="relative w-full max-w-sm mx-auto bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 text-center flex flex-col items-center">
        
        {/* Verified Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-medium tracking-wide mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Verified Review Station</span>
        </div>

        {/* Shop Logo (if present) */}
        {standee.logo_url && (
          <div
            className="w-16 h-16 rounded-full bg-white/10 p-1 flex items-center justify-center overflow-hidden border mb-3 shadow-lg"
            style={{ borderColor: brandColor }}
          >
            <img src={standee.logo_url} alt="Shop Logo" className="w-full h-full object-contain rounded-full" />
          </div>
        )}

        {/* Business Name with 4-second Long-Press Discreet Trigger */}
        <div className="relative mb-1 w-full">
          <button
            type="button"
            onMouseDown={startLongPress}
            onMouseUp={cancelLongPress}
            onMouseLeave={cancelLongPress}
            onTouchStart={startLongPress}
            onTouchEnd={cancelLongPress}
            className="w-full group focus:outline-none transition-transform active:scale-[0.98]"
            title="Press and hold 4s for operator settings"
          >
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight group-hover:text-amber-300 transition-colors">
              {businessName}
            </h1>
          </button>

          {/* Long press visual indicator */}
          {longPressProgress > 0 && (
            <div className="w-full mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-75"
                style={{ width: `${longPressProgress}%`, backgroundColor: brandColor }}
              />
            </div>
          )}
        </div>

        {/* Custom Headline & Subtitle */}
        <h2 className="text-sm font-extrabold uppercase tracking-wide mt-1" style={{ color: brandColor }}>
          {headline}
        </h2>
        <p className="text-xs text-slate-400 font-normal mb-8 max-w-[260px] mt-1">
          {subheadline}
        </p>

        {/* 5 Interactive Star Rating Buttons */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 my-2 w-full">
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = hoveredStar !== null ? star <= hoveredStar : (selectedRating !== null && star <= selectedRating);
            return (
              <button
                key={star}
                type="button"
                onClick={() => handleStarClick(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(null)}
                disabled={selectedRating !== null}
                className="group relative p-2 sm:p-2.5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 active:scale-90 transition-all duration-150 focus:outline-none"
                style={{
                  borderColor: isFilled ? brandColor : undefined,
                }}
                aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
              >
                <Star
                  className={`w-7 h-7 sm:w-8 sm:h-8 transition-all duration-200 ${
                    isFilled
                      ? "scale-110 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                      : "text-slate-500 group-hover:text-slate-300"
                  }`}
                  style={{
                    color: isFilled ? brandColor : undefined,
                    fill: isFilled ? brandColor : "none",
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* Dynamic Status / Routing Feedback */}
        <div className="min-h-16 mt-6 flex flex-col items-center justify-center w-full">
          {redirectState.target ? (
            <div className="flex flex-col items-center gap-2.5 animate-fade-in w-full text-center">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-medium text-amber-300 shadow-lg">
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>{redirectState.message}</span>
              </div>
              <a
                href={redirectState.target === "google" ? formatDirectGoogleReviewUrl(googleReviewUrl) : buildWhatsAppFeedbackUrl(whatsappNumber, businessName)}
                className="w-full mt-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition flex items-center justify-center gap-2"
              >
                <span>{redirectState.target === "google" ? "Tap to Write 5★ Review on Google" : "Open WhatsApp Private Chat"}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <p className="text-[10px] text-slate-400">
                {redirectState.target === "google" ? "Tap 5 stars and post your review on Google" : "Direct private message to the business manager"}
              </p>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3" style={{ color: brandColor }} />
              <span>Takes less than 5 seconds • Instant review</span>
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="w-full mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
          <span className="font-mono">#{standee.serial_code}</span>
          <span>Verified Review Station</span>
        </div>
      </div>

      {/* Admin PIN Unlock Modal (Triggered by 4-second Long Press) */}
      {showPinPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl animate-pop-in">
            <div className="flex items-center gap-2 mb-3 text-amber-400">
              <Lock className="w-4 h-4" />
              <h3 className="font-semibold text-sm text-white">Master Admin Access</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Enter Master Security PIN to modify Standee #{standee.serial_code}.
            </p>

            <form onSubmit={handlePinSubmit} className="space-y-3">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                autoFocus
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter Master PIN"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-center text-lg tracking-widest text-white focus:outline-none focus:border-amber-400"
              />

              {pinError && (
                <p className="text-[11px] text-red-400 text-center">{pinError}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPinPrompt(false)}
                  className="w-1/2 py-2 text-xs bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pinLoading || !pinInput}
                  className="w-1/2 py-2 text-xs bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {pinLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Unlock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discreet In-Place Edit Modal */}
      {showEditModal && (
        <EditStandeeModal
          standee={standee}
          masterPin={authenticatedPin}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={(updated) => setStandee(updated)}
        />
      )}
    </div>
  );
}
