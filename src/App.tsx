import { Suspense } from "react";
import { lazyRoute } from "@/lib/lazyRoute";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ApolloProvider } from "@apollo/client/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { adminClient } from "@/services/networks/graphql/admin";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RequireSystemAdmin } from "@/components/auth/RequireSystemAdmin";
import { TokenExpiryMonitor } from "@/components/auth/TokenExpiryMonitor";
import "@/i18n";
// Eager: small, needed immediately
import Login from "./pages/Login";
import SetPassword from "./pages/SetPassword";
import NotFound from "./pages/NotFound";

// Lazy-loaded authenticated pages (code-split into separate chunks)
const Index = lazyRoute(() => import("./pages/Index"));
const EscrowManagement = lazyRoute(() => import("./pages/EscrowManagement"));
const NotificationsBroadcasts = lazyRoute(() => import("./pages/NotificationsBroadcasts"));
const Communities = lazyRoute(() => import("./pages/Communities"));
const CommunityDetail = lazyRoute(() => import("./pages/CommunityDetail"));
const Events = lazyRoute(() => import("./pages/Events"));
const Opportunities = lazyRoute(() => import("./pages/Opportunities"));
const UserManagement = lazyRoute(() => import("./pages/UserManagement"));
const UserDetail = lazyRoute(() => import("./pages/UserDetail"));
const DeletionRequests = lazyRoute(() => import("./pages/DeletionRequests"));
const KycVerifications = lazyRoute(() => import("./pages/KycVerifications"));
const Associations = lazyRoute(() => import("./pages/Associations"));
const AssociationDetail = lazyRoute(() => import("./pages/AssociationDetail"));
const VendorManagement = lazyRoute(() => import("./pages/VendorManagement"));
const SupportTicketing = lazyRoute(() => import("./pages/SupportTicketing"));
const CaseTypeConfig = lazyRoute(() => import("./pages/CaseTypeConfig"));
const SystemHealth = lazyRoute(() => import("./pages/SystemHealth"));
const ContentModeration = lazyRoute(() => import("./pages/ContentModeration"));
const PostManagement = lazyRoute(() => import("./pages/PostManagement"));
const DisputesResolution = lazyRoute(() => import("./pages/DisputesResolution"));
const SystemSettings = lazyRoute(() => import("./pages/SystemSettings"));
const AuditLogs = lazyRoute(() => import("./pages/AuditLogs"));
const RolesPermissions = lazyRoute(() => import("./pages/RolesPermissions"));
const Reports = lazyRoute(() => import("./pages/Reports"));
const ChatManagement = lazyRoute(() => import("./pages/ChatManagement"));
const AiConfiguration = lazyRoute(() => import("./pages/AiConfiguration"));
const OtpDeliverySettings = lazyRoute(() => import("./pages/OtpDeliverySettings"));
// Circles oversight + plan catalogue (circle-service). System-admin-only:
// `adminCircles` is the only read that returns suspended and non-discoverable
// circles, and the whole CircleAdminService tier is
// @Roles('SYSTEM_ADMIN','SUPER_ADMIN').
const CircleManagement = lazyRoute(() => import("./pages/CircleManagement"));
const CircleDetail = lazyRoute(() => import("./pages/CircleDetail"));
const CirclePlans = lazyRoute(() => import("./pages/CirclePlans"));
// Escrow Wallet / Ledger / Payout (escrow-service)
const WalletLedger = lazyRoute(() => import("./pages/WalletLedger"));
const Payouts = lazyRoute(() => import("./pages/Payouts"));
// Admin tasks (platform team, admin-service AdminTaskService).
const Tasks = lazyRoute(() => import("./pages/Tasks"));

const queryClient = new QueryClient();

const PageFallback = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
  </div>
);

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <ApolloProvider client={adminClient}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <TokenExpiryMonitor />
            <Suspense fallback={<PageFallback />}>
              <Routes>
              <Route path="/login" element={<Login />} />
              {/* Public: reached from the new-admin welcome email (and the older /reset link). */}
              <Route path="/set-password" element={<SetPassword />} />
              <Route path="/reset" element={<SetPassword />} />
              <Route path="/reset-password" element={<SetPassword />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Index />} />
                {/* Pages scoped portal admins can use (per backend role guards) */}
                <Route path="/communities" element={<Communities />} />
                <Route path="/communities/:id" element={<CommunityDetail />} />
                <Route path="/events" element={<Events />} />
                <Route path="/opportunities" element={<Opportunities />} />
                <Route path="/associations" element={<Associations />} />
                <Route path="/associations/:id" element={<AssociationDetail />} />
                {/* System-admin-only pages — their APIs reject scoped roles */}
                <Route element={<RequireSystemAdmin />}>
                  <Route path="/users" element={<UserManagement />} />
                  <Route path="/users/:id" element={<UserDetail />} />
                  <Route path="/deletion-requests" element={<DeletionRequests />} />
                  <Route path="/kyc" element={<KycVerifications />} />
                  <Route path="/chats" element={<ChatManagement />} />
                  <Route path="/escrow" element={<EscrowManagement />} />
                  {/* Escrow Wallet / Ledger / Payout (escrow-service) */}
                  <Route path="/wallet" element={<WalletLedger />} />
                  <Route path="/payouts" element={<Payouts />} />
                  <Route path="/disputes" element={<DisputesResolution />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<SystemSettings />} />
                  <Route path="/settings/ai" element={<AiConfiguration />} />
                  <Route path="/settings/otp" element={<OtpDeliverySettings />} />
                  <Route path="/notifications" element={<NotificationsBroadcasts />} />
                  <Route path="/audit" element={<AuditLogs />} />
                  <Route path="/support" element={<SupportTicketing />} />
                  <Route path="/support/case-types" element={<CaseTypeConfig />} />
                  <Route path="/moderation" element={<ContentModeration />} />
                  <Route path="/moderation/posts" element={<PostManagement />} />
                  {/* Static segment before the dynamic one so /circles/plans
                      never resolves as a circle id. */}
                  <Route path="/circles" element={<CircleManagement />} />
                  <Route path="/circles/plans" element={<CirclePlans />} />
                  <Route path="/circles/:id" element={<CircleDetail />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/vendors" element={<VendorManagement />} />
                  <Route path="/roles" element={<RolesPermissions />} />
                  <Route path="/health" element={<SystemHealth />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ApolloProvider>
  </ThemeProvider>
);

export default App;
