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
async function createSeries(req, res) {
    try {
        const {
            clinic_id,
            room_id,
            series_name,
            start_time,
            end_time,
            duration_minutes,
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

        // Validate required fields
        if (!clinic_id || !room_id || !start_time || !end_time || !recurrence_type || !series_start_date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Create series record
        const seriesResult = await db.run(`
            INSERT INTO booking_series (
                clinic_id, room_id, series_name, start_time, end_time, duration_minutes,
                specialty, clinic_code, doctor_name, notes, color, recurrence_type, recurrence_pattern,
                series_start_date, series_end_date, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            clinic_id, room_id, series_name, start_time, end_time, duration_minutes || 60,
            specialty, clinic_code, doctor_name, notes, color || '#1976d2', recurrence_type,
            JSON.stringify(recurrence_pattern), series_start_date, series_end_date,
            req.user.id
        ]);

        const seriesId = seriesResult.id;

        // Get the created series
        const series = await db.get('SELECT * FROM booking_series WHERE id = ?', [seriesId]);

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
                    series_id, clinic_id, room_id, booking_date, start_time, end_time, duration_minutes,
                    specialty, clinic_code, doctor_name, notes, color, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                instance.series_id, instance.clinic_id, instance.room_id, instance.booking_date,
                instance.start_time, instance.end_time, instance.duration_minutes,
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
 * Delete/cancel entire series
 */
async function deleteSeries(req, res) {
    try {
        const { id } = req.params;

        const series = await db.get('SELECT * FROM booking_series WHERE id = ?', [id]);
        if (!series) {
            return res.status(404).json({ error: 'Series not found' });
        }

        // Mark series as inactive
        await db.run('UPDATE booking_series SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);

        // Cancel all future bookings
        const today = new Date().toISOString().split('T')[0];
        await db.run(`
            UPDATE bookings
            SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
            WHERE series_id = ? AND booking_date >= ?
        `, [id, today]);

        res.json({ message: 'Series cancelled successfully' });
    } catch (error) {
        console.error('Delete series error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

module.exports = {
    getAllSeries,
    getSeries,
    previewSeries,
    createSeries,
    updateSeries,
    deleteSeries
};
