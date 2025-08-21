"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User, Homework, HomeworkStatus, UserRole } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { fetchUsers, authenticateUser, createUser, fetchHomeworks, fetchHomeworksForUser, modifyHomework, fetchWorkersForSuperWorker } from '@/lib/actions';

interface AppContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, pass: string, refCode: string) => Promise<boolean>;
  
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  profileModalOpen: boolean;
  setProfileModalOpen: (open: boolean) => void;
  
  homeworks: Homework[];
  getHomeworksForUser: (user: User) => void;
  updateHomework: (id: string, updates: Partial<Homework>) => Promise<void>;
  
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
  const [homeworks, setHomeworks] = useState<Homework[]>([]);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [workers, setWorkers] = useState<User[]>([]);

  useEffect(() => {
    if (user) {
      getHomeworksForUser(user);
      if (user.role === 'super_worker') {
        fetchWorkersForSuperWorker(user.id).then(setWorkers);
      }
    } else {
      setHomeworks([]);
      setWorkers([]);
    }
  }, [user]);

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
            // The createUser function will throw an error with a specific message.
            return false;
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: "Registration Failed", description: error.message });
        return false;
    }
  };

  const getHomeworksForUser = async (currentUser: User) => {
    try {
        const userHomeworks = await fetchHomeworksForUser(currentUser);
        setHomeworks(userHomeworks);
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: "Error", description: "Could not fetch homeworks." });
    }
  };

  const updateHomework = async (id: string, updates: Partial<Homework>) => {
    try {
        await modifyHomework(id, updates);
        if (user) {
            getHomeworksForUser(user); // Refresh homeworks list
        }
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
    login,
    logout,
    register,
    authModalOpen,
    setAuthModalOpen,
    profileModalOpen,
    setProfileModalOpen,
    homeworks,
    getHomeworksForUser: () => user && getHomeworksForUser(user),
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
