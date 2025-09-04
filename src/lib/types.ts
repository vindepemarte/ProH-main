
export type UserRole = 'super_agent' | 'agent' | 'super_worker' | 'worker' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash?: string; // Should not be sent to client
  role: UserRole;
  referenceCode: string | null; // This is for the user's *own* code, fetched separately
  referredBy: string | null; // User ID of referrer
  termsAccepted?: boolean; // Terms and conditions acceptance
  termsAcceptedAt?: Date; // When terms were accepted
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
  | 'assigned_to_super_worker'
  | 'assigned_to_worker'
  | 'in_progress'
  | 'worker_draft'
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
    uploaded_by?: string;
    file_type?: 'student_original' | 'worker_draft' | 'super_worker_review' | 'final_approved';
    is_latest?: boolean;
}

export interface HomeworkChangeRequest {
    id: number;
    homework_id: string;
    notes: string;
    created_at: Date;
    files?: { name: string; url: string }[];
}

export interface HomeworkChangeRequestData {
    notes: string;
    files: { name: string; url: string }[];
}

export interface SuperWorkerFee {
  super_worker_id: string;
  fee_per_500: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface SuperWorkerWithFee extends User {
  fee_per_500: number;
}

export interface Homework {
  id: string;
  studentId: string;
  agentId?: string;
  workerId?: string;
  superWorkerId?: string; // This is the assigned super worker ID
  assignedSuperWorkerName?: string; // Name of the assigned super worker for display
  status: HomeworkStatus;
  moduleName: string;
  projectNumber: ProjectNumber[];
  wordCount: number;
  deadline: Date;
  notes: string;
  files?: { name: string; url: string }[]; // Original student files
  draftFiles?: any[]; // Worker draft files
  reviewedFiles?: any[]; // Super worker reviewed files
  finalFiles?: any[]; // Final approved files
  allFiles?: any[]; // All files for comprehensive view
  price?: number;
  earnings?: {
    total: number;
    agent?: number;
    super_worker?: number;
    profit: number;
  },
  changeRequests?: HomeworkChangeRequest[];
}

export interface Notification {
    id: number;
    user_id: string;
    message: string;
    is_read: boolean;
    created_at: Date;
    homework_id: string | null;
    source?: 'system' | 'broadcast'; // New field to distinguish notification types
}

export interface AnalyticsData {
  metric1: { date: string; value: number }[];
  metric2: { date: string; value: number }[];
}

export interface StudentsPerAgent {
  agentName: string;
  studentCount: number;
  toBePaid: number; // Current month payments
}

export interface SuperWorkersData {
  superWorkerName: string;
  toBePaid: number; // Current month payments
  assignmentsDone: number; // Completed assignments
}

export interface SuperAgentDashboardStats {
    totalRevenue: number;
    totalProfit: number;
    totalStudents: number;
    averageProfitPerHomework: number;
    totalPlatformFees: number;
    toBePaidSuperWorker: number; // New field
    toBePaidAgents: number; // New field
    studentsPerAgent: StudentsPerAgent[];
    superWorkersData: SuperWorkersData[]; // New field
}

export interface WordTier {
    [key: number]: number;
}

export interface FeeTier {
    agent: number;
    super_worker: number; // Global fallback fee - individual super worker fees are managed in super_worker_fees table
}

export interface DeadlineTier {
    [key: number]: number;
}

export interface PricingConfig {
    wordTiers: WordTier;
    fees: FeeTier;
    deadlineTiers: DeadlineTier;
}

export interface NotificationTemplate {
    id: string;
    name: string;
    description: string;
    template: string;
    variables: string[]; // Available variables like {studentName}, {homeworkId}, etc.
}

export interface NotificationTemplates {
    // User Management
    newHomeworkSubmission: NotificationTemplate;
    userRegistration: NotificationTemplate;
    roleChange: NotificationTemplate;
    
    // Status Updates - Generic
    homeworkStatusUpdate: NotificationTemplate;
    
    // Status Updates - Specific
    homeworkInProgress: NotificationTemplate;
    workerAssignment: NotificationTemplate;
    finalPaymentApproval: NotificationTemplate;
    finalReview: NotificationTemplate;
    homeworkCompleted: NotificationTemplate;
    homeworkCompletedAgent: NotificationTemplate;
    homeworkCompletedSuperAgent: NotificationTemplate;
    
    // Change Requests
    changeRequest: NotificationTemplate;
    superWorkerChangeRequest: NotificationTemplate;
    
    // File Operations
    fileUpload: NotificationTemplate;
    workerDraftUpload: NotificationTemplate;
    superWorkerReviewUpload: NotificationTemplate;
    finalFilesReady: NotificationTemplate;
    
    // Payment Operations
    paymentApproval: NotificationTemplate;
    
    // Legacy - keep for backward compatibility
    completed: NotificationTemplate;
    homeworkSubmitted: NotificationTemplate;
}

    
