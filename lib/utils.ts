export function getElapsedTime(dateString: string): {
  text: string;
  isOverdue: boolean;
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
  if (days > 0) {
    text = `${days}h ${hours}j lalu`;
  } else if (hours > 0) {
    text = `${hours}j ${minutes}m lalu`;
  } else {
    text = `${Math.max(1, minutes)}m lalu`;
  }

  // Overdue if more than 24 hours
  const isOverdue = totalHours >= 24;

  return { text, isOverdue };
}

export function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatIndoDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
  } catch {
    return dateStr;
  }
}
