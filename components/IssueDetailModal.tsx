'use client';

import React, { useState } from 'react';
import { Issue, PPIC_LIST, IssueStatus, IssuePriority } from '@/types/issue';
import { formatDateIndo, getElapsedTimeDetailed } from '@/lib/utils';
import {
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  Tag,
  Shield,
  Trash2,
  Check,
  Send,
} from 'lucide-react';

interface IssueDetailModalProps {
  issue: Issue | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateIssue: (updated: Issue) => void;
  onDeleteIssue: (issueId: string) => void;
}

export const IssueDetailModal: React.FC<IssueDetailModalProps> = ({
  issue,
  isOpen,
  onClose,
  onUpdateIssue,
  onDeleteIssue,
}) => {
  const [resolutionNoteInput, setResolutionNoteInput] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  if (!isOpen || !issue) return null;

  const ppic = PPIC_LIST.find((p) => p.id === issue.ppicId) || PPIC_LIST[0];
  const timeInfo = getElapsedTimeDetailed(issue.createdAt);
  const isResolved = issue.status === 'RESOLVED';

  const handleStatusChange = (newStatus: IssueStatus) => {
    if (newStatus === 'RESOLVED') {
      setIsResolving(true);
      return;
    }

    onUpdateIssue({
      ...issue,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      resolvedAt: null,
    });
  };

  const handleConfirmResolve = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateIssue({
      ...issue,
      status: 'RESOLVED',
      updatedAt: new Date().toISOString(),
      resolvedAt: new Date().toISOString(),
      resolutionNote: resolutionNoteInput.trim() || 'Telah diselesaikan oleh tim terkait.',
    });
    setIsResolving(false);
    setResolutionNoteInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl glass-panel rounded-3xl p-6 sm:p-8 border border-white/20 shadow-apple-hover z-10 my-8">
        {/* PPIC Top Color Strip */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5 rounded-t-3xl"
          style={{ backgroundColor: ppic.color }}
        />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span
              className="text-xs font-bold px-3 py-1 rounded-xl border"
              style={{
                backgroundColor: `${ppic.color}20`,
                borderColor: `${ppic.color}40`,
                color: ppic.color,
              }}
            >
              {ppic.code} &middot; {ppic.focusArea}
            </span>
            <span className="text-xs text-white/40 font-mono">ID: {issue.id}</span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Elapsed Time or Resolved Banner */}
        <div className="mt-4">
          {!isResolved ? (
            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                timeInfo.urgencyLevel === 'critical'
                  ? 'bg-red-950/30 border-red-500/40 text-red-200'
                  : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 animate-spin-slow" />
                <div>
                  <span className="text-xs font-semibold block">
                    Durasi Isu Berjalan (Belum Selesai):
                  </span>
                  <span className="text-sm font-mono font-bold">{timeInfo.text}</span>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-black/40 border border-white/10">
                {timeInfo.urgencyLevel === 'critical' ? '🔴 Kritis (>24 Jam)' : '🟡 Sedang Berjalan'}
              </span>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl border border-emerald-500/40 bg-emerald-950/30 text-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <span className="text-xs font-semibold block">Status: Telah Diselesaikan</span>
                  <span className="text-xs text-emerald-300/80">
                    Selesai pada: {issue.resolvedAt ? formatDateIndo(issue.resolvedAt, true) : '-'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Title and Detail Description */}
        <div className="mt-5 space-y-3">
          <h2 className="text-xl font-bold text-white leading-tight">{issue.title}</h2>
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-white/80 text-sm leading-relaxed whitespace-pre-line">
            {issue.description}
          </div>
        </div>

        {/* Resolution Note if resolved */}
        {isResolved && issue.resolutionNote && (
          <div className="mt-4 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 text-xs">
            <span className="font-semibold block mb-1">Catatan Penyelesaian:</span>
            <p>{issue.resolutionNote}</p>
          </div>
        )}

        {/* Metadata Grid */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
            <span className="text-white/40 block mb-1">Prioritas</span>
            <span
              className={`font-bold uppercase ${
                issue.priority === 'CRITICAL'
                  ? 'text-red-400'
                  : issue.priority === 'HIGH'
                  ? 'text-amber-400'
                  : 'text-blue-400'
              }`}
            >
              {issue.priority}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
            <span className="text-white/40 block mb-1">Kategori</span>
            <span className="text-white font-medium truncate block">{issue.category}</span>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
            <span className="text-white/40 block mb-1">Pelapor</span>
            <span className="text-white font-medium truncate block">{issue.reporter}</span>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
            <span className="text-white/40 block mb-1">PIC Tindakan</span>
            <span className="text-white font-medium truncate block">{issue.assignedTo}</span>
          </div>
        </div>

        {/* Status Actions */}
        <div className="mt-6 pt-5 border-t border-white/10">
          <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
            Perbarui Status Penanganan Isu:
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleStatusChange('OPEN')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                issue.status === 'OPEN'
                  ? 'bg-yellow-500/30 text-yellow-200 border-yellow-500/50 shadow-md'
                  : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
              }`}
            >
              Belum Mulai (Open)
            </button>

            <button
              onClick={() => handleStatusChange('IN_PROGRESS')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                issue.status === 'IN_PROGRESS'
                  ? 'bg-blue-500/30 text-blue-200 border-blue-500/50 shadow-md'
                  : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
              }`}
            >
              Sedang Dikerjakan (In Progress)
            </button>

            <button
              onClick={() => handleStatusChange('RESOLVED')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                issue.status === 'RESOLVED'
                  ? 'bg-emerald-500/30 text-emerald-200 border-emerald-500/50 shadow-md'
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Tandai Selesai (Resolved)</span>
            </button>
          </div>
        </div>

        {/* Modal Resolution Input Sheet (if clicked resolve) */}
        {isResolving && (
          <form
            onSubmit={handleConfirmResolve}
            className="mt-4 p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-300">
                Tuliskan Tindakan / Solusi Akhir:
              </span>
              <button
                type="button"
                onClick={() => setIsResolving(false)}
                className="text-xs text-white/50 hover:text-white"
              >
                Batal
              </button>
            </div>
            <textarea
              rows={2}
              required
              placeholder="Contoh: Mesin extruder telah selesai kalibrasi bearing, line produksi berjalan normal kembali."
              value={resolutionNoteInput}
              onChange={(e) => setResolutionNoteInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white placeholder-white/40 text-xs focus:outline-none focus:border-emerald-400"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Konfirmasi Penyelesaian Isu</span>
              </button>
            </div>
          </form>
        )}

        {/* Footer with Delete and Close */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (confirm('Yakin ingin menghapus isu ini secara permanen?')) {
                onDeleteIssue(issue.id);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-2 rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Isu</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
