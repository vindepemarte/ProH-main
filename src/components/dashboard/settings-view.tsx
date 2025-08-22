"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useAppContext } from "@/contexts/app-context"
import { useEffect } from "react"
import { ScrollArea } from "../ui/scroll-area"

export default function SettingsView() {
    const { user, referenceCodes, getReferenceCodesForUser } = useAppContext();
    
    useEffect(() => {
        if(user) {
            getReferenceCodesForUser();
        }
    }, [user, getReferenceCodesForUser]);

    if (!user) return null;

    const renderReferenceCodes = () => {
        if (!referenceCodes || referenceCodes.length === 0) {
            return <p className="text-muted-foreground">No reference codes found.</p>;
        }

        return referenceCodes.map(rc => {
            if (!rc.role) return null;
            return (
                 <p key={rc.code}>
                    For <span className="capitalize">{rc.role.replace(/_/g, ' ')}s</span>: <span className="font-mono bg-muted p-1 rounded">{rc.code}</span>
                </p>
            )
        }).filter(Boolean);
    }

    const wordCountTiers = Array.from({ length: 40 }, (_, i) => (i + 1) * 500);

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-2xl font-bold">Settings</h2>
             {(user.role === 'super_agent') && (
                <>
                <Card>
                    <CardHeader>
                        <CardTitle>Pricing Configuration</CardTitle>
                        <CardDescription>Set pricing tiers for word counts (in £).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-72">
                            <div className="space-y-4">
                                {wordCountTiers.map(tier => (
                                    <div key={tier} className="grid grid-cols-2 gap-4 items-center">
                                        <Label>{tier} words</Label>
                                        <Input type="number" placeholder="Price" step="0.01" />
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        <Button className="mt-4">Save Pricing</Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Fee Configuration</CardTitle>
                        <CardDescription>Set fees for agents and super workers.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 items-center">
                            <Label>Agent Fee (£ per 500 words)</Label>
                            <Input type="number" placeholder="e.g., 5.00" step="0.01" />
                            <Label>Super Worker Fee (£ per 500 words)</Label>
                            <Input type="number" defaultValue="6.25" step="0.01" />
                        </div>
                        <Button>Save Fees</Button>
                    </CardContent>
                </Card>
                </>
            )}
             <Card>
                <CardHeader>
                    <CardTitle>Reference Codes</CardTitle>
                    <CardDescription>Your codes to invite new users.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    {renderReferenceCodes()}
                </CardContent>
            </Card>
        </div>
    )
}
