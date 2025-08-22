export type UserRole = 'super_agent' | 'agent' | 'super_worker' | 'worker' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash?: string; // Should not be sent to client
  role: UserRole;
  referenceCode: string | null; // This is for the user's *own* code, fetched separately
  referredBy: string | null; // User ID of referrer
}

export type ReferenceCodeType = 'STUDENT' | 'AGENT' | 'WORKER' | 'SUPER_WORKER';

export interface ReferenceCode {
  code: string;
  owner_id: string;
  type: ReferenceCodeType;
  role: UserRole;
}

export type HomeworkStatus =
  | 'payment_approval'
  | 'in_progress'
  | 'requested_changes'
  | 'final_payment_approval'
  | 'word_count_change'
  | 'deadline_change'
  | 'declined'
  | 'refund'
  | 'completed';

export type ProjectNumber = 'A1' | 'A2' | 'A3' | 'A4' | 'Full Project';
  
export interface HomeworkFile {
    id: number;
    homework_id: string;
    file_name: string;
    file_url: string;
    uploaded_at: Date;
}

export interface Homework {
  id: string;
  studentId: string;
  agentId?: string;
  workerId?: string;
  superWorkerId?: string;
  status: HomeworkStatus;
  moduleName: string;
  projectNumber: ProjectNumber[];
  wordCount: number;
  deadline: Date;
  notes: string;
  files?: { name: string; url: string }[];
  price?: number;
  earnings?: {
    total: number;
    agent?: number;
    super_worker?: number;
    profit: number;
  }
}

export interface Notification {
    id: number;
    user_id: string;
    message: string;
    is_read: boolean;
    created_at: Date;
    homework_id: string | null;
}

export interface AnalyticsData {
  metric1: { month: string; value: number }[];
  metric2: { month: string; value: number }[];
}

export interface StudentsPerAgent {
  agentName: string;
  studentCount: number;
}

export interface SuperAgentDashboardStats {
    totalRevenue: number;
    totalProfit: number;
    totalStudents: number;
    averageProfitPerHomework: number;
    studentsPerAgent: StudentsPerAgent[];
}

export interface WordTier {
    [key: number]: number;
}

export interface FeeTier {
    agent: number;
    super_worker: number;
}

export interface DeadlineTier {
    [key: number]: number;
}

export interface PricingConfig {
    wordTiers: WordTier;
    fees: FeeTier;
    deadlineTiers: DeadlineTier;
}

    