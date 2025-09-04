"use client"

import { useAppContext } from "@/contexts/app-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, Clock, FileText, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import type { Homework } from "@/lib/types";

export default function PriceIncreaseRequests() {
    const { user, homeworks, updateHomework } = useAppContext();

    if (user?.role !== 'student') return null;

    // Filter homeworks that have price change requests (word_count_change or deadline_change status)
    const priceChangeRequests = homeworks?.filter(hw => 
        hw.status === 'word_count_change' || hw.status === 'deadline_change'
    ) || [];

    if (priceChangeRequests.length === 0) return null;

    const handleApprove = async (homeworkId: string) => {
        try {
            // Change status to payment_approval to indicate student approved the price change
            await updateHomework(homeworkId, { status: 'payment_approval' });
        } catch (error) {
            console.error('Error approving price change:', error);
        }
    };

    const handleReject = async (homeworkId: string) => {
        try {
            // Change status back to in_progress to indicate rejection
            await updateHomework(homeworkId, { status: 'in_progress' });
        } catch (error) {
            console.error('Error rejecting price change:', error);
        }
    };

    const getChangeDescription = (homework: Homework) => {
        if (homework.status === 'word_count_change') {
            return {
                type: 'Word Count Change',
                icon: <FileText className="h-4 w-4" />,
                description: `Word count updated to ${homework.wordCount} words`
            };
        } else if (homework.status === 'deadline_change') {
            return {
                type: 'Deadline Change', 
                icon: <Clock className="h-4 w-4" />,
                description: `Deadline updated to ${format(new Date(homework.deadline), 'PPP')}`
            };
        }
        return {
            type: 'Change Request',
            icon: <AlertTriangle className="h-4 w-4" />,
            description: 'Changes requested'
        };
    };

    return (
        <div className="space-y-4 mb-6">
            <Alert className="border-orange-200 bg-orange-50">
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                    <strong>Price Change Requests:</strong> You have {priceChangeRequests.length} homework assignment{priceChangeRequests.length !== 1 ? 's' : ''} with requested changes that may affect pricing. Please review and respond.
                </AlertDescription>
            </Alert>

            {priceChangeRequests.map((homework) => {
                const changeInfo = getChangeDescription(homework);
                const currentPrice = Number(homework.price || 0);
                
                return (
                    <Card key={homework.id} className="border-orange-200 bg-orange-50/30">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {changeInfo.icon}
                                    <CardTitle className="text-lg">Homework #{homework.id}</CardTitle>
                                    <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                                        {changeInfo.type}
                                    </Badge>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">New Price</p>
                                    <p className="text-lg font-semibold text-orange-700">£{currentPrice.toFixed(2)}</p>
                                </div>
                            </div>
                            <CardDescription>
                                {homework.moduleName} • {changeInfo.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 bg-white rounded border border-orange-200">
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                                    Change Request Details
                                </h4>
                                <div className="text-sm text-muted-foreground space-y-1">
                                    <p><strong>Module:</strong> {homework.moduleName}</p>
                                    <p><strong>Word Count:</strong> {homework.wordCount} words</p>
                                    <p><strong>Deadline:</strong> {format(new Date(homework.deadline), 'PPP')}</p>
                                    <p><strong>Updated Price:</strong> £{currentPrice.toFixed(2)}</p>
                                </div>
                                {homework.changeRequests && homework.changeRequests.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-orange-200">
                                        <p className="text-sm font-medium text-orange-700 mb-1">Notes:</p>
                                        <p className="text-sm text-muted-foreground">
                                            {homework.changeRequests[homework.changeRequests.length - 1].notes || 'No additional notes provided.'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button 
                                    onClick={() => handleApprove(homework.id)}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve Changes
                                </Button>
                                <Button 
                                    onClick={() => handleReject(homework.id)}
                                    variant="outline"
                                    className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject Changes
                                </Button>
                            </div>
                            
                            <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded border border-blue-200">
                                <strong>Note:</strong> Approving will proceed with the updated price and requirements. 
                                Rejecting will revert to the original assignment parameters.
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}