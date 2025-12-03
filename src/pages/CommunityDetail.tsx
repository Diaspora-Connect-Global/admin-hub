import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  ArrowLeft,
  Edit,
  Users,
  FileText,
  Store,
  Link2,
  Unlink,
  Eye,
  Check,
  X,
  Trash2,
  User,
  Ban,
  MoreHorizontal,
  Archive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

// Sample community data
const communityData = {
  id: "COM-001",
  name: "Ghana Belgium Community",
  countries: ["Ghana", "Belgium"],
  description: "A vibrant community connecting Ghanaians living in Belgium with their homeland.",
  userCount: 1245,
  postCount: 342,
  vendorEnabled: true,
  postingEnabled: true,
  createdAt: "2024-01-15",
};

const associationsData = [
  { id: "ASC-001", name: "Accra Alumni Belgium", country: "Belgium", membersCount: 156, postsCount: 45, vendorMode: true, status: "active" },
  { id: "ASC-002", name: "Kumasi Cultural Group", country: "Belgium", membersCount: 89, postsCount: 23, vendorMode: false, status: "active" },
  { id: "ASC-003", name: "Ghana Traders Network", country: "Ghana", membersCount: 234, postsCount: 67, vendorMode: true, status: "active" },
];

const postsData = [
  { id: "PST-001", title: "Community Event Announcement", author: "John Doe", date: "2024-01-20", status: "pending" },
  { id: "PST-002", title: "New Member Introduction", author: "Jane Smith", date: "2024-01-19", status: "approved" },
  { id: "PST-003", title: "Cultural Festival Photos", author: "Mike Brown", date: "2024-01-18", status: "pending" },
];

const opportunitiesData = [
  { id: "OPP-001", title: "Business Partnership", type: "Business", postedBy: "ABC Corp", date: "2024-01-15", status: "pending" },
  { id: "OPP-002", title: "Job Opening - Marketing", type: "Job", postedBy: "XYZ Ltd", date: "2024-01-14", status: "approved" },
];

const vendorProductsData = [
  { id: "PRD-001", name: "African Art Print", vendor: "Artisan Ghana", price: "$45", category: "Art", status: "pending" },
  { id: "PRD-002", name: "Kente Cloth", vendor: "Textile Masters", price: "$120", category: "Fashion", status: "approved" },
];

const membersData = [
  { id: "USR-001", name: "John Doe", email: "john@example.com", joinedAt: "2024-01-10", role: "member" },
  { id: "USR-002", name: "Jane Smith", email: "jane@example.com", joinedAt: "2024-01-08", role: "admin" },
  { id: "USR-003", name: "Mike Brown", email: "mike@example.com", joinedAt: "2024-01-05", role: "member" },
];

const countryOptions = ["Ghana", "Nigeria", "Kenya", "South Africa", "Uganda", "Belgium", "United Kingdom", "Germany"];

