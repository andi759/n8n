const db = require('../config/database');

/**
 * Get all rooms
 */
async function getAllRooms(req, res) {
    try {
        const { is_active, clinic_id } = req.query;

        let query = `
            SELECT r.*, rt.type_name as room_type_name, c.clinic_name, c.clinic_code
            FROM rooms r
            LEFT JOIN room_types rt ON r.room_type_id = rt.id
            LEFT JOIN clinics c ON r.clinic_id = c.id
            WHERE 1=1
        `;
        const params = [];

        if (clinic_id !== undefined) {
            query += ' AND r.clinic_id = ?';
            params.push(clinic_id);
        }

        if (is_active !== undefined) {
            query += ' AND r.is_active = ?';
            params.push(is_active === 'true' ? 1 : 0);
        }

        query += ' ORDER BY c.clinic_name, r.room_number';

        const rooms = await db.all(query, params);
        res.json(rooms);
    } catch (error) {
        console.error('Get rooms error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

/**
 * Get single room
 */
async function getRoom(req, res) {
    try {
        const { id } = req.params;

        const room = await db.get(`
            SELECT r.*, rt.type_name as room_type_name, c.clinic_name, c.clinic_code
            FROM rooms r
            LEFT JOIN room_types rt ON r.room_type_id = rt.id
            LEFT JOIN clinics c ON r.clinic_id = c.id
            WHERE r.id = ?
        `, [id]);

        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        res.json(room);
    } catch (error) {
        console.error('Get room error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

/**
 * Create room
 */
async function createRoom(req, res) {
    try {
        const { clinic_id, room_number, room_name, room_type_id, capacity, description, equipment, hr_number } = req.body;

        if (!clinic_id || !room_number || !room_name) {
            return res.status(400).json({ error: 'clinic_id, room_number and room_name are required' });
        }

        const equipmentJson = equipment ? JSON.stringify(equipment) : '[]';

        const result = await db.run(`
            INSERT INTO rooms (clinic_id, room_number, room_name, room_type_id, capacity, description, equipment, hr_number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [clinic_id, room_number, room_name, room_type_id, capacity, description, equipmentJson, hr_number]);

        const room = await db.get('SELECT * FROM rooms WHERE id = ?', [result.id]);
        res.status(201).json(room);
    } catch (error) {
        console.error('Create room error:', error);
        if (error.message.includes('UNIQUE')) {
            res.status(409).json({ error: 'Room number already exists in this clinic' });
        } else {
            res.status(500).json({ error: 'Server error' });
        }
    }
}

/**
 * Update room
 */
async function updateRoom(req, res) {
    try {
        const { id } = req.params;
        const { room_number, room_name, room_type_id, capacity, description, equipment, hr_number, is_active } = req.body;

        const existing = await db.get('SELECT * FROM rooms WHERE id = ?', [id]);
        if (!existing) {
            return res.status(404).json({ error: 'Room not found' });
        }

        const equipmentJson = equipment !== undefined ? JSON.stringify(equipment) : undefined;

        await db.run(`
            UPDATE rooms SET
                room_number = COALESCE(?, room_number),
                room_name = COALESCE(?, room_name),
                room_type_id = COALESCE(?, room_type_id),
                capacity = COALESCE(?, capacity),
                description = COALESCE(?, description),
                equipment = COALESCE(?, equipment),
                hr_number = COALESCE(?, hr_number),
                is_active = COALESCE(?, is_active)
            WHERE id = ?
        `, [room_number, room_name, room_type_id, capacity, description, equipmentJson, hr_number, is_active, id]);

        const room = await db.get('SELECT * FROM rooms WHERE id = ?', [id]);
        res.json(room);
    } catch (error) {
        console.error('Update room error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

/**
 * Get room types
 */
async function getRoomTypes(req, res) {
    try {
        const types = await db.all('SELECT * FROM room_types ORDER BY type_name');
        res.json(types);
    } catch (error) {
        console.error('Get room types error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

module.exports = {
    getAllRooms,
    getRoom,
    createRoom,
    updateRoom,
    getRoomTypes
};
