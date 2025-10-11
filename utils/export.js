// CSV Export utilities

import { formatDate, getWeekdayName } from './date.js';

/**
 * Convert entries to CSV format
 * @param {Array<Object>} entries - Array of entry objects
 * @returns {string} - CSV formatted string
 */
function entriesToCSV(entries) {
  // CSV headers
  const headers = ['Date', 'Weekday', 'Hours', 'Task', 'Notes'];

  // Sort entries by date
  const sortedEntries = entries.sort((a, b) =>
    new Date(a.date) - new Date(b.date)
  );

  // Convert entries to CSV rows
  const rows = sortedEntries.map(entry => [
    entry.date,
    entry.weekday,
    entry.hours || 0,
    entry.task || '',
    entry.notes || ''
  ]);

  // Escape CSV values (handle commas and quotes)
  const escapeCSV = (value) => {
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Build CSV content
  const csvLines = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ];

  return csvLines.join('\n');
}

/**
 * Download a CSV file
 * @param {string} csvContent - The CSV content as a string
 * @param {string} filename - The desired filename
 */
function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (navigator.msSaveBlob) {
    // For IE 10+
    navigator.msSaveBlob(blob, filename);
  } else {
    // For other browsers
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Export entries for the current week
 * @param {Array<Object>} entries - Array of entry objects for the week
 * @param {Date} weekStartDate - The Monday of the week
 */
export function exportWeekCSV(entries, weekStartDate) {
  const csvContent = entriesToCSV(entries);
  const dateStr = formatDate(weekStartDate);
  const filename = `work-hours-week-${dateStr}.csv`;
  downloadCSV(csvContent, filename);
}

/**
 * Export all entries
 * @param {Array<Object>} allEntries - Array of all entry objects
 */
export function exportAllCSV(allEntries) {
  const csvContent = entriesToCSV(allEntries);
  const today = formatDate(new Date());
  const filename = `work-hours-all-${today}.csv`;
  downloadCSV(csvContent, filename);
}

/**
 * Calculate total hours for a set of entries
 * @param {Array<Object>} entries - Array of entry objects
 * @returns {number} - Total hours
 */
export function calculateTotalHours(entries) {
  return entries.reduce((total, entry) => {
    const hours = parseFloat(entry.hours) || 0;
    return total + hours;
  }, 0);
}

/**
 * Generate a summary report for entries
 * @param {Array<Object>} entries - Array of entry objects
 * @returns {Object} - Summary statistics
 */
export function generateSummary(entries) {
  const totalHours = calculateTotalHours(entries);
  const daysWorked = entries.filter(e => e.hours > 0).length;
  const averageHours = daysWorked > 0 ? (totalHours / daysWorked).toFixed(2) : 0;

  return {
    totalHours: totalHours.toFixed(2),
    daysWorked,
    averageHours
  };
}
