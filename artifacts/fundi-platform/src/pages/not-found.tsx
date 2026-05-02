import { Link } from "wouter";
import { ShieldCheck, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="mb-6 h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
        <ShieldCheck className="h-10 w-10 text-primary opacity-50" />
      </div>
      <h1 className="text-6xl font-bold text-primary mb-2">404</h1>
      <h2 className="text-xl font-semibold mb-3">Page Not Found</h2>
      <p className="text-muted-foreground max-w-sm mb-8">
        This page doesn't exist or may have been moved. Let's get you back on track.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/contractors">
            <Search className="h-4 w-4 mr-2" />
            Find a Pro
          </Link>
        </Button>
      </div>
    </div>
  );
}
