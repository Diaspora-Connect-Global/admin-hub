import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  RotateCcw,
  History,
  Plus,
  MoreHorizontal,
  CreditCard,
  Wallet,
  Shield,
  Globe,
  Plug,
  ToggleLeft,
  Settings,
  Eye,
  EyeOff,
  Trash2,
  Edit,
  Power,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Sample data
const paymentProviders = [
  { id: 1, name: "Stripe", status: "active", lastUpdated: "2024-01-10" },
  { id: 2, name: "Paystack", status: "active", lastUpdated: "2024-01-08" },
  { id: 3, name: "Flutterwave", status: "inactive", lastUpdated: "2023-12-15" },
];

const countryChapters = [
  { id: 1, name: "Nigeria", code: "NG", timezone: "Africa/Lagos", currency: "NGN", admins: 3, status: "active" },
  { id: 2, name: "Ghana", code: "GH", timezone: "Africa/Accra", currency: "GHS", admins: 2, status: "active" },
  { id: 3, name: "Kenya", code: "KE", timezone: "Africa/Nairobi", currency: "KES", admins: 4, status: "active" },
  { id: 4, name: "South Africa", code: "ZA", timezone: "Africa/Johannesburg", currency: "ZAR", admins: 2, status: "inactive" },
];

const integrations = [
  { id: 1, name: "Firebase FCM", category: "Push Notifications", status: "connected", lastSync: "2 mins ago" },
  { id: 2, name: "AWS S3", category: "Cloud Storage", status: "connected", lastSync: "5 mins ago" },
  { id: 3, name: "SendGrid", category: "Email Service", status: "connected", lastSync: "1 hour ago" },
  { id: 4, name: "Twilio", category: "SMS Provider", status: "disconnected", lastSync: "N/A" },
  { id: 5, name: "Smile Identity", category: "KYC Verification", status: "connected", lastSync: "10 mins ago" },
  { id: 6, name: "Mixpanel", category: "Analytics", status: "connected", lastSync: "Real-time" },
];

