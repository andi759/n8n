const db = require('../config/database');

// Get all clinics
async function getAllClinics(req, res) {
  try {
    const { active_only = 'true' } = req.query;

    let query = 'SELECT * FROM clinics';
    const params = [];

    if (active_only === 'true') {
      query += ' WHERE is_active = 1';
    }

    query += ' ORDER BY clinic_name';

    const clinics = await db.all(query, params);
    res.json(clinics);
  } catch (error) {
    console.error('Error fetching clinics:', error);
    res.status(500).json({ error: 'Failed to fetch clinics' });
  }
}

// Get clinic by ID
async function getClinicById(req, res) {
  try {
    const { id } = req.params;

    const clinic = await db.get('SELECT * FROM clinics WHERE id = ?', [id]);

    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    res.json(clinic);
  } catch (error) {
    console.error('Error fetching clinic:', error);
    res.status(500).json({ error: 'Failed to fetch clinic' });
  }
}

// Get rooms for a specific clinic
async function getClinicRooms(req, res) {
  try {
    const { id } = req.params;
    const { active_only = 'true' } = req.query;

    let query = `
      SELECT r.*, rt.type_name, c.clinic_name
      FROM rooms r
      LEFT JOIN room_types rt ON r.room_type_id = rt.id
      LEFT JOIN clinics c ON r.clinic_id = c.id
      WHERE r.clinic_id = ?
    `;
    const params = [id];

    if (active_only === 'true') {
      query += ' AND r.is_active = 1';
    }

    query += ' ORDER BY r.room_number';

    const rooms = await db.all(query, params);
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching clinic rooms:', error);
    res.status(500).json({ error: 'Failed to fetch clinic rooms' });
  }
}

// Create new clinic
async function createClinic(req, res) {
  try {
    const { clinic_name, clinic_code, description } = req.body;

    if (!clinic_name || !clinic_code) {
      return res.status(400).json({ error: 'Clinic name and code are required' });
    }

    const result = await db.run(
      `INSERT INTO clinics (clinic_name, clinic_code, description)
       VALUES (?, ?, ?)`,
      [clinic_name, clinic_code, description]
    );

    const newClinic = await db.get('SELECT * FROM clinics WHERE id = ?', [result.lastID]);
    res.status(201).json(newClinic);
  } catch (error) {
    console.error('Error creating clinic:', error);
    if (error.message.includes('UNIQUE constraint')) {
      res.status(409).json({ error: 'Clinic name or code already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create clinic' });
    }
  }
}

// Update clinic
async function updateClinic(req, res) {
  try {
    const { id } = req.params;
    const { clinic_name, clinic_code, description, is_active } = req.body;

    const clinic = await db.get('SELECT * FROM clinics WHERE id = ?', [id]);

    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    await db.run(
      `UPDATE clinics
       SET clinic_name = ?, clinic_code = ?, description = ?, is_active = ?
       WHERE id = ?`,
      [
        clinic_name || clinic.clinic_name,
        clinic_code || clinic.clinic_code,
        description !== undefined ? description : clinic.description,
        is_active !== undefined ? is_active : clinic.is_active,
        id
      ]
    );

    const updatedClinic = await db.get('SELECT * FROM clinics WHERE id = ?', [id]);
    res.json(updatedClinic);
  } catch (error) {
    console.error('Error updating clinic:', error);
    if (error.message.includes('UNIQUE constraint')) {
      res.status(409).json({ error: 'Clinic name or code already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update clinic' });
    }
  }
}

// Delete (deactivate) clinic
async function deleteClinic(req, res) {
  try {
    const { id } = req.params;

    const clinic = await db.get('SELECT * FROM clinics WHERE id = ?', [id]);

    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    // Soft delete - just mark as inactive
    await db.run('UPDATE clinics SET is_active = 0 WHERE id = ?', [id]);

    res.json({ message: 'Clinic deactivated successfully' });
  } catch (error) {
    console.error('Error deleting clinic:', error);
    res.status(500).json({ error: 'Failed to delete clinic' });
  }
}

module.exports = {
  getAllClinics,
  getClinicById,
  getClinicRooms,
  createClinic,
  updateClinic,
  deleteClinic
};
