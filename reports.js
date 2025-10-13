// Reports Page Logic

import {
  db,
  signInWithGoogle,
  signOutUser,
  onAuthStateChange,
  getUserId
} from './firebase-config.js';

import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

import {
  formatDateDisplay,
  formatMonthDisplay,
  formatDateRangeDisplay,
  addWeeks,
  addMonths,
  addYears
} from './utils/date.js';

import {
  getPeriodDates,
  getPeriodId,
  calculateComparison,
  aggregateByDay,
  aggregateByWeek,
  aggregateByMonth,
  formatComparison,
  calculateRollup
} from './utils/reports.js';

import {
  formatDate,
  getWeekId
} from './utils/date.js';

import {
  exportReportCSV
} from './utils/export.js';

import {
  createHoursBarChart,
  createEarningsLineChart,
  createCombinedChart,
  destroyChart,
  formatChartLabels
} from './utils/charts.js';

// Application State
let currentPeriodType = 'weekly';
let currentPeriodDate = new Date();
let currentRollup = null;
let previousRollup = null;
let hoursChart = null;
let earningsChart = null;

// DOM Elements
const periodTypeSelect = document.getElementById('periodTypeSelect');
const periodRangeEl = document.getElementById('periodRange');
const prevPeriodBtn = document.getElementById('prevPeriodBtn');
const nextPeriodBtn = document.getElementById('nextPeriodBtn');
const loadingOverlayEl = document.getElementById('loadingOverlay');
const loginOverlayEl = document.getElementById('loginOverlay');
const googleSignInBtn = document.getElementById('googleSignInBtn');
const signOutBtn = document.getElementById('signOutBtn');
const userInfoEl = document.getElementById('userInfo');
const userEmailEl = document.getElementById('userEmail');
const exportReportBtn = document.getElementById('exportReportBtn');

// Summary cards
const cardTotalHours = document.getElementById('cardTotalHours');
const cardTotalEarnings = document.getElementById('cardTotalEarnings');
const cardDaysWorked = document.getElementById('cardDaysWorked');
const cardAvgHours = document.getElementById('cardAvgHours');
const cardHoursComparison = document.getElementById('cardHoursComparison');
const cardEarningsComparison = document.getElementById('cardEarningsComparison');
const cardDaysComparison = document.getElementById('cardDaysComparison');
const cardAvgComparison = document.getElementById('cardAvgComparison');

// Breakdown table
const breakdownTableBody = document.getElementById('breakdownTableBody');
const footerTotalHours = document.getElementById('footerTotalHours');
const footerTotalEarnings = document.getElementById('footerTotalEarnings');

// Charts
const hoursChartCanvas = document.getElementById('hoursChart');
const earningsChartCanvas = document.getElementById('earningsChart');

