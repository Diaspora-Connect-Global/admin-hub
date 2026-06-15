import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ApolloProvider } from "@apollo/client/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { adminClient } from "@/services/networks/graphql/admin";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { TokenExpiryMonitor } from "@/components/auth/TokenExpiryMonitor";
import "@/i18n";
// Eager: small, needed immediately
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Lazy-loaded authenticated pages (code-split into separate chunks)
const Index = lazy(() => import("./pages/Index"));
const EscrowManagement = lazy(() => import("./pages/EscrowManagement"));
const NotificationsBroadcasts = lazy(() => import("./pages/NotificationsBroadcasts"));
const Communities = lazy(() => import("./pages/Communities"));
const CommunityDetail = lazy(() => import("./pages/CommunityDetail"));
const Events = lazy(() => import("./pages/Events"));
const Opportunities = lazy(() => import("./pages/Opportunities"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const Associations = lazy(() => import("./pages/Associations"));
const AssociationDetail = lazy(() => import("./pages/AssociationDetail"));
const VendorManagement = lazy(() => import("./pages/VendorManagement"));
const SupportTicketing = lazy(() => import("./pages/SupportTicketing"));
const CaseTypeConfig = lazy(() => import("./pages/CaseTypeConfig"));
const SystemHealth = lazy(() => import("./pages/SystemHealth"));
const ContentModeration = lazy(() => import("./pages/ContentModeration"));
const DisputesResolution = lazy(() => import("./pages/DisputesResolution"));
const SystemSettings = lazy(() => import("./pages/SystemSettings"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const RolesPermissions = lazy(() => import("./pages/RolesPermissions"));
const Reports = lazy(() => import("./pages/Reports"));
const ChatManagement = lazy(() => import("./pages/ChatManagement"));
const AiConfiguration = lazy(() => import("./pages/AiConfiguration"));
const PaymentProviderKeys = lazy(() => import("./pages/PaymentProviderKeys"));
const KycProviderKeys = lazy(() => import("./pages/KycProviderKeys"));
// Escrow Wallet / Ledger / Payout (escrow-service)
const WalletLedger = lazy(() => import("./pages/WalletLedger"));
const Payouts = lazy(() => import("./pages/Payouts"));

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
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Index />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/chats" element={<ChatManagement />} />
                <Route path="/escrow" element={<EscrowManagement />} />
                {/* Escrow Wallet / Ledger / Payout (escrow-service) */}
                <Route path="/wallet" element={<WalletLedger />} />
                <Route path="/payouts" element={<Payouts />} />
                <Route path="/disputes" element={<DisputesResolution />} />
                <Route path="/communities" element={<Communities />} />
                <Route path="/communities/:id" element={<CommunityDetail />} />
                <Route path="/events" element={<Events />} />
                <Route path="/opportunities" element={<Opportunities />} />
                <Route path="/associations" element={<Associations />} />
                <Route path="/associations/:id" element={<AssociationDetail />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<SystemSettings />} />
                <Route path="/settings/ai" element={<AiConfiguration />} />
                <Route path="/settings/payment-keys" element={<PaymentProviderKeys />} />
                <Route path="/settings/kyc-keys" element={<KycProviderKeys />} />
                <Route path="/notifications" element={<NotificationsBroadcasts />} />
                <Route path="/audit" element={<AuditLogs />} />
                <Route path="/support" element={<SupportTicketing />} />
                <Route path="/support/case-types" element={<CaseTypeConfig />} />
                <Route path="/moderation" element={<ContentModeration />} />
                <Route path="/vendors" element={<VendorManagement />} />
                <Route path="/roles" element={<RolesPermissions />} />
                <Route path="/health" element={<SystemHealth />} />
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
