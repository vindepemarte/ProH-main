"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { useEffect, useState, useCallback } from "react"
import Confetti from 'react-confetti'
import { Video } from 'lucide-react';
import TutorialModal from './tutorial-modal';


import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { useAppContext } from "@/contexts/app-context"
import { cn } from "@/lib/utils"
import { ProjectNumber } from "@/lib/types"
import { CalendarIcon, Loader2 } from "lucide-react"

const projectNumbers: { id: ProjectNumber; label: string }[] = [
    { id: 'A1', label: 'Assignment 1' },
    { id: 'A2', label: 'Assignment 2' },
    { id: 'A3', label: 'Assignment 3' },
    { id: 'A4', label: 'Assignment 4' },
    { id: 'Full Project', label: 'Full Project' }
]

const homeworkFormSchema = z.object({
  moduleName: z.string().min(3, { message: "Module name must be at least 3 characters." }),
  projectNumber: z.array(z.string()).refine(value => value.some(item => item), {
    message: "You have to select at least one project number.",
  }),
  wordCount: z.coerce.number().min(100, { message: "Word count must be at least 100." }),
  deadline: z.date({ required_error: "A deadline is required." }),
  notes: z.string().optional(),
  files: z.any().optional(),
})
.refine(data => {
    if (typeof window === 'undefined') return true; 
    if (data.files && data.files instanceof FileList) {
      return Array.from(data.files).every(file => file instanceof File);
    }
    return true;
  }, {
    message: "Files must be a valid FileList.",
    path: ["files"],
  });


type HomeworkFormValues = z.infer<typeof homeworkFormSchema>

interface NewHomeworkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewHomeworkStepperModal({ open, onOpenChange }: NewHomeworkModalProps) {
  const { submitHomework, calculatePrice, pricingConfig } = useAppContext();
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const [formCompleted, setFormCompleted] = useState(false);
  
  const form = useForm<HomeworkFormValues>({
    resolver: zodResolver(homeworkFormSchema),
    defaultValues: {
      moduleName: "",
      projectNumber: [],
      wordCount: 1000,
      notes: "",
      files: undefined
    },
  })

  const watchedWordCount = useWatch({ control: form.control, name: 'wordCount' });
  const watchedDeadline = useWatch({ control: form.control, name: 'deadline' });
  
  const fileRef = form.register("files");

  const handlePriceCalculation = useCallback(async () => {
    if (watchedWordCount && watchedDeadline) {
      setIsCalculating(true);
      const price = await calculatePrice(watchedWordCount, watchedDeadline);
      setCalculatedPrice(price);
      setIsCalculating(false);
    }
  }, [watchedWordCount, watchedDeadline, calculatePrice]);

  useEffect(() => {
    const timer = setTimeout(() => {
        handlePriceCalculation();
    }, 500); // Debounce calculation
    return () => clearTimeout(timer);
  }, [handlePriceCalculation]);

  // Recalculate price when pricing config changes
  useEffect(() => {
    if (pricingConfig && watchedWordCount && watchedDeadline) {
      handlePriceCalculation();
    }
  }, [pricingConfig, handlePriceCalculation, watchedWordCount, watchedDeadline]);