// Initialize the app
async function init() {
  try {
    loadingOverlayEl.classList.remove('hidden');

    // Setup auth state listener
    onAuthStateChange(async (user) => {
      if (user) {
        console.log('User signed in:', user.email);

        loginOverlayEl.classList.add('hidden');
        userEmailEl.textContent = user.email;
        userInfoEl.classList.remove('hidden');

        await loadReport(currentPeriodType, currentPeriodDate);

        loadingOverlayEl.classList.add('hidden');
      } else {
        console.log('User signed out');

        loadingOverlayEl.classList.add('hidden');
        loginOverlayEl.classList.remove('hidden');
        userInfoEl.classList.add('hidden');
      }
    });

    setupEventListeners();
  } catch (error) {
    console.error('Error initializing reports:', error);
    loadingOverlayEl.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <h2>Error</h2>
        <p>Failed to initialize reports. Please check your Firebase configuration.</p>
        <p style="color: #ef4444; font-size: 0.9rem; margin-top: 1rem;">${error.message}</p>
      </div>
    `;
  }
}

// Setup event listeners
function setupEventListeners() {
  googleSignInBtn.addEventListener('click', handleSignIn);
  signOutBtn.addEventListener('click', handleSignOut);

  periodTypeSelect.addEventListener('change', (e) => {
    currentPeriodType = e.target.value;
    loadReport(currentPeriodType, currentPeriodDate);
  });

  prevPeriodBtn.addEventListener('click', () => {
    currentPeriodDate = navigatePeriod(currentPeriodType, currentPeriodDate, -1);
    loadReport(currentPeriodType, currentPeriodDate);
  });

  nextPeriodBtn.addEventListener('click', () => {
    currentPeriodDate = navigatePeriod(currentPeriodType, currentPeriodDate, 1);
    loadReport(currentPeriodType, currentPeriodDate);
  });

  exportReportBtn.addEventListener('click', handleExportReport);
}

// Handle Google Sign-In
async function handleSignIn() {
  try {
    loadingOverlayEl.classList.remove('hidden');
    await signInWithGoogle();
  } catch (error) {
    console.error('Error signing in:', error);
    loadingOverlayEl.classList.add('hidden');
    alert('Failed to sign in. Please try again.');
  }
}

// Handle Sign-Out
async function handleSignOut() {
  try {
    const confirmSignOut = confirm('Are you sure you want to sign out?');
    if (!confirmSignOut) return;

    loadingOverlayEl.classList.remove('hidden');
    await signOutUser();
  } catch (error) {
    console.error('Error signing out:', error);
    loadingOverlayEl.classList.add('hidden');
    alert('Failed to sign out. Please try again.');
  }
}

// Navigate to previous/next period
function navigatePeriod(periodType, currentDate, direction) {
  switch (periodType) {
    case 'weekly':
      return addWeeks(currentDate, direction);
    case 'biweekly':
      return addWeeks(currentDate, direction * 2);
    case 'monthly':
      return addMonths(currentDate, direction);
    case 'yearly':
      return addYears(currentDate, direction);
    default:
      return currentDate;
  }
}

// Load report for a specific period
async function loadReport(periodType, periodDate) {
  try {
    loadingOverlayEl.classList.remove('hidden');

    const userId = getUserId();

    // Check if user is authenticated
    if (!userId) {
      console.error('No user ID available');
      loadingOverlayEl.classList.add('hidden');
      return;
    }

    const periodId = getPeriodId(periodType, periodDate);
    const { start, end } = getPeriodDates(periodType, periodDate);

    // Update period display
    updatePeriodDisplay(periodType, start, end);

    // Load current period rollup
    const rollupRef = doc(db, `users/${userId}/earnings-rollups`, `${periodType}-${periodId}`);
    const rollupSnap = await getDoc(rollupRef);

    if (rollupSnap.exists()) {
      currentRollup = rollupSnap.data();
    } else {
      // No rollup data found - try to generate it from existing entries
      console.log(`No rollup data found for ${periodType} ${periodId}, attempting to generate from entries...`);

      const entries = await loadEntriesForPeriod(userId, start, end);

      if (entries.length > 0) {
        // Generate rollup from entries
        currentRollup = calculateRollup(entries, start, end);

        // Save the generated rollup
        await setDoc(rollupRef, currentRollup);
        console.log(`Generated and saved rollup for ${periodType} ${periodId} with ${entries.length} entries`);
      } else {
        // No entries for this period
        currentRollup = {
          periodStart: start.toISOString().split('T')[0],
          periodEnd: end.toISOString().split('T')[0],
          totalHours: 0,
          totalEarnings: 0,
          daysWorked: 0,
          averageHoursPerDay: 0,
          entries: []
        };
      }
    }

    // Load previous period rollup for comparison
    const prevPeriodDate = navigatePeriod(periodType, periodDate, -1);
    const prevPeriodId = getPeriodId(periodType, prevPeriodDate);
    const prevRollupRef = doc(db, `users/${userId}/earnings-rollups`, `${periodType}-${prevPeriodId}`);
    const prevRollupSnap = await getDoc(prevRollupRef);

    if (prevRollupSnap.exists()) {
      previousRollup = prevRollupSnap.data();
    } else {
      previousRollup = null;
    }

    // Calculate comparison
    const comparison = calculateComparison(currentRollup, previousRollup);

    // Update UI
    updateSummaryCards(currentRollup, comparison);
    updateBreakdownTable(currentRollup);
    updateCharts(currentRollup, periodType);

    loadingOverlayEl.classList.add('hidden');
  } catch (error) {
    console.error('Error loading report:', error);
    console.error('Error details:', error.message, error.stack);
    loadingOverlayEl.classList.add('hidden');

    // Show user-friendly error message
    const errorMessage = error.message || 'Unknown error';
    alert(`Failed to load report: ${errorMessage}\n\nPlease try again or check the console for details.`);
  }
}

// Update period display
function updatePeriodDisplay(periodType, start, end) {
  let displayText = '';

  switch (periodType) {
    case 'weekly':
      displayText = `Week of ${formatDateRangeDisplay(start, end)}`;
      break;
    case 'biweekly':
      displayText = `Biweekly: ${formatDateRangeDisplay(start, end)}`;
      break;
    case 'monthly':
      displayText = formatMonthDisplay(start);
      break;
    case 'yearly':
      displayText = start.getFullYear().toString();
      break;
  }

  periodRangeEl.textContent = displayText;
}

// Update summary cards
function updateSummaryCards(rollup, comparison) {
  // Update values
  cardTotalHours.textContent = rollup.totalHours.toFixed(1);
  cardTotalEarnings.textContent = `$${rollup.totalEarnings.toFixed(2)}`;
  cardDaysWorked.textContent = rollup.daysWorked;
  cardAvgHours.textContent = rollup.averageHoursPerDay.toFixed(2);

  // Update comparisons
  updateComparisonElement(cardHoursComparison, comparison.hoursChange, comparison.hoursChangePercent);
  updateComparisonElement(cardEarningsComparison, comparison.earningsChange, comparison.earningsChangePercent, true);
  updateComparisonElement(cardDaysComparison, comparison.daysWorkedChange, null);
  updateComparisonElement(cardAvgComparison, comparison.averageHoursChange, null);
}

// Update comparison element
function updateComparisonElement(element, change, changePercent, isCurrency = false) {
  if (change === 0 && !changePercent) {
    element.textContent = 'No change';
    element.className = 'card-comparison';
    return;
  }

  const isPositive = change >= 0;
  const sign = isPositive ? '+' : '';

  let displayText = '';
  if (isCurrency) {
    displayText = `${sign}$${Math.abs(change).toFixed(2)}`;
  } else {
    displayText = `${sign}${change.toFixed(1)}`;
  }

  if (changePercent !== null && changePercent !== undefined) {
    displayText += ` (${sign}${changePercent.toFixed(1)}%)`;
  }

  element.textContent = displayText + ' vs previous';
  element.className = `card-comparison ${isPositive ? 'positive' : 'negative'}`;
}

// Update breakdown table
function updateBreakdownTable(rollup) {
  breakdownTableBody.innerHTML = '';

  if (!rollup.entries || rollup.entries.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td colspan="7" style="text-align: center; padding: 2rem;">
        <div style="color: var(--text-secondary);">
          <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">📊 No entries for this period</p>
          <p style="font-size: 0.9rem;">Add work hours on the <a href="index.html" style="color: var(--primary-color);">tracker page</a> to see reports here.</p>
        </div>
      </td>
    `;
    breakdownTableBody.appendChild(row);

    footerTotalHours.textContent = '0';
    footerTotalEarnings.textContent = '$0.00';
    return;
  }

  // Sort entries by date
  const sortedEntries = [...rollup.entries].sort((a, b) =>
    new Date(a.date) - new Date(b.date)
  );

  sortedEntries.forEach(entry => {
    const hours = parseFloat(entry.hours) || 0;
    const rate = parseFloat(entry.hourlyRate) || 0;
    const earnings = hours * rate;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="date-cell">${formatDateDisplay(new Date(entry.date))}</td>
      <td class="day-cell">${entry.weekday}</td>
      <td>${hours.toFixed(1)}</td>
      <td>$${rate.toFixed(2)}</td>
      <td class="earnings-cell">$${earnings.toFixed(2)}</td>
      <td>${entry.coworker || '-'}</td>
      <td>${entry.notes || '-'}</td>
    `;

    breakdownTableBody.appendChild(row);
  });

  // Update footer totals
  footerTotalHours.textContent = rollup.totalHours.toFixed(1);
  footerTotalEarnings.textContent = `$${rollup.totalEarnings.toFixed(2)}`;
}

// Update charts
function updateCharts(rollup, periodType) {
  // Destroy existing charts
  if (hoursChart) {
    destroyChart(hoursChart);
    hoursChart = null;
  }
  if (earningsChart) {
    destroyChart(earningsChart);
    earningsChart = null;
  }

  if (!rollup.entries || rollup.entries.length === 0) {
    return;
  }

  // Aggregate data based on period type
  let aggregatedData, labelField;

  if (periodType === 'weekly' || periodType === 'biweekly') {
    aggregatedData = aggregateByDay(rollup.entries);
    labelField = 'date';
  } else if (periodType === 'monthly') {
    aggregatedData = aggregateByWeek(rollup.entries);
    labelField = 'weekId';
  } else {
    aggregatedData = aggregateByMonth(rollup.entries);
    labelField = 'monthId';
  }

  // Format labels
  const labels = formatChartLabels(aggregatedData, labelField);
  const hoursData = aggregatedData.map(d => d.hours);
  const earningsData = aggregatedData.map(d => d.earnings);

  // Create charts
  hoursChart = createHoursBarChart(hoursChartCanvas, labels, hoursData);
  earningsChart = createEarningsLineChart(earningsChartCanvas, labels, earningsData);
}

// Load entries for a specific date range
async function loadEntriesForPeriod(userId, startDate, endDate) {
  const allEntries = [];

  // Get all dates in the range
  const dates = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  // Load entries for each date
  for (const date of dates) {
    const weekId = getWeekId(date);
    const dateStr = formatDate(date);
    const entryRef = doc(db, `users/${userId}/weeks/${weekId}/entries`, dateStr);

    try {
      const entrySnap = await getDoc(entryRef);
      if (entrySnap.exists()) {
        const entryData = entrySnap.data();
        // Only include entries with hours > 0
        if (entryData.hours && parseFloat(entryData.hours) > 0) {
          allEntries.push(entryData);
        }
      }
    } catch (error) {
      console.error(`Error loading entry for ${dateStr}:`, error);
    }
  }

  return allEntries;
}

// Handle export report
function handleExportReport() {
  if (!currentRollup) {
    alert('No data to export');
    return;
  }

  const comparison = calculateComparison(currentRollup, previousRollup);
  const periodId = getPeriodId(currentPeriodType, currentPeriodDate);

  exportReportCSV(currentRollup, comparison, currentPeriodType, periodId);
}

// Start the app
init();
