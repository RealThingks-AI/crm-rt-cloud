import { Toaster } from "@/components/common/ui/toaster";
import { Toaster as Sonner } from "@/components/common/ui/sonner";
import { TooltipProvider } from "@/components/common/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/supabase/auth";
import { SidebarProvider } from "@/components/common/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Dashboard from "@/modules/dashboard/pages";
import Contacts from "@/modules/contacts/pages";
import Leads from "@/modules/leads/pages";
import Meetings from "@/modules/meetings/pages";
import DealsPage from "./pages/DealsPage";
import Feeds from "./pages/Feeds";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/*" element={
              <SidebarProvider>
                <div className="min-h-screen flex w-full">
                  <AppSidebar />
                  <main className="flex-1 bg-background">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/contacts" element={<Contacts />} />
                      <Route path="/leads" element={<Leads />} />
                      <Route path="/meetings" element={<Meetings />} />
                      <Route path="/deals" element={<DealsPage />} />
                      <Route path="/feeds" element={<Feeds />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                </div>
              </SidebarProvider>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
