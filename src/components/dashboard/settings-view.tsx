"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppContext } from "@/contexts/app-context";
import { useEffect, useMemo, useState } from "react";
import { ScrollArea } from "../ui/scroll-area";
import type { PricingConfig, UserRole, NotificationTemplates } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { AlertCircle, Save, Database, DollarSign, Users, Bell, Code } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { getNotificationTemplates, saveNotificationTemplates } from "@/lib/actions";

function PricingConfigView() {
    const { pricingConfig, handleSavePricingConfig } = useAppContext();
    const [localConfig, setLocalConfig] = useState<PricingConfig | null>(pricingConfig);

    useEffect(() => {
        setLocalConfig(pricingConfig);
    }, [pricingConfig]);

    const handleWordTierChange = (tier: string, value: string) => {
        if (!localConfig) return;
        const newConfig = {...localConfig};
        newConfig.wordTiers[parseInt(tier)] = parseFloat(value) || 0;
        setLocalConfig(newConfig);
    }

    const onSave = () => {
        if (localConfig) {
            handleSavePricingConfig(localConfig);
        }
    }

    const wordCountTiers = Array.from({ length: 40 }, (_, i) => (i + 1) * 500);

    return (
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
    )
}

function FeeAndDeadlineConfigView() {
    const { pricingConfig, handleSavePricingConfig } = useAppContext();
    const [localConfig, setLocalConfig] = useState<PricingConfig | null>(pricingConfig);

    useEffect(() => {
        setLocalConfig(pricingConfig);
    }, [pricingConfig]);

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

    return (
        <Card>
            <CardHeader>
                <CardTitle>Fee & Deadline Configuration</CardTitle>
                <CardDescription>Set fees and deadline surcharges.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Agent Fee (£ per 500 words)</Label>
                    <Input type="number" placeholder="e.g., 5.00" step="0.01" value={localConfig?.fees.agent || ''} onChange={(e) => handleFeeChange('agent', e.target.value)}/>
                    <p className="text-sm text-muted-foreground mt-2">
                        <strong>Note:</strong> Super Worker fees are now managed individually in the "Super Worker Fees" section below.
                    </p>
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
    )
}

function ReferenceCodeManagerView() {
    const { referenceCodes, fetchAllCodes, handleUpdateReferenceCode, allUsers } = useAppContext();
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
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Reference Code Management</CardTitle>
                <CardDescription>View and edit all reference codes in the system.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                {referenceCodes.map(rc => {
                    if (!rc.role) return null;
                    const owner = allUsers.find(u => u.id === rc.ownerId);
                    return (
                        <div key={rc.code} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <Label className="w-full sm:w-48">For <span className="capitalize">{rc.role.replace(/_/g, ' ')}s</span>:</Label>
                            <Input 
                                className="font-mono flex-grow"
                                value={editingCodes[rc.code] || rc.code}
                                onChange={(e) => handleCodeChange(rc.code, e.target.value)}
                            />
                            <div className="w-full sm:w-48 text-sm text-muted-foreground">
                                {owner ? `${owner.name} (${owner.email})` : 'Unassigned'}
                            </div>
                            <Button onClick={() => handleSave(rc.code)} disabled={!editingCodes[rc.code] || editingCodes[rc.code] === rc.code}>Save</Button>
                        </div>
                    )
                }).filter(Boolean)}
            </CardContent>
        </Card>
    )
}

