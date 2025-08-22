"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppContext } from "@/contexts/app-context";
import { useMemo } from "react";

const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AnalyticsView() {
    const { user, analyticsData } = useAppContext();

    const chartData = useMemo(() => {
        if (!analyticsData) return [];
        
        const dataMap1 = new Map(analyticsData.metric1.map(item => [item.month.substring(0, 3), item.value]));
        const dataMap2 = new Map(analyticsData.metric2.map(item => [item.month.substring(0, 3), item.value]));
        
        return allMonths.map(month => ({
            name: month,
            metric1: dataMap1.get(month) || 0,
            metric2: dataMap2.get(month) || 0,
        }));
    }, [analyticsData]);

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

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-2xl font-bold">Analytics</h2>
            {chartData.length === 0 ? (
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-muted-foreground text-center">No analytics data available yet.</p>
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
                                        formatter={(value) => isStudent ? `£${Number(value).toFixed(2)}` : `£${Number(value).toFixed(2)}`}
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
        </div>
    )
}
