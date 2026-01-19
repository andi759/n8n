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
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import {
    getAllSpecialties,
    createSpecialty,
    updateSpecialty,
    deleteSpecialty,
} from '../../services/specialtyService';

function SpecialtyManagement() {
    const [specialties, setSpecialties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingSpecialty, setEditingSpecialty] = useState(null);
    const [formData, setFormData] = useState({ name: '', color: '#1976d2' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        loadSpecialties();
    }, []);

    const loadSpecialties = async () => {
        try {
            const data = await getAllSpecialties();
            setSpecialties(data);
        } catch (error) {
            console.error('Failed to load specialties:', error);
            setError('Failed to load specialties');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (specialty = null) => {
        if (specialty) {
            setEditingSpecialty(specialty);
            setFormData({ name: specialty.name, color: specialty.color });
        } else {
            setEditingSpecialty(null);
            setFormData({ name: '', color: '#1976d2' });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingSpecialty(null);
        setFormData({ name: '', color: '#1976d2' });
        setError('');
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            setError('Specialty name is required');
            return;
        }

        try {
            if (editingSpecialty) {
                await updateSpecialty(editingSpecialty.id, formData);
            } else {
                await createSpecialty(formData);
            }
            setSuccess(true);
            handleCloseDialog();
            loadSpecialties();
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to save specialty');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this specialty?')) {
            try {
                await deleteSpecialty(id);
                setSuccess(true);
                loadSpecialties();
            } catch (error) {
                setError(error.response?.data?.error || 'Failed to delete specialty');
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
                    Specialty Management
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                >
                    Add Specialty
                </Button>
            </Box>

            <Paper>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Color</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {specialties.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} align="center">
                                    No specialties found. Add one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            specialties.map((specialty) => (
                                <TableRow key={specialty.id}>
                                    <TableCell>
                                        <Box
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: '4px',
                                                backgroundColor: specialty.color,
                                                border: '1px solid rgba(0,0,0,0.1)',
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>{specialty.name}</TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            onClick={() => handleOpenDialog(specialty)}
                                            color="primary"
                                        >
                                            <Edit />
                                        </IconButton>
                                        <IconButton
                                            onClick={() => handleDelete(specialty.id)}
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
                    {editingSpecialty ? 'Edit Specialty' : 'Add Specialty'}
                </DialogTitle>
                <DialogContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <TextField
                        fullWidth
                        label="Specialty Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        margin="normal"
                        required
                    />
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Specialty Color
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <input
                                type="color"
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
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
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                size="small"
                                sx={{ width: '120px' }}
                                placeholder="#1976d2"
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {editingSpecialty ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={success}
                autoHideDuration={3000}
                onClose={() => setSuccess(false)}
                message="Specialty saved successfully"
            />
        </Box>
    );
}

export default SpecialtyManagement;
