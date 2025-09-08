// Shared status colors for homework status badges
// This ensures consistency across all components that display homework status

import type { HomeworkStatus } from './types';

export const statusColors: Record<HomeworkStatus, string> = {
  payment_approval: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
  in_progress: "bg-blue-500/20 text-blue-700 border-blue-500/30",
  requested_changes: "bg-orange-500/20 text-orange-700 border-orange-500/30",
  final_payment_approval: "bg-green-500/20 text-green-700 border-green-500/30",
  word_count_change: "bg-purple-500/20 text-purple-700 border-purple-500/30",
  deadline_change: "bg-indigo-500/20 text-indigo-700 border-indigo-500/30",
  declined: "bg-red-500/20 text-red-700 border-red-500/30",
  refund: "bg-gray-500/20 text-gray-700 border-gray-500/30",
  completed: "bg-teal-500/20 text-teal-700 border-teal-500/30",
  assigned_to_super_worker: "bg-cyan-500/20 text-cyan-700 border-cyan-500/30",
  assigned_to_worker: "bg-violet-500/20 text-violet-700 border-violet-500/30",
  worker_draft: "bg-amber-500/20 text-amber-700 border-amber-500/30",
};