import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Trophy, PlusCircle, User as UserIcon } from "lucide-react";
import { CURRENT_USER_ID } from "@/lib/constants";

export function Navigation() {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-md group-hover:bg-orange-600 transition-colors">
            <Trophy className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-primary tracking-tight font-serif" data-testid="nav-brand">
            हिंदवी स्वराज्य
          </span>
        </Link>

        <nav className="flex items-center gap-1 md:gap-2">
          <Link href="/app">
            <Button
              variant={location === "/app" ? "default" : "ghost"}
              size="sm"
              className="hidden md:flex gap-2"
              data-testid="nav-home"
            >
              <Home className="w-4 h-4" /> Feed
            </Button>
          </Link>
          <Link href="/app/leaderboard">
            <Button
              variant={location === "/app/leaderboard" ? "default" : "ghost"}
              size="sm"
              className="hidden md:flex gap-2"
              data-testid="nav-leaderboard"
            >
              <Trophy className="w-4 h-4" /> Leaderboard
            </Button>
          </Link>
          <Link href="/app/create">
            <Button
              variant={location === "/app/create" ? "default" : "ghost"}
              size="sm"
              className="gap-2"
              data-testid="nav-create"
            >
              <PlusCircle className="w-4 h-4" /> <span className="hidden sm:inline">Create Seva</span>
            </Button>
          </Link>
          <Link href={`/app/profile/${CURRENT_USER_ID}`}>
            <Button
              variant={location === `/app/profile/${CURRENT_USER_ID}` ? "default" : "ghost"}
              size="sm"
              className="gap-2"
              data-testid="nav-profile"
            >
              <UserIcon className="w-4 h-4" />
            </Button>
          </Link>
        </nav>
      </div>
      
      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background flex justify-around p-2 z-50 pb-safe">
        <Link href="/app">
          <Button variant={location === "/app" ? "default" : "ghost"} size="icon" className="w-12 h-12 rounded-full">
            <Home className="w-5 h-5" />
          </Button>
        </Link>
        <Link href="/app/leaderboard">
          <Button variant={location === "/app/leaderboard" ? "default" : "ghost"} size="icon" className="w-12 h-12 rounded-full">
            <Trophy className="w-5 h-5" />
          </Button>
        </Link>
        <Link href={`/app/profile/${CURRENT_USER_ID}`}>
          <Button variant={location === `/app/profile/${CURRENT_USER_ID}` ? "default" : "ghost"} size="icon" className="w-12 h-12 rounded-full">
            <UserIcon className="w-5 h-5" />
          </Button>
        </Link>
      </div>
    </header>
  );
}
