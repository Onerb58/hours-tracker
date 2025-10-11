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
