import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Layout } from "@/components/layout";
import Home from "@/pages/home";
import ContractorsPage from "@/pages/contractors";
import ContractorProfilePage from "@/pages/contractor-profile";
import JobsPage from "@/pages/jobs";
import JobDetailPage from "@/pages/job-detail";
import PostJobPage from "@/pages/post-job";
import EstimatePage from "@/pages/estimate";
import ApplyPage from "@/pages/apply";
import HomeownerDashboard from "@/pages/homeowner-dashboard";
import ContractorDashboard from "@/pages/contractor-dashboard";
import AdminPage from "@/pages/admin";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/contractors" component={ContractorsPage} />
        <Route path="/contractors/:id" component={ContractorProfilePage} />
        <Route path="/jobs" component={JobsPage} />
        <Route path="/jobs/new" component={PostJobPage} />
        <Route path="/jobs/:id" component={JobDetailPage} />
        <Route path="/estimate" component={EstimatePage} />
        <Route path="/apply" component={ApplyPage} />
        <Route path="/dashboard/homeowner" component={HomeownerDashboard} />
        <Route path="/dashboard/contractor" component={ContractorDashboard} />
        <Route path="/admin" component={AdminPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
