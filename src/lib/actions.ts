
'use server';

import { pool } from './db';
import type { User, Homework, HomeworkStatus, ReferenceCode, ProjectNumber, AnalyticsData, PricingConfig, Notification, UserRole, SuperAgentDashboardStats, StudentsPerAgent, HomeworkChangeRequestData, HomeworkChangeRequest } from './types';
import { differenceInDays, format, addDays } from 'date-fns';

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
    let notificationOwnerId: string | null = null;
    let newUserName: string | null = null;
    let newUserRole: UserRole | null = null;

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
        
        if (code.owner_id) {
           notificationOwnerId = code.owner_id;
           newUserName = newUser.name;
           newUserRole = newUser.role;
        }

        const { password_hash, ...userWithoutPassword } = insertRes.rows[0];
        return userWithoutPassword;

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
        
        if (notificationOwnerId && newUserName && newUserRole) {
             try {
                await createNotification({
                    userId: notificationOwnerId, 
                    message: `A new ${newUserRole}, ${newUserName}, has registered using your reference code.`
                });
            } catch (notificationError) {
                console.error("Failed to create notification after user registration:", notificationError);
            }
        }
    }
}


export async function fetchHomeworksForUser(user: User): Promise<Homework[]> {
    const client = await pool.connect();
    let query = 'SELECT h.* FROM homeworks h';
    const params: (string | HomeworkStatus[])[] = [];
    
    switch(user.role) {
        case 'super_agent':
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
            const changeRequestsRes = await client.query('SELECT * FROM homework_change_requests WHERE homework_id = $1 ORDER BY created_at DESC', [row.id]);
            
            const changeRequests = await Promise.all(changeRequestsRes.rows.map(async (cr) => {
                const crFilesRes = await client.query('SELECT file_name as name, file_url as url FROM change_request_files WHERE change_request_id = $1', [cr.id]);
                return { ...cr, files: crFilesRes.rows };
            }));

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
                earnings: row.earnings,
                changeRequests: changeRequests,
            };
        }));

        return homeworks;
    } finally {
        client.release();
    }
}

export async function modifyHomework(id: string, updates: Partial<Homework>): Promise<void> {
    const client = await pool.connect();
    const notificationsToSend: { userId: string; message: string; homeworkId: string }[] = [];
    
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
        
        if (updates.status && updates.status !== homework.status) {
            const superAgentRes = await pool.query("SELECT id FROM users WHERE role = 'super_agent' LIMIT 1");
            const superAgentId = superAgentRes.rows.length > 0 ? superAgentRes.rows[0].id : null;
            const messageBase = `Homework #${homework.id} status updated to "${updates.status.replace(/_/g, ' ')}".`

            if (superAgentId && ['final_payment_approval', 'requested_changes', 'word_count_change', 'deadline_change'].includes(updates.status)) {
                 notificationsToSend.push({ userId: superAgentId, message: messageBase, homeworkId: id });
            }

            if (updates.status === 'in_progress') {
                const superWorkerRes = await pool.query("SELECT id FROM users WHERE role = 'super_worker' LIMIT 1");
                if (superWorkerRes.rows.length > 0) {
                    notificationsToSend.push({ userId: superWorkerRes.rows[0].id, message: `New homework #${homework.id} is ready.`, homeworkId: id });
                }
            } else if (updates.status === 'completed') {
                 notificationsToSend.push({ userId: homework.student_id, message: `${messageBase} Your files are ready.`, homeworkId: id });
            } else if (updates.status === 'final_payment_approval') {
                notificationsToSend.push({ userId: homework.student_id, message: messageBase, homeworkId: id });
            }
        }
        
        await client.query('COMMIT');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error in modifyHomework:", error);
        throw error;
    } finally {
        client.release();
        
        for (const notification of notificationsToSend) {
            try {
                await createNotification(notification);
            } catch (notificationError) {
                console.error("Failed to create notification after homework modification:", notificationError);
            }
        }
    }
}

