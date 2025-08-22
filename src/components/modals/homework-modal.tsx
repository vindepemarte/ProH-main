
"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useAppContext } from "@/contexts/app-context"
import { Badge } from "../ui/badge"
import { cn } from "@/lib/utils"
import { HomeworkStatus, HomeworkChangeRequest } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { FileDown, Paperclip, PencilRuler, History, MessageSquare, Check } from "lucide-react"
import { ScrollArea } from "../ui/scroll-area"

const statusColors: Record<HomeworkStatus, string> = {
  payment_approval: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
  in_progress: "bg-blue-500/20 text-blue-700 border-blue-500/30",
  requested_changes: "bg-orange-500/20 text-orange-700 border-orange-500/30",
  final_payment_approval: "bg-green-500/20 text-green-700 border-green-500/30",
  word_count_change: "bg-purple-500/20 text-purple-700 border-purple-500/30",
  deadline_change: "bg-indigo-500/20 text-indigo-700 border-indigo-500/30",
  declined: "bg-red-500/20 text-red-700 border-red-500/30",
  refund: "bg-gray-500/20 text-gray-700 border-gray-500/30",
  completed: "bg-teal-500/20 text-teal-700 border-teal-500/30",
};

interface HomeworkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ChangeRequestHistory({ requests }: { requests: HomeworkChangeRequest[] }) {
    if (!requests || requests.length === 0) return null;

