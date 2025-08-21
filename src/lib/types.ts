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
    id: string;
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
  status: HomeworkStatus;
  moduleName: string;
  projectNumber: ProjectNumber[];
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
