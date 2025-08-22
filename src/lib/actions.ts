'use server';

import { pool } from './db';
import type { User, Homework, HomeworkStatus, ReferenceCode, ProjectNumber, AnalyticsData, PricingConfig, Notification, UserRole } from './types';
import { differenceInDays } from 'date-fns';

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
        return res.rows.map(row => ({
            ...row,
            id: row.id,
            name: row.name,
            email: row.email,
            role: row.role,
            referredBy: row.referred_by_name || 'N/A',
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
        
        if (code.owner_id) {
            await createNotification({
                userId: code.owner_id, // Notify the person who owns the code
                message: `A new ${newUser.role}, ${newUser.name}, has registered using your reference code.`
            });
        }
        
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
            query += ' JOIN users s ON h.student_id = s.id WHERE s.referred_by = $1';
            params.push(user.id);
            break;
        case 'student':
            query += ' WHERE h.student_id = $1';
            params.push(user.id);
            break;
        case 'super_worker':
             query += ` WHERE h.status IN ('in_progress', 'requested_changes', 'final_payment_approval', 'word_count_change', 'deadline_change', 'completed')`;
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
        
        const homeworks = await Promise.all(res.rows.map(async (row) => {
            const filesRes = await client.query('SELECT file_name as name, file_url as url FROM homework_files WHERE homework_id = $1', [row.id]);
            return {
                ...row,
                studentId: row.student_id,
                agentId: row.agent_id,
                workerId: row.worker_id,
                superWorkerId: row.super_worker_id,
                moduleName: row.module_name,
                projectNumber: row.project_number, 
                wordCount: row.word_count,
                files: filesRes.rows,
                earnings: row.earnings
            };
        }));

        return homeworks;
    } finally {
        client.release();
    }
}

export async function modifyHomework(id: string, updates: Partial<Homework>): Promise<void> {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const homeworkRes = await client.query('SELECT * FROM homeworks WHERE id = $1', [id]);
        if (homeworkRes.rows.length === 0) throw new Error("Homework not found");
        const homework = homeworkRes.rows[0];

        const dbUpdates: { [key: string]: any } = {};
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.workerId) dbUpdates.worker_id = updates.workerId;
        if (updates.price) dbUpdates.price = updates.price;
        
        const setClause = Object.keys(dbUpdates).map((key, i) => `${key} = $${i + 2}`).join(', ');
        const values = Object.values(dbUpdates);

        if (values.length > 0) {
            const query = `UPDATE homeworks SET ${setClause} WHERE id = $1`;
            await client.query(query, [id, ...values]);
        }

        // --- Handle Notifications based on Status Change ---
        if (updates.status && updates.status !== homework.status) {
            const messageBase = `Homework #${id.split('_')[1]} status has been updated to "${updates.status.replace(/_/g, ' ')}".`
            if (updates.status === 'in_progress') {
                // Find and notify the first available super_worker
                const superWorkerRes = await client.query("SELECT id FROM users WHERE role = 'super_worker' LIMIT 1");
                if (superWorkerRes.rows.length > 0) {
                    await createNotification({ userId: superWorkerRes.rows[0].id, message: `New homework #${id.split('_')[1]} is ready for assignment.`, homeworkId: id });
                }
            } else if (updates.status === 'completed') {
                 await createNotification({ userId: homework.student_id, message: `${messageBase} Your files are ready for download.`, homeworkId: id });
            } else if (updates.status === 'final_payment_approval') {
                const superAgentRes = await client.query("SELECT id FROM users WHERE role = 'super_agent' LIMIT 1");
                if (superAgentRes.rows.length > 0) {
                    await createNotification({ userId: superAgentRes.rows[0].id, message: `Homework #${id.split('_')[1]} is ready for final approval.`, homeworkId: id });
                }
            } else if (updates.status === 'requested_changes') {
                 const superWorkerId = homework.super_worker_id || (await client.query("SELECT id FROM users WHERE role = 'super_worker' LIMIT 1")).rows[0]?.id;
                 if (superWorkerId) {
                     await createNotification({ userId: superWorkerId, message: `The student has requested changes for homework #${id.split('_')[1]}.`, homeworkId: id });
                 }
            }
        }
        
        await client.query('COMMIT');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error in modifyHomework:", error);
        throw error;
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

export async function fetchAllReferenceCodes(): Promise<ReferenceCode[]> {
    const client = await pool.connect();
    try {
        const res = await client.query("SELECT * FROM reference_codes");
        return res.rows;
    } finally {
        client.release();
    }
}

export async function updateReferenceCode(oldCode: string, newCode: string): Promise<ReferenceCode> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Check if the new code already exists
        const existingCodeRes = await client.query('SELECT * FROM reference_codes WHERE code = $1', [newCode.toUpperCase()]);
        if (existingCodeRes.rows.length > 0) {
            throw new Error(`Reference code "${newCode.toUpperCase()}" already exists.`);
        }
        
        const res = await client.query("UPDATE reference_codes SET code = $1 WHERE code = $2 RETURNING *", [newCode.toUpperCase(), oldCode]);
        if(res.rows.length === 0) throw new Error("Original code not found");

        await client.query('COMMIT');
        return res.rows[0];
    } catch(e) {
        await client.query('ROLLBACK');
        throw e;
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
): Promise<{homework: Homework, message: string}> {
    const client = await pool.connect();
    const homeworkId = `hw_${Date.now()}`;
    
    const pricingConfig = await getPricingConfig();
    const studentDetails = (await client.query('SELECT * FROM users WHERE id = $1', [student.id])).rows[0];
    const agent = studentDetails.referred_by ? (await client.query('SELECT * FROM users WHERE id = $1', [studentDetails.referred_by])).rows[0] : null;
    const finalPrice = await getCalculatedPrice(data.wordCount, data.deadline);

    // Calculate earnings
    const agentFeePer500 = pricingConfig.fees.agent;
    const superWorkerFeePer500 = pricingConfig.fees.super_worker;

    const agentPay = agent ? (agentFeePer500 * (data.wordCount / 500)) : 0;
    const superWorkerPay = superWorkerFeePer500 * (data.wordCount / 500);

    const profit = finalPrice - agentPay - superWorkerPay;

    const earnings = {
        total: finalPrice,
        agent: agentPay > 0 ? agentPay : undefined,
        super_worker: superWorkerPay,
        profit: profit
    };
    
    const superAgentRes = await client.query("SELECT id FROM users WHERE role = 'super_agent' LIMIT 1");
    if (superAgentRes.rows.length === 0) throw new Error("No super agent found in the system to notify.");
    const superAgentId = superAgentRes.rows[0].id;


    try {
        await client.query('BEGIN');

        const res = await client.query(
            `INSERT INTO homeworks 
            (id, student_id, agent_id, status, module_name, project_number, word_count, deadline, notes, price, earnings) 
            VALUES ($1, $2, $3, 'payment_approval', $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [homeworkId, student.id, agent?.id, data.moduleName, data.projectNumber, data.wordCount, data.deadline, data.notes, finalPrice, JSON.stringify(earnings)]
        );

        if (data.files && data.files.length > 0) {
            for (const file of data.files) {
                 await client.query(
                    'INSERT INTO homework_files (homework_id, file_name, file_url) VALUES ($1, $2, $3)',
                    [homeworkId, file.name, file.url || '']
                );
            }
        }
        
        await createNotification({
            userId: superAgentId,
            message: `New homework #${homeworkId.split('_')[1]} from ${student.name} requires payment approval.`,
            homeworkId: homeworkId
        });

        await client.query('COMMIT');
        
        const createdHomeworkRow = res.rows[0];
        const createdHomework = {
            ...createdHomeworkRow,
             studentId: createdHomeworkRow.student_id,
            agentId: createdHomeworkRow.agent_id,
            workerId: createdHomeworkRow.worker_id,
            superWorkerId: createdHomeworkRow.super_worker_id,
            moduleName: createdHomeworkRow.module_name,
            projectNumber: createdHomeworkRow.project_number, 
            wordCount: createdHomeworkRow.word_count,
            files: data.files,
            earnings: createdHomeworkRow.earnings
        };
        
        return {
            homework: createdHomework,
            message: `Your homework has been submitted successfully. The total price is £${finalPrice.toFixed(2)}. Please use the homework ID #${createdHomework.id.split('_')[1]} as the reference for your payment.`
        };
    } catch(e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

export async function getAnalyticsForUser(user: User): Promise<AnalyticsData> {
    const client = await pool.connect();
    try {
        let metric1Query = '';
        let metric2Query = '';
        const params: string[] = [user.id];

        switch(user.role) {
            case 'student':
                metric1Query = `SELECT TO_CHAR(deadline, 'YYYY-MM') as month, SUM(price) as value FROM homeworks WHERE student_id = $1 AND status = 'completed' GROUP BY 1 ORDER BY 1`;
                metric2Query = `SELECT TO_CHAR(deadline, 'YYYY-MM') as month, COUNT(*) as value FROM homeworks WHERE student_id = $1 GROUP BY 1 ORDER BY 1`;
                break;
            case 'agent':
                metric1Query = `SELECT TO_CHAR(h.deadline, 'YYYY-MM') as month, SUM((h.earnings->>'agent')::numeric) as value FROM homeworks h JOIN users s ON h.student_id = s.id WHERE s.referred_by = $1 AND h.status = 'completed' GROUP BY 1 ORDER BY 1`;
                metric2Query = `SELECT TO_CHAR(h.deadline, 'YYYY-MM') as month, COUNT(*) as value FROM homeworks h JOIN users s ON h.student_id = s.id WHERE s.referred_by = $1 GROUP BY 1 ORDER BY 1`;
                break;
            case 'super_worker':
                metric1Query = `SELECT TO_CHAR(deadline, 'YYYY-MM') as month, SUM((earnings->>'super_worker')::numeric) as value FROM homeworks WHERE status = 'completed' GROUP BY 1 ORDER BY 1`;
                metric2Query = `SELECT TO_CHAR(deadline, 'YYYY-MM') as month, COUNT(*) as value FROM homeworks GROUP BY 1 ORDER BY 1`;
                 params.pop();
                break;
            case 'super_agent':
                 metric1Query = `SELECT TO_CHAR(deadline, 'YYYY-MM') as month, SUM((earnings->>'profit')::numeric) as value FROM homeworks WHERE status = 'completed' GROUP BY 1 ORDER BY 1`;
                 metric2Query = `SELECT TO_CHAR(deadline, 'YYYY-MM') as month, COUNT(*) as value FROM homeworks GROUP BY 1 ORDER BY 1`;
                 params.pop(); // No user id needed for super agent
                 break;
            default:
                 return { metric1: [], metric2: [] };
        }

        const [metric1Res, metric2Res] = await Promise.all([
             client.query(metric1Query, params),
             client.query(metric2Query, params)
        ]);

        const formatAnalytics = (rows: any[]) => {
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return rows.map(r => ({
                month: monthNames[new Date(r.month).getMonth()],
                value: parseFloat(r.value)
            }));
        }

        return {
            metric1: formatAnalytics(metric1Res.rows),
            metric2: formatAnalytics(metric2Res.rows),
        };

    } finally {
        client.release();
    }
}

export async function getPricingConfig(): Promise<PricingConfig> {
    const client = await pool.connect();
    try {
        const res = await client.query("SELECT config FROM pricing_config WHERE id = 'main'");
        if (res.rows.length === 0) {
            throw new Error("Pricing config not found");
        }
        return res.rows[0].config;
    } finally {
        client.release();
    }
}

export async function savePricingConfig(config: PricingConfig): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query("UPDATE pricing_config SET config = $1 WHERE id = 'main'", [config]);
    } finally {
        client.release();
    }
}

