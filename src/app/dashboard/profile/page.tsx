"use client";

import { useState } from "react";
import { useGetProfile, useUpdateProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, User, Mail, Calendar, Crown } from "lucide-react";
import { toast } from "sonner";
import { UploadButton } from "@/lib/uploadthing";
import "@uploadthing/react/styles.css";

export default function ProfilePage() {
  const { data: profileData, isLoading } = useGetProfile();
  const updateProfileMutation = useUpdateProfile();

  const [name, setName] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const profile = profileData?.data;

  const handleUpdateProfile = async () => {
    if (!name && !profile?.name) {
      toast.error("Name is required");
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        name: name || profile?.name,
      });
      toast.success("Profile updated successfully");
      setIsEditing(false);
      setName("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    }
  };

  const handleImageUpload = async (url: string) => {
    try {
      await updateProfileMutation.mutateAsync({ image: url });
      toast.success("Profile picture updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile picture");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Profile not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and profile information
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Picture Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>
              Upload a profile picture to personalize your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.image || undefined} />
                <AvatarFallback className="text-2xl">
                  {profile.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <UploadButton
                  endpoint="profileImage"
                  onClientUploadComplete={(res) => {
                    if (res?.[0]?.url) {
                      handleImageUpload(res[0].url);
                    }
                  }}
                  onUploadError={(error: Error) => {
                    toast.error(`Upload failed: ${error.message}`);
                  }}
                  appearance={{
                    button:
                      "ut-ready:bg-primary ut-ready:text-primary-foreground hover:ut-ready:bg-primary/90 ut-uploading:cursor-not-allowed ut-uploading:bg-primary/50 ut-uploading:after:bg-primary text-sm px-4 py-2 rounded-md",
                    container: "flex items-center gap-2",
                    allowedContent: "text-xs text-muted-foreground",
                  }}
                />
                {profile.image && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleImageUpload("")}
                    disabled={updateProfileMutation.isPending}
                  >
                    Remove Picture
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <div className="flex gap-2">
                  <Input
                    id="name"
                    placeholder={profile.name}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isEditing}
                  />
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Button
                        onClick={handleUpdateProfile}
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setName("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => setIsEditing(true)}>Edit</Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    value={profile.email}
                    disabled
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              View your account details and subscription status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">User Role</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {profile.role.toLowerCase()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <Crown className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Subscription</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {profile.subscriptionTier.toLowerCase()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Member Since</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(profile.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(profile.updatedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
