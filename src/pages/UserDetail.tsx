import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useApolloClient } from "@apollo/client/react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/StateViews";
import { friendlyErrorMessage } from "@/lib/graphqlErrors";
import { useGetProfile } from "@/hooks/user";
import {
  useGetUserPosts,
  useGetUserGroups,
  useGetUserOpportunities,
  useGetUserTransactions,
  useGetModerationActions,
  useListAdmins,
} from "@/hooks/admin";
import {
  AccountStatusBadge,
  normalizeAccountStatus,
  type AccountStatusInfo,
} from "@/components/user/accountStatus";
import {
  useUserEnforcement,
  UserEnforcementDialogs,
  type AccountStatusResult,
  type EnforcementAction,
} from "@/components/user/UserEnforcement";
import { UserOverviewTab } from "@/components/user/UserOverviewTab";
import { UserPostsTab } from "@/components/user/UserPostsTab";
import { UserGroupsTab } from "@/components/user/UserGroupsTab";
import { UserOpportunitiesTab } from "@/components/user/UserOpportunitiesTab";
import { UserTransactionsTab } from "@/components/user/UserTransactionsTab";
import { UserEnforcementTab } from "@/components/user/UserEnforcementTab";
import { ArrowLeft, Ban, Gavel, Key, Loader2, MoreHorizontal, Pause, Play, ShieldOff } from "lucide-react";

const PAGE_SIZE = 20;

/**
 * Status handed over by the users list when the admin clicked through. It is a
 * shortcut, never a dependency: the page loads everything it needs from the id
 * in the URL, so a pasted link or a hard refresh renders the same page (minus
 * this one field, which then shows as "unknown" rather than as a guess).
 */
interface UserRowHandover {
  name?: string;
  accountStatus?: string | null;
  statusReason?: string | null;
  suspendedUntil?: string | null;
  createdAt?: string | null;
}

