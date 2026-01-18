const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

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
