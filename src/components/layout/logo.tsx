import Image from "next/image";

export function Logo() {
  return (
    <div className="flex items-center justify-center gap-2 text-lg font-bold text-primary">
      <Image src="/logo.png" alt="ProHappyAssignments Logo" width={40} height={40} />
      <span className="font-headline text-primary">ProHappyAssignments</span>
    </div>
  );
}
