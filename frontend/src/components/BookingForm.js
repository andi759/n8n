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
  FormControlLabel,
  Checkbox,
  FormGroup,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { createBooking } from '../services/bookingService';
import { getAllRooms } from '../services/roomService';
import { getAllClinics } from '../services/clinicService';
import { getAllSpecialties } from '../services/specialtyService';
import { formatDate } from '../utils/rotorHelper';

const SESSION_OPTIONS = [
  { value: 'all_day', label: 'All Day' },
  { value: 'am', label: 'AM' },
  { value: 'pm', label: 'PM' },
];

function BookingForm() {
  const navigate = useNavigate();
  const [clinics, setClinics] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [formData, setFormData] = useState({
    clinic_id: '',
    room_id: '',
    booking_date: new Date(),
    session: 'all_day',
    specialty: '',
    clinic_code: '',
    doctor_name: '',
    notes: '',
    color: '#1976d2',
    is_ad_hoc: false,
    is_room_swap: false,
    is_over_4_weeks: false,
    is_under_4_weeks: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClinics();
    loadSpecialties();
  }, []);

  const loadSpecialties = async () => {
    try {
      const data = await getAllSpecialties();
      setSpecialties(data);
    } catch (error) {
      console.error('Failed to load specialties:', error);
    }
  };

  const handleSpecialtyChange = (specialtyId) => {
    const selectedSpecialty = specialties.find(s => s.id === parseInt(specialtyId));
    if (selectedSpecialty) {
      setFormData(prev => ({
        ...prev,
        specialty: selectedSpecialty.name,
        color: selectedSpecialty.color,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        specialty: '',
      }));
    }
  };

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

  const handleCheckboxChange = (field) => (event) => {
    setFormData(prev => ({ ...prev, [field]: event.target.checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const bookingData = {
        ...formData,
        booking_date: formatDate(formData.booking_date),
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
          Book a room for a single date
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

              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Booking Date"
                  value={formData.booking_date}
                  onChange={(newDate) => handleChange('booking_date', newDate)}
                  format="dd/MM/yyyy"
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Session"
                  fullWidth
                  required
                  value={formData.session}
                  onChange={(e) => handleChange('session', e.target.value)}
                >
                  {SESSION_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Specialty"
                  fullWidth
                  value={specialties.find(s => s.name === formData.specialty)?.id || ''}
                  onChange={(e) => handleSpecialtyChange(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Select Specialty</em>
                  </MenuItem>
                  {specialties.map((specialty) => (
                    <MenuItem key={specialty.id} value={specialty.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '2px',
                            backgroundColor: specialty.color,
                          }}
                        />
                        {specialty.name}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
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
                <TextField
                  label="Doctor Name"
                  fullWidth
                  value={formData.doctor_name}
                  onChange={(e) => handleChange('doctor_name', e.target.value)}
                  placeholder="e.g., Dr. Smith"
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
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Booking Type (for reporting)
                </Typography>
                <FormGroup row>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.is_ad_hoc}
                        onChange={handleCheckboxChange('is_ad_hoc')}
                      />
                    }
                    label="Ad hoc room"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.is_room_swap}
                        onChange={handleCheckboxChange('is_room_swap')}
                      />
                    }
                    label="Room swap"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.is_over_4_weeks}
                        onChange={handleCheckboxChange('is_over_4_weeks')}
                      />
                    }
                    label="Over 4 weeks"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.is_under_4_weeks}
                        onChange={handleCheckboxChange('is_under_4_weeks')}
                      />
                    }
                    label="Less than 4 weeks"
                  />
                </FormGroup>
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
