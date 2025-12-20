import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load env vars
dotenv.config({ path: '.env.local' });

// Handle legacy/module compatibility if needed, or just standard script
// Assuming ts-node or similar.

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.SUPABASE_DB_URL;

if (!connectionString) {
    console.error('No database connection string found in .env.local (checked DATABASE_URL, POSTGRES_URL, etc.)');
    console.log('Available keys:', Object.keys(process.env).filter(k => k.includes('URL') || k.includes('DB')));
    process.exit(1);
}

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }, // Often needed for Supabase hosted
});

async function applyMigration() {
    try {
        const migrationPath = path.join(process.cwd(), 'supabase/migrations/20251220000001_maintenance_requests.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Connecting to database...');
        await client.connect();

        console.log('Applying migration...');
        await client.query(sql);

        console.log('Migration applied successfully.');
    } catch (err) {
        console.error('Error applying migration:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

applyMigration();
