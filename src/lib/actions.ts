'use server';

import { pool } from './db';
import type { User, Homework, HomeworkStatus, UserRole, ReferenceCode, ProjectNumber, AnalyticsData } from './types';

// Simple password hashing for dummy data
const hash = (pwd: string) => `hashed_${pwd}`;
const compare = (pwd: string, hashed: string) => hash(pwd) === hashed;

export async function fetchUsers(): Promise<User[]> {
    const client = await pool.connect();
    try {
        const res = await client.query(`
            SELECT u.id, u.name, u.email, u.role, r.name as referred_by_name
            FROM users u
            LEFT JOIN users r ON u.referred_by = r.id
            ORDER BY u.name
        `);
        // Map 'referred_by_name' to 'referredBy' to match the User type
        return res.rows.map(row => ({
            ...row,
            referredBy: row.referred_by_name || 'N/A', // Use the name, or N/A
        }));
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
                // remove password hash from returned object
                const { password_hash, ...userWithoutPassword } = user;
                return userWithoutPassword;
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
        const newUser: Omit<User, 'id' | 'referenceCode'> & { password_hash: string } = {
            name,
            email: email.toLowerCase(),
            password_hash: hash(pass),
            role: code.role,
            referredBy: code.owner_id,
        };
        
        const insertRes = await client.query(
            'INSERT INTO users (id, name, email, password_hash, role, referred_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [newUserId, newUser.name, newUser.email, newUser.password_hash, newUser.role, newUser.referredBy]
        );
        
        await client.query('COMMIT');
        const { password_hash, ...userWithoutPassword } = insertRes.rows[0];
        return userWithoutPassword;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
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
            query += ` WHERE h.super_worker_id = $1 OR h.status = ANY($2::homework_status[])`;
            params.push(user.id);
            params.push(['in_progress', 'requested_changes', 'final_payment_approval', 'word_count_change', 'deadline_change', 'completed']);
            break;
        case 'worker':
            query += ' WHERE h.worker_id = $1';
            params.push(user.id);
            break;
        default:
            return [];
    }
    
    query += ' ORDER BY deadline DESC';

    try {
        const res = await client.query(query, params);
        return res.rows.map(row => ({
            ...row,
            studentId: row.student_id,
            agentId: row.agent_id,
            workerId: row.worker_id,
            superWorkerId: row.super_worker_id,
            moduleName: row.module_name,
            projectNumber: row.project_number, 
            wordCount: row.word_count, 
        }));
    } finally {
        client.release();
    }
}


export async function modifyHomework(id: string, updates: Partial<Homework>): Promise<void> {
    const client = await pool.connect();
    
    const dbUpdates: { [key: string]: any } = {};
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.workerId) dbUpdates.worker_id = updates.workerId;
    if (updates.price) dbUpdates.price = updates.price;
    
    const setClause = Object.keys(dbUpdates).map((key, i) => `${key} = $${i + 2}`).join(', ');
    const values = Object.values(dbUpdates);

    if (values.length === 0) return;

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
        const res = await client.query("SELECT id, name, email, role FROM users WHERE role = 'worker' AND referred_by = $1", [superWorkerId]);
        return res.rows;
    } finally {
        client.release();
    }
}

export async function fetchReferenceCodesForUser(userId: string): Promise<ReferenceCode[]> {
    const client = await pool.connect();
    try {
        const res = await client.query("SELECT * FROM reference_codes WHERE owner_id = $1", [userId]);
        return res.rows;
    } finally {
        client.release();
    }
}

export async function createHomework(
    student: User,
    data: {
        moduleName: string;
        projectNumber: ProjectNumber[];
        wordCount: number;
        deadline: Date;
        notes: string;
        files: { name: string; url: string }[];
    }
): Promise<Homework> {
    const client = await pool.connect();
    
    // Simplified logic for agent and pricing
    const agentId = student.referredBy; // This might need more complex logic
    const price = data.wordCount * 0.10; // Dummy price logic

    const newHomework: Omit<Homework, 'id' | 'status' | 'earnings'> = {
        studentId: student.id,
        agentId: agentId,
        moduleName: data.moduleName,
        projectNumber: data.projectNumber,
        wordCount: data.wordCount,
        deadline: data.deadline,
        notes: data.notes,
        files: data.files,
        price: price,
    };
    
    const homeworkId = `hw_${Date.now()}`;

    try {
        const res = await client.query(
            `INSERT INTO homeworks 
            (id, student_id, agent_id, status, module_name, project_number, word_count, deadline, notes, files, price) 
            VALUES ($1, $2, $3, 'payment_approval', $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [homeworkId, newHomework.studentId, newHomework.agentId, newHomework.moduleName, newHomework.projectNumber, newHomework.wordCount, newHomework.deadline, newHomework.notes, JSON.stringify(newHomework.files), newHomework.price]
        );
        return res.rows[0];
    } finally {
        client.release();
    }
}

export async function getAnalyticsForUser(user: User): Promise<AnalyticsData> {
    const client = await pool.connect();
    try {
        let metric1Query = '';
        let metric2Query = '';
        const params = [user.id];

        switch(user.role) {
            case 'student':
                metric1Query = `SELECT TO_CHAR(deadline, 'Mon') as month, SUM(price) as value FROM homeworks WHERE student_id = $1 AND status = 'completed' GROUP BY month ORDER BY month;`;
                metric2Query = `SELECT TO_CHAR(deadline, 'Mon') as month, COUNT(*) as value FROM homeworks WHERE student_id = $1 AND status = 'completed' GROUP BY month ORDER BY month;`;
                break;
            case 'agent':
                // Simplified earnings logic
                metric1Query = `SELECT TO_CHAR(deadline, 'Mon') as month, SUM(price * 0.1) as value FROM homeworks WHERE agent_id = $1 AND status = 'completed' GROUP BY month ORDER BY month;`;
                metric2Query = `SELECT TO_CHAR(deadline, 'Mon') as month, COUNT(*) as value FROM homeworks WHERE agent_id = $1 GROUP BY month ORDER BY month;`;
                break;
            case 'super_worker':
                // Simplified earnings logic
                metric1Query = `SELECT TO_CHAR(deadline, 'Mon') as month, SUM(price * 0.2) as value FROM homeworks WHERE super_worker_id = $1 AND status = 'completed' GROUP BY month ORDER BY month;`;
                metric2Query = `SELECT TO_CHAR(deadline, 'Mon') as month, COUNT(*) as value FROM homeworks WHERE super_worker_id = $1 GROUP BY month ORDER BY month;`;
                break;
            case 'super_agent':
                 // Simplified earnings logic
                metric1Query = `SELECT TO_CHAR(deadline, 'Mon') as month, SUM(price * 0.7) as value FROM homeworks WHERE status = 'completed' GROUP BY month ORDER BY month;`;
                metric2Query = `SELECT TO_CHAR(deadline, 'Mon') as month, COUNT(*) as value FROM homeworks GROUP BY month ORDER BY month;`;
                break;
            default:
                 return { metric1: [], metric2: [] };
        }

        const [metric1Res, metric2Res] = await Promise.all([
             client.query(metric1Query, user.role === 'super_agent' ? [] : params),
             client.query(metric2Query, user.role === 'super_agent' ? [] : params)
        ]);

        return {
            metric1: metric1Res.rows,
            metric2: metric2Res.rows,
        };

    } finally {
        client.release();
    }
}
