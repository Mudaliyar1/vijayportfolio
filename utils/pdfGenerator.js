const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

/**
 * Generate a PDF receipt for a payment
 * @param {Object} payment - The payment object with populated package and user
 * @param {String} outputPath - The path where the PDF should be saved
 * @returns {Promise} - A promise that resolves when the PDF is generated
 */
const generatePaymentReceipt = (payment, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Payment Receipt - ${payment.razorpayOrderId}`,
          Author: 'FTRAISE AI',
          Subject: 'Payment Receipt',
          Keywords: 'payment, receipt, invoice'
        }
      });

      // Pipe the PDF to the output file
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Add the logo (if available)
      try {
        const logoPath = path.join(__dirname, '../public/images/logo.png');
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 50, 45, { width: 150 });
        }
      } catch (err) {
        console.error('Error adding logo:', err);
      }

      // Add the header
      doc.fontSize(20).text('PAYMENT RECEIPT', { align: 'right' });
      doc.moveDown();

      // Add a horizontal line
      doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, 120).lineTo(550, 120).stroke();
      doc.moveDown();

      // Format the date in IST
      const createdAt = moment(payment.createdAt).tz('Asia/Kolkata').format('MMMM Do YYYY, h:mm:ss a');
      const receiptDate = moment().tz('Asia/Kolkata').format('MMMM Do YYYY');

      // Add receipt details
      doc.fontSize(12).text(`Receipt Number: ${payment.receipt || 'N/A'}`, 50, 140);
      doc.text(`Date: ${createdAt}`, 50, 160);
      doc.text(`Order ID: ${payment.razorpayOrderId}`, 50, 180);
      doc.text(`Payment ID: ${payment.razorpayPaymentId || 'N/A'}`, 50, 200);
      doc.text(`Status: ${payment.status.toUpperCase()}`, 50, 220);

      // Add customer details
      doc.fontSize(14).text('Customer Details', 50, 260);
      doc.fontSize(12).text(`Name: ${payment.user.name || payment.user.username}`, 50, 280);
      doc.text(`Email: ${payment.user.email}`, 50, 300);

      // Add a horizontal line
      doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, 330).lineTo(550, 330).stroke();

      // Add package details
      doc.fontSize(14).text('Package Details', 50, 350);
      doc.fontSize(12).text(`Package: ${payment.package.name}`, 50, 370);

      // Add payment details with discount if applicable
      let yPos = 390;
      if (payment.notes && payment.notes.originalPrice && payment.notes.discountAmount) {
        doc.text(`Original Price: ₹${payment.notes.originalPrice}`, 50, yPos);
        yPos += 20;
        doc.text(`Discount: -₹${payment.notes.discountAmount}`, 50, yPos);
        yPos += 20;
        doc.text(`Final Amount: ₹${payment.amount}`, 50, yPos, { continued: true })
           .fillColor('#008000').text(' (Paid)', { align: 'left' });
      } else {
        doc.text(`Amount: ₹${payment.amount}`, 50, yPos, { continued: true })
           .fillColor('#008000').text(' (Paid)', { align: 'left' });
      }

      // Add a horizontal line
      doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, yPos + 40).lineTo(550, yPos + 40).stroke();

      // Add footer
      doc.fontSize(10).fillColor('#666666').text('This is a computer-generated receipt and does not require a signature.', 50, yPos + 60);
      doc.text('For any queries, please contact support@ftraiseai.com', 50, yPos + 80);
      doc.text(`Generated on: ${receiptDate}`, 50, yPos + 100);

      // Add website information
      doc.fontSize(10).fillColor('#666666').text('FTRAISE AI - Website Builder', 50, doc.page.height - 50, { align: 'center' });
      doc.text('https://ftraiseai.onrender.com', 50, doc.page.height - 35, { align: 'center', link: 'https://ftraiseai.onrender.com' });

      // Finalize the PDF
      doc.end();

      // When the stream is finished, resolve the promise
      stream.on('finish', () => {
        resolve(outputPath);
      });

      // If there's an error, reject the promise
      stream.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generatePaymentReceipt
};
