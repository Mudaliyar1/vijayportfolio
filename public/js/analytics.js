/**
 * Analytics Page JavaScript
 * Handles the interactive charts and graphs on the analytics page
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize counters
  initCounters();
  
  // Initialize charts
  initUserGrowthChart();
  initAIInteractionsChart();
  initLanguageDistributionChart();
  initImageTypesChart();
  initActivityHeatmapChart();
  
  // Handle time period filters
  initTimeFilters();
});

/**
 * Initialize animated counters
 */
function initCounters() {
  const counters = document.querySelectorAll('.counter');
  const speed = 200;
  
  counters.forEach(counter => {
    const target = +counter.getAttribute('data-target');
    const increment = target / speed;
    
    const updateCount = () => {
      const count = +counter.innerText;
      if (count < target) {
        counter.innerText = Math.ceil(count + increment);
        setTimeout(updateCount, 1);
      } else {
        counter.innerText = target;
      }
    };
    
    updateCount();
  });
}

/**
 * Initialize time period filters
 */
function initTimeFilters() {
  const timeFilters = document.querySelectorAll('.time-filter');
  
  timeFilters.forEach(filter => {
    filter.addEventListener('click', function() {
      // Remove active class from all filters
      timeFilters.forEach(f => {
        f.classList.remove('active', 'bg-neon-blue/20', 'text-neon-blue');
        f.classList.add('bg-dark-200', 'text-gray-300');
      });
      
      // Add active class to clicked filter
      this.classList.add('active', 'bg-neon-blue/20', 'text-neon-blue');
      this.classList.remove('bg-dark-200', 'text-gray-300');
      
      // Update charts based on selected time period
      const timePeriod = this.getAttribute('data-time');
      updateChartsForTimePeriod(timePeriod);
    });
  });
}

/**
 * Update all charts based on selected time period
 */
function updateChartsForTimePeriod(timePeriod) {
  // Generate data based on time period
  let userGrowthData, aiInteractionsData;
  
  switch(timePeriod) {
    case 'day':
      userGrowthData = generateHourlyData(24);
      aiInteractionsData = generateHourlyData(24);
      break;
    case 'week':
      userGrowthData = generateDailyData(7);
      aiInteractionsData = generateDailyData(7);
      break;
    case 'month':
      userGrowthData = generateDailyData(30);
      aiInteractionsData = generateDailyData(30);
      break;
    case 'year':
      userGrowthData = generateMonthlyData(12);
      aiInteractionsData = generateMonthlyData(12);
      break;
    default:
      userGrowthData = generateHourlyData(24);
      aiInteractionsData = generateHourlyData(24);
  }
  
  // Update charts with new data
  if (window.userGrowthChart) {
    window.userGrowthChart.updateSeries([{
      name: 'Users',
      data: userGrowthData
    }]);
  }
  
  if (window.aiInteractionsChart) {
    window.aiInteractionsChart.updateSeries([{
      name: 'Chat Interactions',
      data: aiInteractionsData.map(val => val * 1.5)
    }, {
      name: 'Image Generations',
      data: aiInteractionsData.map(val => val * 0.6)
    }]);
  }
}

/**
 * Initialize User Growth Chart
 */
