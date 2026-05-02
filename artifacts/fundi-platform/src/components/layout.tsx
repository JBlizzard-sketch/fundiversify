import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { ShieldCheck, Menu, X, ChevronRight, LogIn, LogOut, User, LayoutDashboard, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Show, useUser, useClerk } from "@clerk/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_LINKS = [
  { href: "/contractors", label: "Find a Pro" },
  { href: "/jobs", label: "Browse Jobs" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/estimate", label: "Estimator" },
  { href: "/pricing", label: "Pricing" },
];

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function UserMenu() {
  const { user } = useUser();
  const { signOut } = useClerk();

  const nameInitials = user
    ? ((user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "")).toUpperCase()
    : "";
  const emailInitial = user?.emailAddresses[0]?.emailAddress?.[0]?.toUpperCase() ?? "";
  const initials = nameInitials || emailInitial || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.imageUrl} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="font-normal">
          <p className="font-medium text-sm truncate">{user?.fullName ?? "My Account"}</p>
          <p className="text-xs text-muted-foreground truncate">
            {user?.emailAddresses[0]?.emailAddress}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/homeowner" className="cursor-pointer flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Homeowner Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/contractor" className="cursor-pointer flex items-center gap-2">
            <User className="h-4 w-4" />
            Pro Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 cursor-pointer flex items-center gap-2"
          onClick={() => signOut({ redirectUrl: `${basePath}/` })}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  function isActive(href: string) {
    return location === href || (href !== "/" && location.startsWith(href));
  }

  function close() {
    setMobileOpen(false);
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <ShieldCheck className="h-6 w-6" />
            <span>FundiVerify</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(href)
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs — auth-aware */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/apply">Apply as Pro</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/jobs/new">Post a Job</Link>
            </Button>
            <div className="h-5 w-px bg-border mx-1" />
            {/* Dual notification bells — homeowner + contractor (demo: both visible) */}
            <div className="flex items-center gap-1">
              <NotificationBell role="homeowner" />
              <NotificationBell role="contractor" />
            </div>
            <ThemeToggle />
            <div className="h-5 w-px bg-border mx-1" />
            <Show when="signed-out">
              <Button variant="outline" size="sm" asChild>
                <Link href="/sign-in">
                  <LogIn className="h-4 w-4 mr-1.5" />
                  Sign In
                </Link>
              </Button>
            </Show>
            <Show when="signed-in">
              <UserMenu />
            </Show>
          </div>

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t bg-background">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1 mt-1">
                Explore
              </p>
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={close}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(href) ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  }`}
                >
                  {label}
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </Link>
              ))}

              <Show when="signed-in">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1 mt-3">
                  Dashboards
                </p>
                <Link
                  href="/dashboard/homeowner"
                  onClick={close}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/dashboard/homeowner") ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  }`}
                >
                  Homeowner Dashboard
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </Link>
                <Link
                  href="/dashboard/contractor"
                  onClick={close}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/dashboard/contractor") ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  }`}
                >
                  Pro Dashboard
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </Link>
              </Show>

              <div className="h-px bg-border my-3" />
              <div className="flex flex-col gap-2">
                <Button variant="outline" asChild onClick={close}>
                  <Link href="/apply">Apply as Pro</Link>
                </Button>
                <Button asChild onClick={close}>
                  <Link href="/jobs/new">Post a Job</Link>
                </Button>
                <Show when="signed-out">
                  <Button variant="ghost" asChild onClick={close}>
                    <Link href="/sign-in">
                      <LogIn className="h-4 w-4 mr-1.5" />
                      Sign In
                    </Link>
                  </Button>
                </Show>
                <Show when="signed-in">
                  <SignOutMobileButton onClose={close} />
                </Show>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/40 py-12">
        <div className="container mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary mb-3">
              <ShieldCheck className="h-5 w-5" />
              <span>FundiVerify</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Building trust infrastructure for the Nairobi home services market. One verified badge at a time.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-sm">For Homeowners</h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link href="/contractors" className="hover:text-primary transition-colors">Find Contractors</Link></li>
              <li><Link href="/jobs/new" className="hover:text-primary transition-colors">Post a Job</Link></li>
              <li><Link href="/estimate" className="hover:text-primary transition-colors">Cost Estimator</Link></li>
              <li><Link href="/dashboard/homeowner" className="hover:text-primary transition-colors">My Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-sm">For Pros</h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link href="/apply" className="hover:text-primary transition-colors">Apply to Join</Link></li>
              <li><Link href="/jobs" className="hover:text-primary transition-colors">Browse Jobs</Link></li>
              <li><Link href="/dashboard/contractor" className="hover:text-primary transition-colors">Pro Dashboard</Link></li>
              <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-sm">Platform</h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link href="/leaderboard" className="hover:text-primary transition-colors">FundiScore™ Leaderboard</Link></li>
              <li><Link href="/admin" className="hover:text-primary transition-colors">Admin Panel</Link></li>
              <li className="text-muted-foreground/60">About Us (coming soon)</li>
              <li className="text-muted-foreground/60">Contact Support (coming soon)</li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-10 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© 2026 FundiVerify. All rights reserved.</span>
          <span>Built for Nairobi. Trusted by Nairobi.</span>
        </div>
      </footer>
    </div>
  );
}

function SignOutMobileButton({ onClose }: { onClose: () => void }) {
  const { signOut } = useClerk();
  return (
    <Button
      variant="ghost"
      className="text-red-600 hover:text-red-700 hover:bg-red-50"
      onClick={() => { onClose(); signOut({ redirectUrl: `${basePath}/` }); }}
    >
      <LogOut className="h-4 w-4 mr-1.5" />
      Sign Out
    </Button>
  );
}
