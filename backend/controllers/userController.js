const db = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * Get all users
 */
async function getAllUsers(req, res) {
    try {
        const users = await db.all(`
            SELECT id, username, full_name, email, role, created_at
            FROM users
            ORDER BY full_name
        `);
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

/**
 * Get single user
 */
async function getUser(req, res) {
    try {
        const { id } = req.params;
        const user = await db.get(`
            SELECT id, username, full_name, email, role, created_at
            FROM users
            WHERE id = ?
        `, [id]);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

/**
 * Create user
 */
async function createUser(req, res) {
    try {
        const { username, password, full_name, email, role } = req.body;

        if (!username || !password || !full_name) {
            return res.status(400).json({ error: 'username, password, and full_name are required' });
        }

        // Check if username already exists
        const existing = await db.get('SELECT id FROM users WHERE username = ?', [username]);
        if (existing) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        const result = await db.run(`
            INSERT INTO users (username, password_hash, full_name, email, role)
            VALUES (?, ?, ?, ?, ?)
        `, [username, password_hash, full_name, email, role || 'staff']);

        const user = await db.get(`
            SELECT id, username, full_name, email, role, created_at
            FROM users
            WHERE id = ?
        `, [result.id]);

        res.status(201).json(user);
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

/**
 * Update user
 */
async function updateUser(req, res) {
    try {
        const { id } = req.params;
        const { username, password, full_name, email, role } = req.body;

        const existing = await db.get('SELECT * FROM users WHERE id = ?', [id]);
        if (!existing) {
            return res.status(404).json({ error: 'User not found' });
        }

        // If password is being updated, hash it
        let password_hash;
        if (password) {
            password_hash = await bcrypt.hash(password, 10);
        }

        await db.run(`
            UPDATE users SET
                username = COALESCE(?, username),
                password_hash = COALESCE(?, password_hash),
                full_name = COALESCE(?, full_name),
                email = COALESCE(?, email),
                role = COALESCE(?, role)
            WHERE id = ?
        `, [username, password_hash, full_name, email, role, id]);

        const user = await db.get(`
            SELECT id, username, full_name, email, role, created_at
            FROM users
            WHERE id = ?
        `, [id]);

        res.json(user);
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

/**
 * Delete user
 */
async function deleteUser(req, res) {
    try {
        const { id } = req.params;

        // Prevent deleting the last admin user
        const user = await db.get('SELECT role FROM users WHERE id = ?', [id]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.role === 'admin') {
            const adminCount = await db.get('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin']);
            if (adminCount.count <= 1) {
                return res.status(400).json({ error: 'Cannot delete the last admin user' });
            }
        }

        await db.run('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

module.exports = {
    getAllUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser
};
