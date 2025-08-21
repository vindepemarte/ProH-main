"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', earnings: 4000, assignments: 24 },
  { name: 'Feb', earnings: 3000, assignments: 13 },
  { name: 'Mar', earnings: 2000, assignments: 98 },
  { name: 'Apr', earnings: 2780, assignments: 39 },
  { name: 'May', earnings: 1890, assignments: 48 },
  { name: 'Jun', earnings: 2390, assignments: 38 },
  { name: 'Jul', earnings: 3490, assignments: 43 },
];

export default function AnalyticsView() {
    return (
        <div className="p-4 space-y-4">
            <h2 className="text-2xl font-bold">Analytics</h2>
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Earnings Overview</CardTitle>
                        <CardDescription>Monthly earnings from assignments.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
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
                                <Area type="monotone" dataKey="earnings" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorEarnings)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Assignments Overview</CardTitle>
                         <CardDescription>Monthly number of assignments.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorAssignments" x1="0" y1="0" x2="0" y2="1">
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
                                <Area type="monotone" dataKey="assignments" stroke="hsl(var(--accent))" fillOpacity={1} fill="url(#colorAssignments)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
