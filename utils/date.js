// Date utilities for week-based navigation

/**
 * Get the Monday of the week containing the given date
 * @param {Date} date - The date to find the Monday for
 * @returns {Date} - The Monday of that week
 */
export function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

/**
 * Get the Sunday of the week containing the given date
 * @param {Date} date - The date to find the Sunday for
 * @returns {Date} - The Sunday of that week
 */
export function getSunday(date) {
  const monday = getMonday(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return sunday;
}

/**
 * Get an array of dates for the week (Monday through Sunday)
 * @param {Date} referenceDate - Any date within the desired week
 * @returns {Array<Date>} - Array of 7 dates from Monday to Sunday
 */
export function getWeekDates(referenceDate) {
  const monday = getMonday(referenceDate);
  const dates = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date);
  }

  return dates;
}

/**
 * Format a date as YYYY-MM-DD (for Firestore keys)
 * @param {Date} date - The date to format
 * @returns {string} - Formatted date string
 */
export function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a date as a readable string (e.g., "Mon, Oct 7")
 * @param {Date} date - The date to format
 * @returns {string} - Formatted date string
 */
export function formatDateDisplay(date) {
  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Get the weekday name (Monday, Tuesday, etc.)
 * @param {Date} date - The date
 * @returns {string} - Weekday name
 */
export function getWeekdayName(date) {
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return weekdays[date.getDay()];
}

/**
 * Add or subtract weeks from a date
 * @param {Date} date - The starting date
 * @param {number} weeks - Number of weeks to add (positive) or subtract (negative)
 * @returns {Date} - The new date
 */
export function addWeeks(date, weeks) {
  const result = new Date(date);
  result.setDate(result.getDate() + (weeks * 7));
  return result;
}

/**
 * Check if a date is today
 * @param {Date} date - The date to check
 * @returns {boolean} - True if the date is today
 */
export function isToday(date) {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

/**
 * Get the week identifier (Monday's date) for Firestore storage
 * @param {Date} date - Any date within the week
 * @returns {string} - YYYY-MM-DD format of the Monday
 */
export function getWeekId(date) {
  return formatDate(getMonday(date));
}

/**
 * Get the biweekly identifier (Monday of the first week in the biweekly period)
 * Biweekly periods start on the first Monday of each month, then every 14 days
 * @param {Date} date - Any date within the biweekly period
 * @returns {string} - YYYY-MM-DD format of the period start
 */
export function getBiweekId(date) {
  const monday = getMonday(date);
  const firstOfMonth = new Date(monday.getFullYear(), monday.getMonth(), 1);
  const firstMonday = getMonday(firstOfMonth);

  const daysDiff = Math.floor((monday - firstMonday) / (1000 * 60 * 60 * 24));
  const biweekOffset = Math.floor(daysDiff / 14) * 14;

  const biweekStart = new Date(firstMonday);
  biweekStart.setDate(firstMonday.getDate() + biweekOffset);

  return formatDate(biweekStart);
}

/**
 * Get the month identifier for Firestore storage
 * @param {Date} date - Any date within the month
 * @returns {string} - YYYY-MM format
 */
export function getMonthId(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get the year identifier for Firestore storage
 * @param {Date} date - Any date within the year
 * @returns {string} - YYYY format
 */
export function getYearId(date) {
  return String(date.getFullYear());
}

/**
 * Get the start and end dates for a biweekly period
 * @param {Date} date - Any date within the biweekly period
 * @returns {Object} - {start: Date, end: Date}
 */
export function getBiweekDates(date) {
  const biweekId = getBiweekId(date);
  const start = new Date(biweekId);
  const end = new Date(start);
  end.setDate(start.getDate() + 13);
  return { start, end };
}

/**
 * Get the start and end dates for a month
 * @param {Date} date - Any date within the month
 * @returns {Object} - {start: Date, end: Date}
 */
export function getMonthDates(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start, end };
}

/**
 * Get the start and end dates for a year
 * @param {Date} date - Any date within the year
 * @returns {Object} - {start: Date, end: Date}
 */
export function getYearDates(date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const end = new Date(date.getFullYear(), 11, 31);
  return { start, end };
}

/**
 * Add or subtract months from a date
 * @param {Date} date - The starting date
 * @param {number} months - Number of months to add (positive) or subtract (negative)
 * @returns {Date} - The new date
 */
export function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Add or subtract years from a date
 * @param {Date} date - The starting date
 * @param {number} years - Number of years to add (positive) or subtract (negative)
 * @returns {Date} - The new date
 */
export function addYears(date, years) {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

/**
 * Get an array of all dates between start and end (inclusive)
 * @param {Date} start - Start date
 * @param {Date} end - End date
 * @returns {Array<Date>} - Array of dates
 */
export function getDateRange(start, end) {
  const dates = [];
  const current = new Date(start);

  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Format a month for display (e.g., "October 2025")
 * @param {Date} date - The date
 * @returns {string} - Formatted month string
 */
export function formatMonthDisplay(date) {
  const options = { month: 'long', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Format a date range for display
 * @param {Date} start - Start date
 * @param {Date} end - End date
 * @returns {string} - Formatted date range string
 */
export function formatDateRangeDisplay(start, end) {
  return `${formatDateDisplay(start)} - ${formatDateDisplay(end)}`;
}
