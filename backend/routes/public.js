const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * Public API routes - no authentication required
 * These routes provide read-only access to calendar data
 */

// Get all bookings (read-only)
router.get('/bookings', async (req, res) => {
    try {
        const { start_date, end_date, room_id, clinic_id, status, specialty, session } = req.query;

        let query = `
            SELECT b.*, r.room_name, r.room_number, c.clinic_name, c.clinic_code as clinic_code_name,
                   u.full_name as created_by_name
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            JOIN clinics c ON b.clinic_id = c.id
            JOIN users u ON b.created_by = u.id
            WHERE 1=1
        `;
        const params = [];

        if (start_date) {
            query += ' AND b.booking_date >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND b.booking_date <= ?';
            params.push(end_date);
        }

        if (clinic_id) {
            query += ' AND b.clinic_id = ?';
            params.push(clinic_id);
        }

        if (room_id) {
            query += ' AND b.room_id = ?';
            params.push(room_id);
        }

        if (specialty) {
            query += ' AND b.specialty = ?';
            params.push(specialty);
        }

        if (status) {
            query += ' AND b.status = ?';
            params.push(status);
        }

        if (session) {
            query += ' AND b.session = ?';
            params.push(session);
        }

        query += ' ORDER BY b.booking_date, b.start_time';

        const bookings = await db.all(query, params);
        res.json(bookings);
    } catch (error) {
        console.error('Public get bookings error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all rooms (read-only)
router.get('/rooms', async (req, res) => {
    try {
        const { clinic_id, is_active } = req.query;

        let query = `
            SELECT r.*, c.clinic_name, c.clinic_code
            FROM rooms r
            JOIN clinics c ON r.clinic_id = c.id
            WHERE 1=1
        `;
        const params = [];

        if (clinic_id) {
            query += ' AND r.clinic_id = ?';
            params.push(clinic_id);
        }

        if (is_active !== undefined && is_active !== '' && is_active !== 'all') {
            query += ' AND r.is_active = ?';
            params.push(is_active === 'true' ? 1 : 0);
        }

        query += ' ORDER BY c.clinic_name, r.room_number';

        const rooms = await db.all(query, params);
        res.json(rooms);
    } catch (error) {
        console.error('Public get rooms error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all clinics (read-only)
router.get('/clinics', async (req, res) => {
    try {
        const { is_active } = req.query;

        let query = 'SELECT * FROM clinics WHERE 1=1';
        const params = [];

        if (is_active !== undefined && is_active !== '') {
            query += ' AND is_active = ?';
            params.push(is_active === 'true' ? 1 : 0);
        }

        query += ' ORDER BY clinic_name';

        const clinics = await db.all(query, params);
        res.json(clinics);
    } catch (error) {
        console.error('Public get clinics error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all specialties (read-only)
router.get('/specialties', async (req, res) => {
    try {
        const specialties = await db.all('SELECT * FROM specialties ORDER BY name');
        res.json(specialties);
    } catch (error) {
        console.error('Public get specialties error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
