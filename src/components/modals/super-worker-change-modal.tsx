"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAppContext } from "@/contexts/app-context"
import { useState, useEffect } from "react"
import { CalendarIcon, PoundSterling, AlertCircle, History, MessageSquare } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { HomeworkChangeRequest } from "@/lib/types"

interface SuperWorkerChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SuperWorkerChangeModal({ open, onOpenChange }: SuperWorkerChangeModalProps) {
    const { user, selectedHomework: hw, calculatePrice, requestSuperWorkerChanges, pricingConfig } = useAppContext();
    const [newWordCount, setNewWordCount] = useState<number>(0);
    const [newDeadline, setNewDeadline] = useState<Date | undefined>(undefined);
    const [notes, setNotes] = useState('');
    const [newPrice, setNewPrice] = useState<number>(0);
    const [isCalculating, setIsCalculating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [datePickerOpen, setDatePickerOpen] = useState(false);

    useEffect(() => {
        if (hw && open) {
            setNewWordCount(hw.wordCount);
            setNewDeadline(new Date(hw.deadline));
            setNotes('');
            calculateNewPrice(hw.wordCount, new Date(hw.deadline));
        }
    }, [hw, open]);

    // Recalculate price when pricing config changes
    useEffect(() => {
        if (pricingConfig && newWordCount && newDeadline) {
            calculateNewPrice(newWordCount, newDeadline);
        }
    }, [pricingConfig]);

    const calculateNewPrice = async (wordCount: number, deadline: Date) => {
        if (!wordCount || !deadline) return;
        setIsCalculating(true);
        try {
            const price = await calculatePrice(wordCount, deadline);
            setNewPrice(price);
        } catch (error) {
            console.error('Failed to calculate price:', error);
        } finally {
            setIsCalculating(false);
        }
    };

    const handleWordCountChange = (value: string) => {
        const count = parseInt(value) || 0;
        setNewWordCount(count);
        if (count && newDeadline) {
            calculateNewPrice(count, newDeadline);
        }
    };

    const handleDeadlineChange = (date: Date | undefined) => {
        setNewDeadline(date);
        if (date && newWordCount) {
            calculateNewPrice(newWordCount, date);
        }
    };

    const handleSubmit = async () => {
        if (!hw || !newWordCount || !newDeadline || !notes.trim()) return;
        
        setIsSubmitting(true);
        try {
            await requestSuperWorkerChanges(hw.id, {
                newWordCount,
                newDeadline,
                notes
            });
            
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to submit change request:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!hw || !user || user.role !== 'super_worker') return null;

    const hasChanges = newWordCount !== hw.wordCount || 
                      (newDeadline && newDeadline.getTime() !== new Date(hw.deadline).getTime());
    const currentPrice = Number(hw.price || 0);
    const priceDifference = newPrice - currentPrice;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Request Changes for Homework #{hw.id}</DialogTitle>
                    <DialogDescription>
                        Modify word count or deadline. This will require student approval if price changes.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-grow overflow-y-auto space-y-6 pr-1">
                    {/* Current vs New Comparison */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <Label className="text-muted-foreground">Current</Label>
                                    <p>Words: {hw.wordCount}</p>
                                    <p>Deadline: {format(new Date(hw.deadline), 'PPP')}</p>
                                    <p>Price: ••••••••</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">New</Label>
                                    <p>Words: {newWordCount}</p>
                                    <p>Deadline: {newDeadline ? format(newDeadline, 'PPP') : 'Not set'}</p>
                                    <p className="text-muted-foreground">
                                        Price: ••••••••
                                        {priceDifference !== 0 && (
                                            <span className="ml-2">
                                                (••••••••)
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Word Count Input */}
                    <div className="space-y-2">
                        <Label htmlFor="wordCount">New Word Count</Label>
                        <Input
                            id="wordCount"
                            type="number"
                            value={newWordCount || ''}
                            onChange={(e) => handleWordCountChange(e.target.value)}
                            placeholder="Enter word count"
                            min="1"
                        />
                    </div>

                    {/* Deadline Input */}
                    <div className="space-y-2">
                        <Label>New Deadline</Label>
                        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !newDeadline && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {newDeadline ? format(newDeadline, "PPP") : "Pick a date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={newDeadline}
                                    onSelect={handleDeadlineChange}
                                    onDone={() => {
                                        setDatePickerOpen(false);
                                    }}
                                    disabled={(date) => date < new Date()}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Reason for Changes *</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Explain why these changes are needed..."
                            className="min-h-[100px]"
                        />
                    </div>

                    {/* Price Change Warning */}
                    {priceDifference !== 0 && (
                        <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium text-yellow-800">Price Change Notice</p>
                                <p className="text-yellow-700">
                                    This change will {priceDifference > 0 ? 'increase' : 'decrease'} the price. 
                                    The student will need to approve this change.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Previous Change Requests History */}
                    {hw.changeRequests && hw.changeRequests.length > 0 && (
                        <div className="pt-4 border-t">
                            <h3 className="flex items-center gap-2 font-semibold mb-3 text-sm">
                                <History className="w-4 h-4"/> 
                                Previous Change Requests ({hw.changeRequests.length})
                            </h3>
                            <div className="space-y-3 max-h-40 overflow-y-auto">
                                {[...hw.changeRequests]
                                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                    .slice(0, 3) // Show only last 3 requests
                                    .map((req, index) => {
                                        const isLatest = index === 0;
                                        return (
                                            <div key={req.id} className={`p-2 rounded-md border text-xs ${
                                                isLatest ? 'bg-blue-50 border-blue-200' : 'bg-muted/30 border-border'
                                            }`}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <MessageSquare className="w-3 h-3" />
                                                        {isLatest && (
                                                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                                                                Latest
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-muted-foreground">
                                                        {new Date(req.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                {req.notes && (
                                                    <p className="text-muted-foreground line-clamp-2">
                                                        {req.notes}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })
                                }
                                {hw.changeRequests.length > 3 && (
                                    <p className="text-xs text-muted-foreground text-center py-1">
                                        ...and {hw.changeRequests.length - 3} more requests
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-shrink-0 pt-4 border-t bg-background gap-3 sm:gap-2">
                    <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSubmit}
                        disabled={!hasChanges || !notes.trim() || isSubmitting || isCalculating}
                    >
                        {isSubmitting ? 'Submitting...' : 'Request Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}