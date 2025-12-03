import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  ChevronDown,
  Eye,
  Check,
  X,
  FileText,
  UserPlus,
  Ban,
  RotateCcw,
  Trash2,
  Users,
  Building,
  Shield,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Sample data
const pendingCommunities = [
  { id: "COM-001", name: "Lagos Tech Hub", country: "Nigeria", submittedBy: "john@example.com", submittedAt: "2024-01-15", riskScore: 12, status: "pending" },
  { id: "COM-002", name: "Accra Farmers Collective", country: "Ghana", submittedBy: "mary@example.com", submittedAt: "2024-01-14", riskScore: 8, status: "pending" },
  { id: "COM-003", name: "Nairobi Artisans Guild", country: "Kenya", submittedBy: "peter@example.com", submittedAt: "2024-01-13", riskScore: 45, status: "needs_documents" },
];

const activeCommunities = [
  { id: "COM-010", name: "Cape Town Traders", country: "South Africa", adminsCount: 3, membersCount: 245, verificationLevel: "full", status: "active", createdAt: "2023-06-10" },
  { id: "COM-011", name: "Dar es Salaam Market", country: "Tanzania", adminsCount: 2, membersCount: 189, verificationLevel: "basic", status: "active", createdAt: "2023-08-22" },
  { id: "COM-012", name: "Kampala Entrepreneurs", country: "Uganda", adminsCount: 4, membersCount: 312, verificationLevel: "full", status: "active", createdAt: "2023-05-15" },
];

const suspendedCommunities = [
  { id: "COM-020", name: "Abuja Network", reason: "Suspicious activity detected", suspendedAt: "2024-01-10" },
  { id: "COM-021", name: "Lusaka Ventures", reason: "Document fraud investigation", suspendedAt: "2024-01-08" },
];

const archivedCommunities = [
  { id: "COM-030", name: "Old Kigali Group", archivedAt: "2023-12-01" },
  { id: "COM-031", name: "Defunct Maputo Collective", archivedAt: "2023-11-15" },
];

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    pending: "bg-warning/20 text-warning border-warning/30",
    needs_documents: "bg-info/20 text-info border-info/30",
    approved: "bg-success/20 text-success border-success/30",
    active: "bg-success/20 text-success border-success/30",
    suspended: "bg-destructive/20 text-destructive border-destructive/30",
    archived: "bg-muted text-muted-foreground border-border",
  };
  return styles[status] || styles.pending;
};

const getRiskBadge = (score: number) => {
  if (score < 20) return "bg-success/20 text-success border-success/30";
  if (score < 50) return "bg-warning/20 text-warning border-warning/30";
  return "bg-destructive/20 text-destructive border-destructive/30";
};

