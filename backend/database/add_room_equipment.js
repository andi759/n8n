const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'bookings.db');
const db = new sqlite3.Database(dbPath);

console.log('Adding room equipment and features tracking...');

const addEquipmentFields = () => {
    return new Promise((resolve, reject) => {
        // Add equipment field (JSON string to store array of equipment)
        db.run(`ALTER TABLE rooms ADD COLUMN equipment TEXT DEFAULT '[]'`, (err) => {
            if (err) {
                if (err.message.includes('duplicate column name')) {
                    console.log('✓ equipment column already exists');
                } else {
                    console.error('Error adding equipment:', err);
                    return reject(err);
                }
            } else {
                console.log('✓ equipment column added');
            }

            // Update room_types table with the specific types
            db.run(`DELETE FROM room_types`, (err) => {
                if (err) {
                    console.error('Error clearing room_types:', err);
                    return reject(err);
                }

                const roomTypes = [
                    ['Consultation', 'Standard consultation room'],
                    ['Examination', 'Medical examination room'],
                    ['Treatment', 'Treatment and procedures room'],
                    ['Consultant and Examination', 'Combined consultant and examination room']
                ];

                let completed = 0;
                roomTypes.forEach(([type_name, description]) => {
                    db.run(`INSERT INTO room_types (type_name, description) VALUES (?, ?)`,
                        [type_name, description], (err) => {
                        if (err) {
                            console.error(`Error inserting room type ${type_name}:`, err);
                        } else {
                            console.log(`✓ Room type added: ${type_name}`);
                        }
                        completed++;
                        if (completed === roomTypes.length) {
                            resolve();
                        }
                    });
                });
            });
        });
    });
};

addEquipmentFields()
    .then(() => {
        console.log('\n✓ Room equipment tracking migration completed successfully!');
        db.close();
    })
    .catch((err) => {
        console.error('\n✗ Migration failed:', err);
        db.close();
        process.exit(1);
    });
