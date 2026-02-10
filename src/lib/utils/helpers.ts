export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function generateAnonId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('lnksy_anon_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('lnksy_anon_id', id);
  }
  return id;
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

export function isLinkVisible(link: {
  is_active: boolean;
  start_at: string | null;
  end_at: string | null;
}): boolean {
  if (!link.is_active) return false;
  const now = new Date();
  if (link.start_at && new Date(link.start_at) > now) return false;
  if (link.end_at && new Date(link.end_at) <= now) return false;
  return true;
}
