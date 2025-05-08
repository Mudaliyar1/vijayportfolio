/**
 * Utility to send notifications about system status changes
 */
const StatusSubscription = require('../models/StatusSubscription');
const emailSender = require('./email-sender');

// Function to send notification about a new incident
async function sendNewIncident(incident) {
  try {
    console.log(`[${new Date().toISOString()}] New incident detected: ${incident.title}`);

    // Get all verified subscribers
    const subscribers = await StatusSubscription.find({ isVerified: true });

    if (subscribers.length > 0) {
      console.log(`Sending notification to ${subscribers.length} subscribers about new incident: ${incident.title}`);

      // Send email notifications using Brevo
      await emailSender.sendIncidentEmail(incident, subscribers);
    }

    return true;
  } catch (error) {
    console.error('Error sending new incident notification:', error);
    return false;
  }
}

// Function to send notification about an incident update
async function sendIncidentUpdate(incident) {
  try {
    console.log(`[${new Date().toISOString()}] Incident updated: ${incident.title}`);

    // Get the latest update
    const latestUpdate = incident.updates[incident.updates.length - 1];

    // Get all verified subscribers
    const subscribers = await StatusSubscription.find({ isVerified: true });

    if (subscribers.length > 0) {
      console.log(`Sending notification to ${subscribers.length} subscribers about incident update: ${incident.title}`);

      // Send email notifications using Brevo
      // We'll use the same email function but with a different subject and content
      // For simplicity, we're reusing the incident email function
      await emailSender.sendIncidentEmail({
        ...incident,
        title: `Update: ${incident.title}`,
        description: `${latestUpdate.message} (Status: ${latestUpdate.status})`
      }, subscribers);
    }

    return true;
  } catch (error) {
    console.error('Error sending incident update notification:', error);
    return false;
  }
}

// Function to send notification about system status change
async function sendStatusChange(oldStatus, newStatus) {
  try {
    console.log(`[${new Date().toISOString()}] System status changed from ${oldStatus} to ${newStatus}`);

    // Get all verified subscribers
    const subscribers = await StatusSubscription.find({ isVerified: true });

    if (subscribers.length > 0) {
      console.log(`Sending notification to ${subscribers.length} subscribers about status change from ${oldStatus} to ${newStatus}`);

      // Send email notifications using Brevo
      // We'll create a fake incident object to reuse the incident email function
      await emailSender.sendIncidentEmail({
        title: `System Status Changed: ${oldStatus} → ${newStatus}`,
        description: `The overall system status has changed from ${oldStatus} to ${newStatus}.`,
        affectedComponents: ['System'],
        startTime: new Date(),
        severity: newStatus === 'operational' ? 'minor' : 'major'
      }, subscribers);
    }

    return true;
  } catch (error) {
    console.error('Error sending status change notification:', error);
    return false;
  }
}

module.exports = {
  sendNewIncident,
  sendIncidentUpdate,
  sendStatusChange
};
