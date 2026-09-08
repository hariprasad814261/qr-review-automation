"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { Standee, StandeeTheme, SaveShopDesignInput, QrTargetMode } from "@/types/database";
import { generateBrandedQrDataUrl, downloadDataUrl } from "@/lib/qrGenerator";
import { downloadStandeePdf } from "@/lib/standeePdfGenerator";
import { saveShopDesignAction } from "@/actions/standeeActions";
import { formatDirectGoogleReviewUrl } from "@/lib/validations";
import Link from "next/link";
import { 
  QrCode, 
  Download, 
  Save, 
  Upload, 
  ExternalLink, 
  Sparkles, 
  Smartphone, 
  Layers, 
  Star, 
  Palette, 
  Building2, 
  Phone, 
  Link2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  Image as ImageIcon,
  Copy,
  Printer,
  Globe,
  Radio,
  Wifi,
  ShieldCheck,
  Check
} from "lucide-react";

interface StandeeStudioProps {
  initialStandee?: Standee | null;
  appBaseUrl?: string;
}

const LOCAL_LAN_IP = "10.89.91.42";

const THEME_PRESETS: {
  id: StandeeTheme;
  name: string;
  primary: string;
  accent: string;
  bg: string;
  desc: string;
}[] = [
  {
    id: "luxury-dark",
    name: "Luxury Dark & Gold",
    primary: "#F59E0B",
    accent: "#D97706",
    bg: "#0A0E1A",
    desc: "Premium slate & rich gold. Ideal for fine dining, jewelry, lounges.",
  },
  {
    id: "clean-white",
    name: "Clean Minimal White",
    primary: "#0D9488",
    accent: "#14B8A6",
    bg: "#FFFFFF",
    desc: "Crisp white with teal accents. Ideal for clinics, dentists, optics.",
  },
  {
    id: "warm-hospitality",
    name: "Warm Hospitality",
    primary: "#D97706",
    accent: "#F59E0B",
    bg: "#181411",
    desc: "Cozy roasted amber & espresso. Perfect for cafes, bistros, bakeries.",
  },
  {
    id: "vibrant-gradient",
    name: "Modern Vibrant",
    primary: "#E11D48",
    accent: "#FB7185",
    bg: "#0F172A",
    desc: "Energetic rose & violet. Perfect for salons, spas, gyms, boutiques.",
  },
  {
    id: "classic-google",
    name: "Classic Google Colors",
    primary: "#1A73E8",
    accent: "#FBBC05",
    bg: "#FFFFFF",
    desc: "Instantly recognizable Google Blue & Gold. High trust & scan rate.",
  },
];

