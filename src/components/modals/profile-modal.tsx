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

export default function ProfileModal() {
  const { profileModalOpen, setProfileModalOpen, user, logout } = useAppContext();

  if (!user) return null;

  return (
    <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
      <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
          <DialogDescription>
            Manage your account settings.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" defaultValue={user.name} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input id="email" type="email" defaultValue={user.email} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              Password
            </Label>
            <Input id="password" type="password" placeholder="New Password" className="col-span-3" />
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
            <Button type="button" variant="destructive" onClick={logout}>Logout</Button>
            <Button type="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
