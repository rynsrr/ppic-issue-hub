import { Issue } from '@/types/issue';
import { INITIAL_ISSUES } from './seedData';

const STORAGE_KEY = 'ppic_minimal_issues_v3';

export function loadIssues(): Issue[] {
  if (typeof window === 'undefined') return INITIAL_ISSUES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ISSUES));
      return INITIAL_ISSUES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_ISSUES;
  } catch {
    return INITIAL_ISSUES;
  }
}

export function saveIssues(issues: Issue[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
  } catch {}
}
