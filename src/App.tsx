import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ComingSoon from "./pages/ComingSoon";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/users" element={<ComingSoon title="User Management" />} />
          <Route path="/escrow" element={<ComingSoon title="Escrow Management" />} />
          <Route path="/disputes" element={<ComingSoon title="Disputes & Resolution" />} />
          <Route path="/approvals" element={<ComingSoon title="Approvals & Onboarding" />} />
          <Route path="/reports" element={<ComingSoon title="Reports & Analytics" />} />
          <Route path="/settings" element={<ComingSoon title="System Settings" />} />
          <Route path="/notifications" element={<ComingSoon title="Notifications & Broadcasts" />} />
          <Route path="/audit" element={<ComingSoon title="Audit Logs" />} />
          <Route path="/support" element={<ComingSoon title="Support & Ticketing" />} />
          <Route path="/moderation" element={<ComingSoon title="Content Moderation" />} />
          <Route path="/vendors" element={<ComingSoon title="Vendor Management" />} />
          <Route path="/roles" element={<ComingSoon title="Roles & Permissions" />} />
          <Route path="/health" element={<ComingSoon title="System Health" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
