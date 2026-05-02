import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/Sidebar";
import Home from "@/pages/Home";
import PostDetail from "@/pages/PostDetail";
import Profile from "@/pages/Profile";
import Leaderboard from "@/pages/Leaderboard";
import CreatePost from "@/pages/CreatePost";
import Events from "@/pages/Events";
import HelpRequests from "@/pages/HelpRequests";
import Community from "@/pages/Community";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <div className="min-h-[100dvh] flex bg-background text-foreground">
      <Sidebar />

      {/* Main content — offset for sidebar on desktop, top/bottom bars on mobile */}
      <main className="flex-1 md:ml-72 flex flex-col min-h-[100dvh] pb-16 md:pb-0 pt-0 md:pt-0">
        {/* Mobile top bar spacer */}
        <div className="md:hidden h-14" />

        <div className="flex-1 w-full">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/post/:id" component={PostDetail} />
            <Route path="/profile/:id" component={Profile} />
            <Route path="/leaderboard" component={Leaderboard} />
            <Route path="/create" component={CreatePost} />
            <Route path="/events" component={Events} />
            <Route path="/help" component={HelpRequests} />
            <Route path="/community" component={Community} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
    </div>
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
