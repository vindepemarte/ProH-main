
"use client"

import { Home, UserCircle, LogIn, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useAppContext } from '@/contexts/app-context';
import { Logo } from './logo';
import Image from 'next/image';

export default function BottomNavbar() {
  const { user, setAuthModalOpen, setProfileModalOpen, logout } = useAppContext();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-sm border-t border-border/50 flex items-center justify-center z-50">
      <div className="flex items-center justify-around w-full max-w-sm">
        <div className="absolute left-1/2 -translate-x-1/2">
            <Button variant="ghost" size="icon" className="w-20 h-20 rounded-full bg-background border-2 border-accent shadow-lg -translate-y-8 flex items-center justify-center hover:bg-accent/10">
                <div className="w-12 h-12">
                   <Logo />
                </div>
            </Button>
        </div>
        
        {user ? (
          <>
            <Button variant="ghost" size="icon" className="rounded-full w-14 h-14" onClick={() => setProfileModalOpen(true)}>
                <UserCircle className="w-7 h-7" />
            </Button>
             <div className="w-20" /> 
            <Button variant="ghost" size="icon" className="rounded-full w-14 h-14" onClick={logout}>
                <LogOut className="w-7 h-7" />
            </Button>
          </>
        ) : (
          <>
             <span className="w-14" />
             <div className="w-20" /> 
            <Button variant="ghost" size="icon" className="rounded-full w-14 h-14" onClick={() => setAuthModalOpen(true)}>
                <LogIn className="w-7 h-7" />
            </Button>
          </>
        )}
      </div>
    </nav>
  );
}
