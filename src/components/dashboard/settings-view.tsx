"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function SettingsView() {
    return (
        <div className="p-4 space-y-4">
            <h2 className="text-2xl font-bold">Settings</h2>
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
             <Card>
                <CardHeader>
                    <CardTitle>Reference Codes</CardTitle>
                    <CardDescription>Your codes to invite new users.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p>For Students: <span className="font-mono bg-muted p-1 rounded">SUPC</span></p>
                    <p>For Agents: <span className="font-mono bg-muted p-1 rounded">SUPA</span></p>
                    <p>For Super Workers: <span className="font-mono bg-muted p-1 rounded">SUPW</span></p>
                </CardContent>
            </Card>
        </div>
    )
}
