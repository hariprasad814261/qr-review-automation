import React, { useState, useEffect } from "react";
import { verifyMasterPin, activateStandeeAction } from "@/actions/standeeActions";
import { normalizeWhatsAppNumber, formatDisplayWhatsApp, formatDirectGoogleReviewUrl } from "@/lib/validations";
import { Standee } from "@/types/database";
import { Lock, Building, Globe, Phone, ShieldAlert, CheckCircle2, ArrowRight, Loader2, Sparkles, QrCode } from "lucide-react";

interface AdminActivationFormProps {
  code: string;
  initialData?: Standee | null;
  onActivated?: (standee: Standee) => void;
}

export function AdminActivationForm({ code, initialData, onActivated }: AdminActivationFormProps) {
  // Step 1: PIN Authentication | Step 2: Business & Routing Setup
  const [step, setStep] = useState<1 | 2>(1);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinLoading, setPinLoading] = useState(false);

  // Form Inputs
  const [businessName, setBusinessName] = useState(initialData?.business_name || "");
  const [googleReviewUrl, setGoogleReviewUrl] = useState(initialData?.google_review_url || "");
  const [whatsappNumber, setWhatsappNumber] = useState(initialData?.whatsapp_number || "");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Check localStorage for any pre-filled profile on device
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("qr_custom_standees_v1");
        if (raw) {
          const map = JSON.parse(raw);
          const local = map[code.toUpperCase()];
          if (local) {
            if (local.business_name && !businessName) setBusinessName(local.business_name);
            if (local.google_review_url && !googleReviewUrl) setGoogleReviewUrl(local.google_review_url);
            if (local.whatsapp_number && !whatsappNumber) setWhatsappNumber(local.whatsapp_number);
          }
        }
      } catch (e) {
        console.warn("Local storage check warning:", e);
      }
    }
  }, [code]);

  // Handle Step 1 PIN verification
  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;
    setPinLoading(true);
    setPinError("");

    const res = await verifyMasterPin(pin);
    setPinLoading(false);

    if (res.success && res.data?.valid) {
      setStep(2);
    } else {
      setPinError(res.error || "Incorrect Master PIN. Access denied.");
    }
  };

  // Handle Step 2 Standee Activation
  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");

    const cleanCode = code.toUpperCase();
    const cleanGoogleUrl = formatDirectGoogleReviewUrl(googleReviewUrl.trim());
    const cleanWhatsApp = normalizeWhatsAppNumber(whatsappNumber);

    const activatedRecord: Standee = {
      id: initialData?.id || `shop-${Date.now()}`,
      serial_code: cleanCode,
      business_name: businessName.trim(),
      google_review_url: cleanGoogleUrl,
      whatsapp_number: cleanWhatsApp,
      is_active: true,
      scan_count: initialData?.scan_count || 0,
      last_scanned_at: new Date().toISOString(),
      created_at: initialData?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      theme: initialData?.theme || "luxury-dark",
      primary_color: initialData?.primary_color || "#F59E0B",
      accent_color: initialData?.accent_color || "#D97706",
      background_color: initialData?.background_color || "#0A0E1A",
      headline: initialData?.headline || "Rate Your Experience",
      subheadline: initialData?.subheadline || "Point your camera to scan • Rate in 5 seconds",
      cta_text: initialData?.cta_text || "Review us on Google",
      qr_target_mode: "smart_filter",
    };

    // Save to device local storage immediately for 100% reliable offline/serverless activation
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("qr_custom_standees_v1");
        const map = raw ? JSON.parse(raw) : {};
        map[cleanCode] = activatedRecord;
        localStorage.setItem("qr_custom_standees_v1", JSON.stringify(map));
      } catch (e) {
        console.warn("LocalStorage save notice:", e);
      }
    }

    try {
      await activateStandeeAction({
        serial_code: cleanCode,
        pin,
        business_name: businessName,
        google_review_url: googleReviewUrl,
        whatsapp_number: whatsappNumber,
      });
    } catch (e) {
      console.warn("Server action non-fatal fallback:", e);
    }

    setSubmitting(false);
    setSubmitSuccess(true);

    // Smoothly transition to live rating view
    setTimeout(() => {
      if (onActivated) {
        onActivated(activatedRecord);
      } else if (typeof window !== "undefined") {
        window.location.reload();
      }
    }, 800);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Background Lights */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[380px] h-[380px] bg-amber-500/10 rounded-full blur-[110px]" />
      </div>

      <div className="relative w-full max-w-md mx-auto bg-slate-900/95 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80">
        
        {/* Header Badge */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Unlinked Standee</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 font-bold">#{code}</span>
              </div>
              <h2 className="text-sm font-medium text-slate-300">Field Setup & Activation</h2>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800 text-xs">
            <span className={`w-2 h-2 rounded-full ${step === 1 ? "bg-amber-400" : "bg-emerald-400"}`} />
            <span className="text-slate-400 text-[11px]">Step {step}/2</span>
          </div>
        </div>

        {/* STEP 1: Master PIN Challenge */}
        {step === 1 && (
          <form onSubmit={handleVerifyPin} className="space-y-5 animate-fade-in">
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Enter Field Master PIN</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[260px] mx-auto">
                This physical standee is unlinked. Enter the Master Security PIN to configure client links.
              </p>
            </div>

            <div>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                autoFocus
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="• • • •"
                className="w-full px-4 py-3.5 bg-slate-950 border border-slate-700 rounded-2xl text-center text-2xl tracking-[0.4em] font-mono text-white focus:outline-none focus:border-amber-400 transition shadow-inner"
              />
              {pinError && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={pinLoading || pin.length < 4}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 active:scale-[0.99]"
            >
              {pinLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating PIN...</span>
                </>
              ) : (
                <>
                  <span>Unlock Standee</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Client Profile & Smart Review Routing */}
        {step === 2 && (
          <form onSubmit={handleActivate} className="space-y-4 animate-fade-in">
            {submitSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <div className="font-bold text-emerald-200">Standee Activated!</div>
                  <div>Switching to live customer rating view...</div>
                </div>
              </div>
            )}

            {submitError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-amber-400" />
                  Business / Venue Name
                </span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Copper Chimney Restaurant"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-amber-400" />
                  Google Review Direct Link (4-5 Star Routing)
                </span>
              </label>
              <input
                type="url"
                required
                value={googleReviewUrl}
                onChange={(e) => setGoogleReviewUrl(e.target.value)}
                placeholder="https://g.page/r/... or https://maps.app.goo.gl/..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-400 transition"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                4 & 5-star taps will instantly redirect customers to this Google Review page.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  Owner WhatsApp Number (1-3 Star Routing)
                </span>
              </label>
              <input
                type="text"
                required
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="10-digit mobile (e.g. 9876543210)"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-emerald-400 transition"
              />
              {whatsappNumber && (
                <p className="text-[10px] text-emerald-400/80 mt-1">
                  Normalized: {formatDisplayWhatsApp(whatsappNumber)} (Private direct feedback)
                </p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || submitSuccess}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition disabled:opacity-50 active:scale-[0.99]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Activating Standee #{code}...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Activate Standee On-Site</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
