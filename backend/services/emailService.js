const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

async function sendWeekendBookingAlert({ booking, roomName, clinicName, bookedBy }) {
    const recipients = process.env.WEEKEND_ALERT_EMAILS;
    if (!recipients) {
        console.warn('No WEEKEND_ALERT_EMAILS configured, skipping email');
        return;
    }

    const date = new Date(booking.booking_date);
    const dayName = date.toLocaleDateString('en-GB', { weekday: 'long' });
    const formattedDate = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const sessionLabel = booking.session === 'am' ? 'AM (08:30–12:30)' :
                         booking.session === 'pm' ? 'PM (13:30–17:30)' :
                         'All Day (08:30–17:30)';

    const mailOptions = {
        from: `"Room Booking System" <${process.env.EMAIL_USER}>`,
        to: recipients,
        subject: `Weekend Booking Alert – ${dayName} ${formattedDate}`,
        html: `
            <p>A room has been booked on a <strong>weekend</strong> and requires your attention.</p>
            <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;">
                <tr><td style="padding:6px 12px;font-weight:bold;">Date</td><td style="padding:6px 12px;">${dayName} ${formattedDate}</td></tr>
                <tr style="background:#f5f5f5"><td style="padding:6px 12px;font-weight:bold;">Session</td><td style="padding:6px 12px;">${sessionLabel}</td></tr>
                <tr><td style="padding:6px 12px;font-weight:bold;">Room</td><td style="padding:6px 12px;">${roomName || 'Unknown'}</td></tr>
                <tr style="background:#f5f5f5"><td style="padding:6px 12px;font-weight:bold;">Clinic</td><td style="padding:6px 12px;">${clinicName || 'Unknown'}</td></tr>
                <tr><td style="padding:6px 12px;font-weight:bold;">Specialty</td><td style="padding:6px 12px;">${booking.specialty || '–'}</td></tr>
                <tr style="background:#f5f5f5"><td style="padding:6px 12px;font-weight:bold;">Doctor</td><td style="padding:6px 12px;">${booking.doctor_name || '–'}</td></tr>
                <tr><td style="padding:6px 12px;font-weight:bold;">Booked by</td><td style="padding:6px 12px;">${bookedBy || 'Unknown'}</td></tr>
            </table>
            <p style="margin-top:16px;color:#666;font-size:12px;">
                This is an automated notification from the Cambridge University Hospitals Room Booking System.
            </p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Weekend booking alert sent to: ${recipients}`);
    } catch (error) {
        console.error('Failed to send weekend booking alert:', error.message);
    }
}

function isWeekend(dateString) {
    const date = new Date(dateString);
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
    return day === 0 || day === 6;
}

module.exports = { sendWeekendBookingAlert, isWeekend };
