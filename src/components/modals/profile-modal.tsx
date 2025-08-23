"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAppContext } from "@/contexts/app-context"
import { useState, useEffect } from "react"
import { User, Mail, Lock, Save, LogOut } from "lucide-react"

export default function ProfileModal() {
  const { profileModalOpen, setProfileModalOpen, user, logout, updateProfile } = useAppContext();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPassword("");
    }
  }, [user]);

  if (!user) return null;

  const handleSave = async () => {
    setIsLoading(true);
    const updates: { name?: string; email?: string; password?: string } = {};
    
    if (name.trim() !== user.name && name.trim()) {
      updates.name = name.trim();
    }
    if (email.trim() !== user.email && email.trim()) {
      updates.email = email.trim();
    }
    if (password.trim()) {
      updates.password = password.trim();
    }
    
    if (Object.keys(updates).length > 0) {
      await updateProfile(updates);
      setPassword(""); // Clear password field after update
    } else {
      setProfileModalOpen(false);
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
      <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Settings
          </DialogTitle>
          <DialogDescription>
            Update your account information. Leave password blank to keep current password.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right flex items-center gap-1">
              <User className="w-4 h-4" />
              Name
            </Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="col-span-3" 
              placeholder="Enter your name"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right flex items-center gap-1">
              <Mail className="w-4 h-4" />
              Email
            </Label>
            <Input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3" 
              placeholder="Enter your email"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right flex items-center gap-1">
              <Lock className="w-4 h-4" />
              Password
            </Label>
            <Input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password (optional)" 
              className="col-span-3" 
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="destructive" onClick={logout} className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
          <Button 
            type="submit" 
            onClick={handleSave} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isLoading ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
