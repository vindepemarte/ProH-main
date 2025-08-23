
"use client"

import { Home, UserCircle, LogIn, LogOut, MessageCircle, Mail } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAppContext } from '@/contexts/app-context';
import { Logo } from './logo';
import { useState } from 'react';
import Image from 'next/image';

export default function BottomNavbar() {
  const { user, setAuthModalOpen, setProfileModalOpen, logout } = useAppContext();
  const [contactOpen, setContactOpen] = useState(false);

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent("Hi! I'm interested in ProHappyAssignments services. Can you help me?");
    window.open(`https://wa.me/+447586369924?text=${message}`, '_blank');
    setContactOpen(false);
  };

  const handleEmailContact = () => {
    window.open('mailto:info@prohappya.uk?subject=Inquiry about ProHappyAssignments', '_blank');
    setContactOpen(false);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-sm border-t border-border/50 flex items-center justify-center z-50">
      <div className="flex items-center justify-around w-full max-w-sm">
        <div className="absolute left-1/2 -translate-x-1/2">
          <Popover open={contactOpen} onOpenChange={setContactOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-20 h-20 rounded-full bg-background border-2 border-accent shadow-lg -translate-y-8 flex items-center justify-center hover:bg-accent/10 transition-all duration-300 hover:scale-105"
              >
                <div className="w-12 h-12">
                  <Logo />
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              side="top" 
              align="center" 
              className="w-auto p-2 mb-4 bg-background/95 backdrop-blur-sm border border-border/50 shadow-xl rounded-2xl"
              sideOffset={10}
            >
              <div className="flex flex-col gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center gap-3 hover:bg-green-500/10 transition-all duration-200 rounded-xl px-4 py-3"
                  onClick={handleWhatsAppContact}
                >
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">WhatsApp</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center gap-3 hover:bg-blue-500/10 transition-all duration-200 rounded-xl px-4 py-3"
                  onClick={handleEmailContact}
                >
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">Email</span>
                </Button>
              </div>
            </PopoverContent>
          </Popover>
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
