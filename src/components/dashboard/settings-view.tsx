"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useAppContext } from "@/contexts/app-context"
import { useEffect, useMemo, useState } from "react"
import { ScrollArea } from "../ui/scroll-area"
import type { PricingConfig, UserRole } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

function ReferenceCodeManager() {
    const { referenceCodes, fetchAllCodes, handleUpdateReferenceCode } = useAppContext();
    const [editingCodes, setEditingCodes] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchAllCodes();
    }, [fetchAllCodes]);

    const handleCodeChange = (oldCode: string, newCode: string) => {
        setEditingCodes(prev => ({...prev, [oldCode]: newCode}));
    }

    const handleSave = (oldCode: string) => {
        const newCode = editingCodes[oldCode];
        if (newCode && newCode !== oldCode) {
            handleUpdateReferenceCode(oldCode, newCode);
        }
    }

    if (!referenceCodes || referenceCodes.length === 0) {
        return <p className="text-muted-foreground">No reference codes found.</p>;
    }
    
    return referenceCodes.map(rc => {
         if (!rc.role) return null;
         return (
             <div key={rc.code} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                 <Label className="w-full sm:w-48">For <span className="capitalize">{rc.role.replace(/_/g, ' ')}s</span>:</Label>
                 <Input 
                    className="font-mono flex-grow"
                    value={editingCodes[rc.code] || rc.code}
                    onChange={(e) => handleCodeChange(rc.code, e.target.value)}
                 />
                 <Button onClick={() => handleSave(rc.code)} disabled={!editingCodes[rc.code] || editingCodes[rc.code] === rc.code}>Save</Button>
             </div>
         )
     }).filter(Boolean);
}

function CreateReferenceCode() {
    const { allUsers, handleCreateReferenceCode } = useAppContext();
    const [code, setCode] = useState('');
    const [role, setRole] = useState<UserRole>('student');
    const [ownerId, setOwnerId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = useMemo(() => {
        if (!searchTerm) return allUsers;
        return allUsers.filter(u => 
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allUsers, searchTerm]);
    
    const handleCreate = () => {
        if (code && role && ownerId) {
            handleCreateReferenceCode(code, role, ownerId);
            setCode('');
            setRole('student');
            setOwnerId('');
        }
    }

    return (
         <Card>
            <CardHeader>
                <CardTitle>Create New Reference Code</CardTitle>
                <CardDescription>Create a new reference code and assign it to a user.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>New Code</Label>
                        <Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. AGENT01" />
                    </div>
                    <div className="space-y-2">
                        <Label>Grants Role</Label>
                        <Select value={role} onValueChange={(v: UserRole) => setRole(v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="agent">Agent</SelectItem>
                                <SelectItem value="worker">Worker</SelectItem>
                                <SelectItem value="super_worker">Super Worker</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label>Owner</Label>
                     <Select value={ownerId} onValueChange={setOwnerId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a user..." />
                        </SelectTrigger>
                        <SelectContent>
                                <div className="p-2">
                                <Input
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <ScrollArea className="h-48">
                            {filteredUsers.map(u => (
                                <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>
                            ))}
                            </ScrollArea>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={handleCreate} disabled={!code || !role || !ownerId}>Create Code</Button>
            </CardContent>
        </Card>
    )
}


export default function SettingsView() {
    const { user, pricingConfig, handleSavePricingConfig } = useAppContext();
    const [localConfig, setLocalConfig] = useState<PricingConfig | null>(pricingConfig);

    useEffect(() => {
        setLocalConfig(pricingConfig);
    }, [pricingConfig]);

    if (!user) return null;

    const handleWordTierChange = (tier: string, value: string) => {
        if (!localConfig) return;
        const newConfig = {...localConfig};
        newConfig.wordTiers[parseInt(tier)] = parseFloat(value) || 0;
        setLocalConfig(newConfig);
    }
    
    const handleFeeChange = (type: 'agent' | 'super_worker', value: string) => {
        if (!localConfig) return;
        const newConfig = {...localConfig};
        newConfig.fees[type] = parseFloat(value) || 0;
        setLocalConfig(newConfig);
    }

    const handleDeadlineTierChange = (tier: string, value: string) => {
        if (!localConfig) return;
        const newConfig = {...localConfig};
        newConfig.deadlineTiers[parseInt(tier)] = parseFloat(value) || 0;
        setLocalConfig(newConfig);
    }

    const onSave = () => {
        if (localConfig) {
            handleSavePricingConfig(localConfig);
        }
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
                                        <Input 
                                            type="number" 
                                            placeholder="Price" 
                                            step="0.01" 
                                            value={localConfig?.wordTiers[tier] || ''}
                                            onChange={(e) => handleWordTierChange(String(tier), e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        <Button className="mt-4" onClick={onSave}>Save Pricing</Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Fee & Deadline Configuration</CardTitle>
                        <CardDescription>Set fees and deadline surcharges.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Agent Fee (£ per 500 words)</Label>
                            <Input type="number" placeholder="e.g., 5.00" step="0.01" value={localConfig?.fees.agent || ''} onChange={(e) => handleFeeChange('agent', e.target.value)}/>
                            <Label>Super Worker Fee (£ per 500 words)</Label>
                            <Input type="number" step="0.01" value={localConfig?.fees.super_worker || ''} onChange={(e) => handleFeeChange('super_worker', e.target.value)}/>
                        </div>
                        <div className="space-y-2 pt-4 border-t">
                            <Label>Within 1 Day Surcharge (£)</Label>
                            <Input type="number" step="0.01" value={localConfig?.deadlineTiers[1] || ''} onChange={(e) => handleDeadlineTierChange('1', e.target.value)} />
                             <Label>Within 3 Days Surcharge (£)</Label>
                            <Input type="number" step="0.01" value={localConfig?.deadlineTiers[3] || ''} onChange={(e) => handleDeadlineTierChange('3', e.target.value)} />
                            <Label>Within 7 Days Surcharge (£)</Label>
                            <Input type="number" step="0.01" value={localConfig?.deadlineTiers[7] || ''} onChange={(e) => handleDeadlineTierChange('7', e.target.value)} />
                        </div>
                        <Button onClick={onSave}>Save Fees & Deadlines</Button>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Reference Code Management</CardTitle>
                        <CardDescription>View and edit all reference codes in the system.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <ReferenceCodeManager />
                    </CardContent>
                </Card>
                <CreateReferenceCode />
                </>
            )}
        </div>
    )
}
