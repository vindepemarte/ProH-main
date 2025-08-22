
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { User, Homework, ReferenceCode, AnalyticsData, ProjectNumber, PricingConfig, Notification, UserRole, SuperAgentDashboardStats } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { 
  fetchUsers, 
  authenticateUser, 
  createUser, 
  fetchHomeworksForUser, 
  modifyHomework, 
  fetchWorkersForSuperWorker, 
  fetchAllReferenceCodes, 
  updateReferenceCode,
  createHomework, 
  getAnalyticsForUser,
  getPricingConfig,
  savePricingConfig,
  getCalculatedPrice,
  fetchNotificationsForUser,
  broadcastNotification,
  updateUserRole,
  markNotificationsAsRead,
  createReferenceCode,
  getSuperAgentDashboardStats,
} from '@/lib/actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DateRange } from 'react-day-picker';
import { addDays } from 'date-fns';

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
  fetchAllCodes: () => void;
  handleUpdateReferenceCode: (oldCode: string, newCode: string) => Promise<void>;
  handleCreateReferenceCode: (code: string, role: UserRole, ownerId: string) => Promise<void>;
  
  analyticsData: AnalyticsData | null;
  setAnalyticsDateRange: (range: DateRange) => void;
  superAgentStats: SuperAgentDashboardStats | null;

  pricingConfig: PricingConfig | null;
  fetchPricingConfig: () => void;
  handleSavePricingConfig: (config: PricingConfig) => Promise<void>;

  calculatePrice: (wordCount: number, deadline: Date) => Promise<number>;
  
  notifications: Notification[];
  handleBroadcastNotification: (message: string, targetRole?: UserRole, targetUser?: string) => Promise<void>;
  handleMarkNotificationsAsRead: () => void;
  unreadNotificationCount: number;

  handleUpdateUserRole: (userId: string, newRole: UserRole) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false);
  const [isNewHomeworkModalOpen, setIsNewHomeworkModalOpen] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [workers, setWorkers] = useState<User[]>([]);
  const [referenceCodes, setReferenceCodes] = useState<ReferenceCode[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [superAgentStats, setSuperAgentStats] = useState<SuperAgentDashboardStats | null>(null);
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null);
  const [submissionAlert, setSubmissionAlert] = useState<{open: boolean, message: string}>({open: false, message: ''});
  const [analyticsDateRange, setAnalyticsDateRange] = useState<DateRange>({ from: addDays(new Date(), -30), to: new Date()});


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

  const fetchAllCodes = useCallback(async () => {
    if (!user || user.role !== 'super_agent') return;
    try {
      const codes = await fetchAllReferenceCodes();
      setReferenceCodes(codes);
    } catch (error) {
       console.error(error);
       toast({ variant: 'destructive', title: "Error", description: "Could not fetch reference codes." });
    }
  }, [user, toast]);

  const handleUpdateReferenceCode = async (oldCode: string, newCode: string) => {
    try {
      await updateReferenceCode(oldCode, newCode);
      await fetchAllCodes();
      toast({ title: "Success", description: `Reference code ${oldCode} updated to ${newCode}.`});
    } catch(error: any) {
       toast({ variant: 'destructive', title: "Error", description: error.message });
    }
  }

  const handleCreateReferenceCode = async (code: string, role: UserRole, ownerId: string) => {
    try {
      await createReferenceCode(code, role, ownerId);
      await fetchAllCodes();
      toast({ title: "Success", description: `Reference code ${code} created.`});
    } catch (error: any) {
       toast({ variant: 'destructive', title: "Error", description: error.message });
    }
  };
  
  const fetchAnalytics = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getAnalyticsForUser(user, analyticsDateRange.from, analyticsDateRange.to);
      setAnalyticsData(data);

      if(user.role === 'super_agent') {
        const stats = await getSuperAgentDashboardStats();
        setSuperAgentStats(stats);
      }

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: "Error", description: "Could not fetch analytics data." });
    }
  }, [user, toast, analyticsDateRange]);
  
  const fetchUserNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchNotificationsForUser(user.id);
      setNotifications(data);
      setUnreadNotificationCount(data.filter(n => !n.is_read).length);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: "Error", description: "Could not fetch notifications." });
    }
  }, [user, toast]);
  
  const handleMarkNotificationsAsRead = useCallback(async () => {
    if (!user) return;
    try {
      await markNotificationsAsRead(user.id);
      // Optimistically update the UI
      setUnreadNotificationCount(0);
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      // Re-fetch for consistency
      await fetchUserNotifications();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: "Error", description: "Could not mark notifications as read." });
    }
  }, [user, toast, notifications, fetchUserNotifications]);


  const fetchPricingConfig = useCallback(async () => {
    try {
        const config = await getPricingConfig();
        setPricingConfig(config);
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: "Error", description: "Could not fetch pricing configuration." });
    }
  }, [toast]);

  const handleSavePricingConfig = async (config: PricingConfig) => {
    try {
        await savePricingConfig(config);
        setPricingConfig(config);
        toast({ title: "Success", description: "Pricing configuration saved."});
    } catch(error) {
        console.error(error);
        toast({ variant: 'destructive', title: "Error", description: "Could not save pricing configuration." });
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: UserRole) => {
     try {
        await updateUserRole(userId, newRole);
        const updatedUsers = allUsers.map(u => u.id === userId ? { ...u, role: newRole } : u);
        setAllUsers(updatedUsers);
        toast({ title: "Success", description: "User role updated successfully."});
    } catch(error) {
        console.error(error);
        toast({ variant: 'destructive', title: "Error", description: "Could not update user role." });
    }
  }

  const handleBroadcastNotification = async (message: string, targetRole?: UserRole, targetUser?: string) => {
     try {
        await broadcastNotification({ message, targetRole, targetUser });
        toast({ title: "Success", description: "Notification sent."});
    } catch(error: any) {
        console.error(error);
        toast({ variant: 'destructive', title: "Error", description: error.message || "Could not send notification." });
    }
  }

  const fetchAllData = useCallback(() => {
      getHomeworksForUser();
      fetchAnalytics();
      fetchUserNotifications();
  }, [getHomeworksForUser, fetchAnalytics, fetchUserNotifications]);

  useEffect(() => {
    if (user) {
      fetchAllData(); // Fetch initial data
      fetchPricingConfig();
      
      if (user.role === 'super_worker') {
        fetchWorkersForSuperWorker(user.id).then(setWorkers);
      }
      if (user.role === 'super_agent') {
        fetchAllCodes();
        fetchUsers().then(setAllUsers);
      }
      
      // Set up polling
      const intervalId = setInterval(fetchAllData, 30000); // Poll every 30 seconds
      
      return () => clearInterval(intervalId); // Cleanup on logout or unmount
    } else {
      // Clear all data on logout
      setHomeworks([]);
      setWorkers([]);
      setReferenceCodes([]);
      setAllUsers([]);
      setAnalyticsData(null);
      setPricingConfig(null);
      setNotifications([]);
      setUnreadNotificationCount(0);
      setSuperAgentStats(null);
    }
  }, [user, fetchAllData, fetchAllCodes, fetchPricingConfig]);


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
        await getHomeworksForUser(); 
        
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
        const result = await createHomework(user, data);
        await getHomeworksForUser();
        setIsNewHomeworkModalOpen(false);
        setSubmissionAlert({ open: true, message: result.message });
      } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: "Submission Error", description: "Could not submit your homework." });
      }
  }

  const calculatePrice = useCallback(async (wordCount: number, deadline: Date) => {
    if (!wordCount || !deadline) return 0;
    try {
      return await getCalculatedPrice(wordCount, deadline);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: "Error", description: "Could not calculate price." });
      return 0;
    }
  }, [toast]);


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
    fetchAllCodes,
    handleUpdateReferenceCode,
    handleCreateReferenceCode,
    analyticsData,
    setAnalyticsDateRange,
    superAgentStats,
    pricingConfig,
    fetchPricingConfig,
    handleSavePricingConfig,
    calculatePrice,
    notifications,
    handleBroadcastNotification,
    handleMarkNotificationsAsRead,
    unreadNotificationCount,
    handleUpdateUserRole,
  };

  return (
    <AppContext.Provider value={value}>
        {children}
        <AlertDialog open={submissionAlert.open} onOpenChange={(open) => setSubmissionAlert({...submissionAlert, open})}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Homework Submitted!</AlertDialogTitle>
                    <AlertDialogDescription>
                        {submissionAlert.message}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={() => setSubmissionAlert({open: false, message: ''})}>OK</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
