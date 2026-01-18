const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'booking.db');

async function migrate() {
  const db = new sqlite3.Database(DB_PATH);

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      console.log('Starting database migration...\n');

      // Step 1: Create clinics table
      console.log('Step 1: Creating clinics table...');
      db.run(`
        CREATE TABLE IF NOT EXISTS clinics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          clinic_name TEXT UNIQUE NOT NULL,
          clinic_code TEXT UNIQUE NOT NULL,
          description TEXT,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating clinics table:', err);
          return reject(err);
        }
        console.log('✓ Clinics table created\n');
      });

      // Step 2: Insert default clinics
      console.log('Step 2: Inserting default clinics...');
      const clinics = [
        { name: 'Clinic 1', code: 'CLINIC1', description: 'Main outpatient clinic' },
        { name: 'Clinic 2', code: 'CLINIC2', description: 'Secondary outpatient clinic' },
        { name: 'Clinic 3', code: 'CLINIC3', description: 'Specialist clinic' }
      ];

      const insertClinic = db.prepare(`
        INSERT OR IGNORE INTO clinics (clinic_name, clinic_code, description)
        VALUES (?, ?, ?)
      `);

      clinics.forEach(clinic => {
        insertClinic.run(clinic.name, clinic.code, clinic.description);
      });

      insertClinic.finalize((err) => {
        if (err) {
          console.error('Error inserting clinics:', err);
          return reject(err);
        }
        console.log('✓ Default clinics inserted\n');
      });

      // Step 3: Create new rooms table with clinic_id
      console.log('Step 3: Creating new rooms structure...');
      db.run(`ALTER TABLE rooms RENAME TO rooms_old`, (err) => {
        if (err && !err.message.includes('no such table')) {
          console.error('Error renaming rooms table:', err);
          return reject(err);
        }

        db.run(`
          CREATE TABLE IF NOT EXISTS rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            clinic_id INTEGER NOT NULL,
            room_number TEXT NOT NULL,
            room_name TEXT NOT NULL,
            room_type_id INTEGER,
            capacity INTEGER,
            description TEXT,
            is_active INTEGER DEFAULT 1,
            FOREIGN KEY (clinic_id) REFERENCES clinics(id),
            FOREIGN KEY (room_type_id) REFERENCES room_types(id),
            UNIQUE(clinic_id, room_number)
          )
        `, (err) => {
          if (err) {
            console.error('Error creating new rooms table:', err);
            return reject(err);
          }

          // Migrate old rooms data, assign to Clinic 1 by default
          db.run(`
            INSERT INTO rooms (id, clinic_id, room_number, room_name, room_type_id, capacity, description, is_active)
            SELECT id, 1, room_number, room_name, room_type_id, capacity, description, is_active
            FROM rooms_old
          `, (err) => {
            if (err && !err.message.includes('no such table')) {
              console.error('Error migrating rooms data:', err);
              return reject(err);
            }
            console.log('✓ Rooms table restructured\n');
          });
        });
      });

      // Step 4: Update booking_series table
      console.log('Step 4: Updating booking_series structure...');
      db.run(`ALTER TABLE booking_series RENAME TO booking_series_old`, (err) => {
        if (err && !err.message.includes('no such table')) {
          console.error('Error renaming booking_series table:', err);
          return reject(err);
        }

        db.run(`
          CREATE TABLE IF NOT EXISTS booking_series (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            clinic_id INTEGER NOT NULL,
            room_id INTEGER NOT NULL,
            series_name TEXT,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            duration_minutes INTEGER NOT NULL,
            specialty TEXT,
            clinic_code TEXT,
            notes TEXT,
            recurrence_type TEXT NOT NULL CHECK(recurrence_type IN ('one_time', 'weekly', 'monthly', 'five_week_rotor', 'custom')),
            recurrence_pattern TEXT,
            series_start_date TEXT NOT NULL,
            series_end_date TEXT,
            is_active INTEGER DEFAULT 1,
            created_by INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (clinic_id) REFERENCES clinics(id),
            FOREIGN KEY (room_id) REFERENCES rooms(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
          )
        `, (err) => {
          if (err) {
            console.error('Error creating new booking_series table:', err);
            return reject(err);
          }

          // Migrate old series data
          db.run(`
            INSERT INTO booking_series (id, clinic_id, room_id, series_name, start_time, end_time, duration_minutes,
                                       specialty, clinic_code, notes, recurrence_type, recurrence_pattern,
                                       series_start_date, series_end_date, is_active, created_by, created_at, updated_at)
            SELECT id, 1, room_id, series_name, start_time, end_time, duration_minutes,
                   purpose, procedure_type, notes, recurrence_type, recurrence_pattern,
                   series_start_date, series_end_date, is_active, created_by, created_at, updated_at
            FROM booking_series_old
          `, (err) => {
            if (err && !err.message.includes('no such table')) {
              console.error('Error migrating booking_series data:', err);
              return reject(err);
            }
            console.log('✓ Booking series table updated\n');
          });
        });
      });

      // Step 5: Update bookings table
      console.log('Step 5: Updating bookings structure...');
      db.run(`ALTER TABLE bookings RENAME TO bookings_old`, (err) => {
        if (err && !err.message.includes('no such table')) {
          console.error('Error renaming bookings table:', err);
          return reject(err);
        }

        db.run(`
          CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            series_id INTEGER,
            clinic_id INTEGER NOT NULL,
            room_id INTEGER NOT NULL,
            booking_date TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            duration_minutes INTEGER NOT NULL,
            specialty TEXT,
            clinic_code TEXT,
            notes TEXT,
            status TEXT DEFAULT 'confirmed' CHECK(status IN ('confirmed', 'cancelled', 'completed')),
            is_exception INTEGER DEFAULT 0,
            created_by INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (series_id) REFERENCES booking_series(id) ON DELETE CASCADE,
            FOREIGN KEY (clinic_id) REFERENCES clinics(id),
            FOREIGN KEY (room_id) REFERENCES rooms(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
          )
        `, (err) => {
          if (err) {
            console.error('Error creating new bookings table:', err);
            return reject(err);
          }

          // Migrate old bookings data
          db.run(`
            INSERT INTO bookings (id, series_id, clinic_id, room_id, booking_date, start_time, end_time,
                                 duration_minutes, specialty, clinic_code, notes, status, is_exception,
                                 created_by, created_at, updated_at)
            SELECT id, series_id, 1, room_id, booking_date, start_time, end_time,
                   duration_minutes, purpose, procedure_type, notes, status, is_exception,
                   created_by, created_at, updated_at
            FROM bookings_old
          `, (err) => {
            if (err && !err.message.includes('no such table')) {
              console.error('Error migrating bookings data:', err);
              return reject(err);
            }
            console.log('✓ Bookings table updated\n');
          });
        });
      });

      // Step 6: Create indexes
      console.log('Step 6: Creating indexes...');
      db.run(`CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_bookings_room ON bookings(room_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_bookings_clinic ON bookings(clinic_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_bookings_series ON bookings(series_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_series_room ON booking_series(room_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_series_clinic ON booking_series(clinic_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_series_dates ON booking_series(series_start_date, series_end_date)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_rooms_clinic ON rooms(clinic_id)`, (err) => {
        if (err) {
          console.error('Error creating indexes:', err);
          return reject(err);
        }
        console.log('✓ Indexes created\n');
      });

      // Step 7: Clean up old tables (optional - commented out for safety)
      console.log('Step 7: Migration complete!');
      console.log('\nNote: Old tables (rooms_old, booking_series_old, bookings_old) are kept for safety.');
      console.log('You can drop them manually once you verify the migration was successful.\n');

      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
          return reject(err);
        }
        console.log('Database connection closed.');
        resolve();
      });
    });
  });
}

// Run migration
migrate()
  .then(() => {
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  });
