export function getRecurrenceDescription(recurrenceType, pattern) {
  if (!pattern) return 'No recurrence';

  switch (recurrenceType) {
    case 'weekly':
      return getWeeklyDescription(pattern.weekly);
    case 'monthly':
      return getMonthlyDescription(pattern.monthly);
    case 'five_week_rotor':
      return getRotaDescription(pattern.five_week_rotor);
    default:
      return 'Custom recurrence';
  }
}

function getWeeklyDescription(weekly) {
  if (!weekly) return '';

  const { interval, days } = weekly;
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const selectedDays = days.map(d => dayNames[d]).join(', ');

  if (interval === 1) {
    return `Every week on ${selectedDays}`;
  } else {
    return `Every ${interval} weeks on ${selectedDays}`;
  }
}

function getMonthlyDescription(monthly) {
  if (!monthly) return '';

  const { type, day, weekday, week_number } = monthly;

  if (type === 'day_of_month') {
    return `Day ${day} of each month`;
  } else if (type === 'weekday_of_month') {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const ordinals = ['', 'first', 'second', 'third', 'fourth', 'fifth'];
    return `${ordinals[week_number]} ${dayNames[weekday]} of each month`;
  }

  return 'Monthly';
}

function getRotaDescription(rota) {
  if (!rota) return '';

  const { weeks, days_of_week, day_of_week } = rota;
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weeksStr = weeks.join(', ');

  // Support both old format (single day_of_week) and new format (days_of_week array)
  let daysStr;
  if (days_of_week && days_of_week.length > 0) {
    daysStr = days_of_week.map(d => dayNames[d]).join(', ');
  } else if (day_of_week !== undefined && day_of_week !== null) {
    daysStr = dayNames[day_of_week];
  } else {
    daysStr = 'No days selected';
  }

  return `${daysStr} on rota weeks ${weeksStr}`;
}

export function validateRecurrencePattern(recurrenceType, pattern) {
  if (!pattern) return false;

  switch (recurrenceType) {
    case 'weekly':
      return pattern.weekly && pattern.weekly.days && pattern.weekly.days.length > 0;
    case 'monthly':
      return pattern.monthly && pattern.monthly.type;
    case 'five_week_rotor':
      const rota = pattern.five_week_rotor;
      if (!rota || !rota.weeks || rota.weeks.length === 0) return false;
      // Accept either days_of_week array or single day_of_week
      return (rota.days_of_week && rota.days_of_week.length > 0) ||
             (rota.day_of_week !== undefined && rota.day_of_week !== null);
    default:
      return false;
  }
}
