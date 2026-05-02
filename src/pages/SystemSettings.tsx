import { useState, useEffect } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Plus,
  Trash2,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import {
  useListCommunityTypes,
  useDeleteCommunityType,
  useListAssociationTypes,
  useDeleteAssociationType,
} from "@/hooks/admin/useEntityTypes";
import {
  useGetPlatformSettings,
  useSetPlatformSetting,
} from "@/hooks/admin";
import { CreateCommunityTypeModal } from "@/components/admin/CreateCommunityTypeModal";
import { CreateAssociationTypeModal } from "@/components/admin/CreateAssociationTypeModal";
import type { CommunityType, AssociationType } from "@/services/networks/graphql/admin";

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
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();

  // Entity Types state
  const [createCommTypeOpen, setCreateCommTypeOpen] = useState(false);
  const [createAssocTypeOpen, setCreateAssocTypeOpen] = useState(false);
  const {
    data: commTypesData,
    loading: commTypesLoading,
    refetch: refetchCommTypes,
  } = useListCommunityTypes();
  const {
    data: assocTypesData,
    loading: assocTypesLoading,
    refetch: refetchAssocTypes,
  } = useListAssociationTypes();
  const [deleteCommTypeMutation] = useDeleteCommunityType();
  const [deleteAssocTypeMutation] = useDeleteAssociationType();

  const communityTypes = commTypesData?.listCommunityTypes ?? [];
  const associationTypes = assocTypesData?.listAssociationTypes ?? [];

  // Platform settings from GraphQL
  const {
    data: platformSettingsData,
    loading: platformSettingsLoading,
  } = useGetPlatformSettings();
  const [setPlatformSetting, { loading: savingPlatformSetting }] = useSetPlatformSetting();

  const platformSettings = platformSettingsData?.getPlatformSettings ?? [];

  const getSetting = (key: string): string =>
    platformSettings.find((s) => s.key === key)?.value ?? "";

  // Security platform settings local state (initialised from live data once loaded)
  const [securityPlatformSettings, setSecurityPlatformSettings] = useState<{
    max_login_attempts: string;
    session_timeout_hours: string;
  }>({ max_login_attempts: "", session_timeout_hours: "" });

  // Payment platform settings local state
  const [paymentPlatformSettings, setPaymentPlatformSettings] = useState<{
    default_commission_rate: string;
    min_payout_amount: string;
    kyc_required_for_payout: string;
  }>({ default_commission_rate: "", min_payout_amount: "", kyc_required_for_payout: "" });

  // System platform settings local state
  const [systemPlatformSettings, setSystemPlatformSettings] = useState<{
    maintenance_mode: string;
    max_upload_size_mb: string;
  }>({ maintenance_mode: "", max_upload_size_mb: "" });

  // Seed local state once platform settings are fetched
  useEffect(() => {
    if (platformSettings.length === 0) return;
    setSecurityPlatformSettings({
      max_login_attempts: getSetting("max_login_attempts") || "5",
      session_timeout_hours: getSetting("session_timeout_hours") || "24",
    });
    setPaymentPlatformSettings({
      default_commission_rate: getSetting("default_commission_rate") || "10",
      min_payout_amount: getSetting("min_payout_amount") || "10",
      kyc_required_for_payout: getSetting("kyc_required_for_payout") || "false",
    });
    setSystemPlatformSettings({
      maintenance_mode: getSetting("maintenance_mode") || "false",
      max_upload_size_mb: getSetting("max_upload_size_mb") || "50",
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platformSettingsData]);

  const savePlatformSetting = async (key: string, value: string) => {
    try {
      await setPlatformSetting({ variables: { input: { key, value } } });
      toast({ title: "Saved", description: `"${key}" updated successfully.` });
    } catch (err) {
      toast({
        title: "Error",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleSavePlatformSettings = async (
    keys: string[],
    values: Record<string, string>,
    section: string,
  ) => {
    try {
      await Promise.all(
        keys.map((key) => setPlatformSetting({ variables: { input: { key, value: values[key] } } })),
      );
      toast({ title: "Settings saved", description: `${section} platform settings saved.` });
    } catch (err) {
      toast({
        title: "Error",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  };

  // General settings state
  const [generalSettings, setGeneralSettings] = useState({
    platformName: "DiaspoPlug",
    defaultCountry: "Nigeria",
    timezone: "Africa/Lagos",
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

  const handleDeleteCommunityType = async (id: string) => {
    try {
      const result = await deleteCommTypeMutation({ variables: { id } });
      if (result.data?.deleteCommunityType?.success) {
        toast({
          title: "Community Type Deleted",
          description: "The community type has been removed.",
        });
        await refetchCommTypes();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteAssociationType = async (id: string) => {
    try {
      const result = await deleteAssocTypeMutation({ variables: { id } });
      if (result.data?.deleteAssociationType?.success) {
        toast({
          title: "Association Type Deleted",
          description: "The association type has been removed.",
        });
        await refetchAssocTypes();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t('settings.title')}</h1>
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
            <TabsTrigger value="entity-types" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Globe className="w-4 h-4" />
              Entity Types
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
            {/* Live system platform settings */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  System Platform Settings
                  {platformSettingsLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                </CardTitle>
                <CardDescription>Live system-level settings stored in the platform backend.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Maintenance Mode</Label>
                    <div className="flex items-center justify-between rounded-md border border-border bg-secondary px-3 h-10">
                      <span className="text-sm text-muted-foreground">
                        {systemPlatformSettings.maintenance_mode === "true"
                          ? "Platform is in maintenance mode"
                          : "Platform is live"}
                      </span>
                      <Switch
                        checked={systemPlatformSettings.maintenance_mode === "true"}
                        onCheckedChange={(checked) => {
                          const value = checked ? "true" : "false";
                          setSystemPlatformSettings((prev) => ({ ...prev, maintenance_mode: value }));
                          savePlatformSetting("maintenance_mode", value);
                        }}
                        disabled={platformSettingsLoading || savingPlatformSetting}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">When enabled, the platform shows a maintenance page to users.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_upload_size_mb">Max Upload Size (MB)</Label>
                    <Input
                      id="max_upload_size_mb"
                      type="number"
                      min={1}
                      placeholder="50"
                      value={systemPlatformSettings.max_upload_size_mb}
                      onChange={(e) =>
                        setSystemPlatformSettings((prev) => ({ ...prev, max_upload_size_mb: e.target.value }))
                      }
                      onBlur={() =>
                        savePlatformSetting("max_upload_size_mb", systemPlatformSettings.max_upload_size_mb)
                      }
                      className="bg-secondary border-border"
                      disabled={platformSettingsLoading}
                    />
                    <p className="text-xs text-muted-foreground">Maximum file size users can upload. Saves on blur.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                      {t('settings.language')}
                    </Label>
                    <Select
                      value={i18n.language}
                      onValueChange={(value) => i18n.changeLanguage(value)}
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
                      {t('settings.themeMode')}
                    </Label>
                    <Select 
                      value={theme}
                      onValueChange={(value) => setTheme(value)}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="light">{t('settings.lightMode')}</SelectItem>
                        <SelectItem value="dark">{t('settings.darkMode')}</SelectItem>
                        <SelectItem value="system">{t('settings.systemDefault')}</SelectItem>
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
            {/* Live platform security settings */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Platform Security Settings
                  {platformSettingsLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                </CardTitle>
                <CardDescription>Live settings stored in the platform backend.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="max_login_attempts">Max Login Attempts</Label>
                    <Input
                      id="max_login_attempts"
                      type="number"
                      min={1}
                      placeholder="5"
                      value={securityPlatformSettings.max_login_attempts}
                      onChange={(e) =>
                        setSecurityPlatformSettings((prev) => ({ ...prev, max_login_attempts: e.target.value }))
                      }
                      className="bg-secondary border-border"
                      disabled={platformSettingsLoading}
                    />
                    <p className="text-xs text-muted-foreground">Number of failed login attempts before account lockout.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="session_timeout_hours">Session Timeout (hours)</Label>
                    <Input
                      id="session_timeout_hours"
                      type="number"
                      min={1}
                      placeholder="24"
                      value={securityPlatformSettings.session_timeout_hours}
                      onChange={(e) =>
                        setSecurityPlatformSettings((prev) => ({ ...prev, session_timeout_hours: e.target.value }))
                      }
                      className="bg-secondary border-border"
                      disabled={platformSettingsLoading}
                    />
                    <p className="text-xs text-muted-foreground">Admin session lifetime in hours.</p>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                  <Button
                    onClick={() =>
                      handleSavePlatformSettings(
                        ["max_login_attempts", "session_timeout_hours"],
                        securityPlatformSettings,
                        "Security",
                      )
                    }
                    disabled={platformSettingsLoading || savingPlatformSetting}
                    className="gap-2"
                  >
                    {savingPlatformSetting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Platform Security
                  </Button>
                </div>
              </CardContent>
            </Card>

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
            {/* Live platform payment settings */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Platform Payment Settings
                  {platformSettingsLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                </CardTitle>
                <CardDescription>Live settings stored in the platform backend.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="default_commission_rate">Default Commission Rate (%)</Label>
                    <Input
                      id="default_commission_rate"
                      type="number"
                      min={0}
                      max={100}
                      placeholder="10"
                      value={paymentPlatformSettings.default_commission_rate}
                      onChange={(e) =>
                        setPaymentPlatformSettings((prev) => ({ ...prev, default_commission_rate: e.target.value }))
                      }
                      className="bg-secondary border-border"
                      disabled={platformSettingsLoading}
                    />
                    <p className="text-xs text-muted-foreground">Platform commission taken from each transaction (0–100).</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min_payout_amount">Minimum Payout Amount (USD)</Label>
                    <Input
                      id="min_payout_amount"
                      type="number"
                      min={0}
                      placeholder="10"
                      value={paymentPlatformSettings.min_payout_amount}
                      onChange={(e) =>
                        setPaymentPlatformSettings((prev) => ({ ...prev, min_payout_amount: e.target.value }))
                      }
                      className="bg-secondary border-border"
                      disabled={platformSettingsLoading}
                    />
                    <p className="text-xs text-muted-foreground">Minimum balance required before a vendor can request a payout.</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Require KYC Before Payout</Label>
                    <div className="flex items-center justify-between rounded-md border border-border bg-secondary px-3 h-10">
                      <span className="text-sm text-muted-foreground">
                        {paymentPlatformSettings.kyc_required_for_payout === "true" ? "Enabled" : "Disabled"}
                      </span>
                      <Switch
                        checked={paymentPlatformSettings.kyc_required_for_payout === "true"}
                        onCheckedChange={(checked) =>
                          setPaymentPlatformSettings((prev) => ({
                            ...prev,
                            kyc_required_for_payout: checked ? "true" : "false",
                          }))
                        }
                        disabled={platformSettingsLoading}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Vendors must complete KYC before their first payout.</p>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                  <Button
                    onClick={() =>
                      handleSavePlatformSettings(
                        ["default_commission_rate", "min_payout_amount", "kyc_required_for_payout"],
                        paymentPlatformSettings,
                        "Payment",
                      )
                    }
                    disabled={platformSettingsLoading || savingPlatformSetting}
                    className="gap-2"
                  >
                    {savingPlatformSetting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Platform Payments
                  </Button>
                </div>
              </CardContent>
            </Card>

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

          {/* Entity Types Tab */}
          <TabsContent value="entity-types" className="space-y-6">
            {/* Community Types Section */}
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Community Types</CardTitle>
                    <CardDescription>
                      Predefined categories admins use when creating communities
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setCreateCommTypeOpen(true)}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Type
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {commTypesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : communityTypes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No community types yet. Create one to get started.
                  </p>
                ) : (
                  <div className="table-container">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border">
                          <TableHead>Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Embassy</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {communityTypes.map((type: CommunityType) => (
                          <TableRow key={type.id} className="border-border">
                            <TableCell className="font-medium">{type.name}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {type.description || "—"}
                            </TableCell>
                            <TableCell>
                              {type.isEmbassy ? "Yes" : "No"}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="bg-popover border-border"
                                >
                                  <DropdownMenuItem
                                    className="gap-2 text-destructive"
                                    onClick={() =>
                                      handleDeleteCommunityType(type.id)
                                    }
                                  >
                                    <Trash2 className="w-4 h-4" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Association Types Section */}
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Association Types</CardTitle>
                    <CardDescription>
                      Predefined categories admins use when creating associations
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setCreateAssocTypeOpen(true)}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Type
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {assocTypesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : associationTypes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No association types yet. Create one to get started.
                  </p>
                ) : (
                  <div className="table-container">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border">
                          <TableHead>Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {associationTypes.map((type: AssociationType) => (
                          <TableRow key={type.id} className="border-border">
                            <TableCell className="font-medium">{type.name}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {type.description || "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="bg-popover border-border"
                                >
                                  <DropdownMenuItem
                                    className="gap-2 text-destructive"
                                    onClick={() =>
                                      handleDeleteAssociationType(type.id)
                                    }
                                  >
                                    <Trash2 className="w-4 h-4" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <CreateCommunityTypeModal
          isOpen={createCommTypeOpen}
          onClose={() => setCreateCommTypeOpen(false)}
          onSuccess={() => {
            refetchCommTypes();
          }}
        />

        <CreateAssociationTypeModal
          isOpen={createAssocTypeOpen}
          onClose={() => setCreateAssocTypeOpen(false)}
          onSuccess={() => {
            refetchAssocTypes();
          }}
        />
      </div>
    </AdminLayout>
  );
}
