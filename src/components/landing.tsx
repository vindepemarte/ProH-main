import { Button } from "@/components/ui/button"
import { Logo } from "@/components/layout/logo"
import { useAppContext } from "@/contexts/app-context"
import Image from "next/image"

export default function Landing() {
  const { setAuthModalOpen } = useAppContext();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-grid-teal-500/10">
      <div className="absolute top-8">
        <Logo />
      </div>
      <main className="flex flex-col items-center z-10">
        <Image 
          src="https://placehold.co/400x400.png" 
          alt="Illustration of students collaborating" 
          width={250} 
          height={250} 
          className="mb-8 rounded-full shadow-2xl"
          data-ai-hint="happy students"
          priority
        />
        <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-primary tracking-tight">
          Streamline Your Success
        </h1>
        <p className="mt-4 max-w-xl text-lg text-foreground/80">
          ProHappyAssignments connects students, agents, and workers for seamless assignment management. Get started today by logging in or creating an account.
        </p>
        <Button 
          className="mt-8 animate-bounce" 
          size="lg"
          onClick={() => setAuthModalOpen(true)}
          style={{
            backgroundColor: 'hsl(var(--accent))',
            color: 'hsl(var(--accent-foreground))'
          }}
          >
          Get Started
        </Button>
      </main>
      <div className="fixed inset-0 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
    </div>
  )
}
