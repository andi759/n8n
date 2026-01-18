const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'bookings.db');
const db = new sqlite3.Database(dbPath);

console.log('Adding reallocation tracking fields to bookings table...');

const addReallocationFields = () => {
    return new Promise((resolve, reject) => {
        // Add is_reallocated field
        db.run(`ALTER TABLE bookings ADD COLUMN is_reallocated INTEGER DEFAULT 0`, (err) => {
            if (err) {
                if (err.message.includes('duplicate column name')) {
                    console.log('✓ is_reallocated column already exists');
                } else {
                    console.error('Error adding is_reallocated:', err);
                    return reject(err);
                }
            } else {
                console.log('✓ is_reallocated column added');
            }

            // Add reallocated_by field
            db.run(`ALTER TABLE bookings ADD COLUMN reallocated_by INTEGER`, (err) => {
                if (err) {
                    if (err.message.includes('duplicate column name')) {
                        console.log('✓ reallocated_by column already exists');
                    } else {
                        console.error('Error adding reallocated_by:', err);
                        return reject(err);
                    }
                } else {
                    console.log('✓ reallocated_by column added');
                }

                // Add reallocated_at field
                db.run(`ALTER TABLE bookings ADD COLUMN reallocated_at DATETIME`, (err) => {
                    if (err) {
                        if (err.message.includes('duplicate column name')) {
                            console.log('✓ reallocated_at column already exists');
                        } else {
                            console.error('Error adding reallocated_at:', err);
                            return reject(err);
                        }
                    } else {
                        console.log('✓ reallocated_at column added');
                    }

                    // Add previous_booking_id field to track the cancelled booking
                    db.run(`ALTER TABLE bookings ADD COLUMN previous_booking_id INTEGER`, (err) => {
                        if (err) {
                            if (err.message.includes('duplicate column name')) {
                                console.log('✓ previous_booking_id column already exists');
                                resolve();
                            } else {
                                console.error('Error adding previous_booking_id:', err);
                                reject(err);
                            }
                        } else {
                            console.log('✓ previous_booking_id column added');
                            resolve();
                        }
                    });
                });
            });
        });
    });
};

addReallocationFields()
    .then(() => {
        console.log('\n✓ Reallocation tracking fields migration completed successfully!');
        db.close();
    })
    .catch((err) => {
        console.error('\n✗ Migration failed:', err);
        db.close();
        process.exit(1);
    });
