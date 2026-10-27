'use client';

import React, { useState, useMemo } from 'react';
import { Issue, PPIC_LIST, PPICId } from '@/types/issue';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { formatDateIndo, toDateKey } from '@/lib/utils';

interface MonthlyCalendarViewProps {
  issues: Issue[];
  selectedPPIC: PPICId | 'ALL';
  setSelectedPPIC: (ppic: PPICId | 'ALL') => void;
  onSelectDate: (date: Date, dateIssues: Issue[]) => void;
  onSelectIssue: (issue: Issue) => void;
  onAddNewIssueForDate: (dateStr: string) => void;
}

export const MonthlyCalendarView: React.FC<MonthlyCalendarViewProps> = ({
  issues,
  selectedPPIC,
  setSelectedPPIC,
  onSelectDate,
  onSelectIssue,
  onAddNewIssueForDate,
}) => {
  // Current viewing month/year state
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date(2026, 9, 1)); // Default to October 2026 as per local clock
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNRESOLVED' | 'RESOLVED'>('ALL');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  // Filter issues according to selected PPIC and Status
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (selectedPPIC !== 'ALL' && issue.ppicId !== selectedPPIC) return false;
      if (statusFilter === 'UNRESOLVED' && issue.status === 'RESOLVED') return false;
      if (statusFilter === 'RESOLVED' && issue.status !== 'RESOLVED') return false;
      return true;
    });
  }, [issues, selectedPPIC, statusFilter]);

  // Group issues by date string 'YYYY-MM-DD'
  const issuesByDate = useMemo(() => {
    const map = new Map<string, Issue[]>();
    for (const issue of filteredIssues) {
      const issueDate = new Date(issue.createdAt);
      const key = toDateKey(issueDate);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(issue);
    }
    return map;
  }, [filteredIssues]);

  // Calculate calendar days matrix
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Days in week: Monday (1) to Sunday (0 -> 7)
    let startDayOfWeek = firstDayOfMonth.getDay();
    if (startDayOfWeek === 0) startDayOfWeek = 7; // Sunday as 7

    const totalDays = lastDayOfMonth.getDate();
    const cells = [];

    // Previous month filler days
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i > 0; i--) {
      const dayNum = prevMonthLastDate - i + 1;
      const d = new Date(year, month - 1, dayNum);
      cells.push({
        date: d,
        isCurrentMonth: false,
        key: toDateKey(d),
      });
    }

    // Current month days
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);
      cells.push({
        date: d,
        isCurrentMonth: true,
        key: toDateKey(d),
      });
    }

    // Next month filler days to complete grid (42 cells: 6 weeks)
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      cells.push({
        date: d,
        isCurrentMonth: false,
        key: toDateKey(d),
      });
    }

    return cells;
  }, [year, month]);

  // Monthly stats
  const monthStats = useMemo(() => {
    const thisMonthIssues = issues.filter((iss) => {
      const d = new Date(iss.createdAt);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    const total = thisMonthIssues.length;
    const resolved = thisMonthIssues.filter((i) => i.status === 'RESOLVED').length;
    const open = thisMonthIssues.filter((i) => i.status === 'OPEN').length;
    const inProgress = thisMonthIssues.filter((i) => i.status === 'IN_PROGRESS').length;
    const resolveRate = total > 0 ? Math.round((resolved / total) * 100) : 100;

    return { total, resolved, open, inProgress, resolveRate };
  }, [issues, year, month]);

  const todayKey = toDateKey(new Date());

  return (
    <div className="w-full space-y-5">
      {/* Monthly Statistics Overview (Apple TV Frosted Stat Bar) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card rounded-2xl p-4 border border-white/10">
          <p className="text-xs text-white/50">Total Isu Bulan Ini</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-white">{monthStats.total}</span>
            <span className="text-[11px] text-white/40">insiden</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-red-500/20 bg-gradient-to-b from-red-950/20 to-black/30">
          <p className="text-xs text-red-300/70">Isu Belum Selesai</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-red-400">
              {monthStats.open + monthStats.inProgress}
            </span>
            <span className="text-[11px] text-red-300/50">
              ({monthStats.open} Baru, {monthStats.inProgress} Proses)
            </span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-emerald-500/20 bg-gradient-to-b from-emerald-950/20 to-black/30">
          <p className="text-xs text-emerald-300/70">Terselesaikan</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-emerald-400">{monthStats.resolved}</span>
            <span className="text-[11px] text-emerald-300/50">tuntas</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-blue-500/20 bg-gradient-to-b from-blue-950/20 to-black/30">
          <p className="text-xs text-blue-300/70">Tingkat Resolusi</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-blue-400">{monthStats.resolveRate}%</span>
            <span className="text-[11px] text-blue-300/50">keberhasilan</span>
          </div>
        </div>
      </div>

      {/* Calendar Controls & Filters */}
      <div className="glass-panel rounded-3xl p-4 md:p-6 border border-white/10 space-y-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Month Navigator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-2xl p-1">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="px-4 text-base md:text-lg font-bold text-white tracking-wide min-w-[170px] text-center">
                {monthNames[month]} {year}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={handleToday}
              className="text-xs font-medium px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-all"
            >
              Hari Ini
            </button>
          </div>

          {/* 5 PPIC Quick Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            <button
              onClick={() => setSelectedPPIC('ALL')}
              className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                selectedPPIC === 'ALL'
                  ? 'bg-white text-black font-semibold border-white shadow-md'
                  : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
              }`}
            >
              Semua PPIC
            </button>
            {PPIC_LIST.map((p) => {
              const isSelected = selectedPPIC === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPPIC(p.id)}
                  style={{
                    backgroundColor: isSelected ? p.color : 'rgba(255,255,255,0.05)',
                    color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.7)',
                    borderColor: isSelected ? p.color : 'rgba(255,255,255,0.1)',
                  }}
                  className="text-xs px-2.5 py-1.5 rounded-xl border font-medium transition-all hover:scale-105 active:scale-95"
                >
                  {p.code}
                </button>
              );
            })}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                statusFilter === 'ALL' ? 'bg-white/20 text-white font-medium' : 'text-white/50 hover:text-white'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setStatusFilter('UNRESOLVED')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                statusFilter === 'UNRESOLVED' ? 'bg-red-500/30 text-red-200 font-medium' : 'text-white/50 hover:text-white'
              }`}
            >
              Belum Selesai
            </button>
            <button
              onClick={() => setStatusFilter('RESOLVED')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                statusFilter === 'RESOLVED' ? 'bg-emerald-500/30 text-emerald-200 font-medium' : 'text-white/50 hover:text-white'
              }`}
            >
              Selesai
            </button>
          </div>
        </div>

        {/* 7-Day Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 md:gap-2 text-center text-xs font-semibold text-white/50 tracking-wider uppercase pt-2">
          <div>Sen</div>
          <div>Sel</div>
          <div>Rab</div>
          <div>Kam</div>
          <div>Jum</div>
          <div className="text-blue-400">Sab</div>
          <div className="text-red-400">Min</div>
        </div>

        {/* Calendar Grid (42 Cells) */}
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {calendarCells.map((cell) => {
            const dayIssues = issuesByDate.get(cell.key) || [];
            const hasIssues = dayIssues.length > 0;
            const hasUnresolved = dayIssues.some((i) => i.status !== 'RESOLVED');
            const isToday = cell.key === todayKey;

            return (
              <div
                key={cell.key}
                onClick={() => onSelectDate(cell.date, dayIssues)}
                className={`relative min-h-[85px] md:min-h-[110px] p-1.5 md:p-2 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  !cell.isCurrentMonth
                    ? 'opacity-25 bg-black/20 border-white/[0.03] hover:opacity-50'
                    : hasUnresolved
                    ? 'bg-red-950/10 border-red-500/30 hover:border-red-500/60 hover:bg-red-950/20'
                    : hasIssues
                    ? 'bg-white/[0.04] border-white/15 hover:border-white/30 hover:bg-white/[0.08]'
                    : 'bg-black/30 border-white/[0.05] hover:border-white/20 hover:bg-white/[0.03]'
                } ${isToday ? 'ring-2 ring-blue-500/80 shadow-glow-blue/40' : ''}`}
              >
                {/* Cell Header: Date Number & Badges */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs md:text-sm font-semibold rounded-lg px-1.5 py-0.5 ${
                      isToday
                        ? 'bg-blue-500 text-white font-bold'
                        : cell.isCurrentMonth
                        ? 'text-white'
                        : 'text-white/40'
                    }`}
                  >
                    {cell.date.getDate()}
                  </span>

                  {hasIssues && (
                    <div className="flex items-center gap-1">
                      {hasUnresolved ? (
                        <span className="flex items-center gap-0.5 text-[10px] text-red-400 font-bold bg-red-500/20 px-1 rounded-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
                          {dayIssues.filter((i) => i.status !== 'RESOLVED').length}
                        </span>
                      ) : (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      )}
                    </div>
                  )}
                </div>

                {/* Issues preview badges / tags */}
                <div className="space-y-1 mt-1 overflow-hidden">
                  {dayIssues.slice(0, 2).map((iss) => {
                    const ppic = PPIC_LIST.find((p) => p.id === iss.ppicId);
                    return (
                      <div
                        key={iss.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectIssue(iss);
                        }}
                        className={`text-[9px] md:text-[10px] truncate px-1.5 py-0.5 rounded-md flex items-center gap-1 font-medium border transition-colors ${
                          iss.status === 'RESOLVED'
                            ? 'bg-white/5 text-white/50 border-white/5 line-through'
                            : 'bg-white/10 text-white/90 border-white/15 hover:bg-white/20'
                        }`}
                        title={`${iss.title} (${iss.reporter})`}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: ppic?.color || '#2997FF' }}
                        />
                        <span className="truncate">{iss.title}</span>
                      </div>
                    );
                  })}

                  {dayIssues.length > 2 && (
                    <p className="text-[9px] text-white/40 font-medium pl-1">
                      +{dayIssues.length - 2} isu lainnya
                    </p>
                  )}
                </div>

                {/* Bottom hint */}
                <div className="text-[9px] text-white/30 text-right opacity-0 hover:opacity-100 transition-opacity">
                  Lihat &rarr;
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
