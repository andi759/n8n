import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import { Delete, Edit, Refresh, MoreTime } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { getAllBookings, deleteBooking } from '../services/bookingService';
import { deleteSeries, extendSeries, previewExtendSeries } from '../services/seriesService';
import { getAllRooms } from '../services/roomService';
import { getAllClinics } from '../services/clinicService';
import { getAllSpecialties } from '../services/specialtyService';
import { format, parse, addMonths } from 'date-fns';

const SESSION_OPTIONS = [
  { value: '', label: 'All Sessions' },
  { value: 'all_day', label: 'All Day' },
  { value: 'am', label: 'AM' },
  { value: 'pm', label: 'PM' },
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

// Helper function to format date as UK format (dd/MM/yyyy)
const formatDateUK = (dateString) => {
  try {
    // Handle YYYY-MM-DD format from database
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy');
  } catch (error) {
    return dateString;
  }
};

// Helper function to get day of week from date
const getDayOfWeek = (dateString) => {
  try {
    const date = new Date(dateString);
    return format(date, 'EEEE'); // Full day name (e.g., "Monday")
  } catch (error) {
    return '-';
  }
};

function BookingList() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [filters, setFilters] = useState({
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: null,
    clinic_id: '',
    room_id: '',
    specialty: '',
    status: '',
    is_reallocated: '',
    session: '',
    is_ad_hoc: '',
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [bookingToExtend, setBookingToExtend] = useState(null);
  const [extendEndDate, setExtendEndDate] = useState(null);
  const [extendError, setExtendError] = useState('');
  const [extendLoading, setExtendLoading] = useState(false);
  const [extendPreview, setExtendPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    loadClinics();
    loadRooms();
    loadSpecialties();
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

  const loadSpecialties = async () => {
    try {
      const data = await getAllSpecialties();
      setSpecialties(data);
    } catch (error) {
      console.error('Failed to load specialties:', error);
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
      if (filters.session) params.session = filters.session;
      if (filters.is_ad_hoc) params.is_ad_hoc = filters.is_ad_hoc;

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

  const handleDeleteClick = (booking) => {
    setBookingToDelete(booking);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSingle = async () => {
    if (bookingToDelete) {
      try {
        await deleteBooking(bookingToDelete.id);
        loadBookings();
      } catch (error) {
        console.error('Failed to delete booking:', error);
      }
    }
    setDeleteDialogOpen(false);
    setBookingToDelete(null);
  };

  const handleDeleteSeries = async () => {
    if (bookingToDelete && bookingToDelete.series_id) {
      try {
        // Pass the booking date as from_date so only this booking and future ones are cancelled
        await deleteSeries(bookingToDelete.series_id, bookingToDelete.booking_date);
        loadBookings();
      } catch (error) {
        console.error('Failed to delete series:', error);
      }
    }
    setDeleteDialogOpen(false);
    setBookingToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setBookingToDelete(null);
  };

  const handleEdit = (booking) => {
    // Navigate to booking form with booking ID for editing
    navigate(`/bookings/edit/${booking.id}`);
  };

  const handleExtendClick = (booking) => {
    setBookingToExtend(booking);
    // Default to 12 months from now
    setExtendEndDate(addMonths(new Date(), 12));
    setExtendError('');
    setExtendPreview(null);
    setExtendDialogOpen(true);
  };

  const handleExtendPreview = async () => {
    if (!extendEndDate) {
      setExtendError('Please select a new end date');
      return;
    }

    setPreviewLoading(true);
    setExtendError('');

    try {
      const newEndDateStr = format(extendEndDate, 'yyyy-MM-dd');
      const preview = await previewExtendSeries(bookingToExtend.series_id, newEndDateStr);
      setExtendPreview(preview);
    } catch (error) {
      console.error('Failed to preview extension:', error);
      setExtendError(error.response?.data?.error || 'Failed to preview extension');
      setExtendPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleExtendConfirm = async () => {
    if (!extendEndDate) {
      setExtendError('Please select a new end date');
      return;
    }

    if (!extendPreview) {
      setExtendError('Please preview the extension first');
      return;
    }

    setExtendLoading(true);
    setExtendError('');

    try {
      const newEndDateStr = format(extendEndDate, 'yyyy-MM-dd');
      await extendSeries(bookingToExtend.series_id, newEndDateStr);
      setExtendDialogOpen(false);
      setBookingToExtend(null);
      setExtendEndDate(null);
      setExtendPreview(null);
      loadBookings();
    } catch (error) {
      console.error('Failed to extend series:', error);
      setExtendError(error.response?.data?.error || 'Failed to extend series');
    } finally {
      setExtendLoading(false);
    }
  };

  const handleExtendCancel = () => {
    setExtendDialogOpen(false);
    setBookingToExtend(null);
    setExtendEndDate(null);
    setExtendError('');
    setExtendPreview(null);
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
              format="dd/MM/yyyy"
              slotProps={{ textField: { size: 'small', sx: { minWidth: 180 } } }}
            />

            <DatePicker
              label="End Date"
              value={filters.end_date ? new Date(filters.end_date) : null}
              onChange={(date) => handleFilterChange('end_date', date ? format(date, 'yyyy-MM-dd') : '')}
              format="dd/MM/yyyy"
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

            <TextField
              select
              label="Session"
              size="small"
              value={filters.session}
              onChange={(e) => handleFilterChange('session', e.target.value)}
              sx={{ minWidth: 120 }}
            >
              {SESSION_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
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

            <TextField
              select
              label="Ad Hoc"
              size="small"
              value={filters.is_ad_hoc}
              onChange={(e) => handleFilterChange('is_ad_hoc', e.target.value)}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Ad Hoc Only</MenuItem>
              <MenuItem value="false">Not Ad Hoc</MenuItem>
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
                <TableCell>Day</TableCell>
                <TableCell>Session</TableCell>
                <TableCell>Clinic</TableCell>
                <TableCell>Room</TableCell>
                <TableCell>Specialty</TableCell>
                <TableCell>Doctor</TableCell>
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
                      {formatDateUK(booking.booking_date)}
                    </TableCell>
                    <TableCell>
                      {getDayOfWeek(booking.booking_date)}
                    </TableCell>
                    <TableCell>
                      {getSessionLabel(booking.session)}
                    </TableCell>
                    <TableCell>{booking.clinic_name}</TableCell>
                    <TableCell>{booking.room_name}</TableCell>
                    <TableCell>{booking.specialty || '-'}</TableCell>
                    <TableCell>{booking.doctor_name || '-'}</TableCell>
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
                        title="Edit"
                        onClick={() => handleEdit(booking)}
                        disabled={booking.status === 'cancelled'}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      {booking.series_id && (
                        <IconButton
                          size="small"
                          title="Extend Series"
                          onClick={() => handleExtendClick(booking)}
                          disabled={booking.status === 'cancelled'}
                        >
                          <MoreTime fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        title="Cancel"
                        onClick={() => handleDeleteClick(booking)}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent>
          {bookingToDelete && (
            <Box>
              <Typography sx={{ mb: 2 }}>
                Are you sure you want to cancel this booking?
              </Typography>
              <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, mb: 2 }}>
                <Typography variant="body2">
                  <strong>Date:</strong> {formatDateUK(bookingToDelete.booking_date)}
                </Typography>
                <Typography variant="body2">
                  <strong>Session:</strong> {getSessionLabel(bookingToDelete.session)}
                </Typography>
                <Typography variant="body2">
                  <strong>Room:</strong> {bookingToDelete.room_name}
                </Typography>
                {bookingToDelete.specialty && (
                  <Typography variant="body2">
                    <strong>Specialty:</strong> {bookingToDelete.specialty}
                  </Typography>
                )}
              </Box>
              {bookingToDelete.series_id && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  This booking is part of a recurring series. You can cancel just this single booking, or cancel this booking and all future bookings in the series.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>
            Keep Booking
          </Button>
          {bookingToDelete?.series_id && (
            <Button onClick={handleDeleteSeries} color="error" variant="outlined">
              Cancel This & Future Bookings
            </Button>
          )}
          <Button onClick={handleDeleteSingle} color="error" variant="contained">
            {bookingToDelete?.series_id ? 'Cancel This Booking Only' : 'Cancel Booking'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Extend Series Dialog */}
      <Dialog open={extendDialogOpen} onClose={handleExtendCancel} maxWidth="md" fullWidth>
        <DialogTitle>Extend Recurring Series</DialogTitle>
        <DialogContent>
          {bookingToExtend && (
            <Box>
              <Typography sx={{ mb: 2 }}>
                Extend this recurring booking series by adding more bookings to the end of the series.
              </Typography>
              <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, mb: 3 }}>
                <Typography variant="body2">
                  <strong>Room:</strong> {bookingToExtend.room_name}
                </Typography>
                <Typography variant="body2">
                  <strong>Session:</strong> {getSessionLabel(bookingToExtend.session)}
                </Typography>
                {bookingToExtend.specialty && (
                  <Typography variant="body2">
                    <strong>Specialty:</strong> {bookingToExtend.specialty}
                  </Typography>
                )}
                {bookingToExtend.doctor_name && (
                  <Typography variant="body2">
                    <strong>Doctor:</strong> {bookingToExtend.doctor_name}
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2 }}>
                <DatePicker
                  label="New End Date"
                  value={extendEndDate}
                  onChange={(date) => {
                    setExtendEndDate(date);
                    setExtendPreview(null); // Clear preview when date changes
                  }}
                  format="dd/MM/yyyy"
                  minDate={new Date()}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      helperText: 'Default: 12 months from today'
                    }
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={handleExtendPreview}
                  disabled={previewLoading || !extendEndDate}
                  sx={{ mt: 1, minWidth: 120 }}
                >
                  {previewLoading ? 'Loading...' : 'Preview'}
                </Button>
              </Box>

              {extendPreview && (
                <Box sx={{ mt: 2 }}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Current last booking:</strong> {formatDateUK(extendPreview.current_last_date)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>New bookings to be created:</strong> {extendPreview.instances_to_create}
                    </Typography>
                  </Alert>

                  {extendPreview.conflicts && extendPreview.conflicts.length > 0 && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {extendPreview.conflicts.length} date(s) will be skipped due to conflicts:
                      </Typography>
                      <Box sx={{ maxHeight: 150, overflow: 'auto' }}>
                        {extendPreview.conflicts.map((conflict, index) => (
                          <Typography key={index} variant="body2" sx={{ ml: 1 }}>
                            • {formatDateUK(conflict.date)} - {getDayOfWeek(conflict.date)}
                            {conflict.conflicting_booking && (
                              <span style={{ color: '#666' }}>
                                {' '}(booked by {conflict.conflicting_booking.specialty || 'another booking'})
                              </span>
                            )}
                          </Typography>
                        ))}
                      </Box>
                    </Alert>
                  )}

                  {extendPreview.instances_to_create === 0 && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      No new bookings can be created. All dates have conflicts or the end date is too soon.
                    </Alert>
                  )}
                </Box>
              )}

              {extendError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {extendError}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleExtendCancel} disabled={extendLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleExtendConfirm}
            color="primary"
            variant="contained"
            disabled={extendLoading || !extendEndDate || !extendPreview || extendPreview.instances_to_create === 0}
          >
            {extendLoading ? 'Extending...' : `Extend Series (${extendPreview?.instances_to_create || 0} bookings)`}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default BookingList;
