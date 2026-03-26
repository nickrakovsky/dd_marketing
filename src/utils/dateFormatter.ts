export function getFriendlyDate(date: Date | string | number | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  
  // NOTE: In Astro, this will use the build-time or server-time date.
  // For static sites, this means the dates will be relative to when `npm run build` happened.
  const now = new Date(); 

  const dMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = nowMidnight.getTime() - dMidnight.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  
  const dayOfWeek = nowMidnight.getDay(); // 0 is Sunday, 6 is Saturday
  
  // If the diff in days is less than or equal to the days passed since Sunday, it's this week
  if (diffDays <= dayOfWeek) return 'This Week';
  
  // If it's within the previous 7 days of that, it's last week
  if (diffDays <= dayOfWeek + 7) return 'Last Week';
  
  // Same month and year
  if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
    return 'Earlier This Month';
  }
  
  // Previous calendar month (handling year rollover)
  if (
    (now.getFullYear() === d.getFullYear() && now.getMonth() - d.getMonth() === 1) ||
    (now.getFullYear() - d.getFullYear() === 1 && now.getMonth() === 0 && d.getMonth() === 11)
  ) {
    return 'Last Month';
  }
  
  // Same year, but older than last month
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleString('en-US', { month: 'long' });
  } 
  
  // Older than this year
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}
