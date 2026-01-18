/**
 * Five-Week Rotor Calculator
 * Calculates which week (1-5) a given date falls within the rotor cycle
 */

/**
 * Calculate the rotor week number for a given date
 * @param {string|Date} date - The date to check
 * @param {string|Date} cycleStartDate - The start date of the rotor cycle
 * @returns {number} - Week number (1-5)
 */
function calculateRotorWeek(date, cycleStartDate) {
    const targetDate = new Date(date);
    const startDate = new Date(cycleStartDate);

    // Reset time components to compare dates only
    targetDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);

    // Calculate the difference in days
    const diffTime = targetDate - startDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Calculate which week we're in (0-based)
    const weeksSinceStart = Math.floor(diffDays / 7);

    // Get week within the 5-week cycle (1-5)
    const rotorWeek = (weeksSinceStart % 5) + 1;

    return rotorWeek;
}

/**
 * Get the start date of a specific rotor week
 * @param {number} targetWeek - The target week number (1-5)
 * @param {string|Date} referenceDate - A reference date to find the nearest occurrence
 * @param {string|Date} cycleStartDate - The start date of the rotor cycle
 * @returns {Date} - The start date (Monday) of the target rotor week
 */
function getRotorWeekStartDate(targetWeek, referenceDate, cycleStartDate) {
    const refDate = new Date(referenceDate);
    const startDate = new Date(cycleStartDate);

    refDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);

    // Calculate current rotor week
    const currentWeek = calculateRotorWeek(refDate, cycleStartDate);

    // Calculate how many weeks to add/subtract
    let weeksToAdjust = targetWeek - currentWeek;

    // If target week is in the past within current cycle, move to next cycle
    if (weeksToAdjust < 0) {
        weeksToAdjust += 5;
    }

    // Calculate the target date
    const daysToAdjust = weeksToAdjust * 7;
    const targetDate = new Date(refDate);
    targetDate.setDate(targetDate.getDate() + daysToAdjust);

    // Adjust to Monday of that week
    const dayOfWeek = targetDate.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    targetDate.setDate(targetDate.getDate() + daysToMonday);

    return targetDate;
}

/**
 * Check if a given date falls within specific rotor weeks
 * @param {string|Date} date - The date to check
 * @param {number[]} targetWeeks - Array of target week numbers (e.g., [1, 3, 5])
 * @param {string|Date} cycleStartDate - The start date of the rotor cycle
 * @returns {boolean} - True if date falls within one of the target weeks
 */
function isDateInRotorWeeks(date, targetWeeks, cycleStartDate) {
    const rotorWeek = calculateRotorWeek(date, cycleStartDate);
    return targetWeeks.includes(rotorWeek);
}

/**
 * Get all dates for a specific day of week within target rotor weeks in a date range
 * @param {number} dayOfWeek - Day of week (0=Sunday, 1=Monday, etc.)
 * @param {number[]} targetWeeks - Array of target rotor weeks (e.g., [1, 3, 5])
 * @param {string|Date} startDate - Start of date range
 * @param {string|Date} endDate - End of date range
 * @param {string|Date} cycleStartDate - The start date of the rotor cycle
 * @returns {Date[]} - Array of dates matching the criteria
 */
function getRotorDates(dayOfWeek, targetWeeks, startDate, endDate, cycleStartDate) {
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
        // Check if this date is in one of the target rotor weeks
        if (isDateInRotorWeeks(current, targetWeeks, cycleStartDate)) {
            dates.push(new Date(current));
        }

        // Move to next week
        current.setDate(current.getDate() + 7);
    }

    return dates;
}

/**
 * Get human-readable description of rotor week
 * @param {number} week - Week number (1-5)
 * @returns {string} - Description like "Week 1 of 5"
 */
function getRotorWeekDescription(week) {
    return `Week ${week} of 5`;
}

module.exports = {
    calculateRotorWeek,
    getRotorWeekStartDate,
    isDateInRotorWeeks,
    getRotorDates,
    getRotorWeekDescription
};
