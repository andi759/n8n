const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbPath = path.join(__dirname, 'bookings.db');
const schemaPath = path.join(__dirname, 'schema_v2.sql');

// Read schema file
const schema = fs.readFileSync(schemaPath, 'utf8');

// Create database and initialize
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log('Connected to SQLite database');
});

// Run schema
db.exec(schema, (err) => {
    if (err) {
        console.error('Error creating schema:', err.message);
        process.exit(1);
    }
    console.log('Database schema created successfully');

    // Insert default data
    insertDefaultData();
});

function insertDefaultData() {
    // Hash default password
    const defaultPassword = bcrypt.hashSync('admin123', 10);

    // Insert default admin user
    db.run(
        `INSERT OR IGNORE INTO users (username, password_hash, full_name, email, role)
         VALUES (?, ?, ?, ?, ?)`,
        ['admin', defaultPassword, 'Administrator', 'admin@booking.local', 'admin'],
        (err) => {
            if (err) {
                console.error('Error creating admin user:', err.message);
            } else {
                console.log('Default admin user created (username: admin, password: admin123)');
            }
        }
    );

    // Insert default staff user
    db.run(
        `INSERT OR IGNORE INTO users (username, password_hash, full_name, email, role)
         VALUES (?, ?, ?, ?, ?)`,
        ['staff', bcrypt.hashSync('staff123', 10), 'Staff Member', 'staff@booking.local', 'staff'],
        (err) => {
            if (err) {
                console.error('Error creating staff user:', err.message);
            } else {
                console.log('Default staff user created (username: staff, password: staff123)');
            }
        }
    );

    // Insert room types
    const roomTypes = [
        ['Consultation Room', 'Standard consultation and examination'],
        ['Procedure Room', 'For minor procedures and treatments'],
        ['Examination Room', 'General examination and assessment'],
        ['Treatment Room', 'Treatment and therapy sessions']
    ];

    const insertRoomType = db.prepare('INSERT OR IGNORE INTO room_types (type_name, description) VALUES (?, ?)');
    roomTypes.forEach(type => {
        insertRoomType.run(type, (err) => {
            if (err) console.error('Error inserting room type:', err.message);
        });
    });
    insertRoomType.finalize();
    console.log('Room types created');

    // Insert clinics
    const clinics = [
        ['Clinic 1', 'CLINIC1', 'Main outpatient clinic'],
        ['Clinic 2', 'CLINIC2', 'Secondary outpatient clinic'],
        ['Clinic 3', 'CLINIC3', 'Specialist clinic']
    ];

    const insertClinic = db.prepare(`
        INSERT OR IGNORE INTO clinics (clinic_name, clinic_code, description)
        VALUES (?, ?, ?)
    `);
    clinics.forEach(clinic => {
        insertClinic.run(clinic, (err) => {
            if (err) console.error('Error inserting clinic:', err.message);
        });
    });
    insertClinic.finalize();
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

    const insertRoom = db.prepare(`
        INSERT OR IGNORE INTO rooms (clinic_id, room_number, room_name, room_type_id, capacity)
        VALUES (?, ?, ?, ?, ?)
    `);
    rooms.forEach(room => {
        insertRoom.run(room, (err) => {
            if (err) console.error('Error inserting room:', err.message);
        });
    });
    insertRoom.finalize();
    console.log('Sample rooms created');

    // Insert rotor cycle start date
    const rotorStartDate = process.env.ROTOR_CYCLE_START || '2026-01-17';
    db.run(
        `INSERT OR IGNORE INTO rotor_cycles (id, cycle_name, start_date)
         VALUES (1, ?, ?)`,
        ['Main Rotor Cycle', rotorStartDate],
        (err) => {
            if (err) {
                console.error('Error setting rotor cycle:', err.message);
            } else {
                console.log(`Rotor cycle initialized with start date: ${rotorStartDate}`);
            }

            // Close database
            db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                } else {
                    console.log('\nDatabase initialization complete!');
                    console.log('You can now start the server.');
                }
            });
        }
    );
}
