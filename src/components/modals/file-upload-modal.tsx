"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAppContext } from "@/contexts/app-context"
import { useState } from "react"
import { Upload, FileText, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface FileUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FileUploadModal({ open, onOpenChange }: FileUploadModalProps) {
    const { user, selectedHomework: hw, uploadHomeworkFiles } = useAppContext();
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    if (!hw || !user) return null;

    // Determine what type of files this user can upload
    const getFileType = (): 'worker_draft' | 'super_worker_review' | 'final_approved' | null => {
        if (user.role === 'worker') return 'worker_draft';
        if (user.role === 'super_worker') return 'super_worker_review';
        if (user.role === 'super_agent') return 'final_approved';
        return null;
    };

    const getModalTitle = () => {
        const fileType = getFileType();
        if (fileType === 'worker_draft') return 'Upload Draft Files';
        if (fileType === 'super_worker_review') return 'Upload Reviewed Files';
        if (fileType === 'final_approved') return 'Upload Final Files';
        return 'Upload Files';
    };

    const getDescription = () => {
        const fileType = getFileType();
        if (fileType === 'worker_draft') return 'Upload your completed work for super worker review.';
        if (fileType === 'super_worker_review') return 'Upload the reviewed and approved files for final approval.';
        if (fileType === 'final_approved') return 'Upload the final approved files that will be delivered to the student.';
        return 'Upload files for this homework.';
    };

    const canUpload = () => {
        if (!hw) return false;
        
        if (user.role === 'worker' && hw.status === 'in_progress') return true;
        if (user.role === 'worker' && hw.status === 'assigned_to_worker') return true;
        if (user.role === 'super_worker' && ['worker_draft', 'final_payment_approval'].includes(hw.status)) return true;
        if (user.role === 'super_agent' && ['final_payment_approval'].includes(hw.status)) return true;
        
        return false;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedFiles(e.target.files);
    };

    const handleUpload = async () => {
        if (!selectedFiles || selectedFiles.length === 0 || !hw) return;
        
        const fileType = getFileType();
        if (!fileType) return;

        setIsUploading(true);
        try {
            // Convert FileList to array of file objects with base64 content
            const filesArray = await Promise.all(
                Array.from(selectedFiles).map(async (file) => {
                    // Convert file to base64 data URL for storage
                    const dataUrl = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.readAsDataURL(file);
                    });
                    
                    return {
                        name: file.name,
                        url: dataUrl // Store as base64 data URL
                    };
                })
            );

            await uploadHomeworkFiles(hw.id, filesArray, fileType);
            
            setSelectedFiles(null);
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to upload files:', error);
        } finally {
            setIsUploading(false);
        }
    };

    if (!canUpload()) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Upload Not Available</DialogTitle>
                        <DialogDescription>
                            File upload is not available for this homework in its current status.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => onOpenChange(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col bg-background/95 backdrop-blur-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        {getModalTitle()} - Homework #{hw.id}
                    </DialogTitle>
                    <DialogDescription>
                        {getDescription()}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 flex-grow overflow-auto pr-6 -mr-6 pb-4">
                    {/* Current Status Info */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <Label className="text-muted-foreground">Module</Label>
                                    <p>{hw.moduleName}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Word Count</Label>
                                    <p>{hw.wordCount}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Deadline</Label>
                                    <p>{new Date(hw.deadline).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Status</Label>
                                    <p className="capitalize">{hw.status.replace(/_/g, ' ')}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* File Upload */}
                    <div className="space-y-2">
                        <Label htmlFor="files">Select Files to Upload</Label>
                        <Input
                            id="files"
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            className="cursor-pointer"
                        />
                        <p className="text-sm text-muted-foreground">
                            Select one or more files to upload. Supported formats: PDF, DOC, DOCX, TXT, etc.
                        </p>
                    </div>

                    {/* Selected Files Preview */}
                    {selectedFiles && selectedFiles.length > 0 && (
                        <div className="space-y-2">
                            <Label>Selected Files ({selectedFiles.length})</Label>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {Array.from(selectedFiles).map((file, index) => (
                                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                                        <FileText className="h-4 w-4" />
                                        <span className="text-sm">{file.name}</span>
                                        <span className="text-xs text-muted-foreground ml-auto">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Latest Version Notice */}
                    <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium text-blue-800">Latest Version</p>
                            <p className="text-blue-700">
                                These files will be marked as the latest version and will replace any previous uploads of the same type.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="pt-4 border-t mt-4">
                    <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleUpload}
                        disabled={!selectedFiles || selectedFiles.length === 0 || isUploading}
                    >
                        {isUploading ? 'Uploading...' : 'Upload Files'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}