    return (
        <div className="mt-4 pt-4 border-t">
            <h3 className="flex items-center gap-2 font-semibold mb-2"><History className="w-5 h-5"/> Change History</h3>
            <div className="space-y-4">
                {requests.map((req) => (
                    <div key={req.id} className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground font-medium">{new Date(req.created_at).toLocaleString()}</p>
                        {req.notes && <p className="mt-1 flex gap-2"><MessageSquare className="w-4 h-4 mt-0.5 shrink-0"/> {req.notes}</p>}
                        {req.files && req.files.length > 0 && (
                            <div className="mt-2 flex flex-col gap-2">
                                {req.files.map((file, i) => (
                                     <Button key={i} variant="outline" size="sm" className="justify-start gap-2">
                                        <Paperclip className="w-4 h-4"/> {file.name}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function HomeworkModal({ open, onOpenChange }: HomeworkModalProps) {
    const { user, selectedHomework: hw, workers, updateHomework, setIsRequestChangesModalOpen } = useAppContext();

    if (!hw || !user) return null;

    const handleStatusChange = (status: HomeworkStatus) => {
        updateHomework(hw.id, { status });
    }

    const handleAcceptChanges = () => {
        updateHomework(hw.id, { status: 'in_progress' });
    }

    const handleAssignWorker = (workerId: string) => {
        updateHomework(hw.id, { workerId });
    }

    const openRequestChangesModal = () => {
        onOpenChange(false); // Close current modal
        setIsRequestChangesModalOpen(true); // Open request changes modal
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col bg-background/95 backdrop-blur-sm">
                <DialogHeader>
                    <div className="flex justify-between items-center flex-wrap gap-2">
                        <DialogTitle className="text-xl sm:text-2xl">Homework #{hw.id}</DialogTitle>
                        <Badge variant="outline" className={cn("capitalize", statusColors[hw.status])}>{hw.status.replace(/_/g, ' ')}</Badge>
                    </div>
                    <DialogDescription>{hw.moduleName}</DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-grow pr-6 -mr-6">
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><Label>Project Number</Label><p>{Array.isArray(hw.projectNumber) ? hw.projectNumber.join(', ') : hw.projectNumber}</p></div>
                        <div><Label>Word Count</Label><p>{hw.wordCount}</p></div>
                        <div><Label>Deadline</Label><p>{new Date(hw.deadline).toLocaleString()}</p></div>
                        {hw.price && <div><Label>Price</Label><p>£{Number(hw.price).toFixed(2)}</p></div>}
                    </div>
                    <div>
                        <Label>Notes for Worker</Label>
                        <p className="text-sm p-3 bg-muted rounded-md min-h-[60px] whitespace-pre-wrap">{hw.notes}</p>
                    </div>
                    <div>
                        <Label>Original Files</Label>
                        {hw.files && hw.files.length > 0 ? (
                            <div className="flex flex-col gap-2 mt-2">
                                {hw.files.map((file, i) => (
                                    <Button key={i} variant="outline" className="justify-start gap-2">
                                        <Paperclip className="w-4 h-4"/> {file.name}
                                    </Button>
                                ))}
                            </div>
                        ) : <p className="text-sm text-muted-foreground">No files uploaded.</p>}
                    </div>

                     {/* Role-specific views */}
                    {user.role === 'super_agent' && hw.earnings && (
                        <div className="p-4 bg-primary/10 rounded-lg space-y-2 mt-4">
                            <h3 className="font-bold">Financials</h3>
                            <p>Revenue: £{hw.earnings.total.toFixed(2)}</p>
                            {hw.earnings.agent && <p>Agent Pay: £{hw.earnings.agent.toFixed(2)}</p>}
                            {hw.earnings.super_worker && <p>S.Worker Pay: £{hw.earnings.super_worker.toFixed(2)}</p>}
                            {hw.status === 'completed' && <p className="font-semibold">Profit: £{hw.earnings.profit.toFixed(2)}</p>}
                        </div>
                    )}
                    {user.role === 'agent' && hw.earnings?.agent && (
                         <div className="p-4 bg-primary/10 rounded-lg space-y-2 mt-4">
                            <h3 className="font-bold">Your Earnings</h3>
                            <p>Profit: £{hw.earnings.agent.toFixed(2)}</p>
                        </div>
                    )}
                     {user.role === 'super_worker' && hw.earnings?.super_worker && (
                         <div className="p-4 bg-primary/10 rounded-lg space-y-2 mt-4">
                            <h3 className="font-bold">Your Earnings</h3>
                            <p>Profit: £{hw.earnings.super_worker.toFixed(2)}</p>
                        </div>
                    )}
                    {(user.role === 'worker') && <div className="hidden"></div>}


                    {/* Change Request History */}
                    {hw.changeRequests && <ChangeRequestHistory requests={hw.changeRequests} />}


                    {/* Role-specific actions */}
                    <div className="mt-4 pt-4 border-t">
                    {user.role === 'super_agent' && (
                        <div>
                            <Label>Change Status</Label>
                            <Select onValueChange={(v: HomeworkStatus) => handleStatusChange(v)} defaultValue={hw.status}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="payment_approval">Payment Approval</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="final_payment_approval">Final Payment Approval</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="declined">Declined</SelectItem>
                                    <SelectItem value="refund">Refund</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {user.role === 'super_worker' && (
                        <div className="flex flex-wrap gap-2">
                             {hw.status === 'requested_changes' && (
                                <Button className="w-full sm:w-auto" onClick={handleAcceptChanges}><Check className="mr-2"/> Accept Changes</Button>
                            )}
                            <Select onValueChange={handleAssignWorker} defaultValue={hw.workerId}>
                                <SelectTrigger className="w-full sm:w-auto flex-grow">
                                    <SelectValue placeholder="Assign to worker..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {workers.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Button variant="outline" className="w-full sm:w-auto">Request Word Count</Button>
                            <Button variant="outline" className="w-full sm:w-auto">Request Deadline</Button>
                        </div>
                    )}
                    {user.role === 'student' && (
                        <div className="flex flex-col gap-2">
                            {hw.status === 'completed' && <Button className="w-full gap-2"><FileDown/> Download Final Work</Button>}
                            {['in_progress', 'completed'].includes(hw.status) && (
                                <Button variant="outline" className="w-full gap-2" onClick={openRequestChangesModal}><PencilRuler /> Request Changes</Button>
                            )}
                        </div>
                    )}
                    {(user.role === 'student' && ['word_count_change', 'deadline_change'].includes(hw.status)) && (
                        <div className="flex flex-col sm:flex-row gap-2 mt-2">
                            <Button className="w-full" variant="destructive">Decline</Button>
                            <Button className="w-full">Approve</Button>
                        </div>
                    )}
                    </div>
                </div>
                </ScrollArea>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
