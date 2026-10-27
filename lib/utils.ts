import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculates human-readable elapsed duration from a date string (Indonesian)
 */
export function getElapsedTimeDetailed(dateString: string): {
  text: string;
  shortText: string;
  hoursElapsed: number;
  daysElapsed: number;
  urgencyLevel: 'normal' | 'warning' | 'critical';
} {
  const start = new Date(dateString).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - start);

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;

  let text = '';
  let shortText = '';

  if (days > 0) {
    text = `${days} hari ${hours} jam ${minutes} menit lalu`;
    shortText = `${days}h ${hours}j`;
  } else if (hours > 0) {
    text = `${hours} jam ${minutes} menit lalu`;
    shortText = `${hours}j ${minutes}m`;
  } else {
    text = `${Math.max(1, minutes)} menit lalu`;
    shortText = `${Math.max(1, minutes)}m`;
  }

  let urgencyLevel: 'normal' | 'warning' | 'critical' = 'normal';
  if (totalHours >= 24) {
    urgencyLevel = 'critical';
  } else if (totalHours >= 8) {
    urgencyLevel = 'warning';
  }

  return {
    text,
    shortText,
    hoursElapsed: totalHours,
    daysElapsed: days,
    urgencyLevel,
  };
}

/**
 * Format date to Indonesian localized display (e.g., 27 Oktober 2026)
 */
export function formatDateIndo(dateStr: string, includeTime = false): string {
  try {
    const d = new Date(dateStr);
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    if (!includeTime) {
      return `${day} ${month} ${year}`;
    }

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  } catch {
    return dateStr;
  }
}

/**
 * Get date key string YYYY-MM-DD
 */
export function toDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
