"use client";

import React, { useState } from "react";
import { Star, ShieldCheck, QrCode, ExternalLink, ArrowRight, Sparkles, Smartphone, CheckCircle, RefreshCw } from "lucide-react";
import Link from "next/link";

export function StandeeSimulator() {
  const [selectedSerial, setSelectedSerial] = useState("ST-101");
  const [simRating, setSimRating] = useState<number | null>(null);
  const [actionLog, setActionLog] = useState<string | null>(null);

  const simulateRating = (stars: number) => {
    setSimRating(stars);
    if (stars >= 4) {
      setActionLog(`⭐ ${stars} Stars selected: Instantly routed to Google Reviews URL (window.location.replace)`);
    } else {
      setActionLog(`⚠️ ${stars} Star${stars > 1 ? "s" : ""} selected: Filtered to Owner's Private WhatsApp with direct feedback pre-filled`);
    }
  };

  const resetSim = () => {
    setSimRating(null);
    setActionLog(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-8 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Smartphone className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-white">Live Customer Routing Simulator</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Test the sub-300ms star-filtering logic and field admin triggers in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/s/${selectedSerial}`}
            target="_blank"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-amber-500/20"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Standee #{selectedSerial}
          </Link>
          <button
            onClick={resetSim}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
            title="Reset Simulator"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
        {/* Left: Mobile Screen Preview */}
        <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border border-slate-800/80 shadow-inner">
          <div className="text-[11px] font-mono text-slate-500 mb-3 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Simulated Mobile Client Resolution
          </div>

          <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center shadow-xl">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] mb-3">
              <ShieldCheck className="w-3 h-3" />
              <span>Verified Business Station</span>
            </div>

            <h3 className="font-bold text-white text-base">The Roasted Bean Cafe</h3>
            <p className="text-[11px] text-slate-400 mt-0.5 mb-4">Rate your experience</p>

            <div className="flex items-center justify-center gap-1.5 my-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => simulateRating(star)}
                  className="p-1.5 rounded-xl hover:bg-slate-800 transition transform active:scale-90"
                >
                  <Star
                    className={`w-6 h-6 ${
                      simRating !== null && star <= simRating
                        ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                        : "text-slate-600 hover:text-slate-400"
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[10px] text-slate-500 flex justify-between">
              <span>#{selectedSerial}</span>
              <span>WAT System Engine</span>
            </div>
          </div>
        </div>

        {/* Right: Real-time Routing Telemetry */}
        <div className="space-y-4 flex flex-col justify-center">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Select Standee to Test:</label>
            <div className="flex flex-wrap gap-2">
              {["ST-101", "ST-102", "ST-103", "ST-104", "ST-105"].map((code) => (
                <button
                  key={code}
                  onClick={() => {
                    setSelectedSerial(code);
                    resetSim();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition ${
                    selectedSerial === code
                      ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  #{code}
                </button>
              ))}
            </div>
          </div>

          {/* Logic Explanation Box */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
            <div className="font-semibold text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Routing Logic Architecture:
            </div>
            <div className="text-slate-300 space-y-1.5 text-[11px] leading-relaxed">
              <p>• <span className="text-emerald-400 font-bold">4 or 5 Stars:</span> Instant 0.4s micro-spinner → Replaces window to Google Business Direct Review page.</p>
              <p>• <span className="text-amber-400 font-bold">1, 2, or 3 Stars:</span> Instant 0.3s feedback confirmation → Routes privately to Owner's WhatsApp (+91 normalized) with pre-filled message.</p>
              <p>• <span className="text-sky-400 font-bold">Unlinked Serial:</span> Renders instant Master PIN activation form.</p>
            </div>
          </div>

          {/* Live Action Log */}
          {actionLog && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-mono animate-fade-in flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-400" />
              <div>{actionLog}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
