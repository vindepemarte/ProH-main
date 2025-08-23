"use client";

import { useAppContext } from "@/contexts/app-context";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { UserRole } from "@/lib/types";
import { useState, useMemo } from "react";
import { Search, User as UserIcon, Mail, Users, Shield } from "lucide-react";

const roleColors: Record<UserRole, string> = {
  student: "bg-blue-100 text-blue-700 border-blue-200",
  agent: "bg-green-100 text-green-700 border-green-200",
  worker: "bg-orange-100 text-orange-700 border-orange-200",
  super_worker: "bg-purple-100 text-purple-700 border-purple-200",
  super_agent: "bg-red-100 text-red-700 border-red-200",
};

const roleIcons: Record<UserRole, typeof UserIcon> = {
  student: UserIcon,
  agent: Users,
  worker: UserIcon,
  super_worker: Shield,
  super_agent: Shield,
};

export default function UsersView() {
  const { allUsers, user, handleUpdateUserRole } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return allUsers;
    const search = searchTerm.toLowerCase();
    return allUsers.filter(u => 
      u.name.toLowerCase().includes(search) || 
      u.email.toLowerCase().includes(search) ||
      u.role.toLowerCase().includes(search) ||
      (u.referredBy && u.referredBy.toLowerCase().includes(search))
    );
  }, [allUsers, searchTerm]);

  if (user?.role !== 'super_agent') {
    return null;
  }

  return (
    <div className="space-y-6 p-4 sm:p-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">User Management</h2>
        <Badge variant="outline" className="text-sm px-3 py-1">
          {filteredUsers.length} {filteredUsers.length === 1 ? 'User' : 'Users'}
        </Badge>
      </div>
      
      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name, email, role, or referrer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Grid/List */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No users found</p>
                <p className="text-sm">
                  {searchTerm ? "Try adjusting your search terms" : "No users have been registered yet"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.map((u) => {
              const RoleIcon = roleIcons[u.role];
              return (
                <Card key={u.id} className="hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <RoleIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold">{u.name}</CardTitle>
                          <Badge 
                            variant="outline" 
                            className={`text-xs mt-1 capitalize ${roleColors[u.role]}`}
                          >
                            {u.role.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      {u.id === user.id && (
                        <Badge variant="secondary" className="text-xs">
                          You
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Email */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{u.email}</span>
                    </div>
                    
                    {/* Referred By */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        {u.referredBy && u.referredBy !== 'N/A' ? `Referred by ${u.referredBy}` : 'Direct registration'}
                      </span>
                    </div>
                    
                    {/* Role Selector */}
                    <div className="pt-2">
                      <label className="text-sm font-medium mb-2 block">Change Role</label>
                      <Select 
                        value={u.role} 
                        onValueChange={(newRole: UserRole) => handleUpdateUserRole(u.id, newRole)}
                        disabled={u.id === user.id}
                      >
                        <SelectTrigger className="w-full">
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
                      {u.id === user.id && (
                        <p className="text-xs text-muted-foreground mt-1">
                          You cannot change your own role
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
