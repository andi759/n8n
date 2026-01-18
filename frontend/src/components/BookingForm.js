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
import { getAllClinics } from '../services/clinicService';
import { formatDate } from '../utils/rotorHelper';

function BookingForm() {
  const navigate = useNavigate();
  const [clinics, setClinics] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState({
    clinic_id: '',
    room_id: '',
    booking_date: new Date(),
    start_time: '09:00',
    end_time: '10:00',
    specialty: '',
    clinic_code: '',
    notes: '',
    color: '#1976d2',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClinics();
  }, []);

  useEffect(() => {
    if (formData.clinic_id) {
      loadRooms(formData.clinic_id);
    } else {
      setRooms([]);
      setFormData(prev => ({ ...prev, room_id: '' }));
    }
  }, [formData.clinic_id]);

  const loadClinics = async () => {
    try {
      const data = await getAllClinics(true);
      setClinics(data);
    } catch (error) {
      console.error('Failed to load clinics:', error);
    }
  };

  const loadRooms = async (clinicId) => {
    try {
      const data = await getAllRooms({ clinic_id: clinicId, is_active: 'true' });
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
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Clinic"
                  fullWidth
                  required
                  value={formData.clinic_id}
                  onChange={(e) => handleChange('clinic_id', e.target.value)}
                >
                  {clinics.map((clinic) => (
                    <MenuItem key={clinic.id} value={clinic.id}>
                      {clinic.clinic_name} ({clinic.clinic_code})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Room"
                  fullWidth
                  required
                  value={formData.room_id}
                  onChange={(e) => handleChange('room_id', e.target.value)}
                  disabled={!formData.clinic_id}
                  helperText={!formData.clinic_id ? 'Please select a clinic first' : ''}
                >
                  {rooms.map((room) => (
                    <MenuItem key={room.id} value={room.id}>
                      {room.room_name} ({room.room_number})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <DatePicker
                  label="Booking Date"
                  value={formData.booking_date}
                  onChange={(newDate) => handleChange('booking_date', newDate)}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </Grid>

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

              <Grid item xs={12} md={6}>
                <TextField
                  label="Specialty"
                  fullWidth
                  value={formData.specialty}
                  onChange={(e) => handleChange('specialty', e.target.value)}
                  placeholder="e.g., Cardiology, Neurology"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Clinic Code"
                  fullWidth
                  value={formData.clinic_code}
                  onChange={(e) => handleChange('clinic_code', e.target.value)}
                  placeholder="e.g., Department or service code"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Booking Color
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => handleChange('color', e.target.value)}
                      style={{
                        width: '60px',
                        height: '40px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    />
                    <TextField
                      value={formData.color}
                      onChange={(e) => handleChange('color', e.target.value)}
                      size="small"
                      sx={{ width: '120px' }}
                      placeholder="#1976d2"
                    />
                  </Box>
                </Box>
              </Grid>

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

              {error && (
                <Grid item xs={12}>
                  <Alert severity="error">{error}</Alert>
                </Grid>
              )}

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
