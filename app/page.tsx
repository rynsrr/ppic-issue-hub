'use client';

import React, { useState, useEffect } from 'react';
import { Issue, PPICId } from '@/types/issue';
import { loadIssues, saveIssues, resetToDefaultIssues, exportIssuesToJson } from '@/lib/storage';
import { Navbar } from '@/components/Navbar';
import { UnresolvedHeroShelf } from '@/components/UnresolvedHeroShelf';
import { MonthlyCalendarView } from '@/components/MonthlyCalendarView';
import { PpicMatrixView } from '@/components/PpicMatrixView';
import { NewIssueModal } from '@/components/NewIssueModal';
import { DayDetailModal } from '@/components/DayDetailModal';
import { IssueDetailModal } from '@/components/IssueDetailModal';

export default function HomePage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [currentTab, setCurrentTab] = useState<'calendar' | 'matrix' | 'unresolved'>('calendar');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPPIC, setSelectedPPIC] = useState<PPICId | 'ALL'>('ALL');

  // Modal states
  const [isNewIssueOpen, setIsNewIssueOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateIssues, setSelectedDateIssues] = useState<Issue[]>([]);
  const [preselectedDateForNewIssue, setPreselectedDateForNewIssue] = useState<string | undefined>();

  // Load from local storage
  useEffect(() => {
    const loaded = loadIssues();
    setIssues(loaded);
  }, []);

  // Save to local storage on issues change
  const handleUpdateAllIssues = (updatedList: Issue[]) => {
    setIssues(updatedList);
    saveIssues(updatedList);
  };

  // Add new issue
  const handleAddIssue = (newIssueData: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>) => {
    const nowIso = new Date().toISOString();
    const newIssue: Issue = {
      ...newIssueData,
      id: `ISS-${Date.now().toString().slice(-6)}`,
      createdAt: newIssueData.targetDate ? `${newIssueData.targetDate}T${nowIso.slice(11)}` : nowIso,
      updatedAt: nowIso,
    };
    const updated = [newIssue, ...issues];
    handleUpdateAllIssues(updated);
  };

  // Update existing issue
  const handleUpdateIssue = (updatedIssue: Issue) => {
    const updated = issues.map((i) => (i.id === updatedIssue.id ? updatedIssue : i));
    handleUpdateAllIssues(updated);
    setSelectedIssue(updatedIssue);
  };

  // Delete issue
  const handleDeleteIssue = (issueId: string) => {
    const updated = issues.filter((i) => i.id !== issueId);
    handleUpdateAllIssues(updated);
  };

  // Quick toggle status (Open <-> In Progress)
  const handleToggleStatus = (issueId: string) => {
    const updated = issues.map((i) => {
      if (i.id === issueId) {
        const nextStatus = i.status === 'OPEN' ? 'IN_PROGRESS' : 'OPEN';
        return {
          ...i,
          status: nextStatus as any,
          updatedAt: new Date().toISOString(),
        };
      }
      return i;
    });
    handleUpdateAllIssues(updated);
  };

  // Quick resolve
  const handleQuickResolve = (issueId: string) => {
    const updated = issues.map((i) => {
      if (i.id === issueId) {
        return {
          ...i,
          status: 'RESOLVED' as const,
          resolvedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          resolutionNote: 'Diselesaikan melalui one-click action Apple TV Shelf.',
        };
      }
      return i;
    });
    handleUpdateAllIssues(updated);

    // If day detail modal is open, also refresh that list
    if (selectedDate) {
      setSelectedDateIssues((prev) =>
        prev.map((i) => (i.id === issueId ? { ...i, status: 'RESOLVED' } : i))
      );
    }
  };

  // Reset to default sample
  const handleResetData = () => {
    if (confirm('Reset seluruh data isu kembali ke konfigurasi awal?')) {
      const reset = resetToDefaultIssues();
      setIssues(reset);
    }
  };

  // Export JSON
  const handleExportData = () => {
    exportIssuesToJson(issues);
  };

  // Filter issues by search query
  const displayedIssues = issues.filter((i) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      i.title.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      i.reporter.toLowerCase().includes(q) ||
      i.assignedTo.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q) ||
      i.id.toLowerCase().includes(q)
    );
  });

  const unresolvedCount = issues.filter((i) => i.status !== 'RESOLVED').length;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Sleek Apple TV Glass Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenNewIssueModal={() => {
          setPreselectedDateForNewIssue(undefined);
          setIsNewIssueOpen(true);
        }}
        onExportData={handleExportData}
        onResetData={handleResetData}
        unresolvedCount={unresolvedCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6 space-y-8">
        {/* Top Sticky/Hero Section: Isu Yang Belum Diselesaikan Plus Waktunya */}
        {/* Always visible at the top as requested by user! */}
        <UnresolvedHeroShelf
          issues={displayedIssues}
          onSelectIssue={(issue) => setSelectedIssue(issue)}
          onQuickResolve={handleQuickResolve}
          onToggleStatus={handleToggleStatus}
        />

        {/* Tab View Switcher */}
        {currentTab === 'calendar' && (
          <MonthlyCalendarView
            issues={displayedIssues}
            selectedPPIC={selectedPPIC}
            setSelectedPPIC={setSelectedPPIC}
            onSelectDate={(date, dateIssues) => {
              setSelectedDate(date);
              setSelectedDateIssues(dateIssues);
            }}
            onSelectIssue={(issue) => setSelectedIssue(issue)}
            onAddNewIssueForDate={(dateStr) => {
              setPreselectedDateForNewIssue(dateStr);
              setIsNewIssueOpen(true);
            }}
          />
        )}

        {currentTab === 'matrix' && (
          <PpicMatrixView
            issues={displayedIssues}
            onSelectIssue={(issue) => setSelectedIssue(issue)}
            onAddNewIssueForPpic={(ppicId) => {
              setIsNewIssueOpen(true);
            }}
          />
        )}

        {currentTab === 'unresolved' && (
          <div className="glass-panel rounded-3xl p-6 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-2">Fokus Isu Terbuka & Aging Matrix</h3>
            <p className="text-xs text-white/50 mb-6">
              Seluruh isu dalam status &apos;Belum Mulai&apos; dan &apos;Sedang Diproses&apos; dengan urutan waktu terlama.
            </p>
            {/* Detailed list view */}
            <div className="space-y-3">
              {displayedIssues
                .filter((i) => i.status !== 'RESOLVED')
                .map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => setSelectedIssue(issue)}
                    className="p-4 rounded-2xl glass-card border border-white/10 hover:border-white/30 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-blue-400">{issue.ppicId.toUpperCase()}</span>
                        <span className="text-xs text-white/40">&middot;</span>
                        <span className="text-xs text-white/70">{issue.category}</span>
                      </div>
                      <h4 className="font-semibold text-white text-sm">{issue.title}</h4>
                      <p className="text-xs text-white/50 line-clamp-1">{issue.description}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickResolve(issue.id);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium"
                      >
                        Selesaikan
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <NewIssueModal
        isOpen={isNewIssueOpen}
        onClose={() => setIsNewIssueOpen(false)}
        onAddIssue={handleAddIssue}
        preselectedDate={preselectedDateForNewIssue}
      />

      <DayDetailModal
        isOpen={!!selectedDate}
        date={selectedDate}
        issues={selectedDateIssues}
        onClose={() => setSelectedDate(null)}
        onSelectIssue={(issue) => {
          setSelectedIssue(issue);
          setSelectedDate(null);
        }}
        onAddNewIssueForDate={(dateStr) => {
          setSelectedDate(null);
          setPreselectedDateForNewIssue(dateStr);
          setIsNewIssueOpen(true);
        }}
        onQuickResolve={handleQuickResolve}
      />

      <IssueDetailModal
        issue={selectedIssue}
        isOpen={!!selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onUpdateIssue={handleUpdateIssue}
        onDeleteIssue={handleDeleteIssue}
      />

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-white/[0.06] text-center text-xs text-white/40">
        <p>PPIC Issue Hub &middot; Apple TV Aesthetic System &middot; Ready for Vercel Deployment</p>
      </footer>
    </div>
  );
}
