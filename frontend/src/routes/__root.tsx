import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";
import appCss from "../styles.css?url";

function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="text-7xl font-display font-bold text-gradient">404</div>
        <p className="mt-3 text-muted-foreground">This destination doesn't exist on our map.</p>
        <Link to="/" className="inline-block mt-6 px-5 py-2.5 rounded-xl gradient-hero text-white font-medium shadow-glow">Back home</Link>
      </div>
    </div>
  );
}

function ErrorBoundary({ error }: { error: Error }) {
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-display font-bold">Something went off course</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <Link to="/" className="inline-block mt-6 px-5 py-2.5 rounded-xl gradient-hero text-white font-medium">Go home</Link>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Traveloop — Plan trips you'll love" },
      { name: "description", content: "Personalized travel planning: build itineraries, track budgets, pack smart, and share trips." },
      { property: "og:title", content: "Traveloop — Plan trips you'll love" },
      { property: "og:description", content: "Personalized travel planning made colorful." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: ErrorBoundary,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
