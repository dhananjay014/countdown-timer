/**
 * Time calculation utilities for countdown timers
 */

/**
 * Format total seconds into HH:MM:SS string
 */
export function formatTime(totalSeconds: number): string {
  if (totalSeconds < 0) totalSeconds = 0;

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map(n => n.toString().padStart(2, '0'))
    .join(':');
}

/**
 * Convert hours, minutes, seconds to total seconds
 */
export function parseTimeToSeconds(hours: number, minutes: number, seconds: number): number {
  return (hours * 3600) + (minutes * 60) + seconds;
}

/**
 * Calculate percentage of timer complete (0-100)
 */
export function calculatePercentComplete(total: number, remaining: number): number {
  if (total === 0) return 100;
  return Math.round(((total - remaining) / total) * 100);
}

/**
 * Format time remaining for event countdowns with smart formatting
 * Shows different formats based on time remaining
 */
export function formatEventTimeRemaining(targetDate: Date): string {
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return 'Event passed';
  }

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Less than 24 hours: show HH:MM:SS
  if (diffDays < 1) {
    return formatTime(diffSeconds);
  }

  // Less than 7 days: show "X days, Y hours, Z minutes"
  if (diffDays < 7) {
    const remainingHours = diffHours % 24;
    const remainingMinutes = diffMinutes % 60;
    return `${diffDays}d ${remainingHours}h ${remainingMinutes}m`;
  }

  // Less than 30 days: show "X days, Y hours"
  if (diffDays < 30) {
    const remainingHours = diffHours % 24;
    return `${diffDays} days, ${remainingHours} hours`;
  }

  // More than 30 days: show "X months, Y days"
  const months = Math.floor(diffDays / 30);
  const remainingDays = diffDays % 30;
  return `${months} month${months > 1 ? 's' : ''}, ${remainingDays} day${remainingDays !== 1 ? 's' : ''}`;
}

/**
 * Check if a date is in the past
 */
export function isPastDate(date: Date): boolean {
  return date.getTime() < Date.now();
}

/**
 * Get milliseconds until target date
 */
export function getMsUntil(targetDate: Date): number {
  return Math.max(0, targetDate.getTime() - Date.now());
}