export default function CommunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [postingEnabled, setPostingEnabled] = useState(communityData.postingEnabled);
  const [vendorEnabled, setVendorEnabled] = useState(communityData.vendorEnabled);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

  const handleTogglePosting = (checked: boolean) => {
    setPostingEnabled(checked);
    toast({
      title: checked ? "Posting enabled" : "Posting disabled",
      description: `Posting has been ${checked ? "enabled" : "disabled"} for this community.`,
    });
  };

  const handleToggleVendor = (checked: boolean) => {
    setVendorEnabled(checked);
    toast({
      title: checked ? "Vendor mode enabled" : "Vendor mode disabled",
      description: `Vendor mode has been ${checked ? "enabled" : "disabled"} for this community.`,
    });
  };

  const handleArchive = () => {
    toast({
      title: "Community archived",
      description: `${communityData.name} has been archived.`,
    });
    setArchiveDialogOpen(false);
    navigate("/communities");
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">System Admin</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/communities">Communities</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{communityData.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/communities")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">{communityData.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                {communityData.countries.map((country) => (
                  <Badge key={country} variant="outline" className="text-xs">
                    {country}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <Edit className="w-4 h-4" />
              Edit Community
            </Button>
            <Button
              variant={postingEnabled ? "destructive" : "default"}
              className="gap-2"
              onClick={() => handleTogglePosting(!postingEnabled)}
            >
              {postingEnabled ? "Disable Posting" : "Enable Posting"}
            </Button>
            <Button
              variant={vendorEnabled ? "destructive" : "default"}
              className="gap-2"
              onClick={() => handleToggleVendor(!vendorEnabled)}
            >
              <Store className="w-4 h-4" />
              {vendorEnabled ? "Disable Vendor Mode" : "Enable Vendor Mode"}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-secondary/50 border border-border">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Overview
            </TabsTrigger>
            <TabsTrigger value="associations" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Associations
            </TabsTrigger>
            <TabsTrigger value="posts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Posts
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Opportunities
            </TabsTrigger>
            <TabsTrigger value="vendor" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Vendor Products & Services
            </TabsTrigger>
            <TabsTrigger value="members" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Members
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Community Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{communityData.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Countries</p>
                    <div className="flex gap-1 mt-1">
                      {communityData.countries.map((c) => (
                        <Badge key={c} variant="outline" className="text-xs">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="font-medium text-sm">{communityData.description}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Users</p>
                    <p className="font-medium">{communityData.userCount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Posts</p>
                    <p className="font-medium">{communityData.postCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vendor Mode</p>
                    <Badge className={vendorEnabled ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}>
                      {vendorEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Posting Enabled</p>
                    <Badge className={postingEnabled ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}>
                      {postingEnabled ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created At</p>
                    <p className="font-medium">{communityData.createdAt}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Associations Tab */}
          <TabsContent value="associations" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">Manage associations linked to this community.</p>
              <Button className="gap-2">
                <Link2 className="w-4 h-4" />
                Link Association
              </Button>
            </div>
            <div className="rounded-lg border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Association Name</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Members Count</TableHead>
                    <TableHead>Posts Count</TableHead>
                    <TableHead>Vendor Mode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {associationsData.map((assoc) => (
                    <TableRow key={assoc.id} className="border-border">
                      <TableCell className="font-medium">{assoc.name}</TableCell>
                      <TableCell>{assoc.country}</TableCell>
                      <TableCell>{assoc.membersCount}</TableCell>
                      <TableCell>{assoc.postsCount}</TableCell>
                      <TableCell>
                        <Badge className={assoc.vendorMode ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}>
                          {assoc.vendorMode ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-success/20 text-success capitalize">{assoc.status}</Badge>
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
                              <Eye className="w-4 h-4" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive">
                              <Unlink className="w-4 h-4" /> Unlink
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-4">
            <div className="rounded-lg border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Post Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {postsData.map((post) => (
                    <TableRow key={post.id} className="border-border">
                      <TableCell className="font-medium">{post.title}</TableCell>
                      <TableCell>{post.author}</TableCell>
                      <TableCell className="text-muted-foreground">{post.date}</TableCell>
                      <TableCell>
                        <Badge className={cn(
                          post.status === "approved" ? "bg-success/20 text-success" : "bg-warning/20 text-warning",
                          "capitalize"
                        )}>
                          {post.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-success">
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <X className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Opportunities Tab */}
          <TabsContent value="opportunities" className="space-y-4">
            <div className="rounded-lg border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Posted By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {opportunitiesData.map((opp) => (
                    <TableRow key={opp.id} className="border-border">
                      <TableCell className="font-medium">{opp.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{opp.type}</Badge>
                      </TableCell>
                      <TableCell>{opp.postedBy}</TableCell>
                      <TableCell className="text-muted-foreground">{opp.date}</TableCell>
                      <TableCell>
                        <Badge className={cn(
                          opp.status === "approved" ? "bg-success/20 text-success" : "bg-warning/20 text-warning",
                          "capitalize"
                        )}>
                          {opp.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-success">
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <X className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Vendor Tab */}
          <TabsContent value="vendor" className="space-y-4">
            <div className="rounded-lg border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Product Name</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendorProductsData.map((product) => (
                    <TableRow key={product.id} className="border-border">
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.vendor}</TableCell>
                      <TableCell>{product.price}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          product.status === "approved" ? "bg-success/20 text-success" : "bg-warning/20 text-warning",
                          "capitalize"
                        )}>
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-success">
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <X className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-4">
            <div className="rounded-lg border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Joined At</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {membersData.map((member) => (
                    <TableRow key={member.id} className="border-border">
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell className="text-muted-foreground">{member.email}</TableCell>
                      <TableCell className="text-muted-foreground">{member.joinedAt}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={member.role === "admin" ? "bg-primary/20 text-primary" : ""}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <User className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <X className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Ban className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Community Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Enable/Disable Posting</Label>
                    <p className="text-sm text-muted-foreground">Allow members to create posts in this community.</p>
                  </div>
                  <Switch checked={postingEnabled} onCheckedChange={handleTogglePosting} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Enable/Disable Vendor Mode</Label>
                    <p className="text-sm text-muted-foreground">Allow vendors to sell products and services.</p>
                  </div>
                  <Switch checked={vendorEnabled} onCheckedChange={handleToggleVendor} />
                </div>
                <div className="space-y-2">
                  <Label className="text-base">Assign Country</Label>
                  <Select>
                    <SelectTrigger className="w-full max-w-md bg-secondary border-border">
                      <SelectValue placeholder="Select countries" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {countryOptions.map((country) => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-base">Assign Community Admin</Label>
                  <Select>
                    <SelectTrigger className="w-full max-w-md bg-secondary border-border">
                      <SelectValue placeholder="Search user..." />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="user1">John Doe</SelectItem>
                      <SelectItem value="user2">Jane Smith</SelectItem>
                      <SelectItem value="user3">Mike Brown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="pt-4 border-t border-border">
                  <Button
                    variant="destructive"
                    className="gap-2"
                    onClick={() => setArchiveDialogOpen(true)}
                  >
                    <Archive className="w-4 h-4" />
                    Archive Community
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Archive Confirmation Dialog */}
        <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>Archive Community</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to archive{" "}
                <span className="font-semibold text-foreground">{communityData.name}</span>?
                This action can be reversed later.
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
