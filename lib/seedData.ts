import { Issue } from '@/types/issue';

export const INITIAL_ISSUES: Issue[] = [
  {
    id: 'ISS-1',
    ppic: 'PPIC 1',
    title: 'Keterlambatan armada resin grade A dari supplier',
    date: '2026-10-26',
    status: 'BELUM_SELESAI',
    createdAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ISS-2',
    ppic: 'PPIC 2',
    title: 'Overheat bearing conveyor extruder line 3',
    date: '2026-10-27',
    status: 'BELUM_SELESAI',
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ISS-3',
    ppic: 'PPIC 4',
    title: 'Barcode stiker master carton tidak terbaca scanner gate 2',
    date: '2026-10-27',
    status: 'BELUM_SELESAI',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ISS-4',
    ppic: 'PPIC 3',
    title: 'Penjadwalan ulang muat truk wingbox tujuan Cikupa',
    date: '2026-10-25',
    status: 'SELESAI',
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ISS-5',
    ppic: 'PPIC 5',
    title: 'Kapasitas sachet 250ml overload, alokasi split ke subkontraktor',
    date: '2026-10-24',
    status: 'SELESAI',
    createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 60 * 3600 * 1000).toISOString(),
  },
];