export function StandeeStudio({ initialStandee, appBaseUrl = "http://localhost:3000" }: StandeeStudioProps) {
  // Form State
  const [serialCode, setSerialCode] = useState(initialStandee?.serial_code || "ST-101");
  const [businessName, setBusinessName] = useState(initialStandee?.business_name || "The Velvet Bistro & Coffee");
  const [googleReviewUrl, setGoogleReviewUrl] = useState(initialStandee?.google_review_url || "https://maps.app.goo.gl/example");
  const [whatsappNumber, setWhatsappNumber] = useState(initialStandee?.whatsapp_number || "919876543210");
  
  // QR Target Mode & Routing State
  // Default to direct_google so QR codes work 100% directly when scanned by phones!
  const [qrTargetMode, setQrTargetMode] = useState<QrTargetMode>(initialStandee?.qr_target_mode || "direct_google");
  const [customQrUrl, setCustomQrUrl] = useState<string>(initialStandee?.custom_qr_url || "");
  const [customBaseUrl, setCustomBaseUrl] = useState<string>(
    appBaseUrl.includes("localhost") ? `http://${LOCAL_LAN_IP}:3000` : appBaseUrl
  );
  const [copied, setCopied] = useState(false);

  // Design State
  const [theme, setTheme] = useState<StandeeTheme>(initialStandee?.theme || "luxury-dark");
  const [primaryColor, setPrimaryColor] = useState(initialStandee?.primary_color || "#F59E0B");
  const [accentColor, setAccentColor] = useState(initialStandee?.accent_color || "#D97706");
  const [backgroundColor, setBackgroundColor] = useState(initialStandee?.background_color || "#0A0E1A");
  const [headline, setHeadline] = useState(initialStandee?.headline || "Rate Your Experience");
  const [subheadline, setSubheadline] = useState(initialStandee?.subheadline || "Point your camera to scan • Rate in 5 seconds");
  const [ctaText, setCtaText] = useState(initialStandee?.cta_text || "Review us on Google");
  const [logoUrl, setLogoUrl] = useState<string | null>(initialStandee?.logo_url || null);

  // Preview & Export State
  const [previewTab, setPreviewTab] = useState<"standee" | "qr" | "mobile">("qr");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  });
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Deterministically calculate the exact content encoded into the QR Code
  const getEncodedQrContent = (): string => {
    if (qrTargetMode === "direct_google") {
      const formatted = formatDirectGoogleReviewUrl(googleReviewUrl.trim());
      return formatted || "https://maps.google.com";
    }
    if (qrTargetMode === "direct_whatsapp") {
      const clean = whatsappNumber.replace(/[^0-9]/g, "");
      return clean ? `https://wa.me/${clean}` : "https://whatsapp.com";
    }
    if (qrTargetMode === "custom_url") {
      return customQrUrl.trim() || "https://google.com";
    }
    // smart_filter mode
    const host = (customBaseUrl.trim() || appBaseUrl).replace(/\/$/, "");
    return `${host}/s/${serialCode.toUpperCase()}`;
  };

  const targetScanUrl = getEncodedQrContent();

  // Automatically regenerate QR code whenever encoded content or design changes
  useEffect(() => {
    let active = true;
    setIsGeneratingQr(true);

    const timer = setTimeout(async () => {
      try {
        const dotColor = theme === "clean-white" || theme === "classic-google" ? "#0F172A" : primaryColor;
        const qrBg = "#FFFFFF"; // Keep QR base white for 100% scan reliability across camera lenses

        const dataUrl = await generateBrandedQrDataUrl({
          text: targetScanUrl,
          size: 1000,
          dotColor: dotColor,
          bgColor: qrBg,
          logoUrl: logoUrl,
        });

        if (active) {
          setQrDataUrl(dataUrl);
          setIsGeneratingQr(false);
        }
      } catch (err) {
        console.error("QR generation failed:", err);
        if (active) setIsGeneratingQr(false);
      }
    }, 150);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [targetScanUrl, primaryColor, theme, logoUrl]);

  // Handle Preset Selection
  const applyPreset = (preset: typeof THEME_PRESETS[0]) => {
    setTheme(preset.id);
    setPrimaryColor(preset.primary);
    setAccentColor(preset.accent);
    setBackgroundColor(preset.bg);
  };

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File size exceeds 2MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLogoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Copy encoded content
  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(targetScanUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Save Shop Profile Action
  const handleSave = () => {
    setSaveStatus({ type: null, message: "" });

    startTransition(async () => {
      const input: SaveShopDesignInput = {
        serial_code: serialCode,
        business_name: businessName,
        google_review_url: formatDirectGoogleReviewUrl(googleReviewUrl),
        whatsapp_number: whatsappNumber,
        is_active: true,
        logo_url: logoUrl,
        theme: theme,
        primary_color: primaryColor,
        accent_color: accentColor,
        background_color: backgroundColor,
        headline: headline,
        subheadline: subheadline,
        cta_text: ctaText,
        qr_target_mode: qrTargetMode,
        custom_qr_url: customQrUrl,
      };

      const res = await saveShopDesignAction(input);
      if (res.success) {
        setSaveStatus({
          type: "success",
          message: res.message || "Shop profile and custom design saved successfully!",
        });
        setTimeout(() => setSaveStatus({ type: null, message: "" }), 5000);
      } else {
        setSaveStatus({
          type: "error",
          message: res.error || "Failed to save profile.",
        });
      }
    });
  };

  // Trigger Standee PDF Download
  const handleDownloadPdf = async () => {
    if (!qrDataUrl) return;
    await downloadStandeePdf({
      serial_code: serialCode,
      business_name: businessName,
      theme: theme,
      headline: headline,
      subheadline: subheadline,
      cta_text: ctaText,
      primary_color: primaryColor,
      accent_color: accentColor,
      background_color: backgroundColor,
      logo_url: logoUrl,
      qr_data_url: qrDataUrl,
    });
  };

  // Trigger Branded QR PNG Download
  const handleDownloadQrPng = () => {
    if (!qrDataUrl) return;
    const cleanName = businessName.toLowerCase().replace(/[^a-z0-9]/g, "_");
    downloadDataUrl(qrDataUrl, `qr_branded_${serialCode}_${cleanName}.png`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Studio Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-xl sticky top-0 z-30 px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/batch"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Shops Directory</span>
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-none">Standee & QR Customizer Studio</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">One-Time Sale Physical Standee Production</p>
            </div>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadPdf}
            disabled={!qrDataUrl}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            title="Download 300 DPI vector PDF for UV Acrylic Printer"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Print Standee PDF</span>
          </button>

          <button
            onClick={handleDownloadQrPng}
            disabled={!qrDataUrl}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            title="Download transparent PNG of branded QR with center logo"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">QR PNG</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isPending}
            className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isPending ? "Saving..." : "Save Profile"}</span>
          </button>
        </div>
      </header>

      {/* Save Notification Toast */}
      {saveStatus.message && (
        <div className={`px-4 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 transition animate-fade-in ${
          saveStatus.type === "success" 
            ? "bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-300" 
            : "bg-rose-500/15 border-b border-rose-500/30 text-rose-300"
        }`}>
          {saveStatus.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* Main Studio Split Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: Controls & Branding Customizer (6 cols)      */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* 1. Shop Identity Section */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white">Shop Profile & Links</h2>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                Exclusive Admin
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Business Name <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g., Burma Bistro"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-white placeholder-slate-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Serial Code / ID <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={serialCode}
                  onChange={(e) => setSerialCode(e.target.value.toUpperCase())}
                  placeholder="e.g., ST-101"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-amber-400 font-mono font-bold placeholder-slate-600 transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Google Maps / Review URL <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={googleReviewUrl}
                    onChange={(e) => setGoogleReviewUrl(e.target.value)}
                    onBlur={() => {
                      if (googleReviewUrl) {
                        setGoogleReviewUrl(formatDirectGoogleReviewUrl(googleReviewUrl));
                      }
                    }}
                    placeholder="https://maps.app.goo.gl/... or https://g.page/r/.../review"
                    className="w-full pl-8 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-slate-200 placeholder-slate-600 transition"
                  />
                  <Link2 className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 flex items-start gap-1.5 leading-relaxed">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Mobile 1-Tap 5★ Tip:</strong> For the rating &amp; comment box to pop up directly on mobile phones, copy the official link from Google Maps (<strong>&quot;Ask for reviews&quot;</strong> or <strong>&quot;Share review form&quot;</strong>).
                  </span>
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Owner WhatsApp / Mobile Number <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="919876543210"
                    className="w-full pl-8 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-slate-200 font-mono placeholder-slate-600 transition"
                  />
                  <Phone className="w-3.5 h-3.5 text-emerald-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>
          </div>

          {/* 2. QR Code Destination (What the QR Encodes) */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white">QR Code Destination (What Phones Scan)</h2>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
                Live Dynamic Binding
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Option A: Direct Google Maps URL */}
              <button
                type="button"
                onClick={() => setQrTargetMode("direct_google")}
                className={`w-full p-3 rounded-xl border text-left transition flex items-start gap-3 ${
                  qrTargetMode === "direct_google"
                    ? "bg-amber-500/10 border-amber-500/80 ring-1 ring-amber-500 shadow-md shadow-amber-500/10"
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="mt-0.5 p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Direct Google Maps Review Link</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      Recommended • 100% Offline Ready
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    The QR code encodes your exact Google Maps URL directly. When any customer scans the code, their phone immediately opens Google Reviews. No server or internet hosting required!
                  </p>
                </div>
              </button>

              {/* Option B: Direct WhatsApp */}
              <button
                type="button"
                onClick={() => setQrTargetMode("direct_whatsapp")}
                className={`w-full p-3 rounded-xl border text-left transition flex items-start gap-3 ${
                  qrTargetMode === "direct_whatsapp"
                    ? "bg-amber-500/10 border-amber-500/80 ring-1 ring-amber-500 shadow-md shadow-amber-500/10"
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="mt-0.5 p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Direct WhatsApp Chat (`wa.me`)</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      Direct Messaging
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    The QR code encodes a direct WhatsApp URL (`https://wa.me/{whatsappNumber}`). Opens WhatsApp directly to the owner.
                  </p>
                </div>
              </button>

              {/* Option C: Smart Review Filter Landing Page */}
              <button
                type="button"
                onClick={() => setQrTargetMode("smart_filter")}
                className={`w-full p-3 rounded-xl border text-left transition flex items-start gap-3 ${
                  qrTargetMode === "smart_filter"
                    ? "bg-amber-500/10 border-amber-500/80 ring-1 ring-amber-500 shadow-md shadow-amber-500/10"
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="mt-0.5 p-1.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Smart 5-Star Review Router (`/s/{serialCode}`)</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      Filter 1-3★ to WhatsApp
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Routes through your branded mobile page. 4–5★ goes to Google Reviews; 1–3★ goes to private WhatsApp.
                  </p>

                  {/* Local Network / Domain Host configuration if smart_filter is active */}
                  {qrTargetMode === "smart_filter" && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <label className="block text-[11px] font-semibold text-slate-300">
                        Host / Server Address (Must be reachable by your mobile phone):
                      </label>
                      <input
                        type="text"
                        value={customBaseUrl}
                        onChange={(e) => setCustomBaseUrl(e.target.value)}
                        placeholder={`http://${LOCAL_LAN_IP}:3000 or https://yourdomain.com`}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-amber-400"
                      />
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setCustomBaseUrl(`http://${LOCAL_LAN_IP}:3000`)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                        >
                          Use Local Wi-Fi IP ({LOCAL_LAN_IP}:3000)
                        </button>
                        <span className="text-slate-500">
                          (Phones on the same Wi-Fi can open this address, whereas &quot;localhost&quot; fails)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </button>

              {/* Option D: Custom URL */}
              <button
                type="button"
                onClick={() => setQrTargetMode("custom_url")}
                className={`w-full p-3 rounded-xl border text-left transition flex items-start gap-3 ${
                  qrTargetMode === "custom_url"
                    ? "bg-amber-500/10 border-amber-500/80 ring-1 ring-amber-500 shadow-md shadow-amber-500/10"
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="mt-0.5 p-1.5 rounded-lg bg-sky-500/10 text-sky-400 shrink-0">
                  <Link2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-white">Custom URL (Menu, Website, Instagram)</span>
                  {qrTargetMode === "custom_url" && (
                    <div className="mt-2">
                      <input
                        type="url"
                        value={customQrUrl}
                        onChange={(e) => setCustomQrUrl(e.target.value)}
                        placeholder="https://yourrestaurant.com/menu"
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                      />
                    </div>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* 3. Shop Logo Embed Section */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-sky-400" />
                <h2 className="text-sm font-bold text-white">Shop Logo (Embedded in QR & Standee)</h2>
              </div>
              {logoUrl && (
                <button
                  onClick={() => setLogoUrl(null)}
                  className="text-[11px] text-rose-400 hover:text-rose-300 transition"
                >
                  Remove Logo
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-slate-950 border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                ) : (
                  <Upload className="w-6 h-6 text-slate-600" />
                )}
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Upload the shop&apos;s brand logo. It will be placed on top of the standee and cleanly centered inside the QR code with a protective quiet zone.
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Logo File</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Curated Themes & Color Palette */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white">Design Themes & Brand Colors</h2>
              </div>
              <span className="text-[11px] text-slate-500">Instant Presets</span>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {THEME_PRESETS.map((preset) => {
                const isSelected = theme === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={`p-3 rounded-xl border text-left transition flex items-start gap-3 ${
                      isSelected
                        ? "bg-slate-800 border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-500"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg shrink-0 border border-white/10 shadow-inner flex items-center justify-center font-bold text-[10px]"
                      style={{ backgroundColor: preset.bg, color: preset.primary }}
                    >
                      ★
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                        <span>{preset.name}</span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{preset.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Granular Color Controls */}
            <div className="pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Primary Color</label>
                <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="text-[10px] font-mono text-slate-300">{primaryColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Accent Color</label>
                <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="text-[10px] font-mono text-slate-300">{accentColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Card Background</label>
                <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="text-[10px] font-mono text-slate-300">{backgroundColor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Custom Headline & CTAs */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl backdrop-blur-md space-y-4">
            <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
              Typography & Standee Callouts
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Main Standee Headline</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="RATE YOUR EXPERIENCE"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-xs text-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Subtext / Instructions</label>
                <input
                  type="text"
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                  placeholder="Point your camera to scan • Rate in 5 seconds"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-xs text-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Call to Action (Below QR)</label>
                <input
                  type="text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="Review us on Google"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-xs text-white transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: Interactive Live Mockups & Previews (6 cols)*/}
        {/* ======================================================== */}
        <div className="lg:col-span-6 flex flex-col space-y-4">
          
          {/* Live Encoded Content Notification Box */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-amber-400" />
                <span>Exact Content Encoded in This QR:</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                qrTargetMode === "direct_google" || qrTargetMode === "direct_whatsapp" || qrTargetMode === "custom_url"
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-amber-500/20 text-amber-300"
              }`}>
                {qrTargetMode === "direct_google" ? "Direct Google Reviews (Offline Ready)" : 
                 qrTargetMode === "direct_whatsapp" ? "Direct WhatsApp (Offline Ready)" :
                 qrTargetMode === "custom_url" ? "Direct Custom Link" : "Smart Filter Page"}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-amber-300 break-all flex items-center justify-between gap-2">
              <span className="truncate">{targetScanUrl}</span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-[11px]"
                  title="Copy encoded URL"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={targetScanUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  title="Test link in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Preview Mode Switcher */}
          <div className="p-1 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-1 shadow-md">
            <button
              onClick={() => setPreviewTab("qr")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                previewTab === "qr"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Branded QR Code</span>
            </button>

            <button
              onClick={() => setPreviewTab("standee")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                previewTab === "standee"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>4x6&quot; Acrylic Standee</span>
            </button>

            <button
              onClick={() => setPreviewTab("mobile")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                previewTab === "mobile"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Customer Scan View</span>
            </button>
          </div>

          {/* Live Preview Display Container */}
          <div className="flex-1 p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-2xl backdrop-blur-xl flex flex-col items-center justify-center min-h-[580px] relative overflow-hidden">
            
            {/* Background ambient lighting */}
            <div
              className="absolute -top-12 -right-12 w-64 h-64 rounded-full blur-[100px] pointer-events-none opacity-25"
              style={{ backgroundColor: primaryColor }}
            />

            {/* TAB 1: Standee 4x6 Acrylic Card Mockup */}
            {previewTab === "standee" && (
              <div className="relative group animate-fade-in flex flex-col items-center">
                
                {/* 4x6 Aspect Ratio Card Container (280px x 420px) */}
                <div
                  className="w-[280px] h-[420px] rounded-2xl p-4 flex flex-col items-center justify-between text-center relative shadow-2xl transition-all border"
                  style={{
                    backgroundColor: backgroundColor,
                    borderColor: theme === "clean-white" || theme === "classic-google" ? "#E2E8F0" : "#334155",
                    color: theme === "clean-white" || theme === "classic-google" ? "#0F172A" : "#FFFFFF",
                  }}
                >
                  {/* Subtle glossy reflection effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none" />

                  {/* Header: 5 Stars */}
                  <div className="pt-2 flex flex-col items-center">
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className="w-4 h-4 fill-current drop-shadow"
                          style={{ color: primaryColor }}
                        />
                      ))}
                    </div>

                    {/* Logo if present */}
                    {logoUrl && (
                      <div className="mt-2.5 w-10 h-10 rounded-full bg-white/10 p-1 flex items-center justify-center overflow-hidden border border-white/20 shadow-sm">
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                      </div>
                    )}

                    <h3 className="mt-2 text-xs font-bold uppercase tracking-wide line-clamp-1">
                      {businessName}
                    </h3>
                    <h4 className="text-sm font-extrabold uppercase tracking-tight mt-0.5" style={{ color: primaryColor }}>
                      {headline}
                    </h4>
                    <p className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">
                      {subheadline}
                    </p>
                  </div>

                  {/* Center QR Container */}
                  <div className="p-2.5 rounded-xl bg-white shadow-lg border border-slate-200/80 my-auto">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="QR Code"
                        className="w-[140px] h-[140px] object-contain rounded"
                      />
                    ) : (
                      <div className="w-[140px] h-[140px] bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                        Generating QR...
                      </div>
                    )}
                  </div>

                  {/* Footer Badge */}
                  <div className="w-full pb-1">
                    <div
                      className="text-[10px] font-bold tracking-wide py-1"
                      style={{ color: primaryColor }}
                    >
                      {ctaText}
                    </div>

                    <div className="w-full py-1 px-3 rounded-lg bg-slate-950/40 border border-slate-700/50 flex items-center justify-center gap-1.5 text-[9px] font-mono text-slate-300">
                      <span>Serial: #{serialCode}</span>
                      <span>•</span>
                      <span>Verified Station</span>
                    </div>

                    <div className="text-[6.5px] text-slate-500 uppercase tracking-widest mt-1">
                      4x6 Inch Acrylic Vertical Tent • UV Print
                    </div>
                  </div>
                </div>

                {/* Simulated acrylic stand base */}
                <div className="w-[300px] h-3.5 bg-gradient-to-r from-slate-700 via-slate-500 to-slate-700 rounded-b-md shadow-2xl border-t border-white/20" />
                <div className="w-[320px] h-2 bg-slate-800/80 rounded-full blur-[2px] mt-0.5" />
              </div>
            )}

            {/* TAB 2: High-Res Branded QR View */}
            {previewTab === "qr" && (
              <div className="flex flex-col items-center text-center space-y-4 animate-fade-in">
                <div className="p-4 rounded-3xl bg-white shadow-2xl border border-slate-200/90 flex flex-col items-center">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="High Res Branded QR"
                      className="w-[260px] h-[260px] object-contain"
                    />
                  ) : (
                    <div className="w-[260px] h-[260px] flex items-center justify-center text-slate-400">
                      Generating...
                    </div>
                  )}
                  <div className="mt-3 font-mono text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300">
                      #{serialCode}
                    </span>
                    <span>Level H (30% Redundancy)</span>
                  </div>
                </div>

                <div className="max-w-xs text-xs text-slate-400 space-y-1">
                  <div className="font-semibold text-slate-300">Scannable Camera Target:</div>
                  <div className="font-mono text-amber-400 break-all bg-slate-950 p-2 rounded-xl border border-slate-800">
                    {targetScanUrl}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Customer Mobile Screen Mockup */}
            {previewTab === "mobile" && (
              <div className="w-[280px] h-[520px] rounded-[38px] bg-slate-950 border-[6px] border-slate-800 shadow-2xl flex flex-col overflow-hidden relative animate-fade-in">
                
                {/* Phone Notch */}
                <div className="w-28 h-4 bg-slate-800 rounded-b-xl mx-auto flex items-center justify-center shrink-0">
                  <div className="w-8 h-1.5 bg-slate-900 rounded-full" />
                </div>

                {/* Mobile Screen Content */}
                <div
                  className="flex-1 p-4 flex flex-col items-center justify-between text-center overflow-y-auto"
                  style={{ backgroundColor: theme === "clean-white" ? "#F8FAFC" : "#0A0E1A" }}
                >
                  <div className="pt-4 flex flex-col items-center">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-14 h-14 object-contain rounded-full shadow-md mb-2" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold mb-2">
                        ★
                      </div>
                    )}
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      How was your visit?
                    </span>
                    <h3 className="text-sm font-extrabold text-white mt-0.5">
                      {businessName}
                    </h3>
                  </div>

                  {/* Star Rating Area */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 w-full shadow-inner space-y-2.5">
                    <p className="text-[11px] text-slate-300 font-medium">
                      Tap a star to rate:
                    </p>
                    <div className="flex items-center justify-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <div
                          key={s}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-amber-500/20 text-amber-400 transition"
                        >
                          <Star className="w-5 h-5 fill-current" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reputation Engine Notice */}
                  <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[10px] text-slate-400 space-y-1">
                    <div className="flex items-center justify-center gap-1 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Smart Rating Protection</span>
                    </div>
                    <p className="text-[9px] text-slate-500 leading-tight">
                      4-5★ routes to Google Reviews.<br />1-3★ routes to private WhatsApp.
                    </p>
                  </div>

                  {/* Bottom Bar */}
                  <div className="text-[8px] text-slate-600 uppercase font-mono tracking-widest pb-1">
                    Powered by Verified Reviews
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Info Callout */}
          <div className="p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 truncate">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Active QR Target: <strong className="text-white font-mono">{targetScanUrl}</strong></span>
            </span>
            <a
              href={targetScanUrl}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1 transition shrink-0"
            >
              <span>Test Target</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

      </main>
    </div>
  );
}
