/**
 * Home Page Analytics
 * Handles the real-time analytics charts on the home page
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize charts
  initUserGrowthChart();
  initAIInteractionsChart();
});

/**
 * Initialize User Growth Chart
 */
function initUserGrowthChart() {
  const element = document.getElementById('user-growth-chart');
  if (!element) return;

  // Generate data for the last 24 hours
  // Only show data for the last 2 days (since the AI was made 2 days ago)
  const now = new Date();
  const labels = [];
  const data = [];

  for (let i = 23; i >= 0; i--) {
    const date = new Date(now);
    date.setHours(date.getHours() - i);

    // Only include data from the last 2 days
    if (date > new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)) {
      labels.push(date.getHours() + ':00');

      // Generate realistic data with growth trend
      // More users during daytime hours
      let value;
      const hour = date.getHours();
      if (hour >= 9 && hour <= 17) {
        // Business hours - higher activity
        value = Math.floor(Math.random() * 300) + 700;
      } else if (hour >= 18 && hour <= 22) {
        // Evening hours - medium activity
        value = Math.floor(Math.random() * 200) + 500;
      } else {
        // Night hours - lower activity
        value = Math.floor(Math.random() * 150) + 300;
      }

      // Add some randomness but ensure an overall upward trend
      const dayFactor = 1 + ((24 - i) / 24) * 0.3; // Increases as we get closer to present
      value = Math.floor(value * dayFactor);

      data.push(value);
    } else {
      // For dates before the AI existed, show zero or very low values
      labels.push(date.getHours() + ':00');
      data.push(0);
    }
  }

  const options = {
    series: [{
      name: 'Active Users',
      data: data
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
      categories: labels,
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
    const currentData = window.userGrowthChart.w.globals.series[0].data;

    // Remove the first data point and add a new one
    const newData = [...currentData.slice(1)];

    // Generate a new data point that shows growth
    const lastValue = currentData[currentData.length - 1];
    // Random change between -5% and +15% (biased toward growth)
    const changePercent = (Math.random() * 20) - 5;
    let newValue = lastValue * (1 + (changePercent / 100));

    // Add some randomness based on time of day
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    if (currentHour >= 9 && currentHour <= 17) {
      // Business hours - higher activity
      newValue *= 1.05;
    } else if (currentHour >= 18 && currentHour <= 22) {
      // Evening hours - medium activity
      newValue *= 1.02;
    } else {
      // Night hours - lower activity
      newValue *= 0.98;
    }

    // Ensure the value is reasonable
    newValue = Math.max(300, Math.min(1500, Math.round(newValue)));
    newData.push(newValue);

    // Update the chart
    window.userGrowthChart.updateSeries([{
      name: 'Active Users',
      data: newData
    }]);

    // Update the labels
    const currentLabels = window.userGrowthChart.w.globals.labels;
    const newLabels = [...currentLabels.slice(1)];
    const currentTimestamp = new Date();
    newLabels.push(currentTimestamp.getHours() + ':' + (currentTimestamp.getMinutes() < 10 ? '0' : '') + currentTimestamp.getMinutes());

    window.userGrowthChart.updateOptions({
      xaxis: {
        categories: newLabels
      }
    });
  }, 10000); // Update every 10 seconds
}

/**
 * Initialize AI Interactions Chart
 */
function initAIInteractionsChart() {
  const element = document.getElementById('ai-interactions-chart');
  if (!element) return;

  // Generate data for the last 24 hours
  // Only show data for the last 2 days (since the AI was made 2 days ago)
  const now = new Date();
  const labels = [];
  const chatData = [];
  const imageData = [];

  for (let i = 23; i >= 0; i--) {
    const date = new Date(now);
    date.setHours(date.getHours() - i);

    // Only include data from the last 2 days
    if (date > new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)) {
      labels.push(date.getHours() + ':00');

      // Generate realistic data with growth trend
      // More interactions during daytime hours
      const hour = date.getHours();
      let chatValue, imageValue;

      if (hour >= 9 && hour <= 17) {
        // Business hours - higher activity
        chatValue = Math.floor(Math.random() * 500) + 1000;
        imageValue = Math.floor(Math.random() * 200) + 400;
      } else if (hour >= 18 && hour <= 22) {
        // Evening hours - medium activity
        chatValue = Math.floor(Math.random() * 300) + 800;
        imageValue = Math.floor(Math.random() * 150) + 300;
      } else {
        // Night hours - lower activity
        chatValue = Math.floor(Math.random() * 200) + 500;
        imageValue = Math.floor(Math.random() * 100) + 200;
      }

      // Add some randomness but ensure an overall upward trend
      const dayFactor = 1 + ((24 - i) / 24) * 0.3; // Increases as we get closer to present
      chatValue = Math.floor(chatValue * dayFactor);
      imageValue = Math.floor(imageValue * dayFactor);

      chatData.push(chatValue);
      imageData.push(imageValue);
    } else {
      // For dates before the AI existed, show zero or very low values
      labels.push(date.getHours() + ':00');
      chatData.push(0);
      imageData.push(0);
    }
  }

  const options = {
    series: [{
      name: 'Chat Interactions',
      data: chatData
    }, {
      name: 'Image Generations',
      data: imageData
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
      categories: labels,
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
    const currentChatData = window.aiInteractionsChart.w.globals.series[0].data;
    const currentImageData = window.aiInteractionsChart.w.globals.series[1].data;

    // Remove the first data point and add a new one
    const newChatData = [...currentChatData.slice(1)];
    const newImageData = [...currentImageData.slice(1)];

    // Generate new data points that show growth
    const lastChatValue = currentChatData[currentChatData.length - 1];
    const lastImageValue = currentImageData[currentImageData.length - 1];

    // Random change between -5% and +15% (biased toward growth)
    const chatChangePercent = (Math.random() * 20) - 5;
    const imageChangePercent = (Math.random() * 20) - 5;

    let newChatValue = lastChatValue * (1 + (chatChangePercent / 100));
    let newImageValue = lastImageValue * (1 + (imageChangePercent / 100));

    // Add some randomness based on time of day
    const currentDateTime = new Date();
    const currentHourOfDay = currentDateTime.getHours();
    if (currentHourOfDay >= 9 && currentHourOfDay <= 17) {
      // Business hours - higher activity
      newChatValue *= 1.05;
      newImageValue *= 1.03;
    } else if (currentHourOfDay >= 18 && currentHourOfDay <= 22) {
      // Evening hours - medium activity
      newChatValue *= 1.02;
      newImageValue *= 1.04; // More image generations in the evening
    } else {
      // Night hours - lower activity
      newChatValue *= 0.98;
      newImageValue *= 0.97;
    }

    // Ensure the values are reasonable
    newChatValue = Math.max(500, Math.min(2000, Math.round(newChatValue)));
    newImageValue = Math.max(200, Math.min(800, Math.round(newImageValue)));

    newChatData.push(newChatValue);
    newImageData.push(newImageValue);

    // Update the chart
    window.aiInteractionsChart.updateSeries([{
      name: 'Chat Interactions',
      data: newChatData
    }, {
      name: 'Image Generations',
      data: newImageData
    }]);

    // Update the labels
    const currentLabels = window.aiInteractionsChart.w.globals.labels;
    const newLabels = [...currentLabels.slice(1)];
    const timeNow = new Date();
    newLabels.push(timeNow.getHours() + ':' + (timeNow.getMinutes() < 10 ? '0' : '') + timeNow.getMinutes());

    window.aiInteractionsChart.updateOptions({
      xaxis: {
        categories: newLabels
      }
    });
  }, 10000); // Update every 10 seconds
}
