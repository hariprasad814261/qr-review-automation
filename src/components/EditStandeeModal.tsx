"use client";

import React, { useState } from "react";
import { Standee } from "@/types/database";
import { updateStandeeAction, resetStandeeAction } from "@/actions/standeeActions";
import { X, Lock, Save, RotateCcw, CheckCircle2, AlertCircle, Loader2, Phone, Globe, Building } from "lucide-react";

interface EditStandeeModalProps {
  standee: Standee;
  masterPin: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: Standee) => void;
}

export function EditStandeeModal({
  standee,
  masterPin,
  isOpen,
  onClose,
  onSuccess,
}: EditStandeeModalProps) {
  const [businessName, setBusinessName] = useState(standee.business_name || "");
  const [googleUrl, setGoogleUrl] = useState(standee.google_review_url || "");
  const [whatsapp, setWhatsapp] = useState(standee.whatsapp_number || "");
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    const res = await updateStandeeAction({
      serial_code: standee.serial_code,
      pin: masterPin,
      business_name: businessName,
      google_review_url: googleUrl,
      whatsapp_number: whatsapp,
    });

    setLoading(false);
    if (res.success && res.data) {
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("qr_custom_standees_v1");
          const map = raw ? JSON.parse(raw) : {};
          map[res.data.serial_code] = { ...(map[res.data.serial_code] || {}), ...res.data };
          localStorage.setItem("qr_custom_standees_v1", JSON.stringify(map));
        } catch (e) {
          console.warn("Local storage update notice:", e);
        }
      }
      setStatusMessage({ type: "success", text: "Standee updated successfully!" });
      setTimeout(() => {
        onSuccess(res.data!);
        onClose();
      }, 1000);
    } else {
      setStatusMessage({ type: "error", text: res.error || "Update failed. Please check inputs." });
    }
  };

  const handleReset = async () => {
    if (!confirm(`Are you sure you want to unlink Standee #${standee.serial_code}? It will return to pending inventory.`)) {
      return;
    }
    setResetting(true);
    setStatusMessage(null);

    const res = await resetStandeeAction(standee.serial_code, masterPin);
    setResetting(false);

    if (res.success && res.data) {
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("qr_custom_standees_v1");
          if (raw) {
            const map = JSON.parse(raw);
            delete map[standee.serial_code];
            localStorage.setItem("qr_custom_standees_v1", JSON.stringify(map));
          }
        } catch (e) {
          console.warn("Local storage reset notice:", e);
        }
      }
      setStatusMessage({ type: "success", text: "Standee reset to unlinked inventory." });
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } else {
      setStatusMessage({ type: "error", text: res.error || "Reset failed." });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Edit Field Configuration</h3>
              <p className="text-xs text-slate-400">Standee ID: <span className="font-mono text-amber-400 font-bold">#{standee.serial_code}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleUpdate} className="p-6 space-y-4">
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusMessage.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                  : "bg-red-500/10 border border-red-500/20 text-red-300"
              }`}
            >
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                Business / Venue Name
              </span>
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 transition"
              placeholder="e.g. The Roasted Bean Cafe"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                Google Review Direct URL
              </span>
            </label>
            <input
              type="url"
              required
              value={googleUrl}
              onChange={(e) => setGoogleUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 transition font-mono text-xs"
              placeholder="https://g.page/r/... or https://maps.app.goo.gl/..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Owner WhatsApp Feedback Number
              </span>
            </label>
            <input
              type="text"
              required
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 transition font-mono text-xs"
              placeholder="e.g. 9876543210 or +91 98765 43210"
            />
          </div>

          <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting || loading}
              className="px-3.5 py-2.5 bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 text-red-300 text-xs font-medium rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {resetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              Unlink Standee
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || resetting}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
