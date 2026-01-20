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
import RecurrencePattern from './RecurrencePattern';
import SeriesPreview from './SeriesPreview';
import { previewSeries, createSeries } from '../services/seriesService';
import { getAllRooms } from '../services/roomService';
import { getAllClinics } from '../services/clinicService';
import { getAllSpecialties } from '../services/specialtyService';
import { formatDate } from '../utils/rotorHelper';
import { getRecurrenceDescription } from '../utils/recurrenceHelper';

function RecurringBookingForm() {
  const navigate = useNavigate();
  const [clinics, setClinics] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [formData, setFormData] = useState({
    clinic_id: '',
    room_id: '',
    series_name: '',
    start_time: '09:00',
    end_time: '10:00',
    specialty: '',
    clinic_code: '',
    doctor_name: '',
    notes: '',
    color: '#1976d2',
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
    loadClinics();
    loadSpecialties();
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

  const handleCreate = async (excludedDates = []) => {
    setLoading(true);
    setError('');

    try {
      const duration = calculateDuration();

      const seriesData = {
        ...formData,
        series_start_date: formatDate(formData.series_start_date),
        series_end_date: formData.series_end_date ? formatDate(formData.series_end_date) : null,
        duration_minutes: duration,
        excluded_dates: excludedDates,  // Pass excluded dates to backend
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
          Set up weekly, monthly, or five-week rota recurring bookings
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Grid container spacing={3}>
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

            <Grid item xs={12} md={6}>
              <DatePicker
                label="Series Start Date"
                value={formData.series_start_date}
                onChange={(newDate) => handleChange('series_start_date', newDate)}
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
            </Grid>

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

            <Grid item xs={12}>
              <RecurrencePattern
                recurrenceType={formData.recurrence_type}
                pattern={formData.recurrence_pattern}
                onChange={handlePatternChange}
              />
            </Grid>

            {formData.recurrence_pattern && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <strong>Pattern:</strong>{' '}
                  {getRecurrenceDescription(formData.recurrence_type, formData.recurrence_pattern)}
                </Alert>
              </Grid>
            )}

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
