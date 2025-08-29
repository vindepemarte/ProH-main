
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useAppContext } from "@/contexts/app-context"
import { Loader2 } from "lucide-react"

const requestChangesSchema = z.object({
  notes: z.string().min(10, { message: "Please provide detailed feedback (at least 10 characters)." }),
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


type RequestChangesFormValues = z.infer<typeof requestChangesSchema>

interface RequestChangesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RequestChangesModal({ open, onOpenChange }: RequestChangesModalProps) {
  const { selectedHomework, requestChangesOnHomework } = useAppContext();
  
  const form = useForm<RequestChangesFormValues>({
    resolver: zodResolver(requestChangesSchema),
    defaultValues: {
      notes: "",
      files: undefined
    },
  })
  
  const fileRef = form.register("files");

  async function onSubmit(data: RequestChangesFormValues) {
    if (!selectedHomework) return;
    
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
      
    await requestChangesOnHomework(selectedHomework.id, { ...data, files: uploadedFiles });
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col bg-background/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle>Request Changes for Homework #{selectedHomework?.id}</DialogTitle>
          <DialogDescription>
            Provide your feedback and upload any additional files. This will be sent to the worker.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex-grow overflow-auto pr-6 -mr-6">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., 'Please expand on section 2 and double-check the citation for the Smith (2022) source.'"
                      className="resize-y min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="files"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Upload Supporting Files</FormLabel>
                  <FormControl>
                    <Input type="file" multiple {...fileRef} onChange={(e) => field.onChange(e.target.files)} />
                  </FormControl>
                  <FormDescription>
                    Attach any new documents the worker needs.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

          <DialogFooter className="pt-4 sticky bottom-0 bg-background/95 pb-4 gap-3 sm:gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
