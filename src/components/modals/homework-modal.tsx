
"use client"

import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useAppContext } from "@/contexts/app-context"
import { Badge } from "../ui/badge"
import { cn } from "@/lib/utils"
import { HomeworkStatus, HomeworkChangeRequest } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { FileDown, Paperclip, PencilRuler, History, MessageSquare, Check, AlertCircle, Upload } from "lucide-react"
import { ScrollArea } from "../ui/scroll-area"

const statusColors: Record<HomeworkStatus, string> = {
  payment_approval: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
  assigned_to_super_worker: "bg-cyan-500/20 text-cyan-700 border-cyan-500/30",
  assigned_to_worker: "bg-sky-500/20 text-sky-700 border-sky-500/30",
  in_progress: "bg-blue-500/20 text-blue-700 border-blue-500/30",
  worker_draft: "bg-violet-500/20 text-violet-700 border-violet-500/30",
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

function ChangeRequestHistory({ requests, user, handleFileDownload }: { requests: HomeworkChangeRequest[]; user: any; handleFileDownload: (file: any) => void }) {
    if (!requests || requests.length === 0) return null;

    // Sort requests by creation date (newest first) and add version numbers
    const sortedRequests = [...requests].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return (
        <div className="mt-4 pt-4 border-t">
            <h3 className="flex items-center gap-2 font-semibold mb-2">
                <History className="w-5 h-5"/> 
                Change History ({sortedRequests.length} {sortedRequests.length === 1 ? 'request' : 'requests'})
            </h3>
            <div className="space-y-4">
                {sortedRequests.map((req, index) => {
                    const isLatest = index === 0;
                    const versionNumber = sortedRequests.length - index;
                    
                    return (
                        <div key={req.id} className={`p-3 rounded-lg border ${isLatest ? 'bg-blue-50 border-blue-200' : 'bg-muted/50 border-border'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-muted-foreground">Version {versionNumber}</span>
                                    {isLatest && (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                            Latest
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(req.created_at).toLocaleString()}
                                </p>
                            </div>
                            {req.notes && (
                                <p className="mt-1 flex gap-2 text-sm">
                                    <MessageSquare className="w-4 h-4 mt-0.5 shrink-0"/> 
                                    {req.notes}
                                </p>
                            )}
                            {req.files && req.files.length > 0 && (
                                <div className="mt-2 flex flex-col gap-2">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Attachments ({req.files.length}):
                                    </span>
                                    {req.files.map((file, i) => (
                                         <Button 
                                            key={i} 
                                            variant="outline" 
                                            size="sm" 
                                            className="justify-start gap-2 hover:bg-accent/50 cursor-pointer" 
                                            onClick={() => user.role !== 'student' ? handleFileDownload(file) : undefined}
                                            disabled={user.role === 'student'}
                                        >
                                            <Paperclip className="w-4 h-4"/> {file.name}
                                            {user.role !== 'student' && <FileDown className="w-3 h-3 ml-auto opacity-60" />}
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    )
}

export default function HomeworkModal({ open, onOpenChange }: HomeworkModalProps) {
    const { 
        user, 
        selectedHomework: hw, 
        workers, 
        updateHomework, 
        setIsRequestChangesModalOpen, 
        setIsSuperWorkerChangeModalOpen, 
        setIsFileUploadModalOpen, 
        pricingConfig,
        superWorkersForAssignment,
        handleAssignSuperWorker,
        fetchSuperWorkersForAssignment,
        approveDraftFiles
    } = useAppContext();


    if (!hw || !user) return null;
    
    // Fetch super workers for assignment when modal opens for super agents
    useEffect(() => {
        if (open && user.role === 'super_agent') {
            fetchSuperWorkersForAssignment();
        }
    }, [open, user.role, fetchSuperWorkersForAssignment]);

    // Debug logging to understand status dropdown visibility
    console.log('HomeworkModal Debug:', {
        userRole: user.role,
        hwId: hw.id,
        hwAgentId: hw.agentId,
        userIsSuper: user.role === 'super_agent',
        shouldShowStatusDropdown: user.role === 'super_agent',
        agentViewOnly: user.role === 'agent'
    });

    const handleStatusChange = (status: HomeworkStatus) => {
        updateHomework(hw.id, { status });
    }

    const handleFileDownload = (file: any) => {
        // Only allow file downloads for non-student roles
        if (user.role === 'student') return;
        
        try {
            const link = document.createElement('a');
            
            if (file.url && file.url.trim() !== '') {
                // If file has a data URL (base64) or actual URL, use it directly
                link.href = file.url;
            } else {
                // Fallback: create a simple text file indicating the file is not available
                const errorContent = `File "${file.name}" is not available for download.\n\nThis may be because:\n- The file was uploaded before the download system was implemented\n- There was an error during the original upload\n\nPlease contact support if you need access to this file.`;
                const blob = new Blob([errorContent], { type: 'text/plain' });
                link.href = URL.createObjectURL(blob);
            }
            
            link.download = file.name;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up object URL if created
            if (!file.url || file.url.trim() === '') {
                URL.revokeObjectURL(link.href);
            }
        } catch (error) {
            console.error('Download failed:', error);
            alert('Download failed. Please try again.');
        }
    };

    const handleAcceptChanges = () => {
        updateHomework(hw.id, { status: 'in_progress' });
    }

    const handleAssignWorker = (workerId: string) => {
        updateHomework(hw.id, { workerId });
    }
    
    const handleAssignSuperWorkerToHomework = (workerId: string) => {
        if (workerId === "none") {
            // Handle unassigning - you might want to implement this in actions.ts
            updateHomework(hw.id, { superWorkerId: undefined });
        } else {
            handleAssignSuperWorker(hw.id, workerId);
        }
    }

    const openRequestChangesModal = () => {
        onOpenChange(false); // Close current modal
        setIsRequestChangesModalOpen(true); // Open request changes modal
    }

    const openSuperWorkerChangeModal = () => {
        onOpenChange(false); // Close current modal
        setIsSuperWorkerChangeModalOpen(true); // Open super worker change modal
    }

    const openFileUploadModal = () => {
        onOpenChange(false); // Close current modal
        setIsFileUploadModalOpen(true); // Open file upload modal
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col bg-background/95 backdrop-blur-sm overflow-hidden">
                <DialogHeader className="flex-shrink-0">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                        <DialogTitle className="text-xl sm:text-2xl">Homework #{hw.id}</DialogTitle>
                        <Badge variant="outline" className={cn("capitalize", statusColors[hw.status])}>{hw.status.replace(/_/g, ' ')}</Badge>
                    </div>
                    <DialogDescription>{hw.moduleName}</DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 overflow-y-auto modal-scroll" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                    <div className="px-1 pr-4">
                        <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><Label>Project Number</Label><p>{Array.isArray(hw.projectNumber) ? hw.projectNumber.join(', ') : hw.projectNumber}</p></div>
                        <div><Label>Word Count</Label><p>{hw.wordCount}</p></div>
                        <div><Label>Deadline</Label><p>{new Date(hw.deadline).toLocaleString()}</p></div>
                        {hw.price && (
                            <div>
                                <Label>Price</Label>
                                {['worker', 'super_worker'].includes(user.role) ? (
                                    <p className="font-mono text-muted-foreground">••••••••</p>
                                ) : (
                                    <p>£{Number(hw.price).toFixed(2)}</p>
                                )}
                            </div>
                        )}
                    </div>
                    <div>
                        <Label>Notes for Worker</Label>
                        <p className="text-sm p-3 bg-muted rounded-md min-h-[60px] whitespace-pre-wrap">{hw.notes}</p>
                    </div>
                    <div>
                        <Label>Files</Label>
                        <div className="space-y-4 mt-2">
                            {/* Original Student Files */}
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Original Files</h4>
                                {hw.files && hw.files.length > 0 ? (
                                    <div className="flex flex-col gap-2">
                                        {hw.files.map((file, i) => (
                                            <Button 
                                                key={i} 
                                                variant="outline" 
                                                className="justify-start gap-2 hover:bg-accent/50 cursor-pointer" 
                                                onClick={() => user.role !== 'student' ? handleFileDownload(file) : undefined}
                                                disabled={user.role === 'student'}
                                            >
                                                <Paperclip className="w-4 h-4"/> {file.name}
                                                {user.role !== 'student' && <FileDown className="w-4 h-4 ml-auto opacity-60" />}
                                            </Button>
                                        ))}
                                    </div>
                                ) : <p className="text-sm text-muted-foreground">No original files uploaded.</p>}
                            </div>

                            {/* Worker Draft Files */}
                            {(['worker', 'super_worker', 'super_agent'].includes(user.role) && (hw.draftFiles && hw.draftFiles.length > 0 || user.role === 'worker')) && (
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-sm font-medium text-muted-foreground">Worker Draft Files</h4>
                                        {user.role === 'worker' && (hw.status === 'in_progress' || hw.status === 'assigned_to_worker') && (
                            <Button size="sm" variant="outline" onClick={openFileUploadModal} className="gap-2">
                                <Upload className="w-3 h-3" /> Upload Draft
                            </Button>
                        )}
                                    </div>
                                    {hw.draftFiles && hw.draftFiles.length > 0 ? (
                                        <div className="flex flex-col gap-2">
                                            {hw.draftFiles.map((file, i) => (
                                                <Button 
                                                    key={i} 
                                                    variant="outline" 
                                                    className="justify-start gap-2 relative hover:bg-accent/50 cursor-pointer" 
                                                    onClick={() => user.role !== 'student' ? handleFileDownload(file) : undefined}
                                                    disabled={user.role === 'student'}
                                                >
                                                    <Paperclip className="w-4 h-4"/> 
                                                    <span className="flex-1 text-left">{file.name}</span>
                                                    <div className="flex items-center gap-2 ml-auto">
                                                        {file.uploaded_at && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {new Date(file.uploaded_at).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                                            Latest
                                                        </span>
                                                        {user.role !== 'student' && <FileDown className="w-3 h-3 opacity-60" />}
                                                    </div>
                                                </Button>
                                            ))}
                                        </div>
                                    ) : user.role === 'worker' ? (
                                        <p className="text-sm text-muted-foreground">No draft files uploaded yet.</p>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Worker has not uploaded draft files yet.</p>
                                    )}
                                </div>
                            )}

                            {/* Final Files (Previously Super Worker Reviewed Files) */}
                            {(['student', 'agent', 'super_worker', 'super_agent'].includes(user.role) && ((hw.reviewedFiles && hw.reviewedFiles.length > 0) || (hw.finalFiles && hw.finalFiles.length > 0) || user.role === 'super_worker')) && (
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-sm font-medium text-muted-foreground">Final Files</h4>
                                        {user.role === 'super_worker' && hw.status === 'worker_draft' && hw.draftFiles && hw.draftFiles.length > 0 && (
                            <Button size="sm" variant="outline" onClick={openFileUploadModal} className="gap-2">
                                <Upload className="w-3 h-3" /> Upload Final
                            </Button>
                        )}
                                        {user.role === 'super_worker' && hw.status === 'final_payment_approval' && hw.draftFiles && hw.draftFiles.length > 0 && (
                                            <Button size="sm" variant="outline" onClick={openFileUploadModal} className="gap-2">
                                                <Upload className="w-3 h-3" /> Upload Final
                                            </Button>
                                        )}
                                    </div>
                                    {((hw.reviewedFiles && hw.reviewedFiles.length > 0) || (hw.finalFiles && hw.finalFiles.length > 0)) ? (
                                        <div className="flex flex-col gap-2">
                                            {/* Show super worker review files first */}
                                            {hw.reviewedFiles && hw.reviewedFiles.map((file, i) => (
                                                <Button 
                                                    key={`reviewed-${i}`} 
                                                    variant="outline" 
                                                    className="justify-start gap-2 relative hover:bg-accent/50 cursor-pointer" 
                                                    onClick={() => handleFileDownload(file)}
                                                >
                                                    <Paperclip className="w-4 h-4"/> 
                                                    <span className="flex-1 text-left">{file.name}</span>
                                                    <div className="flex items-center gap-2 ml-auto">
                                                        {file.uploaded_at && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {new Date(file.uploaded_at).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                                                            Final
                                                        </span>
                                                        <FileDown className="w-3 h-3 opacity-60" />
                                                    </div>
                                                </Button>
                                            ))}
                                            {/* Show final approved files (approved drafts) if no reviewed files */}
                                            {(!hw.reviewedFiles || hw.reviewedFiles.length === 0) && hw.finalFiles && hw.finalFiles.map((file, i) => (
                                                <Button 
                                                    key={`final-${i}`} 
                                                    variant="outline" 
                                                    className="justify-start gap-2 relative hover:bg-accent/50 cursor-pointer" 
                                                    onClick={() => handleFileDownload(file)}
                                                >
                                                    <Paperclip className="w-4 h-4"/> 
                                                    <span className="flex-1 text-left">{file.name}</span>
                                                    <div className="flex items-center gap-2 ml-auto">
                                                        {file.uploaded_at && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {new Date(file.uploaded_at).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                                            Approved
                                                        </span>
                                                        <FileDown className="w-3 h-3 opacity-60" />
                                                    </div>
                                                </Button>
                                            ))}
                                        </div>
                                    ) : user.role === 'super_worker' ? (
                                        <p className="text-sm text-muted-foreground">No final files uploaded yet.</p>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Final files will be available once work is completed.</p>
                                    )}
                                </div>
                            )}


                        </div>
                    </div>

                     {/* Role-specific financial views - Enhanced for all scenarios */}
                    {user.role === 'super_agent' && hw.earnings && (
                        <div className="p-4 bg-primary/10 rounded-lg space-y-2 mt-4">
                            <h3 className="font-bold">Financials</h3>
                            <p>Revenue: £{Number(hw.earnings.total || 0).toFixed(2)}</p>
                            {hw.earnings.agent && hw.earnings.agent > 0 && <p>Agent Pay: £{Number(hw.earnings.agent).toFixed(2)}</p>}
                            <p>S.Worker Pay: £{Number(hw.earnings.super_worker || 0).toFixed(2)}</p>
                            <p className={`font-semibold ${(hw.earnings.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                Profit: £{Number(hw.earnings.profit || 0).toFixed(2)}
                            </p>
                            {hw.assignedSuperWorkerName && (
                                <p className="text-sm text-muted-foreground mt-2">
                                    <strong>Assigned Super Worker:</strong> {hw.assignedSuperWorkerName}
                                </p>
                            )}
                        </div>
                    )}

                    {user.role === 'agent' && hw.agentId === user.id && hw.earnings?.agent && hw.earnings.agent > 0 && (
                         <div className="p-4 bg-primary/10 rounded-lg space-y-2 mt-4">
                            <h3 className="font-bold">Your Earnings</h3>
                            <p>Commission: £{Number(hw.earnings.agent).toFixed(2)}</p>
                        </div>
                    )}
                     {user.role === 'super_worker' && hw.earnings?.super_worker && (
                         <div className="p-4 bg-primary/10 rounded-lg space-y-2 mt-4">
                            <h3 className="font-bold">Your Earnings</h3>
                            <p>Fee: £{Number(hw.earnings.super_worker).toFixed(2)}</p>
                        </div>
                    )}
                    {user.role === 'student' && hw.price && (
                        <div className="p-4 bg-primary/10 rounded-lg space-y-2 mt-4">
                            <h3 className="font-bold">Payment</h3>
                            <p>Total Price: £{Number(hw.price).toFixed(2)}</p>
                        </div>
                    )}
                    {/* Workers see no earnings */}


                    {/* Change Request History */}
                    {hw.changeRequests && <ChangeRequestHistory requests={hw.changeRequests} user={user} handleFileDownload={handleFileDownload} />}


                    {/* Status Control - ONLY Super Agent can change status */}
                    <div className="mt-4 pt-4 border-t">
                    {user.role === 'super_agent' && (
                        <div className="space-y-3">
                            <Label>Change Status</Label>
                            <Select onValueChange={(v: HomeworkStatus) => handleStatusChange(v)} defaultValue={hw.status}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="payment_approval">Payment Approval</SelectItem>
                                    <SelectItem value="assigned_to_super_worker">Assigned to S.Worker</SelectItem>
                                    <SelectItem value="assigned_to_worker">Assigned to Worker</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="worker_draft">Worker Draft</SelectItem>
                                    <SelectItem value="requested_changes">Requested Changes</SelectItem>
                                    <SelectItem value="final_payment_approval">Final Payment Approval</SelectItem>
                                    <SelectItem value="word_count_change">Word Count Change</SelectItem>
                                    <SelectItem value="deadline_change">Deadline Change</SelectItem>
                                    <SelectItem value="declined">Declined</SelectItem>
                                    <SelectItem value="refund">Refund</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                            
                            {/* Super Worker Assignment */}
                            <div className="space-y-2">
                                <Label>Assign Super Worker</Label>
                                <Select
                                    onValueChange={handleAssignSuperWorkerToHomework}
                                    value={hw.superWorkerId || "none"}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Super Worker..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {superWorkersForAssignment.map((worker) => (
                                            <SelectItem key={worker.id} value={worker.id}>
                                                {worker.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {hw.superWorkerId && (
                                    <p className="text-sm text-muted-foreground">
                                        Currently assigned: {hw.assignedSuperWorkerName || 'Unknown'}
                                    </p>
                                )}
                            </div>
                            
                            {/* Super Agent workflow helper */}
                            {hw.status === 'final_payment_approval' && hw.reviewedFiles && hw.reviewedFiles.length > 0 && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm text-green-700 mb-2">Final files are ready for approval. Click "Completed" to finalize.</p>
                                    <Button onClick={() => handleStatusChange('completed')} className="w-full">
                                        Mark as Completed
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Agent: View-only access - no status control */}
                    {user.role === 'agent' && (
                        <div className="text-center text-muted-foreground p-4 bg-muted/30 rounded-lg">
                            <p>View only - Contact Super Agent to change status</p>
                        </div>
                    )}
                    {user.role === 'super_worker' && (
                        <div className="flex flex-wrap gap-3">
                             {hw.status === 'requested_changes' && (
                                <Button className="w-full sm:w-auto" onClick={handleAcceptChanges}><Check className="mr-2"/> Accept Changes</Button>
                            )}
                            {hw.status === 'worker_draft' && hw.draftFiles && hw.draftFiles.length > 0 && (
                                <Button 
                                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700" 
                                    onClick={() => handleStatusChange('final_payment_approval')}
                                >
                                    <Check className="mr-2"/> Approve Draft
                                </Button>
                            )}
                            <Select onValueChange={handleAssignWorker} defaultValue={hw.workerId || ""}>
                                <SelectTrigger className="w-full sm:w-auto flex-grow">
                                    <SelectValue placeholder="Assign to worker..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {workers.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Button variant="outline" className="w-full sm:w-auto" onClick={openSuperWorkerChangeModal}>Request Word Count</Button>
                            <Button variant="outline" className="w-full sm:w-auto" onClick={openSuperWorkerChangeModal}>Request Deadline</Button>
                        </div>
                    )}
                    {user.role === 'student' && (
                        <div className="flex flex-col gap-3">
                            {hw.status === 'completed' && hw.reviewedFiles && hw.reviewedFiles.length > 0 && (
                                <div className="mb-2">
                                    <h4 className="text-sm font-medium mb-2">Download Final Work:</h4>
                                    {hw.reviewedFiles.map((file, i) => (
                                        <Button key={i} className="w-full gap-2 mb-1" onClick={() => handleFileDownload(file)}>
                                            <FileDown/> {file.name}
                                        </Button>
                                    ))}
                                </div>
                            )}
                            {['in_progress', 'completed'].includes(hw.status) && (
                                <Button variant="outline" className="w-full gap-2" onClick={openRequestChangesModal}><PencilRuler /> Request Changes</Button>
                            )}
                            {/* Approve/Decline buttons for word count and deadline changes */}
                            {['word_count_change', 'deadline_change'].includes(hw.status) && (
                                <div className="mt-4 p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                                    <div className="flex items-center gap-2 mb-3">
                                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                                        <h3 className="font-medium text-yellow-800">
                                            {hw.status === 'word_count_change' ? 'Word Count Change Request' : 'Deadline Change Request'}
                                        </h3>
                                    </div>
                                    <p className="text-sm text-yellow-700 mb-3">
                                        The Super Worker has requested changes to this homework. Please review and approve or decline.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Button className="w-full" variant="destructive" onClick={() => handleStatusChange('declined')}>Decline</Button>
                                        <Button className="w-full" onClick={() => handleStatusChange('in_progress')}>Approve</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {user.role === 'worker' && (
                        <div className="text-center text-muted-foreground">
                            <p>Assigned work - Contact Super Worker for updates</p>
                        </div>
                    )}
                    </div>
                        </div>
                    </div>
                </ScrollArea>
                <DialogFooter className="flex-shrink-0 gap-3 sm:gap-2">
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