function initUserGrowthChart() {
  const element = document.getElementById('user-growth-chart');
  if (!element) return;
  
  const options = {
    series: [{
      name: 'Users',
      data: generateHourlyData(24)
    }],
    chart: {
      type: 'area',
      height: '100%',
      fontFamily: 'Inter, sans-serif',
      toolbar: {
        show: false
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      }
    },
    colors: ['#00f2ff'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.3,
        opacityTo: 0.1,
        stops: [0, 90, 100]
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    grid: {
      borderColor: 'rgba(255, 255, 255, 0.1)',
      row: {
        colors: ['transparent'],
        opacity: 0.5
      }
    },
    xaxis: {
      categories: generateTimeLabels(24, 'hour'),
      labels: {
        style: {
          colors: 'rgba(255, 255, 255, 0.7)'
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: 'rgba(255, 255, 255, 0.7)'
        }
      }
    },
    tooltip: {
      theme: 'dark',
      x: {
        show: true
      }
    }
  };
  
  window.userGrowthChart = new ApexCharts(element, options);
  window.userGrowthChart.render();
  
  // Add real-time updates
  setInterval(() => {
    const data = window.userGrowthChart.w.globals.series[0].data;
    const newData = [...data.slice(1), generateRandomValue(800, 1200)];
    
    window.userGrowthChart.updateSeries([{
      name: 'Users',
      data: newData
    }]);
  }, 5000);
}

/**
 * Initialize AI Interactions Chart
 */
function initAIInteractionsChart() {
  const element = document.getElementById('ai-interactions-chart');
  if (!element) return;
  
  const hourlyData = generateHourlyData(24);
  
  const options = {
    series: [{
      name: 'Chat Interactions',
      data: hourlyData.map(val => val * 1.5)
    }, {
      name: 'Image Generations',
      data: hourlyData.map(val => val * 0.6)
    }],
    chart: {
      type: 'area',
      height: '100%',
      fontFamily: 'Inter, sans-serif',
      toolbar: {
        show: false
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      }
    },
    colors: ['#8a2be2', '#ff00ff'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.3,
        opacityTo: 0.1,
        stops: [0, 90, 100]
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    grid: {
      borderColor: 'rgba(255, 255, 255, 0.1)',
      row: {
        colors: ['transparent'],
        opacity: 0.5
      }
    },
    xaxis: {
      categories: generateTimeLabels(24, 'hour'),
      labels: {
        style: {
          colors: 'rgba(255, 255, 255, 0.7)'
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: 'rgba(255, 255, 255, 0.7)'
        }
      }
    },
    tooltip: {
      theme: 'dark',
      x: {
        show: true
      }
    }
  };
  
  window.aiInteractionsChart = new ApexCharts(element, options);
  window.aiInteractionsChart.render();
  
  // Add real-time updates
  setInterval(() => {
    const chatData = window.aiInteractionsChart.w.globals.series[0].data;
    const imageData = window.aiInteractionsChart.w.globals.series[1].data;
    
    const newChatData = [...chatData.slice(1), generateRandomValue(1200, 1800)];
    const newImageData = [...imageData.slice(1), generateRandomValue(500, 700)];
    
    window.aiInteractionsChart.updateSeries([{
      name: 'Chat Interactions',
      data: newChatData
    }, {
      name: 'Image Generations',
      data: newImageData
    }]);
  }, 5000);
}

/**
 * Initialize Language Distribution Chart
 */
function initLanguageDistributionChart() {
  const element = document.getElementById('language-distribution-chart');
  if (!element) return;
  
  const options = {
    series: [65, 15, 10, 5, 5],
    chart: {
      type: 'donut',
      height: '100%',
      fontFamily: 'Inter, sans-serif',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      }
    },
    labels: ['English', 'Hindi', 'Tamil', 'Spanish', 'Others'],
    colors: ['#00f2ff', '#8a2be2', '#ff00ff', '#00ff80', '#ffcc00'],
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      labels: {
        colors: 'rgba(255, 255, 255, 0.7)'
      }
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '14px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 'bold',
        colors: ['#fff']
      },
      dropShadow: {
        enabled: false
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '55%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              color: 'rgba(255, 255, 255, 0.7)'
            },
            value: {
              show: true,
              fontSize: '20px',
              fontFamily: 'Inter, sans-serif',
              color: '#fff',
              formatter: function(val) {
                return val + '%';
              }
            },
            total: {
              show: true,
              label: 'Total',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              color: 'rgba(255, 255, 255, 0.7)',
              formatter: function(w) {
                return '100%';
              }
            }
          }
        }
      }
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: function(val) {
          return val + '%';
        }
      }
    }
  };
  
  const chart = new ApexCharts(element, options);
  chart.render();
}

/**
 * Initialize Image Types Chart
 */
