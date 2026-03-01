const db = require('../config/database');

async function runMigrations() {
    console.log('Running database migrations...');
    const migrations = [];

    try {
        // PostgreSQL uses different syntax for ALTER TABLE
        // These are kept for backwards compatibility, but the schema_postgres.sql
        // should already have all columns defined

        // Add color column to bookings table
        try {
            await db.exec(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS color VARCHAR(50) DEFAULT '#1976d2'`);
            migrations.push('Checked color column on bookings');
        } catch (err) {
            if (!err.message.includes('already exists') && !err.message.includes('duplicate column')) {
                console.error('Migration error (bookings.color):', err.message);
            }
        }

        // Add color column to booking_series table
        try {
            await db.exec(`ALTER TABLE booking_series ADD COLUMN IF NOT EXISTS color VARCHAR(50) DEFAULT '#1976d2'`);
            migrations.push('Checked color column on booking_series');
        } catch (err) {
            if (!err.message.includes('already exists') && !err.message.includes('duplicate column')) {
                console.error('Migration error (booking_series.color):', err.message);
            }
        }

        // Add doctor_name column to bookings table
        try {
            await db.exec(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS doctor_name VARCHAR(255)`);
            migrations.push('Checked doctor_name column on bookings');
        } catch (err) {
            if (!err.message.includes('already exists') && !err.message.includes('duplicate column')) {
                console.error('Migration error (bookings.doctor_name):', err.message);
            }
        }

        // Add doctor_name column to booking_series table
        try {
            await db.exec(`ALTER TABLE booking_series ADD COLUMN IF NOT EXISTS doctor_name VARCHAR(255)`);
            migrations.push('Checked doctor_name column on booking_series');
        } catch (err) {
            if (!err.message.includes('already exists') && !err.message.includes('duplicate column')) {
                console.error('Migration error (booking_series.doctor_name):', err.message);
            }
        }

        // Add reallocation columns
        try {
            await db.exec(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_reallocated INTEGER DEFAULT 0`);
            await db.exec(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reallocated_by INTEGER`);
            await db.exec(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reallocated_at TIMESTAMP`);
            await db.exec(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS previous_booking_id INTEGER`);
            migrations.push('Checked reallocation columns on bookings');
        } catch (err) {
            if (!err.message.includes('already exists') && !err.message.includes('duplicate column')) {
                console.error('Migration error (reallocation columns):', err.message);
            }
        }

        // Add equipment column to rooms
        try {
            await db.exec(`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS equipment TEXT DEFAULT '[]'`);
            migrations.push('Checked equipment column on rooms');
        } catch (err) {
            if (!err.message.includes('already exists') && !err.message.includes('duplicate column')) {
                console.error('Migration error (rooms.equipment):', err.message);
            }
        }

        // Add session column to bookings (replaces start_time/end_time with All Day, AM, PM)
        try {
            await db.exec(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS session VARCHAR(20) DEFAULT 'all_day'`);
            migrations.push('Checked session column on bookings');
        } catch (err) {
            if (!err.message.includes('already exists') && !err.message.includes('duplicate column')) {
                console.error('Migration error (bookings.session):', err.message);
            }
        }

        // Add session column to booking_series
        try {
            await db.exec(`ALTER TABLE booking_series ADD COLUMN IF NOT EXISTS session VARCHAR(20) DEFAULT 'all_day'`);
            migrations.push('Checked session column on booking_series');
        } catch (err) {
            if (!err.message.includes('already exists') && !err.message.includes('duplicate column')) {
                console.error('Migration error (booking_series.session):', err.message);
            }
        }

        // Add booking type flags to bookings table (for reporting)
        try {
            await db.exec(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_ad_hoc INTEGER DEFAULT 0`);
            await db.exec(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_room_swap INTEGER DEFAULT 0`);
            await db.exec(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_over_4_weeks INTEGER DEFAULT 0`);
            await db.exec(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_under_4_weeks INTEGER DEFAULT 0`);
            migrations.push('Checked booking type columns on bookings');
        } catch (err) {
            if (!err.message.includes('already exists') && !err.message.includes('duplicate column')) {
                console.error('Migration error (booking type columns):', err.message);
            }
        }

        // Extend clinic_code column to VARCHAR(255) in all tables
        try {
            await db.exec(`ALTER TABLE clinics ALTER COLUMN clinic_code TYPE VARCHAR(255)`);
            await db.exec(`ALTER TABLE bookings ALTER COLUMN clinic_code TYPE VARCHAR(255)`);
            await db.exec(`ALTER TABLE booking_series ALTER COLUMN clinic_code TYPE VARCHAR(255)`);
            migrations.push('Extended clinic_code column to 255 characters');
        } catch (err) {
            // Ignore if already the correct type
            if (!err.message.includes('already') && !err.message.includes('nothing to alter')) {
                console.error('Migration error (clinic_code extension):', err.message);
            }
        }

        // Add hr_number column to rooms table
        try {
            await db.exec(`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS hr_number VARCHAR(255)`);
            migrations.push('Checked hr_number column on rooms');
        } catch (err) {
            if (!err.message.includes('already exists') && !err.message.includes('duplicate column')) {
                console.error('Migration error (rooms.hr_number):', err.message);
            }
        }

        // Insert default specialties if table is empty
        try {
            const count = await db.get('SELECT COUNT(*) as count FROM specialties');
            if (count && count.count === 0) {
                const defaultSpecialties = [
                    ['Cardiology', '#e53935'],
                    ['Dermatology', '#8e24aa'],
                    ['ENT', '#43a047'],
                    ['Neurology', '#fb8c00'],
                    ['Ophthalmology', '#1e88e5']
                ];

                for (const [name, color] of defaultSpecialties) {
                    try {
                        await db.run(`INSERT INTO specialties (name, color) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`, [name, color]);
                        migrations.push(`Added specialty: ${name}`);
                    } catch (err) {
                        // Ignore duplicate errors
                    }
                }
            }
        } catch (err) {
            console.error('Migration error (specialties):', err.message);
        }

        // Create wli_requests table
        try {
            await db.exec(`
                CREATE TABLE IF NOT EXISTS wli_requests (
                    id SERIAL PRIMARY KEY,
                    requester_name VARCHAR(255) NOT NULL,
                    contact_email VARCHAR(255) NOT NULL,
                    division VARCHAR(10) NOT NULL,
                    specialty VARCHAR(255) NOT NULL,
                    specialty_other VARCHAR(255),
                    wli_date DATE NOT NULL,
                    wli_time VARCHAR(10) NOT NULL,
                    preferred_location VARCHAR(255),
                    num_patients INTEGER,
                    num_clock_stops INTEGER,
                    requirements TEXT,
                    requirements_other TEXT,
                    director_approved VARCHAR(255),
                    status VARCHAR(50) DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            migrations.push('Checked wli_requests table');
        } catch (err) {
            if (!err.message.includes('already exists')) {
                console.error('Migration error (wli_requests):', err.message);
            }
        }

        if (migrations.length > 0) {
            console.log('Migrations completed:', migrations);
        } else {
            console.log('No new migrations needed');
        }

        return { success: true, migrations };
    } catch (error) {
        console.error('Migration failed:', error.message);
        return { success: false, error: error.message, migrations };
    }
}

module.exports = { runMigrations };
