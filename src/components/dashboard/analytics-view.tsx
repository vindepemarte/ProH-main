
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppContext } from "@/contexts/app-context";
import { useMemo, useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CalendarIcon, TrendingUp, Users, Wallet, Target, Search } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { DateRange } from "react-day-picker";
import { addDays, format, differenceInDays } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";

function SuperAgentKPIs({ dateRange }: { dateRange: DateRange | undefined }) {
    const { superAgentStats } = useAppContext();

    if (!superAgentStats) return null;
    
    // Check if there are any completed homeworks for TBP calculations
    const hasCompletedHomeworks = superAgentStats.toBePaidSuperWorker > 0 || superAgentStats.toBePaidAgents > 0;
    
    const kpis = [
        { title: "Total Revenue", value: `£${superAgentStats.totalRevenue.toFixed(2)}`, icon: Wallet },
        { title: "Total Profit", value: `£${superAgentStats.totalProfit.toFixed(2)}`, icon: TrendingUp },
        { title: "Platform Fees", value: `£${superAgentStats.totalPlatformFees.toFixed(2)}`, icon: Target, subtitle: dateRange ? 'Filtered period' : 'All time' },
        { title: "Total Students", value: superAgentStats.totalStudents, icon: Users },
        { title: "Avg. Profit", value: `£${superAgentStats.averageProfitPerHomework.toFixed(2)}`, icon: Target },
        { 
            title: "TBP S.Worker", 
            value: hasCompletedHomeworks ? `£${superAgentStats.toBePaidSuperWorker.toFixed(2)}` : "N/A", 
            icon: Wallet, 
            subtitle: hasCompletedHomeworks ? 'Current month' : 'Complete homeworks to see payments'
        },
        { 
            title: "TBP Agents", 
            value: hasCompletedHomeworks ? `£${superAgentStats.toBePaidAgents.toFixed(2)}` : "N/A", 
            icon: Users, 
            subtitle: hasCompletedHomeworks ? 'Current month' : 'Complete homeworks to see payments'
        },
    ]

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-7 mb-6">
            {kpis.map(kpi => (
                <Card key={kpi.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                        <kpi.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpi.value}</div>
                        {kpi.subtitle && (
                            <p className="text-xs text-muted-foreground mt-1">{kpi.subtitle}</p>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

function StudentsPerAgentTable() {
    const { superAgentStats } = useAppContext();
    const [searchTerm, setSearchTerm] = useState("");

    const filteredAgents = useMemo(() => {
        if (!superAgentStats || !superAgentStats.studentsPerAgent) return [];
        if (!searchTerm) return superAgentStats.studentsPerAgent;
        return superAgentStats.studentsPerAgent.filter(agent =>
            agent.agentName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [superAgentStats, searchTerm]);

    if (!superAgentStats || !superAgentStats.studentsPerAgent) return null;
    
    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Students per Agent</CardTitle>
                <CardDescription>Agent performance with current month payments (minus refunded assignments).</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="relative mb-4">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Filter agents..." 
                        className="pl-8" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <ScrollArea className="h-72">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Agent Name</TableHead>
                                <TableHead className="text-right">To be Paid</TableHead>
                                <TableHead className="text-right">Student Count</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAgents.length > 0 ? filteredAgents.map(agent => {
                                const hasCompletedHomeworks = agent.toBePaid > 0;
                                return (
                                    <TableRow key={agent.agentName}>
                                        <TableCell className="font-medium">{agent.agentName}</TableCell>
                                        <TableCell className="text-right">
                                            {hasCompletedHomeworks ? `£${agent.toBePaid.toFixed(2)}` : "N/A"}
                                        </TableCell>
                                        <TableCell className="text-right">{agent.studentCount}</TableCell>
                                    </TableRow>
                                );
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                                        No agents found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}

function SuperWorkersTable() {
    const { superAgentStats } = useAppContext();
    const [searchTerm, setSearchTerm] = useState("");

    const filteredSuperWorkers = useMemo(() => {
        if (!superAgentStats || !superAgentStats.superWorkersData) return [];
        if (!searchTerm) return superAgentStats.superWorkersData;
        return superAgentStats.superWorkersData.filter(superWorker =>
            superWorker.superWorkerName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [superAgentStats, searchTerm]);

    if (!superAgentStats || !superAgentStats.superWorkersData) return null;
    
    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Super Workers</CardTitle>
                <CardDescription>Super worker performance with current month payments and completed assignments.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="relative mb-4">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Filter super workers..." 
                        className="pl-8" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <ScrollArea className="h-72">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Super Worker Name</TableHead>
                                <TableHead className="text-right">To be Paid</TableHead>
                                <TableHead className="text-right">Assignments Done</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSuperWorkers.length > 0 ? filteredSuperWorkers.map(superWorker => {
                                const hasCompletedHomeworks = superWorker.assignmentsDone > 0;
                                return (
                                    <TableRow key={superWorker.superWorkerName}>
                                        <TableCell className="font-medium">{superWorker.superWorkerName}</TableCell>
                                        <TableCell className="text-right">
                                            {hasCompletedHomeworks ? `£${superWorker.toBePaid.toFixed(2)}` : "N/A"}
                                        </TableCell>
                                        <TableCell className="text-right">{superWorker.assignmentsDone}</TableCell>
                                    </TableRow>
                                );
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                                        No super workers found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}


export default function AnalyticsView() {
    const { user, analyticsData, setAnalyticsDateRange, superAgentStats } = useAppContext();
    const [date, setDate] = useState<DateRange | undefined>({
        from: addDays(new Date(), -30), // Default to last 30 days
        to: new Date(),
    });

    // Initialize analytics date range on mount
    useEffect(() => {
        if (date?.from && date?.to) {
            setAnalyticsDateRange(date);
        }
    }, []); // Only run on mount

    const chartData = useMemo(() => {
        if (!analyticsData || (!analyticsData.metric1.length && !analyticsData.metric2.length)) {
            return [];
        }

        const daysDifference = differenceInDays(date?.to || new Date(), date?.from || new Date());
        const isDailyView = daysDifference <= 31;
        
        const combinedDataMap = new Map<string, { metric1: number; metric2: number }>();

        analyticsData.metric1.forEach(item => {
            combinedDataMap.set(item.date, { metric1: item.value, metric2: 0 });
        });

        analyticsData.metric2.forEach(item => {
            if (combinedDataMap.has(item.date)) {
                combinedDataMap.get(item.date)!.metric2 = item.value;
            } else {
                combinedDataMap.set(item.date, { metric1: 0, metric2: item.value });
            }
        });

        const sortedDates = Array.from(combinedDataMap.keys()).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        return sortedDates.map(d => {
            const name = isDailyView ? format(new Date(d), 'd MMM') : format(new Date(d), 'MMM');
            const dataPoint = combinedDataMap.get(d)!;
            return {
                name,
                metric1: dataPoint.metric1,
                metric2: dataPoint.metric2,
            };
        });

    }, [analyticsData, date]);
    
    const handleDateRangeChange = (range: DateRange | undefined) => {
        if(range?.from && range?.to) {
            setDate(range);
            setAnalyticsDateRange(range);
        }
    }
    
    const setPresetRange = (days: number) => {
        const to = new Date(); // Today
        const from = days === 0 ? new Date() : addDays(new Date(), -days); // Today or X days ago
        setDate({ from, to });
        setAnalyticsDateRange({ from, to });
    };


    if (!user) return null;

    // Workers have NO analytics as per requirements
    if (user.role === 'worker') {
        return (
            <div className="p-4 space-y-4">
                <h2 className="text-2xl font-bold">Analytics</h2>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-muted-foreground text-center">
                            Analytics are not available for workers.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Role-based titles and descriptions
    const getRoleBasedLabels = () => {
        switch (user.role) {
            case 'student':
                return {
                    metric1: { title: 'Spending Overview', description: 'Total amount spent on homework assignments.' },
                    metric2: { title: 'Submissions Overview', description: 'Number of homework assignments submitted.' }
                };
            case 'agent':
                return {
                    metric1: { title: 'Commission Earnings', description: 'Total commission earned from student referrals (minus refunded homeworks).' },
                    metric2: { title: 'Student Assignments', description: 'Number of assignments from your students (excluding refunded).' }
                };
            case 'super_worker':
                return {
                    metric1: { title: 'Fee Earnings', description: 'Total fees earned from reviewing assignments (based on 500 words pricing).' },
                    metric2: { title: 'Assignments Handled', description: 'Number of assignments managed and reviewed by you.' }
                };
            case 'super_agent':
                return {
                    metric1: { title: 'Total Revenue', description: 'Total revenue from all assignments (minus declined and refunded).' },
                    metric2: { title: 'Total Assignments', description: 'Total number of assignments in the system (minus declined and refunded).' }
                };
            default:
                return {
                    metric1: { title: 'Overview', description: 'Data overview.' },
                    metric2: { title: 'Activity', description: 'Activity overview.' }
                };
        }
    };

    const labels = getRoleBasedLabels();
    
    const titles = {
        metric1: labels.metric1.title,
        metric2: labels.metric2.title
    };
    
    const descriptions = {
        metric1: labels.metric1.description,
        metric2: labels.metric2.description
    };
    
    const dataKeys = {
        metric1: 'metric1',
        metric2: 'metric2'
    }

    const noData = !chartData || chartData.length === 0;

    return (
        <div className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                 <h2 className="text-2xl font-bold">Analytics</h2>
                 <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPresetRange(0)}>Today</Button>
                    <Button variant="outline" size="sm" onClick={() => setPresetRange(7)}>7D</Button>
                    <Button variant="outline" size="sm" onClick={() => setPresetRange(30)}>30D</Button>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                size="sm"
                                className="w-full sm:w-[240px] justify-start text-left font-normal"
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                    date.to ? (
                                    <>
                                        {format(date.from, "LLL dd, y")} -{" "}
                                        {format(date.to, "LLL dd, y")}
                                    </>
                                    ) : (
                                    format(date.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Pick a date</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-1" align="end">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={handleDateRangeChange}
                                onDone={() => {
                                    // Only close the popover when both from and to dates are selected
                                    if (date?.from && date?.to) {
                                        // Close the popover after selecting a date range
                                        const popover = document.querySelector('[data-state="open"]');
                                        if (popover) {
                                            const trigger = popover.previousElementSibling as HTMLElement;
                                            if (trigger) trigger.click();
                                        }
                                    }
                                }}
                                numberOfMonths={1}
                            />
                        </PopoverContent>
                    </Popover>
                 </div>
            </div>
            
            {user.role === 'super_agent' && <SuperAgentKPIs dateRange={date} />}

            {noData ? (
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-muted-foreground text-center">
                            No analytics data available for the selected period.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {/* First Chart - Earnings/Spending */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{titles.metric1}</CardTitle>
                            <CardDescription>{descriptions.metric1}</CardDescription>
                        </CardHeader>
                            <CardContent className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                        <defs>
                                            <linearGradient id="colorMetric1" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                                        <YAxis stroke="hsl(var(--foreground))" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--background))',
                                                borderColor: 'hsl(var(--border))'
                                            }}
                                            formatter={(value) => {
                                                // Special formatting based on role
                                                if (user.role === 'student' || user.role === 'super_agent' || user.role === 'agent' || user.role === 'super_worker') {
                                                    return `£${Number(value).toFixed(2)}`;
                                                }
                                                return Number(value).toFixed(0);
                                            }}
                                        />
                                        <Area type="monotone" dataKey={dataKeys.metric1} name={titles.metric1} stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorMetric1)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    
                    {/* Second Chart - Assignments/Activity */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{titles.metric2}</CardTitle>
                             <CardDescription>{descriptions.metric2}</CardDescription>
                        </CardHeader>
                        <CardContent className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="colorMetric2" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                                    <YAxis stroke="hsl(var(--foreground))" allowDecimals={false}/>
                                    <Tooltip
                                         contentStyle={{
                                            backgroundColor: 'hsl(var(--background))',
                                            borderColor: 'hsl(var(--border))'
                                        }}
                                        formatter={(value) => Number(value).toFixed(0)}
                                    />
                                    <Area type="monotone" dataKey={dataKeys.metric2} name={titles.metric2} stroke="hsl(var(--accent))" fillOpacity={1} fill="url(#colorMetric2)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            )}
             {user.role === 'super_agent' && <StudentsPerAgentTable />}
             {user.role === 'super_agent' && <SuperWorkersTable />}
        </div>
    )
}

    