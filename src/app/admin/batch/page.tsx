import { getAllStandees } from "@/lib/supabase/admin";
import { ShopDirectoryTable } from "@/components/ShopDirectoryTable";
import Link from "next/link";
import { 
  QrCode, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  BarChart3,
  Plus,
  Palette,
  Printer,
  Smartphone
} from "lucide-react";

export const revalidate = 0; // Fresh dynamic data on every request

export default async function AdminBatchPage() {
  const standees = await getAllStandees();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.URL || "";

  const totalCount = standees.length;
  const activeCount = standees.filter((s) => s.is_active).length;
  const pendingCount = totalCount - activeCount;
  const totalScans = standees.reduce((acc, s) => acc + (s.scan_count || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Master Operations</span>
              <h1 className="text-base font-bold text-white">Shop Directory & Custom Standee Manager</h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/s/ST-101"
              target="_blank"
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition flex items-center gap-1.5 border border-slate-700/60"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Customer Scan Demo</span>
            </Link>

            <Link
              href="/admin/studio"
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Standee Studio</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* KPI Analytics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Total Standees</span>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{totalCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">Managed shop standees</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md shadow-lg">
            <div className="flex items-center justify-between text-emerald-400 mb-2">
              <span className="text-xs font-medium">Active In Field</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">{activeCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">
              {totalCount > 0 ? `${Math.round((activeCount / totalCount) * 100)}% deployed` : "No units"}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md shadow-lg">
            <div className="flex items-center justify-between text-amber-400 mb-2">
              <span className="text-xs font-medium">Pending Setup</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">{pendingCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">Unlinked standby units</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md shadow-lg">
            <div className="flex items-center justify-between text-sky-400 mb-2">
              <span className="text-xs font-medium">Total Scan Events</span>
              <BarChart3 className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-sky-400 font-mono">{totalScans}</div>
            <div className="text-[11px] text-slate-500 mt-1">Customer impressions</div>
          </div>
        </div>

        {/* Action Studio Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[11px] font-semibold">
              <Sparkles className="w-3 h-3" />
              <span>One-Time Product Generator</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white">Create & Brand Standees for Any Shop</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload each shop&apos;s logo, pick a brand theme, customize headlines and colors, and export 300 DPI acrylic tent PDFs with embedded QR codes. No monthly client logins or maintenance required.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
            <Link
              href="/admin/studio"
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Palette className="w-4 h-4" />
              <span>Open Standee Studio</span>
            </Link>
          </div>
        </div>

        {/* Master Shop Directory Table with Live Search & Actions */}
        <ShopDirectoryTable initialStandees={standees} appBaseUrl={baseUrl} />

      </main>
    </div>
  );
}
