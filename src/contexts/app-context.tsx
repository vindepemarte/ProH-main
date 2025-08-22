"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { User, Homework, HomeworkStatus, UserRole, ReferenceCode } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { fetchUsers, authenticateUser, createUser, fetchHomeworksForUser, modifyHomework, fetchWorkersForSuperWorker, fetchReferenceCodesForUser } from '@/lib/actions';

interface AppContextType {
  user: User | null;
  allUsers: User[];
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, pass: string, refCode: string) => Promise<boolean>;
  
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  profileModalOpen: boolean;
  setProfileModalOpen: (open: boolean) => void;
  
  homeworks: Homework[];
  getHomeworksForUser: () => void;
  updateHomework: (id: string, updates: Partial<Homework>) => Promise<void>;
  
  selectedHomework: Homework | null;
  setSelectedHomework: (homework: Homework | null) => void;
  isHomeworkModalOpen: boolean;
  setIsHomeworkModalOpen: (open: boolean) => void;

  workers: User[];
  referenceCodes: ReferenceCode[];
  getReferenceCodesForUser: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [workers, setWorkers] = useState<User[]>([]);
  const [referenceCodes, setReferenceCodes] = useState<ReferenceCode[]>([]);

  const getHomeworksForUser = useCallback(async () => {
    if (!user) return;
    try {
        const userHomeworks = await fetchHomeworksForUser(user);
        setHomeworks(userHomeworks);
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: "Error", description: "Could not fetch homeworks." });
    }
  }, [user, toast]);

  const getReferenceCodesForUser = useCallback(async () => {
    if (!user) return;
    try {
      const codes = await fetchReferenceCodesForUser(user.id);
      setReferenceCodes(codes);
    } catch (error) {
       console.error(error);
       toast({ variant: 'destructive', title: "Error", description: "Could not fetch reference codes." });
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      getHomeworksForUser();
      if (user.role === 'super_worker') {
        fetchWorkersForSuperWorker(user.id).then(setWorkers);
      }
      if (['super_agent', 'agent', 'super_worker'].includes(user.role)) {
        getReferenceCodesForUser();
      }
       if (user.role === 'super_agent') {
        fetchUsers().then(setAllUsers);
      }
    } else {
      setHomeworks([]);
      setWorkers([]);
      setReferenceCodes([]);
      setAllUsers([]);
    }
  }, [user, getHomeworksForUser, getReferenceCodesForUser]);

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const foundUser = await authenticateUser(email, pass);
      if (foundUser) {
        setUser(foundUser);
        setAuthModalOpen(false);
        toast({ title: "Login Successful", description: `Welcome back, ${foundUser.name}!` });
        return true;
      } else {
        toast({ variant: 'destructive', title: "Login Failed", description: "Invalid email or password." });
        return false;
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: "Login Error", description: "An error occurred during login." });
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setProfileModalOpen(false);
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
  };
  
  const register = async (name: string, email: string, pass: string, refCode: string): Promise<boolean> => {
     try {
        const newUser = await createUser(name, email, pass, refCode);
        if (newUser) {
            setUser(newUser);
            setAuthModalOpen(false);
            toast({ title: "Registration Successful", description: `Welcome, ${name}!` });
            return true;
        } else {
            return false;
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: "Registration Failed", description: error.message });
        return false;
    }
  };

  const updateHomework = async (id: string, updates: Partial<Homework>) => {
    try {
        await modifyHomework(id, updates);
        getHomeworksForUser(); // Refresh homeworks list
        
        if (selectedHomework && selectedHomework.id === id) {
            setSelectedHomework({ ...selectedHomework, ...updates });
        }
        toast({ title: "Homework Updated", description: `Homework #${id.split('_')[1]} has been updated.` });
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: "Error", description: "Could not update homework." });
    }
  }

  const value = {
    user,
    allUsers,
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
    referenceCodes,
    getReferenceCodesForUser
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
