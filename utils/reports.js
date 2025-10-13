// Reports and Rollup utilities

import {
  formatDate,
  getWeekId,
  getBiweekId,
  getMonthId,
  getYearId,
  getWeekDates,
  getBiweekDates,
  getMonthDates,
  getYearDates,
  getDateRange,
  getMonday,
  parseLocalDate
} from './date.js';

/**
 * Calculate rollup data for a given period and entries
 * @param {Array<Object>} entries - Array of entry objects
 * @param {Date} periodStart - Start date of the period
 * @param {Date} periodEnd - End date of the period
 * @returns {Object} - Rollup data
 */
export function calculateRollup(entries, periodStart, periodEnd) {
  // Normalize dates to midnight for accurate comparison
  const normalizeDate = (d) => {
    const normalized = new Date(d);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  const start = normalizeDate(periodStart);
  const end = normalizeDate(periodEnd);

  // Filter entries within the period
  const periodEntries = entries.filter(entry => {
    const entryDate = parseLocalDate(entry.date);
    const isInRange = entryDate >= start && entryDate <= end;
    console.log(`Filtering ${entry.date}: entryDate=${entryDate.toISOString()}, start=${start.toISOString()}, end=${end.toISOString()}, inRange=${isInRange}`);
    return isInRange;
  });

  // Calculate totals
  const totalHours = periodEntries.reduce((sum, entry) => {
    return sum + (parseFloat(entry.hours) || 0);
  }, 0);

  const totalEarnings = periodEntries.reduce((sum, entry) => {
    const hours = parseFloat(entry.hours) || 0;
    const rate = parseFloat(entry.hourlyRate) || 0;
    return sum + (hours * rate);
  }, 0);

  const daysWorked = periodEntries.filter(e => (e.hours || 0) > 0).length;
  const averageHoursPerDay = daysWorked > 0 ? totalHours / daysWorked : 0;

  // Get all dates in the period for aggregation
  const allDates = getDateRange(periodStart, periodEnd);
  const totalDays = allDates.length;
  const averageHoursPerDayIncludingNonWork = totalDays > 0 ? totalHours / totalDays : 0;

  return {
    periodStart: formatDate(periodStart),
    periodEnd: formatDate(periodEnd),
    totalHours: parseFloat(totalHours.toFixed(2)),
    totalEarnings: parseFloat(totalEarnings.toFixed(2)),
    daysWorked,
    totalDays,
    averageHoursPerDay: parseFloat(averageHoursPerDay.toFixed(2)),
    averageHoursPerDayIncludingNonWork: parseFloat(averageHoursPerDayIncludingNonWork.toFixed(2)),
    entries: periodEntries,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Get rollup IDs for all affected periods when an entry is saved
 * @param {Date} entryDate - The date of the entry being saved
 * @returns {Object} - Object with period type keys and period ID values
 */
export function getAffectedPeriodIds(entryDate) {
  return {
    weekly: getWeekId(entryDate),
    biweekly: getBiweekId(entryDate),
    monthly: getMonthId(entryDate),
    yearly: getYearId(entryDate)
  };
}

/**
 * Get period dates based on period type and reference date
 * @param {string} periodType - 'weekly', 'biweekly', 'monthly', or 'yearly'
 * @param {Date} referenceDate - Any date within the period
 * @returns {Object} - {start: Date, end: Date}
 */
export function getPeriodDates(periodType, referenceDate) {
  switch (periodType) {
    case 'weekly': {
      const monday = getMonday(referenceDate);
      const dates = getWeekDates(referenceDate);
      return { start: dates[0], end: dates[6] };
    }
    case 'biweekly':
      return getBiweekDates(referenceDate);
    case 'monthly':
      return getMonthDates(referenceDate);
    case 'yearly':
      return getYearDates(referenceDate);
    default:
      throw new Error(`Invalid period type: ${periodType}`);
  }
}

/**
 * Get period ID based on period type and reference date
 * @param {string} periodType - 'weekly', 'biweekly', 'monthly', or 'yearly'
 * @param {Date} referenceDate - Any date within the period
 * @returns {string} - Period ID
 */
export function getPeriodId(periodType, referenceDate) {
  switch (periodType) {
    case 'weekly':
      return getWeekId(referenceDate);
    case 'biweekly':
      return getBiweekId(referenceDate);
    case 'monthly':
      return getMonthId(referenceDate);
    case 'yearly':
      return getYearId(referenceDate);
    default:
      throw new Error(`Invalid period type: ${periodType}`);
  }
}

/**
 * Calculate comparison data between current and previous period
 * @param {Object} currentRollup - Current period rollup data
 * @param {Object} previousRollup - Previous period rollup data
 * @returns {Object} - Comparison data with percentage changes
 */
export function calculateComparison(currentRollup, previousRollup) {
  if (!previousRollup || !previousRollup.totalHours) {
    return {
      hoursChange: 0,
      hoursChangePercent: 0,
      earningsChange: 0,
      earningsChangePercent: 0,
      daysWorkedChange: 0,
      averageHoursChange: 0
    };
  }

  const hoursChange = currentRollup.totalHours - previousRollup.totalHours;
  const hoursChangePercent = previousRollup.totalHours > 0
    ? (hoursChange / previousRollup.totalHours) * 100
    : 0;

  const earningsChange = currentRollup.totalEarnings - previousRollup.totalEarnings;
  const earningsChangePercent = previousRollup.totalEarnings > 0
    ? (earningsChange / previousRollup.totalEarnings) * 100
    : 0;

  const daysWorkedChange = currentRollup.daysWorked - previousRollup.daysWorked;

  const averageHoursChange = currentRollup.averageHoursPerDay - previousRollup.averageHoursPerDay;

  return {
    hoursChange: parseFloat(hoursChange.toFixed(2)),
    hoursChangePercent: parseFloat(hoursChangePercent.toFixed(1)),
    earningsChange: parseFloat(earningsChange.toFixed(2)),
    earningsChangePercent: parseFloat(earningsChangePercent.toFixed(1)),
    daysWorkedChange,
    averageHoursChange: parseFloat(averageHoursChange.toFixed(2))
  };
}

/**
 * Aggregate entries by day for chart display
 * @param {Array<Object>} entries - Array of entry objects
 * @returns {Array<Object>} - Array of {date, hours, earnings} objects
 */
export function aggregateByDay(entries) {
  const dayMap = {};

  entries.forEach(entry => {
    const date = entry.date;
    if (!dayMap[date]) {
      dayMap[date] = {
        date,
        hours: 0,
        earnings: 0
      };
    }

    dayMap[date].hours += parseFloat(entry.hours) || 0;
    dayMap[date].earnings += (parseFloat(entry.hours) || 0) * (parseFloat(entry.hourlyRate) || 0);
  });

  // Convert to array and sort by date
  return Object.values(dayMap).sort((a, b) => parseLocalDate(a.date) - parseLocalDate(b.date));
}

/**
 * Aggregate entries by week for chart display
 * @param {Array<Object>} entries - Array of entry objects
 * @returns {Array<Object>} - Array of {weekId, hours, earnings} objects
 */
export function aggregateByWeek(entries) {
  const weekMap = {};

  entries.forEach(entry => {
    const entryDate = parseLocalDate(entry.date);
    const weekId = getWeekId(entryDate);

    if (!weekMap[weekId]) {
      weekMap[weekId] = {
        weekId,
        hours: 0,
        earnings: 0
      };
    }

    weekMap[weekId].hours += parseFloat(entry.hours) || 0;
    weekMap[weekId].earnings += (parseFloat(entry.hours) || 0) * (parseFloat(entry.hourlyRate) || 0);
  });

  // Convert to array and sort by week
  return Object.values(weekMap).sort((a, b) => a.weekId.localeCompare(b.weekId));
}

/**
 * Aggregate entries by month for chart display
 * @param {Array<Object>} entries - Array of entry objects
 * @returns {Array<Object>} - Array of {monthId, hours, earnings} objects
 */
export function aggregateByMonth(entries) {
  const monthMap = {};

  entries.forEach(entry => {
    const entryDate = parseLocalDate(entry.date);
    const monthId = getMonthId(entryDate);

    if (!monthMap[monthId]) {
      monthMap[monthId] = {
        monthId,
        hours: 0,
        earnings: 0
      };
    }

    monthMap[monthId].hours += parseFloat(entry.hours) || 0;
    monthMap[monthId].earnings += (parseFloat(entry.hours) || 0) * (parseFloat(entry.hourlyRate) || 0);
  });

  // Convert to array and sort by month
  return Object.values(monthMap).sort((a, b) => a.monthId.localeCompare(b.monthId));
}

/**
 * Format comparison value for display with + or - sign
 * @param {number} value - The value to format
 * @param {boolean} isPercent - Whether the value is a percentage
 * @param {boolean} isCurrency - Whether the value is currency
 * @returns {string} - Formatted string
 */
export function formatComparison(value, isPercent = false, isCurrency = false) {
  const sign = value >= 0 ? '+' : '';

  if (isCurrency) {
    return `${sign}$${Math.abs(value).toFixed(2)}`;
  }

  if (isPercent) {
    return `${sign}${value.toFixed(1)}%`;
  }

  return `${sign}${value.toFixed(2)}`;
}
