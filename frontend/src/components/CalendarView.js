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
  IconButton,
  FormControlLabel,
  Checkbox,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Today,
} from '@mui/icons-material';
import { getAllBookings } from '../services/bookingService';
import { getAllRooms } from '../services/roomService';
import { getAllClinics } from '../services/clinicService';
import { getAllSpecialties } from '../services/specialtyService';
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  subDays,
  subWeeks,
  isToday,
  getDay,
} from 'date-fns';

const VIEW_OPTIONS = [
  { value: 'week', label: 'Weekly' },
  { value: 'day', label: 'Daily' },
];

// Helper function to format session display
const getSessionLabel = (session) => {
  switch (session) {
    case 'am': return 'AM';
    case 'pm': return 'PM';
    case 'all_day': return 'All Day';
    default: return session || '-';
  }
};

// Get the Sunday before the given date (start of week)
const getSunday = (date) => {
  const day = getDay(date);
  return subDays(date, day);
};

function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('day');
  const [bookings, setBookings] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
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
  }, [currentDate, viewMode, filters]);

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

  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    let start, end;

    switch (viewMode) {
      case 'day':
        start = currentDate;
        end = currentDate;
        break;
      case 'week':
      default:
        start = getSunday(currentDate);
        end = addDays(start, 6);
        break;
    }

    return { start, end };
  }, [currentDate, viewMode]);

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
    switch (viewMode) {
      case 'day':
        setCurrentDate(prev => subDays(prev, 1));
        break;
      case 'week':
      default:
        setCurrentDate(prev => subWeeks(prev, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(prev => addDays(prev, 1));
        break;
      case 'week':
      default:
        setCurrentDate(prev => addWeeks(prev, 1));
        break;
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Get bookings for a specific date
  const getBookingsForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return bookings.filter(b => b.booking_date === dateStr);
  };

  // Get title based on view mode
  const getViewTitle = () => {
    switch (viewMode) {
      case 'day':
        return format(currentDate, 'EEEE, dd MMMM yyyy');
      case 'week':
      default:
        const weekStart = getSunday(currentDate);
        const weekEnd = addDays(weekStart, 6);
        return `${format(weekStart, 'dd MMM')} - ${format(weekEnd, 'dd MMM yyyy')}`;
    }
  };

  // Generate days for week view
  const getWeekDays = () => {
    const days = [];
    let day = getSunday(currentDate);

    for (let i = 0; i < 7; i++) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  };

  // Get rooms that have bookings for a given date, plus any filtered rooms
  const getRoomsForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayBookings = bookings.filter(b => b.booking_date === dateStr);

    // Get unique room IDs from bookings
    const bookedRoomIds = new Set(dayBookings.map(b => b.room_id));

    // Get rooms to display - either filtered rooms or rooms with bookings
    let displayRooms;
    if (filters.room_id) {
      displayRooms = rooms.filter(r => r.id === parseInt(filters.room_id));
    } else if (filters.clinic_id) {
      displayRooms = rooms.filter(r => bookedRoomIds.has(r.id));
    } else {
      displayRooms = allRooms.filter(r => bookedRoomIds.has(r.id));
    }

    return displayRooms.sort((a, b) => {
      if (a.clinic_name !== b.clinic_name) return a.clinic_name.localeCompare(b.clinic_name);
      return a.room_number.localeCompare(b.room_number);
    });
  };

  // Render a booking block with all details
  const renderBookingBlock = (booking) => {
    const isCancelled = booking.status === 'cancelled';
    const bgColor = isCancelled ? '#9e9e9e' : (booking.color || '#1976d2');

    return (
      <Paper
        key={booking.id}
        elevation={2}
        sx={{
          p: 1.5,
          mb: 1,
          backgroundColor: bgColor,
          color: 'white',
          opacity: isCancelled ? 0.7 : 1,
          borderRadius: 1,
          minHeight: 80,
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 'bold', lineHeight: 1.3, textDecoration: isCancelled ? 'line-through' : 'none' }}>
          {booking.specialty || 'No specialty'}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', fontSize: '0.75rem', lineHeight: 1.3, opacity: 0.95 }}>
          {getSessionLabel(booking.session)} ({booking.start_time} - {booking.end_time})
        </Typography>
        {booking.doctor_name && (
          <Typography variant="caption" sx={{ display: 'block', fontSize: '0.7rem', lineHeight: 1.3, opacity: 0.9 }}>
            Dr: {booking.doctor_name}
          </Typography>
        )}
        {booking.clinic_code && (
          <Typography variant="caption" sx={{ display: 'block', fontSize: '0.7rem', lineHeight: 1.3, opacity: 0.9 }}>
            Code: {booking.clinic_code}
          </Typography>
        )}
        {booking.clinic_name && (
          <Typography variant="caption" sx={{ display: 'block', fontSize: '0.7rem', lineHeight: 1.3, opacity: 0.9 }}>
            Clinic: {booking.clinic_name}
          </Typography>
        )}
        {booking.notes && (
          <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem', lineHeight: 1.3, opacity: 0.8, fontStyle: 'italic', mt: 0.5 }}>
            {booking.notes}
          </Typography>
        )}
        {isCancelled && (
          <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', color: '#ffcdd2', mt: 0.5 }}>
            CANCELLED
          </Typography>
        )}
      </Paper>
    );
  };

  // Render day view - rooms as columns, sessions as rows
  const renderDayView = () => {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const dayBookings = bookings.filter(b => b.booking_date === dateStr);
    const displayRooms = getRoomsForDate(currentDate);

    if (displayRooms.length === 0 && dayBookings.length === 0) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">No bookings for this day</Typography>
        </Box>
      );
    }

    const sessions = [
      { key: 'all_day', label: 'All Day', time: '08:30 - 17:30' },
      { key: 'am', label: 'AM', time: '08:30 - 12:30' },
      { key: 'pm', label: 'PM', time: '13:30 - 17:30' },
    ];

    return (
      <TableContainer component={Paper} elevation={0}>
        <Table sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  width: 120,
                  fontWeight: 'bold',
                  backgroundColor: '#f5f5f5',
                  borderRight: '2px solid #e0e0e0',
                  position: 'sticky',
                  left: 0,
                  zIndex: 1,
                }}
              >
                Session
              </TableCell>
              {displayRooms.map(room => (
                <TableCell
                  key={room.id}
                  align="center"
                  sx={{
                    fontWeight: 'bold',
                    backgroundColor: '#f5f5f5',
                    borderRight: '1px solid #e0e0e0',
                    minWidth: 180,
                    p: 1,
                  }}
                >
                  <Typography variant="subtitle2" fontWeight="bold">
                    {room.room_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {room.room_number}
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions.map(session => (
              <TableRow key={session.key}>
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                    backgroundColor: '#fafafa',
                    borderRight: '2px solid #e0e0e0',
                    verticalAlign: 'top',
                    position: 'sticky',
                    left: 0,
                    zIndex: 1,
                    p: 1.5,
                  }}
                >
                  <Typography variant="subtitle2" fontWeight="bold">
                    {session.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {session.time}
                  </Typography>
                </TableCell>
                {displayRooms.map(room => {
                  const cellBookings = dayBookings.filter(
                    b => b.room_id === room.id && b.session === session.key
                  );

                  return (
                    <TableCell
                      key={room.id}
                      sx={{
                        borderRight: '1px solid #e0e0e0',
                        verticalAlign: 'top',
                        p: 1,
                        minHeight: 120,
                        backgroundColor: cellBookings.length > 0 ? 'transparent' : '#fafafa',
                      }}
                    >
                      {cellBookings.map(booking => renderBookingBlock(booking))}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const days = getWeekDays();

    return (
      <Box>
        <Grid container>
          {days.map(day => {
            const dayBookings = getBookingsForDate(day);
            const isCurrentDay = isToday(day);

            return (
              <Grid
                item
                xs
                key={day.toISOString()}
                sx={{
                  border: '1px solid #e0e0e0',
                  borderLeft: 'none',
                  '&:first-of-type': { borderLeft: '1px solid #e0e0e0' },
                }}
              >
                {/* Day header */}
                <Box
                  sx={{
                    p: 1,
                    textAlign: 'center',
                    borderBottom: '1px solid #e0e0e0',
                    backgroundColor: isCurrentDay ? 'primary.main' : '#f5f5f5',
                    color: isCurrentDay ? 'white' : 'inherit',
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.85 },
                  }}
                  onClick={() => {
                    setCurrentDate(day);
                    setViewMode('day');
                  }}
                >
                  <Typography variant="subtitle2" fontWeight="bold">
                    {format(day, 'EEE')}
                  </Typography>
                  <Typography variant="h6">
                    {format(day, 'd')}
                  </Typography>
                  <Typography variant="caption">
                    {format(day, 'MMM')}
                  </Typography>
                </Box>

                {/* Bookings */}
                <Box sx={{ p: 1, minHeight: '300px', maxHeight: '500px', overflow: 'auto' }}>
                  {dayBookings.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
                      No bookings
                    </Typography>
                  ) : (
                    dayBookings.map(booking => renderBookingBlock(booking))
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    );
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Calendar View
        </Typography>
      </Box>

      {/* Filters and Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
            {/* View Mode */}
            <TextField
              select
              label="View"
              size="small"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              {VIEW_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            {/* Navigation */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={handlePrevious} size="small">
                <ChevronLeft />
              </IconButton>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Today />}
                onClick={handleToday}
              >
                Today
              </Button>
              <IconButton onClick={handleNext} size="small">
                <ChevronRight />
              </IconButton>
            </Box>

            {/* Current Period Title */}
            <Typography variant="h6" sx={{ minWidth: 200, fontWeight: 'bold' }}>
              {getViewTitle()}
            </Typography>

            <Box sx={{ flexGrow: 1 }} />

            {/* Filters */}
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
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '2px',
                        backgroundColor: specialty.color,
                      }}
                    />
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
        <CardContent sx={{ p: 2, overflow: 'auto' }}>
          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography>Loading...</Typography>
            </Box>
          ) : (
            <>
              {viewMode === 'week' && renderWeekView()}
              {viewMode === 'day' && renderDayView()}
            </>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}

export default CalendarView;
