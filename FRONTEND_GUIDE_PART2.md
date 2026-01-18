# Frontend Development Guide - Part 2

## Booking Components (Continued)

### 14. `src/components/Dashboard.js`
```javascript
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { Add, EventRepeat } from '@mui/icons-material';
import { getAllBookings } from '../services/bookingService';
import { getCurrentWeek } from '../services/rotorService';
import { format } from 'date-fns';

function Dashboard() {
  const navigate = useNavigate();
  const [todayBookings, setTodayBookings] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [rotorWeek, setRotorWeek] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const nextWeek = format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

      const [bookings, rotor] = await Promise.all([
        getAllBookings({ start_date: today, end_date: nextWeek }),
        getCurrentWeek(),
      ]);

      const todayList = bookings.filter(b => b.booking_date === today);
      const upcomingList = bookings.filter(b => b.booking_date > today);

      setTodayBookings(todayList);
      setUpcomingBookings(upcomingList.slice(0, 10));
      setRotorWeek(rotor);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome to the Room Booking Service
        </Typography>
      </Box>

      {/* Rotor Week Card */}
      {rotorWeek && (
        <Card sx={{ mb: 3, bgcolor: 'primary.main', color: 'white' }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Current Rotor Week
            </Typography>
            <Typography variant="h3">
              {rotorWeek.description}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
              Cycle started: {format(new Date(rotorWeek.cycle_start_date), 'MMM dd, yyyy')}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Create One-Time Booking
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Book a room for a single date and time
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/new-booking')}
                fullWidth
              >
                New Booking
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Create Recurring Booking
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Set up weekly, monthly, or rotor-based recurring bookings
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<EventRepeat />}
                onClick={() => navigate('/new-recurring')}
                fullWidth
              >
                New Recurring Booking
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Today's Bookings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Today's Bookings ({todayBookings.length})
          </Typography>
          {todayBookings.length === 0 ? (
            <Typography color="text.secondary">No bookings for today</Typography>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Room</TableCell>
                  <TableCell>Purpose</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {todayBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.start_time} - {booking.end_time}</TableCell>
                    <TableCell>{booking.room_name}</TableCell>
                    <TableCell>{booking.purpose || '-'}</TableCell>
                    <TableCell>
                      <Typography
                        variant="caption"
                        sx={{
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          bgcolor: booking.status === 'confirmed' ? 'success.light' : 'grey.300',
                        }}
                      >
                        {booking.status}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Bookings */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Upcoming Bookings (Next 7 Days)
          </Typography>
          {upcomingBookings.length === 0 ? (
            <Typography color="text.secondary">No upcoming bookings</Typography>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Room</TableCell>
                  <TableCell>Purpose</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {upcomingBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{format(new Date(booking.booking_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{booking.start_time} - {booking.end_time}</TableCell>
                    <TableCell>{booking.room_name}</TableCell>
                    <TableCell>{booking.purpose || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}

export default Dashboard;
```

