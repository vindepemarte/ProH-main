'use server';

import { pool } from './db';
import { User, Homework, HomeworkStatus, UserRole } from './types';

// Simple password hashing for dummy data
const hash = (pwd: string) => `hashed_${pwd}`;
const compare = (pwd: string, hashed: string) => hash(pwd) === hashed;

export async function fetchUsers(): Promise<User[]> {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT * FROM users');
        return res.rows;
    } finally {
        client.release();
    }
}

export async function authenticateUser(email: string, pass: string): Promise<User | null> {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
        if (res.rows.length > 0) {
            const user = res.rows[0];
            if (compare(pass, user.password_hash)) {
                return user;
            }
        }
        return null;
    } finally {
        client.release();
    }
}

export async function createUser(name: string, email: string, pass: string, refCode: string): Promise<User | null> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const codeRes = await client.query('SELECT * FROM reference_codes WHERE code = $1', [refCode.toUpperCase()]);
        if (codeRes.rows.length === 0) {
            throw new Error("Invalid reference code.");
        }
        const code = codeRes.rows[0];

        const emailRes = await client.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
        if (emailRes.rows.length > 0) {
            throw new Error("Email already in use.");
        }

        const newUserId = `user_${Date.now()}`;
        const newUser: Omit<User, 'id'> = {
            name,
            email: email.toLowerCase(),
            password_hash: hash(pass),
            role: code.role,
            referredBy: code.owner_id,
            referenceCode: null,
        };
        
        const insertRes = await client.query(
            'INSERT INTO users (id, name, email, password_hash, role, referred_by, reference_code) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [newUserId, newUser.name, newUser.email, newUser.password_hash, newUser.role, newUser.referredBy, newUser.referenceCode]
        );
        
        await client.query('COMMIT');
        return insertRes.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}


export async function fetchHomeworks(): Promise<Homework[]> {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT * FROM homeworks');
        return res.rows;
    } finally {
        client.release();
    }
}

export async function fetchHomeworksForUser(user: User): Promise<Homework[]> {
    const client = await pool.connect();
    let query = 'SELECT h.* FROM homeworks h';
    const params: (string | HomeworkStatus[])[] = [];
    
    switch(user.role) {
        case 'super_agent':
            // No filter, select all
            break;
        case 'agent':
            query += ' WHERE h.agent_id = $1';
            params.push(user.id);
            break;
        case 'student':
            query += ' WHERE h.student_id = $1';
            params.push(user.id);
            break;
        case 'super_worker':
            query += ` WHERE h.status = ANY($1::homework_status[])`;
            params.push(['in_progress', 'requested_changes', 'final_payment_approval', 'word_count_change', 'deadline_change']);
            break;
        case 'worker':
            query += ' WHERE h.worker_id = $1';
            params.push(user.id);
            break;
        default:
            return [];
    }

    try {
        const res = await client.query(query, params);
        return res.rows.map(row => ({...row, projectNumber: row.project_number, wordCount: row.word_count, moduleName: row.module_name}));
    } finally {
        client.release();
    }
}


export async function modifyHomework(id: string, updates: Partial<Homework>): Promise<void> {
    const client = await pool.connect();
    
    // Convert camelCase keys from JS to snake_case for the database
    const dbUpdates: { [key: string]: any } = {};
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.workerId) dbUpdates.worker_id = updates.workerId;
    if (updates.price) dbUpdates.price = updates.price;
    // Add other updatable fields here as needed
    
    const setClause = Object.keys(dbUpdates).map((key, i) => `${key} = $${i + 2}`).join(', ');
    const values = Object.values(dbUpdates);

    if (values.length === 0) return; // No updates to perform

    const query = `UPDATE homeworks SET ${setClause} WHERE id = $1`;
    
    try {
        await client.query(query, [id, ...values]);
    } finally {
        client.release();
    }
}

export async function fetchWorkersForSuperWorker(superWorkerId: string): Promise<User[]> {
    const client = await pool.connect();
    try {
        const res = await client.query("SELECT * FROM users WHERE role = 'worker' AND referred_by = $1", [superWorkerId]);
        return res.rows;
    } finally {
        client.release();
    }
}
