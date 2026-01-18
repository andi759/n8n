const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database/bookings.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking bookings for February 10, 2026...\n');

db.all(`
    SELECT id, booking_date, start_time, end_time, room_id, status,
           is_reallocated, reallocated_by, previous_booking_id
    FROM bookings
    WHERE booking_date = '2026-02-10'
    ORDER BY id
`, (err, rows) => {
    if (err) {
        console.error('Error:', err);
        db.close();
        return;
    }

    console.log('Found', rows.length, 'booking(s):\n');
    rows.forEach(row => {
        console.log(`ID: ${row.id}`);
        console.log(`  Date: ${row.booking_date}`);
        console.log(`  Time: ${row.start_time} - ${row.end_time}`);
        console.log(`  Room ID: ${row.room_id}`);
        console.log(`  Status: ${row.status}`);
        console.log(`  Is Reallocated: ${row.is_reallocated}`);
        console.log(`  Reallocated By: ${row.reallocated_by || 'N/A'}`);
        console.log(`  Previous Booking ID: ${row.previous_booking_id || 'N/A'}`);
        console.log('');
    });

    db.close();
});