### 15. `src/components/BookingForm.js` (One-Time Booking)
```javascript
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Box,
  Alert,
  Snackbar,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { createBooking } from '../services/bookingService';
import { getAllRooms } from '../services/roomService';
import { formatDate, formatTime } from '../utils/rotorHelper';

function BookingForm() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState({
    room_id: '',
    booking_date: new Date(),
    start_time: '09:00',
    end_time: '10:00',
    purpose: '',
    procedure_type: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const data = await getAllRooms({ is_active: 'true' });
      setRooms(data);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateDuration = () => {
    const [startHour, startMin] = formData.start_time.split(':').map(Number);
    const [endHour, endMin] = formData.end_time.split(':').map(Number);
    return (endHour * 60 + endMin) - (startHour * 60 + startMin);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const duration = calculateDuration();

      if (duration <= 0) {
        setError('End time must be after start time');
        setLoading(false);
        return;
      }

      const bookingData = {
        ...formData,
        booking_date: formatDate(formData.booking_date),
        duration_minutes: duration,
      };

      await createBooking(bookingData);
      setSuccess(true);

      setTimeout(() => {
        navigate('/bookings');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Create One-Time Booking
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Book a room for a single date and time
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Room Selection */}
              <Grid item xs={12}>
                <TextField
                  select
                  label="Room"
                  fullWidth
                  required
                  value={formData.room_id}
                  onChange={(e) => handleChange('room_id', e.target.value)}
                >
                  {rooms.map((room) => (
                    <MenuItem key={room.id} value={room.id}>
                      {room.room_name} ({room.room_number})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Date */}
              <Grid item xs={12} md={4}>
                <DatePicker
                  label="Booking Date"
                  value={formData.booking_date}
                  onChange={(newDate) => handleChange('booking_date', newDate)}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </Grid>

              {/* Start Time */}
              <Grid item xs={12} md={4}>
                <TextField
                  label="Start Time"
                  type="time"
                  fullWidth
                  required
                  value={formData.start_time}
                  onChange={(e) => handleChange('start_time', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* End Time */}
              <Grid item xs={12} md={4}>
                <TextField
                  label="End Time"
                  type="time"
                  fullWidth
                  required
                  value={formData.end_time}
                  onChange={(e) => handleChange('end_time', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Purpose */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Purpose"
                  fullWidth
                  value={formData.purpose}
                  onChange={(e) => handleChange('purpose', e.target.value)}
                  placeholder="e.g., Patient Consultation"
                />
              </Grid>

              {/* Procedure Type */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Procedure Type"
                  fullWidth
                  value={formData.procedure_type}
                  onChange={(e) => handleChange('procedure_type', e.target.value)}
                  placeholder="e.g., General Checkup"
                />
              </Grid>

              {/* Notes */}
              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Additional notes or special requirements"
                />
              </Grid>

              {/* Error Display */}
              {error && (
                <Grid item xs={12}>
                  <Alert severity="error">{error}</Alert>
                </Grid>
              )}

              {/* Actions */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/bookings')}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Booking'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      <Snackbar
        open={success}
        autoHideDuration={2000}
        message="Booking created successfully!"
      />
    </Container>
  );
}

export default BookingForm;
```

---

## Recurring Booking Components ⭐ (Most Critical)

