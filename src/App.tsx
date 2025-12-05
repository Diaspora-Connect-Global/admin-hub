import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import "@/i18n";
import Index from "./pages/Index";
import EscrowManagement from "./pages/EscrowManagement";
import NotificationsBroadcasts from "./pages/NotificationsBroadcasts";
import Communities from "./pages/Communities";
import CommunityDetail from "./pages/CommunityDetail";
import UserManagement from "./pages/UserManagement";
import Associations from "./pages/Associations";
import AssociationDetail from "./pages/AssociationDetail";
import VendorManagement from "./pages/VendorManagement";
import SupportTicketing from "./pages/SupportTicketing";
import SystemHealth from "./pages/SystemHealth";
import ContentModeration from "./pages/ContentModeration";
import DisputesResolution from "./pages/DisputesResolution";
import SystemSettings from "./pages/SystemSettings";
import AuditLogs from "./pages/AuditLogs";
import RolesPermissions from "./pages/RolesPermissions";
import Reports from "./pages/Reports";
import ChatManagement from "./pages/ChatManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/chats" element={<ChatManagement />} />
            <Route path="/escrow" element={<EscrowManagement />} />
            <Route path="/disputes" element={<DisputesResolution />} />
            <Route path="/communities" element={<Communities />} />
            <Route path="/communities/:id" element={<CommunityDetail />} />
            <Route path="/associations" element={<Associations />} />
            <Route path="/associations/:id" element={<AssociationDetail />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<SystemSettings />} />
            <Route path="/notifications" element={<NotificationsBroadcasts />} />
            <Route path="/audit" element={<AuditLogs />} />
            <Route path="/support" element={<SupportTicketing />} />
            <Route path="/moderation" element={<ContentModeration />} />
            <Route path="/vendors" element={<VendorManagement />} />
            <Route path="/roles" element={<RolesPermissions />} />
            <Route path="/health" element={<SystemHealth />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
