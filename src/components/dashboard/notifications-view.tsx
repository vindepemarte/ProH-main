"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAppContext } from "@/contexts/app-context"
import { Bell, Send } from "lucide-react"
import { Textarea } from "../ui/textarea"
import { Button } from "../ui/button"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { UserRole } from "@/lib/types"
import { useState } from "react"
import { Input } from "../ui/input"


function BroadcastForm() {
    const { user, allUsers, handleBroadcastNotification } = useAppContext();
    const [message, setMessage] = useState('');
    const [targetType, setTargetType] = useState<'role' | 'user'>('role');
    const [selectedRole, setSelectedRole] = useState<UserRole>('student');
    const [selectedUser, setSelectedUser] = useState('');

    if (user?.role !== 'super_agent') return null;

    const handleSend = () => {
        if (!message) return;
        const targetUser = targetType === 'user' ? selectedUser : undefined;
        const targetRole = targetType === 'role' ? selectedRole : undefined;
        handleBroadcastNotification(message, targetRole, targetUser);
        setMessage('');
    }

    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Send a Broadcast</CardTitle>
                <CardDescription>Send a notification to all users of a specific role or to an individual user.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Textarea 
                    placeholder="Your message..." 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[100px]"
                />
                <div className="flex items-end gap-4">
                    <div className="flex-grow space-y-2">
                        <Label>Target</Label>
                        <Select value={targetType} onValueChange={(v: 'role' | 'user') => setTargetType(v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="role">By Role</SelectItem>
                                <SelectItem value="user">By User</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {targetType === 'role' ? (
                        <div className="flex-grow space-y-2">
                            <Label>Role</Label>
                             <Select value={selectedRole} onValueChange={(v: UserRole) => setSelectedRole(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="student">Students</SelectItem>
                                    <SelectItem value="agent">Agents</SelectItem>
                                    <SelectItem value="worker">Workers</SelectItem>
                                    <SelectItem value="super_worker">Super Workers</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    ) : (
                         <div className="flex-grow space-y-2">
                            <Label>User</Label>
                            <Select value={selectedUser} onValueChange={setSelectedUser}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a user..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {allUsers.map(u => (
                                        <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
                 <Button onClick={handleSend} disabled={!message || (targetType === 'user' && !selectedUser)}>
                    <Send className="mr-2"/> Send Notification
                </Button>
            </CardContent>
        </Card>
    )
}


export default function NotificationsView() {
    const { notifications } = useAppContext();

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-2xl font-bold">Notifications</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-96">
                        <div className="space-y-4">
                            {notifications.length > 0 ? notifications.map(n => (
                                <div key={n.id} className="flex items-start gap-4">
                                    <div className="w-2 h-2 mt-2 rounded-full bg-accent" />
                                    <div>
                                        <p className="font-medium">{n.message}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center text-muted-foreground py-10">
                                    <Bell className="mx-auto h-12 w-12 text-gray-400" />
                                    <p>No new notifications.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
            <BroadcastForm />
        </div>
    )
}
