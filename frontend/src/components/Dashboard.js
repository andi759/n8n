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
  TextField,
  MenuItem,
} from '@mui/material';
import { Add, EventRepeat } from '@mui/icons-material';
import { getAllBookings } from '../services/bookingService';
import { getCurrentWeek } from '../services/rotorService';
import { getAllClinics } from '../services/clinicService';
import { format } from 'date-fns';

function Dashboard() {
  const navigate = useNavigate();
  const [todayBookings, setTodayBookings] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [filteredUpcoming, setFilteredUpcoming] = useState([]);
  const [rotaWeek, setRotaWeek] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clinics, setClinics] = useState([]);
  const [filters, setFilters] = useState({
    date: '',
    clinic_id: '',
    specialty: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const nextWeek = format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

      const [bookings, rota] = await Promise.all([
        getAllBookings({ start_date: today, end_date: nextWeek }),
        getCurrentWeek(),
      ]);

      const todayList = bookings.filter(b => b.booking_date === today);
      const upcomingList = bookings.filter(b => b.booking_date > today);

      setTodayBookings(todayList);
      setUpcomingBookings(upcomingList.slice(0, 10));
      setRotaWeek(rota);
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

      {rotaWeek && (
        <Card sx={{ mb: 3, bgcolor: 'primary.main', color: 'white' }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Current Rota Week
            </Typography>
            <Typography variant="h3">
              {rotaWeek.description}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
              Cycle started: {format(new Date(rotaWeek.cycle_start_date), 'MMM dd, yyyy')}
            </Typography>
          </CardContent>
        </Card>
      )}

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
                Set up weekly, monthly, or rota-based recurring bookings
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
                    <TableCell>{booking.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
