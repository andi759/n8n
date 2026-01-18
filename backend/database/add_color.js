const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'bookings.db');

async function addColorColumn() {
  const db = new sqlite3.Database(DB_PATH);

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      console.log('Adding color column to bookings table...');

      // Add color column to bookings table
      db.run(`ALTER TABLE bookings ADD COLUMN color TEXT DEFAULT '#1976d2'`, (err) => {
        if (err) {
          if (err.message.includes('duplicate column name')) {
            console.log('✓ Color column already exists in bookings table');
          } else {
            console.error('Error adding color to bookings:', err);
            return reject(err);
          }
        } else {
          console.log('✓ Color column added to bookings table');
        }
      });

      // Add color column to booking_series table
      db.run(`ALTER TABLE booking_series ADD COLUMN color TEXT DEFAULT '#1976d2'`, (err) => {
        if (err) {
          if (err.message.includes('duplicate column name')) {
            console.log('✓ Color column already exists in booking_series table');
          } else {
            console.error('Error adding color to booking_series:', err);
            return reject(err);
          }
        } else {
          console.log('✓ Color column added to booking_series table');
        }

        db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
            return reject(err);
          }
          console.log('\n✅ Color column migration completed successfully!');
          resolve();
        });
      });
    });
  });
}

// Run migration
addColorColumn()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  });
