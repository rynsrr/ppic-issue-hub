'use client';

import React, { useState, useEffect } from 'react';
import { Issue, PPIC_LIST } from '@/types/issue';
import { getElapsedTimeDetailed, formatDateIndo } from '@/lib/utils';
import { AlertTriangle, Clock, CheckCircle2, ArrowRight, Flame, ShieldAlert, Sparkles, ChevronRight } from 'lucide-react';

interface UnresolvedHeroShelfProps {
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
  onQuickResolve: (issueId: string) => void;
  onToggleStatus: (issueId: string) => void;
}

export const UnresolvedHeroShelf: React.FC<UnresolvedHeroShelfProps> = ({
  issues,
  onSelectIssue,
  onQuickResolve,
  onToggleStatus,
}) => {
  // Filter for unresolved issues (OPEN or IN_PROGRESS)
  const unresolvedIssues = issues.filter(
    (issue) => issue.status === 'OPEN' || issue.status === 'IN_PROGRESS'
  );

  // Sort unresolved issues by longest duration first (oldest createdAt) or critical priority
  const sortedUnresolved = [...unresolvedIssues].sort((a, b) => {
    if (a.priority === 'CRITICAL' && b.priority !== 'CRITICAL') return -1;
    if (b.priority === 'CRITICAL' && a.priority !== 'CRITICAL') return 1;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  // Re-render tick every 30 seconds to keep live timers accurate
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((prev) => prev + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  if (sortedUnresolved.length === 0) {
    return (
      <div className="w-full glass-card rounded-3xl p-6 md:p-8 border border-emerald-500/20 bg-gradient-to-r from-emerald-950/30 via-black/40 to-emerald-950/20 flex items-center justify-between shadow-glow-green">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Semua Isu 5 PPIC Telah Selesai!</h3>
            <p className="text-xs text-emerald-300/80">
              Tidak ada isu operasional yang tertunda. Seluruh line berjalan sesuai rencana produksi.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="w-full space-y-4">
      {/* Upper Shelf Title Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-ping absolute -top-0.5 -right-0.5 opacity-75"></div>
            <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-bold tracking-tight text-white">
                Isu Belum Selesai & Durasi Berjalan
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-semibold">
                {sortedUnresolved.length} Menunggu Tindakan
              </span>
            </div>
            <p className="text-xs text-white/50">
              Prioritas tertinggi dipantau secara langsung berdasarkan elapsed time (durasi sejak dilaporkan).
            </p>
          </div>
        </div>
      </div>

      {/* Apple TV Horizontal Cards Carousel / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedUnresolved.map((issue) => {
          const ppic = PPIC_LIST.find((p) => p.id === issue.ppicId) || PPIC_LIST[0];
          const timeInfo = getElapsedTimeDetailed(issue.createdAt);

          return (
            <div
              key={issue.id}
              onClick={() => onSelectIssue(issue)}
              className={`group relative glass-card rounded-3xl p-5 cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
                timeInfo.urgencyLevel === 'critical'
                  ? 'border-red-500/40 bg-gradient-to-b from-red-950/20 via-black/40 to-black/60 shadow-glow-red/20'
                  : timeInfo.urgencyLevel === 'warning'
                  ? 'border-amber-500/40 bg-gradient-to-b from-amber-950/20 via-black/40 to-black/60'
                  : 'border-white/10'
              }`}
            >
              {/* Top Accent Gradient Bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: ppic.color }}
              />

              {/* Card Header: PPIC Badge & Elapsed Time */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5"
                  style={{
                    backgroundColor: `${ppic.color}22`,
                    borderColor: `${ppic.color}44`,
                    color: ppic.color,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ppic.color }} />
                  {ppic.code}
                </span>

                {/* Live Elapsed Time Indicator (The user requested plus waktunya) */}
                <div
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-mono font-medium ${
                    timeInfo.urgencyLevel === 'critical'
                      ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                      : timeInfo.urgencyLevel === 'warning'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-white/10 text-white/80 border-white/15'
                  }`}
                  title={`Dilaporkan pada: ${formatDateIndo(issue.createdAt, true)}`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{timeInfo.text}</span>
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="font-semibold text-sm md:text-base text-white group-hover:text-blue-300 transition-colors line-clamp-2 mb-2 leading-snug">
                {issue.title}
              </h3>

              <p className="text-xs text-white/60 line-clamp-2 mb-4 leading-relaxed">
                {issue.description}
              </p>

              {/* Metadata details: Reporter, Status & Priority */}
              <div className="flex items-center justify-between text-xs pt-3 border-t border-white/[0.08] text-white/50">
                <div className="flex items-center gap-2">
                  <span className="truncate max-w-[120px]">PIC: {issue.assignedTo}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${
                      issue.priority === 'CRITICAL'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : issue.priority === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {issue.priority}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                      issue.status === 'IN_PROGRESS'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    }`}
                  >
                    {issue.status === 'IN_PROGRESS' ? 'Sedang Diproses' : 'Belum Mulai'}
                  </span>
                </div>
              </div>

              {/* Quick Actions overlay on hover */}
              <div className="mt-3.5 pt-2 flex items-center justify-between gap-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStatus(issue.id);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-white/80 transition-colors"
                >
                  {issue.status === 'OPEN' ? 'Mulai Kerjakan' : 'Kembalikan ke Open'}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickResolve(issue.id);
                    }}
                    className="flex items-center gap-1 text-[11px] font-medium px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Selesaikan</span>
                  </button>
                  <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
