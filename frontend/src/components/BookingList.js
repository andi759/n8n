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
import { Delete, Refresh } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { getAllBookings, deleteBooking } from '../services/bookingService';
import { getAllRooms } from '../services/roomService';
import { getAllClinics } from '../services/clinicService';
import { format } from 'date-fns';

function BookingList() {
  const [bookings, setBookings] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [filters, setFilters] = useState({
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: null,
    clinic_id: '',
    room_id: '',
    specialty: '',
    status: '',
    is_reallocated: '',
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClinics();
    loadRooms();
    loadBookings();
  }, []);

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

  const loadBookings = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.clinic_id) params.clinic_id = filters.clinic_id;
      if (filters.room_id) params.room_id = filters.room_id;
      if (filters.specialty) params.specialty = filters.specialty;
      if (filters.status) params.status = filters.status;
      if (filters.is_reallocated) params.is_reallocated = filters.is_reallocated;

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
              label="Specialty"
              size="small"
              value={filters.specialty}
              onChange={(e) => handleFilterChange('specialty', e.target.value)}
              placeholder="Filter by specialty"
              sx={{ minWidth: 150 }}
            />

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

            <TextField
              select
              label="Reallocated"
              size="small"
              value={filters.is_reallocated}
              onChange={(e) => handleFilterChange('is_reallocated', e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Reallocated Only</MenuItem>
              <MenuItem value="false">Not Reallocated</MenuItem>
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

      <Card>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: '40px' }}></TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Clinic</TableCell>
                <TableCell>Room</TableCell>
                <TableCell>Specialty</TableCell>
                <TableCell>Clinic Code</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Reallocated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell sx={{ padding: '8px' }}>
                      <Box
                        sx={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '4px',
                          backgroundColor: booking.color || '#1976d2',
                          border: '1px solid rgba(0,0,0,0.1)',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {format(new Date(booking.booking_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {booking.start_time} - {booking.end_time}
                    </TableCell>
                    <TableCell>{booking.clinic_name}</TableCell>
                    <TableCell>{booking.room_name}</TableCell>
                    <TableCell>{booking.specialty || '-'}</TableCell>
                    <TableCell>{booking.clinic_code || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={booking.status}
                        color={getStatusColor(booking.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {booking.is_reallocated ? (
                        <Box>
                          <Chip
                            label="Reallocated"
                            color="warning"
                            size="small"
                          />
                          {booking.reallocated_by_name && (
                            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                              by {booking.reallocated_by_name}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="right">
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
