import Image from "next/image";

export function Logo() {
  return (
    <div className="flex items-center justify-center gap-2 text-lg font-bold text-primary">
      <Image src="/logo.png" alt="ProHappyAssignments Logo" width={60} height={60} />
      <span className="font-headline text-primary text-2xl">ProHappyAssignments</span>
    </div>
  );
}
