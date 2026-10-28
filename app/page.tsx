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
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Calendar,
  Settings2,
  X,
  Cloud,
  Database,
  Sun,
  Moon,
  ChevronDown,
} from 'lucide-react';

export default function MinimalIssueHubPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedFilterPPIC, setSelectedFilterPPIC] = useState<PPICId | 'ALL'>('ALL');
  const [isCloudActive, setIsCloudActive] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Card Expansion State for Long Issue Texts
  const [expandedIssueIds, setExpandedIssueIds] = useState<Set<string>>(new Set());

  const toggleExpandIssue = (id: string) => {
    setExpandedIssueIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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

  // Theme Sync on Mount
  useEffect(() => {
    try {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    } catch {}
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('ppic_theme', nextTheme);
    } catch {}
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

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

  // 1. Unresolved Issues (Pinned, with live elapsed duration)
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

  const numWeeks = useMemo(() => Math.ceil(calendarDays.length / 7), [calendarDays]);

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
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col bg-slate-100 dark:bg-[#090A0F] text-slate-900 dark:text-[#F5F5F7] font-sans transition-colors duration-200">
      <div className="w-full max-w-[1600px] mx-auto p-2.5 sm:p-4 flex flex-col flex-1 min-h-0 gap-2.5 sm:gap-3">
        {/* UNIFIED TOP BAR (SOLID TAB BAR: BRAND + TABS + EDIT NAMES + THEME) */}
        <header className="bg-white dark:bg-[#12131A] border border-slate-200 dark:border-white/10 rounded-2xl px-3 sm:px-4 py-2 flex items-center justify-between gap-2.5 sm:gap-4 shrink-0 shadow-xs">
          {/* Brand & Status Icon */}
          <div className="flex items-center gap-2 shrink-0">
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              PPIC Issue Hub
            </h1>
            {isCloudActive ? (
              <span
                title="Cloud Sync Active (Supabase)"
                className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 shrink-0"
              >
                <Cloud className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </span>
            ) : (
              <span
                title="Local Storage Mode"
                className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/50 border border-slate-300 dark:border-white/10 shrink-0"
              >
                <Database className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </span>
            )}
          </div>

          {/* Unified Tabs Row: All, PPIC 1..5, and Edit Names (Same Line) */}
          <div className="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 p-1 rounded-xl flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-w-0 max-w-full">
            <button
              onClick={() => setSelectedFilterPPIC('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
                selectedFilterPPIC === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-black font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10'
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
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
                    active
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-black font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10'
                  }`}
                  title={ppicNames[key]}
                >
                  {ppicNames[key]}
                </button>
              );
            })}

            {/* Edit Names in the SAME LINE with the names */}
            <div className="h-4 w-px bg-slate-300/80 dark:bg-white/10 mx-1 shrink-0" />
            <button
              type="button"
              onClick={() => {
                setTempNames(ppicNames);
                setIsEditNamesOpen(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10 transition-colors shrink-0"
              title="Edit names for the 5 PPICs"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Edit Names</span>
            </button>
          </div>

          {/* Right: Mode Switcher */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-slate-700 dark:text-white/80 border border-slate-300/70 dark:border-white/10 transition-colors shadow-2xs"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700" />
              )}
            </button>
          </div>
        </header>

        {/* RESPONSIVE FULL WIDTH & AUTOFIT HEIGHT WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3 flex-1 min-h-0">
          {/* LEFT COLUMN: QUICK ADD + CALENDAR VIEW (8 of 12 on desktop) */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-2.5 sm:gap-3 min-h-0 h-full">
            {/* QUICK 1-ROW ADD ISSUE FORM */}
            <section className="bg-white dark:bg-[#12131A] border border-slate-200 dark:border-white/10 rounded-2xl p-2.5 sm:p-3 shrink-0 shadow-xs">
              <form onSubmit={handleAddIssue} className="flex flex-col sm:flex-row items-center gap-2">
                <select
                  value={newPpic}
                  onChange={(e) => setNewPpic(e.target.value as PPICId)}
                  className="w-full sm:w-44 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-black/60 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-500 dark:focus:border-white/40 truncate shadow-2xs"
                >
                  {PPIC_KEYS.map((k) => (
                    <option key={k} value={k} className="bg-white text-slate-900 dark:bg-black dark:text-white">
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
                  className="w-full flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/[0.05] border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:border-slate-500 dark:focus:border-white/40 shadow-2xs"
                />

                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full sm:w-36 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-black/60 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-500 dark:focus:border-white/40 shadow-2xs"
                />

                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-black dark:hover:bg-white/90 text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Issue</span>
                </button>
              </form>
            </section>

            {/* MONTHLY CALENDAR VIEW (AUTOFIT HEIGHT ON DESKTOP) */}
            <section className="bg-white dark:bg-[#12131A] border border-slate-200 dark:border-white/10 rounded-2xl p-3 sm:p-4 flex-1 min-h-0 flex flex-col gap-2 shadow-xs">
              <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500 dark:text-white/50" />
                  <h2 className="text-xs sm:text-sm font-semibold tracking-tight text-slate-900 dark:text-white/90">
                    Monthly Calendar View
                  </h2>
                </div>

                {/* Month Switcher */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-0.5">
                  <button
                    onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                    className="p-1 rounded-lg text-slate-600 hover:text-slate-900 dark:text-white/60 dark:hover:text-white transition-colors"
                    title="Previous month"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white px-2.5 capitalize min-w-[110px] text-center">
                    {monthName}
                  </span>
                  <button
                    onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                    className="p-1 rounded-lg text-slate-600 hover:text-slate-900 dark:text-white/60 dark:hover:text-white transition-colors"
                    title="Next month"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Weekday Labels (English) */}
              <div className="grid grid-cols-7 text-center text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-white/30 uppercase shrink-0 pb-0.5">
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
                <div>Sun</div>
              </div>

              {/* Days Grid: Expands evenly to fit remaining height on desktop */}
              <div
                className="grid grid-cols-7 gap-1 sm:gap-1.5 flex-1 min-h-0"
                style={{
                  gridTemplateRows: `repeat(${numWeeks}, minmax(0, 1fr))`,
                }}
              >
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
                      className={`min-h-[50px] lg:min-h-0 h-full p-1.5 sm:p-2 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        isSelected
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-black border-slate-900 dark:border-white shadow-md scale-[1.01]'
                          : cell.isCurrentMonth
                          ? 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 hover:bg-slate-100 hover:border-slate-300 dark:hover:bg-white/[0.05] text-slate-800 dark:text-white'
                          : 'opacity-20 border-transparent text-slate-400 dark:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] sm:text-xs font-semibold">{cell.dayNum}</span>
                        {dayIssues.length > 0 && (
                          <span
                            className={`text-[9px] font-mono px-1 rounded-full ${
                              isSelected
                                ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black font-bold'
                                : hasUnresolved
                                ? 'bg-red-500/15 text-red-600 dark:text-red-300 dark:bg-red-500/20 font-semibold'
                                : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white/60'
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
                                ? 'bg-white dark:bg-black'
                                : hasUnresolved
                                ? 'bg-red-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: UNRESOLVED ISSUES + SELECTED DATE (4 of 12 on desktop, split 50/50 in height) */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-2.5 sm:gap-3 min-h-0 h-full">
            {/* UNRESOLVED ISSUES (INTERNAL SCROLL, NO WINDOW SCROLL) */}
            <section className="bg-white dark:bg-[#12131A] border border-slate-200 dark:border-white/10 rounded-2xl p-3 sm:p-3.5 flex-1 min-h-0 flex flex-col gap-2 shadow-xs">
              <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-200/70 dark:border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <h2 className="font-semibold text-slate-900 dark:text-white/90">Unresolved Issues</h2>
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold">
                    {unresolvedIssues.length}
                  </span>
                </div>
              </div>

              {unresolvedIssues.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 text-center font-medium">
                  ✓ All issues resolved. Great job!
                </div>
              ) : (
                <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 [scrollbar-width:thin]">
                  {unresolvedIssues.map((issue) => {
                    const time = getElapsedTime(issue.createdAt);
                    const isExpanded = expandedIssueIds.has(issue.id);

                    return (
                      <div
                        key={issue.id}
                        onClick={() => toggleExpandIssue(issue.id)}
                        className={`group p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.05] border transition-all shadow-2xs cursor-pointer select-none ${
                          isExpanded
                            ? 'border-slate-400/80 dark:border-white/25 bg-slate-100/80 dark:bg-white/[0.04] shadow-xs'
                            : 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
                        }`}
                        title="Klik untuk membuka / menutup seluruh teks issue"
                      >
                        {/* Top row: PPIC Tag + Chevron (left) & Duration + Actions (right) */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white/80 w-fit shrink-0">
                              {ppicNames[issue.ppic] || issue.ppic}
                            </span>
                            <span className="text-slate-400 dark:text-white/30 group-hover:text-slate-700 dark:group-hover:text-white/70 transition-colors">
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                  isExpanded ? 'rotate-180 text-slate-900 dark:text-white' : ''
                                }`}
                              />
                            </span>
                          </div>

                          <div
                            className="flex items-center gap-2 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                time.isOverdue
                                  ? 'text-red-600 bg-red-500/15 dark:text-red-400 dark:bg-red-500/10 font-semibold'
                                  : 'text-slate-500 dark:text-white/40'
                              }`}
                            >
                              {time.text}
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStatus(issue.id);
                              }}
                              className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white/10 dark:hover:bg-white dark:text-white dark:hover:text-black font-semibold transition-all shadow-2xs active:scale-95"
                            >
                              Resolve
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(issue.id);
                              }}
                              className="p-1 text-slate-400 hover:text-red-600 dark:text-white/20 dark:hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Title: Truncated when collapsed, Fully wrapped text when expanded */}
                        <div className="mt-1.5">
                          <p
                            className={`text-xs font-medium text-slate-900 dark:text-white/90 ${
                              isExpanded
                                ? 'break-words whitespace-normal leading-relaxed select-text'
                                : 'truncate'
                            }`}
                          >
                            {issue.title}
                          </p>

                          {isExpanded && (
                            <div className="mt-2 pt-2 border-t border-slate-200/70 dark:border-white/10 flex items-center justify-between text-[10px] text-slate-400 dark:text-white/40">
                              <span>Tanggal issue: {formatEnglishDate(issue.date)}</span>
                              <span className="text-slate-400 dark:text-white/40 font-medium">Klik untuk menutup ▲</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* SELECTED DATE ISSUES LIST (INTERNAL SCROLL, NO WINDOW SCROLL) */}
            <section className="bg-white dark:bg-[#12131A] border border-slate-200 dark:border-white/10 rounded-2xl p-3 sm:p-3.5 flex-1 min-h-0 flex flex-col gap-2 shadow-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/70 dark:border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-white/50" />
                  <h3 className="text-xs font-semibold text-slate-900 dark:text-white/90">
                    Issues for {formatEnglishDate(selectedDateKey)}
                  </h3>
                </div>
                <span className="text-xs text-slate-500 dark:text-white/40 font-mono font-medium">
                  {selectedDateIssues.length} issue{selectedDateIssues.length !== 1 ? 's' : ''}
                </span>
              </div>

              {selectedDateIssues.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-3 text-xs text-slate-400 dark:text-white/40 italic text-center">
                  No issues recorded for this date.
                </div>
              ) : (
                <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 [scrollbar-width:thin]">
                  {selectedDateIssues.map((issue) => {
                    const isDone = issue.status === 'SELESAI';
                    const isExpanded = expandedIssueIds.has(issue.id);

                    return (
                      <div
                        key={issue.id}
                        onClick={() => toggleExpandIssue(issue.id)}
                        className={`group p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border transition-all shadow-2xs cursor-pointer select-none ${
                          isExpanded
                            ? 'border-slate-400/80 dark:border-white/25 bg-slate-100/80 dark:bg-white/[0.04] shadow-xs'
                            : 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
                        }`}
                        title="Klik untuk membuka / menutup seluruh teks issue"
                      >
                        {/* Top row: PPIC Tag + Chevron (left) & Actions (right) */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white/80 w-fit shrink-0 truncate max-w-[140px]">
                              {ppicNames[issue.ppic] || issue.ppic}
                            </span>
                            <span className="text-slate-400 dark:text-white/30 group-hover:text-slate-700 dark:group-hover:text-white/70 transition-colors">
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                  isExpanded ? 'rotate-180 text-slate-900 dark:text-white' : ''
                                }`}
                              />
                            </span>
                          </div>

                          <div
                            className="flex items-center gap-1.5 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStatus(issue.id);
                              }}
                              className={`text-[11px] font-medium px-2 py-0.5 rounded-lg border transition-all active:scale-95 ${
                                isDone
                                  ? 'bg-slate-200/60 text-slate-600 border-slate-300 dark:bg-white/5 dark:text-white/40 dark:border-white/10 hover:text-slate-900 dark:hover:text-white'
                                  : 'bg-slate-900 text-white border-transparent hover:bg-slate-800 dark:bg-white/10 dark:text-white dark:border-white/20 dark:hover:bg-white dark:hover:text-black font-semibold'
                              }`}
                            >
                              {isDone ? 'Reopen' : 'Resolve'}
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(issue.id);
                              }}
                              className="p-1 text-slate-400 hover:text-red-600 dark:text-white/30 dark:hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Title: Truncated when collapsed, Fully wrapped text when expanded */}
                        <div className="mt-1.5">
                          <p
                            className={`text-xs font-medium ${
                              isDone ? 'line-through text-slate-400 dark:text-white/30' : 'text-slate-900 dark:text-white/90'
                            } ${
                              isExpanded
                                ? 'break-words whitespace-normal leading-relaxed select-text'
                                : 'truncate'
                            }`}
                          >
                            {issue.title}
                          </p>

                          {isExpanded && (
                            <div className="mt-2 pt-2 border-t border-slate-200/70 dark:border-white/10 flex items-center justify-between text-[10px] text-slate-400 dark:text-white/40">
                              <span>
                                {isDone && issue.resolvedAt
                                  ? `Resolved: ${new Date(issue.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                  : `Status: ${issue.status === 'SELESAI' ? 'Selesai' : 'Belum Selesai'}`}
                              </span>
                              <span className="text-slate-400 dark:text-white/40 font-medium">Klik untuk menutup ▲</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>

        {/* MODAL: EDIT 5 PPIC NAMES */}
        {isEditNamesOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-slate-900/60 dark:bg-black/85 transition-opacity"
              onClick={() => setIsEditNamesOpen(false)}
            />

            <div className="relative w-full max-w-md bg-white dark:bg-[#12131A] border border-slate-200 dark:border-white/15 rounded-3xl p-6 shadow-2xl z-10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-slate-600 dark:text-white/70" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Edit 5 PPIC Names</h3>
                </div>
                <button
                  onClick={() => setIsEditNamesOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-white/40 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSavePpicNames} className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-white/50">
                  Customize department, material, or PIC labels for each PPIC unit:
                </p>

                {PPIC_KEYS.map((key) => (
                  <div key={key} className="space-y-1">
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-white/60">
                      Original Label: <span className="text-slate-900 dark:text-white/90 font-semibold">{key}</span>
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.05] border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-500 dark:focus:border-white/40"
                    />
                  </div>
                ))}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200/80 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => setIsEditNamesOpen(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white/60 text-xs font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-white/90 text-xs font-semibold shadow transition-all"
                    >
                      Save Changes
                    </button>
                  </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