function CreateReferenceCodeView() {
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
                        <Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. AGNT" />
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

function DatabaseMigrationRunnerView() {
    const { user, toast } = useAppContext();
    const [isRunning, setIsRunning] = useState(false);
    const [migrationStatus, setMigrationStatus] = useState<'pending' | 'success' | 'error'>('pending');

    const runMigration = async () => {
        setIsRunning(true);
        try {
            const response = await fetch('/api/migrate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            const result = await response.json();
            
            if (result.success) {
                setMigrationStatus('success');
                toast({ title: 'Success', description: result.message });
            } else {
                setMigrationStatus('error');
                toast({ variant: 'destructive', title: 'Migration Failed', description: result.error });
            }
        } catch (error) {
            setMigrationStatus('error');
            console.error('Migration error:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to run migration' });
        } finally {
            setIsRunning(false);
        }
    };

    if (user?.role !== 'super_agent') return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Database Migration</CardTitle>
                <CardDescription>
                    Run the Super Worker Fees migration to enable per-worker fee management.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Run this migration if you're getting errors with Super Worker fee management. 
                            This will create the necessary database tables and triggers.
                        </AlertDescription>
                    </Alert>
                    
                    {migrationStatus === 'success' && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-green-700">
                                Migration completed successfully! You can now manage individual Super Worker fees.
                            </AlertDescription>
                        </Alert>
                    )}
                    
                    <Button 
                        onClick={runMigration} 
                        disabled={isRunning || migrationStatus === 'success'}
                        className="w-full"
                    >
                        {isRunning ? 'Running Migration...' : 'Run Super Worker Fees Migration'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function SuperWorkerFeesManagerView() {
    const { user, superWorkerFees, fetchSuperWorkerFees, handleUpdateSuperWorkerFee, toast } = useAppContext();
    const [editingFees, setEditingFees] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [debugInfo, setDebugInfo] = useState<any>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (user?.role === 'super_agent' && mounted) {
            fetchSuperWorkerFees();
        }
    }, [fetchSuperWorkerFees, user, mounted]);
    
    const runDebugCheck = async () => {
        try {
            const response = await fetch('/api/debug/super-worker-fees');
            const data = await response.json();
            setDebugInfo(data);
            console.log('Debug info:', data);
        } catch (error) {
            console.error('Debug check failed:', error);
        }
    };

    const handleFeeChange = (workerId: string, fee: string) => {
        setEditingFees(prev => ({ ...prev, [workerId]: fee }));
    };

    const handleSaveFee = async (workerId: string) => {
        const newFee = editingFees[workerId];
        if (newFee && !isNaN(parseFloat(newFee))) {
            try {
                setLoading(true);
                await handleUpdateSuperWorkerFee(workerId, parseFloat(newFee));
                setEditingFees(prev => ({ ...prev, [workerId]: '' }));
            } catch (error) {
                console.error('Error updating fee:', error);
            } finally {
                setLoading(false);
            }
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a valid fee amount.' });
        }
    };

    if (user?.role !== 'super_agent') return null;
    if (!mounted) return <div>Loading...</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Super Worker Fees</CardTitle>
                <CardDescription>
                    Set individual fees for each Super Worker (per 500 words). These override the global Super Worker fee.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <Button onClick={runDebugCheck} variant="outline" size="sm">
                            Debug Check
                        </Button>
                        {debugInfo && (
                            <div className="text-xs bg-muted p-2 rounded flex-1">
                                <div>Table exists: {debugInfo.tableStatus?.exists ? '✅' : '❌'}</div>
                                <div>Records: {debugInfo.tableStatus?.count || 0}</div>
                                <div>Fees loaded: {debugInfo.fees?.length || 0}</div>
                                {debugInfo.feesError && <div className="text-red-600">Error: {debugInfo.feesError}</div>}
                            </div>
                        )}
                    </div>
                </div>
                {superWorkerFees.length === 0 ? (
                    <div className="space-y-2">
                        <p className="text-muted-foreground">No super workers found or error loading fees.</p>
                        <p className="text-sm text-orange-600">Try running the migration again or check the debug info above.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {superWorkerFees.map((worker) => {
                            const isEditing = editingFees[worker.id] !== undefined;
                            const currentFee = isEditing ? editingFees[worker.id] : worker.fee_per_500.toString();
                            
                            return (
                                <div key={worker.id} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center p-3 border rounded-lg">
                                    <div className="sm:col-span-2">
                                        <div className="font-medium">{worker.name}</div>
                                        <div className="text-sm text-muted-foreground">{worker.email}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">£</span>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={currentFee}
                                            onChange={(e) => handleFeeChange(worker.id, e.target.value)}
                                            className="w-24"
                                            disabled={loading}
                                        />
                                        <span className="text-sm text-muted-foreground">per 500 words</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {isEditing ? (
                                            <>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleSaveFee(worker.id)}
                                                    disabled={loading || !editingFees[worker.id] || editingFees[worker.id] === worker.fee_per_500.toString()}
                                                >
                                                    {loading ? 'Saving...' : 'Save'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setEditingFees(prev => ({ ...prev, [worker.id]: '' }))}
                                                    disabled={loading}
                                                >
                                                    Cancel
                                                </Button>
                                            </>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleFeeChange(worker.id, worker.fee_per_500.toString())}
                                                disabled={loading}
                                            >
                                                Edit
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}            
            </CardContent>
        </Card>
    );
}

function NotificationTemplateManagerView() {
    const { user, toast } = useAppContext();
    const [templates, setTemplates] = useState<NotificationTemplates | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<string | null>(null);

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

    const handleSaveTemplates = async () => {
        if (!templates) return;
        
        try {
            setSaving(true);
            await saveNotificationTemplates(templates);
            toast({ title: 'Success', description: 'Notification templates saved successfully.' });
            setEditingTemplate(null);
        } catch (error) {
            console.error('Error saving templates:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save notification templates.' });
        } finally {
            setSaving(false);
        }
    };

    const handleTemplateChange = (templateKey: keyof NotificationTemplates, newTemplate: string) => {
        if (!templates) return;
        
        setTemplates({
            ...templates,
            [templateKey]: {
                ...templates[templateKey],
                template: newTemplate
            }
        });
    };

    if (user?.role !== 'super_agent') return null;
    if (loading) return <div>Loading templates...</div>;
    if (!templates) return <div>Error loading templates</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Notification Template Customization</CardTitle>
                <CardDescription>
                    Customize automatic notification templates sent throughout the system. Use variables like '{homeworkId}', '{studentName}', etc.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        These templates are used for automatic notifications. Be careful when editing to ensure all necessary information is included.
                    </AlertDescription>
                </Alert>
                
                <ScrollArea className="h-96">
                    <div className="space-y-4">
                        {Object.entries(templates).filter(([key, template]) => !template.variables.includes('homeworkId')).map(([key, template]) => (
                            <div key={key} className="border rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold">{template.name}</h4>
                                        <p className="text-sm text-muted-foreground">{template.description}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingTemplate(editingTemplate === key ? null : key)}
                                    >
                                        {editingTemplate === key ? 'Cancel' : 'Edit'}
                                    </Button>
                                </div>
                                
                                <div className="flex flex-wrap gap-1 mb-2">
                                    <span className="text-xs text-muted-foreground">Available variables:</span>
                                    {template.variables.map((variable: string) => (
                                        <Badge key={variable} variant="secondary" className="text-xs">
                                            {'{' + variable + '}'}
                                        </Badge>
                                    ))}
                                </div>
                                
                                {editingTemplate === key ? (
                                    <Textarea
                                        value={template.template}
                                        onChange={(e) => handleTemplateChange(key as keyof NotificationTemplates, e.target.value)}
                                        placeholder="Enter template message..."
                                        className="min-h-[80px]"
                                    />
                                ) : (
                                    <div className="bg-muted/50 p-3 rounded text-sm font-mono">
                                        {template.template.replace(/{homeworkId}/g, '[homeworkId]')}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                
                <div className="flex justify-end">
                    <Button onClick={handleSaveTemplates} disabled={saving || !editingTemplate}>
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? 'Saving...' : 'Save Templates'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default function SettingsView() {
    const { user } = useAppContext();

    if (!user || user.role !== 'super_agent') return null;

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-2xl font-bold">Settings</h2>
            <Tabs defaultValue="pricing">
                <TabsList className="grid w-full grid-cols-7">
                    <TabsTrigger value="pricing"><DollarSign className="mr-2 h-4 w-4" />Pricing</TabsTrigger>
                    <TabsTrigger value="fees"><DollarSign className="mr-2 h-4 w-4" />Fees & Deadlines</TabsTrigger>
                    <TabsTrigger value="ref-codes"><Code className="mr-2 h-4 w-4" />Ref. Codes</TabsTrigger>
                    <TabsTrigger value="create-ref-code"><Code className="mr-2 h-4 w-4" />Create Ref. Code</TabsTrigger>
                    <TabsTrigger value="migration"><Database className="mr-2 h-4 w-4" />Migration</TabsTrigger>
                    <TabsTrigger value="super-worker-fees"><Users className="mr-2 h-4 w-4" />Super Worker Fees</TabsTrigger>
                    <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4" />Notifications</TabsTrigger>
                </TabsList>
                <TabsContent value="pricing">
                    <PricingConfigView />
                </TabsContent>
                <TabsContent value="fees">
                    <FeeAndDeadlineConfigView />
                </TabsContent>
                <TabsContent value="ref-codes">
                    <ReferenceCodeManagerView />
                </TabsContent>
                <TabsContent value="create-ref-code">
                    <CreateReferenceCodeView />
                </TabsContent>
                <TabsContent value="migration">
                    <DatabaseMigrationRunnerView />
                </TabsContent>
                <TabsContent value="super-worker-fees">
                    <SuperWorkerFeesManagerView />
                </TabsContent>
                <TabsContent value="notifications">
                    <NotificationTemplateManagerView />
                </TabsContent>
            </Tabs>
        </div>
    )
}