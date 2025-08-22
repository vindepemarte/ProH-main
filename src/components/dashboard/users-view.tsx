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
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold">User Management</h2>
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-300px)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Referred By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                        <Select 
                          value={u.role} 
                          onValueChange={(newRole: UserRole) => handleUpdateUserRole(u.id, newRole)}
                          disabled={u.id === user.id} // Super agent can't change their own role
                        >
                            <SelectTrigger className="w-40 capitalize">
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
                    <TableCell>{u.referredBy}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
