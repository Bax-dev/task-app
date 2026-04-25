// Returns the YYYY-MM-DD calendar date that `instant` falls on in the given IANA timezone.
// Used as the per-(task, user, day) dedupe key for overdue reminders.
export function getCalendarDateInTimezone(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const year = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

// Returns the YYYY-MM-DD that `dueDate` was picked for. dueDate is stored as
// midnight-UTC of the picked calendar date (from `new Date("YYYY-MM-DD").toISOString()`).
export function getCalendarDateFromDueDate(dueDate: Date): string {
  return getCalendarDateInTimezone(dueDate, 'UTC');
}

// Validates that a string is an IANA timezone name accepted by Intl.
export function isValidTimezone(tz: string): boolean {
  if (typeof tz !== 'string' || tz.length === 0 || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
