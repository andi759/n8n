const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const schemaPath = path.join(__dirname, 'schema_postgres.sql');

async function initDatabase() {
    // Use DATABASE_URL for production (Render), fallback to individual vars for local dev
    const connectionConfig = process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        }
        : {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'room_booking',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres'
        };

    const pool = new Pool(connectionConfig);

    try {
        console.log('Connecting to PostgreSQL database...');

        // Read and execute schema
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(schema);
        console.log('Database schema created successfully');

        // Insert default data
        await insertDefaultData(pool);

        console.log('\nDatabase initialization complete!');
        console.log('You can now start the server.');
    } catch (err) {
        console.error('Database initialization error:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

async function insertDefaultData(pool) {
    // Hash default password
    const defaultPassword = bcrypt.hashSync('admin123', 10);

    // Insert default admin user
    try {
        await pool.query(
            `INSERT INTO users (username, password_hash, full_name, email, role)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (username) DO NOTHING`,
            ['admin', defaultPassword, 'Administrator', 'admin@booking.local', 'admin']
        );
        console.log('Default admin user created (username: admin, password: admin123)');
    } catch (err) {
        console.error('Error creating admin user:', err.message);
    }

    // Insert default staff user
    try {
        await pool.query(
            `INSERT INTO users (username, password_hash, full_name, email, role)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (username) DO NOTHING`,
            ['staff', bcrypt.hashSync('staff123', 10), 'Staff Member', 'staff@booking.local', 'staff']
        );
        console.log('Default staff user created (username: staff, password: staff123)');
    } catch (err) {
        console.error('Error creating staff user:', err.message);
    }

    // Insert room types
    const roomTypes = [
        ['Consultation Room', 'Standard consultation and examination'],
        ['Procedure Room', 'For minor procedures and treatments'],
        ['Examination Room', 'General examination and assessment'],
        ['Treatment Room', 'Treatment and therapy sessions']
    ];

    for (const [typeName, description] of roomTypes) {
        try {
            await pool.query(
                `INSERT INTO room_types (type_name, description)
                 VALUES ($1, $2)
                 ON CONFLICT (type_name) DO NOTHING`,
                [typeName, description]
            );
        } catch (err) {
            console.error('Error inserting room type:', err.message);
        }
    }
    console.log('Room types created');

    // Insert clinics
    const clinics = [
        ['Clinic 1', 'CLINIC1', 'Main outpatient clinic'],
        ['Clinic 2', 'CLINIC2', 'Secondary outpatient clinic'],
        ['Clinic 3', 'CLINIC3', 'Specialist clinic']
    ];

    for (const [clinicName, clinicCode, description] of clinics) {
        try {
            await pool.query(
                `INSERT INTO clinics (clinic_name, clinic_code, description)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (clinic_name) DO NOTHING`,
                [clinicName, clinicCode, description]
            );
        } catch (err) {
            console.error('Error inserting clinic:', err.message);
        }
    }
    console.log('Clinics created');

    // Insert sample rooms (distributed across clinics)
    const rooms = [
        [1, 'R101', 'Consultation Room 1', 1, 2],
        [1, 'R102', 'Consultation Room 2', 1, 2],
        [1, 'R103', 'Examination Room 1', 3, 1],
        [2, 'R201', 'Consultation Room 3', 1, 2],
        [2, 'R202', 'Procedure Room 1', 2, 1],
        [3, 'R301', 'Treatment Room 1', 4, 3],
        [3, 'R302', 'Consultation Room 4', 1, 2]
    ];

    for (const [clinicId, roomNumber, roomName, roomTypeId, capacity] of rooms) {
        try {
            await pool.query(
                `INSERT INTO rooms (clinic_id, room_number, room_name, room_type_id, capacity)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (clinic_id, room_number) DO NOTHING`,
                [clinicId, roomNumber, roomName, roomTypeId, capacity]
            );
        } catch (err) {
            console.error('Error inserting room:', err.message);
        }
    }
    console.log('Sample rooms created');

    // Insert default specialties
    const specialties = [
        ['Cardiology', '#e53935'],
        ['Dermatology', '#8e24aa'],
        ['ENT', '#43a047'],
        ['Neurology', '#fb8c00'],
        ['Ophthalmology', '#1e88e5']
    ];

    for (const [name, color] of specialties) {
        try {
            await pool.query(
                `INSERT INTO specialties (name, color)
                 VALUES ($1, $2)
                 ON CONFLICT (name) DO NOTHING`,
                [name, color]
            );
        } catch (err) {
            // Ignore duplicate errors
        }
    }
    console.log('Default specialties created');

    // Insert rotor cycle start date
    const rotorStartDate = process.env.ROTOR_CYCLE_START || '2026-01-17';
    try {
        // Check if rotor cycle exists
        const existing = await pool.query('SELECT id FROM rotor_cycles WHERE id = 1');
        if (existing.rows.length === 0) {
            await pool.query(
                `INSERT INTO rotor_cycles (id, cycle_name, start_date)
                 VALUES (1, $1, $2)`,
                ['Main Rotor Cycle', rotorStartDate]
            );
        }
        console.log(`Rotor cycle initialized with start date: ${rotorStartDate}`);
    } catch (err) {
        console.error('Error setting rotor cycle:', err.message);
    }
}

// Run initialization
initDatabase();
