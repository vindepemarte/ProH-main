"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User, Homework, HomeworkStatus, UserRole } from '@/lib/types';
import { users as initialUsers, homeworks as initialHomeworks, referenceCodes } from '@/lib/data';
import { useToast } from "@/hooks/use-toast";

interface AppContextType {
  user: User | null;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  register: (name: string, email: string, pass: string, refCode: string) => boolean;
  
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  profileModalOpen: boolean;
  setProfileModalOpen: (open: boolean) => void;
  
  homeworks: Homework[];
  getHomeworksForUser: (user: User) => Homework[];
  updateHomework: (id: string, updates: Partial<Homework>) => void;
  
  selectedHomework: Homework | null;
  setSelectedHomework: (homework: Homework | null) => void;
  isHomeworkModalOpen: boolean;
  setIsHomeworkModalOpen: (open: boolean) => void;

  workers: User[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [homeworks, setHomeworks] = useState<Homework[]>(initialHomeworks);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [workers, setWorkers] = useState<User[]>([]);

  useEffect(() => {
    // TODO: Fetch initial data from database instead of static file.
  }, [])

  useEffect(() => {
    if (user?.role === 'super_worker') {
        const myWorkers = users.filter(u => u.role === 'worker' && u.referredBy === user.id);
        setWorkers(myWorkers);
    }
  }, [user, users]);

  const login = (email: string, pass: string): boolean => {
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    const hash = (pwd: string) => `hashed_${pwd}`;

    if (foundUser && foundUser.password_hash === hash(pass)) {
      setUser(foundUser);
      setAuthModalOpen(false);
      toast({ title: "Login Successful", description: `Welcome back, ${foundUser.name}!` });
      return true;
    }
    toast({ variant: 'destructive', title: "Login Failed", description: "Invalid email or password." });
    return false;
  };

  const logout = () => {
    setUser(null);
    setProfileModalOpen(false);
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
  };
  
  const register = (name: string, email: string, pass: string, refCode: string): boolean => {
    const code = referenceCodes.find(c => c.code === refCode.toUpperCase());
    if (!code) {
        toast({ variant: 'destructive', title: "Registration Failed", description: "Invalid reference code." });
        return false;
    }

    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        toast({ variant: 'destructive', title: "Registration Failed", description: "Email already in use." });
        return false;
    }
    
    const newUser: User = {
        id: `user_${Date.now()}`,
        name,
        email,
        password_hash: `hashed_${pass}`,
        role: code.role,
        referredBy: code.ownerId,
        referenceCode: null, // This would be assigned later for agent/super_worker
    };

    setUsers(prev => [...prev, newUser]);
    setUser(newUser);
    setAuthModalOpen(false);
    toast({ title: "Registration Successful", description: `Welcome, ${name}!` });

    return true;
  };

  const getHomeworksForUser = (currentUser: User): Homework[] => {
    switch(currentUser.role) {
        case 'super_agent':
            return homeworks;
        case 'agent':
            return homeworks.filter(h => h.agentId === currentUser.id);
        case 'student':
            return homeworks.filter(h => h.studentId === currentUser.id);
        case 'super_worker':
            return homeworks.filter(h => ['in_progress', 'requested_changes', 'final_payment_approval', 'word_count_change', 'deadline_change'].includes(h.status));
        case 'worker':
            return homeworks.filter(h => h.workerId === currentUser.id);
        default:
            return [];
    }
  };

  const updateHomework = (id: string, updates: Partial<Homework>) => {
    setHomeworks(prev => prev.map(hw => hw.id === id ? {...hw, ...updates} : hw));
    toast({ title: "Homework Updated", description: `Homework #${id} status changed.` });
  }

  const value = {
    user,
    login,
    logout,
    register,
    authModalOpen,
    setAuthModalOpen,
    profileModalOpen,
    setProfileModalOpen,
    homeworks,
    getHomeworksForUser,
    updateHomework,
    selectedHomework,
    setSelectedHomework,
    isHomeworkModalOpen,
    setIsHomeworkModalOpen,
    workers,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
