const { RRule } = require('rrule');
const { getRotorDates } = require('./rotorCalculator');

/**
 * Generate booking instances from a recurrence pattern
 * @param {Object} series - Booking series object
 * @param {string|Date} rangeStart - Start of date range to generate instances
 * @param {string|Date} rangeEnd - End of date range to generate instances
 * @param {string|Date} rotorCycleStart - Start date of rotor cycle (for five_week_rotor pattern)
 * @returns {Array} - Array of booking instance objects
 */
function generateBookingInstances(series, rangeStart, rangeEnd, rotorCycleStart) {
    const pattern = JSON.parse(series.recurrence_pattern || '{}');
    const seriesStart = new Date(series.series_start_date);
    const seriesEnd = series.series_end_date ? new Date(series.series_end_date) : null;

    // Determine effective date range
    const effectiveStart = new Date(Math.max(new Date(rangeStart), seriesStart));
    const effectiveEnd = seriesEnd
        ? new Date(Math.min(new Date(rangeEnd), seriesEnd))
        : new Date(rangeEnd);

    let dates = [];

    switch (series.recurrence_type) {
        case 'weekly':
            dates = handleWeeklyPattern(pattern, effectiveStart, effectiveEnd);
            break;
        case 'monthly':
            dates = handleMonthlyPattern(pattern, effectiveStart, effectiveEnd);
            break;
        case 'five_week_rotor':
            dates = handleFiveWeekRotorPattern(pattern, effectiveStart, effectiveEnd, rotorCycleStart);
            break;
        case 'one_time':
            // For one-time bookings, just return the single date
            dates = [seriesStart];
            break;
        default:
            throw new Error(`Unsupported recurrence type: ${series.recurrence_type}`);
    }

    // Create booking instances - ensure IDs are integers
    const instances = dates.map(date => ({
        series_id: series.id,
        clinic_id: parseInt(series.clinic_id, 10),
        room_id: parseInt(series.room_id, 10),
        booking_date: formatDate(date),
        start_time: series.start_time,
        end_time: series.end_time,
        duration_minutes: parseInt(series.duration_minutes, 10) || 60,
        session: series.session || 'all_day',
        specialty: series.specialty,
        clinic_code: series.clinic_code,
        doctor_name: series.doctor_name,
        notes: series.notes,
        color: series.color || '#1976d2',
        status: 'confirmed',
        is_exception: 0,
        created_by: series.created_by
    }));

    return instances;
}

/**
 * Handle weekly recurrence pattern
 */
function handleWeeklyPattern(pattern, startDate, endDate) {
    const { interval = 1, days = [] } = pattern.weekly || {};

    if (!days || days.length === 0) {
        throw new Error('Weekly pattern must specify at least one day');
    }

    const dates = [];

    // Convert days array to RRule format
    const byweekday = days.map(day => {
        // days array: 0=Sunday, 1=Monday, etc.
        // RRule uses MO, TU, WE, TH, FR, SA, SU
        const rruleDays = [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA];
        return rruleDays[day];
    });

    const rule = new RRule({
        freq: RRule.WEEKLY,
        interval: interval,
        byweekday: byweekday,
        dtstart: startDate,
        until: endDate
    });

    return rule.all();
}

/**
 * Handle monthly recurrence pattern
 */
function handleMonthlyPattern(pattern, startDate, endDate) {
    const { type, day, weekday, week_number } = pattern.monthly || {};

    let rule;

    if (type === 'day_of_month') {
        // Specific day of month (e.g., 15th of each month)
        rule = new RRule({
            freq: RRule.MONTHLY,
            bymonthday: day,
            dtstart: startDate,
            until: endDate
        });
    } else if (type === 'weekday_of_month') {
        // Specific weekday of month (e.g., 2nd Tuesday)
        const rruleDays = [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA];
        const rruleWeekday = rruleDays[weekday];

        rule = new RRule({
            freq: RRule.MONTHLY,
            byweekday: rruleWeekday.nth(week_number),
            dtstart: startDate,
            until: endDate
        });
    } else {
        throw new Error('Invalid monthly pattern type');
    }

    return rule.all();
}

/**
 * Handle five-week rotor pattern
 */
function handleFiveWeekRotorPattern(pattern, startDate, endDate, rotorCycleStart) {
    const { weeks = [], days_of_week = [], day_of_week } = pattern.five_week_rotor || {};

    if (!weeks || weeks.length === 0) {
        throw new Error('Five-week rotor pattern must specify at least one week');
    }

    // Support both old format (single day_of_week) and new format (days_of_week array)
    let daysToProcess = [];
    if (days_of_week && days_of_week.length > 0) {
        daysToProcess = days_of_week;
    } else if (day_of_week !== undefined && day_of_week !== null) {
        // Backward compatibility: convert single day to array
        daysToProcess = [day_of_week];
    } else {
        throw new Error('Five-week rotor pattern must specify at least one day of week');
    }

    // Collect dates for all selected days
    const allDates = [];

    daysToProcess.forEach(dayOfWeek => {
        const datesForDay = getRotorDates(dayOfWeek, weeks, startDate, endDate, rotorCycleStart);
        allDates.push(...datesForDay);
    });

    // Sort dates chronologically
    allDates.sort((a, b) => a - b);

    return allDates;
}

/**
 * Preview booking instances before creating them
 */
function previewBookingInstances(seriesData, rangeStart, rangeEnd, rotorCycleStart) {
    // Convert seriesData to the format expected by generateBookingInstances
    const series = {
        ...seriesData,
        recurrence_pattern: typeof seriesData.recurrence_pattern === 'string'
            ? seriesData.recurrence_pattern
            : JSON.stringify(seriesData.recurrence_pattern)
    };

    return generateBookingInstances(series, rangeStart, rangeEnd, rotorCycleStart);
}

/**
 * Check for conflicts with existing bookings
 * @param {Array} instances - Array of booking instances to check
 * @param {Object} db - Database connection
 * @returns {Promise<Array>} - Array of conflicts
 */
async function checkConflicts(instances, db) {
    const conflicts = [];

    for (const instance of instances) {
        // Ensure room_id is an integer for proper comparison
        const roomId = parseInt(instance.room_id, 10);
        // Ensure booking_date is a clean string format (YYYY-MM-DD)
        const bookingDate = String(instance.booking_date).substring(0, 10);

        const query = `
            SELECT b.*, r.room_name
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            WHERE b.room_id = ?
            AND b.booking_date = ?
            AND (b.status IS NULL OR b.status != 'cancelled')
            AND (
                (b.start_time < ? AND b.end_time > ?)
                OR (b.start_time >= ? AND b.start_time < ?)
            )
        `;

        const existingBookings = await db.all(query, [
            roomId,
            bookingDate,
            instance.end_time,
            instance.start_time,
            instance.start_time,
            instance.end_time
        ]);

        if (existingBookings.length > 0) {
            conflicts.push({
                instance: { ...instance, booking_date: bookingDate },
                conflicting_bookings: existingBookings
            });
        }
    }

    return conflicts;
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

module.exports = {
    generateBookingInstances,
    previewBookingInstances,
    checkConflicts,
    handleWeeklyPattern,
    handleMonthlyPattern,
    handleFiveWeekRotorPattern
};
