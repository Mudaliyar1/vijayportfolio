/**
 * Uptime Chart - Client-side JavaScript for uptime visualization
 */

// Initialize uptime chart
let uptimeChart;

function initUptimeChart() {
  const ctx = document.getElementById('uptime-chart').getContext('2d');
  
  uptimeChart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Uptime %',
          borderColor: '#00a8ff',
          backgroundColor: 'rgba(0, 168, 255, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: 'Response Time (ms)',
          borderColor: '#9c27b0',
          backgroundColor: 'rgba(156, 39, 176, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day',
            tooltipFormat: 'MMM d, yyyy HH:mm'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#e0e0e0'
          }
        },
        y: {
          min: 0,
          max: 100,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#e0e0e0'
          },
          title: {
            display: true,
            text: 'Uptime %',
            color: '#00a8ff'
          }
        },
        y1: {
          position: 'right',
          min: 0,
          grid: {
            drawOnChartArea: false
          },
          ticks: {
            color: '#e0e0e0'
          },
          title: {
            display: true,
            text: 'Response Time (ms)',
            color: '#9c27b0'
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: '#e0e0e0'
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      }
    }
  });
  
  // Load initial data
  loadUptimeData();
}

// Load uptime data for the selected component and time range
async function loadUptimeData() {
  const componentSelector = document.getElementById('component-selector');
  const timeRangeSelector = document.getElementById('time-range-selector');
  
  const component = componentSelector.value;
  const days = timeRangeSelector.value;
  
  try {
    const response = await fetch(`/api/uptime/${component}/daily?days=${days}`);
    const data = await response.json();
    
    // Update chart data
    uptimeChart.data.labels = data.map(item => new Date(item.timestamp));
    uptimeChart.data.datasets[0].data = data.map(item => ({
      x: new Date(item.timestamp),
      y: item.uptime
    }));
    uptimeChart.data.datasets[1].data = data.map(item => ({
      x: new Date(item.timestamp),
      y: item.responseTime
    }));
    
    // Update chart options based on time range
    if (days <= 1) {
      uptimeChart.options.scales.x.time.unit = 'hour';
    } else if (days <= 7) {
      uptimeChart.options.scales.x.time.unit = 'day';
    } else {
      uptimeChart.options.scales.x.time.unit = 'week';
    }
    
    // Update chart
    uptimeChart.update();
  } catch (error) {
    console.error('Error loading uptime data:', error);
  }
}

// Initialize chart when page loads
document.addEventListener('DOMContentLoaded', () => {
  initUptimeChart();
  
  // Add event listeners for selectors
  document.getElementById('component-selector').addEventListener('change', loadUptimeData);
  document.getElementById('time-range-selector').addEventListener('change', loadUptimeData);
});
