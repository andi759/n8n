import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
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
    Alert,
    Snackbar,
    Paper,
    Chip,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import {
    getAllClinics,
    createClinic,
    updateClinic,
    deleteClinic,
} from '../../services/clinicService';

function ClinicManagement() {
    const [clinics, setClinics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingClinic, setEditingClinic] = useState(null);
    const [formData, setFormData] = useState({ clinic_name: '', clinic_code: '', description: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        loadClinics();
    }, []);

    const loadClinics = async () => {
        try {
            const data = await getAllClinics(false); // Get all clinics including inactive
            setClinics(data);
        } catch (error) {
            console.error('Failed to load clinics:', error);
            setError('Failed to load clinics');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (clinic = null) => {
        if (clinic) {
            setEditingClinic(clinic);
            setFormData({
                clinic_name: clinic.clinic_name,
                clinic_code: clinic.clinic_code,
                description: clinic.description || '',
            });
        } else {
            setEditingClinic(null);
            setFormData({ clinic_name: '', clinic_code: '', description: '' });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingClinic(null);
        setFormData({ clinic_name: '', clinic_code: '', description: '' });
        setError('');
    };

    const handleSubmit = async () => {
        if (!formData.clinic_name.trim()) {
            setError('Clinic name is required');
            return;
        }
        if (!formData.clinic_code.trim()) {
            setError('Clinic code is required');
            return;
        }

        try {
            if (editingClinic) {
                await updateClinic(editingClinic.id, formData);
            } else {
                await createClinic(formData);
            }
            setSuccess(true);
            handleCloseDialog();
            loadClinics();
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to save clinic');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this clinic?')) {
            try {
                await deleteClinic(id);
                setSuccess(true);
                loadClinics();
            } catch (error) {
                setError(error.response?.data?.error || 'Failed to delete clinic');
            }
        }
    };

    if (loading) {
        return <Typography>Loading...</Typography>;
    }

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                    Clinic Management
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                >
                    Add Clinic
                </Button>
            </Box>

            <Paper>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Clinic Name</TableCell>
                            <TableCell>Code</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {clinics.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    No clinics found. Add one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            clinics.map((clinic) => (
                                <TableRow key={clinic.id}>
                                    <TableCell>{clinic.clinic_name}</TableCell>
                                    <TableCell>{clinic.clinic_code}</TableCell>
                                    <TableCell>{clinic.description || '-'}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={clinic.is_active ? 'Active' : 'Inactive'}
                                            color={clinic.is_active ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            onClick={() => handleOpenDialog(clinic)}
                                            color="primary"
                                        >
                                            <Edit />
                                        </IconButton>
                                        <IconButton
                                            onClick={() => handleDelete(clinic.id)}
                                            color="error"
                                        >
                                            <Delete />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Paper>

            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingClinic ? 'Edit Clinic' : 'Add Clinic'}
                </DialogTitle>
                <DialogContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <TextField
                        fullWidth
                        label="Clinic Name"
                        value={formData.clinic_name}
                        onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
                        margin="normal"
                        required
                    />
                    <TextField
                        fullWidth
                        label="Clinic Code"
                        value={formData.clinic_code}
                        onChange={(e) => setFormData({ ...formData, clinic_code: e.target.value })}
                        margin="normal"
                        required
                        helperText="A short unique code for the clinic (e.g., CARDIO, ORTHO)"
                    />
                    <TextField
                        fullWidth
                        label="Description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        margin="normal"
                        multiline
                        rows={3}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {editingClinic ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={success}
                autoHideDuration={3000}
                onClose={() => setSuccess(false)}
                message="Clinic saved successfully"
            />
        </Box>
    );
}

export default ClinicManagement;
