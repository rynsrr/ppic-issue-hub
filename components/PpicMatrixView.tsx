'use client';

import React from 'react';
import { Issue, PPIC_LIST } from '@/types/issue';
import { getElapsedTimeDetailed, formatDateIndo } from '@/lib/utils';
import { Clock, CheckCircle2, AlertCircle, Plus, User } from 'lucide-react';

interface PpicMatrixViewProps {
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
  onAddNewIssueForPpic: (ppicId: string) => void;
}

export const PpicMatrixView: React.FC<PpicMatrixViewProps> = ({
  issues,
  onSelectIssue,
  onAddNewIssueForPpic,
}) => {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
            Matriks Distribusi 5 PPIC
          </h2>
          <p className="text-xs text-white/50">
            Pemantauan beban kerja dan status kendala harian per departemen PPIC
          </p>
        </div>
      </div>

      {/* 5 PPIC Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {PPIC_LIST.map((ppic) => {
          const ppicIssues = issues.filter((i) => i.ppicId === ppic.id);
          const unresolved = ppicIssues.filter((i) => i.status !== 'RESOLVED');
          const resolved = ppicIssues.filter((i) => i.status === 'RESOLVED');

          return (
            <div
              key={ppic.id}
              className="glass-panel rounded-3xl p-4 flex flex-col justify-between border border-white/10"
            >
              {/* Column Header */}
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: ppic.color }}
                    />
                    <span className="font-bold text-sm text-white">{ppic.code}</span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/80">
                    {ppicIssues.length} total
                  </span>
                </div>

                <div className="mt-2.5 mb-3">
                  <p className="text-xs font-semibold text-white/90 line-clamp-1">{ppic.name.split('-')[1]?.trim()}</p>
                  <p className="text-[11px] text-white/50 flex items-center gap-1 mt-0.5">
                    <User className="w-3 h-3" /> PIC: {ppic.picName}
                  </p>
                </div>

                {/* Status KPI mini chips */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="p-2 rounded-xl bg-red-950/20 border border-red-500/20 text-center">
                    <span className="text-[10px] text-red-300/70 block">Belum Selesai</span>
                    <span className="text-sm font-bold text-red-400">{unresolved.length}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-center">
                    <span className="text-[10px] text-emerald-300/70 block">Selesai</span>
                    <span className="text-sm font-bold text-emerald-400">{resolved.length}</span>
                  </div>
                </div>

                {/* List of Issue items */}
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {ppicIssues.length === 0 ? (
                    <div className="text-center py-8 text-white/30 text-xs">
                      Tidak ada isu
                    </div>
                  ) : (
                    ppicIssues.map((issue) => {
                      const timeInfo = getElapsedTimeDetailed(issue.createdAt);
                      const isUnresolved = issue.status !== 'RESOLVED';

                      return (
                        <div
                          key={issue.id}
                          onClick={() => onSelectIssue(issue)}
                          className={`p-3 rounded-2xl glass-card border transition-all cursor-pointer hover:scale-102 ${
                            isUnresolved
                              ? timeInfo.urgencyLevel === 'critical'
                                ? 'border-red-500/40 bg-red-950/15'
                                : 'border-white/15'
                              : 'border-white/5 opacity-70'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] mb-1">
                            <span
                              className={`px-1.5 py-0.5 rounded font-semibold ${
                                issue.priority === 'CRITICAL'
                                  ? 'text-red-400 bg-red-500/20'
                                  : 'text-amber-400 bg-amber-500/20'
                              }`}
                            >
                              {issue.priority}
                            </span>

                            {isUnresolved ? (
                              <span className="text-white/60 font-mono">{timeInfo.shortText}</span>
                            ) : (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            )}
                          </div>

                          <h5 className="text-xs font-semibold text-white line-clamp-2 leading-tight">
                            {issue.title}
                          </h5>

                          <p className="text-[10px] text-white/40 mt-1 truncate">
                            {formatDateIndo(issue.createdAt)}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Bottom Add Button */}
              <button
                type="button"
                onClick={() => onAddNewIssueForPpic(ppic.id)}
                className="mt-3 w-full py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Isu</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
