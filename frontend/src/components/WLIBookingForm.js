import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Box,
    TextField,
    Button,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Alert,
    Divider,
    CircularProgress,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import axios from 'axios';
import { submitWLIRequest } from '../services/wliService';

const DIVISIONS = ['A', 'B', 'C', 'D', 'E'];
const REQUIREMENTS = ['Imaging', 'Nursing Support', 'Specific Equipment', 'Other'];
const API_BASE_URL = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api';

function WLIBookingForm() {
    const navigate = useNavigate();
    const [specialties, setSpecialties] = useState([]);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        requester_name: '',
        contact_email: '',
        division: '',
        specialty: '',
        specialty_other: '',
        wli_date: '',
        wli_time: '',
        preferred_location: '',
        num_patients: '',
        num_clock_stops: '',
        requirements: [],
        requirements_other: '',
        director_approved: '',
    });

    useEffect(() => {
        axios.get(`${API_BASE_URL}/public/specialties`)
            .then(res => setSpecialties(res.data))
            .catch(() => setSpecialties([]));
    }, []);

    const handleChange = (field) => (e) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleRequirementToggle = (req) => {
        setFormData(prev => {
            const current = prev.requirements;
            const updated = current.includes(req)
                ? current.filter(r => r !== req)
                : [...current, req];
            return { ...prev, requirements: updated };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await submitWLIRequest(formData);
            setSubmitted(true);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <Container maxWidth="sm">
                <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                            <Box component="img" src="/nhs-logo.png" alt="NHS" sx={{ height: 60 }} />
                        </Box>
                        <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                        <Typography variant="h5" gutterBottom>Request Submitted</Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            Your WLI clinic request has been received. A confirmation email has been sent to <strong>{formData.contact_email}</strong>.
                        </Typography>
                        <Button variant="outlined" onClick={() => navigate('/login')}>
                            Return to Login
                        </Button>
                    </Paper>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                        <Box component="img" src="/nhs-logo.png" alt="NHS" sx={{ height: 60 }} />
                    </Box>
                    <Typography variant="h5" align="center" gutterBottom>
                        Waiting List Initiative (WLI) Clinic Request
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                        Cambridge University Hospitals NHS Foundation Trust
                    </Typography>

                    <Divider sx={{ mb: 3 }} />

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <Box component="form" onSubmit={handleSubmit}>

                        {/* Requester Details */}
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                            Requester Details
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, mb: 3 }}>
                            <TextField
                                label="Name of Person Requesting"
                                value={formData.requester_name}
                                onChange={handleChange('requester_name')}
                                required
                                fullWidth
                            />
                            <TextField
                                label="Contact Email Address"
                                type="email"
                                value={formData.contact_email}
                                onChange={handleChange('contact_email')}
                                required
                                fullWidth
                            />
                        </Box>

                        <Divider sx={{ mb: 3 }} />

                        {/* Clinic Details */}
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                            Clinic Details
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, mb: 2 }}>
                            <FormControl required fullWidth>
                                <InputLabel>Division</InputLabel>
                                <Select
                                    value={formData.division}
                                    onChange={handleChange('division')}
                                    label="Division"
                                >
                                    {DIVISIONS.map(d => (
                                        <MenuItem key={d} value={d}>Division {d}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl required fullWidth>
                                <InputLabel>Specialty</InputLabel>
                                <Select
                                    value={formData.specialty}
                                    onChange={handleChange('specialty')}
                                    label="Specialty"
                                >
                                    {specialties.map(s => (
                                        <MenuItem key={s.id} value={s.name}>{s.name}</MenuItem>
                                    ))}
                                    <MenuItem value="Other">Other (please specify)</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        {formData.specialty === 'Other' && (
                            <TextField
                                label="Please specify specialty"
                                value={formData.specialty_other}
                                onChange={handleChange('specialty_other')}
                                required
                                fullWidth
                                sx={{ mb: 2 }}
                            />
                        )}

                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, mb: 2 }}>
                            <TextField
                                label="Date of WLI"
                                type="date"
                                value={formData.wli_date}
                                onChange={handleChange('wli_date')}
                                required
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                                label="Time of WLI"
                                type="time"
                                value={formData.wli_time}
                                onChange={handleChange('wli_time')}
                                required
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                            />
                        </Box>

                        <TextField
                            label="Preferred Clinic Location"
                            value={formData.preferred_location}
                            onChange={handleChange('preferred_location')}
                            fullWidth
                            sx={{ mb: 1 }}
                            helperText="Please note this is not guaranteed"
                        />

                        <Divider sx={{ mb: 3, mt: 2 }} />

                        {/* Capacity */}
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                            Capacity
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, mb: 3 }}>
                            <TextField
                                label="Number of Patients to be Seen"
                                type="number"
                                value={formData.num_patients}
                                onChange={handleChange('num_patients')}
                                fullWidth
                                inputProps={{ min: 0 }}
                            />
                            <TextField
                                label="Number of Anticipated Clock Stops"
                                type="number"
                                value={formData.num_clock_stops}
                                onChange={handleChange('num_clock_stops')}
                                fullWidth
                                inputProps={{ min: 0 }}
                            />
                        </Box>

                        <Divider sx={{ mb: 3 }} />

                        {/* Requirements */}
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                            Requirements for Running the WLI
                        </Typography>
                        <FormGroup sx={{ mb: 1 }}>
                            {REQUIREMENTS.map(req => (
                                <FormControlLabel
                                    key={req}
                                    control={
                                        <Checkbox
                                            checked={formData.requirements.includes(req)}
                                            onChange={() => handleRequirementToggle(req)}
                                        />
                                    }
                                    label={req}
                                />
                            ))}
                        </FormGroup>

                        {formData.requirements.includes('Other') && (
                            <TextField
                                label="Please describe other requirements"
                                value={formData.requirements_other}
                                onChange={handleChange('requirements_other')}
                                fullWidth
                                multiline
                                rows={2}
                                sx={{ mb: 2 }}
                            />
                        )}

                        <Divider sx={{ mb: 3, mt: 2 }} />

                        {/* Approval */}
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                            Approval
                        </Typography>
                        <TextField
                            label="Divisional Director Approved (Name)"
                            value={formData.director_approved}
                            onChange={handleChange('director_approved')}
                            fullWidth
                            sx={{ mb: 3 }}
                        />

                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                            <Button variant="outlined" onClick={() => navigate('/login')} disabled={loading}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                            >
                                {loading ? 'Submitting...' : 'Submit WLI Request'}
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}

export default WLIBookingForm;
