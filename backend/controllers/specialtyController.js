const db = require('../config/database');

// Get all specialties
async function getAllSpecialties(req, res) {
    try {
        const specialties = await db.all(`
            SELECT * FROM specialties
            WHERE is_active = 1
            ORDER BY name ASC
        `);
        res.json(specialties);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Get specialty by ID
async function getSpecialtyById(req, res) {
    try {
        const specialty = await db.get('SELECT * FROM specialties WHERE id = ?', [req.params.id]);
        if (!specialty) {
            return res.status(404).json({ error: 'Specialty not found' });
        }
        res.json(specialty);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Create new specialty
async function createSpecialty(req, res) {
    const { name, color } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Specialty name is required' });
    }

    try {
        const result = await db.run(
            `INSERT INTO specialties (name, color) VALUES (?, ?)`,
            [name, color || '#1976d2']
        );

        const newSpecialty = await db.get('SELECT * FROM specialties WHERE id = ?', [result.lastID]);
        res.status(201).json(newSpecialty);
    } catch (error) {
        if (error.message.includes('UNIQUE constraint')) {
            return res.status(400).json({ error: 'Specialty with this name already exists' });
        }
        res.status(500).json({ error: error.message });
    }
}

// Update specialty
async function updateSpecialty(req, res) {
    const { name, color, is_active } = req.body;

    try {
        const specialty = await db.get('SELECT * FROM specialties WHERE id = ?', [req.params.id]);
        if (!specialty) {
            return res.status(404).json({ error: 'Specialty not found' });
        }

        await db.run(
            `UPDATE specialties SET name = ?, color = ?, is_active = ? WHERE id = ?`,
            [
                name || specialty.name,
                color || specialty.color,
                is_active !== undefined ? is_active : specialty.is_active,
                req.params.id
            ]
        );

        const updatedSpecialty = await db.get('SELECT * FROM specialties WHERE id = ?', [req.params.id]);
        res.json(updatedSpecialty);
    } catch (error) {
        if (error.message.includes('UNIQUE constraint')) {
            return res.status(400).json({ error: 'Specialty with this name already exists' });
        }
        res.status(500).json({ error: error.message });
    }
}

// Delete specialty (soft delete - set is_active to 0)
async function deleteSpecialty(req, res) {
    try {
        const specialty = await db.get('SELECT * FROM specialties WHERE id = ?', [req.params.id]);
        if (!specialty) {
            return res.status(404).json({ error: 'Specialty not found' });
        }

        await db.run('UPDATE specialties SET is_active = 0 WHERE id = ?', [req.params.id]);
        res.json({ message: 'Specialty deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    getAllSpecialties,
    getSpecialtyById,
    createSpecialty,
    updateSpecialty,
    deleteSpecialty
};
