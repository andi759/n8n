const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Run database migrations on startup
const { runMigrations } = require('./database/migrations');
runMigrations().then(() => {
    console.log('Database migrations check complete');
}).catch(err => {
    console.error('Migration error:', err);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clinics', require('./routes/clinics'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/booking-series', require('./routes/bookingSeries'));
app.use('/api/rotor', require('./routes/rotor'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/users', require('./routes/users'));
app.use('/api/specialties', require('./routes/specialties'));
app.use('/api/public', require('./routes/public'));
app.use('/api/wli', require('./routes/wli'));

// TEMPORARY: Create first admin user (REMOVE AFTER USING)
app.get('/api/create-first-admin', async (req, res) => {
    const db = require('./config/database');
    const bcrypt = require('bcryptjs');

    try {
        // Check if any admin exists
        const existingAdmin = await db.get('SELECT * FROM users WHERE role = ?', ['admin']);

        if (existingAdmin) {
            return res.status(400).json({ error: 'Admin user already exists. Please remove this route.' });
        }

        const password_hash = await bcrypt.hash('Admin123!', 10);

        await db.run(`
            INSERT INTO users (username, password_hash, full_name, email, role)
            VALUES (?, ?, ?, ?, ?)
        `, ['admin', password_hash, 'System Administrator', 'admin@example.com', 'admin']);

        res.json({
            success: true,
            message: 'Admin user created successfully',
            credentials: {
                username: 'admin',
                password: 'Admin123!'
            },
            warning: 'CHANGE THIS PASSWORD IMMEDIATELY AFTER LOGIN! Then remove this route from server.js'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// TEMPORARY: Clear all bookings from database (REMOVE AFTER USING)
app.get('/api/clear-all-bookings', async (req, res) => {
    const db = require('./config/database');

    try {
        // Delete all bookings
        await db.run('DELETE FROM bookings');
        // Delete all booking series
        await db.run('DELETE FROM booking_series');

        res.json({
            success: true,
            message: 'All bookings and booking series have been cleared from the database'
        });
    } catch (error) {
        console.error('Clear bookings error:', error);
        res.status(500).json({ error: error.message });
    }
});

// TEMPORARY: Run database migrations (REMOVE AFTER USING)
app.get('/api/run-migrations', async (req, res) => {
    const db = require('./config/database');
    const migrations = [];

    try {
        // Add color column to bookings table
        try {
            await db.run(`ALTER TABLE bookings ADD COLUMN color TEXT DEFAULT '#1976d2'`);
            migrations.push('Added color column to bookings');
        } catch (err) {
            if (err.message.includes('duplicate column')) migrations.push('bookings.color exists');
            else throw err;
        }

        // Add color column to booking_series table
        try {
            await db.run(`ALTER TABLE booking_series ADD COLUMN color TEXT DEFAULT '#1976d2'`);
            migrations.push('Added color column to booking_series');
        } catch (err) {
            if (err.message.includes('duplicate column')) migrations.push('booking_series.color exists');
            else throw err;
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
                if (err.message.includes('duplicate column')) migrations.push(`${col.split(' ')[0]} exists`);
                else throw err;
            }
        }

        // Add equipment column to rooms
        try {
            await db.run(`ALTER TABLE rooms ADD COLUMN equipment TEXT DEFAULT '[]'`);
            migrations.push('Added equipment column to rooms');
        } catch (err) {
            if (err.message.includes('duplicate column')) migrations.push('rooms.equipment exists');
            else throw err;
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

            // Insert default specialties
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
                    if (err.message.includes('UNIQUE constraint')) {
                        migrations.push(`Specialty ${name} already exists`);
                    }
                }
            }
        } catch (err) {
            migrations.push('Specialties table error: ' + err.message);
        }

        res.json({ success: true, migrations });
    } catch (error) {
        res.status(500).json({ error: error.message, migrations });
    }
});

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/build')));
}

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
});

// Serve React app for all non-API routes in production
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
    });
} else {
    // 404 handler for development
    app.use((req, res) => {
        res.status(404).json({ error: 'Route not found' });
    });
}

// Start server
app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`  Room Booking Service Backend`);
    console.log(`========================================`);
    console.log(`  Server running on port ${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  API Base: http://localhost:${PORT}/api`);
    console.log(`========================================\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\nSIGINT received, shutting down gracefully...');
    process.exit(0);
});

module.exports = app;
