import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Bell, Lock, Palette, Mail } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-electric-pink flex items-center justify-center shadow-lg">
            <SettingsIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold">Settings</h2>
            <p className="text-muted-foreground">Manage your application preferences</p>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto">
            <TabsTrigger value="general" className="gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="complaints" className="gap-2">
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Complaints</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Email</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Manage your application appearance and basic settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="app-name">Application Name</Label>
                  <Input id="app-name" placeholder="Complaint Management System" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input id="tagline" placeholder="Your complaints, our priority" />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">Enable dark theme for the dashboard</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Compact Mode</Label>
                    <p className="text-sm text-muted-foreground">Reduce spacing for more content</p>
                  </div>
                  <Switch />
                </div>

                <Separator />

                <Button className="bg-gradient-to-r from-primary to-neon-blue hover:opacity-90">
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Complaints Settings */}
          <TabsContent value="complaints" className="space-y-6">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>Complaint Settings</CardTitle>
                <CardDescription>Configure complaint handling and limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="max-attachments">Max Attachments per Complaint</Label>
                  <Input id="max-attachments" type="number" placeholder="5" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-file-size">Max File Size (MB)</Label>
                  <Input id="max-file-size" type="number" placeholder="10" />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-assign Complaints</Label>
                    <p className="text-sm text-muted-foreground">Automatically assign complaints to available staff</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Anonymous Complaints</Label>
                    <p className="text-sm text-muted-foreground">Enable users to submit without login</p>
                  </div>
                  <Switch />
                </div>

                <Separator />

                <Button className="bg-gradient-to-r from-primary to-neon-blue hover:opacity-90">
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Manage when and how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Complaint Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified when new complaints are submitted</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Status Change Notifications</Label>
                    <p className="text-sm text-muted-foreground">Alert when complaint status changes</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>High Priority Alerts</Label>
                    <p className="text-sm text-muted-foreground">Immediate notification for high priority complaints</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Daily Summary</Label>
                    <p className="text-sm text-muted-foreground">Receive daily summary of complaints</p>
                  </div>
                  <Switch />
                </div>

                <Separator />

                <Button className="bg-gradient-to-r from-primary to-neon-blue hover:opacity-90">
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Settings */}
          <TabsContent value="email" className="space-y-6">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>Email Settings</CardTitle>
                <CardDescription>Configure email templates and SMTP settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input id="smtp-host" placeholder="smtp.example.com" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input id="smtp-port" type="number" placeholder="587" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="from-email">From Email Address</Label>
                  <Input id="from-email" type="email" placeholder="noreply@example.com" />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send email notifications to users</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <Button className="bg-gradient-to-r from-primary to-neon-blue hover:opacity-90">
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage security and authentication settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="min-password">Minimum Password Length</Label>
                  <Input id="min-password" type="number" placeholder="8" />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Strong Passwords</Label>
                    <p className="text-sm text-muted-foreground">Require uppercase, lowercase, numbers, and symbols</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Enable 2FA for admin accounts</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Session Timeout</Label>
                    <p className="text-sm text-muted-foreground">Auto logout after 30 minutes of inactivity</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <Button className="bg-gradient-to-r from-primary to-neon-blue hover:opacity-90">
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
