import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Layout } from "@/components/layout";
import { ThemeProvider } from "@/lib/theme";
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
import PricingPage from "@/pages/pricing";
import TradeLandingPage from "@/pages/trade-landing";
import LeaderboardPage from "@/pages/leaderboard";
import ReviewsPage from "@/pages/reviews";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(153 38% 30%)",
    colorForeground: "hsl(20 14% 10%)",
    colorMutedForeground: "hsl(20 10% 45%)",
    colorDanger: "hsl(0 72% 51%)",
    colorBackground: "hsl(40 20% 98%)",
    colorInput: "hsl(40 20% 95%)",
    colorInputForeground: "hsl(20 14% 10%)",
    colorNeutral: "hsl(20 10% 70%)",
    fontFamily: "'Inter', system-ui, sans-serif",
    borderRadius: "0.625rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-foreground font-bold",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-foreground font-medium text-sm",
    footerActionLink: "text-primary hover:text-primary/80 font-medium",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground text-xs",
    identityPreviewEditButton: "text-primary",
    formFieldSuccessText: "text-green-600",
    alertText: "text-foreground",
    logoBox: "flex justify-center mb-1",
    logoImage: "h-12 w-12",
    socialButtonsBlockButton: "border border-border bg-background hover:bg-muted transition-colors",
    formButtonPrimary: "bg-primary hover:bg-primary/90 text-white transition-colors",
    formFieldInput: "border-border bg-background text-foreground",
    footerAction: "bg-muted/40",
    dividerLine: "bg-border",
    alert: "border border-border",
    otpCodeFieldInput: "border-border",
    formFieldRow: "",
    main: "",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
      />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsub = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsub;
  }, [addListener, qc]);

  return null;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route path="/contractors" component={ContractorsPage} />
        <Route path="/contractors/:id" component={ContractorProfilePage} />
        <Route path="/jobs" component={JobsPage} />
        <Route path="/jobs/new" component={PostJobPage} />
        <Route path="/jobs/:id" component={JobDetailPage} />
        <Route path="/estimate" component={EstimatePage} />
        <Route path="/apply" component={ApplyPage} />
        <Route path="/dashboard/homeowner" component={HomeownerDashboard} />
        <Route path="/dashboard/contractor" component={ContractorDashboard} />
        <Route path="/pricing" component={PricingPage} />
        <Route path="/hire/:trade/:location" component={TradeLandingPage} />
        <Route path="/hire/:trade" component={TradeLandingPage} />
        <Route path="/leaderboard" component={LeaderboardPage} />
        <Route path="/reviews" component={ReviewsPage} />
        <Route path="/admin" component={AdminPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey!}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to your FundiVerify account",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Join Nairobi's trusted contractor marketplace",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
    </ThemeProvider>
  );
}

export default App;
