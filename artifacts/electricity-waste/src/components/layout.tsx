import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Activity, LayoutDashboard, Cpu, AlertTriangle, Zap, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/devices", label: "Devices", icon: Cpu },
  { href: "/alerts", label: "Alerts", icon: AlertTriangle },
  { href: "/readings", label: "Readings", icon: Zap },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Dark mode preferred
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground selection:bg-primary/20">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-border bg-sidebar md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <Activity className="h-6 w-6 text-primary" />
          <span className="font-bold tracking-tight">VoltWatch</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border text-xs text-muted-foreground">
          System Status: <span className="text-emerald-500 font-mono">ONLINE</span>
        </div>
      </aside>

      {/* Mobile Sidebar & Header */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 md:hidden">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="font-bold tracking-tight">VoltWatch</span>
          </div>
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-16 items-center gap-2 border-b border-border px-6">
                <Activity className="h-6 w-6 text-primary" />
                <span className="font-bold tracking-tight">VoltWatch</span>
              </div>
              <nav className="flex-1 space-y-1 p-4">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href;
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                      <div
                        className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
