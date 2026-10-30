'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Issue,
  PPICId,
  DepartmentConfig,
  DEFAULT_DEPARTMENTS,
  parseIssuePic,
  getDepartmentBadgeStyle,
} from '@/types/issue';
import {
  getIssues,
  addIssue,
  updateIssueStatus,
  removeIssue,
  getDepartments,
  saveDepartments,
} from '@/lib/dataService';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import {
  getElapsedTime,
  formatDateKey,
  formatEnglishDate,
  formatIndonesianDate,
} from '@/lib/utils';
import {
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Calendar,
  X,
  Cloud,
  Database,
  Sun,
  Moon,
  ChevronDown,
  Users,
  Filter,
  CheckCircle2,
  AlertCircle,
  ClipboardList,
  Check,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';

export default function DailyPlanAndReportPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [departments, setDepartments] = useState<DepartmentConfig[]>(DEFAULT_DEPARTMENTS);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedPerson, setSelectedPerson] = useState<string>('ALL');
  const [isCloudActive, setIsCloudActive] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Status Filter in Right Column: 'ALL' | 'BELUM_SELESAI' | 'SELESAI'
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'BELUM_SELESAI' | 'SELESAI'>('ALL');

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

  // Customizable Departments & Members Modal
  const [isEditTeamOpen, setIsEditTeamOpen] = useState(false);
  const [tempDepts, setTempDepts] = useState<DepartmentConfig[]>(DEFAULT_DEPARTMENTS);
  const [newDeptInput, setNewDeptInput] = useState('');

  // Month navigation: default current or October 2026
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date(2026, 9, 1));
  const [selectedDateKey, setSelectedDateKey] = useState<string>('2026-10-27');

  // Quick 1-row input
  const [newTitle, setNewTitle] = useState('');
  const [newPic, setNewPic] = useState<string>('Design: Sheva');
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
    const [fetchedIssues, fetchedDepts] = await Promise.all([
      getIssues(),
      getDepartments(),
    ]);
    setIssues(fetchedIssues);
    setDepartments(fetchedDepts);
    setTempDepts(fetchedDepts);

    // Auto-select valid initial PIC if not already set
    if (fetchedDepts.length > 0 && fetchedDepts[0].members.length > 0) {
      setNewPic(`${fetchedDepts[0].name}: ${fetchedDepts[0].members[0]}`);
    }
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
            getDepartments().then((depts) => {
              setDepartments(depts);
              setTempDepts(depts);
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

  // Update default selected PIC when active department filter changes
  useEffect(() => {
    if (selectedDept !== 'ALL') {
      const foundDept = departments.find(
        (d) => d.name.toLowerCase() === selectedDept.toLowerCase()
      );
      if (foundDept && foundDept.members.length > 0) {
        setNewPic(`${foundDept.name}: ${foundDept.members[0]}`);
      }
    }
  }, [selectedDept, departments]);

  // Add issue / plan
  const handleAddIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created: Issue = {
      id: `ISS-${Date.now().toString().slice(-5)}`,
      ppic: newPic,
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

  // 1-Click resolve / toggle with actual finish timestamp
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

  // Save custom departments & team members
  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepartments(tempDepts);
    setIsEditTeamOpen(false);
    await saveDepartments(tempDepts);
  };

  // Filtering helper
  const matchesFilter = (issue: Issue) => {
    const parsed = parseIssuePic(issue.ppic);
    if (selectedDept !== 'ALL') {
      if (parsed.department.toLowerCase() !== selectedDept.toLowerCase()) {
        return false;
      }
    }
    if (selectedPerson !== 'ALL') {
      if (parsed.person.toLowerCase() !== selectedPerson.toLowerCase()) {
        return false;
      }
    }
    return true;
  };

  // Available members for the current filter
  const availableMembers = useMemo(() => {
    if (selectedDept === 'ALL') {
      const list: { dept: string; name: string }[] = [];
      departments.forEach((d) => {
        d.members.forEach((m) => {
          list.push({ dept: d.name, name: m });
        });
      });
      return list;
    }
    const target = departments.find(
      (d) => d.name.toLowerCase() === selectedDept.toLowerCase()
    );
    return (target?.members || []).map((m) => ({
      dept: target?.name || selectedDept,
      name: m,
    }));
  }, [departments, selectedDept]);

  // Selected date issues (filtered by dept & person)
  const selectedDateIssues = useMemo(() => {
    return issues
      .filter((i) => i.date === selectedDateKey)
      .filter(matchesFilter);
  }, [issues, selectedDateKey, selectedDept, selectedPerson]);

  // Filtered issues for right column (by status tab: ALL, BELUM_SELESAI, SELESAI)
  const displayedIssues = useMemo(() => {
    if (statusFilter === 'ALL') return selectedDateIssues;
    return selectedDateIssues.filter((i) => i.status === statusFilter);
  }, [selectedDateIssues, statusFilter]);

  // Selected date KPI metrics (Plan vs Actual)
  const selectedDateStats = useMemo(() => {
    const total = selectedDateIssues.length;
    const finished = selectedDateIssues.filter((i) => i.status === 'SELESAI').length;
    const pending = total - finished;
    const percentage = total > 0 ? Math.round((finished / total) * 100) : 0;
    return { total, finished, pending, percentage };
  }, [selectedDateIssues]);

  // Overdue unfinished plans from other dates (Alert)
  const overdueOtherIssues = useMemo(() => {
    return issues.filter(
      (i) => i.status === 'BELUM_SELESAI' && i.date !== selectedDateKey && matchesFilter(i)
    );
  }, [issues, selectedDateKey, selectedDept, selectedPerson]);

  // Department Achievement Breakdown for the selected date
  const departmentBreakdown = useMemo(() => {
    return departments.map((dept) => {
      const deptIssues = issues.filter((i) => {
        const parsed = parseIssuePic(i.ppic);
        return (
          parsed.department.toLowerCase() === dept.name.toLowerCase() &&
          i.date === selectedDateKey
        );
      });
      const total = deptIssues.length;
      const finished = deptIssues.filter((i) => i.status === 'SELESAI').length;
      const pending = total - finished;
      const percentage = total > 0 ? Math.round((finished / total) * 100) : 0;
      return {
        department: dept.name,
        members: dept.members,
        total,
        finished,
        pending,
        percentage,
      };
    });
  }, [departments, issues, selectedDateKey]);

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

  // Issues grouped by date for calendar dots and badges
  const issuesByDate = useMemo(() => {
    const map = new Map<string, Issue[]>();
    for (const issue of issues) {
      if (!matchesFilter(issue)) continue;
      const list = map.get(issue.date) || [];
      list.push(issue);
      map.set(issue.date, list);
    }
    return map;
  }, [issues, selectedDept, selectedPerson]);

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col bg-slate-100 dark:bg-[#090A0F] text-slate-900 dark:text-[#F5F5F7] font-sans transition-colors duration-200">
      <div className="w-full max-w-[1600px] mx-auto p-2.5 sm:p-4 flex flex-col flex-1 min-h-0 gap-2.5 sm:gap-3">
        {/* UNIFIED TOP BAR: BRAND + DEPARTMENT TABS + PERSON FILTER + EDIT TEAM + THEME */}
        <header className="bg-white dark:bg-[#12131A] border border-slate-200 dark:border-white/10 rounded-2xl px-3 sm:px-4 py-2 flex items-center justify-between gap-2.5 sm:gap-4 shrink-0 shadow-xs">
          {/* Brand & Status Icon */}
          <div className="flex items-center gap-2 shrink-0">
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              Daily Plan and Report
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

          {/* Unified Tabs Row: All, Departments, Person Selector, Edit Team */}
          <div className="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 p-1 rounded-xl flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-w-0 max-w-full">
            <button
              onClick={() => {
                setSelectedDept('ALL');
                setSelectedPerson('ALL');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
                selectedDept === 'ALL' && selectedPerson === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-black font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10'
              }`}
            >
              All
            </button>

            {departments.map((dept) => {
              const active = selectedDept.toLowerCase() === dept.name.toLowerCase();
              return (
                <button
                  key={dept.name}
                  onClick={() => {
                    setSelectedDept(dept.name);
                    setSelectedPerson('ALL');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 flex items-center gap-1 ${
                    active
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-black font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10'
                  }`}
                  title={`${dept.name}: ${dept.members.join(', ')}`}
                >
                  <span>{dept.name}</span>
                  <span
                    className={`text-[10px] font-mono px-1 rounded-full ${
                      active
                        ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black'
                        : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-white/50'
                    }`}
                  >
                    {dept.members.length}
                  </span>
                </button>
              );
            })}

            {/* Person Filter Dropdown */}
            <div className="h-4 w-px bg-slate-300/80 dark:bg-white/10 mx-0.5 shrink-0" />
            <div className="flex items-center gap-1 shrink-0 px-1">
              <Filter className="w-3 h-3 text-slate-400 dark:text-white/40" />
              <select
                value={selectedPerson}
                onChange={(e) => setSelectedPerson(e.target.value)}
                className="px-2 py-0.5 rounded-lg bg-white dark:bg-white/10 border border-slate-300 dark:border-white/10 text-xs text-slate-800 dark:text-white font-medium focus:outline-none focus:border-slate-500 shadow-2xs max-w-[130px] truncate"
                title="Filter by individual person"
              >
                <option value="ALL">
                  {selectedDept === 'ALL' ? 'All PIC' : `All ${selectedDept}`}
                </option>
                {selectedDept === 'ALL'
                  ? departments.map((d) => (
                      <optgroup
                        key={d.name}
                        label={d.name}
                        className="bg-white text-slate-900 dark:bg-zinc-900 dark:text-white"
                      >
                        {d.members.map((m) => (
                          <option key={`${d.name}-${m}`} value={m}>
                            {m} ({d.name})
                          </option>
                        ))}
                      </optgroup>
                    ))
                  : availableMembers.map((item) => (
                      <option
                        key={item.name}
                        value={item.name}
                        className="bg-white text-slate-900 dark:bg-zinc-900 dark:text-white"
                      >
                        {item.name}
                      </option>
                    ))}
              </select>
            </div>

            {/* Edit Team button */}
            <div className="h-4 w-px bg-slate-300/80 dark:bg-white/10 mx-0.5 shrink-0" />
            <button
              type="button"
              onClick={() => {
                setTempDepts(departments);
                setIsEditTeamOpen(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10 transition-colors shrink-0"
              title="Manage departments and team members"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Edit Team</span>
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

        {/* WORKSPACE: LEFT (INPUT + CALENDAR + DEPT BREAKDOWN) & RIGHT (CONTROL HUB PLAN VS ACTUAL) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3 flex-1 min-h-0">
          {/* LEFT COLUMN: QUICK ADD + CALENDAR VIEW + DEPT BREAKDOWN (6 of 12 on desktop) */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col gap-2.5 sm:gap-3 min-h-0 h-full">
            {/* QUICK 1-ROW ADD TASK FORM */}
            <section className="bg-white dark:bg-[#12131A] border border-slate-200 dark:border-white/10 rounded-2xl p-2.5 sm:p-3 shrink-0 shadow-xs">
              <form onSubmit={handleAddIssue} className="flex flex-col sm:flex-row items-center gap-2">
                {/* PIC Selector (Grouped by Department) */}
                <select
                  value={newPic}
                  onChange={(e) => setNewPic(e.target.value)}
                  className="w-full sm:w-48 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-black/60 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-500 dark:focus:border-white/40 truncate shadow-2xs"
                >
                  {departments.map((dept) => (
                    <optgroup
                      key={dept.name}
                      label={dept.name}
                      className="bg-white text-slate-900 dark:bg-zinc-900 dark:text-white font-semibold"
                    >
                      {dept.members.map((m) => (
                        <option
                          key={`${dept.name}: ${m}`}
                          value={`${dept.name}: ${m}`}
                          className="font-normal"
                        >
                          {dept.name}: {m}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>

                <input
                  type="text"
                  required
                  placeholder="Tulis target plan / laporan hari ini..."
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
                  <span>Add Plan</span>
                </button>
              </form>
            </section>

            {/* MONTHLY CALENDAR VIEW (AUTOFIT HEIGHT) */}
            <section className="bg-white dark:bg-[#12131A] border border-slate-200 dark:border-white/10 rounded-2xl p-3 sm:p-3.5 flex-1 min-h-0 flex flex-col gap-2 shadow-xs">
              <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500 dark:text-white/50" />
                  <h2 className="text-xs sm:text-sm font-semibold tracking-tight text-slate-900 dark:text-white/90">
                    Kalender Produksi
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

              {/* Weekday Labels */}
              <div className="grid grid-cols-7 text-center text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-white/30 uppercase shrink-0 pb-0.5">
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
                <div>Sun</div>
              </div>

              {/* Days Grid */}
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
                      className={`min-h-[46px] lg:min-h-0 h-full p-1.5 sm:p-2 rounded-xl border text-left flex flex-col justify-between transition-all ${
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
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 dark:bg-amber-500/20 font-semibold'
                                : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold'
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
                                ? 'bg-amber-500'
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

            {/* DEPARTEMEN PLAN VS ACTUAL PROGRESS BARS */}
            <section className="bg-white dark:bg-[#12131A] border border-slate-200 dark:border-white/10 rounded-2xl p-3 shrink-0 shadow-xs">
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-200/60 dark:border-white/10">
                <span className="text-xs font-semibold text-slate-900 dark:text-white/90">
                  Target & Realisasi per Departemen (Tgl {formatEnglishDate(selectedDateKey)})
                </span>
                <span className="text-[10px] text-slate-400 dark:text-white/40 font-mono">
                  Klik untuk filter
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {departmentBreakdown.map((item) => {
                  const isFiltered = selectedDept.toLowerCase() === item.department.toLowerCase();

                  return (
                    <button
                      key={item.department}
                      type="button"
                      onClick={() => {
                        setSelectedDept(isFiltered ? 'ALL' : item.department);
                        setSelectedPerson('ALL');
                      }}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        isFiltered
                          ? 'border-slate-900 bg-slate-100 dark:border-white dark:bg-white/10 shadow-xs'
                          : 'border-slate-200/80 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${getDepartmentBadgeStyle(item.department)}`}>
                          {item.department}
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-slate-700 dark:text-white/80">
                          {item.finished}/{item.total}
                        </span>
                      </div>

                      {/* Mini Progress Bar */}
                      <div className="w-full bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            item.total === 0
                              ? 'bg-slate-300 dark:bg-white/10'
                              : item.percentage === 100
                              ? 'bg-emerald-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${item.total === 0 ? 0 : item.percentage}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: PLAN VS ACTUAL CONTROL CENTER (6 of 12 on desktop) */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col gap-2.5 sm:gap-3 min-h-0 h-full">
            <section className="bg-white dark:bg-[#12131A] border border-slate-200 dark:border-white/10 rounded-2xl p-3 sm:p-4 flex-1 min-h-0 flex flex-col gap-3 shadow-xs">
              {/* CONTROL CENTER HEADER */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-slate-700 dark:text-white/70" />
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Plan vs Actual Control
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-white/50">
                      {formatIndonesianDate(selectedDateKey)}
                    </p>
                  </div>
                </div>

                {/* Overdue from other dates indicator */}
                {overdueOtherIssues.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (overdueOtherIssues[0]) {
                        setSelectedDateKey(overdueOtherIssues[0].date);
                        setNewDate(overdueOtherIssues[0].date);
                      }
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition-all"
                    title="Lihat tugas yang tertunda dari hari lain"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{overdueOtherIssues.length} Tertunda Hari Lain</span>
                  </button>
                )}
              </div>

              {/* 3 KPI STRIP CARDS IN 1 ROW */}
              <div className="grid grid-cols-3 gap-2 shrink-0">
                {/* 1. Total Plan */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-white/50 font-medium">
                    <span>Target Plan</span>
                    <ClipboardList className="w-3.5 h-3.5" />
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white">
                      {selectedDateStats.total}
                    </span>
                    <span className="text-[10px] text-slate-400">tugas</span>
                  </div>
                </div>

                {/* 2. Actual Finish */}
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                  <div className="flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                    <span>Actual Finish</span>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-lg sm:text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                      {selectedDateStats.finished}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ({selectedDateStats.percentage}%)
                    </span>
                  </div>
                </div>

                {/* 3. Pending / Delay */}
                <div className={`p-2.5 rounded-xl border ${
                  selectedDateStats.pending > 0
                    ? 'bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-300'
                    : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-400'
                }`}>
                  <div className="flex items-center justify-between text-[11px] font-medium">
                    <span>Pending</span>
                    <AlertCircle className="w-3.5 h-3.5" />
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-lg sm:text-xl font-bold font-mono">
                      {selectedDateStats.pending}
                    </span>
                    <span className="text-[10px] opacity-70">belum</span>
                  </div>
                </div>
              </div>

              {/* OVERALL DAILY ACHIEVEMENT PROGRESS BAR */}
              <div className="space-y-1 shrink-0">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-slate-600 dark:text-white/60">
                    Tingkat Realisasi Selesai
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {selectedDateStats.percentage}% Achieved
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${selectedDateStats.percentage}%` }}
                  />
                </div>
              </div>

              {/* SUB-FILTER TABS: SEMUA, BELUM SELESAI, SELESAI */}
              <div className="flex items-center justify-between gap-2 shrink-0 pt-1">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 p-0.5 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      statusFilter === 'ALL'
                        ? 'bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-xs font-semibold'
                        : 'text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Semua ({selectedDateStats.total})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('BELUM_SELESAI')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      statusFilter === 'BELUM_SELESAI'
                        ? 'bg-amber-500/15 text-amber-800 dark:text-amber-200 shadow-xs font-semibold'
                        : 'text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    ⏳ Belum ({selectedDateStats.pending})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('SELESAI')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      statusFilter === 'SELESAI'
                        ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 shadow-xs font-semibold'
                        : 'text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    ✅ Selesai ({selectedDateStats.finished})
                  </button>
                </div>

                <span className="text-[11px] text-slate-400 dark:text-white/40 hidden sm:inline">
                  {displayedIssues.length} ditampilkan
                </span>
              </div>

              {/* SCROLLABLE LIST OF PLAN VS ACTUAL CARDS */}
              {displayedIssues.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50/50 dark:bg-white/[0.01] border border-dashed border-slate-300 dark:border-white/10 text-center text-xs text-slate-400 dark:text-white/40">
                  <ClipboardList className="w-8 h-8 mb-2 opacity-30" />
                  <p className="font-medium text-slate-600 dark:text-white/60">
                    Tidak ada plan pada filter ini
                  </p>
                  <p className="text-[11px] mt-0.5">
                    Tambahkan rencana kerja atau ganti filter di atas.
                  </p>
                </div>
              ) : (
                <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 [scrollbar-width:thin]">
                  {displayedIssues.map((issue) => {
                    const isDone = issue.status === 'SELESAI';
                    const isExpanded = expandedIssueIds.has(issue.id);
                    const parsed = parseIssuePic(issue.ppic);
                    const badgeStyle = getDepartmentBadgeStyle(parsed.department);
                    const time = getElapsedTime(issue.createdAt);

                    const finishTime = issue.resolvedAt
                      ? new Intl.DateTimeFormat('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(new Date(issue.resolvedAt)).replace('.', ':')
                      : null;

                    return (
                      <div
                        key={issue.id}
                        onClick={() => toggleExpandIssue(issue.id)}
                        className={`group p-2.5 sm:p-3 rounded-2xl border transition-all shadow-2xs cursor-pointer select-none ${
                          isDone
                            ? 'bg-slate-50/60 dark:bg-white/[0.01] border-slate-200/80 dark:border-white/5'
                            : 'bg-white dark:bg-white/[0.03] border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                        } ${
                          isExpanded
                            ? 'ring-1 ring-slate-400 dark:ring-white/30 bg-slate-100/90 dark:bg-white/[0.05]'
                            : ''
                        }`}
                        title="Klik untuk melihat teks lengkap"
                      >
                        {/* Top row: PIC Badge + Finish/Pending Status + 1-Click Action */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${badgeStyle} shrink-0 truncate max-w-[170px] shadow-2xs`}
                            >
                              {parsed.display}
                            </span>

                            {/* Status indicator pill */}
                            {isDone ? (
                              <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 shrink-0">
                                <Check className="w-3 h-3" />
                                <span>Finish {finishTime ? finishTime : ''}</span>
                              </span>
                            ) : (
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded-md shrink-0 ${
                                  time.isOverdue
                                    ? 'bg-red-500/15 text-red-600 dark:text-red-400 font-semibold'
                                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                                }`}
                              >
                                {time.text}
                              </span>
                            )}

                            <span className="text-slate-400 dark:text-white/30 group-hover:text-slate-700 dark:group-hover:text-white/70 transition-colors">
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                  isExpanded ? 'rotate-180 text-slate-900 dark:text-white' : ''
                                }`}
                              />
                            </span>
                          </div>

                          {/* Action Buttons: 1-Click Finish / Reopen & Delete */}
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
                              className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-xl transition-all active:scale-95 shadow-2xs ${
                                isDone
                                  ? 'bg-slate-200/80 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white/70'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 shadow-emerald-500/20'
                              }`}
                            >
                              {isDone ? (
                                <>
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Reopen</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                  <span>Finish</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(issue.id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 dark:text-white/30 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
                              title="Hapus tugas"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div className="mt-1.5">
                          <p
                            className={`text-xs ${
                              isDone
                                ? 'line-through text-slate-400 dark:text-white/35 font-normal'
                                : 'text-slate-900 dark:text-white/95 font-medium'
                            } ${
                              isExpanded
                                ? 'break-words whitespace-normal leading-relaxed select-text'
                                : 'truncate'
                            }`}
                          >
                            {issue.title}
                          </p>

                          {/* Expanded detail box */}
                          {isExpanded && (
                            <div className="mt-2.5 pt-2 border-t border-slate-200/70 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 dark:text-white/40">
                              <div>
                                <span>Target: {formatIndonesianDate(issue.date)}</span>
                                {issue.resolvedAt && (
                                  <span className="ml-2 font-semibold text-emerald-600 dark:text-emerald-400">
                                    • Actual Selesai: {new Date(issue.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                              <span className="text-slate-400 dark:text-white/40 font-medium">
                                Klik untuk menutup ▲
                              </span>
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

        {/* MODAL: MANAGE DEPARTMENTS & TEAM MEMBERS */}
        {isEditTeamOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-slate-900/60 dark:bg-black/85 transition-opacity"
              onClick={() => setIsEditTeamOpen(false)}
            />

            <div className="relative w-full max-w-lg bg-white dark:bg-[#12131A] border border-slate-200 dark:border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl z-10 space-y-4 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-600 dark:text-white/70" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Manage Departments & Team Members
                  </h3>
                </div>
                <button
                  onClick={() => setIsEditTeamOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-white/40 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-white/50 shrink-0">
                Edit team members for each department (separated by commas). You can also add or remove departments.
              </p>

              {/* Scrollable list of departments */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 [scrollbar-width:thin]">
                {tempDepts.map((d, index) => (
                  <div
                    key={d.name}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${getDepartmentBadgeStyle(d.name)}`}>
                          {d.name}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-white/40">
                          {d.members.length} member{d.members.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {tempDepts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setTempDepts((prev) => prev.filter((_, i) => i !== index));
                          }}
                          className="text-[11px] text-red-500 hover:text-red-700 p-0.5"
                          title={`Delete department ${d.name}`}
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      value={d.members.join(', ')}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTempDepts((prev) =>
                          prev.map((item, i) =>
                            i === index
                              ? {
                                  ...item,
                                  members: val.split(',').map((s) => s.trim()).filter(Boolean),
                                }
                              : item
                          )
                        );
                      }}
                      placeholder="Contoh: Sheva, Ade"
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-black/50 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-500 dark:focus:border-white/40"
                    />
                  </div>
                ))}

                {/* Add new department input */}
                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={newDeptInput}
                    onChange={(e) => setNewDeptInput(e.target.value)}
                    placeholder="Add new department name..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = newDeptInput.trim();
                      if (!trimmed) return;
                      if (!tempDepts.some((d) => d.name.toLowerCase() === trimmed.toLowerCase())) {
                        setTempDepts((prev) => [
                          ...prev,
                          {
                            id: trimmed.toLowerCase().replace(/\s+/g, '-'),
                            name: trimmed,
                            members: ['Anggota 1'],
                          },
                        ]);
                      }
                      setNewDeptInput('');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-xs font-semibold text-slate-800 dark:text-white shrink-0"
                  >
                    + Tambah
                  </button>
                </div>
              </div>

              {/* Modal actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200/80 dark:border-white/10 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditTeamOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white/60 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setDepartments(tempDepts);
                    setIsEditTeamOpen(false);
                    await saveDepartments(tempDepts);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-white/90 text-xs font-semibold shadow transition-all"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