export default function UserDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const apolloClient = useApolloClient();
  const userId = id ?? null;

  const { data, loading, error, refetch } = useGetProfile(userId);
  const profile = data?.getProfile?.profile ?? null;
  const handover = (location.state as { user?: UserRowHandover } | null)?.user;

  // Per-tab paging offsets. Kept on the page (not in the tabs) so the tab
  // components stay presentational and the queries live in one place.
  const [postsOffset, setPostsOffset] = useState(0);
  const [groupsOffset, setGroupsOffset] = useState(0);
  const [opportunitiesOffset, setOpportunitiesOffset] = useState(0);
  const [transactionsOffset, setTransactionsOffset] = useState(0);
  const [enforcementOffset, setEnforcementOffset] = useState(0);

  const posts = useGetUserPosts(userId, PAGE_SIZE, postsOffset);
  const groups = useGetUserGroups(userId, PAGE_SIZE, groupsOffset);
  const opportunities = useGetUserOpportunities(userId, PAGE_SIZE, opportunitiesOffset);
  const transactions = useGetUserTransactions(userId, PAGE_SIZE, transactionsOffset);

  // Enforcement taken AGAINST this account (ban / unban / suspend), not actions
  // the user performed — `getAuditLogs(actorId)` answers the opposite question.
  // `skip` is mandatory: without it a missing id would fetch the platform-wide
  // moderation log.
  const moderation = useGetModerationActions({
    targetType: "USER",
    targetId: userId,
    limit: PAGE_SIZE,
    offset: enforcementOffset,
    skip: !userId,
  });

  /**
   * Account status, best source first:
   *  1. the outcome of an action just taken on this page,
   *  2. the profile query (null until the gateway populates it — see
   *     GET_PROFILE),
   *  3. the row the users list handed over on click-through,
   *  4. unknown.
   */
  const [statusOverride, setStatusOverride] = useState<AccountStatusInfo | null>(null);
  const status: AccountStatusInfo = statusOverride ?? {
    accountStatus: normalizeAccountStatus(profile?.accountStatus ?? handover?.accountStatus),
    statusReason: profile?.statusReason ?? handover?.statusReason ?? null,
    suspendedUntil: profile?.suspendedUntil ?? handover?.suspendedUntil ?? null,
  };

  const handleStatusChanged = async (
    action: EnforcementAction,
    result: AccountStatusResult | null,
  ) => {
    if (result?.status) {
      // suspend / unsuspend echo the new state back.
      setStatusOverride({
        accountStatus: normalizeAccountStatus(result.status),
        statusReason: result.statusReason ?? null,
        suspendedUntil: result.suspendedUntil ?? null,
      });
    } else if (action === "ban") {
      // adminBanUser returns only `success`; a successful ban means BANNED.
      setStatusOverride({ accountStatus: "BANNED", statusReason: null, suspendedUntil: null });
    } else {
      // A successful unban lifts the ban but says nothing about a suspension
      // that may still be in force — so the honest state here is "unknown".
      setStatusOverride({ accountStatus: null, statusReason: null, suspendedUntil: null });
    }
    // Keep the users list in step, so going back does not show the old state.
    await apolloClient.refetchQueries({ include: ["GetUsers"] });
    await moderation.refetch?.();
  };

  const enforcement = useUserEnforcement({ onStatusChanged: handleStatusChanged });

  // Resolve the acting admin of each enforcement row to an email — ids are
  // never displayed.
  const admins = useListAdmins(100, 0);
  const adminEmailById = useMemo(
    () => new Map((admins.data?.listAdmins?.admins ?? []).map((a) => [a.id, a.email] as const)),
    [admins.data],
  );

  const displayName =
    [profile?.firstName, profile?.lastName].filter((part) => part && part.trim()).join(" ") ||
    handover?.name ||
    profile?.email ||
    t("users.detail.unnamed");

  const target = { id: userId ?? "", name: displayName };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/users")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("users.detail.back")}
          </Button>
          <LoadingState rows={6} />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/users")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("users.detail.back")}
          </Button>
          <ErrorState
            title={t("users.detail.loadFailed")}
            message={friendlyErrorMessage(error)}
            onRetry={() => void refetch()}
          />
        </div>
      </AdminLayout>
    );
  }

  if (!profile) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/users")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("users.detail.back")}
          </Button>
          <EmptyState
            title={t("users.detail.notFound")}
            message={t("users.detail.notFoundHint")}
          />
        </div>
      </AdminLayout>
    );
  }

  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? "")
      .join("") || "?";

  const moderationActions = moderation.data?.getModerationActions?.items ?? [];
  const moderationTotal = moderation.data?.getModerationActions?.total ?? moderationActions.length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">{t("users.detail.breadcrumbRoot")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/users">{t("users.detail.breadcrumbUsers")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{displayName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("users.detail.back")}
              onClick={() => navigate("/users")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-14 w-14 rounded-lg border border-border">
              {profile.profilePicture && (
                <AvatarImage
                  src={profile.profilePicture}
                  alt={displayName}
                  className="rounded-lg object-cover"
                />
              )}
              <AvatarFallback className="rounded-lg bg-muted text-base font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold text-foreground">{displayName}</h1>
                <AccountStatusBadge {...status} />
                {profile.isVerified && (
                  <StatusBadge variant="info">{t("users.verified")}</StatusBadge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {[profile.email, profile.phone].filter(Boolean).join(" · ") || "—"}
              </p>
              {status.statusReason && (
                <p className="text-xs text-muted-foreground">
                  {t("users.accountStatus.reason", { reason: status.statusReason })}
                </p>
              )}
            </div>
          </div>

          {/* Same status-aware action set as the row menu on the users table —
              both surfaces call the same hook, so they cannot disagree about
              what is available. An UNKNOWN status offers both directions. */}
          <div className="flex flex-wrap items-center gap-2">
            {status.accountStatus !== "SUSPENDED" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => enforcement.openSuspendDialog(target)}
                disabled={enforcement.suspendLoading}
              >
                {enforcement.suspendLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Pause className="mr-2 h-4 w-4" />
                )}
                {t("users.suspend.action")}
              </Button>
            )}
            {(status.accountStatus === "SUSPENDED" || status.accountStatus === null) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => enforcement.openUnsuspendDialog(target)}
                disabled={enforcement.unsuspendLoading}
              >
                {enforcement.unsuspendLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                {t("users.unsuspend.action")}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => enforcement.openResetPasswordDialog(target)}
              disabled={enforcement.resetLoading}
            >
              {enforcement.resetLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Key className="mr-2 h-4 w-4" />
              )}
              {t("users.resetPassword.action")}
            </Button>
            {status.accountStatus !== "BANNED" && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => enforcement.openBanDialog(target)}
                disabled={enforcement.banLoading}
              >
                {enforcement.banLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Ban className="mr-2 h-4 w-4" />
                )}
                {t("users.ban.action")}
              </Button>
            )}
            {(status.accountStatus === "BANNED" || status.accountStatus === null) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => enforcement.openUnbanDialog(target)}
                disabled={enforcement.unbanLoading}
              >
                {enforcement.unbanLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShieldOff className="mr-2 h-4 w-4" />
                )}
                {t("users.unban.action")}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t("common.actions")}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="border-border bg-popover">
                <DropdownMenuItem onClick={() => enforcement.openLegalHoldDialog(target, false)}>
                  <Gavel className="mr-2 h-4 w-4" /> {t("users.legalHold.apply")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => enforcement.openLegalHoldDialog(target, true)}>
                  <Gavel className="mr-2 h-4 w-4" /> {t("users.legalHold.release")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <ScrollArea className="w-full">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-muted/50 p-1">
              <TabsTrigger value="overview">{t("users.detail.tabs.overview")}</TabsTrigger>
              <TabsTrigger value="posts">{t("users.detail.tabs.posts")}</TabsTrigger>
              <TabsTrigger value="groups">{t("users.detail.tabs.groups")}</TabsTrigger>
              <TabsTrigger value="opportunities">
                {t("users.detail.tabs.opportunities")}
              </TabsTrigger>
              <TabsTrigger value="transactions">{t("users.detail.tabs.transactions")}</TabsTrigger>
              <TabsTrigger value="enforcement">{t("users.detail.tabs.enforcement")}</TabsTrigger>
            </TabsList>
          </ScrollArea>

          <UserOverviewTab
            profile={profile}
            createdAt={profile.createdAt ?? handover?.createdAt ?? null}
            t={t}
          />

          <UserPostsTab
            posts={posts.data?.getUserPosts?.items ?? []}
            total={posts.data?.getUserPosts?.total ?? 0}
            loading={posts.loading}
            error={posts.error}
            paging={{
              offset: postsOffset,
              onPrev: () => setPostsOffset((o) => Math.max(0, o - PAGE_SIZE)),
              onNext: () => setPostsOffset((o) => o + PAGE_SIZE),
            }}
            t={t}
          />

          <UserGroupsTab
            groups={groups.data?.getUserGroups?.items ?? []}
            total={groups.data?.getUserGroups?.total ?? 0}
            loading={groups.loading}
            error={groups.error}
            paging={{
              offset: groupsOffset,
              onPrev: () => setGroupsOffset((o) => Math.max(0, o - PAGE_SIZE)),
              onNext: () => setGroupsOffset((o) => o + PAGE_SIZE),
            }}
            t={t}
          />

          <UserOpportunitiesTab
            opportunities={opportunities.data?.getUserOpportunities?.items ?? []}
            total={opportunities.data?.getUserOpportunities?.total ?? 0}
            loading={opportunities.loading}
            error={opportunities.error}
            paging={{
              offset: opportunitiesOffset,
              onPrev: () => setOpportunitiesOffset((o) => Math.max(0, o - PAGE_SIZE)),
              onNext: () => setOpportunitiesOffset((o) => o + PAGE_SIZE),
            }}
            t={t}
          />

          <UserTransactionsTab
            transactions={transactions.data?.getUserTransactions?.items ?? []}
            total={transactions.data?.getUserTransactions?.total ?? 0}
            loading={transactions.loading}
            error={transactions.error}
            paging={{
              offset: transactionsOffset,
              onPrev: () => setTransactionsOffset((o) => Math.max(0, o - PAGE_SIZE)),
              onNext: () => setTransactionsOffset((o) => o + PAGE_SIZE),
            }}
            t={t}
          />

          {/* `errorPolicy: "all"` lets partial results through, so rows are
              shown whenever we have any. But a query that returned NOTHING and
              failed must say so: rendering the empty state there would tell an
              admin "no enforcement has ever been taken" on the strength of a
              request that never answered — the one lie this tab must not tell. */}
          <UserEnforcementTab
            actions={moderationActions}
            total={moderationTotal}
            loading={moderation.loading}
            error={moderationActions.length === 0 ? moderation.error : undefined}
            paging={{
              offset: enforcementOffset,
              onPrev: () => setEnforcementOffset((o) => Math.max(0, o - PAGE_SIZE)),
              onNext: () => setEnforcementOffset((o) => o + PAGE_SIZE),
            }}
            adminEmailById={adminEmailById}
            t={t}
          />
        </Tabs>
      </div>

      <UserEnforcementDialogs enforcement={enforcement} />
    </AdminLayout>
  );
}
