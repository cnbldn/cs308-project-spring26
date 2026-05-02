const nodemailer = require('nodemailer');

// Debug log to ensure variables are loaded (without leaking password)
if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.error('[EMAIL CONFIG ERROR] EMAIL_USER or EMAIL_APP_PASSWORD is missing from environment variables.');
} else {
    console.log(`[EMAIL CONFIG] Transporter initialized for: ${process.env.EMAIL_USER}`);
}

// Configure the transporter for Gmail SMTP
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
    },
});

/**
 * Sends an invoice email with a PDF attachment.
 * @param {string} toEmail - Recipient's email address.
 * @param {string} invoiceNumber - The invoice number for the subject line.
 * @param {Buffer} pdfBuffer - The generated PDF content.
 */
const sendInvoiceEmail = async (toEmail, invoiceNumber, pdfBuffer) => {
    const mailOptions = {
        from: `"Game Vault" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: `Your Game Vault Invoice: ${invoiceNumber}`,
        text: `Thank you for your purchase from Game Vault!\n\nPlease find your invoice (${invoiceNumber}) attached as a PDF.\n\nBest regards,\nThe Game Vault Team`,
        attachments: [
            {
                filename: `invoice-${invoiceNumber}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }
        ]
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Invoice ${invoiceNumber} sent to ${toEmail}. MessageId: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`[EMAIL ERROR] Failed to send invoice ${invoiceNumber}:`, error);
        throw error;
    }
};

module.exports = { sendInvoiceEmail };
