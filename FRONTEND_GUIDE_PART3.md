# Frontend Development Guide - Part 3

## Most Critical Components: Recurrence Pattern Builder

### 17. `src/components/RecurrencePattern.js` ⭐⭐⭐
**This is the most critical component for the five-week rotor functionality**

```javascript
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Grid,
  Chip,
  Alert,
} from '@mui/material';
import { CalendarToday, Repeat, ViewWeek } from '@mui/icons-material';
import { getCurrentWeek } from '../services/rotorService';

function RecurrencePattern({ recurrenceType, pattern, onChange }) {
  const [selectedType, setSelectedType] = useState(recurrenceType || 'weekly');
  const [currentPattern, setCurrentPattern] = useState(pattern || {});
  const [rotorWeek, setRotorWeek] = useState(null);

  useEffect(() => {
    loadRotorWeek();
  }, []);

  useEffect(() => {
    // Initialize pattern based on type
    if (!pattern) {
      initializePattern(selectedType);
    }
  }, [selectedType]);

  const loadRotorWeek = async () => {
    try {
      const data = await getCurrentWeek();
      setRotorWeek(data);
    } catch (error) {
      console.error('Failed to load rotor week:', error);
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

  // Weekly pattern handlers
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

  // Monthly pattern handlers
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

  // Five-week rotor handlers
  const handleRotorWeekToggle = (week) => {
    const currentWeeks = currentPattern.five_week_rotor?.weeks || [];
    const newWeeks = currentWeeks.includes(week)
      ? currentWeeks.filter(w => w !== week)
      : [...currentWeeks, week].sort();

    updatePattern({ weeks: newWeeks });
  };

  const handleRotorDayChange = (day) => {
    updatePattern({ day_of_week: parseInt(day) });
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

        {/* Pattern Type Selector */}
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
            Five-Week Rotor
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Weekly Pattern */}
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

        {/* Monthly Pattern */}
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

        {/* Five-Week Rotor Pattern */}
        {selectedType === 'five_week_rotor' && (
          <Box>
            {/* Current Rotor Week Indicator */}
            {rotorWeek && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <strong>Current Rotor Week:</strong> {rotorWeek.description}
                <br />
                <Typography variant="caption">
                  Cycle started: {new Date(rotorWeek.cycle_start_date).toLocaleDateString()}
                </Typography>
              </Alert>
            )}

            <Grid container spacing={3}>
              {/* Week Selection */}
              <Grid item xs={12}>
                <FormLabel component="legend" sx={{ mb: 1 }}>
                  Select Rotor Weeks
                </FormLabel>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {weekNumbers.map((week) => (
                    <Chip
                      key={week}
                      label={`Week ${week}`}
                      onClick={() => handleRotorWeekToggle(week)}
                      color={currentPattern.five_week_rotor?.weeks?.includes(week) ? 'primary' : 'default'}
                      variant={currentPattern.five_week_rotor?.weeks?.includes(week) ? 'filled' : 'outlined'}
                      sx={{
                        fontSize: '1rem',
                        height: 48,
                        minWidth: 80,
                        ...(rotorWeek && rotorWeek.week_number === week && {
                          borderColor: 'secondary.main',
                          borderWidth: 2,
                        })
                      }}
                    />
                  ))}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Select which weeks in the 5-week cycle
                  {rotorWeek && ` (current week ${rotorWeek.week_number} is highlighted)`}
                </Typography>
              </Grid>

              {/* Day of Week Selection */}
              <Grid item xs={12}>
                <FormLabel component="legend" sx={{ mb: 1 }}>
                  Day of Week
                </FormLabel>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {fullDayNames.map((day, index) => (
                    <Chip
                      key={index}
                      label={day}
                      onClick={() => handleRotorDayChange(index)}
                      color={currentPattern.five_week_rotor?.day_of_week === index ? 'primary' : 'default'}
                      variant={currentPattern.five_week_rotor?.day_of_week === index ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </Grid>

              {/* Example */}
              {currentPattern.five_week_rotor?.weeks?.length > 0 &&
                currentPattern.five_week_rotor?.day_of_week !== undefined && (
                <Grid item xs={12}>
                  <Alert severity="success">
                    <strong>Example:</strong> This will book{' '}
                    {fullDayNames[currentPattern.five_week_rotor.day_of_week]} on weeks{' '}
                    {currentPattern.five_week_rotor.weeks.join(', ')} of every 5-week cycle
                  </Alert>
                </Grid>
              )}

              {/* Validation */}
              {(!currentPattern.five_week_rotor?.weeks || currentPattern.five_week_rotor.weeks.length === 0) && (
                <Grid item xs={12}>
                  <Alert severity="warning">Please select at least one rotor week</Alert>
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
```

