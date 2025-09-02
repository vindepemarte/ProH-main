
"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface TutorialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TutorialModal({ open, onOpenChange }: TutorialModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>How to Request a New Homework</DialogTitle>
        </DialogHeader>
        <div className="aspect-video">
          <video className="w-full" src="/tutorial.mp4" controls />
        </div>
      </DialogContent>
    </Dialog>
  );
}
