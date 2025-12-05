import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Shield,
  Users,
  Save,
  X,
  Search,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Sample roles data
const rolesData = [
  { id: 1, name: "System Admin", description: "Full platform access with all permissions", assignedUsers: 3, createdAt: "2023-01-01", isSystem: true },
  { id: 2, name: "Community Admin", description: "Manage communities and their members", assignedUsers: 24, createdAt: "2023-01-15", isSystem: true },
  { id: 3, name: "Association Admin", description: "Manage association accounts and settings", assignedUsers: 12, createdAt: "2023-02-01", isSystem: true },
  { id: 4, name: "Vendor Admin", description: "Manage vendor stores and products", assignedUsers: 45, createdAt: "2023-02-15", isSystem: true },
  { id: 5, name: "Support Agent", description: "Handle support tickets and user queries", assignedUsers: 8, createdAt: "2023-03-01", isSystem: false },
  { id: 6, name: "Finance Admin", description: "View financial reports and process payouts", assignedUsers: 4, createdAt: "2023-04-01", isSystem: false },
];

const resources = [
  { id: "users", label: "Users" },
  { id: "escrow", label: "Escrow" },
  { id: "disputes", label: "Disputes" },
  { id: "communities", label: "Communities" },
  { id: "associations", label: "Associations" },
  { id: "vendors", label: "Vendors" },
  { id: "marketplace", label: "Marketplace" },
  { id: "groups_messaging", label: "Groups & Messaging" },
  { id: "events", label: "Events" },
  { id: "reports", label: "Reports" },
  { id: "settings", label: "Settings" },
  { id: "audit_logs", label: "Audit Logs" },
];

const actions = ["view", "create", "edit", "delete", "approve", "export"];

// Sample permissions for System Admin (all enabled)
const systemAdminPermissions: Record<string, Record<string, boolean>> = {};
resources.forEach(r => {
  systemAdminPermissions[r.id] = {};
  actions.forEach(a => {
    systemAdminPermissions[r.id][a] = true;
  });
});

// Sample permissions for Community Admin
const communityAdminPermissions: Record<string, Record<string, boolean>> = {
  users: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
  escrow: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
  disputes: { view: true, create: true, edit: true, delete: false, approve: false, export: false },
  communities: { view: true, create: false, edit: true, delete: false, approve: false, export: true },
  associations: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
  vendors: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
  marketplace: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
  groups_messaging: { view: true, create: true, edit: true, delete: true, approve: false, export: false },
  events: { view: true, create: true, edit: true, delete: true, approve: false, export: true },
  reports: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
  settings: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
  audit_logs: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
};

const rolePermissionsMap: Record<string, Record<string, Record<string, boolean>>> = {
  "System Admin": systemAdminPermissions,
  "Community Admin": communityAdminPermissions,
};

