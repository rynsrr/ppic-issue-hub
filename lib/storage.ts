import { Issue, PPICId, DepartmentConfig, DEFAULT_DEPARTMENTS } from '@/types/issue';
import { INITIAL_ISSUES } from './seedData';

const STORAGE_KEY = 'ppic_minimal_issues_v5';
const NAMES_STORAGE_KEY = 'ppic_custom_names_v5';
const DEPARTMENTS_STORAGE_KEY = 'ppic_departments_v6';

export type PPICNamesMap = Record<string, string>;

export const DEFAULT_PPIC_NAMES: PPICNamesMap = {
  'Design': 'Sheva, Ade',
  'Pattern': 'Tri, Jasmine',
  'Marker': 'Ari',
  'Sewing': 'Rus, Is, Tri, Aris, Agung, Omar, Deny, Nurcis, Mus',
  'QC': 'Zahra',
  'Cutting': 'Yusuf',
  'PPIC': 'Royan, Cynara, Ami, Ryan, Hanami',
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

export function loadDepartments(): DepartmentConfig[] {
  if (typeof window === 'undefined') return DEFAULT_DEPARTMENTS;
  try {
    const raw = localStorage.getItem(DEPARTMENTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(DEPARTMENTS_STORAGE_KEY, JSON.stringify(DEFAULT_DEPARTMENTS));
      return DEFAULT_DEPARTMENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_DEPARTMENTS;
  } catch {
    return DEFAULT_DEPARTMENTS;
  }
}

export function saveDepartments(depts: DepartmentConfig[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DEPARTMENTS_STORAGE_KEY, JSON.stringify(depts));
  } catch {}
}

export function loadPPICNames(): PPICNamesMap {
  if (typeof window === 'undefined') return DEFAULT_PPIC_NAMES;
  try {
    const raw = localStorage.getItem(NAMES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(NAMES_STORAGE_KEY, JSON.stringify(DEFAULT_PPIC_NAMES));
      return DEFAULT_PPIC_NAMES;
    }
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
