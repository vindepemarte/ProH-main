"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { User, Homework, HomeworkStatus, UserRole, ReferenceCode, AnalyticsData, ProjectNumber } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { fetchUsers, authenticateUser, createUser, fetchHomeworksForUser, modifyHomework, fetchWorkersForSuperWorker, fetchReferenceCodesForUser, createHomework, getAnalyticsForUser } from '@/lib/actions';

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
  submitHomework: (data: {
        moduleName: string;
        projectNumber: ProjectNumber[];
        wordCount: number;
        deadline: Date;
        notes: string;
        files: { name: string; url: string }[];
    }) => Promise<void>;

  selectedHomework: Homework | null;
  setSelectedHomework: (homework: Homework | null) => void;
  isHomeworkModalOpen: boolean;
  setIsHomeworkModalOpen: (open: boolean) => void;
  isNewHomeworkModalOpen: boolean;
  setIsNewHomeworkModalOpen: (open: boolean) => void;

  workers: User[];
  referenceCodes: ReferenceCode[];
  getReferenceCodesForUser: () => void;
  analyticsData: AnalyticsData | null;
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
  const [isNewHomeworkModalOpen, setIsNewHomeworkModalOpen] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [workers, setWorkers] = useState<User[]>([]);
  const [referenceCodes, setReferenceCodes] = useState<ReferenceCode[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

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
  
  const fetchAnalytics = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getAnalyticsForUser(user);
      setAnalyticsData(data);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: "Error", description: "Could not fetch analytics data." });
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      getHomeworksForUser();
      fetchAnalytics();
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
      setAnalyticsData(null);
    }
  }, [user, getHomeworksForUser, getReferenceCodesForUser, fetchAnalytics]);

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
        await getHomeworksForUser(); // Refresh homeworks list
        
        if (selectedHomework && selectedHomework.id === id) {
            setSelectedHomework({ ...selectedHomework, ...updates });
        }
        toast({ title: "Homework Updated", description: `Homework #${id.split('_')[1]} has been updated.` });
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: "Error", description: "Could not update homework." });
    }
  }

  const submitHomework = async (data: {
        moduleName: string;
        projectNumber: ProjectNumber[];
        wordCount: number;
        deadline: Date;
        notes: string;
        files: { name: string; url: string }[];
    }) => {
      if(!user) return;
      try {
        await createHomework(user, data);
        await getHomeworksForUser();
        setIsNewHomeworkModalOpen(false);
        toast({ title: "Homework Submitted", description: "Your homework has been submitted for approval." });
      } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: "Submission Error", description: "Could not submit your homework." });
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
    submitHomework,
    selectedHomework,
    setSelectedHomework,
    isHomeworkModalOpen,
    setIsHomeworkModalOpen,
    isNewHomeworkModalOpen,
    setIsNewHomeworkModalOpen,
    workers,
    referenceCodes,
    getReferenceCodesForUser,
    analyticsData,
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
