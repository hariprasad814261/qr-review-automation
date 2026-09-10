"use client";

import React, { useState, useTransition } from "react";
import { Standee } from "@/types/database";
import Link from "next/link";
import { 
  Building2, 
  Phone, 
  ArrowUpRight, 
  Edit3, 
  Download, 
  Printer, 
  Copy, 
  Trash2, 
  Search, 
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Clock,
  Plus
} from "lucide-react";
import { formatDisplayWhatsApp, formatDirectGoogleReviewUrl } from "@/lib/validations";
import { deleteShopAction, duplicateShopAction } from "@/actions/standeeActions";
import { generateBrandedQrDataUrl, downloadDataUrl } from "@/lib/qrGenerator";
import { downloadStandeePdf } from "@/lib/standeePdfGenerator";

interface ShopDirectoryTableProps {
  initialStandees: Standee[];
  appBaseUrl: string;
}

const LOCAL_STORAGE_KEY = "qr_custom_standees_v1";

export function ShopDirectoryTable({ initialStandees, appBaseUrl }: ShopDirectoryTableProps) {
  const [standees, setStandees] = useState<Standee[]>(initialStandees);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending">("all");
  const [isPending, startTransition] = useTransition();
  const [downloadingCode, setDownloadingCode] = useState<string | null>(null);

  // Sync and merge with client-side localStorage on mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (raw) {
          const localMap: Record<string, Standee> = JSON.parse(raw);
          setStandees((prev) => {
            const map: Record<string, Standee> = {};
            for (const s of prev) {
              map[s.serial_code] = s;
            }
            for (const [code, s] of Object.entries(localMap)) {
              map[code] = { ...(map[code] || {}), ...s };
            }
            return Object.values(map).sort((a, b) => (b.serial_code > a.serial_code ? 1 : -1));
          });
        }
      } catch (e) {
        console.warn("LocalStorage directory sync notice:", e);
      }
    }
  }, []);

  // Filtered list
  const filteredStandees = standees.filter((s) => {
    const matchesSearch = 
      s.serial_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.business_name && s.business_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;
    if (statusFilter === "active") return s.is_active;
    if (statusFilter === "pending") return !s.is_active;
    return true;
  });

  const getShopTargetUrl = (shop: Standee) => {
    if (!shop) return `${(appBaseUrl || "").replace(/\/$/, "")}/s/ST-101`;
    if (shop.qr_target_mode === "direct_google" && shop.google_review_url) {
      return formatDirectGoogleReviewUrl(shop.google_review_url.trim());
    }
    if (shop.qr_target_mode === "direct_whatsapp" && shop.whatsapp_number) {
      const clean = shop.whatsapp_number.replace(/[^0-9]/g, "");
      return clean ? `https://wa.me/${clean}` : "https://whatsapp.com";
    }
    if (shop.qr_target_mode === "custom_url" && shop.custom_qr_url) {
      return (shop.custom_qr_url || "").trim();
    }
    return `${(appBaseUrl || "").replace(/\/$/, "")}/s/${shop.serial_code || "ST-101"}`;
  };

  // Handle Quick PDF Download
  const handleQuickPdfDownload = async (shop: Standee) => {
    try {
      setDownloadingCode(shop.serial_code);
      const targetUrl = getShopTargetUrl(shop);
      const qrDataUrl = await generateBrandedQrDataUrl({
        text: targetUrl,
        size: 1000,
        dotColor: shop.theme === "clean-white" || shop.theme === "classic-google" ? "#0F172A" : (shop.primary_color || "#000000"),
        bgColor: "#FFFFFF",
        logoUrl: shop.logo_url || null,
      });

      await downloadStandeePdf({
        serial_code: shop.serial_code,
        business_name: shop.business_name || "Shop",
        theme: shop.theme || "luxury-dark",
        headline: shop.headline,
        subheadline: shop.subheadline,
        cta_text: shop.cta_text,
        primary_color: shop.primary_color,
        accent_color: shop.accent_color,
        background_color: shop.background_color,
        logo_url: shop.logo_url,
        qr_data_url: qrDataUrl,
      });
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Failed to generate PDF. You can open Studio to inspect.");
    } finally {
      setDownloadingCode(null);
    }
  };

  // Handle Quick QR PNG Download
  const handleQuickQrDownload = async (shop: Standee) => {
    try {
      setDownloadingCode(shop.serial_code);
      const targetUrl = getShopTargetUrl(shop);
      const qrDataUrl = await generateBrandedQrDataUrl({
        text: targetUrl,
        size: 1200,
        dotColor: shop.theme === "clean-white" || shop.theme === "classic-google" ? "#0F172A" : (shop.primary_color || "#000000"),
        bgColor: "#FFFFFF",
        logoUrl: shop.logo_url || null,
      });
      const cleanName = (shop.business_name || "shop").toLowerCase().replace(/[^a-z0-9]/g, "_");
      downloadDataUrl(qrDataUrl, `qr_branded_${shop.serial_code}_${cleanName}.png`);
    } catch (err) {
      console.error("QR download error:", err);
      alert("Failed to generate QR PNG.");
    } finally {
      setDownloadingCode(null);
    }
  };

  // Handle Delete
  const handleDelete = (shop: Standee) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete shop #${shop.serial_code} (${shop.business_name || "Unnamed"})?`);
    if (!confirmDelete) return;

    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (raw) {
          const localMap: Record<string, Standee> = JSON.parse(raw);
          delete localMap[shop.serial_code];
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localMap));
        }
      } catch (e) {
        console.warn("Local storage delete warning:", e);
      }
    }

    setStandees((prev) => prev.filter((item) => item.serial_code !== shop.serial_code));

    startTransition(async () => {
      try {
        await fetch(`/api/standees?code=${shop.serial_code}`, { method: "DELETE" });
      } catch {
        await deleteShopAction(shop.serial_code);
      }
    });
  };

  // Handle Duplicate
  const handleDuplicate = (shop: Standee) => {
    const numbers = standees
      .map((s) => {
        const match = s.serial_code.match(/ST-(\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n) && n > 0);
    const nextNum = numbers.length > 0 ? Math.max(103, ...numbers) + 1 : 104;
    const defaultNewCode = `ST-${nextNum}`;

    const newCode = window.prompt("Enter new serial code for duplicated shop:", defaultNewCode);
    if (!newCode || !newCode.trim()) return;

    const cleanCode = newCode.trim().toUpperCase();

    const cloned: Standee = {
      ...shop,
      id: `shop-${Date.now()}`,
      serial_code: cleanCode,
      business_name: `${shop.business_name || "Shop"} (Copy)`,
      scan_count: 0,
      last_scanned_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        const localMap: Record<string, Standee> = raw ? JSON.parse(raw) : {};
        localMap[cleanCode] = cloned;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localMap));
      } catch (e) {}
    }

    setStandees((prev) => [cloned, ...prev]);

    startTransition(async () => {
      try {
        await fetch("/api/standees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cloned),
        });
      } catch {
        await duplicateShopAction(shop.serial_code, cleanCode);
      }
    });
  };

  return (
    <div className="space-y-4">
      
      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by shop name or serial..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-xs text-white placeholder-slate-500 transition"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </div>

        {/* Status Filters & Studio CTA */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-lg transition font-medium ${
                statusFilter === "all" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              All ({standees.length})
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1 rounded-lg transition font-medium ${
                statusFilter === "active" ? "bg-emerald-500/20 text-emerald-300 shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-3 py-1 rounded-lg transition font-medium ${
                statusFilter === "pending" ? "bg-amber-500/20 text-amber-300 shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              Pending
            </button>
          </div>

          <Link
            href="/admin/studio?new=true"
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Standee</span>
          </Link>
        </div>
      </div>

      {/* Standees Table */}
      <div className="rounded-3xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Shop & Branding</th>
                <th className="px-5 py-3.5">Serial Code</th>
                <th className="px-5 py-3.5">Theme / Style</th>
                <th className="px-5 py-3.5">Owner WhatsApp</th>
                <th className="px-5 py-3.5 text-center">Total Scans</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Operator Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredStandees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    No shops match your search criteria. Click <strong>Create Standee</strong> to design a new shop.
                  </td>
                </tr>
              ) : (
                filteredStandees.map((s) => {
                  const isDownloading = downloadingCode === s.serial_code;

                  return (
                    <tr key={s.serial_code} className="hover:bg-slate-800/40 transition-colors">
                      {/* Shop Logo & Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-sm p-1">
                            {s.logo_url ? (
                              <img src={s.logo_url} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                              <Building2 className="w-4 h-4 text-slate-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white leading-snug">
                              {s.business_name || "Unlinked Unit"}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">
                              {s.google_review_url ? "Google Review Linked" : "No Review URL"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Serial Code */}
                      <td className="px-5 py-4 font-mono font-bold text-amber-400">
                        <a
                          href={getShopTargetUrl(s)}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline flex items-center gap-1"
                          title="Open live scan destination in new tab"
                        >
                          <span>#{s.serial_code}</span>
                          <ExternalLink className="w-3 h-3 text-slate-500" />
                        </a>
                      </td>

                      {/* Theme Badge */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-medium text-slate-300 capitalize">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: s.primary_color || "#F59E0B" }}
                          />
                          <span>{s.theme ? s.theme.replace("-", " ") : "Default"}</span>
                        </span>
                      </td>

                      {/* WhatsApp */}
                      <td className="px-5 py-4 font-mono text-slate-300">
                        {s.whatsapp_number ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{formatDisplayWhatsApp(s.whatsapp_number)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Total Scans */}
                      <td className="px-5 py-4 text-center font-mono font-extrabold text-white text-sm">
                        {s.scan_count || 0}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {s.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[11px] font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Operator Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Design in Studio */}
                          <Link
                            href={`/admin/studio?code=${encodeURIComponent(s.serial_code)}`}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                            title="Open in Customizer Studio"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Link>

                          {/* Quick Standee PDF Download */}
                          <button
                            onClick={() => handleQuickPdfDownload(s)}
                            disabled={isDownloading}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition disabled:opacity-50"
                            title="Download 300 DPI Standee PDF"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick QR PNG Download */}
                          <button
                            onClick={() => handleQuickQrDownload(s)}
                            disabled={isDownloading}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 transition disabled:opacity-50"
                            title="Download Branded QR PNG"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* Duplicate Shop */}
                          <button
                            onClick={() => handleDuplicate(s)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
                            title="Duplicate Shop Setup"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Shop */}
                          <button
                            onClick={() => handleDelete(s)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 text-slate-500 hover:text-rose-400 transition"
                            title="Delete Shop"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
