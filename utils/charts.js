// Chart.js wrapper utilities for earnings reports

/**
 * Create a bar chart for hours worked
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {Array<string>} labels - Array of labels (dates/weeks)
 * @param {Array<number>} data - Array of hours data
 * @returns {Chart} - Chart.js instance
 */
export function createHoursBarChart(canvas, labels, data) {
  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Hours Worked',
        data,
        backgroundColor: 'rgba(37, 99, 235, 0.7)',
        borderColor: 'rgba(37, 99, 235, 1)',
        borderWidth: 2,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Hours Worked',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            size: 14
          },
          bodyFont: {
            size: 13
          },
          callbacks: {
            label: (context) => {
              return `Hours: ${context.parsed.y.toFixed(1)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => value.toFixed(1)
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

/**
 * Create a line chart for earnings trend
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {Array<string>} labels - Array of labels (dates/weeks)
 * @param {Array<number>} data - Array of earnings data
 * @returns {Chart} - Chart.js instance
 */
export function createEarningsLineChart(canvas, labels, data) {
  return new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Earnings',
        data,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgba(16, 185, 129, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Earnings Trend',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            size: 14
          },
          bodyFont: {
            size: 13
          },
          callbacks: {
            label: (context) => {
              return `Earnings: $${context.parsed.y.toFixed(2)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => `$${value.toFixed(0)}`
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

/**
 * Create a combined bar chart showing both hours and earnings
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {Array<string>} labels - Array of labels (dates/weeks)
 * @param {Array<number>} hoursData - Array of hours data
 * @param {Array<number>} earningsData - Array of earnings data
 * @returns {Chart} - Chart.js instance
 */
export function createCombinedChart(canvas, labels, hoursData, earningsData) {
  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Hours Worked',
          data: hoursData,
          backgroundColor: 'rgba(37, 99, 235, 0.7)',
          borderColor: 'rgba(37, 99, 235, 1)',
          borderWidth: 2,
          borderRadius: 6,
          yAxisID: 'y-hours'
        },
        {
          label: 'Earnings',
          data: earningsData,
          type: 'line',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'rgba(16, 185, 129, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          yAxisID: 'y-earnings'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        title: {
          display: true,
          text: 'Hours & Earnings Overview',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            size: 14
          },
          bodyFont: {
            size: 13
          },
          callbacks: {
            label: (context) => {
              const label = context.dataset.label;
              const value = context.parsed.y;

              if (label === 'Hours Worked') {
                return `${label}: ${value.toFixed(1)}`;
              } else {
                return `${label}: $${value.toFixed(2)}`;
              }
            }
          }
        },
        legend: {
          display: true,
          position: 'top'
        }
      },
      scales: {
        'y-hours': {
          type: 'linear',
          position: 'left',
          beginAtZero: true,
          title: {
            display: true,
            text: 'Hours',
            font: {
              weight: 'bold'
            }
          },
          ticks: {
            callback: (value) => value.toFixed(1)
          },
          grid: {
            color: 'rgba(37, 99, 235, 0.1)'
          }
        },
        'y-earnings': {
          type: 'linear',
          position: 'right',
          beginAtZero: true,
          title: {
            display: true,
            text: 'Earnings ($)',
            font: {
              weight: 'bold'
            }
          },
          ticks: {
            callback: (value) => `$${value.toFixed(0)}`
          },
          grid: {
            drawOnChartArea: false
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

/**
 * Destroy a chart instance safely
 * @param {Chart} chart - The chart instance to destroy
 */
export function destroyChart(chart) {
  if (chart) {
    chart.destroy();
  }
}

/**
 * Format labels for weekly/biweekly periods
 * @param {Array<Object>} dataPoints - Array of aggregated data points
 * @param {string} labelField - Field to use for labeling ('weekId', 'monthId', etc.)
 * @returns {Array<string>} - Formatted labels
 */
export function formatChartLabels(dataPoints, labelField) {
  return dataPoints.map(point => {
    if (labelField === 'date') {
      const date = new Date(point.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (labelField === 'weekId') {
      const date = new Date(point.weekId);
      return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else if (labelField === 'monthId') {
      const [year, month] = point.monthId.split('-');
      const date = new Date(year, parseInt(month) - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return point[labelField] || '';
  });
}
