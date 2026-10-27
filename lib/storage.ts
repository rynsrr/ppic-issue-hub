import { Issue, PPICId } from '@/types/issue';
import { INITIAL_ISSUES } from './seedData';

const STORAGE_KEY = 'ppic_minimal_issues_en_v4';
const NAMES_STORAGE_KEY = 'ppic_custom_names_en_v4';

export type PPICNamesMap = Record<PPICId, string>;

export const DEFAULT_PPIC_NAMES: PPICNamesMap = {
  'PPIC 1': 'PPIC 1 (Raw Material)',
  'PPIC 2': 'PPIC 2 (Production Scheduling)',
  'PPIC 3': 'PPIC 3 (Finished Goods)',
  'PPIC 4': 'PPIC 4 (Packaging)',
  'PPIC 5': 'PPIC 5 (Subcontract)',
};

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

export function loadPPICNames(): PPICNamesMap {
  if (typeof window === 'undefined') return DEFAULT_PPIC_NAMES;
  try {
    const raw = localStorage.getItem(NAMES_STORAGE_KEY);
    if (!raw) return DEFAULT_PPIC_NAMES;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PPIC_NAMES, ...parsed };
  } catch {
    return DEFAULT_PPIC_NAMES;
  }
}

export function savePPICNames(names: PPICNamesMap): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(NAMES_STORAGE_KEY, JSON.stringify(names));
  } catch {}
}