function initImageTypesChart() {
  const element = document.getElementById('image-types-chart');
  if (!element) return;
  
  const options = {
    series: [{
      name: 'Image Types',
      data: [30, 25, 20, 15, 10]
    }],
    chart: {
      type: 'bar',
      height: '100%',
      fontFamily: 'Inter, sans-serif',
      toolbar: {
        show: false
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      }
    },
    colors: ['#ff00ff'],
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '60%',
        distributed: true,
        dataLabels: {
          position: 'top'
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    legend: {
      show: false
    },
    grid: {
      borderColor: 'rgba(255, 255, 255, 0.1)',
      row: {
        colors: ['transparent'],
        opacity: 0.5
      }
    },
    xaxis: {
      categories: ['Cyberpunk', 'Fantasy', 'Anime', 'Photorealistic', 'Abstract'],
      labels: {
        style: {
          colors: 'rgba(255, 255, 255, 0.7)',
          fontSize: '12px'
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: 'rgba(255, 255, 255, 0.7)'
        },
        formatter: function(val) {
          return val + '%';
        }
      }
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: function(val) {
          return val + '%';
        }
      }
    }
  };
  
  const chart = new ApexCharts(element, options);
  chart.render();
}

/**
 * Initialize Activity Heatmap Chart
 */
function initActivityHeatmapChart() {
  const element = document.getElementById('activity-heatmap-chart');
  if (!element) return;
  
  // Generate heatmap data
  const data = [];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  days.forEach((day, dayIndex) => {
    hours.forEach((hour) => {
      // Higher activity during working hours on weekdays
      let value;
      if (dayIndex < 5 && hour >= 9 && hour <= 17) {
        value = generateRandomValue(70, 100);
      } else if ((dayIndex >= 5 || hour < 7 || hour > 22)) {
        value = generateRandomValue(10, 40);
      } else {
        value = generateRandomValue(40, 70);
      }
      
      data.push({
        x: day,
        y: hour,
        value: value
      });
    });
  });
  
  const options = {
    series: [{
      name: 'Activity Level',
      data: data
    }],
    chart: {
      height: '100%',
      type: 'heatmap',
      fontFamily: 'Inter, sans-serif',
      toolbar: {
        show: false
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800
      }
    },
    dataLabels: {
      enabled: false
    },
    colors: ['#00f2ff'],
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.5,
        radius: 0,
        colorScale: {
          ranges: [{
            from: 0,
            to: 20,
            name: 'Low',
            color: '#00f2ff20'
          }, {
            from: 21,
            to: 50,
            name: 'Medium',
            color: '#00f2ff40'
          }, {
            from: 51,
            to: 80,
            name: 'High',
            color: '#00f2ff80'
          }, {
            from: 81,
            to: 100,
            name: 'Very High',
            color: '#00f2ff'
          }]
        }
      }
    },
    xaxis: {
      categories: days,
      labels: {
        style: {
          colors: 'rgba(255, 255, 255, 0.7)'
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: 'rgba(255, 255, 255, 0.7)'
        },
        formatter: function(val) {
          return val + ':00';
        }
      }
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: function(val) {
          return val + '% activity';
        }
      }
    }
  };
  
  const chart = new ApexCharts(element, options);
  chart.render();
}

/**
 * Generate random data for hourly intervals
 */
function generateHourlyData(hours) {
  return Array.from({ length: hours }, () => generateRandomValue(800, 1200));
}

/**
 * Generate random data for daily intervals
 */
function generateDailyData(days) {
  return Array.from({ length: days }, () => generateRandomValue(800, 1200));
}

/**
 * Generate random data for monthly intervals
 */
function generateMonthlyData(months) {
  return Array.from({ length: months }, () => generateRandomValue(800, 1200));
}

/**
 * Generate time labels based on interval type
 */
function generateTimeLabels(count, type) {
  const now = new Date();
  const labels = [];
  
  if (type === 'hour') {
    for (let i = count - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setHours(date.getHours() - i);
      labels.push(date.getHours() + ':00');
    }
  } else if (type === 'day') {
    for (let i = count - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
  } else if (type === 'month') {
    for (let i = count - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
    }
  }
  
  return labels;
}

/**
 * Generate a random value between min and max
 */
function generateRandomValue(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
