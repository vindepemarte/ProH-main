
"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface TutorialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TutorialModal({ open, onOpenChange }: TutorialModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>How to Request a New Homework</DialogTitle>
        </DialogHeader>
        <div className="flex-1 px-6 pb-6">
          <div className="aspect-video w-full h-full max-h-[calc(95vh-120px)]">
            <video 
              className="w-full h-full object-contain rounded-lg" 
              src="/tutorial.mp4" 
              controls 
              controlsList="nodownload"
              preload="metadata"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
