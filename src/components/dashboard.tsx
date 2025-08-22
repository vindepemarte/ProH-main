"use client"

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAppContext } from "@/contexts/app-context";
import HomeworkList from "./dashboard/homework-list";
import AnalyticsView from "./dashboard/analytics-view";
import SettingsView from "./dashboard/settings-view";
import NotificationsView from "./dashboard/notifications-view";
import UsersView from "./dashboard/users-view";
import HomeworkModal from "./modals/homework-modal";
import NewHomeworkModal from "./modals/new-homework-modal";
import { PlusCircle } from "lucide-react";
import { Badge } from "./ui/badge";

export default function Dashboard() {
    const { user, isHomeworkModalOpen, setIsHomeworkModalOpen, isNewHomeworkModalOpen, setIsNewHomeworkModalOpen, unreadNotificationCount, handleMarkNotificationsAsRead } = useAppContext();

    if (!user) return null;

    const onTabChange = (value: string) => {
        if (value === 'notifications' && unreadNotificationCount > 0) {
            handleMarkNotificationsAsRead();
        }
    }

    return (
        <div className="min-h-screen bg-background pb-16">
            <header className="p-4 border-b flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Welcome, {user.name}</h1>
                    <p className="text-muted-foreground capitalize">{user.role.replace(/_/g, ' ')} Dashboard</p>
                </div>
                 {user.role === 'student' && (
                    <Button onClick={() => setIsNewHomeworkModalOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> New Homework
                    </Button>
                )}
            </header>
            <Tabs defaultValue="homeworks" className="w-full" onValueChange={onTabChange}>
                <TabsList className="m-4">
                    <TabsTrigger value="homeworks">Homeworks</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="notifications" className="relative">
                        Notifications
                        {unreadNotificationCount > 0 && (
                            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white">
                                {unreadNotificationCount}
                            </Badge>
                        )}
                    </TabsTrigger>
                    {(user.role === 'super_agent') && <TabsTrigger value="settings">Settings</TabsTrigger>}
                    {user.role === 'super_agent' && <TabsTrigger value="users">Users</TabsTrigger>}
                </TabsList>

                <TabsContent value="homeworks">
                    <HomeworkList />
                </TabsContent>
                <TabsContent value="analytics">
                    <AnalyticsView />
                </TabsContent>
                <TabsContent value="notifications">
                    <NotificationsView />
                </TabsContent>
                {(user.role === 'super_agent') && (
                    <TabsContent value="settings">
                        <SettingsView />
                    </TabsContent>
                )}
                 {user.role === 'super_agent' && (
                    <TabsContent value="users">
                        <UsersView />
                    </TabsContent>
                )}
            </Tabs>
            <HomeworkModal open={isHomeworkModalOpen} onOpenChange={setIsHomeworkModalOpen} />
            <NewHomeworkModal open={isNewHomeworkModalOpen} onOpenChange={setIsNewHomeworkModalOpen} />
        </div>
    );
}
