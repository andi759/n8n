const db = require('../config/database');
const { sendWLIConfirmation, sendWLINotification } = require('../services/emailService');

async function createWLIRequest(req, res) {
    try {
        const {
            requester_name,
            contact_email,
            division,
            specialty,
            specialty_other,
            wli_date,
            wli_start_time,
            wli_end_time,
            preferred_location,
            num_patients,
            num_clock_stops,
            requirements,
            requirements_other,
            director_approved,
        } = req.body;

        // Validate required fields
        if (!requester_name || !contact_email || !division || !specialty || !wli_date || !wli_start_time || !wli_end_time) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Store requirements array as JSON string
        const requirementsStr = Array.isArray(requirements) ? JSON.stringify(requirements) : requirements;

        const result = await db.run(`
            INSERT INTO wli_requests (
                requester_name, contact_email, division, specialty, specialty_other,
                wli_date, wli_start_time, wli_end_time, preferred_location, num_patients, num_clock_stops,
                requirements, requirements_other, director_approved
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `, [
            requester_name, contact_email, division, specialty, specialty_other || null,
            wli_date, wli_start_time, wli_end_time, preferred_location || null, num_patients || null, num_clock_stops || null,
            requirementsStr || null, requirements_other || null, director_approved || null,
        ]);

        const wliRequest = await db.get('SELECT * FROM wli_requests WHERE id = $1', [result.id]);

        // Send emails (non-blocking)
        sendWLIConfirmation(wliRequest);
        sendWLINotification(wliRequest);

        res.status(201).json({ success: true, id: result.id });
    } catch (error) {
        console.error('Create WLI request error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

module.exports = { createWLIRequest };
