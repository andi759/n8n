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

function formatWLIDetails(wli) {
    const date = new Date(wli.wli_date);
    const formattedDate = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const specialty = wli.specialty === 'Other' && wli.specialty_other ? wli.specialty_other : wli.specialty;
    let requirementsList = '–';
    try {
        const reqs = JSON.parse(wli.requirements || '[]');
        if (reqs.length > 0) {
            requirementsList = reqs.join(', ');
            if (wli.requirements_other) requirementsList += ` (Other: ${wli.requirements_other})`;
        }
    } catch (e) {
        requirementsList = wli.requirements || '–';
    }
    return { formattedDate, specialty, requirementsList };
}

async function sendWLIConfirmation(wli) {
    if (!process.env.EMAIL_USER) return;
    const { formattedDate, specialty, requirementsList } = formatWLIDetails(wli);
    const mailOptions = {
        from: `"Room Booking System" <${process.env.EMAIL_USER}>`,
        to: wli.contact_email,
        subject: `WLI Request Received – ${formattedDate}`,
        html: `
            <p>Dear ${wli.requester_name},</p>
            <p>Thank you for submitting a Waiting List Initiative (WLI) clinic request. We have received your submission and it is now under review.</p>
            <p><strong>Your request details:</strong></p>
            <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;">
                <tr><td style="padding:6px 12px;font-weight:bold;">Date</td><td style="padding:6px 12px;">${formattedDate}</td></tr>
                <tr style="background:#f5f5f5"><td style="padding:6px 12px;font-weight:bold;">Time</td><td style="padding:6px 12px;">${wli.wli_time}</td></tr>
                <tr><td style="padding:6px 12px;font-weight:bold;">Division</td><td style="padding:6px 12px;">Division ${wli.division}</td></tr>
                <tr style="background:#f5f5f5"><td style="padding:6px 12px;font-weight:bold;">Specialty</td><td style="padding:6px 12px;">${specialty}</td></tr>
                <tr><td style="padding:6px 12px;font-weight:bold;">Preferred Location</td><td style="padding:6px 12px;">${wli.preferred_location || '–'}</td></tr>
                <tr style="background:#f5f5f5"><td style="padding:6px 12px;font-weight:bold;">Patients</td><td style="padding:6px 12px;">${wli.num_patients || '–'}</td></tr>
                <tr><td style="padding:6px 12px;font-weight:bold;">Clock Stops</td><td style="padding:6px 12px;">${wli.num_clock_stops || '–'}</td></tr>
                <tr style="background:#f5f5f5"><td style="padding:6px 12px;font-weight:bold;">Requirements</td><td style="padding:6px 12px;">${requirementsList}</td></tr>
                <tr><td style="padding:6px 12px;font-weight:bold;">Director Approved</td><td style="padding:6px 12px;">${wli.director_approved || '–'}</td></tr>
            </table>
            <p style="margin-top:16px;color:#666;font-size:12px;">
                This is an automated confirmation from the Cambridge University Hospitals Room Booking System.
            </p>
        `,
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`WLI confirmation sent to: ${wli.contact_email}`);
    } catch (error) {
        console.error('Failed to send WLI confirmation:', error.message);
    }
}

async function sendWLINotification(wli) {
    const recipients = process.env.WLI_ALERT_EMAILS;
    if (!recipients) return;
    const { formattedDate, specialty, requirementsList } = formatWLIDetails(wli);
    const mailOptions = {
        from: `"Room Booking System" <${process.env.EMAIL_USER}>`,
        to: recipients,
        subject: `New WLI Request – Division ${wli.division} – ${formattedDate}`,
        html: `
            <p>A new Waiting List Initiative (WLI) clinic request has been submitted.</p>
            <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;">
                <tr><td style="padding:6px 12px;font-weight:bold;">Requested by</td><td style="padding:6px 12px;">${wli.requester_name} (${wli.contact_email})</td></tr>
                <tr style="background:#f5f5f5"><td style="padding:6px 12px;font-weight:bold;">Date</td><td style="padding:6px 12px;">${formattedDate}</td></tr>
                <tr><td style="padding:6px 12px;font-weight:bold;">Time</td><td style="padding:6px 12px;">${wli.wli_time}</td></tr>
                <tr style="background:#f5f5f5"><td style="padding:6px 12px;font-weight:bold;">Division</td><td style="padding:6px 12px;">Division ${wli.division}</td></tr>
                <tr><td style="padding:6px 12px;font-weight:bold;">Specialty</td><td style="padding:6px 12px;">${specialty}</td></tr>
                <tr style="background:#f5f5f5"><td style="padding:6px 12px;font-weight:bold;">Preferred Location</td><td style="padding:6px 12px;">${wli.preferred_location || '–'} <em style="color:#888">(not guaranteed)</em></td></tr>
                <tr><td style="padding:6px 12px;font-weight:bold;">Patients</td><td style="padding:6px 12px;">${wli.num_patients || '–'}</td></tr>
                <tr style="background:#f5f5f5"><td style="padding:6px 12px;font-weight:bold;">Clock Stops</td><td style="padding:6px 12px;">${wli.num_clock_stops || '–'}</td></tr>
                <tr><td style="padding:6px 12px;font-weight:bold;">Requirements</td><td style="padding:6px 12px;">${requirementsList}</td></tr>
                <tr style="background:#f5f5f5"><td style="padding:6px 12px;font-weight:bold;">Director Approved</td><td style="padding:6px 12px;">${wli.director_approved || '–'}</td></tr>
            </table>
            <p style="margin-top:16px;color:#666;font-size:12px;">
                This is an automated notification from the Cambridge University Hospitals Room Booking System.
            </p>
        `,
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`WLI notification sent to: ${recipients}`);
    } catch (error) {
        console.error('Failed to send WLI notification:', error.message);
    }
}

module.exports = { sendWeekendBookingAlert, isWeekend, sendWLIConfirmation, sendWLINotification };
