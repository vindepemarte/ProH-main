export type UserRole = 'super_agent' | 'agent' | 'super_worker' | 'worker' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  referenceCode: string | null;
  referredBy: string | null; // User ID of referrer
}

export type ReferenceCodeType = 'STUDENT' | 'AGENT' | 'WORKER';

export interface ReferenceCode {
  code: string;
  ownerId: string;
  type: ReferenceCodeType;
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

export interface Homework {
  id: string;
  studentId: string;
  agentId?: string;
  workerId?: string;
  status: HomeworkStatus;
  moduleName: string;
  projectNumber: ('A1' | 'A2' | 'A3' | 'A4' | 'Full Project')[];
  wordCount: number;
  deadline: Date;
  notes: string;
  files: { name: string; url: string }[];
  price?: number;
  earnings?: {
    total: number;
    agent?: number;
    super_worker?: number;
    profit: number;
  }
}
