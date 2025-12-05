import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Save,
  Settings,
  Shield,
  CreditCard,
  Bell,
  FileText,
  Globe,
  Sun,
  Moon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";

// Language options
const languages = [
  { value: "en", label: "English" },
  { value: "de", label: "German" },
  { value: "fr", label: "French" },
  { value: "nl", label: "Dutch" },
  { value: "es", label: "Spanish" },
];

// Country options
const countries = [
  "Nigeria", "Ghana", "Kenya", "South Africa", "United States", 
  "United Kingdom", "Germany", "France", "Belgium", "Canada"
];

// Timezone options
const timezones = [
  "Africa/Lagos", "Africa/Accra", "Africa/Nairobi", "Africa/Johannesburg",
  "America/New_York", "America/Los_Angeles", "Europe/London", "Europe/Paris",
  "Europe/Berlin", "UTC"
];

export default function SystemSettings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  
  const { theme, setTheme } = useTheme();
  
  // General settings state
  const [generalSettings, setGeneralSettings] = useState({
    platformName: "DiaspoPlug",
    defaultCountry: "Nigeria",
    timezone: "Africa/Lagos",
    language: "en",
  });

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    passwordRules: "medium",
    sessionTimeout: "30",
    multipleDeviceLogins: true,
  });

  // Payment settings state
  const [paymentSettings, setPaymentSettings] = useState({
    escrowReleaseRules: "hybrid",
    disputeTimeWindow: "72",
    usdtEnabled: true,
    cardEnabled: false,
    mobileMoneyEnabled: true,
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    fcmServerKey: "",
    pushEnabled: true,
    supportEmail: "support@diaspoplug.com",
    smsSenderId: "DCGlobal",
  });

  // Content settings state
  const [contentSettings, setContentSettings] = useState({
    imageUploadsEnabled: true,
    maxImageSize: "5",
    videoUploadsEnabled: false,
    autoHideFlagged: true,
  });

  const handleSave = (section: string) => {
    toast({
      title: "Settings saved",
      description: `${section} settings have been saved successfully.`,
    });
  };

  const testFcmConnection = () => {
    toast({
      title: "FCM Test",
      description: "FCM connection test initiated. Check your device for a test notification.",
    });
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">System Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Control and configure global platform behavior.
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-secondary/50 border border-border flex-wrap h-auto p-1">
            <TabsTrigger value="general" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Settings className="w-4 h-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <CreditCard className="w-4 h-4" />
              Payments & Escrow
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="w-4 h-4" />
              Content & Moderation
            </TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Platform Info</CardTitle>
                <CardDescription>General configuration for the DiaspoPlug platform.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Platform Name</Label>
                    <Input 
                      placeholder="DiaspoPlug"
                      value={generalSettings.platformName}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, platformName: e.target.value }))}
                      className="bg-secondary border-border"
                    />
                    <p className="text-xs text-muted-foreground">Updates platform name displayed on login & home screens.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Default Country</Label>
                    <Select 
                      value={generalSettings.defaultCountry}
                      onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, defaultCountry: value }))}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {countries.map((country) => (
                          <SelectItem key={country} value={country}>{country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Sets the default country for onboarding.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select 
                      value={generalSettings.timezone}
                      onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, timezone: value }))}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {timezones.map((tz) => (
                          <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Affects timestamps across the system.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Language
                    </Label>
                    <Select 
                      value={generalSettings.language}
                      onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, language: value }))}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {languages.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Sets the platform display language.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      {theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                      Theme Mode
                    </Label>
                    <Select 
                      value={theme}
                      onValueChange={(value) => setTheme(value)}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="light">Light Mode</SelectItem>
                        <SelectItem value="dark">Dark Mode</SelectItem>
                        <SelectItem value="system">System Default</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Choose light or dark appearance.</p>
                  </div>
                </div>
                
                <div className="flex justify-end pt-4 border-t border-border">
                  <Button onClick={() => handleSave("General")} className="gap-2">
                    <Save className="w-4 h-4" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Authentication</CardTitle>
                  <CardDescription>Configure authentication requirements for admins.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Two-Factor Authentication (2FA)</Label>
                      <p className="text-xs text-muted-foreground mt-1">If enabled, forces all admins to use 2FA.</p>
                    </div>
                    <Switch 
                      checked={securitySettings.twoFactorEnabled}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: checked }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Password Rules</Label>
                    <Select 
                      value={securitySettings.passwordRules}
                      onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, passwordRules: value }))}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="medium">Medium (8 characters, letters + numbers)</SelectItem>
                        <SelectItem value="strong">Strong (12 characters, letters + numbers + symbols)</SelectItem>
                        <SelectItem value="strict">Strict (16 characters min)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Session Controls</CardTitle>
                  <CardDescription>Manage session behavior and device access.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Session Timeout</Label>
                    <Select 
                      value={securitySettings.sessionTimeout}
                      onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: value }))}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Forces logout after inactivity.</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Multiple Device Logins</Label>
                      <p className="text-xs text-muted-foreground mt-1">Users can be logged in on multiple devices.</p>
                    </div>
                    <Switch 
                      checked={securitySettings.multipleDeviceLogins}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, multipleDeviceLogins: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={() => handleSave("Security")} className="gap-2">
                <Save className="w-4 h-4" />
                Save Security Settings
              </Button>
            </div>
          </TabsContent>

          {/* Payments & Escrow Tab */}
          <TabsContent value="payments" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Escrow Configuration</CardTitle>
                  <CardDescription>Configure escrow release rules and dispute handling.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Escrow Release Rules</Label>
                    <Select 
                      value={paymentSettings.escrowReleaseRules}
                      onValueChange={(value) => setPaymentSettings(prev => ({ ...prev, escrowReleaseRules: value }))}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="manual">Manual Admin Review</SelectItem>
                        <SelectItem value="auto">Auto-release after approval</SelectItem>
                        <SelectItem value="hybrid">Hybrid (auto + manual disputes)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Dispute Time Window</Label>
                    <Select 
                      value={paymentSettings.disputeTimeWindow}
                      onValueChange={(value) => setPaymentSettings(prev => ({ ...prev, disputeTimeWindow: value }))}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="24">24 hours</SelectItem>
                        <SelectItem value="48">48 hours</SelectItem>
                        <SelectItem value="72">72 hours</SelectItem>
                        <SelectItem value="168">7 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Payment Gateways</CardTitle>
                  <CardDescription>Enable or disable payment methods.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable USDT Payments</Label>
                      <p className="text-xs text-muted-foreground mt-1">Allow cryptocurrency payments via USDT.</p>
                    </div>
                    <Switch 
                      checked={paymentSettings.usdtEnabled}
                      onCheckedChange={(checked) => setPaymentSettings(prev => ({ ...prev, usdtEnabled: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Card Payments</Label>
                      <p className="text-xs text-muted-foreground mt-1">Accept credit/debit card payments.</p>
                    </div>
                    <Switch 
                      checked={paymentSettings.cardEnabled}
                      onCheckedChange={(checked) => setPaymentSettings(prev => ({ ...prev, cardEnabled: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Mobile Money</Label>
                      <p className="text-xs text-muted-foreground mt-1">Accept mobile money payments.</p>
                    </div>
                    <Switch 
                      checked={paymentSettings.mobileMoneyEnabled}
                      onCheckedChange={(checked) => setPaymentSettings(prev => ({ ...prev, mobileMoneyEnabled: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={() => handleSave("Payment")} className="gap-2">
                <Save className="w-4 h-4" />
                Save Payment Settings
              </Button>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Push Notifications (FCM)</CardTitle>
                  <CardDescription>Configure Firebase Cloud Messaging for push notifications.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>FCM Server Key</Label>
                    <div className="flex gap-2">
                      <Input 
                        type="password"
                        placeholder="••••••••"
                        value={notificationSettings.fcmServerKey}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, fcmServerKey: e.target.value }))}
                        className="bg-secondary border-border flex-1"
                      />
                      <Button variant="outline" onClick={testFcmConnection}>
                        Test FCM Connection
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Push Notifications</Label>
                      <p className="text-xs text-muted-foreground mt-1">Send push notifications to users.</p>
                    </div>
                    <Switch 
                      checked={notificationSettings.pushEnabled}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, pushEnabled: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Email & SMS</CardTitle>
                  <CardDescription>Configure email and SMS notification settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Support Email</Label>
                    <Input 
                      type="email"
                      placeholder="support@diaspoplug.com"
                      value={notificationSettings.supportEmail}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                      className="bg-secondary border-border"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>SMS Sender ID</Label>
                    <Input 
                      placeholder="DCGlobal"
                      value={notificationSettings.smsSenderId}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, smsSenderId: e.target.value }))}
                      className="bg-secondary border-border"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={() => handleSave("Notification")} className="gap-2">
                <Save className="w-4 h-4" />
                Save Notification Settings
              </Button>
            </div>
          </TabsContent>

          {/* Content & Moderation Tab */}
          <TabsContent value="content" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Post Policies</CardTitle>
                  <CardDescription>Configure content upload rules and limits.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Image Uploads</Label>
                      <p className="text-xs text-muted-foreground mt-1">Users can upload images to posts.</p>
                    </div>
                    <Switch 
                      checked={contentSettings.imageUploadsEnabled}
                      onCheckedChange={(checked) => setContentSettings(prev => ({ ...prev, imageUploadsEnabled: checked }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Max Image Size</Label>
                    <Select 
                      value={contentSettings.maxImageSize}
                      onValueChange={(value) => setContentSettings(prev => ({ ...prev, maxImageSize: value }))}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="2">2MB</SelectItem>
                        <SelectItem value="5">5MB</SelectItem>
                        <SelectItem value="10">10MB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Video Uploads</Label>
                      <p className="text-xs text-muted-foreground mt-1">Users can upload videos to posts.</p>
                    </div>
                    <Switch 
                      checked={contentSettings.videoUploadsEnabled}
                      onCheckedChange={(checked) => setContentSettings(prev => ({ ...prev, videoUploadsEnabled: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Flagged Content</CardTitle>
                  <CardDescription>Configure how flagged content is handled.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-hide Flagged Content</Label>
                      <p className="text-xs text-muted-foreground mt-1">Automatically hide content that has been flagged by users until reviewed.</p>
                    </div>
                    <Switch 
                      checked={contentSettings.autoHideFlagged}
                      onCheckedChange={(checked) => setContentSettings(prev => ({ ...prev, autoHideFlagged: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={() => handleSave("Content")} className="gap-2">
                <Save className="w-4 h-4" />
                Save Content Rules
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
