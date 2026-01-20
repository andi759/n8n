import React, { useState, useEffect } from 'react';
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
  Checkbox,
} from '@mui/material';
import { Warning, CheckCircle } from '@mui/icons-material';
import { format } from 'date-fns';

function SeriesPreview({ open, onClose, previewData, onConfirm, loading }) {
  const [excludedDates, setExcludedDates] = useState(new Set());

  // Reset excluded dates when preview data changes
  useEffect(() => {
    if (previewData?.conflicts) {
      // Auto-exclude conflicting dates
      const conflictDates = new Set(
        previewData.conflicts.map(c => c.instance.booking_date)
      );
      setExcludedDates(conflictDates);
    }
  }, [previewData]);

  if (!previewData) return null;

  const { instances, conflicts, total_count, conflict_count } = previewData;

  const hasConflicts = conflict_count > 0;

  // Calculate how many will actually be booked
  const bookableCount = instances.filter(
    inst => !excludedDates.has(inst.booking_date)
  ).length;

  const toggleDateExclusion = (date) => {
    const newExcluded = new Set(excludedDates);
    if (newExcluded.has(date)) {
      newExcluded.delete(date);
    } else {
      newExcluded.add(date);
    }
    setExcludedDates(newExcluded);
  };

  const handleConfirm = () => {
    // Pass the list of dates to exclude to the parent
    onConfirm(Array.from(excludedDates));
  };

  const isConflicting = (date) => {
    return conflicts.some(c => c.instance.booking_date === date);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Preview Recurring Booking Instances
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            <strong>{total_count}</strong> booking instances generated
          </Typography>

          {hasConflicts ? (
            <Alert severity="warning" icon={<Warning />} sx={{ mt: 2 }}>
              <strong>{conflict_count} conflicts detected!</strong>
              <br />
              Conflicting dates are automatically excluded. You can proceed with the {bookableCount} available slots,
              or uncheck dates you want to skip.
            </Alert>
          ) : (
            <Alert severity="success" icon={<CheckCircle />} sx={{ mt: 2 }}>
              No conflicts detected. All time slots are available.
            </Alert>
          )}

          {bookableCount < total_count && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <strong>{bookableCount}</strong> of {total_count} bookings will be created
              ({total_count - bookableCount} excluded)
            </Alert>
          )}
        </Box>

        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">Include</TableCell>
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
                const hasConflict = isConflicting(instance.booking_date);
                const isExcluded = excludedDates.has(instance.booking_date);

                return (
                  <TableRow
                    key={index}
                    sx={{
                      bgcolor: hasConflict
                        ? 'error.light'
                        : isExcluded
                          ? 'action.disabledBackground'
                          : 'transparent',
                      opacity: isExcluded ? 0.6 : 1,
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={!isExcluded}
                        onChange={() => toggleDateExclusion(instance.booking_date)}
                        disabled={hasConflict}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{formattedDate}</TableCell>
                    <TableCell>{dayName}</TableCell>
                    <TableCell>
                      {instance.start_time} - {instance.end_time}
                    </TableCell>
                    <TableCell>
                      {hasConflict ? (
                        <Chip
                          label="Conflict - Skipped"
                          color="error"
                          size="small"
                          icon={<Warning />}
                        />
                      ) : isExcluded ? (
                        <Chip
                          label="Excluded"
                          color="default"
                          size="small"
                        />
                      ) : (
                        <Chip
                          label="Will Book"
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
                {conflict.conflicting_bookings?.[0]?.room_name && (
                  <> in {conflict.conflicting_bookings[0].room_name}</>
                )}
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

      <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Box>
          <Button
            onClick={handleConfirm}
            variant="contained"
            disabled={loading || bookableCount === 0}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading
              ? 'Creating...'
              : bookableCount === total_count
                ? `Create All ${total_count} Bookings`
                : `Create ${bookableCount} Bookings (Skip ${total_count - bookableCount})`
            }
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

export default SeriesPreview;
