// Main Application Logic
import {
  db,
  signInWithGoogle,
  signOutUser,
  onAuthStateChange,
  getUserId,
  getCurrentUser
} from './firebase-config.js';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

import {
  getWeekDates,
  formatDate,
  formatDateDisplay,
  getWeekdayName,
  addWeeks,
  isToday,
  getWeekId,
  getMonday,
  getSunday
} from './utils/date.js';

import {
  exportWeekCSV,
  exportAllCSV,
  generateSummary
} from './utils/export.js';

import {
  calculateRollup,
  getAffectedPeriodIds,
  getPeriodDates
} from './utils/reports.js';

// Application State
let currentWeekStart = new Date();
let weekEntries = [];
let saveTimeout = null;
let currentHourlyRate = 0; // Current hourly rate from settings

// DOM Elements
const weekRangeEl = document.getElementById('weekRange');
const tableBodyEl = document.getElementById('tableBody');
const totalHoursEl = document.getElementById('totalHours');
const saveIndicatorEl = document.getElementById('saveIndicator');
const loadingOverlayEl = document.getElementById('loadingOverlay');
const loginOverlayEl = document.getElementById('loginOverlay');
const googleSignInBtn = document.getElementById('googleSignInBtn');
const signOutBtn = document.getElementById('signOutBtn');
const userInfoEl = document.getElementById('userInfo');
const userEmailEl = document.getElementById('userEmail');
const prevWeekBtn = document.getElementById('prevWeekBtn');
const nextWeekBtn = document.getElementById('nextWeekBtn');
const exportWeekBtn = document.getElementById('exportWeekBtn');
const exportAllBtn = document.getElementById('exportAllBtn');
const summaryTotalEl = document.getElementById('summaryTotal');
const summaryDaysEl = document.getElementById('summaryDays');
const summaryAverageEl = document.getElementById('summaryAverage');
const summaryEarningsEl = document.getElementById('summaryEarnings');
const hourlyRateInputEl = document.getElementById('hourlyRateInput');
const saveRateBtn = document.getElementById('saveRateBtn');
const rateSaveIndicatorEl = document.getElementById('rateSaveIndicator');
const toggleSettingsBtn = document.getElementById('toggleSettingsBtn');
const settingsContentEl = document.getElementById('settingsContent');

