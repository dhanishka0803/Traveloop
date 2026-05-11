import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Compass, LayoutDashboard, MapPin, Plane, User2, BarChart3, LogOut, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/trips", label: "My Trips", icon: Plane },
  { to: "/cities", label: "Explore", icon: MapPin },
  { to: "/admin", label: "Insights", icon: BarChart3 },
  { to: "/profile", label: "Profile", icon: User2 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex w-64 flex-col glass border-r border-border/60 sticky top-0 h-screen">
        <Link to="/dashboard" className="flex items-center gap-2 px-6 py-6">
          <div className="w-9 h-9 rounded-xl gradient-hero grid place-items-center shadow-glow">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl">Traveloop</span>
        </Link>
        <nav className="flex-1 px-3 space-y-1">
          {nav.map((n) => {
            const active = path.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "gradient-hero text-white shadow-soft"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <n.icon className="w-4 h-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border/60">
          <div className="flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground truncate">
            <div className="w-8 h-8 rounded-full gradient-tropic grid place-items-center text-white font-semibold text-xs">
              {user?.email?.[0]?.toUpperCase() ?? "?"}
            </div>
            <span className="truncate flex-1">{user?.email}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
            onClick={async () => { await signOut(); navigate({ to: "/auth" }); }}
          >
            <LogOut className="w-4 h-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile topbar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 glass border-b border-border/60 flex items-center justify-between px-4 py-3">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-hero grid place-items-center">
            <Compass className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold">Traveloop</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>
      {open && (
        <div className="md:hidden fixed top-[57px] inset-x-0 z-40 glass border-b border-border/60 p-3 space-y-1">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-accent"
            >
              <n.icon className="w-4 h-4" /> {n.label}
            </Link>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={async () => { await signOut(); navigate({ to: "/auth" }); }}
          >
            <LogOut className="w-4 h-4 mr-2" /> Sign out
          </Button>
        </div>
      )}

      <main className="flex-1 min-w-0 pt-[64px] md:pt-0">
        {children}
      </main>
    </div>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="w-12 h-12 rounded-full gradient-hero animate-pulse" />
      </div>
    );
  }
  if (!user) {
    navigate({ to: "/auth" });
    return null;
  }
  return <AppShell>{children}</AppShell>;
}
