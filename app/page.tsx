'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Issue, PPICId, PPIC_KEYS } from '@/types/issue';
import {
  getIssues,
  addIssue,
  updateIssueStatus,
  removeIssue,
  getPpicNames,
  savePpicNames,
} from '@/lib/dataService';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { PPICNamesMap, DEFAULT_PPIC_NAMES } from '@/lib/storage';
import { getElapsedTime, formatDateKey, formatEnglishDate } from '@/lib/utils';
import {
  Clock,
  Check,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Calendar,
  Settings2,
  X,
  RotateCcw,
  Cloud,
  Database,
} from 'lucide-react';

export default function MinimalIssueHubPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedFilterPPIC, setSelectedFilterPPIC] = useState<PPICId | 'ALL'>('ALL');
  const [isCloudActive, setIsCloudActive] = useState<boolean>(false);

  // Customizable PPIC Names
  const [ppicNames, setPpicNames] = useState<PPICNamesMap>(DEFAULT_PPIC_NAMES);
  const [isEditNamesOpen, setIsEditNamesOpen] = useState(false);
  const [tempNames, setTempNames] = useState<PPICNamesMap>(DEFAULT_PPIC_NAMES);

  // Month navigation: default October 2026
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date(2026, 9, 1));
  const [selectedDateKey, setSelectedDateKey] = useState<string>('2026-10-27');

  // Quick 1-row input
  const [newTitle, setNewTitle] = useState('');
  const [newPpic, setNewPpic] = useState<PPICId>('PPIC 1');
  const [newDate, setNewDate] = useState('2026-10-27');

  // Load data function
  const refreshData = async () => {
    const [fetchedIssues, fetchedNames] = await Promise.all([
      getIssues(),
      getPpicNames(),
    ]);
    setIssues(fetchedIssues);
    setPpicNames(fetchedNames);
    setTempNames(fetchedNames);
  };

  // Live timer tick every 30s & Realtime Subscription
  const [, setTick] = useState(0);
  useEffect(() => {
    setIsCloudActive(isSupabaseConfigured());
    refreshData();

    // Setup Supabase Realtime when connected
    if (isSupabaseConfigured() && supabase) {
      const channel = supabase
        .channel('realtime:all')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'issues' },
          () => {
            getIssues().then(setIssues);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'ppic_names' },
          () => {
            getPpicNames().then((names) => {
              setPpicNames(names);
              setTempNames(names);
            });
          }
        )
        .subscribe();

      return () => {
        if (supabase) {
          supabase.removeChannel(channel);
        }
      };
    }

    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  // Add issue
  const handleAddIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created: Issue = {
      id: `ISS-${Date.now().toString().slice(-5)}`,
      ppic: newPpic,
      title: newTitle.trim(),
      date: newDate,
      status: 'BELUM_SELESAI',
      createdAt: new Date().toISOString(),
    };

    // Optimistic UI update
    setIssues((prev) => [created, ...prev]);
    setNewTitle('');
    setSelectedDateKey(newDate);

    // Save to service (Supabase & LocalStorage)
    await addIssue(created);
  };

  // 1-Click resolve / toggle
  const handleToggleStatus = async (id: string) => {
    const target = issues.find((i) => i.id === id);
    if (!target) return;

    const isDone = target.status === 'SELESAI';
    const nextStatus = isDone ? 'BELUM_SELESAI' : 'SELESAI';
    const nextResolvedAt = isDone ? null : new Date().toISOString();

    setIssues((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: nextStatus, resolvedAt: nextResolvedAt }
          : item
      )
    );

    await updateIssueStatus(id, nextStatus, nextResolvedAt);
  };

  // Delete
  const handleDelete = async (id: string) => {
    setIssues((prev) => prev.filter((i) => i.id !== id));
    await removeIssue(id);
  };

  // Save custom PPIC names
  const handleSavePpicNames = async (e: React.FormEvent) => {
    e.preventDefault();
    setPpicNames(tempNames);
    setIsEditNamesOpen(false);
    await savePpicNames(tempNames);
  };

  // Reset custom PPIC names to defaults
  const handleResetNames = () => {
    setTempNames(DEFAULT_PPIC_NAMES);
  };

  // 1. Unresolved Issues (Pinned on Top, with live elapsed duration)
  const unresolvedIssues = useMemo(() => {
    return issues
      .filter((i) => i.status === 'BELUM_SELESAI')
      .filter((i) => selectedFilterPPIC === 'ALL' || i.ppic === selectedFilterPPIC)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [issues, selectedFilterPPIC]);

  // 2. Month Calendar calculation
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const monthName = currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDay = firstDay.getDay(); // 0: Sun, 1: Mon
    if (startDay === 0) startDay = 7; // Convert to Mon=1 ... Sun=7

    const totalDays = lastDay.getDate();
    const days: { dateKey: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i > 0; i--) {
      const d = prevMonthLastDate - i + 1;
      const prevD = new Date(year, month - 1, d);
      days.push({ dateKey: formatDateKey(prevD), dayNum: d, isCurrentMonth: false });
    }

    for (let d = 1; d <= totalDays; d++) {
      const curD = new Date(year, month, d);
      days.push({ dateKey: formatDateKey(curD), dayNum: d, isCurrentMonth: true });
    }

    const remaining = 35 - days.length > 0 ? 35 - days.length : 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextD = new Date(year, month + 1, d);
      days.push({ dateKey: formatDateKey(nextD), dayNum: d, isCurrentMonth: false });
    }

    return days;
  }, [year, month]);

  // Issues grouped by date
  const issuesByDate = useMemo(() => {
    const map = new Map<string, Issue[]>();
    for (const issue of issues) {
      if (selectedFilterPPIC !== 'ALL' && issue.ppic !== selectedFilterPPIC) continue;
      const list = map.get(issue.date) || [];
      list.push(issue);
      map.set(issue.date, list);
    }
    return map;
  }, [issues, selectedFilterPPIC]);

  // Selected date issues
  const selectedDateIssues = useMemo(() => {
    const list = issues.filter((i) => i.date === selectedDateKey);
    return selectedFilterPPIC === 'ALL'
      ? list
      : list.filter((i) => i.ppic === selectedFilterPPIC);
  }, [issues, selectedDateKey, selectedFilterPPIC]);

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 md:p-10 font-sans selection:bg-white selection:text-black">
      <div className="max-w-4xl mx-auto space-y-7">
        {/* HEADER */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-white">PPIC Issue Hub</h1>
              {isCloudActive ? (
                <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-emerald-300 border border-emerald-500/30">
                  <Cloud className="w-3 h-3" /> Cloud Sync
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-white/50 border border-white/10">
                  <Database className="w-3 h-3" /> Local Storage
                </span>
              )}
            </div>
            <p className="text-xs text-white/40 mt-0.5">5 PPIC Operations &middot; Monthly Issue Tracker</p>
          </div>

          {/* Filter Pills + Edit Names Trigger */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-white/[0.06] p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setSelectedFilterPPIC('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedFilterPPIC === 'ALL'
                    ? 'bg-white text-black font-semibold shadow'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                All
              </button>
              {PPIC_KEYS.map((key) => {
                const active = selectedFilterPPIC === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedFilterPPIC(key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all truncate max-w-[140px] ${
                      active
                        ? 'bg-white text-black font-semibold shadow'
                        : 'text-white/60 hover:text-white'
                    }`}
                    title={ppicNames[key]}
                  >
                    {ppicNames[key]}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                setTempNames(ppicNames);
                setIsEditNamesOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-medium text-white/70 hover:text-white border border-white/10 transition-colors"
              title="Edit names for the 5 PPICs"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Edit Names</span>
            </button>
          </div>
        </header>

        {/* SECTION 1: UNRESOLVED ISSUES (COMPACT & MINIMALIST) */}
        <section className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-white/90">Unresolved Issues</h2>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                {unresolvedIssues.length}
              </span>
            </div>
          </div>

          {unresolvedIssues.length === 0 ? (
            <div className="py-2.5 px-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white/40">
              All issues resolved.
            </div>
          ) : (
            <div className="space-y-1.5">
              {unresolvedIssues.map((issue) => {
                const time = getElapsedTime(issue.createdAt);

                return (
                  <div
                    key={issue.id}
                    className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/15 transition-all"
                  >
                    {/* Left: PPIC Tag + Title */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/10 text-white/80 shrink-0">
                        {ppicNames[issue.ppic] || issue.ppic}
                      </span>
                      <p className="text-xs text-white/90 truncate">
                        {issue.title}
                      </p>
                    </div>

                    {/* Right: Elapsed Duration + Resolve Button */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          time.isOverdue
                            ? 'text-red-400 bg-red-500/10'
                            : 'text-white/40'
                        }`}
                      >
                        {time.text}
                      </span>

                      <button
                        onClick={() => handleToggleStatus(issue.id)}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white text-white hover:text-black font-medium transition-all"
                      >
                        Resolve
                      </button>

                      <button
                        onClick={() => handleDelete(issue.id)}
                        className="p-1 text-white/20 hover:text-white transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* SECTION 2: QUICK 1-ROW ADD ISSUE FORM */}
        <section className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
          <form onSubmit={handleAddIssue} className="flex flex-col sm:flex-row items-center gap-2">
            <select
              value={newPpic}
              onChange={(e) => setNewPpic(e.target.value as PPICId)}
              className="w-full sm:w-44 px-3 py-2 rounded-xl bg-black border border-white/15 text-xs text-white focus:outline-none focus:border-white/40 truncate"
            >
              {PPIC_KEYS.map((k) => (
                <option key={k} value={k} className="bg-black text-white">
                  {ppicNames[k]}
                </option>
              ))}
            </select>

            <input
              type="text"
              required
              placeholder="Describe PPIC issue or bottleneck..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full flex-1 px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/40"
            />

            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full sm:w-36 px-3 py-2 rounded-xl bg-black border border-white/15 text-xs text-white focus:outline-none focus:border-white/40"
            />

            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white text-black hover:bg-white/90 text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Issue</span>
            </button>
          </form>
        </section>

        {/* SECTION 3: MONTHLY CALENDAR VIEW */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-white/90">
              Monthly Calendar View
            </h2>

            {/* Month Switcher */}
            <div className="flex items-center gap-1 bg-white/[0.06] border border-white/10 rounded-xl p-0.5">
              <button
                onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                className="p-1.5 rounded-lg text-white/60 hover:text-white transition-colors"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium text-white px-3 capitalize min-w-[120px] text-center">
                {monthName}
              </span>
              <button
                onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                className="p-1.5 rounded-lg text-white/60 hover:text-white transition-colors"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/10 space-y-2">
            {/* Weekday Labels (English) */}
            <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-white/30 uppercase pb-1">
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
              <div>Sun</div>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((cell) => {
                const dayIssues = issuesByDate.get(cell.dateKey) || [];
                const isSelected = cell.dateKey === selectedDateKey;
                const hasUnresolved = dayIssues.some((i) => i.status === 'BELUM_SELESAI');

                return (
                  <button
                    key={cell.dateKey}
                    type="button"
                    onClick={() => {
                      setSelectedDateKey(cell.dateKey);
                      setNewDate(cell.dateKey);
                    }}
                    className={`min-h-[58px] sm:min-h-[64px] p-2 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'bg-white text-black border-white shadow'
                        : cell.isCurrentMonth
                        ? 'bg-white/[0.02] border-white/10 hover:bg-white/[0.06]'
                        : 'opacity-20 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{cell.dayNum}</span>
                      {dayIssues.length > 0 && (
                        <span
                          className={`text-[9px] font-mono px-1 rounded ${
                            isSelected
                              ? 'bg-black text-white font-semibold'
                              : hasUnresolved
                              ? 'bg-white/20 text-white font-semibold'
                              : 'bg-white/10 text-white/60'
                          }`}
                        >
                          {dayIssues.length}
                        </span>
                      )}
                    </div>

                    {/* Indicator Dot */}
                    <div className="flex items-center gap-1">
                      {dayIssues.length > 0 && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected
                              ? 'bg-black'
                              : hasUnresolved
                              ? 'bg-white'
                              : 'bg-white/40'
                          }`}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SELECTED DATE ISSUES LIST */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-white/50" />
              <h3 className="text-xs font-semibold text-white/80">
                Issues for {formatEnglishDate(selectedDateKey)}
              </h3>
              <span className="text-xs text-white/30 font-mono">
                ({selectedDateIssues.length})
              </span>
            </div>

            {selectedDateIssues.length === 0 ? (
              <p className="text-xs text-white/30 italic py-1">
                No issues recorded for this date.
              </p>
            ) : (
              <div className="space-y-1.5">
                {selectedDateIssues.map((issue) => {
                  const isDone = issue.status === 'SELESAI';

                  return (
                    <div
                      key={issue.id}
                      className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/10 text-white/80 border border-white/10 shrink-0 truncate max-w-[140px]">
                          {ppicNames[issue.ppic] || issue.ppic}
                        </span>
                        <p
                          className={`text-xs truncate ${
                            isDone ? 'line-through text-white/30' : 'text-white/90'
                          }`}
                        >
                          {issue.title}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleToggleStatus(issue.id)}
                          className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all ${
                            isDone
                              ? 'bg-white/5 text-white/40 border-white/10 hover:text-white'
                              : 'bg-white/10 text-white border-white/20 hover:bg-white hover:text-black'
                          }`}
                        >
                          {isDone ? 'Reopen' : 'Resolve'}
                        </button>

                        <button
                          onClick={() => handleDelete(issue.id)}
                          className="p-1 text-white/30 hover:text-white transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* MODAL: EDIT 5 PPIC NAMES */}
        {isEditNamesOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsEditNamesOpen(false)}
            />

            <div className="relative w-full max-w-md bg-[#0D0D11] border border-white/15 rounded-3xl p-6 shadow-2xl z-10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-white/70" />
                  <h3 className="text-sm font-semibold text-white">Edit 5 PPIC Names</h3>
                </div>
                <button
                  onClick={() => setIsEditNamesOpen(false)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSavePpicNames} className="space-y-3">
                <p className="text-xs text-white/50">
                  Customize department, material, or PIC labels for each PPIC unit:
                </p>

                {PPIC_KEYS.map((key) => (
                  <div key={key} className="space-y-1">
                    <label className="block text-[11px] font-medium text-white/60">
                      Original Label: <span className="text-white/90 font-semibold">{key}</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={tempNames[key] || ''}
                      onChange={(e) =>
                        setTempNames((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                      placeholder={`Name for ${key}`}
                      className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/15 text-xs text-white focus:outline-none focus:border-white/40"
                    />
                  </div>
                ))}

                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={handleResetNames}
                    className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Defaults</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditNamesOpen(false)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-xs font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-white text-black hover:bg-white/90 text-xs font-semibold shadow transition-all"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <footer className="pt-4 border-t border-white/5 text-center text-xs text-white/20">
          5 PPIC &middot; Minimalist Dark Edition &middot; Local Storage & Supabase Ready
        </footer>
      </div>
    </div>
  );
}
