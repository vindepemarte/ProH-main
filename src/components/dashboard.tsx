"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAppContext } from "@/contexts/app-context";
import HomeworkList from "./dashboard/homework-list";
import AnalyticsView from "./dashboard/analytics-view";
import SettingsView from "./dashboard/settings-view";
import NotificationsView from "./dashboard/notifications-view";
import UsersView from "./dashboard/users-view";
import HomeworkModal from "./modals/homework-modal";

export default function Dashboard() {
    const { user, isHomeworkModalOpen, setIsHomeworkModalOpen } = useAppContext();

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background pb-16">
            <header className="p-4 border-b">
                <h1 className="text-2xl font-bold text-primary">Welcome, {user.name}</h1>
                <p className="text-muted-foreground capitalize">{user.role.replace(/_/g, ' ')} Dashboard</p>
            </header>
            <Tabs defaultValue="homeworks" className="w-full">
                <TabsList className="m-4">
                    <TabsTrigger value="homeworks">Homeworks</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    {(user.role === 'super_agent' || user.role === 'agent' || user.role === 'super_worker') && <TabsTrigger value="settings">Settings</TabsTrigger>}
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
                {(user.role === 'super_agent' || user.role === 'agent' || user.role === 'super_worker') && (
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
        </div>
    );
}
