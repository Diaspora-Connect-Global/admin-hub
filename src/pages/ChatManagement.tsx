import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  useGetFlaggedConversations,
  useGetChatSettings,
  useReviewConversation,
  useUpdateChatSetting,
  useListDMConversations,
  useListGroupConversations,
  useGetChatVolumeAnalytics,
  useGetConversationMembers,
  useDeleteMessage,
  useBanUserFromConversation,
  type ConversationMemberItem,
} from "@/hooks/admin";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare,
  Activity,
  Sparkles,
  ShieldAlert,
  Search,
  MoreHorizontal,
  Info,
  UserSearch,
  Archive,
  Shield,
  Eye,
  Users,
  Mail,
  Lock,
  BarChart2,
  Loader2,
  Trash2,
  UserX,
} from "lucide-react";

// Settings key constants
const SETTING_KEYS = {
  CHAT_ENABLED: "chat_enabled",
  GROUP_CHAT_ENABLED: "group_chat_enabled",
  MAX_MESSAGE_LENGTH: "max_message_length",
  MESSAGE_RETENTION_DAYS: "message_retention_days",
} as const;

type DmMetadata = { dmId: string; userA: string; userB: string; messageCount: number; lastActive: string; flagCount: number };
type GroupDetail = { groupId: string; name: string; creator: string; memberCount: number; messageCount: number; lastActive: string; flagCount: number; visibility: string };

// State for members modal
type MembersModalState = { conversationId: string; title: string } | null;

// State for ban dialog
type BanDialogState = {
  conversationId: string;
  userId: string;
  displayName: string;
} | null;

// State for delete message dialog
type DeleteMessageDialogState = {
  messageId: string;
  conversationId: string;
} | null;

