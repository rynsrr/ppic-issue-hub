'use client';

import React from 'react';
import { Issue, PPIC_LIST } from '@/types/issue';
import { formatDateIndo, getElapsedTimeDetailed } from '@/lib/utils';
import { X, Plus, Calendar, CheckCircle2, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
  onAddNewIssueForDate: (dateStr: string) => void;
  onQuickResolve: (issueId: string) => void;
}

export const DayDetailModal: React.FC<DayDetailModalProps> = ({
  isOpen,
  onClose,
  date,
  issues,
  onSelectIssue,
  onAddNewIssueForDate,
  onQuickResolve,
}) => {
  if (!isOpen || !date) return null;

  const dateStr = formatDateIndo(date.toISOString());
  const isoDateKey = date.toISOString().slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl glass-panel rounded-3xl p-6 sm:p-8 border border-white/20 shadow-apple-hover z-10 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{dateStr}</h3>
              <p className="text-xs text-white/50">
                {issues.length} Isu Tercatat &middot; 5 PPIC Hub
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {issues.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-white/10">
              <CheckCircle2 className="w-10 h-10 text-emerald-400/50 mx-auto mb-2" />
              <p className="text-sm font-medium text-white/70">Tidak Ada Isu di Tanggal Ini</p>
              <p className="text-xs text-white/40 mt-1">
                Kondisi operasional normal tanpa kendala tercatat.
              </p>
            </div>
          ) : (
            issues.map((issue) => {
              const ppic = PPIC_LIST.find((p) => p.id === issue.ppicId);
              const timeInfo = getElapsedTimeDetailed(issue.createdAt);
              const isResolved = issue.status === 'RESOLVED';

              return (
                <div
                  key={issue.id}
                  onClick={() => onSelectIssue(issue)}
                  className={`glass-card rounded-2xl p-4 border transition-all cursor-pointer hover:scale-[1.01] ${
                    isResolved
                      ? 'border-white/5 opacity-80'
                      : 'border-white/15 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                      style={{
                        backgroundColor: `${ppic?.color || '#2997FF'}25`,
                        color: ppic?.color || '#2997FF',
                      }}
                    >
                      {ppic?.code || 'PPIC'} &middot; {ppic?.name.split('-')[1]}
                    </span>

                    <div className="flex items-center gap-2">
                      {!isResolved ? (
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            timeInfo.urgencyLevel === 'critical'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {timeInfo.text}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Selesai
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className="text-sm font-semibold text-white mb-1">{issue.title}</h4>
                  <p className="text-xs text-white/60 line-clamp-2 mb-3">{issue.description}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[11px] text-white/40">
                    <span>PIC: {issue.assignedTo}</span>
                    <div className="flex items-center gap-2">
                      {!isResolved && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onQuickResolve(issue.id);
                          }}
                          className="text-[11px] font-medium text-emerald-300 hover:text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/20 transition-colors"
                        >
                          Tandai Selesai
                        </button>
                      )}
                      <span className="flex items-center gap-1 text-blue-400 font-medium">
                        Detail <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-4">
          <button
            onClick={() => onAddNewIssueForDate(isoDateKey)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-xs font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Isu Tanggal Ini</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
