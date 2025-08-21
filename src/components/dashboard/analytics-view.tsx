"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppContext } from "@/contexts/app-context";

const monthlyData = [
  { name: 'Jan', earnings: 4000, assignments: 24, submitted: 5, spent: 550 },
  { name: 'Feb', earnings: 3000, assignments: 13, submitted: 3, spent: 400 },
  { name: 'Mar', earnings: 2000, assignments: 98, submitted: 12, spent: 1200 },
  { name: 'Apr', earnings: 2780, assignments: 39, submitted: 8, spent: 950 },
  { name: 'May', earnings: 1890, assignments: 48, submitted: 9, spent: 1100 },
  { name: 'Jun', earnings: 2390, assignments: 38, submitted: 7, spent: 850 },
  { name: 'Jul', earnings: 3490, assignments: 43, submitted: 10, spent: 1300 },
];

export default function AnalyticsView() {
    const { user } = useAppContext();

    if (!user) return null;

    const isStudent = user.role === 'student';

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-2xl font-bold">Analytics</h2>
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>{isStudent ? 'Spending Overview' : 'Earnings Overview'}</CardTitle>
                        <CardDescription>{isStudent ? 'Monthly amount spent on assignments.' : 'Monthly earnings from assignments.'}</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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
                                />
                                <Area type="monotone" dataKey={isStudent ? 'spent' : 'earnings'} stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorMetric1)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>{isStudent ? 'Submissions Overview' : 'Assignments Overview'}</CardTitle>
                         <CardDescription>{isStudent ? 'Monthly number of submitted assignments.' : 'Monthly number of assignments.'}</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorMetric2" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
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
                                />
                                <Area type="monotone" dataKey={isStudent ? 'submitted': 'assignments'} stroke="hsl(var(--accent))" fillOpacity={1} fill="url(#colorMetric2)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
