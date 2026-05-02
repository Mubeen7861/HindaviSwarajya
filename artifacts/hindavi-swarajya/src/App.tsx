import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/Navigation";
import Home from "@/pages/Home";
import PostDetail from "@/pages/PostDetail";
import Profile from "@/pages/Profile";
import Leaderboard from "@/pages/Leaderboard";
import CreatePost from "@/pages/CreatePost";
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
    <main className="min-h-[100dvh] flex flex-col bg-background text-foreground pb-20 md:pb-0">
      <Navigation />
      <div className="flex-1 w-full relative">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/post/:id" component={PostDetail} />
          <Route path="/profile/:id" component={Profile} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/create" component={CreatePost} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </main>
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
