/**
 * ALDI Weekly Dates Utility
 * Handles ISO week calculations and clamping logic.
 */

/**
 * Calculates the ALDI week boundaries (Wednesday to Tuesday) for a given ISO year and ISO week.
 * The week boundary is defined as:
 * - Start: Wednesday of the given ISO week (00:00:00)
 * - End: Tuesday of the next ISO week (23:59:59)
 * 
 * Returns dates in YYYY-MM-DD format to avoid timezone shifts.
 */
function getAldiWeekBoundaries(year, weekNumber) {
    if (year < 2000 || year > 2100) return null;
    if (weekNumber < 1 || weekNumber > 53) return null;

    // A function to get the Monday of an ISO week
    // Jan 4th is always in week 1.
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const jan4Day = jan4.getUTCDay() || 7; // 1 (Mon) to 7 (Sun)
    const week1Monday = new Date(jan4.getTime() - (jan4Day - 1) * 86400000);
    
    // Check if week 53 is valid for this year
    if (weekNumber === 53) {
        // Week 53 exists only if Jan 1 is Thursday, or leap year starting on Wednesday
        const isLeapYear = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0));
        const jan1Day = new Date(Date.UTC(year, 0, 1)).getUTCDay() || 7;
        if (!(jan1Day === 4 || (isLeapYear && jan1Day === 3))) {
            return null; // Invalid week 53
        }
    }
    
    // Add (weekNumber - 1) weeks to get Monday of the target week
    const targetMonday = new Date(week1Monday.getTime() + (weekNumber - 1) * 7 * 86400000);
    
    // Wednesday is Monday + 2 days
    const wednesday = new Date(targetMonday.getTime() + 2 * 86400000);
    
    // Tuesday is Wednesday + 6 days
    const tuesday = new Date(wednesday.getTime() + 6 * 86400000);
    
    return {
        start: wednesday.toISOString().split('T')[0], // YYYY-MM-DD
        end: tuesday.toISOString().split('T')[0]
    };
}

/**
 * Validates and clamps a date range against the ALDI weekly boundaries.
 * 
 * @param {string} startStr - YYYY-MM-DD format
 * @param {string} endStr - YYYY-MM-DD format
 * @param {number} year - ISO Year
 * @param {number} weekNumber - ISO Week Number
 * @returns {Object} { status, start, end }
 * 
 * Statuses:
 * - valid: Date range is completely within boundaries
 * - clamped: Date range partially overlaps and was clamped
 * - invalid_outside: Date range completely outside boundaries
 * - invalid_format: Invalid date string format or invalid year/week
 * - invalid_reversed: Start date is after end date
 */
function validateAldiPeriod(startStr, endStr, year, weekNumber) {
    const boundaries = getAldiWeekBoundaries(year, weekNumber);
    if (!boundaries) {
        return { status: 'invalid_format', start: null, end: null, boundaries: null };
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    // Handle cases where no date is provided, invalid format, or invalid calendar date (e.g. Feb 30)
    if (!startStr || !endStr || !dateRegex.test(startStr) || !dateRegex.test(endStr)) {
        return { status: 'invalid_format', start: null, end: null, boundaries };
    }
    
    // JS Date.parse parses YYYY-MM-DD as UTC. If the date is invalid (like 2026-02-31), Date.parse will usually return NaN or roll over.
    // To strictly check if it rolled over (e.g. 2026-02-31 -> 2026-03-03), we can compare the parsed date components.
    const startObj = new Date(startStr);
    const endObj = new Date(endStr);
    if (isNaN(startObj.getTime()) || isNaN(endObj.getTime()) || startObj.toISOString().split('T')[0] !== startStr || endObj.toISOString().split('T')[0] !== endStr) {
        return { status: 'invalid_format', start: null, end: null, boundaries };
    }

    if (startStr > endStr) {
        return { status: 'invalid_reversed', start: null, end: null, boundaries };
    }

    // Completely outside
    if (endStr < boundaries.start || startStr > boundaries.end) {
        return { status: 'invalid_outside', start: null, end: null, boundaries };
    }

    let status = 'valid';
    let clampedStart = startStr;
    let clampedEnd = endStr;

    if (startStr < boundaries.start) {
        clampedStart = boundaries.start;
        status = 'clamped';
    }

    if (endStr > boundaries.end) {
        clampedEnd = boundaries.end;
        status = 'clamped';
    }

    return {
        status,
        start: clampedStart,
        end: clampedEnd,
        boundaries
    };
}

module.exports = {
    getAldiWeekBoundaries,
    validateAldiPeriod
};
