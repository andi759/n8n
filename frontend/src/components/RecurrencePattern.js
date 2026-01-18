import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  FormLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
  Grid,
  Chip,
  Alert,
} from '@mui/material';
import { CalendarToday, Repeat, ViewWeek } from '@mui/icons-material';
import { getCurrentWeek } from '../services/rotorService';

function RecurrencePattern({ recurrenceType, pattern, onChange }) {
  const [selectedType, setSelectedType] = useState(recurrenceType || 'weekly');
  const [currentPattern, setCurrentPattern] = useState(pattern || {});
  const [rotaWeek, setRotaWeek] = useState(null);

  useEffect(() => {
    loadRotaWeek();
  }, []);

  useEffect(() => {
    if (!pattern) {
      initializePattern(selectedType);
    }
  }, [selectedType]);

  const loadRotaWeek = async () => {
    try {
      const data = await getCurrentWeek();
      setRotaWeek(data);
    } catch (error) {
      console.error('Failed to load rota week:', error);
    }
  };

  const initializePattern = (type) => {
    let newPattern = {};

    switch (type) {
      case 'weekly':
        newPattern = {
          weekly: {
            interval: 1,
            days: []
          }
        };
        break;
      case 'monthly':
        newPattern = {
          monthly: {
            type: 'day_of_month',
            day: 1,
            weekday: 1,
            week_number: 1
          }
        };
        break;
      case 'five_week_rotor':
        newPattern = {
          five_week_rotor: {
            weeks: [],
            day_of_week: 1
          }
        };
        break;
      default:
        newPattern = {};
    }

    setCurrentPattern(newPattern);
    onChange(type, newPattern);
  };

  const handleTypeChange = (event, newType) => {
    if (newType) {
      setSelectedType(newType);
      initializePattern(newType);
    }
  };

  const updatePattern = (updates) => {
    const newPattern = {
      ...currentPattern,
      [selectedType]: {
        ...currentPattern[selectedType],
        ...updates
      }
    };
    setCurrentPattern(newPattern);
    onChange(selectedType, newPattern);
  };

  const handleWeeklyDayToggle = (day) => {
    const currentDays = currentPattern.weekly?.days || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort();

    updatePattern({ days: newDays });
  };

  const handleWeeklyIntervalChange = (interval) => {
    updatePattern({ interval: parseInt(interval) || 1 });
  };

  const handleMonthlyTypeChange = (type) => {
    updatePattern({ type });
  };

  const handleMonthlyDayChange = (day) => {
    updatePattern({ day: parseInt(day) || 1 });
  };

  const handleMonthlyWeekdayChange = (weekday, weekNumber) => {
    updatePattern({
      weekday: parseInt(weekday),
      week_number: parseInt(weekNumber)
    });
  };

  const handleRotaWeekToggle = (week) => {
    const currentWeeks = currentPattern.five_week_rotor?.weeks || [];
    const newWeeks = currentWeeks.includes(week)
      ? currentWeeks.filter(w => w !== week)
      : [...currentWeeks, week].sort();

    updatePattern({ weeks: newWeeks });
  };

  const handleRotaDayToggle = (day) => {
    const currentDays = currentPattern.five_week_rotor?.days_of_week || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort();

    updatePattern({ days_of_week: newDays });
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weekNumbers = [1, 2, 3, 4, 5];

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Recurrence Pattern
        </Typography>

        <ToggleButtonGroup
          value={selectedType}
          exclusive
          onChange={handleTypeChange}
          fullWidth
          sx={{ mb: 3 }}
        >
          <ToggleButton value="weekly">
            <Repeat sx={{ mr: 1 }} />
            Weekly
          </ToggleButton>
          <ToggleButton value="monthly">
            <CalendarToday sx={{ mr: 1 }} />
            Monthly
          </ToggleButton>
          <ToggleButton value="five_week_rotor">
            <ViewWeek sx={{ mr: 1 }} />
            Five-Week Rota
          </ToggleButton>
        </ToggleButtonGroup>

        {selectedType === 'weekly' && (
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Repeat Every"
                  type="number"
                  value={currentPattern.weekly?.interval || 1}
                  onChange={(e) => handleWeeklyIntervalChange(e.target.value)}
                  InputProps={{ inputProps: { min: 1, max: 52 } }}
                  helperText="Number of weeks"
                  sx={{ width: 150 }}
                />
              </Grid>

              <Grid item xs={12}>
                <FormLabel component="legend">Repeat On</FormLabel>
                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                  {dayNames.map((day, index) => (
                    <Chip
                      key={index}
                      label={day}
                      onClick={() => handleWeeklyDayToggle(index)}
                      color={currentPattern.weekly?.days?.includes(index) ? 'primary' : 'default'}
                      variant={currentPattern.weekly?.days?.includes(index) ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </Grid>

              {(!currentPattern.weekly?.days || currentPattern.weekly.days.length === 0) && (
                <Grid item xs={12}>
                  <Alert severity="warning">Please select at least one day</Alert>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {selectedType === 'monthly' && (
          <Box>
            <RadioGroup
              value={currentPattern.monthly?.type || 'day_of_month'}
              onChange={(e) => handleMonthlyTypeChange(e.target.value)}
            >
              <FormControlLabel
                value="day_of_month"
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <span>On day</span>
                    <TextField
                      type="number"
                      size="small"
                      value={currentPattern.monthly?.day || 1}
                      onChange={(e) => handleMonthlyDayChange(e.target.value)}
                      InputProps={{ inputProps: { min: 1, max: 31 } }}
                      disabled={currentPattern.monthly?.type !== 'day_of_month'}
                      sx={{ width: 80 }}
                    />
                    <span>of each month</span>
                  </Box>
                }
              />

              <FormControlLabel
                value="weekday_of_month"
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <TextField
                      select
                      size="small"
                      value={currentPattern.monthly?.week_number || 1}
                      onChange={(e) => handleMonthlyWeekdayChange(
                        currentPattern.monthly?.weekday || 1,
                        e.target.value
                      )}
                      disabled={currentPattern.monthly?.type !== 'weekday_of_month'}
                      SelectProps={{ native: true }}
                      sx={{ width: 100 }}
                    >
                      <option value={1}>First</option>
                      <option value={2}>Second</option>
                      <option value={3}>Third</option>
                      <option value={4}>Fourth</option>
                      <option value={5}>Fifth</option>
                    </TextField>

                    <TextField
                      select
                      size="small"
                      value={currentPattern.monthly?.weekday || 1}
                      onChange={(e) => handleMonthlyWeekdayChange(
                        e.target.value,
                        currentPattern.monthly?.week_number || 1
                      )}
                      disabled={currentPattern.monthly?.type !== 'weekday_of_month'}
                      SelectProps={{ native: true }}
                      sx={{ width: 130 }}
                    >
                      {fullDayNames.map((day, index) => (
                        <option key={index} value={index}>{day}</option>
                      ))}
                    </TextField>

                    <span>of each month</span>
                  </Box>
                }
              />
            </RadioGroup>
          </Box>
        )}

        {selectedType === 'five_week_rotor' && (
          <Box>
            {rotaWeek && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <strong>Current Rota Week:</strong> {rotaWeek.description}
                <br />
                <Typography variant="caption">
                  Cycle started: {new Date(rotaWeek.cycle_start_date).toLocaleDateString()}
                </Typography>
              </Alert>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormLabel component="legend" sx={{ mb: 1 }}>
                  Select Rota Weeks
                </FormLabel>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {weekNumbers.map((week) => (
                    <Chip
                      key={week}
                      label={`Week ${week}`}
                      onClick={() => handleRotaWeekToggle(week)}
                      color={currentPattern.five_week_rotor?.weeks?.includes(week) ? 'primary' : 'default'}
                      variant={currentPattern.five_week_rotor?.weeks?.includes(week) ? 'filled' : 'outlined'}
                      sx={{
                        fontSize: '1rem',
                        height: 48,
                        minWidth: 80,
                        ...(rotaWeek && rotaWeek.week_number === week && {
                          borderColor: 'secondary.main',
                          borderWidth: 2,
                        })
                      }}
                    />
                  ))}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Select which weeks in the 5-week cycle
                  {rotaWeek && ` (current week ${rotaWeek.week_number} is highlighted)`}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <FormLabel component="legend" sx={{ mb: 1 }}>
                  Days of Week
                </FormLabel>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {fullDayNames.map((day, index) => (
                    <Chip
                      key={index}
                      label={day}
                      onClick={() => handleRotaDayToggle(index)}
                      color={currentPattern.five_week_rotor?.days_of_week?.includes(index) ? 'primary' : 'default'}
                      variant={currentPattern.five_week_rotor?.days_of_week?.includes(index) ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Select one or more days (e.g., Mon, Wed, Fri)
                </Typography>
              </Grid>

              {currentPattern.five_week_rotor?.weeks?.length > 0 &&
                currentPattern.five_week_rotor?.days_of_week?.length > 0 && (
                <Grid item xs={12}>
                  <Alert severity="success">
                    <strong>Example:</strong> This will book on{' '}
                    {currentPattern.five_week_rotor.days_of_week.map(d => fullDayNames[d]).join(', ')}{' '}
                    during weeks {currentPattern.five_week_rotor.weeks.join(', ')} of every 5-week cycle
                  </Alert>
                </Grid>
              )}

              {(!currentPattern.five_week_rotor?.weeks || currentPattern.five_week_rotor.weeks.length === 0) && (
                <Grid item xs={12}>
                  <Alert severity="warning">Please select at least one rota week</Alert>
                </Grid>
              )}

              {(!currentPattern.five_week_rotor?.days_of_week || currentPattern.five_week_rotor.days_of_week.length === 0) && (
                <Grid item xs={12}>
                  <Alert severity="warning">Please select at least one day of the week</Alert>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default RecurrencePattern;
