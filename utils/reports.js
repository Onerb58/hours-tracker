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
 * Calculate earnings with overtime for a week of entries
 * Overtime rate is 1.5x after 40 hours per week
 * @param {Array<Object>} weekEntries - Array of entry objects for a single week
 * @returns {Object} - {regularHours, overtimeHours, regularEarnings, overtimeEarnings, totalEarnings}
 */
export function calculateWeeklyEarningsWithOvertime(weekEntries) {
  // Calculate total hours for the week
  const totalHours = weekEntries.reduce((sum, entry) => {
    return sum + (parseFloat(entry.hours) || 0);
  }, 0);

  // Get the hourly rate (assume all entries in the week have the same rate, use the first non-zero one)
  const hourlyRate = weekEntries.find(e => e.hourlyRate)?.hourlyRate || 0;

  let regularHours = 0;
  let overtimeHours = 0;
  let regularEarnings = 0;
  let overtimeEarnings = 0;

  if (totalHours <= 40) {
    // No overtime
    regularHours = totalHours;
    regularEarnings = totalHours * hourlyRate;
  } else {
    // Overtime applies
    regularHours = 40;
    overtimeHours = totalHours - 40;
    regularEarnings = 40 * hourlyRate;
    overtimeEarnings = overtimeHours * hourlyRate * 1.5;
  }

  return {
    regularHours: parseFloat(regularHours.toFixed(2)),
    overtimeHours: parseFloat(overtimeHours.toFixed(2)),
    regularEarnings: parseFloat(regularEarnings.toFixed(2)),
    overtimeEarnings: parseFloat(overtimeEarnings.toFixed(2)),
    totalEarnings: parseFloat((regularEarnings + overtimeEarnings).toFixed(2))
  };
}

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

  // Group entries by week for overtime calculation
  const entriesByWeek = {};
  periodEntries.forEach(entry => {
    const entryDate = parseLocalDate(entry.date);
    const weekId = getWeekId(entryDate);
    if (!entriesByWeek[weekId]) {
      entriesByWeek[weekId] = [];
    }
    entriesByWeek[weekId].push(entry);
  });

  // Calculate earnings with overtime for each week, then sum
  let totalEarnings = 0;
  let totalRegularHours = 0;
  let totalOvertimeHours = 0;
  let totalRegularEarnings = 0;
  let totalOvertimeEarnings = 0;

  Object.values(entriesByWeek).forEach(weekEntries => {
    const weekCalc = calculateWeeklyEarningsWithOvertime(weekEntries);
    totalRegularHours += weekCalc.regularHours;
    totalOvertimeHours += weekCalc.overtimeHours;
    totalRegularEarnings += weekCalc.regularEarnings;
    totalOvertimeEarnings += weekCalc.overtimeEarnings;
    totalEarnings += weekCalc.totalEarnings;
  });

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
    regularHours: parseFloat(totalRegularHours.toFixed(2)),
    overtimeHours: parseFloat(totalOvertimeHours.toFixed(2)),
    totalEarnings: parseFloat(totalEarnings.toFixed(2)),
    regularEarnings: parseFloat(totalRegularEarnings.toFixed(2)),
    overtimeEarnings: parseFloat(totalOvertimeEarnings.toFixed(2)),
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
 * @returns {Array<Object>} - Array of {weekId, hours, earnings, overtimeHours, overtimeEarnings} objects
 */
export function aggregateByWeek(entries) {
  const weekMap = {};

  entries.forEach(entry => {
    const entryDate = parseLocalDate(entry.date);
    const weekId = getWeekId(entryDate);

    if (!weekMap[weekId]) {
      weekMap[weekId] = [];
    }

    weekMap[weekId].push(entry);
  });

  // Calculate earnings with overtime for each week
  const result = Object.entries(weekMap).map(([weekId, weekEntries]) => {
    const totalHours = weekEntries.reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0);
    const overtimeCalc = calculateWeeklyEarningsWithOvertime(weekEntries);

    return {
      weekId,
      hours: parseFloat(totalHours.toFixed(2)),
      earnings: overtimeCalc.totalEarnings,
      regularHours: overtimeCalc.regularHours,
      overtimeHours: overtimeCalc.overtimeHours,
      regularEarnings: overtimeCalc.regularEarnings,
      overtimeEarnings: overtimeCalc.overtimeEarnings
    };
  });

  // Sort by week
  return result.sort((a, b) => a.weekId.localeCompare(b.weekId));
}

/**
 * Aggregate entries by month for chart display (with overtime calculated per week)
 * @param {Array<Object>} entries - Array of entry objects
 * @returns {Array<Object>} - Array of {monthId, hours, earnings, overtimeHours, overtimeEarnings} objects
 */
export function aggregateByMonth(entries) {
  // First group by week to calculate overtime
  const weekMap = {};
  entries.forEach(entry => {
    const entryDate = parseLocalDate(entry.date);
    const weekId = getWeekId(entryDate);
    if (!weekMap[weekId]) {
      weekMap[weekId] = {
        entries: [],
        monthId: getMonthId(entryDate)
      };
    }
    weekMap[weekId].entries.push(entry);
  });

  // Calculate overtime for each week, then group by month
  const monthMap = {};
  Object.entries(weekMap).forEach(([weekId, weekData]) => {
    const monthId = weekData.monthId;
    const overtimeCalc = calculateWeeklyEarningsWithOvertime(weekData.entries);
    const totalHours = weekData.entries.reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0);

    if (!monthMap[monthId]) {
      monthMap[monthId] = {
        monthId,
        hours: 0,
        earnings: 0,
        regularHours: 0,
        overtimeHours: 0,
        regularEarnings: 0,
        overtimeEarnings: 0
      };
    }

    monthMap[monthId].hours += totalHours;
    monthMap[monthId].earnings += overtimeCalc.totalEarnings;
    monthMap[monthId].regularHours += overtimeCalc.regularHours;
    monthMap[monthId].overtimeHours += overtimeCalc.overtimeHours;
    monthMap[monthId].regularEarnings += overtimeCalc.regularEarnings;
    monthMap[monthId].overtimeEarnings += overtimeCalc.overtimeEarnings;
  });

  // Convert to array and sort by month
  const result = Object.values(monthMap).map(month => ({
    ...month,
    hours: parseFloat(month.hours.toFixed(2)),
    earnings: parseFloat(month.earnings.toFixed(2)),
    regularHours: parseFloat(month.regularHours.toFixed(2)),
    overtimeHours: parseFloat(month.overtimeHours.toFixed(2)),
    regularEarnings: parseFloat(month.regularEarnings.toFixed(2)),
    overtimeEarnings: parseFloat(month.overtimeEarnings.toFixed(2))
  }));

  return result.sort((a, b) => a.monthId.localeCompare(b.monthId));
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
