export type PPICId = string;

export interface DepartmentConfig {
  id: string;
  name: string;
  members: string[];
}

export const DEFAULT_DEPARTMENTS: DepartmentConfig[] = [
  { id: 'design', name: 'Design', members: ['Sheva', 'Ade'] },
  { id: 'pattern', name: 'Pattern', members: ['Tri', 'Jasmine'] },
  { id: 'marker', name: 'Marker', members: ['Ari'] },
  { id: 'sewing', name: 'Sewing', members: ['Rus', 'Is', 'Tri', 'Aris', 'Agung', 'Omar', 'Deny', 'Nurcis', 'Mus'] },
  { id: 'qc', name: 'QC', members: ['Zahra'] },
  { id: 'cutting', name: 'Cutting', members: ['Yusuf'] },
  { id: 'ppic', name: 'PPIC', members: ['Royan', 'Cynara', 'Ami', 'Ryan', 'Hanami'] },
];

export const PPIC_KEYS: PPICId[] = [
  'Design',
  'Pattern',
  'Marker',
  'Sewing',
  'QC',
  'Cutting',
  'PPIC',
];

export interface Issue {
  id: string;
  ppic: string;
  title: string;
  date: string; // YYYY-MM-DD
  status: 'BELUM_SELESAI' | 'SELESAI';
  createdAt: string; // ISO string for live elapsed time
  resolvedAt?: string | null;
}

export function parseIssuePic(raw: string): { department: string; person: string; display: string } {
  if (!raw) return { department: 'General', person: '-', display: 'General' };

  const legacyMap: Record<string, { department: string; person: string }> = {
    'PPIC 1': { department: 'PPIC', person: 'Royan' },
    'PPIC 2': { department: 'PPIC', person: 'Cynara' },
    'PPIC 3': { department: 'PPIC', person: 'Ami' },
    'PPIC 4': { department: 'PPIC', person: 'Ryan' },
    'PPIC 5': { department: 'PPIC', person: 'Hanami' },
  };

  if (legacyMap[raw]) {
    return {
      department: legacyMap[raw].department,
      person: legacyMap[raw].person,
      display: `${legacyMap[raw].department} · ${legacyMap[raw].person}`,
    };
  }

  if (raw.includes(':')) {
    const parts = raw.split(':');
    const dept = parts[0].trim();
    const person = parts.slice(1).join(':').trim();
    return { department: dept, person, display: `${dept} · ${person}` };
  }

  if (raw.includes('(') && raw.includes(')')) {
    const match = raw.match(/^(.*?)\s*\((.*?)\)/);
    if (match) {
      const dept = match[1].trim();
      const person = match[2].trim();
      return { department: dept, person, display: `${dept} · ${person}` };
    }
  }

  if (raw.includes(' - ')) {
    const parts = raw.split(' - ');
    const dept = parts[0].trim();
    const person = parts.slice(1).join(' - ').trim();
    return { department: dept, person, display: `${dept} · ${person}` };
  }

  return { department: raw, person: raw, display: raw };
}

export function getDepartmentBadgeStyle(department: string): string {
  const d = (department || '').toLowerCase();
  switch (d) {
    case 'design':
      return 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/25';
    case 'pattern':
      return 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/25';
    case 'marker':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25';
    case 'sewing':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25';
    case 'qc':
      return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/25';
    case 'cutting':
      return 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/25';
    case 'ppic':
      return 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/25';
    default:
      return 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white/80 border border-slate-300 dark:border-white/10';
  }
}
