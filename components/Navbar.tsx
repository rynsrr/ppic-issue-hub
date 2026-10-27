'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, LayoutGrid, AlertCircle, Download, RotateCcw, Tv } from 'lucide-react';
import { formatDateIndo } from '@/lib/utils';

interface NavbarProps {
  currentTab: 'calendar' | 'matrix' | 'unresolved';
  setCurrentTab: (tab: 'calendar' | 'matrix' | 'unresolved') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenNewIssueModal: () => void;
  onExportData: () => void;
  onResetData: () => void;
  unresolvedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  searchQuery,
  setSearchQuery,
  onOpenNewIssueModal,
  onExportData,
  onResetData,
  unresolvedCount,
}) => {
  const [clock, setClock] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setClock(`${hours}:${minutes}:${seconds} WIB`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/[0.08] px-4 md:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Live Clock */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 border border-white/20 flex items-center justify-center shadow-lg backdrop-blur-md">
              <Tv className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base tracking-tight text-white">PPIC HUB</span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/10">
                  tvOS
                </span>
              </div>
              <p className="text-xs text-tv-textSecondary">
                5 PPIC Issue Management &middot; {formatDateIndo(new Date().toISOString())}
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-black/30 border border-white/10 text-xs text-white/70">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live: {clock}</span>
          </div>
        </div>

        {/* Tab Controls (Apple TV Segmented Bar) */}
        <div className="flex items-center p-1 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl w-full md:w-auto justify-center">
          <button
            onClick={() => setCurrentTab('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-all ${
              currentTab === 'calendar'
                ? 'bg-white text-black shadow-lg font-semibold'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Kalender Bulanan</span>
          </button>

          <button
            onClick={() => setCurrentTab('unresolved')}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-all ${
              currentTab === 'unresolved'
                ? 'bg-white text-black shadow-lg font-semibold'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            <span>Isu Terbuka</span>
            {unresolvedCount > 0 && (
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                currentTab === 'unresolved' ? 'bg-red-500 text-white' : 'bg-red-500/80 text-white'
              }`}>
                {unresolvedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('matrix')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-all ${
              currentTab === 'matrix'
                ? 'bg-white text-black shadow-lg font-semibold'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Matriks 5 PPIC</span>
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <div className="relative flex-1 md:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Cari isu, PIC, kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/30 transition-all"
            />
          </div>

          <button
            onClick={onExportData}
            title="Ekspor Data JSON"
            className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.14] border border-white/10 text-white/80 hover:text-white transition-all"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onResetData}
            title="Reset ke Data Sample"
            className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.14] border border-white/10 text-white/80 hover:text-white transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenNewIssueModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-medium text-xs md:text-sm shadow-glow-blue transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Isu</span>
          </button>
        </div>
      </div>
    </header>
  );
};
