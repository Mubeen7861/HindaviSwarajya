import { useEffect, useRef } from "react";
import { Switch, Route, Redirect, useLocation, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, Show, useClerk } from "@clerk/react";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/Sidebar";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import PostDetail from "@/pages/PostDetail";
import Profile from "@/pages/Profile";
import Leaderboard from "@/pages/Leaderboard";
import CreatePost from "@/pages/CreatePost";
import Events from "@/pages/Events";
import HelpRequests from "@/pages/HelpRequests";
import Community from "@/pages/Community";
import Admin from "@/pages/Admin";
import SignInPage from "@/pages/SignInPage";
import SignUpPage from "@/pages/SignUpPage";
import NotFound from "@/pages/not-found";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL as string | undefined;

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#FF6F00",
    colorForeground: "#111827",
    colorMutedForeground: "#6B7280",
    colorDanger: "#DC2626",
    colorBackground: "#FFFFFF",
    colorInput: "#F9FAFB",
    colorInputForeground: "#111827",
    colorNeutral: "#E5E7EB",
    fontFamily: "inherit",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-gray-100",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-gray-900 font-bold font-serif",
    headerSubtitle: "text-gray-500",
    socialButtonsBlockButtonText: "text-gray-700 font-medium",
    formFieldLabel: "text-gray-700 font-medium",
    footerActionLink: "text-[#FF6F00] font-semibold hover:text-[#E65100]",
    footerActionText: "text-gray-500",
    dividerText: "text-gray-400",
    identityPreviewEditButton: "text-[#FF6F00]",
    formFieldSuccessText: "text-green-600",
    alertText: "text-gray-700",
    logoBox: "flex justify-center",
    logoImage: "w-12 h-12",
    socialButtonsBlockButton: "border border-gray-200 bg-white hover:bg-gray-50",
    formButtonPrimary: "bg-[#FF6F00] hover:bg-[#E65100] text-white font-semibold",
    formFieldInput: "bg-gray-50 border-gray-200 text-gray-900 rounded-xl",
    footerAction: "bg-gray-50 border-t border-gray-100",
    dividerLine: "bg-gray-200",
    alert: "border border-red-100 bg-red-50 rounded-xl",
    otpCodeFieldInput: "border-gray-200 bg-gray-50 text-gray-900",
    formFieldRow: "gap-3",
    main: "p-6",
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

/** Full app layout with sidebar — only for authenticated users */
function AppLayout() {
  return (
    <div className="min-h-[100dvh] flex bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 md:ml-72 flex flex-col min-h-[100dvh] pb-16 md:pb-0">
        <div className="md:hidden h-14" />
        <div className="flex-1 w-full">
          <Switch>
            <Route path="/app" component={Home} />
            <Route path="/app/post/:id" component={PostDetail} />
            <Route path="/app/profile/:id" component={Profile} />
            <Route path="/app/leaderboard" component={Leaderboard} />
            <Route path="/app/create" component={CreatePost} />
            <Route path="/app/events" component={Events} />
            <Route path="/app/help" component={HelpRequests} />
            <Route path="/app/community" component={Community} />
            <Route path="/app/admin" component={Admin} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
    </div>
  );
}

/** Root: landing for guests, redirect to /app for signed-in */
function HomeRoute() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/app" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

/** /app and sub-paths: app for signed-in, redirect to / for guests */
function AppRoute() {
  return (
    <>
      <Show when="signed-in">
        <AppLayout />
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to continue your seva journey",
          },
        },
        signUp: {
          start: {
            title: "Join HindaviSwarajya",
            subtitle: "Start your seva journey today",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRoute} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/app/*?" component={AppRoute} />
            <Route component={NotFound} />
          </Switch>
        </TooltipProvider>
        <Toaster />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
