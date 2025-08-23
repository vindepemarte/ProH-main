
"use client"
import { useAppContext } from "@/contexts/app-context";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { HomeworkStatus } from "@/lib/types";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Search, Filter } from "lucide-react";

const statusColors: Record<HomeworkStatus, string> = {
  payment_approval: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
  in_progress: "bg-blue-500/20 text-blue-700 border-blue-500/30",
  requested_changes: "bg-orange-500/20 text-orange-700 border-orange-500/30",
  final_payment_approval: "bg-green-500/20 text-green-700 border-green-500/30",
  word_count_change: "bg-purple-500/20 text-purple-700 border-purple-500/30",
  deadline_change: "bg-indigo-500/20 text-indigo-700 border-indigo-500/30",
  declined: "bg-red-500/20 text-red-700 border-red-500/30",
  refund: "bg-gray-500/20 text-gray-700 border-gray-500/30",
  completed: "bg-teal-500/20 text-teal-700 border-teal-500/30",
};

export default function HomeworkList() {
    const { user, homeworks, getHomeworksForUser, setSelectedHomework, setIsHomeworkModalOpen } = useAppContext();
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [orderSearch, setOrderSearch] = useState("");
    const hasLoadedRef = useRef(false);
    const isLoadingRef = useRef(false);

    // Safe status filter change handler that prevents cascading updates
    const handleStatusFilterChange = useCallback((value: string) => {
        setStatusFilter(value);
    }, []); // Remove statusFilter from dependencies to prevent circular updates

    useEffect(() => {
        if (user && !hasLoadedRef.current && !isLoadingRef.current) {
            isLoadingRef.current = true;
            hasLoadedRef.current = true;
            getHomeworksForUser().finally(() => {
                isLoadingRef.current = false;
            });
        }
    }, [user]); // Only depend on user, not getHomeworksForUser

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

    // Get available statuses for filter dropdown with defensive checks
    const availableStatuses = useMemo(() => {
        if (!homeworks || !Array.isArray(homeworks) || homeworks.length === 0) return [];
        try {
            const validHomeworks = homeworks.filter(hw => hw && typeof hw === 'object' && hw.status);
            if (validHomeworks.length === 0) return [];
            
            const statuses = [...new Set(validHomeworks.map(hw => hw.status).filter(status => status && typeof status === 'string'))];
            return Array.isArray(statuses) ? statuses.sort() : [];
        } catch (error) {
            console.error('Error processing available statuses:', error);
            return [];
        }
    }, [homeworks]);

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

    return (
        <div className="space-y-4">
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
                                    <Badge variant="outline" className={cn("capitalize", statusColors[hw.status])}>
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
}
