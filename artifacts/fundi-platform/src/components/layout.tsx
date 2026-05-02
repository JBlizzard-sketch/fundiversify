import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { ShieldCheck, Menu, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/contractors", label: "Find a Pro" },
  { href: "/jobs", label: "Browse Jobs" },
  { href: "/estimate", label: "Estimator" },
];
const DASHBOARD_LINKS = [
  { href: "/dashboard/homeowner", label: "Homeowner Dashboard" },
  { href: "/dashboard/contractor", label: "Pro Dashboard" },
];

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
            <div className="h-5 w-px bg-border mx-2" />
            {DASHBOARD_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/apply">Apply as Pro</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/jobs/new">Post a Job</Link>
            </Button>
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
                Homeowners
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

              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1 mt-3">
                Dashboards
              </p>
              {DASHBOARD_LINKS.map(({ href, label }) => (
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

              <div className="h-px bg-border my-3" />
              <div className="flex flex-col gap-2">
                <Button variant="outline" asChild onClick={close}>
                  <Link href="/apply">Apply as Pro</Link>
                </Button>
                <Button asChild onClick={close}>
                  <Link href="/jobs/new">Post a Job</Link>
                </Button>
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
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-sm">Platform</h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
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
