export type PPICId = 'ppic-1' | 'ppic-2' | 'ppic-3' | 'ppic-4' | 'ppic-5';

export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export interface PPICProfile {
  id: PPICId;
  name: string;
  code: string;
  focusArea: string;
  picName: string;
  color: string;
  glowColor: string;
  badgeBg: string;
  avatar: string;
}

export interface Issue {
  id: string;
  ppicId: PPICId;
  title: string;
  description: string;
  category: string;
  priority: IssuePriority;
  status: IssueStatus;
  reporter: string;
  assignedTo: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  resolvedAt?: string | null;
  resolutionNote?: string;
  impactLevel?: 'Rendah' | 'Sedang' | 'Tinggi' | 'Kritis';
  targetDate?: string; // YYYY-MM-DD
}

export const PPIC_LIST: PPICProfile[] = [
  {
    id: 'ppic-1',
    code: 'PPIC 1',
    name: 'PPIC 1 - Raw Material & Inbound',
    focusArea: 'Perencanaan Bahan Baku & Kedatangan Vendor',
    picName: 'Ahmad Fauzi',
    color: '#2997FF', // Apple Blue
    glowColor: 'rgba(41, 151, 255, 0.4)',
    badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    avatar: 'RM',
  },
  {
    id: 'ppic-2',
    code: 'PPIC 2',
    name: 'PPIC 2 - Production Scheduling',
    focusArea: 'Jadwal Produksi Harian & Mesin Line',
    picName: 'Budi Santoso',
    color: '#FF9F0A', // Apple Orange
    glowColor: 'rgba(255, 159, 10, 0.4)',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    avatar: 'PS',
  },
  {
    id: 'ppic-3',
    code: 'PPIC 3',
    name: 'PPIC 3 - Finished Goods & Outbound',
    focusArea: 'Barang Jadi, Gudang & Jadwal Kirim',
    picName: 'Citra Dewi',
    color: '#30D158', // Apple Green
    glowColor: 'rgba(48, 209, 88, 0.4)',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    avatar: 'FG',
  },
  {
    id: 'ppic-4',
    code: 'PPIC 4',
    name: 'PPIC 4 - Packaging & Auxiliary',
    focusArea: 'Bahan Kemas, Label & Material Penunjang',
    picName: 'Dimas Prasetyo',
    color: '#BF5AF2', // Apple Purple
    glowColor: 'rgba(191, 90, 242, 0.4)',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    avatar: 'PK',
  },
  {
    id: 'ppic-5',
    code: 'PPIC 5',
    name: 'PPIC 5 - Capacity & Toll-Out',
    focusArea: 'Kapasitas Overload & Subkontraktor',
    picName: 'Eka Lestari',
    color: '#64D2FF', // Apple Teal/Cyan
    glowColor: 'rgba(100, 210, 255, 0.4)',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    avatar: 'CP',
  },
];