### 16. `src/components/RecurringBookingForm.js`
```javascript
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Box,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import RecurrencePattern from './RecurrencePattern';
import SeriesPreview from './SeriesPreview';
import { previewSeries, createSeries } from '../services/seriesService';
import { getAllRooms } from '../services/roomService';
import { formatDate } from '../utils/rotorHelper';
import { getRecurrenceDescription } from '../utils/recurrenceHelper';

function RecurringBookingForm() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState({
    room_id: '',
    series_name: '',
    start_time: '09:00',
    end_time: '10:00',
    purpose: '',
    procedure_type: '',
    notes: '',
    recurrence_type: 'weekly',
    recurrence_pattern: null,
    series_start_date: new Date(),
    series_end_date: null,
  });
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const data = await getAllRooms({ is_active: 'true' });
      setRooms(data);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePatternChange = (recurrenceType, pattern) => {
    setFormData(prev => ({
      ...prev,
      recurrence_type: recurrenceType,
      recurrence_pattern: pattern,
    }));
  };

  const calculateDuration = () => {
    const [startHour, startMin] = formData.start_time.split(':').map(Number);
    const [endHour, endMin] = formData.end_time.split(':').map(Number);
    return (endHour * 60 + endMin) - (startHour * 60 + startMin);
  };

  const handlePreview = async () => {
    setError('');

    try {
      const duration = calculateDuration();

      if (duration <= 0) {
        setError('End time must be after start time');
        return;
      }

      if (!formData.recurrence_pattern) {
        setError('Please configure the recurrence pattern');
        return;
      }

      const seriesData = {
        ...formData,
        series_start_date: formatDate(formData.series_start_date),
        series_end_date: formData.series_end_date ? formatDate(formData.series_end_date) : null,
        duration_minutes: duration,
      };

      const preview = await previewSeries(seriesData);
      setPreviewData(preview);
      setShowPreview(true);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to generate preview');
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    setError('');

    try {
      const duration = calculateDuration();

      const seriesData = {
        ...formData,
        series_start_date: formatDate(formData.series_start_date),
        series_end_date: formData.series_end_date ? formatDate(formData.series_end_date) : null,
        duration_minutes: duration,
      };

      await createSeries(seriesData);
      setShowPreview(false);
      setSuccess(true);

      setTimeout(() => {
        navigate('/bookings');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create booking series');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Create Recurring Booking
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Set up weekly, monthly, or five-week rotor recurring bookings
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Grid container spacing={3}>
            {/* Series Name */}
            <Grid item xs={12}>
              <TextField
                label="Series Name (Optional)"
                fullWidth
                value={formData.series_name}
                onChange={(e) => handleChange('series_name', e.target.value)}
                placeholder="e.g., Dr. Smith Weekly Consultations"
                helperText="Give this recurring booking a descriptive name"
              />
            </Grid>

            {/* Room Selection */}
            <Grid item xs={12}>
              <TextField
                select
                label="Room"
                fullWidth
                required
                value={formData.room_id}
                onChange={(e) => handleChange('room_id', e.target.value)}
              >
                {rooms.map((room) => (
                  <MenuItem key={room.id} value={room.id}>
                    {room.room_name} ({room.room_number})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Start Time */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Start Time"
                type="time"
                fullWidth
                required
                value={formData.start_time}
                onChange={(e) => handleChange('start_time', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* End Time */}
            <Grid item xs={12} md={6}>
              <TextField
                label="End Time"
                type="time"
                fullWidth
                required
                value={formData.end_time}
                onChange={(e) => handleChange('end_time', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Purpose */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Purpose"
                fullWidth
                value={formData.purpose}
                onChange={(e) => handleChange('purpose', e.target.value)}
                placeholder="e.g., Weekly Consultation"
              />
            </Grid>

            {/* Procedure Type */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Procedure Type"
                fullWidth
                value={formData.procedure_type}
                onChange={(e) => handleChange('procedure_type', e.target.value)}
                placeholder="e.g., Follow-up Appointment"
              />
            </Grid>

            {/* Series Start Date */}
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Series Start Date"
                value={formData.series_start_date}
                onChange={(newDate) => handleChange('series_start_date', newDate)}
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
            </Grid>

            {/* Series End Date */}
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Series End Date (Optional)"
                value={formData.series_end_date}
                onChange={(newDate) => handleChange('series_end_date', newDate)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    helperText: 'Leave blank for indefinite series'
                  }
                }}
              />
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                label="Notes"
                fullWidth
                multiline
                rows={2}
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Additional notes for this recurring series"
              />
            </Grid>

            {/* Recurrence Pattern Builder */}
            <Grid item xs={12}>
              <RecurrencePattern
                recurrenceType={formData.recurrence_type}
                pattern={formData.recurrence_pattern}
                onChange={handlePatternChange}
              />
            </Grid>

            {/* Pattern Description */}
            {formData.recurrence_pattern && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <strong>Pattern:</strong>{' '}
                  {getRecurrenceDescription(formData.recurrence_type, formData.recurrence_pattern)}
                </Alert>
              </Grid>
            )}

            {/* Error Display */}
            {error && (
              <Grid item xs={12}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            )}

            {/* Actions */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/bookings')}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handlePreview}
                  disabled={!formData.room_id || !formData.recurrence_pattern}
                >
                  Preview Instances
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <SeriesPreview
        open={showPreview}
        onClose={() => setShowPreview(false)}
        previewData={previewData}
        onConfirm={handleCreate}
        loading={loading}
      />

      <Snackbar
        open={success}
        autoHideDuration={2000}
        message="Recurring booking series created successfully!"
      />
    </Container>
  );
}

export default RecurringBookingForm;
```

---

*Continued with RecurrencePattern and SeriesPreview components in next part...*
