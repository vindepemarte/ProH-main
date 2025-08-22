
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAppContext } from "@/contexts/app-context";
import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CalendarIcon, TrendingUp, Users, Wallet, Target } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { DateRange } from "react-day-picker";
import { addDays, format, eachDayOfInterval, differenceInDays } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
    if (!superAgentStats || !superAgentStats.studentsPerAgent) return null;
    
    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Students per Agent</CardTitle>
                <CardDescription>Breakdown of students referred by each agent.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={superAgentStats.studentsPerAgent}>
                         <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="agentName" angle={-45} textAnchor="end" height={80} interval={0} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="studentCount" fill="hsl(var(--primary))" name="Students" />
                    </BarChart>
                </ResponsiveContainer>
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
        if (!analyticsData || !date?.from || !date?.to) return [];

        const isDailyView = differenceInDays(date.to, date.from) <= 31;
        
        const dataMap1 = new Map(analyticsData.metric1.map(item => [item.date, item.value]));
        const dataMap2 = new Map(analyticsData.metric2.map(item => [item.date, item.value]));

        if (isDailyView) {
            const allDays = eachDayOfInterval({ start: date.from, end: date.to });
            return allDays.map(day => {
                const formattedDate = format(day, 'yyyy-MM-dd');
                const name = format(day, 'MMM d');
                return {
                    name,
                    metric1: dataMap1.get(formattedDate) || 0,
                    metric2: dataMap2.get(formattedDate) || 0,
                };
            });
        } else {
             const dataMonths = [...new Set([...analyticsData.metric1.map(i => i.date), ...analyticsData.metric2.map(i => i.date)])];
             const monthOrder = allMonths;
             const relevantMonths = dataMonths.sort((a,b) => monthOrder.indexOf(a.split(' ')[0]) - monthOrder.indexOf(b.split(' ')[0]));

             return relevantMonths.map(monthStr => {
                 const name = allMonths[new Date(monthStr + '-02').getUTCMonth()];
                 return {
                    name: name,
                    metric1: dataMap1.get(monthStr) || 0,
                    metric2: dataMap2.get(monthStr) || 0,
                }
             })
        }
    }, [analyticsData, date]);
    
    const handleDateRangeChange = (range: DateRange | undefined) => {
        if(range?.from && range?.to) {
            setDate(range);
            setAnalyticsDateRange(range);
        }
    }
    
     const setPresetRange = (days: number) => {
        const from = addDays(new Date(), -days);
        const to = new Date();
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
        metric1: isStudent ? 'Monthly amount spent on assignments.' : 'Monthly earnings from assignments.',
        metric2: isStudent ? 'Monthly number of submitted assignments.' : 'Monthly number of new assignments.'
    };
    
    const dataKeys = {
        metric1: 'metric1',
        metric2: 'metric2'
    }

    const noData = chartData.every(d => d.metric1 === 0 && d.metric2 === 0);

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
                                className="w-[240px] justify-start text-left font-normal"
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

    
