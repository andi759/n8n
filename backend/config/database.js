const { Pool } = require('pg');
require('dotenv').config();

class Database {
    constructor() {
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

        this.pool = new Pool(connectionConfig);

        this.pool.on('connect', () => {
            console.log('Connected to PostgreSQL database');
        });

        this.pool.on('error', (err) => {
            console.error('PostgreSQL pool error:', err.message);
        });
    }

    // Run a query (INSERT, UPDATE, DELETE)
    async run(sql, params = []) {
        try {
            // Convert ? placeholders to $1, $2, etc. for PostgreSQL
            const pgSql = this.convertPlaceholders(sql);
            const result = await this.pool.query(pgSql, params);

            // For INSERT queries, try to get the inserted ID
            if (sql.trim().toUpperCase().startsWith('INSERT')) {
                return {
                    id: result.rows[0]?.id || result.rowCount,
                    changes: result.rowCount
                };
            }
            return { changes: result.rowCount };
        } catch (err) {
            // Convert PostgreSQL error messages to be more SQLite-like for compatibility
            if (err.code === '42701') {
                err.message = `duplicate column: ${err.message}`;
            }
            throw err;
        }
    }

    // Get a single row
    async get(sql, params = []) {
        const pgSql = this.convertPlaceholders(sql);
        const result = await this.pool.query(pgSql, params);
        return result.rows[0] || null;
    }

    // Get all rows
    async all(sql, params = []) {
        const pgSql = this.convertPlaceholders(sql);
        const result = await this.pool.query(pgSql, params);
        return result.rows;
    }

    // Execute raw SQL (for schema creation)
    async exec(sql) {
        await this.pool.query(sql);
    }

    // Convert SQLite ? placeholders to PostgreSQL $1, $2, etc.
    convertPlaceholders(sql) {
        let index = 0;
        return sql.replace(/\?/g, () => `$${++index}`);
    }

    // Close database connection
    async close() {
        await this.pool.end();
    }
}

// Export a singleton instance
module.exports = new Database();