export async function getCalculatedPrice(wordCount: number, deadline: Date): Promise<number> {
    const pricingConfig = await getPricingConfig();
    
    const wordTiers = pricingConfig.wordTiers;
    const sortedTiers = Object.keys(wordTiers).map(Number).sort((a,b) => a - b);
    
    let basePrice = 0;

    const closestWordTier = sortedTiers.find(tier => tier >= wordCount);

    if (closestWordTier) {
        basePrice = wordTiers[closestWordTier];
    } else {
        const highestTier = sortedTiers[sortedTiers.length -1];
        const pricePerWord = wordTiers[highestTier] / highestTier;
        basePrice = pricePerWord * wordCount;
    }


    const daysUntilDeadline = differenceInDays(deadline, new Date());
    let deadlineCharge = 0;
    if (daysUntilDeadline <= 1) deadlineCharge = pricingConfig.deadlineTiers[1] || 0;
    else if (daysUntilDeadline <= 3) deadlineCharge = pricingConfig.deadlineTiers[3] || 0;
    else if (daysUntilDeadline <= 7) deadlineCharge = pricingConfig.deadlineTiers[7] || 0;
    
    return basePrice + deadlineCharge;
}

export async function fetchNotificationsForUser(userId: string): Promise<Notification[]> {
    const client = await pool.connect();
    try {
        const userRes = await client.query('SELECT role FROM users WHERE id = $1', [userId]);
        if(userRes.rows.length === 0) return [];
        const userRole = userRes.rows[0].role;
        
        const res = await client.query(
            "SELECT * FROM notifications WHERE user_id = $1 OR ($2 = 'super_agent' AND user_id = 'super_agent') OR ($2 = 'super_worker' AND user_id = 'super_worker') ORDER BY created_at DESC",
            [userId, userRole]
        );
        return res.rows;
    } finally {
        client.release();
    }
}


