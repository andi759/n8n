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
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  isSameMonth,
  isToday,
  getDay,
} from 'date-fns';

const VIEW_OPTIONS = [
  { value: 'month', label: 'Monthly' },
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
  const [viewMode, setViewMode] = useState('month');
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
        start = getSunday(currentDate);
        end = addDays(start, 6);
        break;
      case 'month':
      default:
        start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
        end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
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
        setCurrentDate(prev => subWeeks(prev, 1));
        break;
      case 'month':
      default:
        setCurrentDate(prev => subMonths(prev, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(prev => addDays(prev, 1));
        break;
      case 'week':
        setCurrentDate(prev => addWeeks(prev, 1));
        break;
      case 'month':
      default:
        setCurrentDate(prev => addMonths(prev, 1));
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
        const weekStart = getSunday(currentDate);
        const weekEnd = addDays(weekStart, 6);
        return `${format(weekStart, 'dd MMM')} - ${format(weekEnd, 'dd MMM yyyy')}`;
      case 'month':
      default:
        return format(currentDate, 'MMMM yyyy');
    }
  };

  // Generate calendar days for month view
  const getMonthDays = () => {
    const days = [];
    let day = dateRange.start;

    while (day <= dateRange.end) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
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

  // Render an expanded booking card with all details
  const renderBookingCard = (booking, compact = false) => {
    const isCancelled = booking.status === 'cancelled';
    const bgColor = isCancelled ? '#9e9e9e' : (booking.color || '#1976d2');

    return (
      <Paper
        key={booking.id}
        elevation={1}
        sx={{
          p: compact ? 0.75 : 1,
          mb: 0.5,
          backgroundColor: bgColor,
          color: 'white',
          opacity: isCancelled ? 0.8 : 1,
          borderRadius: 1,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontWeight: 'bold',
            fontSize: compact ? '0.7rem' : '0.8rem',
            textDecoration: isCancelled ? 'line-through' : 'none',
            lineHeight: 1.2,
          }}
        >
          {booking.room_name}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            fontSize: compact ? '0.6rem' : '0.7rem',
            lineHeight: 1.1,
            opacity: 0.95,
          }}
        >
          {booking.specialty || 'No specialty'}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            fontSize: compact ? '0.6rem' : '0.7rem',
            lineHeight: 1.1,
            opacity: 0.95,
          }}
        >
          {getSessionLabel(booking.session)}
        </Typography>
        {booking.doctor_name && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              fontSize: compact ? '0.55rem' : '0.65rem',
              lineHeight: 1.1,
              opacity: 0.9,
            }}
          >
            Dr: {booking.doctor_name}
          </Typography>
        )}
        {booking.clinic_code && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              fontSize: compact ? '0.55rem' : '0.65rem',
              lineHeight: 1.1,
              opacity: 0.9,
            }}
          >
            Code: {booking.clinic_code}
          </Typography>
        )}
        {isCancelled && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              fontSize: compact ? '0.6rem' : '0.7rem',
              fontWeight: 'bold',
              color: '#ffcdd2',
              lineHeight: 1.1,
            }}
          >
            CANCELLED
          </Typography>
        )}
      </Paper>
    );
  };

  // Render month view
  const renderMonthView = () => {
    const days = getMonthDays();
    const weeks = [];

    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <Box>
        {/* Day headers */}
        <Grid container>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <Grid item xs key={day} sx={{ textAlign: 'center', py: 1, borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle2" fontWeight="bold">{day}</Typography>
            </Grid>
          ))}
        </Grid>

        {/* Calendar grid */}
        {weeks.map((week, weekIndex) => (
          <Grid container key={weekIndex} sx={{ minHeight: '180px' }}>
            {week.map(day => {
              const dayBookings = getBookingsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);

              return (
                <Grid
                  item
                  xs
                  key={day.toISOString()}
                  sx={{
                    border: '1px solid #e0e0e0',
                    borderTop: 'none',
                    borderLeft: 'none',
                    p: 0.5,
                    minHeight: '180px',
                    backgroundColor: isCurrentDay ? 'rgba(25, 118, 210, 0.08)' : (isCurrentMonth ? 'white' : '#fafafa'),
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isCurrentDay ? 'bold' : 'normal',
                      color: isCurrentMonth ? 'inherit' : '#9e9e9e',
                      mb: 0.5,
                    }}
                  >
                    {format(day, 'd')}
                  </Typography>
                  <Box sx={{ maxHeight: '150px', overflow: 'auto' }}>
                    {dayBookings.map(booking => renderBookingCard(booking, true))}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        ))}
      </Box>
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
                    dayBookings.map(booking => {
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
                            opacity: isCancelled ? 0.8 : 1,
                            borderRadius: 1,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 'bold',
                              textDecoration: isCancelled ? 'line-through' : 'none',
                              lineHeight: 1.3,
                            }}
                          >
                            {booking.room_name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              fontSize: '0.75rem',
                              lineHeight: 1.2,
                              opacity: 0.95,
                            }}
                          >
                            {booking.specialty || 'No specialty'}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              fontSize: '0.75rem',
                              lineHeight: 1.2,
                              opacity: 0.95,
                            }}
                          >
                            {getSessionLabel(booking.session)}
                          </Typography>
                          {booking.doctor_name && (
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                fontSize: '0.7rem',
                                lineHeight: 1.2,
                                opacity: 0.9,
                              }}
                            >
                              Dr: {booking.doctor_name}
                            </Typography>
                          )}
                          {booking.clinic_code && (
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                fontSize: '0.7rem',
                                lineHeight: 1.2,
                                opacity: 0.9,
                              }}
                            >
                              Code: {booking.clinic_code}
                            </Typography>
                          )}
                          {isCancelled && (
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                color: '#ffcdd2',
                                mt: 0.5,
                              }}
                            >
                              CANCELLED
                            </Typography>
                          )}
                        </Paper>
                      );
                    })
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    );
  };

  // Render day view
  const renderDayView = () => {
    const dayBookings = getBookingsForDate(currentDate);

    // Group bookings by session
    const amBookings = dayBookings.filter(b => b.session === 'am');
    const pmBookings = dayBookings.filter(b => b.session === 'pm');
    const allDayBookings = dayBookings.filter(b => b.session === 'all_day');

    const renderSessionBookings = (sessionBookings, title) => (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid #1976d2', pb: 1 }}>
          {title} ({sessionBookings.length})
        </Typography>
        {sessionBookings.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No bookings</Typography>
        ) : (
          <Grid container spacing={2}>
            {sessionBookings.map(booking => {
              const isCancelled = booking.status === 'cancelled';
              const bgColor = isCancelled ? '#9e9e9e' : (booking.color || '#1976d2');

              return (
                <Grid item xs={12} md={6} lg={4} key={booking.id}>
                  <Paper
                    elevation={3}
                    sx={{
                      p: 2,
                      backgroundColor: bgColor,
                      color: 'white',
                      opacity: isCancelled ? 0.8 : 1,
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        textDecoration: isCancelled ? 'line-through' : 'none',
                        fontWeight: 'bold',
                      }}
                    >
                      {booking.room_name}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        opacity: 0.95,
                        mt: 0.5,
                      }}
                    >
                      {booking.specialty || 'No specialty'}
                    </Typography>
                    {booking.clinic_name && (
                      <Typography
                        variant="body2"
                        sx={{
                          opacity: 0.9,
                        }}
                      >
                        {booking.clinic_name}
                      </Typography>
                    )}
                    {booking.doctor_name && (
                      <Typography
                        variant="body2"
                        sx={{
                          mt: 1,
                          opacity: 0.95,
                        }}
                      >
                        <strong>Doctor:</strong> {booking.doctor_name}
                      </Typography>
                    )}
                    {booking.clinic_code && (
                      <Typography
                        variant="body2"
                        sx={{
                          opacity: 0.95,
                        }}
                      >
                        <strong>Code:</strong> {booking.clinic_code}
                      </Typography>
                    )}
                    {booking.notes && (
                      <Typography
                        variant="body2"
                        sx={{
                          mt: 1,
                          opacity: 0.85,
                          fontStyle: 'italic',
                        }}
                      >
                        {booking.notes}
                      </Typography>
                    )}
                    {isCancelled && (
                      <Typography
                        variant="body2"
                        sx={{
                          mt: 1,
                          fontWeight: 'bold',
                          color: '#ffcdd2',
                        }}
                      >
                        CANCELLED
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    );

    return (
      <Box sx={{ p: 2 }}>
        {renderSessionBookings(allDayBookings, 'All Day (08:30 - 17:30)')}
        {renderSessionBookings(amBookings, 'Morning (08:30 - 12:30)')}
        {renderSessionBookings(pmBookings, 'Afternoon (13:30 - 17:30)')}
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
        <CardContent sx={{ p: viewMode === 'month' ? 0 : 2 }}>
          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography>Loading...</Typography>
            </Box>
          ) : (
            <>
              {viewMode === 'month' && renderMonthView()}
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
