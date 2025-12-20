"use client";

import { useState, useEffect } from "react";
import { useSelectedBusiness } from "@/components/providers/business-provider";
import { useGetMembers, useAddMember, useUpdateMember, useRemoveMember, useSearchUser } from "@/hooks/use-members";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, MoreHorizontal, Plus, UserPlus, Trash2, Edit, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { BusinessRole } from "@/generated/prisma";

const ROLE_LABELS: Record<BusinessRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  ACCOUNTANT: "Accountant",
  VIEWER: "Viewer",
};

const ROLE_DESCRIPTIONS: Record<BusinessRole, string> = {
  OWNER: "Full access to all features and settings",
  ADMIN: "Can manage members, transactions, and business settings",
  ACCOUNTANT: "Can create and edit transactions, view reports",
  VIEWER: "Read-only access to view data and reports",
};

const ROLE_COLORS: Record<BusinessRole, string> = {
  OWNER: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  ADMIN: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  ACCOUNTANT: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  VIEWER: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

export default function TeamPage() {
  const { selectedBusinessId } = useSelectedBusiness();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [debouncedEmail, setDebouncedEmail] = useState("");
  const [role, setRole] = useState<Exclude<BusinessRole, "OWNER">>("VIEWER");
  const [newRole, setNewRole] = useState<Exclude<BusinessRole, "OWNER">>("VIEWER");

  // Debounce email input for search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedEmail(email);
    }, 500);
    return () => clearTimeout(timer);
  }, [email]);

  const { data: membersData, isLoading } = useGetMembers(selectedBusinessId || "");
  const { data: searchData, isLoading: isSearching, error: searchError } = useSearchUser(debouncedEmail);
  const addMemberMutation = useAddMember(selectedBusinessId || "");
  const updateMemberMutation = useUpdateMember(selectedBusinessId || "", selectedMember?.id || "");
  const removeMemberMutation = useRemoveMember(selectedBusinessId || "");

  if (!selectedBusinessId) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a business to manage team members.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleAddMember = async () => {
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    if (!searchData?.data) {
      toast.error("Please wait for user search to complete or check the email");
      return;
    }

    try {
      await addMemberMutation.mutateAsync({ email, role });
      toast.success("Member added successfully");
      setIsAddDialogOpen(false);
      setEmail("");
      setDebouncedEmail("");
      setRole("VIEWER");
    } catch (error: any) {
      toast.error(error.message || "Failed to add member");
    }
  };

  const handleUpdateMember = async () => {
    try {
      await updateMemberMutation.mutateAsync({ role: newRole });
      toast.success("Member role updated successfully");
      setIsEditDialogOpen(false);
      setSelectedMember(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update member");
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this business?`)) {
      return;
    }

    try {
      await removeMemberMutation.mutateAsync(memberId);
      toast.success("Member removed successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to remove member");
    }
  };

  const members = membersData?.data || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
          <p className="text-muted-foreground">
            Manage who has access to your business
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>
                Invite someone to join your business. They must have an existing account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {isSearching && email && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Searching for user...
                  </p>
                )}
                {searchError && debouncedEmail && (
                  <p className="text-xs text-red-600">
                    User not found with this email. They must have an account first.
                  </p>
                )}
                {searchData?.data && (
                  <div className="flex items-center gap-2 p-2 rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={searchData.data.image || undefined} />
                      <AvatarFallback className="text-xs">
                        {searchData.data.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        {searchData.data.name}
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300">
                        {searchData.data.email}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(value) => {
                  if (value === "ADMIN" || value === "ACCOUNTANT" || value === "VIEWER") {
                    setRole(value);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">
                      <div>
                        <div className="font-medium">Admin</div>
                        <div className="text-xs text-muted-foreground">
                          Can manage members and business settings
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="ACCOUNTANT">
                      <div>
                        <div className="font-medium">Accountant</div>
                        <div className="text-xs text-muted-foreground">
                          Can create and edit transactions
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="VIEWER">
                      <div>
                        <div className="font-medium">Viewer</div>
                        <div className="text-xs text-muted-foreground">
                          Read-only access
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {ROLE_DESCRIPTIONS[role]}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddMember}
                disabled={!email || !searchData?.data || addMemberMutation.isPending || isSearching}
              >
                {addMemberMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members ({members.length})</CardTitle>
          <CardDescription>
            Manage roles and permissions for your team
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No team members yet</h3>
              <p className="text-sm text-muted-foreground">
                Add your first team member to get started
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member: any) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.user.image || undefined} />
                          <AvatarFallback>
                            {member.user.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{member.user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{member.user.email}</TableCell>
                    <TableCell>
                      <Badge className={ROLE_COLORS[member.role as BusinessRole]}>
                        {ROLE_LABELS[member.role as BusinessRole]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.joinedAt
                        ? new Date(member.joinedAt).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {member.role !== "OWNER" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedMember(member);
                                setNewRole(member.role);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleRemoveMember(member.id, member.user.name)
                              }
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Member Role</DialogTitle>
            <DialogDescription>
              Update {selectedMember?.user.name}&apos;s role in this business
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newRole">New Role</Label>
              <Select value={newRole} onValueChange={(value) => {
                if (value === "ADMIN" || value === "ACCOUNTANT" || value === "VIEWER") {
                  setNewRole(value);
                }
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {ROLE_DESCRIPTIONS[newRole]}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateMember}
              disabled={updateMemberMutation.isPending}
            >
              {updateMemberMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
