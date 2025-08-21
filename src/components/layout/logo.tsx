import { CheckCircle2 } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center justify-center gap-2 text-lg font-bold text-primary">
      <CheckCircle2 className="h-7 w-7" />
      <span className="font-headline">ProHappyAssignments</span>
    </div>
  );
}
