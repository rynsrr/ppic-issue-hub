import { Issue } from '@/types/issue';
import { INITIAL_ISSUES } from './seedData';

const STORAGE_KEY = 'ppic_issues_v1';

export function loadIssues(): Issue[] {
  if (typeof window === 'undefined') {
    return INITIAL_ISSUES;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ISSUES));
      return INITIAL_ISSUES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_ISSUES;
  } catch (e) {
    console.error('Failed to load issues from localStorage', e);
    return INITIAL_ISSUES;
  }
}

export function saveIssues(issues: Issue[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
  } catch (e) {
    console.error('Failed to save issues to localStorage', e);
  }
}

export function resetToDefaultIssues(): Issue[] {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ISSUES));
  }
  return INITIAL_ISSUES;
}

export function exportIssuesToJson(issues: Issue[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(issues, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `ppic-issues-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