export default function Communities() {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDetails = (community: any) => {
    setSelectedCommunity(community);
    setDrawerOpen(true);
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Communities</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage approvals, verification, and community accounts
            </p>
          </div>
          <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4" />
            Create Community
          </Button>
        </div>

        {/* Top Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                Bulk Actions
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border">
              <DropdownMenuItem>Bulk Approve Low Risk</DropdownMenuItem>
              <DropdownMenuItem>Bulk Reject</DropdownMenuItem>
              <DropdownMenuItem>Export Selected</DropdownMenuItem>
              <DropdownMenuItem>Assign Country Chapter</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="glass rounded-lg p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Select>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Country Chapter" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">All Countries</SelectItem>
                <SelectItem value="ng">Nigeria</SelectItem>
                <SelectItem value="gh">Ghana</SelectItem>
                <SelectItem value="ke">Kenya</SelectItem>
                <SelectItem value="za">South Africa</SelectItem>
                <SelectItem value="tz">Tanzania</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Verification Status" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="needs_documents">Needs Documents</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Risk Score" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">All Scores</SelectItem>
                <SelectItem value="low">Low (0-20)</SelectItem>
                <SelectItem value="medium">Medium (21-50)</SelectItem>
                <SelectItem value="high">High (51+)</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Community Size" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">Any Size</SelectItem>
                <SelectItem value="small">Small (&lt;50)</SelectItem>
                <SelectItem value="medium">Medium (50-200)</SelectItem>
                <SelectItem value="large">Large (200+)</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Has Admin" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" className="text-muted-foreground">
              Clear All
            </Button>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-secondary/50 border border-border">
            <TabsTrigger value="pending" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Pending Approvals
              <Badge variant="secondary" className="ml-2 bg-warning/20 text-warning">
                {pendingCommunities.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="active" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Active Communities
            </TabsTrigger>
            <TabsTrigger value="suspended" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Suspended
            </TabsTrigger>
            <TabsTrigger value="archived" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Archived
            </TabsTrigger>
          </TabsList>

          {/* Pending Tab */}
          <TabsContent value="pending" className="space-y-4">
            <div className="table-container">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Community ID</TableHead>
                    <TableHead className="text-muted-foreground">Name</TableHead>
                    <TableHead className="text-muted-foreground">Country</TableHead>
                    <TableHead className="text-muted-foreground">Submitted By</TableHead>
                    <TableHead className="text-muted-foreground">Submitted At</TableHead>
                    <TableHead className="text-muted-foreground">Risk Score</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingCommunities.map((community) => (
                    <TableRow key={community.id} className="border-border hover:bg-secondary/50 cursor-pointer" onClick={() => openDetails(community)}>
                      <TableCell className="font-mono text-sm">{community.id}</TableCell>
                      <TableCell className="font-medium">{community.name}</TableCell>
                      <TableCell>{community.country}</TableCell>
                      <TableCell className="text-muted-foreground">{community.submittedBy}</TableCell>
                      <TableCell className="text-muted-foreground">{community.submittedAt}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-xs", getRiskBadge(community.riskScore))}>
                          {community.riskScore}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-xs capitalize", getStatusBadge(community.status))}>
                          {community.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border-border">
                            <DropdownMenuItem className="gap-2">
                              <Eye className="w-4 h-4" /> View Request
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-success">
                              <Check className="w-4 h-4" /> Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive">
                              <X className="w-4 h-4" /> Reject
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <FileText className="w-4 h-4" /> Request Documents
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

          {/* Active Tab */}
          <TabsContent value="active" className="space-y-4">
            <div className="table-container">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Community ID</TableHead>
                    <TableHead className="text-muted-foreground">Name</TableHead>
                    <TableHead className="text-muted-foreground">Country</TableHead>
                    <TableHead className="text-muted-foreground">Admins</TableHead>
                    <TableHead className="text-muted-foreground">Members</TableHead>
                    <TableHead className="text-muted-foreground">Verification</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeCommunities.map((community) => (
                    <TableRow key={community.id} className="border-border hover:bg-secondary/50 cursor-pointer" onClick={() => openDetails(community)}>
                      <TableCell className="font-mono text-sm">{community.id}</TableCell>
                      <TableCell className="font-medium">{community.name}</TableCell>
                      <TableCell>{community.country}</TableCell>
                      <TableCell>{community.adminsCount}</TableCell>
                      <TableCell>{community.membersCount}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-xs capitalize", community.verificationLevel === "full" ? "bg-success/20 text-success border-success/30" : "bg-info/20 text-info border-info/30")}>
                          {community.verificationLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-xs capitalize", getStatusBadge(community.status))}>
                          {community.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border-border">
                            <DropdownMenuItem className="gap-2">
                              <Eye className="w-4 h-4" /> View Dashboard
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <FileText className="w-4 h-4" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <UserPlus className="w-4 h-4" /> Assign Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive">
                              <Ban className="w-4 h-4" /> Deactivate
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

          {/* Suspended Tab */}
          <TabsContent value="suspended" className="space-y-4">
            <div className="table-container">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Community ID</TableHead>
                    <TableHead className="text-muted-foreground">Name</TableHead>
                    <TableHead className="text-muted-foreground">Reason</TableHead>
                    <TableHead className="text-muted-foreground">Suspended At</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suspendedCommunities.map((community) => (
                    <TableRow key={community.id} className="border-border hover:bg-secondary/50">
                      <TableCell className="font-mono text-sm">{community.id}</TableCell>
                      <TableCell className="font-medium">{community.name}</TableCell>
                      <TableCell className="text-muted-foreground">{community.reason}</TableCell>
                      <TableCell className="text-muted-foreground">{community.suspendedAt}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border-border">
                            <DropdownMenuItem className="gap-2 text-success">
                              <RotateCcw className="w-4 h-4" /> Reactivate
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Eye className="w-4 h-4" /> View Details
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

          {/* Archived Tab */}
          <TabsContent value="archived" className="space-y-4">
            <div className="table-container">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Community ID</TableHead>
                    <TableHead className="text-muted-foreground">Name</TableHead>
                    <TableHead className="text-muted-foreground">Archived At</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archivedCommunities.map((community) => (
                    <TableRow key={community.id} className="border-border hover:bg-secondary/50">
                      <TableCell className="font-mono text-sm">{community.id}</TableCell>
                      <TableCell className="font-medium">{community.name}</TableCell>
                      <TableCell className="text-muted-foreground">{community.archivedAt}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border-border">
                            <DropdownMenuItem className="gap-2">
                              <RotateCcw className="w-4 h-4" /> Restore
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive">
                              <Trash2 className="w-4 h-4" /> Permanent Delete
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
        </Tabs>

        {/* Details Drawer */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent className="w-[400px] sm:w-[540px] bg-card border-border overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-foreground">Community Details</SheetTitle>
            </SheetHeader>
            {selectedCommunity && (
              <div className="mt-6 space-y-6">
                {/* Overview Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Building className="w-4 h-4" />
                    Overview
                  </div>
                  <div className="glass rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Name</span>
                      <span className="text-sm font-medium">{selectedCommunity.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Country</span>
                      <span className="text-sm">{selectedCommunity.country}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant="outline" className={cn("text-xs capitalize", getStatusBadge(selectedCommunity.status))}>
                        {selectedCommunity.status?.replace("_", " ")}
                      </Badge>
                    </div>
                    {selectedCommunity.riskScore !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Risk Score</span>
                        <Badge variant="outline" className={cn("text-xs", getRiskBadge(selectedCommunity.riskScore))}>
                          {selectedCommunity.riskScore}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admins Section */}
                {selectedCommunity.adminsCount !== undefined && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Users className="w-4 h-4" />
                      Admins
                    </div>
                    <div className="glass rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Admins</span>
                        <span className="text-sm font-medium">{selectedCommunity.adminsCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Members</span>
                        <span className="text-sm font-medium">{selectedCommunity.membersCount}</span>
                      </div>
                      <Button variant="outline" size="sm" className="w-full gap-2 mt-2">
                        <UserPlus className="w-4 h-4" />
                        Assign Admin
                      </Button>
                    </div>
                  </div>
                )}

                {/* Documents Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    Documents
                  </div>
                  <div className="glass rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-sm">Registration Certificate</span>
                      <Badge variant="outline" className="text-xs bg-success/20 text-success border-success/30">Verified</Badge>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-sm">Leader ID Card</span>
                      <Badge variant="outline" className="text-xs bg-success/20 text-success border-success/30">Verified</Badge>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm">Constitution/Bylaws</span>
                      <Badge variant="outline" className="text-xs bg-warning/20 text-warning border-warning/30">Pending</Badge>
                    </div>
                  </div>
                </div>

                {/* Audit Log Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    Recent Activity
                  </div>
                  <div className="glass rounded-lg p-4 space-y-3">
                    <div className="text-sm">
                      <p className="text-muted-foreground">Application submitted</p>
                      <p className="text-xs text-muted-foreground/70">{selectedCommunity.submittedAt || selectedCommunity.createdAt}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  {selectedCommunity.status === "pending" && (
                    <>
                      <Button className="flex-1 gap-2 bg-success hover:bg-success/90 text-success-foreground">
                        <Check className="w-4 h-4" />
                        Approve
                      </Button>
                      <Button variant="destructive" className="flex-1 gap-2">
                        <X className="w-4 h-4" />
                        Reject
                      </Button>
                    </>
                  )}
                  {selectedCommunity.status === "active" && (
                    <Button variant="destructive" className="flex-1 gap-2">
                      <Ban className="w-4 h-4" />
                      Deactivate
                    </Button>
                  )}
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  );
}
