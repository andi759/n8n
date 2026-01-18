import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Snackbar,
  Grid,
  Divider,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { getCurrentWeek, setCycleStart } from '../../services/rotorService';
import { formatDate } from '../../utils/rotorHelper';

function RotaConfiguration() {
  const [currentWeek, setCurrentWeek] = useState(null);
  const [newStartDate, setNewStartDate] = useState(new Date());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCurrentWeek();
  }, []);

  const loadCurrentWeek = async () => {
    try {
      const data = await getCurrentWeek();
      setCurrentWeek(data);
      if (data.cycle_start_date) {
        setNewStartDate(new Date(data.cycle_start_date));
      }
    } catch (error) {
      console.error('Failed to load current week:', error);
      setError('Failed to load rota information');
    }
  };

  const handleUpdateCycle = async () => {
    setError('');
    setLoading(true);

    try {
      await setCycleStart(formatDate(newStartDate));
      setSuccess(true);
      loadCurrentWeek();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update rota cycle');
    } finally {
      setLoading(false);
    }
  };

  const getWeekColor = (week) => {
    const colors = ['primary', 'secondary', 'success', 'warning', 'error'];
    return colors[(week - 1) % 5];
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Five-Week Rota Configuration
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Rota Week
              </Typography>

              {currentWeek && (
                <Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 150,
                      bgcolor: `${getWeekColor(currentWeek.week_number)}.light`,
                      borderRadius: 2,
                      mb: 2,
                    }}
                  >
                    <Typography variant="h1" color={`${getWeekColor(currentWeek.week_number)}.main`}>
                      {currentWeek.week_number}
                    </Typography>
                  </Box>

                  <Typography variant="body1" gutterBottom>
                    <strong>Description:</strong> {currentWeek.description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Current Date: {new Date(currentWeek.current_date).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cycle Started: {new Date(currentWeek.cycle_start_date).toLocaleDateString()}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Update Rota Cycle Start
              </Typography>

              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Changing the rota cycle start date will affect all future recurring bookings
                  based on the five-week rota pattern. Use this carefully!
                </Typography>
              </Alert>

              <Box sx={{ mb: 2 }}>
                <DatePicker
                  label="New Cycle Start Date"
                  value={newStartDate}
                  onChange={(date) => setNewStartDate(date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: 'Set the date when Week 1 begins',
                    },
                  }}
                />
              </Box>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <Button
                variant="contained"
                fullWidth
                onClick={handleUpdateCycle}
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Cycle Start'}
              </Button>

              <Divider sx={{ my: 3 }} />

              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>How the 5-Week Rota Works:</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" component="div">
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>The rota repeats every 5 weeks</li>
                  <li>Week 1 starts on the cycle start date</li>
                  <li>After Week 5 completes, it rolls back to Week 1</li>
                  <li>Recurring bookings can be set for specific weeks (e.g., weeks 1, 3, 5)</li>
                  <li>This allows doctors to maintain consistent schedules across the rota cycle</li>
                </ul>
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Rota Week Reference
              </Typography>

              <Grid container spacing={2}>
                {[1, 2, 3, 4, 5].map((week) => (
                  <Grid item xs={12} sm={6} md={2.4} key={week}>
                    <Card
                      variant="outlined"
                      sx={{
                        bgcolor: currentWeek?.week_number === week ? `${getWeekColor(week)}.light` : 'background.paper',
                        borderColor: currentWeek?.week_number === week ? `${getWeekColor(week)}.main` : 'divider',
                        borderWidth: currentWeek?.week_number === week ? 2 : 1,
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color={getWeekColor(week)}>
                          {week}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Week {week}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        message="Rota cycle updated successfully!"
      />
    </Box>
  );
}

export default RotaConfiguration;
