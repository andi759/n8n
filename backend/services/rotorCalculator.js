/**
 * Five-Week Rota Calculator
 * Calculates which week (1-5) a given date falls within based on day of month.
 * Week 1: Days 1-7, Week 2: Days 8-14, Week 3: Days 15-21, Week 4: Days 22-28, Week 5: Days 29-31
 * The rota resets on the 1st of each month.
 */

/**
 * Calculate the rota week number for a given date
 * @param {string|Date} date - The date to check
 * @returns {number} - Week number (1-5)
 */
function calculateRotorWeek(date) {
    const targetDate = new Date(date);
    const dayOfMonth = targetDate.getDate();

    if (dayOfMonth <= 7) return 1;
    if (dayOfMonth <= 14) return 2;
    if (dayOfMonth <= 21) return 3;
    if (dayOfMonth <= 28) return 4;
    return 5;
}

/**
 * Check if a given date falls within specific rota weeks
 * @param {string|Date} date - The date to check
 * @param {number[]} targetWeeks - Array of target week numbers (e.g., [1, 3, 5])
 * @returns {boolean} - True if date falls within one of the target weeks
 */
function isDateInRotorWeeks(date, targetWeeks) {
    const rotorWeek = calculateRotorWeek(date);
    return targetWeeks.includes(rotorWeek);
}

/**
 * Get all dates for a specific day of week within target rota weeks in a date range
 * @param {number} dayOfWeek - Day of week (0=Sunday, 1=Monday, etc.)
 * @param {number[]} targetWeeks - Array of target rota weeks (e.g., [1, 3, 5])
 * @param {string|Date} startDate - Start of date range
 * @param {string|Date} endDate - End of date range
 * @returns {Date[]} - Array of dates matching the criteria
 */
function getRotorDates(dayOfWeek, targetWeeks, startDate, endDate) {
    const dates = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    current.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    // Adjust current to the first occurrence of the target day of week
    const currentDay = current.getDay();
    const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;
    current.setDate(current.getDate() + daysUntilTarget);

    // Iterate through all occurrences of the day of week in the range
    while (current <= end) {
        // Check if this date is in one of the target rota weeks
        if (isDateInRotorWeeks(current, targetWeeks)) {
            dates.push(new Date(current));
        }

        // Move to next week
        current.setDate(current.getDate() + 7);
    }

    return dates;
}

/**
 * Get human-readable description of rota week
 * @param {number} week - Week number (1-5)
 * @returns {string} - Description like "Week 1 of 5"
 */
function getRotorWeekDescription(week) {
    return `Week ${week} of 5`;
}

module.exports = {
    calculateRotorWeek,
    isDateInRotorWeeks,
    getRotorDates,
    getRotorWeekDescription
};
