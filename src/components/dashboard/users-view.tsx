"use client";

import { useAppContext } from "@/contexts/app-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { UserRole } from "@/lib/types";

export default function UsersView() {
  const { allUsers, user, handleUpdateUserRole } = useAppContext();

  if (user?.role !== 'super_agent') {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold px-4 sm:px-0">User Management</h2>
      <Card>
        <CardHeader>
          <CardTitle>All Users ({allUsers.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile-optimized scrollable container */}
          <ScrollArea className="h-[calc(100vh-280px)] w-full">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="min-w-[120px]">Name</TableHead>
                    <TableHead className="min-w-[180px]">Email</TableHead>
                    <TableHead className="min-w-[140px]">Role</TableHead>
                    <TableHead className="min-w-[120px]">Referred By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allUsers.map((u) => (
                    <TableRow key={u.id} className="border-b">
                      <TableCell className="font-medium py-4">{u.name}</TableCell>
                      <TableCell className="py-4 text-sm">{u.email}</TableCell>
                      <TableCell className="py-4">
                          <Select 
                            value={u.role} 
                            onValueChange={(newRole: UserRole) => handleUpdateUserRole(u.id, newRole)}
                            disabled={u.id === user.id} // Super agent can't change their own role
                          >
                              <SelectTrigger className="w-full max-w-[160px] capitalize text-xs">
                                  <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="student">Student</SelectItem>
                                  <SelectItem value="agent">Agent</SelectItem>
                                  <SelectItem value="worker">Worker</SelectItem>
                                  <SelectItem value="super_worker">Super Worker</SelectItem>
                                  <SelectItem value="super_agent">Super Agent</SelectItem>
                              </SelectContent>
                          </Select>
                      </TableCell>
                      <TableCell className="py-4 text-sm text-muted-foreground">{u.referredBy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