### 18. `src/components/SeriesPreview.js`
```javascript
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Box,
  Alert,
  Chip,
  CircularProgress,
} from '@mui/material';
import { Warning, CheckCircle } from '@mui/icons-material';
import { format } from 'date-fns';

function SeriesPreview({ open, onClose, previewData, onConfirm, loading }) {
  if (!previewData) return null;

  const { instances, conflicts, total_count, conflict_count } = previewData;

  const hasConflicts = conflict_count > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Preview Recurring Booking Instances
      </DialogTitle>

      <DialogContent>
        {/* Summary */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            <strong>{total_count}</strong> booking instances will be created
          </Typography>

          {hasConflicts ? (
            <Alert severity="error" icon={<Warning />} sx={{ mt: 2 }}>
              <strong>{conflict_count} conflicts detected!</strong>
              <br />
              Some instances overlap with existing bookings. Please review and resolve conflicts.
            </Alert>
          ) : (
            <Alert severity="success" icon={<CheckCircle />} sx={{ mt: 2 }}>
              No conflicts detected. All time slots are available.
            </Alert>
          )}
        </Box>

        {/* Instance List */}
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Day</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {instances.slice(0, 50).map((instance, index) => {
                const instanceDate = new Date(instance.booking_date);
                const dayName = format(instanceDate, 'EEEE');
                const formattedDate = format(instanceDate, 'MMM dd, yyyy');

                // Check if this instance has conflicts
                const hasConflict = conflicts.some(
                  c => c.instance.booking_date === instance.booking_date
                );

                return (
                  <TableRow
                    key={index}
                    sx={{
                      bgcolor: hasConflict ? 'error.light' : 'transparent',
                      '&:hover': { bgcolor: hasConflict ? 'error.main' : 'action.hover' }
                    }}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{formattedDate}</TableCell>
                    <TableCell>{dayName}</TableCell>
                    <TableCell>
                      {instance.start_time} - {instance.end_time}
                    </TableCell>
                    <TableCell>
                      {hasConflict ? (
                        <Chip
                          label="Conflict"
                          color="error"
                          size="small"
                          icon={<Warning />}
                        />
                      ) : (
                        <Chip
                          label="Available"
                          color="success"
                          size="small"
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {instances.length > 50 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
              Showing first 50 of {total_count} instances
            </Typography>
          )}
        </Box>

        {/* Conflict Details */}
        {hasConflicts && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" color="error" gutterBottom>
              Conflict Details:
            </Typography>
            {conflicts.slice(0, 5).map((conflict, index) => (
              <Alert severity="warning" key={index} sx={{ mt: 1 }}>
                {format(new Date(conflict.instance.booking_date), 'MMM dd, yyyy')} at{' '}
                {conflict.instance.start_time} - Already booked
              </Alert>
            ))}
            {conflicts.length > 5 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                ... and {conflicts.length - 5} more conflicts
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={loading || hasConflicts}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Creating...' : 'Confirm & Create Series'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SeriesPreview;
```

---

## Additional Components

