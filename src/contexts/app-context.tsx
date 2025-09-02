
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { User, Homework, ReferenceCode, AnalyticsData, ProjectNumber, PricingConfig, Notification, UserRole, SuperAgentDashboardStats, HomeworkChangeRequestData, SuperWorkerWithFee } from '@/lib/types';
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
  requestChangesOnHomework as requestChangesAction,
  requestSuperWorkerChanges,
  uploadHomeworkFiles,
  updateUserProfile,
  initializeNotificationsSchema,
  fetchSuperWorkerFees,
  updateSuperWorkerFee,
  assignSuperWorkerToHomework,
  fetchSuperWorkersForAssignment,
} from '@/lib/actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DateRange } from 'react-day-picker';
import { addDays } from 'date-fns';

interface AppContextType {
  user: User | null;
  allUsers: User[];
  toast: ReturnType<typeof useToast>['toast'];
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, pass: string, refCode: string, termsAccepted: boolean) => Promise<boolean>;
  updateProfile: (updates: { name?: string; email?: string; password?: string }) => Promise<void>;
  
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  profileModalOpen: boolean;
  setProfileModalOpen: (open: boolean) => void;
  
  homeworks: Homework[];
  getHomeworksForUser: () => Promise<void>;
  updateHomework: (id: string, updates: Partial<Homework>) => Promise<void>;
  submitHomework: (data: {
        moduleName: string;
        projectNumber: ProjectNumber[];
        wordCount: number;
        deadline: Date;
        notes: string;
        files: { name: string; url: string }[];
        assignedSuperWorkerId?: string;
    }) => Promise<void>;
  requestChangesOnHomework: (homeworkId: string, data: HomeworkChangeRequestData) => Promise<void>;
  requestSuperWorkerChanges: (homeworkId: string, data: { newWordCount: number; newDeadline: Date; notes: string; }) => Promise<void>;
  uploadHomeworkFiles: (homeworkId: string, files: { name: string; url: string }[], fileType: 'worker_draft' | 'super_worker_review' | 'final_approved') => Promise<void>;

  selectedHomework: Homework | null;
  setSelectedHomework: (homework: Homework | null) => void;
  isHomeworkModalOpen: boolean;
  setIsHomeworkModalOpen: (open: boolean) => void;
  isNewHomeworkModalOpen: boolean;
  setIsNewHomeworkModalOpen: (open: boolean) => void;
  isRequestChangesModalOpen: boolean;
  setIsRequestChangesModalOpen: (open: boolean) => void;
  isSuperWorkerChangeModalOpen: boolean;
  setIsSuperWorkerChangeModalOpen: (open: boolean) => void;
  isFileUploadModalOpen: boolean;
  setIsFileUploadModalOpen: (open: boolean) => void;

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
  
  // Super Worker Assignment Functions
  superWorkerFees: SuperWorkerWithFee[];
  superWorkersForAssignment: User[];
  fetchSuperWorkerFees: () => Promise<void>;
  handleUpdateSuperWorkerFee: (workerId: string, fee: number) => Promise<void>;
  handleAssignSuperWorker: (homeworkId: string, workerId: string) => Promise<void>;
  fetchSuperWorkersForAssignment: () => Promise<void>;

  showConfetti: boolean;
  setShowConfetti: (show: boolean) => void;
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
  const [isRequestChangesModalOpen, setIsRequestChangesModalOpen] = useState(false);
  const [isSuperWorkerChangeModalOpen, setIsSuperWorkerChangeModalOpen] = useState(false);
  const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [workers, setWorkers] = useState<User[]>([]);
  const [referenceCodes, setReferenceCodes] = useState<ReferenceCode[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [superAgentStats, setSuperAgentStats] = useState<SuperAgentDashboardStats | null>(null);
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null);
  const [submissionAlert, setSubmissionAlert] = useState<{open: boolean, message: string}>({open: false, message: ''});
  const [analyticsDateRange, setAnalyticsDateRange] = useState<DateRange>({ from: addDays(new Date(), -30), to: new Date()});
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Super Worker Management State
  const [superWorkerFees, setSuperWorkerFees] = useState<SuperWorkerWithFee[]>([]);
  const [superWorkersForAssignment, setSuperWorkersForAssignment] = useState<User[]>([]);


  const getHomeworksForUser = useCallback(async () => {
    if (!user) return;
    try {
        const userHomeworks = await fetchHomeworksForUser(user);
        setHomeworks(userHomeworks);
    } catch (error) {
        console.error('Error fetching homeworks:', error);
        // Don't include toast here to avoid dependency loops
    }
  }, [user]);

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
      console.log('Fetching analytics with date range:', analyticsDateRange);
      const data = await getAnalyticsForUser(user, analyticsDateRange.from, analyticsDateRange.to);
      console.log('Analytics data received:', data);
      setAnalyticsData(data);

      if(user.role === 'super_agent') {
        const stats = await getSuperAgentDashboardStats(analyticsDateRange.from, analyticsDateRange.to);
        setSuperAgentStats(stats);
      }

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({ variant: 'destructive', title: "Analytics Error", description: "Could not fetch analytics data." });
    }
  }, [user, analyticsDateRange, toast]);
  
  const fetchUserNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchNotificationsForUser(user.id);
      setNotifications(data);
      setUnreadNotificationCount(data.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Don't include toast here to avoid dependency loops
    }
  }, [user]);
  
  const handleMarkNotificationsAsRead = useCallback(async () => {
    if (!user) return;
    try {
      await markNotificationsAsRead(user.id);
      setUnreadNotificationCount(0);
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
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

  useEffect(() => {
    if (user && analyticsDateRange.from && analyticsDateRange.to) {
      console.log('Date range changed, fetching analytics...');
      fetchAnalytics();
    }
  }, [analyticsDateRange, fetchAnalytics, user]);

  const fetchAllData = useCallback(() => {
      getHomeworksForUser();
      fetchAnalytics();
      fetchUserNotifications();
  }, [getHomeworksForUser, fetchAnalytics, fetchUserNotifications]);

  useEffect(() => {
    if (user) {
      fetchAllData(); 
      fetchPricingConfig();
      
      if (user.role === 'super_worker') {
        fetchWorkersForSuperWorker(user.id).then(setWorkers);
      }
      if (user.role === 'super_agent') {
        fetchAllCodes();
        fetchUsers().then(setAllUsers);
        fetchSuperWorkerFeesHandler();
        fetchSuperWorkersForAssignmentHandler();
      }
      
      // NO AUTOMATIC POLLING - only manual refresh on user actions
      
    } else {
      setHomeworks([]);
      setWorkers([]);
      setReferenceCodes([]);
      setAllUsers([]);
      setAnalyticsData(null);
      setPricingConfig(null);
      setNotifications([]);
      setUnreadNotificationCount(0);
      setSuperAgentStats(null);
      setSuperWorkerFees([]);
      setSuperWorkersForAssignment([]);
    }
  }, [user, fetchAllCodes, fetchPricingConfig]); // Removed all the polling-related dependencies

  // Check localStorage for persistent login on app startup
  useEffect(() => {
    const savedUser = localStorage.getItem('prohappy_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('prohappy_user');
      }
    }
    
    // Initialize notifications schema on app startup
    initializeNotificationsSchema().catch(error => {
      console.error('Error initializing notifications schema:', error);
    });
  }, []);


  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const foundUser = await authenticateUser(email, pass);
      if (foundUser) {
        setUser(foundUser);
        localStorage.setItem('prohappy_user', JSON.stringify(foundUser));
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
    localStorage.removeItem('prohappy_user');
    setProfileModalOpen(false);
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
  };
  
  const register = async (name: string, email: string, pass: string, refCode: string, termsAccepted: boolean): Promise<boolean> => {
     try {
        const newUser = await createUser(name, email, pass, refCode, termsAccepted);
        if (newUser) {
            setUser(newUser);
            localStorage.setItem('prohappy_user', JSON.stringify(newUser));
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

  const updateProfile = async (updates: { name?: string; email?: string; password?: string }) => {
    if (!user) return;
    try {
      const updatedUser = await updateUserProfile(user.id, updates);
      setUser(updatedUser);
      localStorage.setItem('prohappy_user', JSON.stringify(updatedUser));
      setProfileModalOpen(false);
      toast({ title: "Profile Updated", description: "Your profile has been updated successfully." });
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: "Update Failed", description: error.message || "Could not update profile." });
    }
  };

  const updateHomework = async (id: string, updates: Partial<Homework>) => {
    try {
        await modifyHomework(id, updates);
        
        // Immediate refresh for real-time feeling
        await Promise.all([
          getHomeworksForUser(),
          fetchUserNotifications(),
          fetchAnalytics()
        ]);
        
        if (selectedHomework && selectedHomework.id === id) {
            setSelectedHomework({ ...selectedHomework, ...updates });
        }
        toast({ title: "Homework Updated", description: `Homework #${id} has been updated.` });
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: "Error", description: "Could not update homework." });
    }
  }

  const requestChangesOnHomework = async (homeworkId: string, data: HomeworkChangeRequestData) => {
      try {
          await requestChangesAction(homeworkId, data);
          
          // Immediate refresh for real-time feeling
          await Promise.all([
            getHomeworksForUser(),
            fetchUserNotifications()
          ]);
          
          toast({ title: "Changes Requested", description: "Your request has been submitted to the worker." });
      } catch (error) {
          console.error(error);
          toast({ variant: 'destructive', title: "Error", description: "Could not submit your request." });
      }
  };

  const requestSuperWorkerChangesHandler = async (homeworkId: string, data: { newWordCount: number; newDeadline: Date; notes: string; }) => {
      try {
          await requestSuperWorkerChanges(homeworkId, data);
          
          // Immediate refresh for real-time feeling
          await Promise.all([
            getHomeworksForUser(),
            fetchUserNotifications()
          ]);
          
          toast({ title: "Change Request Submitted", description: "Your change request has been sent to the student for approval." });
      } catch (error) {
          console.error(error);
          toast({ variant: 'destructive', title: "Error", description: "Could not submit change request." });
      }
  };
  
  // =========================
  // SUPER WORKER MANAGEMENT
  // =========================
  
  const fetchSuperWorkerFeesHandler = useCallback(async () => {
    if (!user || user.role !== 'super_agent') return;
    try {
      console.log('Fetching super worker fees...');
      const fees = await fetchSuperWorkerFees();
      console.log('Received fees:', fees);
      setSuperWorkerFees(fees);
    } catch (error) {
      console.error('Error fetching super worker fees:', error);
      // Set empty array instead of keeping old state on error
      setSuperWorkerFees([]);
      toast({ variant: 'destructive', title: "Error", description: "Could not fetch super worker fees. Please try the migration again." });
    }
  }, [user, toast]);
  
  const fetchSuperWorkersForAssignmentHandler = useCallback(async () => {
    if (!user || user.role !== 'super_agent') return;
    try {
      const workers = await fetchSuperWorkersForAssignment();
      setSuperWorkersForAssignment(workers);
    } catch (error) {
      console.error('Error fetching super workers:', error);
      toast({ variant: 'destructive', title: "Error", description: "Could not fetch super workers." });
    }
  }, [user, toast]);
  
  const handleUpdateSuperWorkerFee = async (workerId: string, fee: number) => {
    try {
      await updateSuperWorkerFee(workerId, fee);
      await fetchSuperWorkerFeesHandler();
      toast({ title: "Success", description: "Super worker fee updated successfully." });
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: "Error", description: error.message || "Could not update super worker fee." });
    }
  };
  
  const handleAssignSuperWorker = async (homeworkId: string, workerId: string) => {
    try {
      await assignSuperWorkerToHomework(homeworkId, workerId);
      
      // Refresh homework data to show updated assignment
      await getHomeworksForUser();
      
      // Update selected homework if it's the one being modified
      if (selectedHomework && selectedHomework.id === homeworkId) {
        const worker = superWorkersForAssignment.find(w => w.id === workerId);
        setSelectedHomework({
          ...selectedHomework,
          superWorkerId: workerId,
          assignedSuperWorkerName: worker?.name
        });
      }
      
      toast({ title: "Success", description: "Super worker assigned successfully." });
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: "Error", description: error.message || "Could not assign super worker." });
    }
  };

  const uploadHomeworkFilesHandler = async (homeworkId: string, files: { name: string; url: string }[], fileType: 'worker_draft' | 'super_worker_review' | 'final_approved') => {
      if (!user) return;
      try {
          await uploadHomeworkFiles(homeworkId, files, user.id, fileType);
          
          // Immediate refresh for real-time feeling
          await Promise.all([
            getHomeworksForUser(),
            fetchUserNotifications()
          ]);
          
          const fileTypeText = fileType === 'worker_draft' ? 'draft files' : 
                             fileType === 'super_worker_review' ? 'reviewed files' : 'final files';
          toast({ title: "Files Uploaded", description: `${fileTypeText} have been uploaded successfully.` });
      } catch (error) {
          console.error(error);
          toast({ variant: 'destructive', title: "Error", description: "Could not upload files." });
      }
  };

  const submitHomework = async (data: {
        moduleName: string;
        projectNumber: ProjectNumber[];
        wordCount: number;
        deadline: Date;
        notes: string;
        files: { name: string; url: string }[];
        assignedSuperWorkerId?: string;
    }) => {
      if(!user) return;
      try {
        const result = await createHomework(user, data);
        
        // Immediate refresh for real-time feeling
        await Promise.all([
          getHomeworksForUser(),
          fetchUserNotifications(),
          fetchAnalytics()
        ]);
        
        setIsNewHomeworkModalOpen(false);
        setSubmissionAlert({ open: true, message: result.message });
        setShowConfetti(true);
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

  const handleSetAnalyticsDateRange = useCallback((range: DateRange) => {
    console.log('Setting analytics date range:', range);
    setAnalyticsDateRange(range);
  }, []);


  const value = {
    user,
    allUsers,
    toast,
    login,
    logout,
    register,
    updateProfile,
    authModalOpen,
    setAuthModalOpen,
    profileModalOpen,
    setProfileModalOpen,
    homeworks,
    getHomeworksForUser,
    updateHomework,
    submitHomework,
    requestChangesOnHomework,
    requestSuperWorkerChanges: requestSuperWorkerChangesHandler,
    uploadHomeworkFiles: uploadHomeworkFilesHandler,
    selectedHomework,
    setSelectedHomework,
    isHomeworkModalOpen,
    setIsHomeworkModalOpen,
    isNewHomeworkModalOpen,
    setIsNewHomeworkModalOpen,
    isRequestChangesModalOpen,
    setIsRequestChangesModalOpen,
    isSuperWorkerChangeModalOpen,
    setIsSuperWorkerChangeModalOpen,
    isFileUploadModalOpen,
    setIsFileUploadModalOpen,
    workers,
    referenceCodes,
    fetchAllCodes,
    handleUpdateReferenceCode,
    handleCreateReferenceCode,
    analyticsData,
    setAnalyticsDateRange: handleSetAnalyticsDateRange,
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
    // Super Worker Assignment Functions
    superWorkerFees,
    superWorkersForAssignment,
    fetchSuperWorkerFees: fetchSuperWorkerFeesHandler,
    handleUpdateSuperWorkerFee,
    handleAssignSuperWorker,
    fetchSuperWorkersForAssignment: fetchSuperWorkersForAssignmentHandler,
    showConfetti,
    setShowConfetti,
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