  async function onSubmit(data: HomeworkFormValues) {
    // Convert files to base64 data URLs if any files are selected
    const uploadedFiles = data.files && data.files.length > 0 
      ? await Promise.all(
          Array.from(data.files as FileList).map(async (file) => {
            // Convert file to base64 data URL for storage
            const dataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            });
            
            return {
              name: file.name,
              url: dataUrl // Store as base64 data URL
            };
          })
        )
      : [];
      
    await submitHomework({ 
      ...data, 
      projectNumber: data.projectNumber as ProjectNumber[], 
      notes: data.notes || '', 
      files: uploadedFiles 
    });
    setFormCompleted(true);
    form.reset();
    setCurrentStep(0);
  }

  const handleNextStep = async (field: any) => {
    const isValid = await form.trigger(field);
    if (isValid) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleClose = () => {
    if (form.formState.isDirty) {
      setIsCloseConfirmOpen(true);
    } else {
      onOpenChange(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col bg-background/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>Request New Homework</DialogTitle>
            <DialogDescription>
              Fill out the details below to submit a new assignment request. The price will be calculated automatically.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex-grow overflow-auto pr-6 -mr-6 pb-4">
              {currentStep === 0 && (
                <FormField
                  control={form.control}
                  name="moduleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Module Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Business Analytics" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {currentStep === 1 && (
                <FormField
                  control={form.control}
                  name="projectNumber"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>Project Number</FormLabel>
                        <FormDescription>
                          Select all that apply.
                        </FormDescription>
                      </div>
                      {projectNumbers.map((item) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name="projectNumber"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={item.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, item.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== item.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {item.label}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {currentStep === 2 && (
                <FormField
                  control={form.control}
                  name="wordCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Word Count</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 1500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {currentStep === 3 && (
                <>
                  <FormField
                    control={form.control}
                    name="deadline"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Deadline</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                                type="button"
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-1" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(date) => {
                                field.onChange(date);
                                // Close the popover after selecting a date
                                const popover = document.querySelector('[data-state="open"]');
                                if (popover) {
                                  const trigger = popover.previousElementSibling as HTMLElement;
                                  if (trigger) trigger.click();
                                }
                              }}
                              disabled={(date) => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0); // Reset time to start of day
                                return date < today;
                              }}
                              initialFocus
                              fromDate={new Date()}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Select a deadline date (must be today or later)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <p className="text-lg font-semibold">Estimated Price:</p>
                          {isCalculating ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <p className="text-2xl font-bold text-primary">
                              {calculatedPrice !== null ? `£${calculatedPrice.toFixed(2)}` : '...'}
                            </p>
                          )}
                        </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {currentStep === 4 && (
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes for Worker</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Include any specific instructions, required sources, or formatting guidelines."
                          className="resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {currentStep === 5 && (
                <FormField
                  control={form.control}
                  name="files"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upload Files</FormLabel>
                      <FormControl>
                        <Input type="file" multiple {...fileRef} onChange={(e) => field.onChange(e.target.files)} />
                      </FormControl>
                      <FormDescription>
                        Attach up to 20 files, max 50MB each.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

            <DialogFooter className="pt-4 border-t mt-4 gap-3 sm:gap-2">
              <Button variant="ghost" size="icon" onClick={() => setIsTutorialModalOpen(true)}>
                <Video className="h-6 w-6" />
              </Button>
              <div className="flex-grow" />
              {currentStep > 0 && <Button type="button" variant="secondary" onClick={() => setCurrentStep(currentStep - 1)}>Previous</Button>}
              {currentStep === 0 && <Button type="button" onClick={() => handleNextStep("moduleName")}>Next</Button>}
              {currentStep === 1 && <Button type="button" onClick={() => handleNextStep("projectNumber")}>Next</Button>}
              {currentStep === 2 && <Button type="button" onClick={() => handleNextStep("wordCount")}>Next</Button>}
              {currentStep === 3 && <Button type="button" onClick={() => handleNextStep("deadline")}>Next</Button>}
              {currentStep === 4 && <Button type="button" onClick={() => handleNextStep("notes")}>Next</Button>}
              {currentStep === 5 && <Button type="submit" disabled={isCalculating || calculatedPrice === null}>Submit Homework</Button>}
            </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <TutorialModal open={isTutorialModalOpen} onOpenChange={setIsTutorialModalOpen} />
      <Dialog open={isCloseConfirmOpen} onOpenChange={setIsCloseConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
          </DialogHeader>
          <p>You have unsaved changes. Are you sure you want to close?</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCloseConfirmOpen(false)}>No</Button>
            <Button onClick={() => {
              setIsCloseConfirmOpen(false);
              onOpenChange(false);
            }}>Yes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
