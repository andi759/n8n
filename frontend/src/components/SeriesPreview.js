import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Box,
  Alert,
  Chip,
  CircularProgress,
} from '@mui/material';
import { Warning, CheckCircle } from '@mui/icons-material';
import { format } from 'date-fns';

function SeriesPreview({ open, onClose, previewData, onConfirm, loading }) {
  if (!previewData) return null;

  const { instances, conflicts, total_count, conflict_count } = previewData;

  const hasConflicts = conflict_count > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Preview Recurring Booking Instances
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            <strong>{total_count}</strong> booking instances will be created
          </Typography>

          {hasConflicts ? (
            <Alert severity="error" icon={<Warning />} sx={{ mt: 2 }}>
              <strong>{conflict_count} conflicts detected!</strong>
              <br />
              Some instances overlap with existing bookings.
            </Alert>
          ) : (
            <Alert severity="success" icon={<CheckCircle />} sx={{ mt: 2 }}>
              No conflicts detected. All time slots are available.
            </Alert>
          )}
        </Box>

        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Day</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {instances.slice(0, 50).map((instance, index) => {
                const instanceDate = new Date(instance.booking_date);
                const dayName = format(instanceDate, 'EEEE');
                const formattedDate = format(instanceDate, 'MMM dd, yyyy');

                const hasConflict = conflicts.some(
                  c => c.instance.booking_date === instance.booking_date
                );

                return (
                  <TableRow
                    key={index}
                    sx={{
                      bgcolor: hasConflict ? 'error.light' : 'transparent',
                    }}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{formattedDate}</TableCell>
                    <TableCell>{dayName}</TableCell>
                    <TableCell>
                      {instance.start_time} - {instance.end_time}
                    </TableCell>
                    <TableCell>
                      {hasConflict ? (
                        <Chip
                          label="Conflict"
                          color="error"
                          size="small"
                          icon={<Warning />}
                        />
                      ) : (
                        <Chip
                          label="Available"
                          color="success"
                          size="small"
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {instances.length > 50 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
              Showing first 50 of {total_count} instances
            </Typography>
          )}
        </Box>

        {hasConflicts && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" color="error" gutterBottom>
              Conflict Details:
            </Typography>
            {conflicts.slice(0, 5).map((conflict, index) => (
              <Alert severity="warning" key={index} sx={{ mt: 1 }}>
                {format(new Date(conflict.instance.booking_date), 'MMM dd, yyyy')} at{' '}
                {conflict.instance.start_time} - Already booked
              </Alert>
            ))}
            {conflicts.length > 5 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                ... and {conflicts.length - 5} more conflicts
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={loading || hasConflicts}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Creating...' : 'Confirm & Create Series'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SeriesPreview;
