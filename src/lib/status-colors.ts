import type { HomeworkStatus } from "./types";

export const statusColors: Record<HomeworkStatus, string> = {
  'payment_approval': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'assigned_to_super_worker': 'bg-blue-100 text-blue-800 border-blue-300',
  'assigned_to_worker': 'bg-purple-100 text-purple-800 border-purple-300',
  'in_progress': 'bg-orange-100 text-orange-800 border-orange-300',
  'worker_draft': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  'requested_changes': 'bg-red-100 text-red-800 border-red-300',
  'final_payment_approval': 'bg-amber-100 text-amber-800 border-amber-300',
  'word_count_change': 'bg-cyan-100 text-cyan-800 border-cyan-300',
  'deadline_change': 'bg-teal-100 text-teal-800 border-teal-300',
  'declined': 'bg-gray-100 text-gray-800 border-gray-300',
  'refund': 'bg-pink-100 text-pink-800 border-pink-300',
  'completed': 'bg-green-100 text-green-800 border-green-300'
};