-- Users table for staff authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(50) DEFAULT 'staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clinics (top level)
CREATE TABLE IF NOT EXISTS clinics (
    id SERIAL PRIMARY KEY,
    clinic_name VARCHAR(255) UNIQUE NOT NULL,
    clinic_code VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Room types
CREATE TABLE IF NOT EXISTS room_types (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT
);

-- Rooms (now under clinics)
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER NOT NULL REFERENCES clinics(id),
    room_number VARCHAR(50) NOT NULL,
    room_name VARCHAR(255) NOT NULL,
    room_type_id INTEGER REFERENCES room_types(id),
    capacity INTEGER,
    description TEXT,
    equipment TEXT DEFAULT '[]',
    hr_number VARCHAR(255),
    is_active INTEGER DEFAULT 1,
    UNIQUE(clinic_id, room_number)
);

-- Specialties table
CREATE TABLE IF NOT EXISTS specialties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    color VARCHAR(50) DEFAULT '#1976d2',
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Booking series (for recurring bookings)
CREATE TABLE IF NOT EXISTS booking_series (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER NOT NULL REFERENCES clinics(id),
    room_id INTEGER NOT NULL REFERENCES rooms(id),
    series_name VARCHAR(255),
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    session VARCHAR(20) DEFAULT 'all_day' CHECK(session IN ('all_day', 'am', 'pm')),
    specialty VARCHAR(255),
    clinic_code VARCHAR(255),
    doctor_name VARCHAR(255),
    notes TEXT,
    color VARCHAR(50) DEFAULT '#1976d2',
    recurrence_type VARCHAR(50) NOT NULL CHECK(recurrence_type IN ('one_time', 'weekly', 'monthly', 'five_week_rotor', 'custom')),
    recurrence_pattern TEXT,
    series_start_date VARCHAR(20) NOT NULL,
    series_end_date VARCHAR(20),
    is_active INTEGER DEFAULT 1,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual booking instances
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    series_id INTEGER REFERENCES booking_series(id) ON DELETE CASCADE,
    clinic_id INTEGER NOT NULL REFERENCES clinics(id),
    room_id INTEGER NOT NULL REFERENCES rooms(id),
    booking_date VARCHAR(20) NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    session VARCHAR(20) DEFAULT 'all_day' CHECK(session IN ('all_day', 'am', 'pm')),
    specialty VARCHAR(255),
    clinic_code VARCHAR(255),
    doctor_name VARCHAR(255),
    notes TEXT,
    color VARCHAR(50) DEFAULT '#1976d2',
    status VARCHAR(50) DEFAULT 'confirmed' CHECK(status IN ('confirmed', 'cancelled', 'completed')),
    is_exception INTEGER DEFAULT 0,
    is_reallocated INTEGER DEFAULT 0,
    reallocated_by INTEGER REFERENCES users(id),
    reallocated_at TIMESTAMP,
    previous_booking_id INTEGER,
    is_ad_hoc INTEGER DEFAULT 0,
    is_room_swap INTEGER DEFAULT 0,
    is_over_4_weeks INTEGER DEFAULT 0,
    is_under_4_weeks INTEGER DEFAULT 0,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rotor cycle tracking
CREATE TABLE IF NOT EXISTS rotor_cycles (
    id SERIAL PRIMARY KEY,
    cycle_name VARCHAR(255) DEFAULT 'Main Rotor',
    start_date VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_room ON bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_clinic ON bookings(clinic_id);
CREATE INDEX IF NOT EXISTS idx_bookings_series ON bookings(series_id);
CREATE INDEX IF NOT EXISTS idx_series_room ON booking_series(room_id);
CREATE INDEX IF NOT EXISTS idx_series_clinic ON booking_series(clinic_id);
CREATE INDEX IF NOT EXISTS idx_series_dates ON booking_series(series_start_date, series_end_date);
CREATE INDEX IF NOT EXISTS idx_rooms_clinic ON rooms(clinic_id);
