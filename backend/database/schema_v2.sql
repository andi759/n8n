-- Users table for staff authentication
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    role TEXT DEFAULT 'staff',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Clinics (top level)
CREATE TABLE IF NOT EXISTS clinics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinic_name TEXT UNIQUE NOT NULL,
    clinic_code TEXT UNIQUE NOT NULL,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Room types
CREATE TABLE IF NOT EXISTS room_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type_name TEXT UNIQUE NOT NULL,
    description TEXT
);

-- Rooms (now under clinics)
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
);

-- Booking series (for recurring bookings)
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
);

-- Individual booking instances
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
);

-- Rotor cycle tracking
CREATE TABLE IF NOT EXISTS rotor_cycles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cycle_name TEXT DEFAULT 'Main Rotor',
    start_date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
