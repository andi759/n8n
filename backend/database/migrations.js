const db = require('../config/database');

async function runMigrations() {
    console.log('Running database migrations...');
    const migrations = [];

    try {
        // Add color column to bookings table
        try {
            await db.run(`ALTER TABLE bookings ADD COLUMN color TEXT DEFAULT '#1976d2'`);
            migrations.push('Added color column to bookings');
        } catch (err) {
            if (err.message.includes('duplicate column')) {
                // Column already exists, that's fine
            } else {
                console.error('Migration error (bookings.color):', err.message);
            }
        }

        // Add color column to booking_series table
        try {
            await db.run(`ALTER TABLE booking_series ADD COLUMN color TEXT DEFAULT '#1976d2'`);
            migrations.push('Added color column to booking_series');
        } catch (err) {
            if (!err.message.includes('duplicate column')) {
                console.error('Migration error (booking_series.color):', err.message);
            }
        }

        // Add reallocation columns
        const reallocationColumns = [
            'is_reallocated INTEGER DEFAULT 0',
            'reallocated_by INTEGER',
            'reallocated_at DATETIME',
            'previous_booking_id INTEGER'
        ];

        for (const col of reallocationColumns) {
            try {
                await db.run(`ALTER TABLE bookings ADD COLUMN ${col}`);
                migrations.push(`Added ${col.split(' ')[0]} to bookings`);
            } catch (err) {
                if (!err.message.includes('duplicate column')) {
                    console.error(`Migration error (bookings.${col.split(' ')[0]}):`, err.message);
                }
            }
        }

        // Add equipment column to rooms
        try {
            await db.run(`ALTER TABLE rooms ADD COLUMN equipment TEXT DEFAULT '[]'`);
            migrations.push('Added equipment column to rooms');
        } catch (err) {
            if (!err.message.includes('duplicate column')) {
                console.error('Migration error (rooms.equipment):', err.message);
            }
        }

        // Create specialties table
        try {
            await db.run(`
                CREATE TABLE IF NOT EXISTS specialties (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL,
                    color TEXT DEFAULT '#1976d2',
                    is_active INTEGER DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            migrations.push('Created specialties table');

            // Insert default specialties if table is empty
            const count = await db.get('SELECT COUNT(*) as count FROM specialties');
            if (count.count === 0) {
                const defaultSpecialties = [
                    ['Cardiology', '#e53935'],
                    ['Dermatology', '#8e24aa'],
                    ['ENT', '#43a047'],
                    ['Neurology', '#fb8c00'],
                    ['Ophthalmology', '#1e88e5']
                ];

                for (const [name, color] of defaultSpecialties) {
                    try {
                        await db.run(`INSERT INTO specialties (name, color) VALUES (?, ?)`, [name, color]);
                        migrations.push(`Added specialty: ${name}`);
                    } catch (err) {
                        // Ignore duplicate errors
                    }
                }
            }
        } catch (err) {
            console.error('Migration error (specialties):', err.message);
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
