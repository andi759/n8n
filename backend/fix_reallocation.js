const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database/bookings.db');
const db = new sqlite3.Database(dbPath);

console.log('Fixing reallocation for booking ID 77...\n');

// Update booking 77 to mark it as reallocated
db.run(`
    UPDATE bookings
    SET is_reallocated = 1,
        previous_booking_id = 36,
        reallocated_by = (SELECT created_by FROM bookings WHERE id = 77),
        reallocated_at = CURRENT_TIMESTAMP
    WHERE id = 77
`, (err) => {
    if (err) {
        console.error('Error updating booking:', err);
        db.close();
        return;
    }

    console.log('✓ Booking 77 updated successfully');

    // Verify the update
    db.get(`
        SELECT id, booking_date, start_time, end_time, room_id, status,
               is_reallocated, reallocated_by, previous_booking_id
        FROM bookings
        WHERE id = 77
    `, (err, row) => {
        if (err) {
            console.error('Error verifying:', err);
        } else {
            console.log('\nUpdated booking:');
            console.log(`  ID: ${row.id}`);
            console.log(`  Date: ${row.booking_date}`);
            console.log(`  Time: ${row.start_time} - ${row.end_time}`);
            console.log(`  Room ID: ${row.room_id}`);
            console.log(`  Status: ${row.status}`);
            console.log(`  Is Reallocated: ${row.is_reallocated}`);
            console.log(`  Reallocated By: ${row.reallocated_by}`);
            console.log(`  Previous Booking ID: ${row.previous_booking_id}`);
        }
        db.close();
    });
});