export default function SystemSettings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("payments");
  
  // Feature flags state
  const [featureFlags, setFeatureFlags] = useState({
    marketplace_enabled: true,
    groups_and_messaging: true,
    usdt_payments_enabled: false,
    embassy_services_enabled: true,
    ai_document_checker: true,
    ai_translation: false,
    beta_mode: false,
  });

  // Escrow settings state
  const [escrowSettings, setEscrowSettings] = useState({
    holding_period_days: "7",
    auto_hold_threshold: "5000",
    two_admin_threshold: "10000",
    partial_release: true,
    dispute_timeout: "72",
  });

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    twofa_required: true,
    session_timeout: "30",
    api_rate_limit: "1000",
  });

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your changes have been saved successfully.",
    });
  };

  const toggleFeature = (key: keyof typeof featureFlags) => {
    setFeatureFlags(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">System Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure global platform behavior and integrations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <History className="w-4 h-4" />
              Change History
            </Button>
            <Button variant="outline" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Discard
            </Button>
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSave}>
              <Save className="w-4 h-4" />
              Save All
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-secondary/50 border border-border flex-wrap h-auto p-1">
            <TabsTrigger value="payments" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <CreditCard className="w-4 h-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="escrow" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Wallet className="w-4 h-4" />
              Escrow
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ToggleLeft className="w-4 h-4" />
              Features
            </TabsTrigger>
            <TabsTrigger value="chapters" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Globe className="w-4 h-4" />
              Chapters
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Plug className="w-4 h-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Currency Settings */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Currency Settings</CardTitle>
                  <CardDescription>Configure default and supported currencies</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Default Currency</Label>
                    <Select defaultValue="usd">
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="usd">USD - US Dollar</SelectItem>
                        <SelectItem value="ngn">NGN - Nigerian Naira</SelectItem>
                        <SelectItem value="ghs">GHS - Ghanaian Cedi</SelectItem>
                        <SelectItem value="kes">KES - Kenyan Shilling</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Supported Currencies</Label>
                    <div className="flex flex-wrap gap-2">
                      {["USD", "NGN", "GHS", "KES", "ZAR", "USDT"].map((currency) => (
                        <Badge key={currency} variant="outline" className="bg-secondary/50">
                          {currency}
                        </Badge>
                      ))}
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                        <Plus className="w-3 h-3 mr-1" /> Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Wallet Limits */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Wallet Limits</CardTitle>
                  <CardDescription>Set minimum and maximum wallet balances</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Minimum Balance</Label>
                      <Input type="number" defaultValue="0" className="bg-secondary border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label>Maximum Balance</Label>
                      <Input type="number" defaultValue="100000" className="bg-secondary border-border" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <Label>Wallet Freeze Controls</Label>
                      <p className="text-xs text-muted-foreground">Enable manual wallet freeze capability</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Providers */}
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Payment Providers</CardTitle>
                  <CardDescription>Manage connected payment gateways</CardDescription>
                </div>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" /> Add Provider
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Provider</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground">Last Updated</TableHead>
                      <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentProviders.map((provider) => (
                      <TableRow key={provider.id} className="border-border hover:bg-secondary/50">
                        <TableCell className="font-medium">{provider.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(
                            "text-xs",
                            provider.status === "active" 
                              ? "bg-success/20 text-success border-success/30"
                              : "bg-muted text-muted-foreground border-border"
                          )}>
                            {provider.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{provider.lastUpdated}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border-border">
                              <DropdownMenuItem className="gap-2">
                                <Edit className="w-4 h-4" /> Update Credentials
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2">
                                <Power className="w-4 h-4" /> Toggle Status
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 text-destructive">
                                <Trash2 className="w-4 h-4" /> Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Escrow Tab */}
          <TabsContent value="escrow" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Holding Period</CardTitle>
                  <CardDescription>Configure default escrow holding times</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Default Holding Period (Days)</Label>
                    <Input 
                      type="number" 
                      value={escrowSettings.holding_period_days}
                      onChange={(e) => setEscrowSettings(prev => ({ ...prev, holding_period_days: e.target.value }))}
                      className="bg-secondary border-border" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dispute Timeout (Hours)</Label>
                    <Input 
                      type="number" 
                      value={escrowSettings.dispute_timeout}
                      onChange={(e) => setEscrowSettings(prev => ({ ...prev, dispute_timeout: e.target.value }))}
                      className="bg-secondary border-border" 
                    />
                    <p className="text-xs text-muted-foreground">Auto-escalate disputes after this time</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Thresholds & Approvals</CardTitle>
                  <CardDescription>Set auto-hold and approval thresholds</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Auto-Hold Threshold (USD)</Label>
                    <Input 
                      type="number" 
                      value={escrowSettings.auto_hold_threshold}
                      onChange={(e) => setEscrowSettings(prev => ({ ...prev, auto_hold_threshold: e.target.value }))}
                      className="bg-secondary border-border" 
                    />
                    <p className="text-xs text-muted-foreground">Transactions above this require manual review</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Two-Admin Approval Threshold (USD)</Label>
                    <Input 
                      type="number" 
                      value={escrowSettings.two_admin_threshold}
                      onChange={(e) => setEscrowSettings(prev => ({ ...prev, two_admin_threshold: e.target.value }))}
                      className="bg-secondary border-border" 
                    />
                    <p className="text-xs text-muted-foreground">Releases above this require two admin signatures</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Release Settings</CardTitle>
                  <CardDescription>Configure fund release behavior</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Partial Release Enabled</Label>
                      <p className="text-sm text-muted-foreground">Allow releasing funds in portions (e.g., for milestones)</p>
                    </div>
                    <Switch 
                      checked={escrowSettings.partial_release}
                      onCheckedChange={(checked) => setEscrowSettings(prev => ({ ...prev, partial_release: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Feature Toggles</CardTitle>
                <CardDescription>Enable or disable platform features globally</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[
                    { key: "marketplace_enabled", label: "Marketplace", description: "Enable the marketplace for buying and selling" },
                    { key: "groups_and_messaging", label: "Groups & Messaging", description: "Enable group creation and messaging features" },
                    { key: "usdt_payments_enabled", label: "USDT Payments", description: "Allow cryptocurrency payments via USDT" },
                    { key: "embassy_services_enabled", label: "Embassy Services", description: "Enable embassy and government services" },
                    { key: "ai_document_checker", label: "AI Document Checker", description: "Use AI to verify uploaded documents" },
                    { key: "ai_translation", label: "AI Translation", description: "Enable automatic translation of content" },
                    { key: "beta_mode", label: "Beta Mode", description: "Enable beta features for testing" },
                  ].map((feature) => (
                    <div key={feature.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Label className="text-base">{feature.label}</Label>
                          {feature.key === "beta_mode" && (
                            <Badge variant="outline" className="text-xs bg-warning/20 text-warning border-warning/30">Beta</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                          <Clock className="w-3 h-3" /> Schedule
                        </Button>
                        <Switch 
                          checked={featureFlags[feature.key as keyof typeof featureFlags]}
                          onCheckedChange={() => toggleFeature(feature.key as keyof typeof featureFlags)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chapters Tab */}
          <TabsContent value="chapters" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Country Chapters</CardTitle>
                  <CardDescription>Manage regional chapters and their settings</CardDescription>
                </div>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" /> Create Chapter
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Chapter</TableHead>
                      <TableHead className="text-muted-foreground">Code</TableHead>
                      <TableHead className="text-muted-foreground">Timezone</TableHead>
                      <TableHead className="text-muted-foreground">Currency</TableHead>
                      <TableHead className="text-muted-foreground">Admins</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {countryChapters.map((chapter) => (
                      <TableRow key={chapter.id} className="border-border hover:bg-secondary/50">
                        <TableCell className="font-medium">{chapter.name}</TableCell>
                        <TableCell className="font-mono">{chapter.code}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{chapter.timezone}</TableCell>
                        <TableCell>{chapter.currency}</TableCell>
                        <TableCell>{chapter.admins}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(
                            "text-xs",
                            chapter.status === "active" 
                              ? "bg-success/20 text-success border-success/30"
                              : "bg-muted text-muted-foreground border-border"
                          )}>
                            {chapter.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border-border">
                              <DropdownMenuItem className="gap-2">
                                <Edit className="w-4 h-4" /> Edit Chapter
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2">
                                <Power className="w-4 h-4" /> {chapter.status === "active" ? "Deactivate" : "Activate"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {integrations.map((integration) => (
                <Card key={integration.id} className="bg-card border-border">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-medium">{integration.name}</h3>
                        <p className="text-sm text-muted-foreground">{integration.category}</p>
                      </div>
                      <Badge variant="outline" className={cn(
                        "text-xs",
                        integration.status === "connected"
                          ? "bg-success/20 text-success border-success/30"
                          : "bg-destructive/20 text-destructive border-destructive/30"
                      )}>
                        {integration.status}
                      </Badge>
                    </div>
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Last sync: {integration.lastSync}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 px-2">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border-border">
                            <DropdownMenuItem className="gap-2">
                              <Edit className="w-4 h-4" /> Update Credentials
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Eye className="w-4 h-4" /> View Logs
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Power className="w-4 h-4" /> {integration.status === "connected" ? "Disconnect" : "Connect"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Authentication</CardTitle>
                  <CardDescription>Configure admin authentication requirements</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>2FA Required for Admins</Label>
                      <p className="text-sm text-muted-foreground">Enforce two-factor authentication</p>
                    </div>
                    <Switch 
                      checked={securitySettings.twofa_required}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, twofa_required: checked }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Session Timeout (Minutes)</Label>
                    <Input 
                      type="number" 
                      value={securitySettings.session_timeout}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, session_timeout: e.target.value }))}
                      className="bg-secondary border-border" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password Policy</Label>
                    <Select defaultValue="strong">
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="basic">Basic (8+ chars)</SelectItem>
                        <SelectItem value="medium">Medium (8+ chars, mixed case)</SelectItem>
                        <SelectItem value="strong">Strong (12+ chars, mixed case, symbols)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">API & Rate Limits</CardTitle>
                  <CardDescription>Control API access and throttling</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>API Rate Limit (Requests/Hour)</Label>
                    <Input 
                      type="number" 
                      value={securitySettings.api_rate_limit}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, api_rate_limit: e.target.value }))}
                      className="bg-secondary border-border" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Allowed IP Addresses</Label>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="bg-secondary/50">All IPs</Badge>
                    </div>
                    <Button variant="outline" size="sm" className="mt-2 gap-1">
                      <Plus className="w-3 h-3" /> Add IP Restriction
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Admin Activity Alerts</CardTitle>
                  <CardDescription>Configure notifications for sensitive admin actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: "Large fund releases", enabled: true },
                      { label: "User suspensions", enabled: true },
                      { label: "Role changes", enabled: true },
                      { label: "Settings modifications", enabled: false },
                      { label: "Failed login attempts", enabled: true },
                      { label: "New admin creation", enabled: true },
                    ].map((alert) => (
                      <div key={alert.label} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                        <span className="text-sm">{alert.label}</span>
                        <Switch defaultChecked={alert.enabled} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