export async function requestChangesOnHomework(homeworkId: string, data: HomeworkChangeRequestData): Promise<void> {
    const client = await pool.connect();
    const notificationsToSend: { userId: string; message: string; homeworkId: string }[] = [];

    try {
        await client.query('BEGIN');

        const homeworkRes = await client.query('SELECT * FROM homeworks WHERE id = $1', [homeworkId]);
        if (homeworkRes.rows.length === 0) throw new Error("Homework not found");
        const homework = homeworkRes.rows[0];

        await client.query("UPDATE homeworks SET status = 'requested_changes' WHERE id = $1", [homeworkId]);

        const changeReqRes = await client.query(
            'INSERT INTO homework_change_requests (homework_id, notes) VALUES ($1, $2) RETURNING id',
            [homeworkId, data.notes]
        );
        const changeRequestId = changeReqRes.rows[0].id;

        if (data.files && data.files.length > 0) {
            for (const file of data.files) {
                await client.query(
                    'INSERT INTO change_request_files (change_request_id, file_name, file_url) VALUES ($1, $2, $3)',
                    [changeRequestId, file.name, file.url || '']
                );
            }
        }

        const superWorkerId = homework.super_worker_id || (await pool.query("SELECT id FROM users WHERE role = 'super_worker' LIMIT 1")).rows[0]?.id;
        const superAgentId = (await pool.query("SELECT id FROM users WHERE role = 'super_agent' LIMIT 1")).rows[0]?.id;

        const message = `Student requested changes for homework #${homeworkId}.`;
        if (superWorkerId) {
            notificationsToSend.push({ userId: superWorkerId, message, homeworkId });
        }
        if (superAgentId) {
             notificationsToSend.push({ userId: superAgentId, message, homeworkId });
        }
        
        await client.query('COMMIT');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error in requestChangesOnHomework:", error);
        throw error;
    } finally {
        client.release();

        for (const notification of notificationsToSend) {
            try {
                await createNotification(notification);
            } catch (notificationError) {
                console.error("Failed to create notification for change request:", notificationError);
            }
        }
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

export async function createReferenceCode(code: string, role: UserRole, ownerId: string): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query(
            "INSERT INTO reference_codes (code, role, owner_id) VALUES ($1, $2, $3)",
            [code.toUpperCase(), role, ownerId]
        );
    } catch (error: any) {
        if (error.code === '23505') { 
            throw new Error(`Reference code "${code.toUpperCase()}" already exists.`);
        }
        throw error;
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
    const homeworkId = String(Math.floor(10000 + Math.random() * 90000));
    let createdHomework: Homework | null = null;
    let message: string = '';
    
    let notificationDetails: { userId: string; message: string; homeworkId: string } | null = null;

    try {
        await client.query('BEGIN');
        
        const pricingConfig = await getPricingConfig();
        const studentDetails = (await client.query('SELECT * FROM users WHERE id = $1', [student.id])).rows[0];
        const agent = studentDetails.referred_by ? (await client.query('SELECT * FROM users WHERE id = $1', [studentDetails.referred_by])).rows[0] : null;
        const finalPrice = await getCalculatedPrice(data.wordCount, data.deadline);

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
        
        const createdHomeworkRow = res.rows[0];
        createdHomework = {
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
        message = `Your homework has been submitted successfully. The total price is £${finalPrice.toFixed(2)}. Please use the homework ID #${createdHomework.id} as the reference for your payment.`;
        
        await client.query('COMMIT');

    } catch(e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
    
    // Create notification after transaction is committed
    const superAgentRes = await pool.query("SELECT id FROM users WHERE role = 'super_agent' LIMIT 1");
    if (superAgentRes.rows.length > 0) {
        notificationDetails = {
            userId: superAgentRes.rows[0].id,
            message: `New homework #${homeworkId} from ${student.name} requires payment approval.`,
            homeworkId: homeworkId
        };
        try {
            await createNotification(notificationDetails);
        } catch (notificationError) {
            console.error("Failed to create notification after homework creation:", notificationError);
        }
    }


    return { homework: createdHomework!, message: message! };
}

export async function getAnalyticsForUser(user: User, from?: Date, to?: Date): Promise<AnalyticsData> {
    const client = await pool.connect();
    
    const fromDate = from || new Date('1970-01-01');
    const toDate = to || new Date();

    const dateRangeInDays = differenceInDays(toDate, fromDate);
    const groupByMonth = dateRangeInDays > 31;
    const dateFormat = groupByMonth ? 'YYYY-MM' : 'YYYY-MM-DD';
    
    try {
        let metric1Query = '';
        let metric2Query = '';
        const params: (string | Date)[] = [ format(fromDate, 'yyyy-MM-dd'), format(addDays(toDate, 1), 'yyyy-MM-dd') ];

        const dateFilter = ` AND deadline::date BETWEEN $1 AND $2`;
        let userFilter = '';

        const groupByClause = `GROUP BY 1 ORDER BY 1`;

        switch(user.role) {
            case 'student':
                userFilter = ` AND student_id = $3`;
                params.push(user.id);
                metric1Query = `SELECT TO_CHAR(deadline, '${dateFormat}') as date, SUM(price) as value FROM homeworks WHERE status NOT IN ('declined', 'refund') ${dateFilter} ${userFilter} ${groupByClause}`;
                metric2Query = `SELECT TO_CHAR(deadline, '${dateFormat}') as date, COUNT(*) as value FROM homeworks WHERE 1=1 ${dateFilter} ${userFilter} ${groupByClause}`;
                break;
            case 'agent':
                userFilter = ` AND h.student_id IN (SELECT id FROM users WHERE referred_by = $3)`;
                params.push(user.id);
                metric1Query = `SELECT TO_CHAR(h.deadline, '${dateFormat}') as date, SUM((h.earnings->>'agent')::numeric) as value FROM homeworks h WHERE h.status = 'completed' ${dateFilter} ${userFilter} ${groupByClause}`;
                metric2Query = `SELECT TO_CHAR(h.deadline, '${dateFormat}') as date, COUNT(*) as value FROM homeworks h WHERE 1=1 ${dateFilter} ${userFilter} ${groupByClause}`;
                break;
            case 'super_worker':
                metric1Query = `SELECT TO_CHAR(deadline, '${dateFormat}') as date, SUM((earnings->>'super_worker')::numeric) as value FROM homeworks WHERE status = 'completed' ${dateFilter} ${groupByClause}`;
                metric2Query = `SELECT TO_CHAR(deadline, '${dateFormat}') as date, COUNT(*) as value FROM homeworks WHERE 1=1 ${dateFilter} ${groupByClause}`;
                break;
            case 'super_agent':
                 metric1Query = `SELECT TO_CHAR(deadline, '${dateFormat}') as date, SUM((earnings->>'profit')::numeric) as value FROM homeworks WHERE status = 'completed' ${dateFilter} ${groupByClause}`;
                 metric2Query = `SELECT TO_CHAR(deadline, '${dateFormat}') as date, COUNT(*) as value FROM homeworks WHERE 1=1 ${dateFilter} ${groupByClause}`;
                 break;
            default:
                 return { metric1: [], metric2: [] };
        }

        const [metric1Res, metric2Res] = await Promise.all([
             client.query(metric1Query, params),
             client.query(metric2Query, params)
        ]);

        const formatAnalytics = (rows: any[]) => {
            return rows.map(r => ({
                date: r.date,
                value: parseFloat(r.value) || 0
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

export async function getSuperAgentDashboardStats(): Promise<SuperAgentDashboardStats> {
    const client = await pool.connect();
    try {
        const statsRes = await client.query(`
             SELECT 
                (SELECT COALESCE(SUM(price), 0) FROM homeworks WHERE status = 'completed') as total_revenue,
                (SELECT COALESCE(SUM((earnings->>'profit')::numeric), 0) FROM homeworks WHERE status = 'completed') as total_profit,
                (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students
        `);
        
        const { total_revenue, total_profit, total_students } = statsRes.rows[0];
        const homeworkCountRes = await client.query("SELECT COUNT(*) FROM homeworks WHERE status = 'completed'");
        const homeworkCount = parseInt(homeworkCountRes.rows[0].count, 10);
        
        const average_profit_per_homework = homeworkCount > 0 ? parseFloat(total_profit) / homeworkCount : 0;
        
        const agentStudentsRes = await client.query<StudentsPerAgent>(`
            SELECT u.name as "agentName", COUNT(s.id) as "studentCount"
            FROM users u
            JOIN users s ON s.referred_by = u.id
            WHERE u.role = 'agent'
            GROUP BY u.name
            ORDER BY "studentCount" DESC
        `);
        
        return {
            totalRevenue: parseFloat(total_revenue),
            totalProfit: parseFloat(total_profit),
            totalStudents: parseInt(total_students, 10),
            averageProfitPerHomework: average_profit_per_homework,
            studentsPerAgent: agentStudentsRes.rows.map(r => ({...r, studentCount: Number(r.studentCount)}))
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
        
        let query = "SELECT * FROM notifications WHERE user_id = $1";
        const params: string[] = [userId];

        if (userRole === 'super_agent') {
            query += ` OR user_id = 'super_agent_notifications'`;
        } else if (userRole === 'super_worker') {
            query += ` OR user_id = 'super_worker_notifications'`;
        }
        
        query += " ORDER BY created_at DESC";

        const res = await client.query(query, params);
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
    } catch (error) {
        console.error('Failed to create notification:', { userId, message, homeworkId, error });
        // Do not re-throw as this is often a non-critical background task
    }
    finally {
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