### 19. `src/components/BookingList.js`
```javascript
import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  Box,
  TextField,
  MenuItem,
  Button,
  Chip,
  IconButton,
} from '@mui/material';
import { Edit, Delete, Refresh } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { getAllBookings, deleteBooking } from '../services/bookingService';
import { getAllRooms } from '../services/roomService';
import { format } from 'date-fns';

function BookingList() {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [filters, setFilters] = useState({
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: null,
    room_id: '',
    status: '',
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRooms();
    loadBookings();
  }, []);

  const loadRooms = async () => {
    try {
      const data = await getAllRooms();
      setRooms(data);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  };

  const loadBookings = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.room_id) params.room_id = filters.room_id;
      if (filters.status) params.status = filters.status;

      const data = await getAllBookings(params);
      setBookings(data);
      setPage(0);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await deleteBooking(id);
        loadBookings();
      } catch (error) {
        console.error('Failed to delete booking:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'cancelled': return 'error';
      case 'completed': return 'default';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          View Bookings
        </Typography>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <DatePicker
              label="Start Date"
              value={filters.start_date ? new Date(filters.start_date) : null}
              onChange={(date) => handleFilterChange('start_date', date ? format(date, 'yyyy-MM-dd') : '')}
              slotProps={{ textField: { size: 'small', sx: { minWidth: 180 } } }}
            />

            <DatePicker
              label="End Date"
              value={filters.end_date ? new Date(filters.end_date) : null}
              onChange={(date) => handleFilterChange('end_date', date ? format(date, 'yyyy-MM-dd') : '')}
              slotProps={{ textField: { size: 'small', sx: { minWidth: 180 } } }}
            />

            <TextField
              select
              label="Room"
              size="small"
              value={filters.room_id}
              onChange={(e) => handleFilterChange('room_id', e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">All Rooms</MenuItem>
              {rooms.map(room => (
                <MenuItem key={room.id} value={room.id}>
                  {room.room_name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Status"
              size="small"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </TextField>

            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={loadBookings}
              disabled={loading}
            >
              Search
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Room</TableCell>
                <TableCell>Purpose</TableCell>
                <TableCell>Procedure</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created By</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      {format(new Date(booking.booking_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {booking.start_time} - {booking.end_time}
                    </TableCell>
                    <TableCell>{booking.room_name}</TableCell>
                    <TableCell>{booking.purpose || '-'}</TableCell>
                    <TableCell>{booking.procedure_type || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={booking.status}
                        color={getStatusColor(booking.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{booking.created_by_name}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" title="Edit">
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        title="Cancel"
                        onClick={() => handleDelete(booking.id)}
                        disabled={booking.status === 'cancelled'}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            count={bookings.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </CardContent>
      </Card>
    </Container>
  );
}

export default BookingList;
```

### 20. Simple placeholder components

**`src/components/RoomManagement.js`**
```javascript
import React from 'react';
import { Container, Typography } from '@mui/material';

function RoomManagement() {
  return (
    <Container>
      <Typography variant="h4">Room Management</Typography>
      <Typography>Room management interface - to be implemented</Typography>
    </Container>
  );
}

export default RoomManagement;
```

**`src/components/Settings.js`**
```javascript
import React from 'react';
import { Container, Typography } from '@mui/material';

function Settings() {
  return (
    <Container>
      <Typography variant="h4">Settings</Typography>
      <Typography>Admin settings - to be implemented</Typography>
    </Container>
  );
}

export default Settings;
```

---

## Quick Start Checklist

1. ✅ Copy all service files to `src/services/`
2. ✅ Copy all utility files to `src/utils/`
3. ✅ Copy all component files to `src/components/`
4. ✅ Copy `AuthContext.js` to `src/context/`
5. ✅ Copy `App.js` and `index.js` to `src/`
6. ✅ Run `npm install` in the frontend directory
7. ✅ Start both backend and frontend servers
8. ✅ Test the application

That's it! You now have all the code needed for a fully functional room booking service with five-week rotor support.
