const UserLogin = require('../models/UserLogin');
const MaintenanceLoginAttempt = require('../models/MaintenanceLoginAttempt');
const { Parser } = require('json2csv/lib/json2csv');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { getIpLocation } = require('../utils/geoIpUtils');

module.exports = {
  // Get IP tracker page
  getIpTracker: async (req, res) => {
    try {
      // Get query parameters for filtering
      const {
        search,
        country,
        status,
        startDate,
        endDate,
        page = 1,
        limit = 20
      } = req.query;

      // Build query
      const query = {};

      // Search by username, IP, or location
      if (search) {
        query.$or = [
          { username: { $regex: search, $options: 'i' } },
          { ipAddress: { $regex: search, $options: 'i' } },
          { country: { $regex: search, $options: 'i' } },
          { city: { $regex: search, $options: 'i' } },
          { region: { $regex: search, $options: 'i' } },
          { isp: { $regex: search, $options: 'i' } }
        ];
      }

      // Filter by country
      if (country) {
        query.country = country;
      }

      // Filter by login status
      if (status && ['success', 'failed', 'blocked'].includes(status)) {
        query.loginStatus = status;
      }

      // Filter by date range
      if (startDate || endDate) {
        query.loginTime = {};
        if (startDate) {
          query.loginTime.$gte = new Date(startDate);
        }
        if (endDate) {
          // Set the end date to the end of the day
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          query.loginTime.$lte = endOfDay;
        }
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const totalCount = await UserLogin.countDocuments(query);
      const totalPages = Math.ceil(totalCount / parseInt(limit));

      // Get login records
      const loginRecords = await UserLogin.find(query)
        .sort({ loginTime: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'username email');

      // Log the number of records found
      console.log(`Found ${loginRecords.length} login records matching query:`, JSON.stringify(query));

      // If no records found, check maintenance login attempts
      if (loginRecords.length === 0 && !search && !country && !status && !startDate && !endDate) {
        console.log('No regular login records found, checking maintenance login attempts');

        // Convert maintenance login attempts to UserLogin format
        const maintenanceAttempts = await MaintenanceLoginAttempt.find()
          .sort({ timestamp: -1 })
          .limit(parseInt(limit))
          .populate('userId', 'username email');

        if (maintenanceAttempts.length > 0) {
          console.log(`Found ${maintenanceAttempts.length} maintenance login attempts`);

          // Convert maintenance login attempts to UserLogin format
          for (const attempt of maintenanceAttempts) {
            // Get location data for the IP
            const locationData = getIpLocation(attempt.ipAddress);

            // Create a UserLogin-like object
            loginRecords.push({
              username: attempt.username,
              userId: attempt.userId,
              ipAddress: attempt.ipAddress,
              forwardedIp: attempt.forwardedIp,
              userAgent: attempt.userAgent,
              browser: attempt.browser,
              browserVersion: attempt.browserVersion,
              operatingSystem: attempt.operatingSystem,
              osVersion: attempt.osVersion,
              deviceType: attempt.deviceType,
              deviceBrand: attempt.deviceBrand,
              deviceModel: attempt.deviceModel,
              country: locationData.country,
              countryCode: locationData.countryCode,
              region: locationData.region,
              city: locationData.city,
              postalCode: locationData.postalCode,
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              timezone: locationData.timezone,
              isp: locationData.isp,
              loginStatus: attempt.status === 'passed' ? 'success' : attempt.status,
              loginTime: attempt.timestamp
            });
          }
        }
      }

      // Get unique countries for filter dropdown
      const countries = await UserLogin.distinct('country');

      // Check if GeoIP is working by testing a sample IP
      const testIp = '8.8.8.8'; // Google DNS IP
      const testLocation = getIpLocation(testIp);
      const geoIpStatus = testLocation.country !== 'Unknown';

      res.render('admin/ip-tracker', {
        title: 'IP & Location Tracker - FTRAISE AI',
        loginRecords,
        countries,
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        search: search || '',
        country: country || '',
        status: status || '',
        startDate: startDate || '',
        endDate: endDate || '',
        path: '/admin/ip-tracker',
        layout: 'layouts/no-footer',
        geoIpStatus
      });
    } catch (err) {
      console.error('Error loading IP tracker:', err);
      req.flash('error_msg', 'An error occurred while loading the IP tracker');
      res.redirect('/admin');
    }
  },

  // Export login records as CSV
  exportCsv: async (req, res) => {
    try {
      // Get query parameters for filtering
      const {
        search,
        country,
        status,
        startDate,
        endDate,
        limit = 1000 // Limit the number of records to export
      } = req.query;

      // Build query
      const query = {};

      // Search by username, IP, or location
      if (search) {
        query.$or = [
          { username: { $regex: search, $options: 'i' } },
          { ipAddress: { $regex: search, $options: 'i' } },
          { country: { $regex: search, $options: 'i' } },
          { city: { $regex: search, $options: 'i' } },
          { region: { $regex: search, $options: 'i' } },
          { isp: { $regex: search, $options: 'i' } }
        ];
      }

      // Filter by country
      if (country) {
        query.country = country;
      }

      // Filter by login status
      if (status && ['success', 'failed', 'blocked'].includes(status)) {
        query.loginStatus = status;
      }

      // Filter by date range
      if (startDate || endDate) {
        query.loginTime = {};
        if (startDate) {
          query.loginTime.$gte = new Date(startDate);
        }
        if (endDate) {
          // Set the end date to the end of the day
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          query.loginTime.$lte = endOfDay;
        }
      }

      // Get login records
      const loginRecords = await UserLogin.find(query)
        .sort({ loginTime: -1 })
        .limit(parseInt(limit))
        .populate('userId', 'username email');

      // Prepare data for CSV
      const records = loginRecords.map(record => {
        return {
          Username: record.username,
          'IP Address': record.ipAddress,
          'Forwarded IP': record.forwardedIp || '',
          Country: record.country,
          'Country Code': record.countryCode || '',
          Region: record.region,
          'Region Code': record.regionCode || '',
          City: record.city,
          'Postal Code': record.postalCode,
          Latitude: record.latitude,
          Longitude: record.longitude,
          'Accuracy (km)': record.accuracyRadius || '',
          Timezone: record.timezone || '',
          ISP: record.isp,
          Organization: record.organization || '',
          ASN: record.asn || '',
          'User Type': record.userType || '',
          'Connection Type': record.connectionType || '',
          'Database Type': record.databaseType || 'Unknown',
          Browser: `${record.browser} ${record.browserVersion}`,
          'Operating System': `${record.operatingSystem} ${record.osVersion}`,
          'Device Type': record.deviceType,
          'Device Brand': record.deviceBrand,
          'Device Model': record.deviceModel,
          'Login Status': record.loginStatus,
          'Login Time': record.loginTime.toISOString()
        };
      });

      // Convert to CSV
      const fields = [
        'Username',
        'IP Address',
        'Forwarded IP',
        'Country',
        'Country Code',
        'Region',
        'Region Code',
        'City',
        'Postal Code',
        'Latitude',
        'Longitude',
        'Accuracy (km)',
        'Timezone',
        'ISP',
        'Organization',
        'ASN',
        'User Type',
        'Connection Type',
        'Database Type',
        'Browser',
        'Operating System',
        'Device Type',
        'Device Brand',
        'Device Model',
        'Login Status',
        'Login Time'
      ];

      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(records);

      // Set headers for download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=login-records.csv');

      // Send CSV
      res.send(csv);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      req.flash('error_msg', 'An error occurred while exporting the data');
      res.redirect('/admin/ip-tracker');
    }
  },

  // Export login records as PDF
  exportPdf: async (req, res) => {
    try {
      // Get query parameters for filtering
      const {
        search,
        country,
        status,
        startDate,
        endDate,
        limit = 100 // Limit the number of records to export for PDF
      } = req.query;

      // Build query
      const query = {};

      // Search by username, IP, or location
      if (search) {
        query.$or = [
          { username: { $regex: search, $options: 'i' } },
          { ipAddress: { $regex: search, $options: 'i' } },
          { country: { $regex: search, $options: 'i' } },
          { city: { $regex: search, $options: 'i' } },
          { region: { $regex: search, $options: 'i' } },
          { isp: { $regex: search, $options: 'i' } }
        ];
      }

      // Filter by country
      if (country) {
        query.country = country;
      }

      // Filter by login status
      if (status && ['success', 'failed', 'blocked'].includes(status)) {
        query.loginStatus = status;
      }

      // Filter by date range
      if (startDate || endDate) {
        query.loginTime = {};
        if (startDate) {
          query.loginTime.$gte = new Date(startDate);
        }
        if (endDate) {
          // Set the end date to the end of the day
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          query.loginTime.$lte = endOfDay;
        }
      }

      // Get login records
      const loginRecords = await UserLogin.find(query)
        .sort({ loginTime: -1 })
        .limit(parseInt(limit))
        .populate('userId', 'username email');

      // Create a PDF document
      const doc = new PDFDocument({ margin: 30 });

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=login-records.pdf');

      // Pipe the PDF to the response
      doc.pipe(res);

      // Add title
      doc.fontSize(20).text('FTRAISE AI - Login Records', { align: 'center' });
      doc.moveDown();

      // Add filters used
      doc.fontSize(12).text('Filters:', { underline: true });
      if (search) doc.text(`Search: ${search}`);
      if (country) doc.text(`Country: ${country}`);
      if (status) doc.text(`Status: ${status}`);
      if (startDate) doc.text(`Start Date: ${startDate}`);
      if (endDate) doc.text(`End Date: ${endDate}`);
      doc.moveDown();

      // Add date generated
      doc.text(`Generated: ${new Date().toLocaleString()}`);
      doc.moveDown();

      // Add table headers
      doc.fontSize(10);
      const tableTop = doc.y;
      const tableHeaders = ['Username', 'IP Address', 'Location', 'Login Time', 'Status'];
      const columnWidth = (doc.page.width - 60) / tableHeaders.length;

      // Draw headers
      tableHeaders.forEach((header, i) => {
        doc.text(header, 30 + (i * columnWidth), tableTop, { width: columnWidth, align: 'left' });
      });

      doc.moveTo(30, tableTop + 20)
         .lineTo(doc.page.width - 30, tableTop + 20)
         .stroke();

      // Draw rows
      let rowTop = tableTop + 30;

      loginRecords.forEach((record, index) => {
        // Check if we need a new page
        if (rowTop > doc.page.height - 50) {
          doc.addPage();
          rowTop = 50;
        }

        // Format location
        const location = [
          record.city,
          record.region,
          record.country
        ].filter(Boolean).join(', ');

        // Format login time
        const loginTime = new Date(record.loginTime).toLocaleString();

        // Draw row
        doc.text(record.username, 30, rowTop, { width: columnWidth, align: 'left' });
        doc.text(record.ipAddress, 30 + columnWidth, rowTop, { width: columnWidth, align: 'left' });
        doc.text(location, 30 + (2 * columnWidth), rowTop, { width: columnWidth, align: 'left' });
        doc.text(loginTime, 30 + (3 * columnWidth), rowTop, { width: columnWidth, align: 'left' });
        doc.text(record.loginStatus, 30 + (4 * columnWidth), rowTop, { width: columnWidth, align: 'left' });

        rowTop += 30;

        // Add a line between rows
        if (index < loginRecords.length - 1) {
          doc.moveTo(30, rowTop - 10)
             .lineTo(doc.page.width - 30, rowTop - 10)
             .stroke();
        }
      });

      // Finalize the PDF
      doc.end();
    } catch (err) {
      console.error('Error exporting PDF:', err);
      req.flash('error_msg', 'An error occurred while exporting the data');
      res.redirect('/admin/ip-tracker');
    }
  }
};
