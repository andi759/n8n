import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { Warning, CheckCircle, Block } from '@mui/icons-material';
import { format } from 'date-fns';

function SeriesPreview({ open, onClose, previewData, onConfirm, loading }) {
  const [excludedDates, setExcludedDates] = useState(new Set());

  useEffect(() => {
    if (previewData?.conflicts) {
      const conflictDates = new Set(
        previewData.conflicts.map(c => c.instance.booking_date)
      );
      setExcludedDates(conflictDates);
    }
  }, [previewData]);

  if (!previewData) return null;

  const { instances, conflicts, total_count, conflict_count } = previewData;
  const hasConflicts = conflict_count > 0;

  const conflictDateSet = new Set(conflicts.map(c => c.instance.booking_date));

  const availableInstances = instances.filter(inst => !conflictDateSet.has(inst.booking_date));
  const bookableCount = availableInstances.length;

  const handleConfirm = () => {
    onConfirm(Array.from(excludedDates));
  };

  const formatBookingDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return format(d, 'EEE dd MMM yyyy');
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Recurring Booking — Availability Check
      </DialogTitle>

      <DialogContent>
        {hasConflicts ? (
          <Alert severity="warning" icon={<Warning />} sx={{ mb: 3 }}>
            <strong>{conflict_count} date{conflict_count > 1 ? 's are' : ' is'} already booked</strong> and cannot be included.
            {bookableCount > 0
              ? ` You can proceed with the ${bookableCount} available slot${bookableCount > 1 ? 's' : ''}.`
              : ' There are no available slots to book.'}
          </Alert>
        ) : (
          <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 3 }}>
            All {total_count} slots are available — no conflicts detected.
          </Alert>
        )}

        <Box sx={{ display: 'grid', gridTemplateColumns: hasConflicts ? '1fr 1fr' : '1fr', gap: 2 }}>
          {/* Available dates */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CheckCircle color="success" fontSize="small" />
              <Typography variant="subtitle2" color="success.main">
                Will be booked ({bookableCount})
              </Typography>
            </Box>
            <Box sx={{ border: '1px solid', borderColor: 'success.light', borderRadius: 1, maxHeight: 300, overflow: 'auto' }}>
              {availableInstances.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                  No available slots
                </Typography>
              ) : (
                <List dense disablePadding>
                  {availableInstances.map((inst, index) => (
                    <React.Fragment key={inst.booking_date}>
                      {index > 0 && <Divider />}
                      <ListItem sx={{ py: 0.5 }}>
                        <ListItemText
                          primary={formatBookingDate(inst.booking_date)}
                          secondary={`${inst.start_time} – ${inst.end_time}`}
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                        <Chip label="Available" color="success" size="small" />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          </Box>

          {/* Conflicting dates */}
          {hasConflicts && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Block color="error" fontSize="small" />
                <Typography variant="subtitle2" color="error.main">
                  Already taken ({conflict_count})
                </Typography>
              </Box>
              <Box sx={{ border: '1px solid', borderColor: 'error.light', borderRadius: 1, maxHeight: 300, overflow: 'auto' }}>
                <List dense disablePadding>
                  {conflicts.map((conflict, index) => {
                    const existing = conflict.conflicting_bookings?.[0];
                    return (
                      <React.Fragment key={conflict.instance.booking_date}>
                        {index > 0 && <Divider />}
                        <ListItem sx={{ py: 0.5 }}>
                          <ListItemText
                            primary={formatBookingDate(conflict.instance.booking_date)}
                            secondary={
                              existing
                                ? `${existing.specialty || 'Existing booking'}${existing.doctor_name ? ` — ${existing.doctor_name}` : ''}`
                                : 'Existing booking'
                            }
                            primaryTypographyProps={{ variant: 'body2' }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                          <Chip label="Taken" color="error" size="small" icon={<Block />} />
                        </ListItem>
                      </React.Fragment>
                    );
                  })}
                </List>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading} variant="outlined" color="inherit">
          {hasConflicts ? "Don't Book Any" : 'Cancel'}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={loading || bookableCount === 0}
          startIcon={loading && <CircularProgress size={20} />}
          color={hasConflicts ? 'warning' : 'primary'}
        >
          {loading
            ? 'Creating...'
            : hasConflicts
              ? `Book Available Slots Only (${bookableCount})`
              : `Create All ${total_count} Bookings`
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SeriesPreview;
