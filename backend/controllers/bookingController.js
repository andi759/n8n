const db = require('../config/database');

/**
 * Get all bookings with filters
 */
async function getAllBookings(req, res) {
    try {
        const { start_date, end_date, room_id, clinic_id, status, specialty, is_reallocated } = req.query;

        let query = `
            SELECT b.*, r.room_name, r.room_number, c.clinic_name, c.clinic_code as clinic_code_name,
                   u.full_name as created_by_name,
                   ru.full_name as reallocated_by_name
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            JOIN clinics c ON b.clinic_id = c.id
            JOIN users u ON b.created_by = u.id
            LEFT JOIN users ru ON b.reallocated_by = ru.id
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
            query += ' AND b.specialty LIKE ?';
            params.push(`%${specialty}%`);
        }

        if (status) {
            query += ' AND b.status = ?';
            params.push(status);
        }

        if (is_reallocated !== undefined) {
            query += ' AND b.is_reallocated = ?';
            params.push(is_reallocated === 'true' ? 1 : 0);
        }

        query += ' ORDER BY b.booking_date, b.start_time';

        const bookings = await db.all(query, params);
        res.json(bookings);
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

/**
 * Get single booking
 */
async function getBooking(req, res) {
    try {
        const { id } = req.params;

        const booking = await db.get(`
            SELECT b.*, r.room_name, r.room_number, c.clinic_name, c.clinic_code as clinic_code_name,
                   u.full_name as created_by_name,
                   ru.full_name as reallocated_by_name
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            JOIN clinics c ON b.clinic_id = c.id
            JOIN users u ON b.created_by = u.id
            LEFT JOIN users ru ON b.reallocated_by = ru.id
            WHERE b.id = ?
        `, [id]);

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.json(booking);
    } catch (error) {
        console.error('Get booking error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

/**
 * Create one-time booking
 */
async function createBooking(req, res) {
    try {
        const {
            clinic_id,
            room_id,
            booking_date,
            start_time,
            end_time,
            duration_minutes,
            specialty,
            clinic_code,
            doctor_name,
            notes,
            color
        } = req.body;

        // Validate required fields
        if (!clinic_id || !room_id || !booking_date || !start_time || !end_time) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check for conflicts with non-cancelled bookings
        const conflicts = await db.all(`
            SELECT * FROM bookings
            WHERE room_id = ?
            AND booking_date = ?
            AND status != 'cancelled'
            AND (
                (start_time < ? AND end_time > ?)
                OR (start_time >= ? AND start_time < ?)
            )
        `, [room_id, booking_date, end_time, start_time, start_time, end_time]);

        if (conflicts.length > 0) {
            return res.status(409).json({
                error: 'Booking conflict detected',
                conflicts
            });
        }

        // Check if there's a cancelled booking that overlaps with this slot (reallocation scenario)
        const cancelledBooking = await db.get(`
            SELECT * FROM bookings
            WHERE room_id = ?
            AND booking_date = ?
            AND status = 'cancelled'
            AND (
                (start_time <= ? AND end_time >= ?)
                OR (start_time >= ? AND start_time < ?)
                OR (start_time < ? AND end_time > ?)
            )
            ORDER BY updated_at DESC
            LIMIT 1
        `, [room_id, booking_date, start_time, start_time, start_time, end_time, end_time, end_time]);

        // Prepare reallocation fields
        let isReallocated = 0;
        let previousBookingId = null;
        let reallocatedBy = null;
        let reallocatedAt = null;

        if (cancelledBooking) {
            isReallocated = 1;
            previousBookingId = cancelledBooking.id;
            reallocatedBy = req.user.id;
            reallocatedAt = new Date().toISOString();
        }

        // Create booking
        const result = await db.run(`
            INSERT INTO bookings (
                clinic_id, room_id, booking_date, start_time, end_time, duration_minutes,
                specialty, clinic_code, doctor_name, notes, color, created_by,
                is_reallocated, previous_booking_id, reallocated_by, reallocated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            clinic_id, room_id, booking_date, start_time, end_time, duration_minutes || 60,
            specialty, clinic_code, doctor_name, notes, color || '#1976d2', req.user.id,
            isReallocated, previousBookingId, reallocatedBy, reallocatedAt
        ]);

        const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [result.id]);
        res.status(201).json(booking);
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

/**
 * Update booking
 */
async function updateBooking(req, res) {
    try {
        const { id } = req.params;
        const {
            clinic_id,
            room_id,
            booking_date,
            start_time,
            end_time,
            duration_minutes,
            specialty,
            clinic_code,
            doctor_name,
            notes,
            status,
            color
        } = req.body;

        // Check if booking exists
        const existing = await db.get('SELECT * FROM bookings WHERE id = ?', [id]);
        if (!existing) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Check for conflicts (excluding current booking)
        if (room_id && booking_date && start_time && end_time) {
            const conflicts = await db.all(`
                SELECT * FROM bookings
                WHERE id != ?
                AND room_id = ?
                AND booking_date = ?
                AND status != 'cancelled'
                AND (
                    (start_time < ? AND end_time > ?)
                    OR (start_time >= ? AND start_time < ?)
                )
            `, [id, room_id, booking_date, end_time, start_time, start_time, end_time]);

            if (conflicts.length > 0) {
                return res.status(409).json({
                    error: 'Booking conflict detected',
                    conflicts
                });
            }
        }

        // Mark as exception if part of a series
        const isException = existing.series_id ? 1 : 0;

        // Update booking
        await db.run(`
            UPDATE bookings SET
                clinic_id = COALESCE(?, clinic_id),
                room_id = COALESCE(?, room_id),
                booking_date = COALESCE(?, booking_date),
                start_time = COALESCE(?, start_time),
                end_time = COALESCE(?, end_time),
                duration_minutes = COALESCE(?, duration_minutes),
                specialty = COALESCE(?, specialty),
                clinic_code = COALESCE(?, clinic_code),
                doctor_name = COALESCE(?, doctor_name),
                notes = COALESCE(?, notes),
                status = COALESCE(?, status),
                color = COALESCE(?, color),
                is_exception = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            clinic_id, room_id, booking_date, start_time, end_time, duration_minutes,
            specialty, clinic_code, doctor_name, notes, status, color, isException, id
        ]);

        const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [id]);
        res.json(booking);
    } catch (error) {
        console.error('Update booking error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

/**
 * Delete/cancel booking
 */
async function deleteBooking(req, res) {
    try {
        const { id } = req.params;

        const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [id]);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Soft delete by marking as cancelled
        await db.run(
            'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            ['cancelled', id]
        );

        res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        console.error('Delete booking error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

/**
 * Check room availability
 */
async function checkAvailability(req, res) {
    try {
        const { room_id, start_date, end_date } = req.query;

        if (!room_id || !start_date) {
            return res.status(400).json({ error: 'room_id and start_date are required' });
        }

        const bookings = await db.all(`
            SELECT booking_date, start_time, end_time
            FROM bookings
            WHERE room_id = ?
            AND booking_date >= ?
            AND booking_date <= ?
            AND status != 'cancelled'
            ORDER BY booking_date, start_time
        `, [room_id, start_date, end_date || start_date]);

        res.json({ bookings });
    } catch (error) {
        console.error('Check availability error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

module.exports = {
    getAllBookings,
    getBooking,
    createBooking,
    updateBooking,
    deleteBooking,
    checkAvailability
};
