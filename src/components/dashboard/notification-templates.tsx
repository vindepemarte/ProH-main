"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppContext } from "@/contexts/app-context";
import { useEffect, useState } from "react";
import type { NotificationTemplates } from "@/lib/types";
import { getNotificationTemplates } from "@/lib/actions";

export default function NotificationTemplatesView() {
    const { user, toast } = useAppContext();
    const [templates, setTemplates] = useState<NotificationTemplates | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const data = await getNotificationTemplates();
            setTemplates(data);
        } catch (error) {
            console.error('Error loading templates:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load notification templates.' });
        } finally {
            setLoading(false);
        }
    };

    if (user?.role !== 'super_agent') return null;
    if (loading) return <div>Loading templates...</div>;
    if (!templates) return <div>Error loading templates</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Notification Templates</CardTitle>
                <CardDescription>
                    Available notification templates and their variables.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-96">
                    <div className="space-y-4">
                        {Object.entries(templates).map(([key, template]) => (
                            <div key={key} className="border rounded-lg p-4 space-y-3">
                                <h4 className="font-semibold">{template.name}</h4>
                                <p className="text-sm text-muted-foreground">{template.description}</p>
                                <div className="flex flex-wrap gap-1">
                                    <span className="text-xs text-muted-foreground">Available variables:</span>
                                    {template.variables.map((variable: string) => (
                                        <Badge key={variable} variant="secondary" className="text-xs">
                                            {'{' + variable + '}'}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
