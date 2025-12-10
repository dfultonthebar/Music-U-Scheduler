// Timezone utilities for Music-U-Scheduler
// All times should be in Central Standard Time (America/Chicago)

export const APP_TIMEZONE = 'America/Chicago';

/**
 * Format a date string or Date object to display in CST
 * @param dateInput - ISO date string or Date object
 * @param options - Intl.DateTimeFormat options
 */
export function formatInCST(
  dateInput: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {}
): string {
  if (!dateInput) return '';

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

  if (isNaN(date.getTime())) return '';

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: APP_TIMEZONE,
    ...options
  };

  return date.toLocaleString('en-US', defaultOptions);
}

/**
 * Format date only in CST
 */
export function formatDateCST(dateInput: string | Date | null | undefined): string {
  return formatInCST(dateInput, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format time only in CST
 */
export function formatTimeCST(dateInput: string | Date | null | undefined): string {
  return formatInCST(dateInput, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format full date and time in CST
 */
export function formatDateTimeCST(dateInput: string | Date | null | undefined): string {
  return formatInCST(dateInput, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Get current date in CST as ISO string for date inputs
 */
export function getTodayCST(): string {
  const now = new Date();
  return now.toLocaleDateString('en-CA', { timeZone: APP_TIMEZONE }); // Returns YYYY-MM-DD
}

/**
 * Parse a local time input and create an ISO string that represents that time in CST
 * This is useful when the user selects a date/time and we want to store it as-is
 */
export function createCSTDateTime(date: string, time: string): string {
  // Create a datetime string without timezone info
  // The backend will store this as a naive datetime representing CST
  return `${date}T${time}:00`;
}
