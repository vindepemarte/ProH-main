
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppContext } from "@/contexts/app-context";
import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CalendarIcon, TrendingUp, Users, Wallet, Target, Search } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { DateRange } from "react-day-picker";
import { addDays, format, differenceInDays } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";

function SuperAgentKPIs() {
    const { superAgentStats } = useAppContext();

    if (!superAgentStats) return null;
    
    const kpis = [
        { title: "Total Revenue", value: `£${superAgentStats.totalRevenue.toFixed(2)}`, icon: Wallet },
        { title: "Total Profit", value: `£${superAgentStats.totalProfit.toFixed(2)}`, icon: TrendingUp },
        { title: "Total Students", value: superAgentStats.totalStudents, icon: Users },
        { title: "Avg. Profit/Homework", value: `£${superAgentStats.averageProfitPerHomework.toFixed(2)}`, icon: Target },
    ]

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            {kpis.map(kpi => (
                <Card key={kpi.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                        <kpi.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpi.value}</div>
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
                <CardDescription>Breakdown of students referred by each agent.</CardDescription>
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
                                <TableHead className="text-right">Student Count</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAgents.length > 0 ? filteredAgents.map(agent => (
                                <TableRow key={agent.agentName}>
                                    <TableCell className="font-medium">{agent.agentName}</TableCell>
                                    <TableCell className="text-right">{agent.studentCount}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center text-muted-foreground">
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


export default function AnalyticsView() {
    const { user, analyticsData, setAnalyticsDateRange, superAgentStats } = useAppContext();
    const [date, setDate] = useState<DateRange | undefined>({
        from: addDays(new Date(), -30),
        to: new Date(),
    });

    const chartData = useMemo(() => {
        if (!analyticsData || (!analyticsData.metric1.length && !analyticsData.metric2.length)) {
            return [];
        }

        const isDailyView = differenceInDays(date?.to || new Date(), date?.from || new Date()) < 31;
        
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
            const name = isDailyView ? format(new Date(d), 'MMM d') : format(new Date(d), 'MMM');
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
        const to = new Date();
        const from = addDays(new Date(), -days);
        setDate({ from, to });
        setAnalyticsDateRange({ from, to });
    };


    if (!user) return null;

    const isStudent = user.role === 'student';
    
    const titles = {
        metric1: isStudent ? 'Spending Overview' : 'Earnings Overview',
        metric2: isStudent ? 'Submissions Overview' : 'Assignments Overview'
    };
    
    const descriptions = {
        metric1: isStudent ? 'Amount spent on assignments.' : 'Earnings from assignments.',
        metric2: isStudent ? 'Number of submitted assignments.' : 'Number of new assignments.'
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
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={handleDateRangeChange}
                                numberOfMonths={1}
                            />
                        </PopoverContent>
                    </Popover>
                 </div>
            </div>
            
            {user.role === 'super_agent' && <SuperAgentKPIs />}

            {noData ? (
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-muted-foreground text-center">No analytics data available for the selected period.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
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
                                        formatter={(value) => `£${Number(value).toFixed(2)}`}
                                    />
                                    <Area type="monotone" dataKey={dataKeys.metric1} name={titles.metric1} stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorMetric1)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
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
                                    />
                                    <Area type="monotone" dataKey={dataKeys.metric2} name={titles.metric2} stroke="hsl(var(--accent))" fillOpacity={1} fill="url(#colorMetric2)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            )}
             {user.role === 'super_agent' && <StudentsPerAgentTable />}
        </div>
    )
}

    