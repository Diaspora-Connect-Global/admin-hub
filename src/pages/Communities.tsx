import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Archive,
  Check,
  X,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

// Sample data matching the spec columns
const communitiesData = [
  {
    id: "COM-001",
    name: "Ghana Belgium Community",
    countries: ["Ghana", "Belgium"],
    associationCount: 12,
    userCount: 1245,
    postCount: 342,
    vendorEnabled: true,
    status: "active",
    createdAt: "2024-01-15",
  },
  {
    id: "COM-002",
    name: "Nigeria UK Diaspora",
    countries: ["Nigeria", "United Kingdom"],
    associationCount: 8,
    userCount: 2103,
    postCount: 567,
    vendorEnabled: true,
    status: "active",
    createdAt: "2023-11-20",
  },
  {
    id: "COM-003",
    name: "Kenya Germany Network",
    countries: ["Kenya", "Germany"],
    associationCount: 5,
    userCount: 432,
    postCount: 89,
    vendorEnabled: false,
    status: "inactive",
    createdAt: "2024-02-01",
  },
  {
    id: "COM-004",
    name: "South Africa Netherlands",
    countries: ["South Africa", "Netherlands"],
    associationCount: 15,
    userCount: 1876,
    postCount: 421,
    vendorEnabled: true,
    status: "active",
    createdAt: "2023-09-10",
  },
  {
    id: "COM-005",
    name: "Uganda France Community",
    countries: ["Uganda", "France"],
    associationCount: 3,
    userCount: 287,
    postCount: 45,
    vendorEnabled: false,
    status: "archived",
    createdAt: "2023-06-15",
  },
];

const countryOptions = [
  "Ghana",
  "Nigeria",
  "Kenya",
  "South Africa",
  "Uganda",
  "Tanzania",
  "Belgium",
  "United Kingdom",
  "Germany",
  "Netherlands",
  "France",
  "USA",
];

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    active: "bg-success/20 text-success border-success/30",
    inactive: "bg-warning/20 text-warning border-warning/30",
    archived: "bg-muted text-muted-foreground border-border",
  };
  return styles[status] || styles.active;
};

export default function Communities() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<any>(null);

  // Create form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    countries: [] as string[],
    enablePosting: true,
    enableVendorMode: false,
  });

  // Filter communities
  const filteredCommunities = communitiesData.filter((community) => {
    const matchesSearch =
      community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      community.countries.some((c) =>
        c.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesCountry =
      countryFilter === "all" ||
      community.countries.includes(countryFilter);
    const matchesStatus =
      statusFilter === "all" || community.status === statusFilter;
    return matchesSearch && matchesCountry && matchesStatus;
  });

  const handleCreateCommunity = () => {
    if (!formData.name || formData.countries.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Community created successfully!",
      description: `${formData.name} has been created.`,
    });
    setCreateModalOpen(false);
    setFormData({
      name: "",
      description: "",
      countries: [],
      enablePosting: true,
      enableVendorMode: false,
    });
  };

  const handleArchive = () => {
    if (selectedCommunity) {
      toast({
        title: "Community archived",
        description: `${selectedCommunity.name} has been archived.`,
      });
    }
    setArchiveDialogOpen(false);
    setSelectedCommunity(null);
  };

  const openArchiveDialog = (community: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCommunity(community);
    setArchiveDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Communities</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage global diaspora communities across countries.
            </p>
          </div>
          <Button
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Create Community
          </Button>
        </div>

        {/* Top Actions Bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, country, or association..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-[180px] bg-secondary border-border">
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All Countries</SelectItem>
              {countryOptions.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-secondary border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Communities Table */}
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Community Name</TableHead>
                <TableHead className="text-muted-foreground">Country(ies)</TableHead>
                <TableHead className="text-muted-foreground">Associations (#)</TableHead>
                <TableHead className="text-muted-foreground">Users (#)</TableHead>
                <TableHead className="text-muted-foreground">Posts (#)</TableHead>
                <TableHead className="text-muted-foreground">Vendor Mode</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Created At</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCommunities.map((community) => (
                <TableRow
                  key={community.id}
                  className="border-border hover:bg-secondary/50"
                >
                  <TableCell className="font-medium">{community.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {community.countries.map((country) => (
                        <Badge
                          key={country}
                          variant="outline"
                          className="text-xs bg-secondary"
                        >
                          {country}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{community.associationCount}</TableCell>
                  <TableCell>{community.userCount.toLocaleString()}</TableCell>
                  <TableCell>{community.postCount}</TableCell>
                  <TableCell>
                    {community.vendorEnabled ? (
                      <Badge className="bg-success/20 text-success border-success/30 gap-1">
                        <Store className="w-3 h-3" />
                        Enabled
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground gap-1">
                        <X className="w-3 h-3" />
                        Disabled
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("text-xs capitalize", getStatusBadge(community.status))}
                    >
                      {community.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {community.createdAt}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border">
                        <DropdownMenuItem
                          className="gap-2"
                          onClick={() => navigate(`/communities/${community.id}`)}
                        >
                          <Eye className="w-4 h-4" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Edit className="w-4 h-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-destructive"
                          onClick={(e) => openArchiveDialog(community, e)}
                        >
                          <Archive className="w-4 h-4" /> Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Create Community Modal */}
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogContent className="sm:max-w-[500px] bg-card border-border">
            <DialogHeader>
              <DialogTitle>Create Community</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Community Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. Ghana Belgium Community"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Short description of the community"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Linked Countries <span className="text-destructive">*</span>
                </Label>
                <Select
                  onValueChange={(value) => {
                    if (!formData.countries.includes(value)) {
                      setFormData({
                        ...formData,
                        countries: [...formData.countries, value],
                      });
                    }
                  }}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select one or more countries" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {countryOptions.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.countries.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.countries.map((country) => (
                      <Badge
                        key={country}
                        variant="secondary"
                        className="gap-1 cursor-pointer"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            countries: formData.countries.filter(
                              (c) => c !== country
                            ),
                          })
                        }
                      >
                        {country}
                        <X className="w-3 h-3" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Posting</Label>
                  <p className="text-xs text-muted-foreground">
                    Determines whether community can post.
                  </p>
                </div>
                <Switch
                  checked={formData.enablePosting}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, enablePosting: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Vendor Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Allows community to sell products & services.
                  </p>
                </div>
                <Switch
                  checked={formData.enableVendorMode}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, enableVendorMode: checked })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateCommunity}>Create Community</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Archive Confirmation Dialog */}
        <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>Archive Community</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to archive{" "}
                <span className="font-semibold text-foreground">
                  {selectedCommunity?.name}
                </span>
                ? This action can be reversed later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleArchive}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Archive
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