export default function ChatManagement() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dmMetadataModal, setDmMetadataModal] = useState<DmMetadata | null>(null);
  const [groupDetailModal, setGroupDetailModal] = useState<GroupDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Members modal state
  const [membersModal, setMembersModal] = useState<MembersModalState>(null);
  // Ban dialog state
  const [banDialog, setBanDialog] = useState<BanDialogState>(null);
  const [banReason, setBanReason] = useState("");
  // Delete message dialog state
  const [deleteMessageDialog, setDeleteMessageDialog] = useState<DeleteMessageDialogState>(null);

  // --- Flagged Chats live data ---
  const {
    data: flaggedData,
    loading: flaggedLoading,
    refetch: refetchFlagged,
  } = useGetFlaggedConversations({ page: 1, limit: 50 });
  const flaggedConversations = flaggedData?.getFlaggedConversations?.conversations ?? [];

  // --- DM Conversations live data ---
  const {
    data: dmData,
    loading: dmLoading,
  } = useListDMConversations({ limit: 50 });
  const dmConversations = dmData?.listDMConversations?.items ?? [];
  const dmTotal = dmData?.listDMConversations?.total ?? 0;

  // --- Group Conversations live data ---
  const {
    data: groupData,
    loading: groupLoading,
  } = useListGroupConversations({ limit: 50 });
  const groupConversations = groupData?.listGroupConversations?.items ?? [];
  const groupTotal = groupData?.listGroupConversations?.total ?? 0;

  // Combined flagged count from DM + Group lists
  const dmFlaggedCount = dmConversations.filter((c) => c.flagged).length;
  const groupFlaggedCount = groupConversations.filter((c) => c.flagged).length;
  const combinedFlaggedCount = flaggedLoading && dmLoading && groupLoading
    ? null
    : flaggedConversations.length + dmFlaggedCount + groupFlaggedCount;

  const [reviewConversation, { loading: reviewLoading }] = useReviewConversation();

  const handleReviewAction = async (id: string, newStatus: string) => {
    await reviewConversation({ variables: { id, newStatus } });
    refetchFlagged();
  };

  // --- Conversation Members ---
  const {
    data: membersData,
    loading: membersLoading,
    refetch: refetchMembers,
  } = useGetConversationMembers(membersModal?.conversationId ?? null);
  const conversationMembers: ConversationMemberItem[] =
    membersData?.getConversationMembers ?? [];

  // --- Delete Message ---
  const [deleteMessage, { loading: deleteMessageLoading }] = useDeleteMessage();

  const handleDeleteMessage = async () => {
    if (!deleteMessageDialog) return;
    try {
      await deleteMessage({
        variables: {
          messageId: deleteMessageDialog.messageId,
          conversationId: deleteMessageDialog.conversationId,
        },
      });
      toast({ title: "Message deleted", description: "The message has been removed." });
      setDeleteMessageDialog(null);
    } catch {
      toast({ title: "Error", description: "Failed to delete message.", variant: "destructive" });
    }
  };

  // --- Ban User From Conversation ---
  const [banUserFromConversation, { loading: banLoading }] = useBanUserFromConversation();

  const handleBanUser = async () => {
    if (!banDialog) return;
    try {
      await banUserFromConversation({
        variables: {
          conversationId: banDialog.conversationId,
          userId: banDialog.userId,
          reason: banReason.trim() || undefined,
        },
      });
      toast({ title: "User banned", description: `${banDialog.displayName} has been banned from this conversation.` });
      setBanDialog(null);
      setBanReason("");
      refetchMembers();
    } catch {
      toast({ title: "Error", description: "Failed to ban user.", variant: "destructive" });
    }
  };

  // --- Chat Volume Analytics ---
  const { data: chatAnalyticsData, loading: chatAnalyticsLoading } = useGetChatVolumeAnalytics("last_7_days");
  const totalMessages = chatAnalyticsData?.getChatVolumeAnalytics?.totalMessages ?? null;
  const dmCount = chatAnalyticsData?.getChatVolumeAnalytics?.dmCount ?? null;
  const groupCount = chatAnalyticsData?.getChatVolumeAnalytics?.groupCount ?? null;

  // --- Settings live data ---
  const { data: settingsData, loading: settingsLoading } = useGetChatSettings();
  const [updateChatSetting] = useUpdateChatSetting();

  // Controlled state for settings fields
  const [chatEnabled, setChatEnabled] = useState(true);
  const [groupChatEnabled, setGroupChatEnabled] = useState(true);
  const [maxMessageLength, setMaxMessageLength] = useState("1000");
  const [messageRetentionDays, setMessageRetentionDays] = useState("365");

  // Populate settings state from API response
  useEffect(() => {
    if (!settingsData?.getChatSettings) return;
    for (const setting of settingsData.getChatSettings) {
      switch (setting.key) {
        case SETTING_KEYS.CHAT_ENABLED:
          setChatEnabled(setting.value === "true");
          break;
        case SETTING_KEYS.GROUP_CHAT_ENABLED:
          setGroupChatEnabled(setting.value === "true");
          break;
        case SETTING_KEYS.MAX_MESSAGE_LENGTH:
          setMaxMessageLength(setting.value);
          break;
        case SETTING_KEYS.MESSAGE_RETENTION_DAYS:
          setMessageRetentionDays(setting.value);
          break;
      }
    }
  }, [settingsData]);

  const handleSaveSettings = async () => {
    await Promise.all([
      updateChatSetting({ variables: { input: { key: SETTING_KEYS.CHAT_ENABLED, value: String(chatEnabled) } } }),
      updateChatSetting({ variables: { input: { key: SETTING_KEYS.GROUP_CHAT_ENABLED, value: String(groupChatEnabled) } } }),
      updateChatSetting({ variables: { input: { key: SETTING_KEYS.MAX_MESSAGE_LENGTH, value: maxMessageLength } } }),
      updateChatSetting({ variables: { input: { key: SETTING_KEYS.MESSAGE_RETENTION_DAYS, value: messageRetentionDays } } }),
    ]);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('chat.title')}</h1>
          <p className="text-muted-foreground mt-1">
            Manage encrypted chat metadata. E2E encryption ensures message content is never accessible.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="dm">Direct Messages</TabsTrigger>
            <TabsTrigger value="groups">Group Chats</TabsTrigger>
            <TabsTrigger value="flagged">Flagged Chats</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stat Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="cursor-pointer hover:border-primary/30 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Messages (7 days)</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {chatAnalyticsLoading
                      ? "…"
                      : totalMessages === null
                      ? "—"
                      : totalMessages.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Across all chat types</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:border-primary/30 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Direct Messages</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {chatAnalyticsLoading
                      ? "…"
                      : dmCount === null
                      ? "—"
                      : dmCount.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">DM conversations active</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:border-primary/30 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Group Chats</CardTitle>
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {chatAnalyticsLoading
                      ? "…"
                      : groupCount === null
                      ? "—"
                      : groupCount.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Group conversations active</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:border-destructive/30 transition-colors border-destructive/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Flagged Chats</CardTitle>
                  <ShieldAlert className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {combinedFlaggedCount === null ? "—" : combinedFlaggedCount}
                  </div>
                  <p className="text-xs text-muted-foreground">Requires review</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts — no analytics API available */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Message Volume (7 Days)</CardTitle>
                  <CardDescription>Encrypted message throughput - metadata counts only</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex flex-col items-center justify-center gap-3 text-muted-foreground border border-dashed rounded-lg">
                    <BarChart2 className="h-8 w-8 opacity-40" />
                    <p className="text-sm">Historical analytics not yet available</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Peak Chat Hours</CardTitle>
                  <CardDescription>Aggregated activity by hour (UTC)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex flex-col items-center justify-center gap-3 text-muted-foreground border border-dashed rounded-lg">
                    <BarChart2 className="h-8 w-8 opacity-40" />
                    <p className="text-sm">Historical analytics not yet available</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Flags — wired from live flaggedConversations */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Flags (Metadata Only)</CardTitle>
                <CardDescription>Content not visible - E2E encrypted</CardDescription>
              </CardHeader>
              <CardContent>
                {flaggedLoading ? (
                  <p className="text-muted-foreground text-center py-8">Loading…</p>
                ) : flaggedConversations.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No flagged chats</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Conversation ID</TableHead>
                        <TableHead>Flag Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {flaggedConversations.slice(0, 5).map((flag) => (
                        <TableRow key={flag.id}>
                          <TableCell className="font-mono text-sm">{flag.conversationId}</TableCell>
                          <TableCell>{flag.flagReason}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                flag.status === "SUSPENDED"
                                  ? "destructive"
                                  : flag.status === "REVIEWED"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {flag.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {flag.createdAt ? new Date(flag.createdAt).toLocaleString() : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Direct Messages Tab */}
          <TabsContent value="dm" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Direct Messaging Overview</CardTitle>
                <CardDescription>View and manage DM metadata. Content is E2E encrypted.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by User ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="dm-active" />
                    <Label htmlFor="dm-active" className="text-sm">Active</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="dm-flagged" />
                    <Label htmlFor="dm-flagged" className="text-sm">Flagged</Label>
                  </div>
                </div>

                {/* Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>DM ID</TableHead>
                      <TableHead>User A</TableHead>
                      <TableHead>User B</TableHead>
                      <TableHead>Messages</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Flagged</TableHead>
                      <TableHead className="w-[50px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dmLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Loading…
                        </TableCell>
                      </TableRow>
                    ) : dmConversations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No direct message conversations found
                        </TableCell>
                      </TableRow>
                    ) : (
                      dmConversations
                        .filter((dm) =>
                          !searchQuery ||
                          dm.participant1Id.includes(searchQuery) ||
                          dm.participant2Id.includes(searchQuery) ||
                          (dm.participant1Name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (dm.participant2Name ?? "").toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((dm) => (
                          <TableRow key={dm.id}>
                            <TableCell className="font-mono text-sm">{dm.id}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm">{dm.participant1Name ?? "—"}</span>
                                <span className="text-xs text-muted-foreground font-mono">{dm.participant1Id}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm">{dm.participant2Name ?? "—"}</span>
                                <span className="text-xs text-muted-foreground font-mono">{dm.participant2Id}</span>
                              </div>
                            </TableCell>
                            <TableCell>{dm.messageCount}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {dm.lastMessageAt ? new Date(dm.lastMessageAt).toLocaleString() : "—"}
                            </TableCell>
                            <TableCell>
                              {dm.flagged ? (
                                <Badge variant="destructive">Flagged</Badge>
                              ) : (
                                <Badge variant="outline">Clean</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      setDmMetadataModal({
                                        dmId: dm.id,
                                        userA: dm.participant1Name ?? dm.participant1Id,
                                        userB: dm.participant2Name ?? dm.participant2Id,
                                        messageCount: dm.messageCount,
                                        lastActive: dm.lastMessageAt
                                          ? new Date(dm.lastMessageAt).toLocaleString()
                                          : "—",
                                        flagCount: dm.flagged ? 1 : 0,
                                      })
                                    }
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setDmMetadataModal({
                                        dmId: dm.id,
                                        userA: dm.participant1Name ?? dm.participant1Id,
                                        userB: dm.participant2Name ?? dm.participant2Id,
                                        messageCount: dm.messageCount,
                                        lastActive: dm.lastMessageAt
                                          ? new Date(dm.lastMessageAt).toLocaleString()
                                          : "—",
                                        flagCount: dm.flagged ? 1 : 0,
                                      })
                                    }
                                  >
                                    <Info className="mr-2 h-4 w-4" /> View Metadata
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setMembersModal({
                                        conversationId: dm.id,
                                        title: `Participants – ${dm.participant1Name ?? dm.participant1Id} & ${dm.participant2Name ?? dm.participant2Id}`,
                                      })
                                    }
                                  >
                                    <UserSearch className="mr-2 h-4 w-4" /> View Participants
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => {
                                      const msgId = window.prompt("Enter the Message ID to delete:");
                                      if (msgId?.trim()) {
                                        setDeleteMessageDialog({ messageId: msgId.trim(), conversationId: dm.id });
                                      }
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Message
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive">
                                    <Archive className="mr-2 h-4 w-4" /> Archive Conversation
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
                {!dmLoading && dmTotal > dmConversations.length && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    Showing {dmConversations.length} of {dmTotal} conversations
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Group Chats Tab */}
          <TabsContent value="groups" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Group Chats</CardTitle>
                <CardDescription>Manage group chat membership and metadata. Content is E2E encrypted.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search group name..." className="pl-9" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="grp-public" />
                    <Label htmlFor="grp-public" className="text-sm">Public</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="grp-private" />
                    <Label htmlFor="grp-private" className="text-sm">Private</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="grp-flagged" />
                    <Label htmlFor="grp-flagged" className="text-sm">Flagged</Label>
                  </div>
                </div>

                {/* Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Group ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Creator</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Messages</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Flagged</TableHead>
                      <TableHead className="w-[50px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          Loading…
                        </TableCell>
                      </TableRow>
                    ) : groupConversations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          No group conversations found
                        </TableCell>
                      </TableRow>
                    ) : (
                      groupConversations.map((grp) => (
                        <TableRow key={grp.id}>
                          <TableCell className="font-mono text-sm">{grp.id}</TableCell>
                          <TableCell className="font-medium">{grp.name}</TableCell>
                          <TableCell className="text-muted-foreground font-mono text-sm">
                            {grp.createdBy ?? "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              {grp.memberCount}
                            </div>
                          </TableCell>
                          <TableCell>{grp.messageCount}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {grp.lastMessageAt ? new Date(grp.lastMessageAt).toLocaleString() : "—"}
                          </TableCell>
                          <TableCell>
                            {grp.flagged ? (
                              <Badge variant="destructive">Flagged</Badge>
                            ) : (
                              <Badge variant="outline">Clean</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    setGroupDetailModal({
                                      groupId: grp.id,
                                      name: grp.name,
                                      creator: grp.createdBy ?? "—",
                                      memberCount: grp.memberCount,
                                      messageCount: grp.messageCount,
                                      lastActive: grp.lastMessageAt
                                        ? new Date(grp.lastMessageAt).toLocaleString()
                                        : "—",
                                      flagCount: grp.flagged ? 1 : 0,
                                      visibility: grp.communityId ? "Community" : "Standalone",
                                    })
                                  }
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    setGroupDetailModal({
                                      groupId: grp.id,
                                      name: grp.name,
                                      creator: grp.createdBy ?? "—",
                                      memberCount: grp.memberCount,
                                      messageCount: grp.messageCount,
                                      lastActive: grp.lastMessageAt
                                        ? new Date(grp.lastMessageAt).toLocaleString()
                                        : "—",
                                      flagCount: grp.flagged ? 1 : 0,
                                      visibility: grp.communityId ? "Community" : "Standalone",
                                    })
                                  }
                                >
                                  <Info className="mr-2 h-4 w-4" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    setMembersModal({
                                      conversationId: grp.id,
                                      title: `Members – ${grp.name}`,
                                    })
                                  }
                                >
                                  <UserSearch className="mr-2 h-4 w-4" /> View Members
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    const msgId = window.prompt("Enter the Message ID to delete:");
                                    if (msgId?.trim()) {
                                      setDeleteMessageDialog({ messageId: msgId.trim(), conversationId: grp.id });
                                    }
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete Message
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  <Archive className="mr-2 h-4 w-4" /> Archive Group
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {!groupLoading && groupTotal > groupConversations.length && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    Showing {groupConversations.length} of {groupTotal} conversations
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Flagged Chats Tab */}
          <TabsContent value="flagged" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Flagged Chats</CardTitle>
                <CardDescription>
                  Chats with safety or user-generated flags. Content is not visible - E2E encrypted.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <Switch id="flag-dm" />
                    <Label htmlFor="flag-dm" className="text-sm">DM Only</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="flag-groups" />
                    <Label htmlFor="flag-groups" className="text-sm">Groups Only</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="flag-critical" />
                    <Label htmlFor="flag-critical" className="text-sm">Critical Flags</Label>
                  </div>
                </div>

                {/* Table */}
                {flaggedLoading ? (
                  <p className="text-muted-foreground text-center py-8">Loading flagged chats…</p>
                ) : flaggedConversations.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No flagged chats found.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Conversation ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Flag Reason</TableHead>
                        <TableHead>Flagged By</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead className="w-[50px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {flaggedConversations.map((chat) => (
                        <TableRow key={chat.id}>
                          <TableCell className="font-mono text-sm">{chat.conversationId}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                chat.status === "SUSPENDED"
                                  ? "destructive"
                                  : chat.status === "REVIEWED"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {chat.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{chat.flagReason}</TableCell>
                          <TableCell className="text-muted-foreground">{chat.flaggedBy ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {chat.createdAt ? new Date(chat.createdAt).toLocaleString() : "—"}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={reviewLoading}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleReviewAction(chat.id, "REVIEWED")}
                                >
                                  <Eye className="mr-2 h-4 w-4" /> Mark Reviewed
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleReviewAction(chat.id, "ACTIVE")}
                                >
                                  <Shield className="mr-2 h-4 w-4" /> Approve (Set Active)
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleReviewAction(chat.id, "SUSPENDED")}
                                >
                                  <Archive className="mr-2 h-4 w-4" /> Suspend Chat
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Mail className="mr-2 h-4 w-4" /> Contact Participants
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {settingsLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading settings…</p>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>General Chat Settings</CardTitle>
                    <CardDescription>Configure global chat system settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="setting-chat-enabled">Enable Direct Messaging</Label>
                        <p className="text-sm text-muted-foreground">Globally enable or disable DM for all users.</p>
                      </div>
                      <Switch
                        id="setting-chat-enabled"
                        checked={chatEnabled}
                        onCheckedChange={setChatEnabled}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="setting-group-chat-enabled">Enable Group Chats</Label>
                        <p className="text-sm text-muted-foreground">Allow creation of new group chats.</p>
                      </div>
                      <Switch
                        id="setting-group-chat-enabled"
                        checked={groupChatEnabled}
                        onCheckedChange={setGroupChatEnabled}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Security & Encryption</CardTitle>
                    <CardDescription>Encryption and retention policies</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>E2E Encryption</Label>
                        <p className="text-sm text-muted-foreground">End-to-end encryption status</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-green-500" />
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                          Mandatory
                        </Badge>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="setting-retention-days">Metadata Retention (Days)</Label>
                        <Input
                          id="setting-retention-days"
                          type="number"
                          value={messageRetentionDays}
                          onChange={(e) => setMessageRetentionDays(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="setting-max-msg-length">Max Message Length (Characters)</Label>
                        <Input
                          id="setting-max-msg-length"
                          type="number"
                          value={maxMessageLength}
                          onChange={(e) => setMaxMessageLength(e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button onClick={handleSaveSettings}>Save Settings</Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* DM Metadata Modal */}
        <Dialog open={!!dmMetadataModal} onOpenChange={() => setDmMetadataModal(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Direct Message Metadata</DialogTitle>
            </DialogHeader>
            {dmMetadataModal && (
              <div className="space-y-4">
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">DM ID</span>
                    <span className="font-mono">{dmMetadataModal.dmId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Participants</span>
                    <span>{dmMetadataModal.userA}, {dmMetadataModal.userB}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Messages</span>
                    <span>{dmMetadataModal.messageCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Activity</span>
                    <span>{dmMetadataModal.lastActive}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Encryption</span>
                    <Badge variant="outline" className="bg-green-500/10 text-green-600">E2E Enabled</Badge>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Flags & Reports</h4>
                  <p className="text-sm text-muted-foreground">Content not visible</p>
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-muted-foreground">Report Count</span>
                    <span>{dmMetadataModal.flagCount}</span>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="destructive" size="sm">Archive Conversation</Button>
              <Button variant="destructive" size="sm">Delete Metadata (GDPR)</Button>
              <Button variant="secondary" size="sm" onClick={() => setDmMetadataModal(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Group Detail Modal */}
        <Dialog open={!!groupDetailModal} onOpenChange={() => setGroupDetailModal(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Group Chat Details</DialogTitle>
            </DialogHeader>
            {groupDetailModal && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Group ID</span>
                    <span className="font-mono">{groupDetailModal.groupId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Group Name</span>
                    <span className="font-medium">{groupDetailModal.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created By</span>
                    <span>{groupDetailModal.creator}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Visibility</span>
                    <Badge variant="outline">{groupDetailModal.visibility}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Encryption</span>
                    <Badge variant="outline" className="bg-green-500/10 text-green-600">E2E Enabled</Badge>
                  </div>
                </div>

                {/* Members */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Members ({groupDetailModal.memberCount})</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setMembersModal({
                        conversationId: groupDetailModal.groupId,
                        title: `Members – ${groupDetailModal.name}`,
                      })
                    }
                  >
                    <Users className="mr-2 h-4 w-4" /> View &amp; Manage Members
                  </Button>
                </div>

                {/* Flags */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Flags & Reports</h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Report Count</span>
                    <span>{groupDetailModal.flagCount}</span>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="destructive" size="sm">Archive Group</Button>
              <Button variant="destructive" size="sm">Delete Group Metadata</Button>
              <Button variant="secondary" size="sm" onClick={() => setGroupDetailModal(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Members / Participants Modal */}
        <Dialog
          open={!!membersModal}
          onOpenChange={(open) => {
            if (!open) setMembersModal(null);
          }}
        >
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{membersModal?.title ?? "Members"}</DialogTitle>
            </DialogHeader>
            {membersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : conversationMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No members found.</p>
            ) : (
              <div className="space-y-2">
                {conversationMembers.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatarUrl} />
                        <AvatarFallback>
                          {(member.displayName ?? member.userId).slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {member.displayName ?? member.userId}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {member.userId}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {member.role}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        disabled={banLoading}
                        onClick={() =>
                          setBanDialog({
                            conversationId: membersModal!.conversationId,
                            userId: member.userId,
                            displayName: member.displayName ?? member.userId,
                          })
                        }
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <DialogFooter>
              <Button variant="secondary" size="sm" onClick={() => setMembersModal(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Ban User Dialog */}
        <Dialog
          open={!!banDialog}
          onOpenChange={(open) => {
            if (!open) {
              setBanDialog(null);
              setBanReason("");
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Ban User from Conversation</DialogTitle>
            </DialogHeader>
            {banDialog && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  You are about to ban{" "}
                  <span className="font-medium text-foreground">{banDialog.displayName}</span> from
                  this conversation. They will no longer be able to participate.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="ban-reason">Reason (optional)</Label>
                  <Textarea
                    id="ban-reason"
                    placeholder="Enter a reason for the ban..."
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setBanDialog(null);
                  setBanReason("");
                }}
                disabled={banLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={banLoading}
                onClick={handleBanUser}
              >
                {banLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Banning…
                  </>
                ) : (
                  <>
                    <UserX className="mr-2 h-4 w-4" /> Confirm Ban
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Message AlertDialog */}
        <AlertDialog
          open={!!deleteMessageDialog}
          onOpenChange={(open) => {
            if (!open) setDeleteMessageDialog(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Message</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove the message from the conversation. This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMessageLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteMessageLoading}
                onClick={handleDeleteMessage}
              >
                {deleteMessageLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting…
                  </>
                ) : (
                  "Delete Message"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
