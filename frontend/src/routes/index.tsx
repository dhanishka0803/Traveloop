import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Compass, Sparkles, Map, Wallet, Share2, Backpack, Globe2 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Traveloop — Plan colorful trips, together" },
      { name: "description", content: "Build itineraries, track budgets, pack smart, and share your adventures with Traveloop." },
    ],
  }),
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-30 glass border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-hero grid place-items-center shadow-glow">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl">Traveloop</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/auth"><Button variant="ghost">Sign in</Button></Link>
            <Link to="/auth">
              <Button className="gradient-hero text-white shadow-glow border-0 hover:opacity-95">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            Your next trip, beautifully planned
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold leading-[1.05]">
            Plan trips you'll <span className="text-gradient">actually love</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Itineraries, budgets, packing lists, and shareable plans — all in one vibrant workspace built for explorers.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link to="/auth">
              <Button size="lg" className="gradient-hero text-white shadow-glow border-0 px-8 h-12 text-base">
                Start planning free
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base">See demo</Button>
            </Link>
          </div>
        </div>

        {/* Floating preview cards */}
        <div className="max-w-5xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-5">
          {[
            { city: "Tokyo", days: "5 days", img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600", grad: "gradient-sunset" },
            { city: "Bali", days: "8 days", img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600", grad: "gradient-tropic" },
            { city: "Paris", days: "4 days", img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600", grad: "gradient-ocean" },
          ].map((c, i) => (
            <div key={i} className="card-hover relative rounded-3xl overflow-hidden shadow-card aspect-[4/5]">
              <img src={c.img} alt={c.city} className="absolute inset-0 w-full h-full object-cover" />
              <div className={`absolute inset-0 ${c.grad} opacity-40 mix-blend-multiply`} />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <div className="text-xs uppercase tracking-wider opacity-80">{c.days}</div>
                <div className="text-2xl font-display font-bold">{c.city}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-5">
        {[
          { icon: Map, title: "Itinerary builder", desc: "Drag stops, add cities, plan day-by-day." },
          { icon: Wallet, title: "Smart budgeting", desc: "Live cost breakdowns and over-budget alerts." },
          { icon: Backpack, title: "Packing assistant", desc: "Auto-generated lists from your activities." },
          { icon: Share2, title: "Public itineraries", desc: "Share trips via signed public links." },
          { icon: Globe2, title: "City explorer", desc: "Browse cost index and popularity per city." },
          { icon: Sparkles, title: "Beautiful by default", desc: "Designed to feel as fun as the trip itself." },
        ].map((f, i) => (
          <div key={i} className="rounded-2xl bg-card p-6 shadow-card card-hover border border-border/60">
            <div className="w-11 h-11 rounded-xl gradient-hero grid place-items-center mb-4">
              <f.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-display font-semibold text-lg">{f.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        Built with love by Traveloop
      </footer>
    </div>
  );
}