export async function createNotification({ userId, message, homeworkId }: { userId: string; message: string; homeworkId?: string }): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query(
            'INSERT INTO notifications (user_id, message, homework_id) VALUES ($1, $2, $3)',
            [userId, message, homeworkId]
        );
    } finally {
        client.release();
    }
}

export async function broadcastNotification({ targetRole, targetUser, message }: { targetRole?: UserRole, targetUser?: string, message: string }): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        if (targetUser) {
            await createNotification({ userId: targetUser, message });
        } else if (targetRole) {
            const usersRes = await client.query('SELECT id FROM users WHERE role = $1', [targetRole]);
            for (const user of usersRes.rows) {
                await createNotification({ userId: user.id, message });
            }
        } else {
             throw new Error("Either a target role or a target user must be specified.");
        }
        await client.query('COMMIT');
    } catch(e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

export async function updateUserRole(userId: string, newRole: UserRole): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query("UPDATE users SET role = $1 WHERE id = $2", [newRole, userId]);
        await createNotification({ userId, message: `An administrator has changed your role to ${newRole.replace(/_/g, ' ')}.` });
    } finally {
        client.release();
    }
}

export async function markNotificationsAsRead(userId: string): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query("UPDATE notifications SET is_read = true WHERE user_id = $1", [userId]);
    } finally {
        client.release();
    }
}
