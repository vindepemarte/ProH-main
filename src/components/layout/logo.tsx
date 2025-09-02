
import Image from "next/image";

export function Logo() {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <Image src="/logo.png" alt="ProHappyAssignments Logo" width={60} height={60} className="w-full h-auto object-contain" />
    </div>
  );
}
