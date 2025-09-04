"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, CreditCard, Info, ChevronDown, ChevronUp } from "lucide-react";
import { useAppContext } from "@/contexts/app-context";
import { useState } from "react";

export default function PaymentInfo() {
    const { user, toast } = useAppContext();
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Mock bank details - in a real app, this would come from the super agent's profile
    const bankDetails = {
        accountName: "ProH Academic Services Ltd",
        accountNumber: "12345678",
        sortCode: "12-34-56",
        bankName: "Lloyds Bank",
        iban: "GB29 NWBK 1234 5678 9012 34",
        bic: "NWBKGB2L"
    };

    const copyToClipboard = async (text: string, fieldName: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(fieldName);
            toast({
                title: "Copied!",
                description: `${fieldName} copied to clipboard`,
            });
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            toast({
                title: "Error",
                description: "Failed to copy to clipboard",
                variant: "destructive"
            });
        }
    };

    const generateReferenceCode = () => {
        if (!user) return "";
        // Generate reference code using user ID and current timestamp
        const timestamp = Date.now().toString().slice(-6);
        const userIdShort = user.id.slice(-4).toUpperCase();
        return `HW-${userIdShort}-${timestamp}`;
    };

    const referenceCode = generateReferenceCode();

    if (user?.role !== 'student') return null;

    return (
        <div className="space-y-4 mb-6 mt-6">
            {/* Payment Instructions Card */}
            <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-blue-600" />
                            <CardTitle className="text-lg">Payment Information</CardTitle>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="h-8 w-8 p-0"
                        >
                            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                        </Button>
                    </div>
                    <CardDescription>
                        Use the bank details below to make payments for your homework assignments.
                    </CardDescription>
                </CardHeader>
                {!isCollapsed && (
                <CardContent className="space-y-4">
                    {/* Bank Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-2 bg-white rounded border">
                                <div>
                                    <p className="text-xs text-muted-foreground">Account Name</p>
                                    <p className="font-medium">{bankDetails.accountName}</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(bankDetails.accountName, "Account Name")}
                                    className="h-8 w-8 p-0"
                                >
                                    <Copy className={`h-3 w-3 ${copiedField === "Account Name" ? "text-green-600" : "text-gray-500"}`} />
                                </Button>
                            </div>
                            
                            <div className="flex justify-between items-center p-2 bg-white rounded border">
                                <div>
                                    <p className="text-xs text-muted-foreground">Account Number</p>
                                    <p className="font-medium font-mono">{bankDetails.accountNumber}</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(bankDetails.accountNumber, "Account Number")}
                                    className="h-8 w-8 p-0"
                                >
                                    <Copy className={`h-3 w-3 ${copiedField === "Account Number" ? "text-green-600" : "text-gray-500"}`} />
                                </Button>
                            </div>
                            
                            <div className="flex justify-between items-center p-2 bg-white rounded border">
                                <div>
                                    <p className="text-xs text-muted-foreground">Sort Code</p>
                                    <p className="font-medium font-mono">{bankDetails.sortCode}</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(bankDetails.sortCode, "Sort Code")}
                                    className="h-8 w-8 p-0"
                                >
                                    <Copy className={`h-3 w-3 ${copiedField === "Sort Code" ? "text-green-600" : "text-gray-500"}`} />
                                </Button>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-2 bg-white rounded border">
                                <div>
                                    <p className="text-xs text-muted-foreground">Bank Name</p>
                                    <p className="font-medium">{bankDetails.bankName}</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(bankDetails.bankName, "Bank Name")}
                                    className="h-8 w-8 p-0"
                                >
                                    <Copy className={`h-3 w-3 ${copiedField === "Bank Name" ? "text-green-600" : "text-gray-500"}`} />
                                </Button>
                            </div>
                            
                            <div className="flex justify-between items-center p-2 bg-white rounded border">
                                <div>
                                    <p className="text-xs text-muted-foreground">IBAN</p>
                                    <p className="font-medium font-mono text-sm">{bankDetails.iban}</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(bankDetails.iban, "IBAN")}
                                    className="h-8 w-8 p-0"
                                >
                                    <Copy className={`h-3 w-3 ${copiedField === "IBAN" ? "text-green-600" : "text-gray-500"}`} />
                                </Button>
                            </div>
                            
                            <div className="flex justify-between items-center p-2 bg-white rounded border">
                                <div>
                                    <p className="text-xs text-muted-foreground">BIC/SWIFT</p>
                                    <p className="font-medium font-mono">{bankDetails.bic}</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(bankDetails.bic, "BIC/SWIFT")}
                                    className="h-8 w-8 p-0"
                                >
                                    <Copy className={`h-3 w-3 ${copiedField === "BIC/SWIFT" ? "text-green-600" : "text-gray-500"}`} />
                                </Button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Reference Code Section */}
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="font-semibold text-yellow-800 mb-2">Important: Payment Reference</h4>
                                <p className="text-sm text-yellow-700 mb-3">
                                    Always include your <strong>ORDER REFERENCE NUMBER</strong> when making payments to ensure proper allocation:
                                </p>
                                <div className="flex items-center gap-2 p-2 bg-white rounded border border-yellow-300">
                                    <Badge variant="secondary" className="font-mono text-sm px-3 py-1">
                                        XXXXX
                                    </Badge>
                                    <span className="text-xs text-gray-500">(Example format)</span>
                                </div>
                                <p className="text-xs text-yellow-600 mt-2">
                                    Use your specific order reference number from your homework assignment when making the payment.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
                )}
            </Card>
        </div>
    );
}