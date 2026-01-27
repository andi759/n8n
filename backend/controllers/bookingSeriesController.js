const db = require('../config/database');
const { generateBookingInstances, previewBookingInstances, checkConflicts } = require('../services/recurrenceEngine');

/**
 * Get rotor cycle start date
 */
async function getRotorCycleStart() {
    const rotor = await db.get('SELECT start_date FROM rotor_cycles WHERE id = 1');
    return rotor ? rotor.start_date : process.env.ROTOR_CYCLE_START;
}

/**
 * Get all booking series
 */
async function getAllSeries(req, res) {
    try {
        const { is_active } = req.query;

        let query = `
            SELECT bs.*, r.room_name, r.room_number, c.clinic_name, c.clinic_code, u.full_name as created_by_name,
                   COUNT(b.id) as instance_count
            FROM booking_series bs
            JOIN rooms r ON bs.room_id = r.id
            JOIN clinics c ON bs.clinic_id = c.id
            JOIN users u ON bs.created_by = u.id
            LEFT JOIN bookings b ON bs.id = b.series_id
            WHERE 1=1
        `;
        const params = [];

        if (is_active !== undefined) {
            query += ' AND bs.is_active = ?';
            params.push(is_active === 'true' ? 1 : 0);
        }

        query += ' GROUP BY bs.id ORDER BY bs.created_at DESC';

        const series = await db.all(query, params);
        res.json(series);
    } catch (error) {
        console.error('Get series error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

/**
 * Get single series with its instances
 */
async function getSeries(req, res) {
    try {
        const { id } = req.params;

        const series = await db.get(`
            SELECT bs.*, r.room_name, r.room_number, c.clinic_name, c.clinic_code, u.full_name as created_by_name
            FROM booking_series bs
            JOIN rooms r ON bs.room_id = r.id
            JOIN clinics c ON bs.clinic_id = c.id
            JOIN users u ON bs.created_by = u.id
            WHERE bs.id = ?
        `, [id]);

        if (!series) {
            return res.status(404).json({ error: 'Series not found' });
        }

        // Get all instances
        const instances = await db.all(`
            SELECT * FROM bookings
            WHERE series_id = ?
            ORDER BY booking_date, start_time
        `, [id]);

        res.json({ ...series, instances });
    } catch (error) {
        console.error('Get series error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

/**
 * Preview booking instances before creating series
 */
async function previewSeries(req, res) {
    try {
        const seriesData = req.body;
        const rotorCycleStart = await getRotorCycleStart();

        // Calculate preview range (default to series range or next 3 months)
        const rangeStart = seriesData.series_start_date;
        const rangeEnd = seriesData.series_end_date || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const instances = previewBookingInstances(seriesData, rangeStart, rangeEnd, rotorCycleStart);

        // Check for conflicts
        const conflicts = await checkConflicts(instances, db);

        res.json({
            instances,
            conflicts,
            total_count: instances.length,
            conflict_count: conflicts.length
        });
    } catch (error) {
        console.error('Preview series error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
}

/**
 * Create booking series
 */
// Helper function to get start/end times from session
function getTimesFromSession(session) {
    switch (session) {
        case 'am':
            return { start_time: '08:30', end_time: '12:30', duration_minutes: 240 };
        case 'pm':
            return { start_time: '13:30', end_time: '17:30', duration_minutes: 240 };
        case 'all_day':
        default:
            return { start_time: '08:30', end_time: '17:30', duration_minutes: 540 };
    }
}

async function createSeries(req, res) {
    try {
        const {
            clinic_id,
            room_id,
            series_name,
            session,
            specialty,
            clinic_code,
            doctor_name,
            notes,
            color,
            recurrence_type,
            recurrence_pattern,
            series_start_date,
            series_end_date,
            excluded_dates = []  // Array of dates to skip (e.g., conflicts or user-excluded)
        } = req.body;

        // Get times from session
        const { start_time, end_time, duration_minutes } = getTimesFromSession(session);

        // Validate required fields
        if (!clinic_id || !room_id || !session || !recurrence_type || !series_start_date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Create series record
        const seriesResult = await db.run(`
            INSERT INTO booking_series (
                clinic_id, room_id, series_name, start_time, end_time, duration_minutes, session,
                specialty, clinic_code, doctor_name, notes, color, recurrence_type, recurrence_pattern,
                series_start_date, series_end_date, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            clinic_id, room_id, series_name, start_time, end_time, duration_minutes, session || 'all_day',
            specialty, clinic_code, doctor_name, notes, color || '#1976d2', recurrence_type,
            JSON.stringify(recurrence_pattern), series_start_date, series_end_date,
            req.user.id
        ]);

        const seriesId = seriesResult.id;

        if (!seriesId) {
            console.error('Failed to get series ID from insert result:', seriesResult);
            return res.status(500).json({ error: 'Failed to create booking series - no ID returned' });
        }

        // Get the created series
        const series = await db.get('SELECT * FROM booking_series WHERE id = ?', [seriesId]);

        if (!series) {
            console.error('Series not found after insert. ID:', seriesId);
            return res.status(500).json({ error: 'Failed to retrieve created booking series' });
        }

        // Generate instances
        const rotorCycleStart = await getRotorCycleStart();
        const rangeEnd = series_end_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        let instances = generateBookingInstances(series, series_start_date, rangeEnd, rotorCycleStart);

        // Filter out excluded dates (conflicts or user-excluded)
        // Normalize dates to YYYY-MM-DD format for consistent comparison
        const excludedSet = new Set(excluded_dates.map(d => String(d).substring(0, 10)));
        const filteredInstances = instances.filter(
            instance => !excludedSet.has(String(instance.booking_date).substring(0, 10))
        );

        console.log('Excluded dates:', Array.from(excludedSet));
        console.log('Total instances:', instances.length);
        console.log('Filtered instances (to be created):', filteredInstances.length);

        // Insert only non-excluded instances
        const insertPromises = filteredInstances.map(instance =>
            db.run(`
                INSERT INTO bookings (
                    series_id, clinic_id, room_id, booking_date, start_time, end_time, duration_minutes, session,
                    specialty, clinic_code, doctor_name, notes, color, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                instance.series_id, instance.clinic_id, instance.room_id, instance.booking_date,
                instance.start_time, instance.end_time, instance.duration_minutes, instance.session || session || 'all_day',
                instance.specialty, instance.clinic_code, instance.doctor_name,
                instance.notes, instance.color || series.color || '#1976d2',
                instance.created_by
            ])
        );

        await Promise.all(insertPromises);

        res.status(201).json({
            message: 'Series created successfully',
            series,
            instance_count: filteredInstances.length,
            skipped_count: instances.length - filteredInstances.length
        });
    } catch (error) {
        console.error('Create series error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
}

/**
 * Update entire series
 */
async function updateSeries(req, res) {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Check if series exists
        const existing = await db.get('SELECT * FROM booking_series WHERE id = ?', [id]);
        if (!existing) {
            return res.status(404).json({ error: 'Series not found' });
        }

        // Update series record
        const updateFields = [];
        const updateParams = [];

        ['room_id', 'series_name', 'start_time', 'end_time', 'duration_minutes',
         'specialty', 'clinic_code', 'doctor_name', 'notes', 'color', 'series_end_date'].forEach(field => {
            if (updates[field] !== undefined) {
                updateFields.push(`${field} = ?`);
                updateParams.push(updates[field]);
            }
        });

        if (updateFields.length > 0) {
            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            updateParams.push(id);

            await db.run(`
                UPDATE booking_series SET ${updateFields.join(', ')}
                WHERE id = ?
            `, updateParams);
        }

        // If recurrence pattern changed, regenerate instances
        if (updates.recurrence_pattern) {
            // Delete existing non-exception instances
            await db.run('DELETE FROM bookings WHERE series_id = ? AND is_exception = 0', [id]);

            // Get updated series
            const series = await db.get('SELECT * FROM booking_series WHERE id = ?', [id]);

            // Regenerate instances
            const rotorCycleStart = await getRotorCycleStart();
            const rangeEnd = series.series_end_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const instances = generateBookingInstances(series, series.series_start_date, rangeEnd, rotorCycleStart);

            // Insert new instances
            const insertPromises = instances.map(instance =>
                db.run(`
                    INSERT INTO bookings (
                        series_id, room_id, booking_date, start_time, end_time, duration_minutes,
                        purpose, procedure_type, notes, created_by
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    instance.series_id, instance.room_id, instance.booking_date,
                    instance.start_time, instance.end_time, instance.duration_minutes,
                    instance.purpose, instance.procedure_type, instance.notes,
                    instance.created_by
                ])
            );

            await Promise.all(insertPromises);
        }

        const updated = await db.get('SELECT * FROM booking_series WHERE id = ?', [id]);
        res.json({ message: 'Series updated successfully', series: updated });
    } catch (error) {
        console.error('Update series error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

/**
 * Delete/cancel series from a specific date forward
 * Query params:
 * - from_date: The date from which to cancel (includes this date and future dates)
 *              If not provided, cancels from today forward
 */
async function deleteSeries(req, res) {
    try {
        const { id } = req.params;
        const { from_date } = req.query;

        const series = await db.get('SELECT * FROM booking_series WHERE id = ?', [id]);
        if (!series) {
            return res.status(404).json({ error: 'Series not found' });
        }

        // Use from_date if provided, otherwise use today
        const cancelFromDate = from_date || new Date().toISOString().split('T')[0];

        // Mark series as inactive
        await db.run('UPDATE booking_series SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);

        // Cancel bookings from the specified date forward (not past bookings)
        await db.run(`
            UPDATE bookings
            SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
            WHERE series_id = ? AND booking_date >= ?
        `, [id, cancelFromDate]);

        res.json({
            message: 'Series cancelled successfully',
            cancelled_from: cancelFromDate
        });
    } catch (error) {
        console.error('Delete series error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

/**
 * Extend a booking series by adding more instances
 * This adds bookings from the current series end date to the new end date
 */
async function extendSeries(req, res) {
    try {
        const { id } = req.params;
        const { new_end_date, excluded_dates = [] } = req.body;

        if (!new_end_date) {
            return res.status(400).json({ error: 'New end date is required' });
        }

        // Get the series
        const series = await db.get('SELECT * FROM booking_series WHERE id = ?', [id]);
        if (!series) {
            return res.status(404).json({ error: 'Series not found' });
        }

        // Get the last booking date in this series
        const lastBooking = await db.get(`
            SELECT MAX(booking_date) as last_date
            FROM bookings
            WHERE series_id = ? AND status = 'confirmed'
        `, [id]);

        // Determine the start date for new instances
        // Start from the day after the last booking, or from series_start_date if no bookings exist
        let extensionStartDate;
        if (lastBooking && lastBooking.last_date) {
            const lastDate = new Date(lastBooking.last_date);
            lastDate.setDate(lastDate.getDate() + 1);
            extensionStartDate = lastDate.toISOString().split('T')[0];
        } else {
            extensionStartDate = series.series_start_date;
        }

        // Validate new end date is after the extension start
        if (new_end_date <= extensionStartDate) {
            return res.status(400).json({
                error: 'New end date must be after the current last booking date',
                current_last_date: lastBooking?.last_date || series.series_start_date
            });
        }

        // Update series end date
        await db.run(`
            UPDATE booking_series
            SET series_end_date = ?, is_active = 1, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [new_end_date, id]);

        // Generate new instances for the extension period
        const rotorCycleStart = await getRotorCycleStart();
        let newInstances = generateBookingInstances(series, extensionStartDate, new_end_date, rotorCycleStart);

        // Filter out excluded dates
        const excludedSet = new Set(excluded_dates.map(d => String(d).substring(0, 10)));
        const filteredInstances = newInstances.filter(
            instance => !excludedSet.has(String(instance.booking_date).substring(0, 10))
        );

        // Check for conflicts with existing bookings
        const conflicts = await checkConflicts(filteredInstances, db);
        const conflictDates = new Set(conflicts.map(c => c.booking_date));

        // Filter out conflicting dates
        const instancesToCreate = filteredInstances.filter(
            instance => !conflictDates.has(instance.booking_date)
        );

        // Insert new booking instances
        const insertPromises = instancesToCreate.map(instance =>
            db.run(`
                INSERT INTO bookings (
                    series_id, clinic_id, room_id, booking_date, start_time, end_time, duration_minutes, session,
                    specialty, clinic_code, doctor_name, notes, color, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                id, series.clinic_id, series.room_id, instance.booking_date,
                series.start_time, series.end_time, series.duration_minutes, series.session || 'all_day',
                series.specialty, series.clinic_code, series.doctor_name,
                series.notes, series.color || '#1976d2',
                req.user.id
            ])
        );

        await Promise.all(insertPromises);

        res.json({
            message: 'Series extended successfully',
            new_end_date,
            instances_added: instancesToCreate.length,
            conflicts_skipped: conflicts.length,
            excluded_skipped: filteredInstances.length - instancesToCreate.length - conflicts.length
        });
    } catch (error) {
        console.error('Extend series error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
}

module.exports = {
    getAllSeries,
    getSeries,
    previewSeries,
    createSeries,
    updateSeries,
    deleteSeries,
    extendSeries
};
