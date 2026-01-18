import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Typography,
  Alert,
  Snackbar,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { getAllRooms, createRoom, updateRoom, getRoomTypes } from '../../services/roomService';
import { getAllClinics } from '../../services/clinicService';

const EQUIPMENT_OPTIONS = [
  'Computer',
  'Desk',
  'Telephone',
  'Examination Couch',
  'Blood Pressure Monitor',
  'Thermometer',
  'Scales',
  'Height Measure',
  'Oxygen Supply',
  'Sink',
  'Hand Sanitizer',
  'ECG Machine',
  'Defibrillator',
  'Wheelchair Access',
];

function RoomManagement() {
  const [rooms, setRooms] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({
    clinic_id: '',
    room_number: '',
    room_name: '',
    room_type_id: '',
    capacity: 1,
    description: '',
    equipment: [],
    is_active: 1,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [roomsData, clinicsData, typesData] = await Promise.all([
        getAllRooms({ is_active: 'all' }),
        getAllClinics(false),
        getRoomTypes(),
      ]);
      setRooms(roomsData);
      setClinics(clinicsData);
      setRoomTypes(typesData);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load data');
    }
  };

  const handleOpenDialog = (room = null) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        clinic_id: room.clinic_id,
        room_number: room.room_number,
        room_name: room.room_name,
        room_type_id: room.room_type_id || '',
        capacity: room.capacity || 1,
        description: room.description || '',
        equipment: room.equipment ? JSON.parse(room.equipment) : [],
        is_active: room.is_active,
      });
    } else {
      setEditingRoom(null);
      setFormData({
        clinic_id: '',
        room_number: '',
        room_name: '',
        room_type_id: '',
        capacity: 1,
        description: '',
        equipment: [],
        is_active: 1,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRoom(null);
    setError('');
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setError('');

    if (!formData.clinic_id || !formData.room_number || !formData.room_name) {
      setError('Clinic, room number, and room name are required');
      return;
    }

    try {
      if (editingRoom) {
        await updateRoom(editingRoom.id, formData);
      } else {
        await createRoom(formData);
      }

      setSuccess(true);
      handleCloseDialog();
      loadData();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save room');
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">Rooms</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Room
        </Button>
      </Box>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Clinic</TableCell>
            <TableCell>Room Number</TableCell>
            <TableCell>Room Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Capacity</TableCell>
            <TableCell>Equipment</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rooms.map((room) => (
            <TableRow key={room.id}>
              <TableCell>{room.clinic_name}</TableCell>
              <TableCell>{room.room_number}</TableCell>
              <TableCell>{room.room_name}</TableCell>
              <TableCell>{room.room_type_name || '-'}</TableCell>
              <TableCell>{room.capacity || '-'}</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {room.equipment && JSON.parse(room.equipment).slice(0, 3).map((eq, idx) => (
                    <Chip key={idx} label={eq} size="small" />
                  ))}
                  {room.equipment && JSON.parse(room.equipment).length > 3 && (
                    <Chip label={`+${JSON.parse(room.equipment).length - 3}`} size="small" variant="outlined" />
                  )}
                </Box>
              </TableCell>
              <TableCell>
                <Chip
                  label={room.is_active ? 'Active' : 'Inactive'}
                  color={room.is_active ? 'success' : 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell align="right">
                <IconButton size="small" onClick={() => handleOpenDialog(room)}>
                  <Edit fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Room Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingRoom ? 'Edit Room' : 'Add Room'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                  {clinic.clinic_name}
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Room Number"
                fullWidth
                required
                value={formData.room_number}
                onChange={(e) => handleChange('room_number', e.target.value)}
                placeholder="e.g., R101"
              />
              <TextField
                label="Room Name"
                fullWidth
                required
                value={formData.room_name}
                onChange={(e) => handleChange('room_name', e.target.value)}
                placeholder="e.g., Consultation Room 1"
              />
            </Box>

            <TextField
              select
              label="Room Type"
              fullWidth
              value={formData.room_type_id}
              onChange={(e) => handleChange('room_type_id', e.target.value)}
            >
              <MenuItem value="">None</MenuItem>
              {roomTypes.map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  {type.type_name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Capacity"
              type="number"
              fullWidth
              value={formData.capacity}
              onChange={(e) => handleChange('capacity', parseInt(e.target.value))}
              inputProps={{ min: 1 }}
            />

            <FormControl fullWidth>
              <InputLabel>Equipment</InputLabel>
              <Select
                multiple
                value={formData.equipment}
                onChange={(e) => handleChange('equipment', e.target.value)}
                input={<OutlinedInput label="Equipment" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {EQUIPMENT_OPTIONS.map((equipment) => (
                  <MenuItem key={equipment} value={equipment}>
                    {equipment}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Additional notes about this room"
            />

            <TextField
              select
              label="Status"
              fullWidth
              value={formData.is_active}
              onChange={(e) => handleChange('is_active', e.target.value)}
            >
              <MenuItem value={1}>Active</MenuItem>
              <MenuItem value={0}>Inactive</MenuItem>
            </TextField>

            {error && <Alert severity="error">{error}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingRoom ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        message="Room saved successfully!"
      />
    </Box>
  );
}

export default RoomManagement;
