import { Pool } from 'pg';
import 'dotenv/config';

async function testConnection() {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        const client = await pool.connect();
        console.log('✅ Connected successfully!');

        const result = await client.query('SELECT NOW() as current_time');
        console.log('Current time from DB:', result.rows[0].current_time);

        client.release();
        await pool.end();
    } catch (error) {
        console.error('❌ Connection failed:', error);
    }
}

testConnection();