// Initialize the app
async function init() {
  try {
    // Show loading overlay
    loadingOverlayEl.classList.remove('hidden');

    // Setup auth state listener
    onAuthStateChange(async (user) => {
      if (user) {
        // User is signed in
        console.log('User signed in:', user.email);

        // Hide login overlay
        loginOverlayEl.classList.add('hidden');

        // Show user info
        userEmailEl.textContent = user.email;
        userInfoEl.classList.remove('hidden');

        // Load user data
        await loadHourlyRate();
        await loadWeek(currentWeekStart);

        // Hide loading overlay
        loadingOverlayEl.classList.add('hidden');
      } else {
        // User is signed out
        console.log('User signed out');

        // Hide loading overlay
        loadingOverlayEl.classList.add('hidden');

        // Show login overlay
        loginOverlayEl.classList.remove('hidden');

        // Hide user info
        userInfoEl.classList.add('hidden');
      }
    });

    // Setup event listeners
    setupEventListeners();
  } catch (error) {
    console.error('Error initializing app:', error);
    loadingOverlayEl.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <h2>Error</h2>
        <p>Failed to initialize the app. Please check your Firebase configuration.</p>
        <p style="color: #ef4444; font-size: 0.9rem; margin-top: 1rem;">${error.message}</p>
      </div>
    `;
  }
}

// Setup event listeners
function setupEventListeners() {
  // Authentication
  googleSignInBtn.addEventListener('click', handleSignIn);
  signOutBtn.addEventListener('click', handleSignOut);

  // Navigation
  prevWeekBtn.addEventListener('click', () => {
    currentWeekStart = addWeeks(currentWeekStart, -1);
    loadWeek(currentWeekStart);
  });

  nextWeekBtn.addEventListener('click', () => {
    currentWeekStart = addWeeks(currentWeekStart, 1);
    loadWeek(currentWeekStart);
  });

  // Export
  exportWeekBtn.addEventListener('click', async () => {
    const entries = await loadWeekEntries(currentWeekStart);
    exportWeekCSV(entries, getMonday(currentWeekStart));
  });

  exportAllBtn.addEventListener('click', async () => {
    const allEntries = await loadAllEntries();
    exportAllCSV(allEntries);
  });

  // Settings toggle
  toggleSettingsBtn.addEventListener('click', () => {
    settingsContentEl.classList.toggle('hidden');
    toggleSettingsBtn.textContent = settingsContentEl.classList.contains('hidden') ? '▼' : '▲';
  });

  // Save hourly rate
  saveRateBtn.addEventListener('click', saveHourlyRate);
}

// Handle Google Sign-In
async function handleSignIn() {
  try {
    loadingOverlayEl.classList.remove('hidden');
    await signInWithGoogle();
    // Auth state change listener will handle the rest
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
    // Auth state change listener will handle the rest
  } catch (error) {
    console.error('Error signing out:', error);
    loadingOverlayEl.classList.add('hidden');
    alert('Failed to sign out. Please try again.');
  }
}

// Load hourly rate from Firestore
async function loadHourlyRate() {
  try {
    const userId = getUserId();
    const settingsRef = doc(db, `users/${userId}/settings`, 'config');
    const settingsSnap = await getDoc(settingsRef);

    if (settingsSnap.exists()) {
      const data = settingsSnap.data();
      currentHourlyRate = data.hourlyRate || 0;
      hourlyRateInputEl.value = currentHourlyRate;
    } else {
      currentHourlyRate = 0;
      hourlyRateInputEl.value = '';
    }

    console.log('Loaded hourly rate:', currentHourlyRate);
  } catch (error) {
    console.error('Error loading hourly rate:', error);
    currentHourlyRate = 0;
  }
}

// Save hourly rate to Firestore
async function saveHourlyRate() {
  try {
    const newRate = parseFloat(hourlyRateInputEl.value) || 0;

    if (newRate < 0) {
      alert('Hourly rate cannot be negative');
      return;
    }

    const userId = getUserId();
    const settingsRef = doc(db, `users/${userId}/settings`, 'config');

    await setDoc(settingsRef, {
      hourlyRate: newRate,
      lastUpdated: new Date().toISOString()
    });

    currentHourlyRate = newRate;

    // Show save indicator
    rateSaveIndicatorEl.classList.remove('hidden');
    setTimeout(() => {
      rateSaveIndicatorEl.classList.add('hidden');
    }, 2000);

    console.log('Saved hourly rate:', newRate);
  } catch (error) {
    console.error('Error saving hourly rate:', error);
    alert('Failed to save hourly rate. Please try again.');
  }
}

// Load a week's data
async function loadWeek(weekStart) {
  try {
    // Update week display
    const monday = getMonday(weekStart);
    const sunday = getSunday(weekStart);
    weekRangeEl.textContent = `${formatDateDisplay(monday)} - ${formatDateDisplay(sunday)}`;

    // Get week dates
    const dates = getWeekDates(weekStart);

    // Load entries from Firestore
    weekEntries = await loadWeekEntries(weekStart);

    // Render the table
    renderTable(dates, weekEntries);

    // Update summary
    updateSummary(weekEntries);
  } catch (error) {
    console.error('Error loading week:', error);
  }
}

// Load entries from Firestore for a specific week
async function loadWeekEntries(weekStart) {
  const userId = getUserId();
  const weekId = getWeekId(weekStart);
  const dates = getWeekDates(weekStart);

  const entries = [];

  for (const date of dates) {
    const dateStr = formatDate(date);
    const entryRef = doc(db, `users/${userId}/weeks/${weekId}/entries`, dateStr);

    try {
      const entrySnap = await getDoc(entryRef);

      if (entrySnap.exists()) {
        entries.push(entrySnap.data());
      } else {
        // Create default entry
        entries.push({
          date: dateStr,
          weekday: getWeekdayName(date),
          hours: 0,
          coworker: '',
          notes: ''
        });
      }
    } catch (error) {
      console.error(`Error loading entry for ${dateStr}:`, error);
      entries.push({
        date: dateStr,
        weekday: getWeekdayName(date),
        hours: 0,
        coworker: '',
        notes: ''
      });
    }
  }

  return entries;
}

// Load all entries from Firestore
async function loadAllEntries() {
  const userId = getUserId();
  const allEntries = [];

  try {
    // Get all weeks
    const weeksRef = collection(db, `users/${userId}/weeks`);
    const weeksSnap = await getDocs(weeksRef);

    for (const weekDoc of weeksSnap.docs) {
      const entriesRef = collection(db, `users/${userId}/weeks/${weekDoc.id}/entries`);
      const entriesSnap = await getDocs(entriesRef);

      entriesSnap.forEach(entryDoc => {
        allEntries.push(entryDoc.data());
      });
    }
  } catch (error) {
    console.error('Error loading all entries:', error);
  }

  return allEntries;
}

// Render the table
function renderTable(dates, entries) {
  tableBodyEl.innerHTML = '';

  dates.forEach((date, index) => {
    const entry = entries[index];
    const dateStr = formatDate(date);
    const row = document.createElement('tr');

    // Add today class if applicable
    if (isToday(date)) {
      row.classList.add('today');
    }

    row.innerHTML = `
      <td class="date-cell">${formatDateDisplay(date)}</td>
      <td>
        <input
          type="number"
          min="0"
          max="24"
          step="0.5"
          value="${entry.hours || 0}"
          data-date="${dateStr}"
          data-field="hours"
          class="hours-input"
        />
      </td>
      <td>
        <input
          type="text"
          value="${entry.coworker || ''}"
          data-date="${dateStr}"
          data-field="coworker"
          placeholder="Coworker name"
        />
      </td>
      <td>
        <textarea
          data-date="${dateStr}"
          data-field="notes"
          placeholder="Notes..."
          rows="1"
        >${entry.notes || ''}</textarea>
      </td>
    `;

    // Add event listeners for auto-save
    const inputs = row.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('input', handleInputChange);
      input.addEventListener('blur', handleInputBlur);
    });

    tableBodyEl.appendChild(row);
  });

  // Update total hours
  updateTotalHours(entries);
}

// Handle input changes (debounced save)
function handleInputChange(event) {
  const input = event.target;
  const date = input.dataset.date;
  const field = input.dataset.field;
  const value = input.value;

  // Clear existing timeout
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  // Set new timeout for auto-save
  saveTimeout = setTimeout(() => {
    saveEntry(date, field, value);
  }, 1000); // Save after 1 second of inactivity
}

// Handle input blur (immediate save)
function handleInputBlur(event) {
  const input = event.target;
  const date = input.dataset.date;
  const field = input.dataset.field;
  const value = input.value;

  // Clear existing timeout
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  // Save immediately
  saveEntry(date, field, value);
}

// Save an entry to Firestore
async function saveEntry(date, field, value) {
  try {
    const userId = getUserId();
    const weekId = getWeekId(currentWeekStart);
    const entryRef = doc(db, `users/${userId}/weeks/${weekId}/entries`, date);

    // Get current entry data
    const entrySnap = await getDoc(entryRef);
    const currentData = entrySnap.exists() ? entrySnap.data() : {};

    // Find the date object
    const dateObj = getWeekDates(currentWeekStart).find(d => formatDate(d) === date);
    const weekday = getWeekdayName(dateObj);

    // Update the field - preserve existing hourlyRate or use current one
    const updatedData = {
      ...currentData,
      date,
      weekday,
      [field]: field === 'hours' ? parseFloat(value) || 0 : value,
      hourlyRate: currentData.hourlyRate !== undefined ? currentData.hourlyRate : currentHourlyRate
    };

    // Save to Firestore
    await setDoc(entryRef, updatedData);

    // Update earnings rollups for all affected periods
    await updateEarningsRollups(new Date(date));

    // Show save indicator
    showSaveIndicator();

    // Reload entries and update display
    weekEntries = await loadWeekEntries(currentWeekStart);
    updateTotalHours(weekEntries);
    updateSummary(weekEntries);

    console.log(`Saved ${field} for ${date}:`, value);
  } catch (error) {
    console.error('Error saving entry:', error);
  }
}

// Update earnings rollups for all affected periods
async function updateEarningsRollups(entryDate) {
  try {
    const userId = getUserId();
    const periodIds = getAffectedPeriodIds(entryDate);

    // Update each period type
    const periodTypes = ['weekly', 'biweekly', 'monthly', 'yearly'];

    for (const periodType of periodTypes) {
      const periodId = periodIds[periodType];
      const { start, end } = getPeriodDates(periodType, entryDate);

      // Load all entries for this period
      const entries = await loadEntriesForPeriod(start, end);

      // Calculate rollup
      const rollup = calculateRollup(entries, start, end);

      // Save rollup to Firestore with combined ID
      const rollupRef = doc(db, `users/${userId}/earnings-rollups`, `${periodType}-${periodId}`);
      await setDoc(rollupRef, rollup);

      console.log(`Updated ${periodType} rollup for ${periodId}`);
    }
  } catch (error) {
    console.error('Error updating earnings rollups:', error);
  }
}

// Load entries for a specific date range
async function loadEntriesForPeriod(startDate, endDate) {
  const userId = getUserId();
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
        allEntries.push(entrySnap.data());
      }
    } catch (error) {
      console.error(`Error loading entry for ${dateStr}:`, error);
    }
  }

  return allEntries;
}

// Show save indicator
function showSaveIndicator() {
  saveIndicatorEl.classList.remove('hidden');

  setTimeout(() => {
    saveIndicatorEl.classList.add('hidden');
  }, 2000);
}

// Update total hours display
function updateTotalHours(entries) {
  const totalHours = entries.reduce((sum, entry) => sum + (parseFloat(entry.hours) || 0), 0);
  totalHoursEl.textContent = totalHours.toFixed(1);
}

// Update summary statistics
function updateSummary(entries) {
  const summary = generateSummary(entries);
  const totalEarnings = entries.reduce((sum, entry) => {
    const hours = parseFloat(entry.hours) || 0;
    const rate = entry.hourlyRate || 0;
    return sum + (hours * rate);
  }, 0);

  summaryTotalEl.textContent = summary.totalHours;
  summaryDaysEl.textContent = summary.daysWorked;
  summaryAverageEl.textContent = summary.averageHours;
  summaryEarningsEl.textContent = `$${totalEarnings.toFixed(2)}`;
}

// Start the app
init();
