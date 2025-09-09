"use client"
import React from "react";
import { useAppContext } from "@/contexts/app-context";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { HomeworkStatus } from "@/lib/types";
import { statusColors } from "@/lib/status-colors";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Search, Filter } from "lucide-react";
import PaymentInfo from "./payment-info";
import PriceIncreaseRequests from './price-increase-requests';

const HomeworkList = React.memo(function HomeworkList() {
    const { user, homeworks, getHomeworksForUser, setSelectedHomework, setIsHomeworkModalOpen } = useAppContext();
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [orderSearch, setOrderSearch] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const hasLoadedRef = useRef(false);
    const lastFetchTimeRef = useRef(0);
    const FETCH_COOLDOWN = 5000; // 5 seconds cooldown for automatic fetches
    const abortControllerRef = useRef<AbortController | null>(null);

    // Memoized status filter change handler
    const handleStatusFilterChange = useCallback((value: string) => {
        setStatusFilter(value);
    }, []);

    // Optimized data fetching with cooldown, deduplication, and abort control
    const fetchHomeworksWithCooldown = useCallback(async (force: boolean = false) => {
        const now = Date.now();
        if (!force && now - lastFetchTimeRef.current < FETCH_COOLDOWN) {
            return; // Skip if within cooldown period
        }
        
        if (isLoading || !user) return;
        
        // Cancel any ongoing request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        
        abortControllerRef.current = new AbortController();
        setIsLoading(true);
        lastFetchTimeRef.current = now;
        
        try {
            await getHomeworksForUser();
            hasLoadedRef.current = true;
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                console.error('Failed to fetch homeworks:', error);
            }
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    }, [user, getHomeworksForUser, isLoading]);

    // Initial load effect
    useEffect(() => {
        if (user && !hasLoadedRef.current) {
            fetchHomeworksWithCooldown();
        }
    }, [user, fetchHomeworksWithCooldown]);

    // Refresh handler - always bypass cache and cooldown
    const handleRefresh = useCallback(async () => {
        if (isLoading || !user) return;
        
        // Cancel any ongoing request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        
        abortControllerRef.current = new AbortController();
        setIsLoading(true);
        
        try {
            // Force fresh data by invalidating cache first
            const { invalidateUserCache } = await import('@/lib/cache');
            invalidateUserCache(user.id, user.role);
            
            await getHomeworksForUser();
            hasLoadedRef.current = true;
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                console.error('Failed to refresh homeworks:', error);
            }
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    }, [user, getHomeworksForUser, isLoading]);

    // Filter homeworks based on user role and filters with defensive checks
    const filteredHomeworks = useMemo(() => {
        if (!homeworks || !Array.isArray(homeworks) || homeworks.length === 0) return [];
        
        try {
            let filtered = homeworks.filter(hw => hw && typeof hw === 'object' && hw.status); // Ensure valid homework objects

            // Filter by status
            if (statusFilter && statusFilter !== "all") {
                filtered = filtered.filter(hw => hw && hw.status === statusFilter);
            }

            // Filter by order number search (for staff roles)
            if (orderSearch && orderSearch.trim() && user && user.role && ['agent', 'super_agent', 'super_worker'].includes(user.role)) {
                filtered = filtered.filter(hw => 
                    hw && hw.id && typeof hw.id === 'string' && hw.id.toLowerCase().includes(orderSearch.toLowerCase())
                );
            }

            return Array.isArray(filtered) ? filtered : [];
        } catch (error) {
            console.error('Error filtering homeworks:', error);
            return [];
        }
    }, [homeworks, statusFilter, orderSearch, user]);

    // Get available statuses for filter dropdown with role-specific filtering
    const availableStatuses = useMemo(() => {
        if (!homeworks || !Array.isArray(homeworks) || homeworks.length === 0 || !user) return [];
        try {
            const validHomeworks = homeworks.filter(hw => hw && typeof hw === 'object' && hw.status);
            if (validHomeworks.length === 0) return [];
            
            let statuses = [...new Set(validHomeworks.map(hw => hw.status).filter(status => status && typeof status === 'string'))];
            
            // Filter statuses based on user role for better UX
            if (user.role === 'super_worker') {
                // Super workers primarily see assignments and drafts
                statuses = statuses.filter(status => 
                    ['assigned_to_super_worker', 'assigned_to_worker', 'worker_draft', 'final_payment_approval', 'completed'].includes(status)
                );
            } else if (user.role === 'worker') {
                // Workers see their assignments and drafts
                statuses = statuses.filter(status => 
                    ['assigned_to_worker', 'worker_draft', 'final_payment_approval', 'completed'].includes(status)
                );
            }
            
            return Array.isArray(statuses) ? statuses.sort() : [];
        } catch (error) {
            console.error('Error processing available statuses:', error);
            return [];
        }
    }, [homeworks, user]);

    if (!user) return null;
    
    // Defensive check for homeworks array
    if (!homeworks) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading homework assignments...</p>
            </div>
        );
    }

    const isStaffRole = ['agent', 'super_agent', 'super_worker'].includes(user.role);

    const openHomeworkModal = (homeworkId: string) => {
        if (!homeworks || !Array.isArray(homeworks) || !homeworkId) return;
        try {
            const homework = homeworks.find(h => h && h.id === homeworkId);
            if (homework && typeof homework === 'object') {
                setSelectedHomework(homework);
                setIsHomeworkModalOpen(true);
            }
        } catch (error) {
            console.error('Error opening homework modal:', error);
        }
    }

    // Loading state display
    if (isLoading && !homeworks?.length) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading homework assignments...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Payment Information for Students */}
            <PaymentInfo />
            
            {/* Price Increase Requests Section */}
            <PriceIncreaseRequests />
            
            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {Array.isArray(availableStatuses) && availableStatuses.length > 0 && availableStatuses.map(status => (
                                <SelectItem key={status} value={status}>
                                    {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                {/* Order number search for staff roles */}
                {isStaffRole && (
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by order number..."
                            value={orderSearch}
                            onChange={(e) => setOrderSearch(e.target.value)}
                            className="w-full sm:w-[200px]"
                        />
                    </div>
                )}
                
                <div className="text-sm text-muted-foreground self-center">
                    {filteredHomeworks.length} of {homeworks?.length || 0} homework{(homeworks?.length || 0) !== 1 ? 's' : ''}
                </div>
                
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="flex items-center gap-1"
                >
                    {isLoading ? 'Loading...' : 'Refresh'}
                </Button>
            </div>

            {/* Homework Grid */}
            <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.isArray(filteredHomeworks) && filteredHomeworks.length > 0 ? filteredHomeworks.map(hw => {
                        // Additional safety check for each homework item
                        if (!hw || typeof hw !== 'object' || !hw.id || !hw.status) {
                            console.warn('Invalid homework item:', hw);
                            return null;
                        }
                        
                        return (
                            <Card 
                                key={hw.id} 
                                className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col"
                                onClick={() => openHomeworkModal(hw.id)}
                            >
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg">#{hw.id}</CardTitle>
                                    <Badge variant="outline" className={cn("capitalize", statusColors[hw.status as HomeworkStatus])}>
                                        {hw.status.replace(/_/g, ' ')}
                                    </Badge>
                                </div>
                                <CardDescription>{hw.moduleName}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-sm text-muted-foreground">Deadline: {hw.deadline ? new Date(hw.deadline).toLocaleDateString() : 'No deadline'}</p>
                                <p className="text-sm text-muted-foreground">Words: {hw.wordCount || 0}</p>
                                {hw.price && typeof hw.price === 'number' && (
                                    <p className="text-sm font-medium text-primary">Price: £{Number(hw.price).toFixed(2)}</p>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" className="w-full">View Details</Button>
                            </CardFooter>
                        </Card>
                        );
                    }).filter(Boolean) : (
                        <div className="col-span-full text-center text-muted-foreground py-10">
                            <p>
                                {statusFilter !== "all" || orderSearch.trim() 
                                    ? "No homework assignments match your filters." 
                                    : "No homework assignments found."
                                }
                            </p>
                            {(statusFilter !== "all" || orderSearch.trim()) && (
                                <Button 
                                    variant="link" 
                                    onClick={() => { setStatusFilter("all"); setOrderSearch(""); }}
                                    className="mt-2"
                                >
                                    Clear filters
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
});

export default HomeworkList;