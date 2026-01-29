import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  MenuItem,
  Button,
  FormControlLabel,
  Checkbox,
  Paper,
} from '@mui/material';
import {
  Today,
} from '@mui/icons-material';
import { getAllBookings } from '../services/bookingService';
import { getAllRooms } from '../services/roomService';
import { getAllClinics } from '../services/clinicService';
import { getAllSpecialties } from '../services/specialtyService';
import {
  format,
  addDays,
  subDays,
} from 'date-fns';

// Time slots from 08:00 to 17:30 in 30-min increments
const TIME_SLOTS = [];
for (let h = 8; h <= 17; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}

const ROW_HEIGHT = 30; // px per 30-min slot

// Convert time string "HH:MM" to slot index
const timeToSlotIndex = (time) => {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return (h - 8) * 2 + (m >= 30 ? 1 : 0);
};

// Helper function to format session display
const getSessionLabel = (session) => {
  switch (session) {
    case 'am': return 'AM';
    case 'pm': return 'PM';
    case 'all_day': return 'All Day';
    default: return session || '-';
  }
};

function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    clinic_id: '',
    room_id: '',
    specialty: '',
    includeCancelled: false,
  });

  useEffect(() => {
    loadClinics();
    loadRooms();
    loadSpecialties();
  }, []);

  useEffect(() => {
    loadBookings();
  }, [currentDate, filters]);

  useEffect(() => {
    if (filters.clinic_id) {
      const filteredRooms = allRooms.filter(r => r.clinic_id === parseInt(filters.clinic_id));
      setRooms(filteredRooms);
      if (!filteredRooms.find(r => r.id === parseInt(filters.room_id))) {
        setFilters(prev => ({ ...prev, room_id: '' }));
      }
    } else {
      setRooms(allRooms);
    }
  }, [filters.clinic_id, allRooms]);

  const loadClinics = async () => {
    try {
      const data = await getAllClinics();
      setClinics(data);
    } catch (error) {
      console.error('Failed to load clinics:', error);
    }
  };

  const loadRooms = async () => {
    try {
      const data = await getAllRooms();
      setAllRooms(data);
      setRooms(data);
    } catch (error) {
      console.error('Failed to load rooms:', error);
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

  const dateRange = useMemo(() => {
    return { start: currentDate, end: currentDate };
  }, [currentDate]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const params = {
        start_date: format(dateRange.start, 'yyyy-MM-dd'),
        end_date: format(dateRange.end, 'yyyy-MM-dd'),
      };
      if (filters.clinic_id) params.clinic_id = filters.clinic_id;
      if (filters.room_id) params.room_id = filters.room_id;
      if (filters.specialty) params.specialty = filters.specialty;
      if (!filters.includeCancelled) params.status = 'confirmed';

      const data = await getAllBookings(params);
      setBookings(data);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handlePrevious = () => {
    setCurrentDate(prev => subDays(prev, 1));
  };

  const handleNext = () => {
    setCurrentDate(prev => addDays(prev, 1));
  };

  const handleToday = () => setCurrentDate(new Date());

  const getViewTitle = () => {
    return format(currentDate, 'EEEE dd MMMM yyyy');
  };

  // Get rooms to display for the day view
  const getDisplayRooms = () => {
    if (filters.room_id) {
      return rooms.filter(r => r.id === parseInt(filters.room_id));
    }
    if (filters.clinic_id) {
      return rooms.sort((a, b) => a.room_number.localeCompare(b.room_number));
    }
    // No filter: show rooms that have bookings
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const dayBookings = bookings.filter(b => b.booking_date === dateStr);
    const bookedRoomIds = new Set(dayBookings.map(b => b.room_id));
    return allRooms
      .filter(r => bookedRoomIds.has(r.id))
      .sort((a, b) => {
        if (a.clinic_name !== b.clinic_name) return a.clinic_name.localeCompare(b.clinic_name);
        return a.room_number.localeCompare(b.room_number);
      });
  };

  // Render the day view with time slots and room columns
  const renderDayView = () => {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const dayBookings = bookings.filter(b => b.booking_date === dateStr);
    const displayRooms = getDisplayRooms();

    if (displayRooms.length === 0 && dayBookings.length === 0) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">No bookings for this day</Typography>
        </Box>
      );
    }

    const totalHeight = TIME_SLOTS.length * ROW_HEIGHT;
    const timeColWidth = 60;
    const roomColWidth = 160;

    return (
      <Box sx={{ overflowX: 'auto' }}>
        <Box sx={{ display: 'flex', minWidth: timeColWidth + displayRooms.length * roomColWidth }}>
          {/* Time column header */}
          <Box sx={{ width: timeColWidth, minWidth: timeColWidth, flexShrink: 0 }} />

          {/* Room headers */}
          {displayRooms.map(room => (
            <Box
              key={room.id}
              sx={{
                width: roomColWidth,
                minWidth: roomColWidth,
                flexShrink: 0,
                textAlign: 'center',
                p: 1,
                borderBottom: '2px solid #9c27b0',
                borderLeft: '1px solid #e0e0e0',
                backgroundColor: '#f3e5f5',
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#6a1b9a' }}>
                {room.room_name}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Time grid */}
        <Box sx={{ display: 'flex', minWidth: timeColWidth + displayRooms.length * roomColWidth }}>
          {/* Time labels */}
          <Box sx={{ width: timeColWidth, minWidth: timeColWidth, flexShrink: 0, position: 'relative', height: totalHeight }}>
            {TIME_SLOTS.map((time, idx) => (
              <Box
                key={time}
                sx={{
                  position: 'absolute',
                  top: idx * ROW_HEIGHT,
                  height: ROW_HEIGHT,
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  pr: 1,
                  borderBottom: '1px solid #f0f0f0',
                  fontSize: '0.75rem',
                  color: '#666',
                  fontWeight: time.endsWith(':00') ? 'bold' : 'normal',
                }}
              >
                {time}
              </Box>
            ))}
          </Box>

          {/* Room columns */}
          {displayRooms.map(room => {
            const roomBookings = dayBookings.filter(b => b.room_id === room.id);

            return (
              <Box
                key={room.id}
                sx={{
                  width: roomColWidth,
                  minWidth: roomColWidth,
                  flexShrink: 0,
                  position: 'relative',
                  height: totalHeight,
                  borderLeft: '1px solid #e0e0e0',
                }}
              >
                {/* Grid lines */}
                {TIME_SLOTS.map((time, idx) => (
                  <Box
                    key={time}
                    sx={{
                      position: 'absolute',
                      top: idx * ROW_HEIGHT,
                      height: ROW_HEIGHT,
                      width: '100%',
                      borderBottom: time.endsWith(':00') ? '1px solid #e0e0e0' : '1px solid #f5f5f5',
                    }}
                  />
                ))}

                {/* Booking blocks */}
                {roomBookings.map(booking => {
                  const startIdx = timeToSlotIndex(booking.start_time);
                  const endIdx = timeToSlotIndex(booking.end_time);
                  const spanSlots = Math.max(endIdx - startIdx, 1);
                  const top = startIdx * ROW_HEIGHT;
                  const height = spanSlots * ROW_HEIGHT;
                  const isCancelled = booking.status === 'cancelled';
                  const bgColor = isCancelled ? '#bdbdbd' : (booking.color || '#1976d2');

                  return (
                    <Paper
                      key={booking.id}
                      elevation={1}
                      sx={{
                        position: 'absolute',
                        top: top + 1,
                        left: 2,
                        right: 2,
                        height: height - 2,
                        backgroundColor: bgColor,
                        color: 'white',
                        opacity: isCancelled ? 0.7 : 1,
                        borderRadius: 1,
                        p: 0.75,
                        overflow: 'hidden',
                        zIndex: 2,
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <Typography sx={{ fontWeight: 'bold', fontSize: '0.75rem', lineHeight: 1.2 }}>
                        {booking.specialty || 'No specialty'}
                      </Typography>
                      {booking.doctor_name && (
                        <Typography sx={{ fontSize: '0.65rem', lineHeight: 1.3 }}>
                          Name: {booking.doctor_name}
                        </Typography>
                      )}
                      {booking.clinic_code && (
                        <Typography sx={{ fontSize: '0.65rem', lineHeight: 1.3 }}>
                          Clinic Code: {booking.clinic_code}
                        </Typography>
                      )}
                      <Typography sx={{ fontSize: '0.65rem', lineHeight: 1.3 }}>
                        Session: {getSessionLabel(booking.session)}
                      </Typography>
                      {booking.clinic_name && (
                        <Typography sx={{ fontSize: '0.65rem', lineHeight: 1.3 }}>
                          Clinic: {booking.clinic_name}
                        </Typography>
                      )}
                      {booking.notes && (
                        <Typography sx={{ fontSize: '0.6rem', lineHeight: 1.3, fontStyle: 'italic', opacity: 0.9 }}>
                          {booking.notes}
                        </Typography>
                      )}
                      {isCancelled && (
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#ffcdd2' }}>
                          CANCELLED
                        </Typography>
                      )}
                    </Paper>
                  );
                })}
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  return (
    <Container maxWidth={false} sx={{ maxWidth: '100%' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Calendar View
        </Typography>
      </Box>

      {/* Filters and Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button variant="text" size="small" onClick={handlePrevious} sx={{ minWidth: 'auto' }}>
                &laquo; Prev
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Today />}
                onClick={handleToday}
              >
                Today
              </Button>
              <Button variant="text" size="small" onClick={handleNext} sx={{ minWidth: 'auto' }}>
                Next &raquo;
              </Button>
            </Box>

            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {getViewTitle()}
            </Typography>

            <Box sx={{ flexGrow: 1 }} />

            <TextField
              select
              label="Clinic"
              size="small"
              value={filters.clinic_id}
              onChange={(e) => handleFilterChange('clinic_id', e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">All Clinics</MenuItem>
              {clinics.map(clinic => (
                <MenuItem key={clinic.id} value={clinic.id}>
                  {clinic.clinic_name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Room"
              size="small"
              value={filters.room_id}
              onChange={(e) => handleFilterChange('room_id', e.target.value)}
              sx={{ minWidth: 150 }}
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
              label="Specialty"
              size="small"
              value={filters.specialty}
              onChange={(e) => handleFilterChange('specialty', e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">All Specialties</MenuItem>
              {specialties.map(specialty => (
                <MenuItem key={specialty.id} value={specialty.name}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '2px', backgroundColor: specialty.color }} />
                    {specialty.name}
                  </Box>
                </MenuItem>
              ))}
            </TextField>

            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.includeCancelled}
                  onChange={(e) => handleFilterChange('includeCancelled', e.target.checked)}
                  size="small"
                />
              }
              label="Include Cancelled"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardContent sx={{ p: 1, overflow: 'auto' }}>
          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography>Loading...</Typography>
            </Box>
          ) : (
            renderDayView()
          )}
        </CardContent>
      </Card>
    </Container>
  );
}

export default CalendarView;
