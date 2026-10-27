'use client';

import React, { useState } from 'react';
import { PPIC_LIST, PPICId, IssuePriority, Issue } from '@/types/issue';
import { X, Plus, AlertCircle, Calendar, User, Tag, ShieldCheck } from 'lucide-react';
import { toDateKey } from '@/lib/utils';

interface NewIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddIssue: (newIssue: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>) => void;
  preselectedDate?: string;
}

export const NewIssueModal: React.FC<NewIssueModalProps> = ({
  isOpen,
  onClose,
  onAddIssue,
  preselectedDate,
}) => {
  const [selectedPPIC, setSelectedPPIC] = useState<PPICId>('ppic-1');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Keterlambatan Bahan');
  const [priority, setPriority] = useState<IssuePriority>('HIGH');
  const [reporter, setReporter] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [targetDate, setTargetDate] = useState(preselectedDate || toDateKey(new Date()));

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const currentPpic = PPIC_LIST.find((p) => p.id === selectedPPIC);

    onAddIssue({
      ppicId: selectedPPIC,
      title: title.trim(),
      description: description.trim() || 'Tidak ada deskripsi rinci.',
      category,
      priority,
      status: 'OPEN',
      reporter: reporter.trim() || currentPpic?.picName || 'Operator PPIC',
      assignedTo: assignedTo.trim() || 'Tim Terkait',
      targetDate,
    });

    // Reset fields
    setTitle('');
    setDescription('');
    onClose();
  };

  const categories = [
    'Keterlambatan Bahan',
    'Breakdown Mesin',
    'Stok Discrepancy',
    'Reject Kemasan',
    'Kapasitas Overload',
    'Distribusi & Logistik',
    'Kualitas & QC',
    'Lainnya',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Frosted Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card (Apple TV Glassmorphism Sheet) */}
      <div className="relative w-full max-w-2xl glass-panel rounded-3xl p-6 sm:p-8 border border-white/20 shadow-apple-hover z-10 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Input Isu PPIC Baru</h3>
              <p className="text-xs text-white/50">Laporkan kendala harian untuk salah satu dari 5 PPIC</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* 1. PPIC Selector (5 Visual Apple TV Tiles) */}
          <div>
            <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">
              Pilih Unit PPIC (1 - 5)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {PPIC_LIST.map((ppic) => {
                const isSelected = selectedPPIC === ppic.id;
                return (
                  <button
                    key={ppic.id}
                    type="button"
                    onClick={() => {
                      setSelectedPPIC(ppic.id);
                      if (!reporter) setReporter(ppic.picName);
                    }}
                    style={{
                      borderColor: isSelected ? ppic.color : 'rgba(255,255,255,0.1)',
                      backgroundColor: isSelected ? `${ppic.color}25` : 'rgba(255,255,255,0.03)',
                    }}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all hover:scale-102 ${
                      isSelected ? 'ring-2 shadow-lg' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-md"
                        style={{ backgroundColor: `${ppic.color}30`, color: ppic.color }}
                      >
                        {ppic.code}
                      </span>
                      <span className="text-[10px] text-white/40">{ppic.avatar}</span>
                    </div>
                    <p className="text-[11px] font-semibold text-white mt-2 leading-tight">
                      {ppic.focusArea.split(' ')[0]}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Title */}
          <div>
            <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-1.5">
              Judul Kendala / Isu <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Keterlambatan Truk Inbound Bahan Mentah PO #892"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-white/40 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all"
            />
          </div>

          {/* 3. Description */}
          <div>
            <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-1.5">
              Deskripsi Detail & Dampak Terhadap Produksi
            </label>
            <textarea
              rows={3}
              placeholder="Jelaskan akar masalah, lini produksi yang terdampak, atau perkiraan downtime..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-white/40 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all resize-none"
            />
          </div>

          {/* 4. Priority, Category, Target Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-1.5">
                Prioritas
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as IssuePriority)}
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-400"
              >
                <option value="CRITICAL">🔴 Critical (Downtime Segera)</option>
                <option value="HIGH">🟠 High (Urgent 24 Jam)</option>
                <option value="MEDIUM">🟡 Medium (Dapat Dijadwal)</option>
                <option value="LOW">🔵 Low (Minor / Pantau)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-1.5">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-400"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-1.5">
                Tanggal Terjadi
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-400"
              >
              </input>
            </div>
          </div>

          {/* 5. Reporter & Assigned Person */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-1.5">
                Pelapor / PIC Input
              </label>
              <input
                type="text"
                placeholder="Nama pelapor (contoh: Ahmad)"
                value={reporter}
                onChange={(e) => setReporter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-white/40 text-xs focus:outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-1.5">
                Ditugaskan Kepada (PIC Tindakan)
              </label>
              <input
                type="text"
                placeholder="Nama PIC / Bagian (contoh: Tim Maintenance)"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-white/40 text-xs focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-medium transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white text-xs font-semibold shadow-glow-blue transition-all active:scale-95"
            >
              Simpan Isu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
