import { User, ReferenceCode, Homework, UserRole } from './types';

// Simple password hashing for dummy data
const hash = (pwd: string) => `hashed_${pwd}`;

export const users: User[] = [
  { id: 'user_superagent', name: 'Super Agent', email: 'superagent@agent.com', password_hash: hash('123456'), role: 'super_agent', referenceCode: null, referredBy: 'god_user' },
  { id: 'user_agent', name: 'Agent', email: 'agent@agent.com', password_hash: hash('123456'), role: 'agent', referenceCode: 'AGNT', referredBy: 'user_superagent' },
  { id: 'user_superworker', name: 'Super Worker', email: 'superworker@worker.com', password_hash: hash('123456'), role: 'super_worker', referenceCode: 'WORK', referredBy: 'user_superagent' },
  { id: 'user_worker', name: 'Worker', email: 'worker@worker.com', password_hash: hash('123456'), role: 'worker', referenceCode: null, referredBy: 'user_superworker' },
  { id: 'user_client_from_sa', name: 'SA Client', email: 'client@client.com', password_hash: hash('123456'), role: 'student', referenceCode: null, referredBy: 'user_superagent' },
  { id: 'user_client_from_agent', name: 'Agent Client', email: 'clientagent@client.com', password_hash: hash('123456'), role: 'student', referenceCode: null, referredBy: 'user_agent' },
];

export const referenceCodes: ReferenceCode[] = [
  { code: 'GODZ', ownerId: 'god_user', type: 'AGENT' }, // Special code for initial super agent
  { code: 'SUPC', ownerId: 'user_superagent', type: 'STUDENT' },
  { code: 'SUPA', ownerId: 'user_superagent', type: 'AGENT' },
  { code: 'SUPW', ownerId: 'user_superagent', type: 'WORKER' },
  { code: 'AGNT', ownerId: 'user_agent', type: 'STUDENT' },
  { code: 'WORK', ownerId: 'user_superworker', type: 'WORKER' },
];

export const homeworks: Homework[] = [
  {
    id: 'hw_1234',
    studentId: 'user_client_from_sa',
    status: 'payment_approval',
    moduleName: 'Advanced Quantum Physics',
    projectNumber: ['A1'],
    wordCount: 1500,
    deadline: new Date('2025-08-15T23:59:59'),
    notes: 'Please focus on the Schrödinger equation part.',
    files: [],
    price: 150,
    earnings: { total: 150, super_worker: 18.75, profit: 131.25 }
  },
  {
    id: 'hw_1235',
    studentId: 'user_client_from_agent',
    agentId: 'user_agent',
    status: 'in_progress',
    workerId: 'user_worker',
    moduleName: 'History of Ancient Rome',
    projectNumber: ['A2', 'A3'],
    wordCount: 2500,
    deadline: new Date('2025-08-20T23:59:59'),
    notes: 'Need a detailed analysis of the Punic Wars.',
    files: [],
    price: 250,
    earnings: { total: 250, agent: 50, super_worker: 31.25, profit: 168.75 }
  },
  {
    id: 'hw_1236',
    studentId: 'user_client_from_sa',
    status: 'completed',
    workerId: 'user_worker',
    moduleName: 'Introduction to Marketing',
    projectNumber: ['Full Project'],
    wordCount: 5000,
    deadline: new Date('2025-07-30T23:59:59'),
    notes: 'Completed project on SWOT analysis.',
    files: [{ name: 'final_submission.pdf', url: '#' }],
    price: 500,
    earnings: { total: 500, super_worker: 62.50, profit: 437.50 }
  },
];
