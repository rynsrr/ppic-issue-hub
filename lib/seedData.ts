import { Issue } from '@/types/issue';

export const INITIAL_ISSUES: Issue[] = [
  {
    id: 'ISS-1',
    ppic: 'PPIC 1',
    title: 'Grade A polymer resin shipment delayed from primary vendor',
    date: '2026-10-26',
    status: 'BELUM_SELESAI',
    createdAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ISS-2',
    ppic: 'PPIC 2',
    title: 'Extruder line 3 conveyor motor bearing overheating',
    date: '2026-10-27',
    status: 'BELUM_SELESAI',
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ISS-3',
    ppic: 'PPIC 4',
    title: 'Master carton box barcode scanner read failure at Gate 2',
    date: '2026-10-27',
    status: 'BELUM_SELESAI',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ISS-4',
    ppic: 'PPIC 3',
    title: 'Outbound wingbox freight dispatch rescheduled for DC Hub',
    date: '2026-10-25',
    status: 'SELESAI',
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ISS-5',
    ppic: 'PPIC 5',
    title: '250ml pouch packaging line overload, PO split to subcontractor',
    date: '2026-10-24',
    status: 'SELESAI',
    createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 60 * 3600 * 1000).toISOString(),
  },
];
