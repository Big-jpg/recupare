"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Users, 
  UserPlus, 
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  Mail,
  Calendar,
  Search
} from "lucide-react";
import { getInitials, formatUserRole } from "@/lib/utils";

// Mock user data for demonstration
const mockUsers = [
  {
    id: "1",
    displayName: "Alice Johnson",
    primaryEmail: "alice@company.com",
    role: "admin",
    status: "active",
    lastLogin: "2 minutes ago",
    createdAt: "2024-01-15",
    profileImageUrl: null
  },
  {
    id: "2", 
    displayName: "Bob Smith",
    primaryEmail: "bob@company.com",
    role: "analyst",
    status: "active", 
    lastLogin: "1 hour ago",
    createdAt: "2024-02-20",
    profileImageUrl: null
  },
  {
    id: "3",
    displayName: "Carol Davis", 
    primaryEmail: "carol@company.com",
    role: "viewer",
    status: "inactive",
    lastLogin: "2 days ago",
    createdAt: "2024-03-10",
    profileImageUrl: null
  },
  {
    id: "4",
    displayName: "David Wilson",
    primaryEmail: "david@company.com", 
    role: "analyst",
    status: "active",
    lastLogin: "30 minutes ago",
    createdAt: "2024-01-25",
    profileImageUrl: null
  }
];

interface User {
  id: string;
  displayName: string;
  primaryEmail: string;
  role: string;
  status: string;
  lastLogin: string;
  createdAt: string;
  profileImageUrl: string | null;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = users.filter(user =>
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.primaryEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRoleChange = (userId: string, newRole: string) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, role: newRole } : user
    ));
  };

  const handleStatusChange = (userId: string, newStatus: string) => {
    setUsers(users.map(user =>
      user.id === userId ? { ...user, status: newStatus } : user
    ));
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(user => user.id !== userId));
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "default";
      case "analyst":
        return "secondary";
      case "viewer":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    return status === "active" ? "success" : "secondary";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage user accounts, roles, and permissions
            </CardDescription>
          </div>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 border rounded-md bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex items-center space-x-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.profileImageUrl || ""} alt={user.displayName} />
                  <AvatarFallback>
                    {getInitials(user.displayName)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium truncate">{user.displayName}</h4>
                    {user.role === "admin" && (
                      <ShieldCheck className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{user.primaryEmail}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>Last login: {user.lastLogin}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Badge variant={getRoleBadgeVariant(user.role)}>
                  {formatUserRole(user.role)}
                </Badge>
                <Badge variant={getStatusBadgeVariant(user.status)}>
                  {user.status}
                </Badge>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                    <DropdownMenuItem 
                      onClick={() => handleRoleChange(user.id, "admin")}
                      disabled={user.role === "admin"}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Admin
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleRoleChange(user.id, "analyst")}
                      disabled={user.role === "analyst"}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Analyst
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleRoleChange(user.id, "viewer")}
                      disabled={user.role === "viewer"}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Viewer
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Status</DropdownMenuLabel>
                    <DropdownMenuItem 
                      onClick={() => handleStatusChange(user.id, user.status === "active" ? "inactive" : "active")}
                    >
                      {user.status === "active" ? "Deactivate" : "Activate"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium">No users found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchTerm ? "Try adjusting your search terms." : "Get started by adding a new user."}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{users.length}</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-success">
                {users.filter(u => u.status === "active").length}
              </div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">
                {users.filter(u => u.role === "admin").length}
              </div>
              <div className="text-sm text-muted-foreground">Administrators</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-info">
                {users.filter(u => u.role === "analyst").length}
              </div>
              <div className="text-sm text-muted-foreground">Analysts</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

