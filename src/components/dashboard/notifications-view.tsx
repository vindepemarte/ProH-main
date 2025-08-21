import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function NotificationsView() {
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
                            <div className="flex items-start gap-4">
                                <div className="w-2 h-2 mt-2 rounded-full bg-accent" />
                                <div>
                                    <p className="font-medium">Homework #1235 updated</p>
                                    <p className="text-sm text-muted-foreground">Status changed to 'In Progress'.</p>
                                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                                </div>
                            </div>
                             <div className="flex items-start gap-4">
                                <div className="w-2 h-2 mt-2 rounded-full bg-accent/50" />
                                <div>
                                    <p className="font-medium">New student registered</p>
                                    <p className="text-sm text-muted-foreground">Agent Client joined via Agent's referral.</p>
                                    <p className="text-xs text-muted-foreground">1 day ago</p>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    )
}
