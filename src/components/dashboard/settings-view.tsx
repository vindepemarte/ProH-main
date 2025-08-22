"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useAppContext } from "@/contexts/app-context"
import { useEffect } from "react"

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
            return <p>No reference codes found.</p>;
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


    return (
        <div className="p-4 space-y-4">
            <h2 className="text-2xl font-bold">Settings</h2>
             {(user.role === 'super_agent') && (
                <>
                <Card>
                    <CardHeader>
                        <CardTitle>Pricing Configuration</CardTitle>
                        <CardDescription>Set pricing tiers for word counts.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 items-center">
                            <Label>500 words</Label>
                            <Input type="number" placeholder="Price" />
                            <Label>1000 words</Label>
                            <Input type="number" placeholder="Price" />
                            <Label>1500 words</Label>
                            <Input type="number" placeholder="Price" />
                        </div>
                        <Button>Save Pricing</Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Fee Configuration</CardTitle>
                        <CardDescription>Set fees for agents and super workers.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 items-center">
                            <Label>Agent Commission (%)</Label>
                            <Input type="number" placeholder="e.g., 20" />
                            <Label>Super Worker Fee (£ per 500 words)</Label>
                            <Input type="number" defaultValue="6.25" />
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
