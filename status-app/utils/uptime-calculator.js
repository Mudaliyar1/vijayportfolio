/**
 * Utility to calculate uptime percentages and statistics
 */
const UptimeRecord = require('../models/UptimeRecord');

// Function to calculate uptime for a component over a period
async function calculateUptime(componentName, days) {
  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Format dates as YYYY-MM-DD
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Get all uptime records for the component in the date range
    const records = await UptimeRecord.find({
      componentName,
      date: { $gte: startDateStr, $lte: endDateStr }
    });
    
    if (records.length === 0) {
      return {
        uptime: 100,
        totalChecks: 0,
        successfulChecks: 0,
        averageResponseTime: 0
      };
    }
    
    // Calculate totals
    let totalChecks = 0;
    let successfulChecks = 0;
    let totalResponseTime = 0;
    
    records.forEach(record => {
      totalChecks += record.totalChecks;
      successfulChecks += record.successfulChecks;
      totalResponseTime += record.averageResponseTime * record.totalChecks;
    });
    
    // Calculate uptime percentage
    const uptime = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 100;
    
    // Calculate average response time
    const averageResponseTime = totalChecks > 0 ? totalResponseTime / totalChecks : 0;
    
    return {
      uptime: parseFloat(uptime.toFixed(2)),
      totalChecks,
      successfulChecks,
      averageResponseTime: parseFloat(averageResponseTime.toFixed(2))
    };
  } catch (error) {
    console.error('Error calculating uptime:', error);
    return {
      uptime: 100,
      totalChecks: 0,
      successfulChecks: 0,
      averageResponseTime: 0
    };
  }
}

// Function to get uptime data for all components
async function getUptimeData(days = 30) {
  try {
    // Get all unique component names
    const distinctComponents = await UptimeRecord.distinct('componentName');
    
    // Calculate uptime for each component
    const uptimeData = {};
    
    for (const component of distinctComponents) {
      uptimeData[component] = await calculateUptime(component, days);
    }
    
    return uptimeData;
  } catch (error) {
    console.error('Error getting uptime data:', error);
    return {};
  }
}

// Function to get hourly uptime data for a component (for charts)
async function getHourlyUptimeData(componentName, days = 1) {
  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Format dates as YYYY-MM-DD
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Get all uptime records for the component in the date range
    const records = await UptimeRecord.find({
      componentName,
      date: { $gte: startDateStr, $lte: endDateStr }
    }).sort({ date: 1, hour: 1 });
    
    // Format data for chart
    const chartData = records.map(record => ({
      timestamp: new Date(`${record.date}T${record.hour.toString().padStart(2, '0')}:00:00Z`).getTime(),
      uptime: record.uptimePercentage,
      responseTime: record.averageResponseTime
    }));
    
    return chartData;
  } catch (error) {
    console.error('Error getting hourly uptime data:', error);
    return [];
  }
}

// Function to get daily uptime data for a component (for charts)
async function getDailyUptimeData(componentName, days = 30) {
  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Format dates as YYYY-MM-DD
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Get all uptime records for the component in the date range
    const records = await UptimeRecord.find({
      componentName,
      date: { $gte: startDateStr, $lte: endDateStr }
    });
    
    // Group records by date
    const dailyData = {};
    
    records.forEach(record => {
      if (!dailyData[record.date]) {
        dailyData[record.date] = {
          totalChecks: 0,
          successfulChecks: 0,
          totalResponseTime: 0
        };
      }
      
      dailyData[record.date].totalChecks += record.totalChecks;
      dailyData[record.date].successfulChecks += record.successfulChecks;
      dailyData[record.date].totalResponseTime += record.averageResponseTime * record.totalChecks;
    });
    
    // Calculate daily uptime percentages
    const chartData = Object.keys(dailyData).map(date => {
      const data = dailyData[date];
      const uptime = data.totalChecks > 0 ? (data.successfulChecks / data.totalChecks) * 100 : 100;
      const responseTime = data.totalChecks > 0 ? data.totalResponseTime / data.totalChecks : 0;
      
      return {
        date,
        timestamp: new Date(date).getTime(),
        uptime: parseFloat(uptime.toFixed(2)),
        responseTime: parseFloat(responseTime.toFixed(2))
      };
    });
    
    // Sort by date
    chartData.sort((a, b) => a.timestamp - b.timestamp);
    
    return chartData;
  } catch (error) {
    console.error('Error getting daily uptime data:', error);
    return [];
  }
}

module.exports = {
  calculateUptime,
  getUptimeData,
  getHourlyUptimeData,
  getDailyUptimeData
};
