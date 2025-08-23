"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAppContext } from "@/contexts/app-context"
import { useState } from "react"
import TermsConditionsModal from "./terms-conditions-modal"

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
})

const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  referenceCode: z.string().min(4, { message: "Reference code is required." }),
  termsAccepted: z.boolean().refine(val => val === true, { message: "You must accept the terms and conditions." }),
})

function LoginForm() {
    const { login } = useAppContext();
    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    function onSubmit(values: z.infer<typeof loginSchema>) {
        login(values.email, values.password);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl><Input placeholder="you@example.com" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full">Login</Button>
            </form>
        </Form>
    )
}

function RegisterForm() {
    const { register } = useAppContext();
    const [termsModalOpen, setTermsModalOpen] = useState(false);
    
    const form = useForm<z.infer<typeof registerSchema>>({
        resolver: zodResolver(registerSchema),
        defaultValues: { name: "", email: "", password: "", referenceCode: "", termsAccepted: false },
    });

    function onSubmit(values: z.infer<typeof registerSchema>) {
        register(values.name, values.email, values.password, values.referenceCode, values.termsAccepted);
    }
    
    return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="password" render={({ field }) => (
                        <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="referenceCode" render={({ field }) => (
                        <FormItem><FormLabel>Reference Code</FormLabel><FormControl><Input placeholder="XXXX" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField 
                        control={form.control} 
                        name="termsAccepted" 
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                    <Checkbox 
                                        checked={field.value} 
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel className="text-sm font-normal">
                                        I agree to the{" "}
                                        <button
                                            type="button"
                                            onClick={() => setTermsModalOpen(true)}
                                            className="text-primary underline hover:no-underline"
                                        >
                                            Terms and Conditions
                                        </button>
                                    </FormLabel>
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )} 
                    />
                    <Button type="submit" className="w-full">Register</Button>
                </form>
            </Form>
            
            <TermsConditionsModal 
                open={termsModalOpen} 
                onOpenChange={setTermsModalOpen}
                showAcceptButton={false}
            />
        </>
    )
}

export default function AuthModal() {
  const { authModalOpen, setAuthModalOpen } = useAppContext()
  return (
    <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle>Welcome</DialogTitle>
          <DialogDescription>
            Login or create an account to get started.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="pt-4">
            <LoginForm />
          </TabsContent>
          <TabsContent value="register" className="pt-4">
            <RegisterForm />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
