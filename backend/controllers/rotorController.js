const db = require('../config/database');
const { calculateRotorWeek, getRotorWeekDescription } = require('../services/rotorCalculator');

/**
 * Get current rotor week
 */
async function getCurrentWeek(req, res) {
    try {
        const rotor = await db.get('SELECT start_date FROM rotor_cycles WHERE id = 1');
        const cycleStart = rotor ? rotor.start_date : process.env.ROTOR_CYCLE_START;

        const today = new Date();
        const weekNumber = calculateRotorWeek(today, cycleStart);

        res.json({
            week_number: weekNumber,
            description: getRotorWeekDescription(weekNumber),
            cycle_start_date: cycleStart,
            current_date: today.toISOString().split('T')[0]
        });
    } catch (error) {
        console.error('Get current week error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

/**
 * Get rotor week for a specific date
 */
async function getWeekForDate(req, res) {
    try {
        const { date } = req.params;

        const rotor = await db.get('SELECT start_date FROM rotor_cycles WHERE id = 1');
        const cycleStart = rotor ? rotor.start_date : process.env.ROTOR_CYCLE_START;

        const weekNumber = calculateRotorWeek(date, cycleStart);

        res.json({
            date,
            week_number: weekNumber,
            description: getRotorWeekDescription(weekNumber),
            cycle_start_date: cycleStart
        });
    } catch (error) {
        console.error('Get week for date error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

/**
 * Set/reset rotor cycle start date
 */
async function setCycleStart(req, res) {
    try {
        const { start_date } = req.body;

        if (!start_date) {
            return res.status(400).json({ error: 'start_date is required' });
        }

        // Update or insert rotor cycle
        await db.run(`
            INSERT OR REPLACE INTO rotor_cycles (id, cycle_name, start_date, updated_at)
            VALUES (1, 'Main Rotor Cycle', ?, CURRENT_TIMESTAMP)
        `, [start_date]);

        res.json({
            message: 'Rotor cycle start date updated successfully',
            start_date
        });
    } catch (error) {
        console.error('Set cycle start error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

module.exports = {
    getCurrentWeek,
    getWeekForDate,
    setCycleStart
};
