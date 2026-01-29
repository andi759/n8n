const { calculateRotorWeek, getRotorWeekDescription } = require('../services/rotorCalculator');

/**
 * Get current rota week
 */
async function getCurrentWeek(req, res) {
    try {
        const today = new Date();
        const weekNumber = calculateRotorWeek(today);

        res.json({
            week_number: weekNumber,
            description: getRotorWeekDescription(weekNumber),
            current_date: today.toISOString().split('T')[0]
        });
    } catch (error) {
        console.error('Get current week error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

/**
 * Get rota week for a specific date
 */
async function getWeekForDate(req, res) {
    try {
        const { date } = req.params;
        const weekNumber = calculateRotorWeek(date);

        res.json({
            date,
            week_number: weekNumber,
            description: getRotorWeekDescription(weekNumber)
        });
    } catch (error) {
        console.error('Get week for date error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

module.exports = {
    getCurrentWeek,
    getWeekForDate
};
