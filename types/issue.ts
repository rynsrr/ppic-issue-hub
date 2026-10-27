export type PPICId = 'PPIC 1' | 'PPIC 2' | 'PPIC 3' | 'PPIC 4' | 'PPIC 5';

export const PPIC_KEYS: PPICId[] = ['PPIC 1', 'PPIC 2', 'PPIC 3', 'PPIC 4', 'PPIC 5'];

export interface Issue {
  id: string;
  ppic: PPICId;
  title: string;
  date: string; // YYYY-MM-DD
  status: 'BELUM_SELESAI' | 'SELESAI';
  createdAt: string; // ISO string for live elapsed time
  resolvedAt?: string | null;
}