export default function RolesPermissions() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("roles");
  const [selectedRole, setSelectedRole] = useState<typeof rolesData[0] | null>(null);
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>(systemAdminPermissions);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  const selectRole = (role: typeof rolesData[0]) => {
    setSelectedRole(role);
    setPermissions(rolePermissionsMap[role.name] || communityAdminPermissions);
    setActiveTab("permissions");
  };

  const togglePermission = (resource: string, action: string) => {
    setPermissions(prev => ({
      ...prev,
      [resource]: {
        ...prev[resource],
        [action]: !prev[resource]?.[action]
      }
    }));
  };

  const toggleAllForResource = (resource: string) => {
    const allEnabled = actions.every(a => permissions[resource]?.[a]);
    setPermissions(prev => ({
      ...prev,
      [resource]: actions.reduce((acc, a) => ({ ...acc, [a]: !allEnabled }), {})
    }));
  };

  const toggleAllForAction = (action: string) => {
    const allEnabled = resources.every(r => permissions[r.id]?.[action]);
    setPermissions(prev => {
      const newPerms = { ...prev };
      resources.forEach(r => {
        newPerms[r.id] = { ...newPerms[r.id], [action]: !allEnabled };
      });
      return newPerms;
    });
  };

  const handleSave = () => {
    toast({
      title: "Permissions saved",
      description: `Updated permissions for ${selectedRole?.name}`,
    });
  };

  const filteredResources = resources.filter(r => 
    r.label.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{t('roles.title')}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Define and manage access control for all admin types
            </p>
          </div>
          <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4" />
            Create Role
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-secondary/50 border border-border">
            <TabsTrigger value="roles" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Shield className="w-4 h-4" />
              Roles Overview
            </TabsTrigger>
            <TabsTrigger value="permissions" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" disabled={!selectedRole}>
              <Users className="w-4 h-4" />
              Permissions Matrix
              {selectedRole && (
                <Badge variant="secondary" className="ml-2 bg-primary/20 text-primary">
                  {selectedRole.name}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-4">
            <div className="table-container">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Role Name</TableHead>
                    <TableHead className="text-muted-foreground">Description</TableHead>
                    <TableHead className="text-muted-foreground">Assigned Users</TableHead>
                    <TableHead className="text-muted-foreground">Created</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rolesData.map((role) => (
                    <TableRow 
                      key={role.id} 
                      className="border-border hover:bg-secondary/50 cursor-pointer"
                      onClick={() => selectRole(role)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{role.name}</span>
                          {role.isSystem && (
                            <Badge variant="outline" className="text-xs bg-info/20 text-info border-info/30">
                              System
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{role.description}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-secondary">
                          {role.assignedUsers} users
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{role.createdAt}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border-border">
                            <DropdownMenuItem className="gap-2" onClick={() => { setSelectedRole(role); setEditDialogOpen(true); }}>
                              <Edit className="w-4 h-4" /> Edit Role
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Copy className="w-4 h-4" /> Duplicate
                            </DropdownMenuItem>
                            {!role.isSystem && (
                              <DropdownMenuItem 
                                className="gap-2 text-destructive"
                                onClick={() => { setSelectedRole(role); setDeleteDialogOpen(true); }}
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Rules Notice */}
            <div className="glass rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Important Rules</p>
                <ul className="text-muted-foreground mt-1 space-y-1">
                  <li>• At least one System Admin must exist at all times</li>
                  <li>• Audit Logs permissions require Super Admin approval</li>
                  <li>• All role changes are logged for compliance</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-4">
            {selectedRole && (
              <>
                {/* Toolbar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative max-w-xs">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Filter resources..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="pl-10 bg-secondary border-border"
                      />
                    </div>
                    <Badge variant="outline" className="bg-secondary/50">
                      Editing: {selectedRole.name}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2" onClick={() => setActiveTab("roles")}>
                      <X className="w-4 h-4" />
                      Discard
                    </Button>
                    <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSave}>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </Button>
                  </div>
                </div>

                {/* Permissions Matrix */}
                <div className="table-container overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground min-w-[180px] sticky left-0 bg-card">Resource</TableHead>
                        {actions.map((action) => (
                          <TableHead key={action} className="text-center text-muted-foreground capitalize min-w-[100px]">
                            <div className="flex flex-col items-center gap-1">
                              <span>{action}</span>
                              <Checkbox
                                checked={resources.every(r => permissions[r.id]?.[action])}
                                onCheckedChange={() => toggleAllForAction(action)}
                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                            </div>
                          </TableHead>
                        ))}
                        <TableHead className="text-center text-muted-foreground min-w-[80px]">All</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResources.map((resource) => {
                        const allEnabled = actions.every(a => permissions[resource.id]?.[a]);
                        const isRestricted = resource.id === "settings" || resource.id === "audit_logs";
                        
                        return (
                          <TableRow key={resource.id} className="border-border hover:bg-secondary/50">
                            <TableCell className="font-medium sticky left-0 bg-card">
                              <div className="flex items-center gap-2">
                                {resource.label}
                                {isRestricted && (
                                  <Badge variant="outline" className="text-xs bg-warning/20 text-warning border-warning/30">
                                    Restricted
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            {actions.map((action) => (
                              <TableCell key={action} className="text-center">
                                <Checkbox
                                  checked={permissions[resource.id]?.[action] || false}
                                  onCheckedChange={() => togglePermission(resource.id, action)}
                                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                              </TableCell>
                            ))}
                            <TableCell className="text-center">
                              <Checkbox
                                checked={allEnabled}
                                onCheckedChange={() => toggleAllForResource(resource.id)}
                                className="data-[state=checked]:bg-success data-[state=checked]:border-success"
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Checkbox checked className="data-[state=checked]:bg-primary data-[state=checked]:border-primary h-4 w-4" disabled />
                    <span>Permission granted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox className="h-4 w-4" disabled />
                    <span>Permission denied</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs bg-warning/20 text-warning border-warning/30">Restricted</Badge>
                    <span>Requires Super Admin</span>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Role Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Edit Role</DialogTitle>
              <DialogDescription>Update role name and description</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Role Name</Label>
                <Input defaultValue={selectedRole?.name} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input defaultValue={selectedRole?.description} className="bg-secondary border-border" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => { setEditDialogOpen(false); toast({ title: "Role updated" }); }}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Role Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Delete Role</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedRole?.name}"? This action cannot be undone.
                {selectedRole && selectedRole.assignedUsers > 0 && (
                  <span className="block mt-2 text-warning">
                    Warning: {selectedRole.assignedUsers} users are assigned to this role.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={() => { setDeleteDialogOpen(false); toast({ title: "Role deleted", variant: "destructive" }); }}>
                Delete Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
