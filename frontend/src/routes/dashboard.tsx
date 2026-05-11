import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Plane, MapPin, Calendar, Wallet, TrendingUp } from "lucide-react";
import { format, differenceInDays } from "date-fns";

export const Route = createFileRoute("/dashboard")({
  component: () => <RequireAuth><Dashboard /></RequireAuth>,
});

function Dashboard() {
  const { user } = useAuth();

  const { data: trips = [] } = useQuery({
    queryKey: ["trips", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("trips").select("*").eq("user_id", user!.id).order("start_date");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: cities = [] } = useQuery({
    queryKey: ["popular-cities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cities").select("*").order("popularity", { ascending: false }).limit(6);
      if (error) throw error;
      return data;
    },
  });

  const upcoming = trips.filter((t) => new Date(t.end_date) >= new Date());
  const totalBudget = trips.reduce((s, t) => s + Number(t.budget ?? 0), 0);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Hero header */}
      <div className="rounded-3xl gradient-hero p-8 md:p-10 text-white shadow-glow relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-white/80 text-sm">Welcome back ✨</p>
          <h1 className="text-3xl md:text-4xl font-display font-bold mt-1">
            Ready for your next adventure?
          </h1>
          <p className="text-white/85 mt-2 max-w-lg">
            You have {upcoming.length} upcoming {upcoming.length === 1 ? "trip" : "trips"} planned. Let's make them unforgettable.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/trips/new">
              <Button size="lg" className="bg-white text-foreground hover:bg-white/90 border-0 shadow-lift">
                <Plus className="w-4 h-4 mr-2" /> Plan new trip
              </Button>
            </Link>
            <Link to="/cities">
              <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                Explore cities
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <StatCard icon={Plane} label="Total trips" value={trips.length} grad="gradient-sunset" />
        <StatCard icon={Calendar} label="Upcoming" value={upcoming.length} grad="gradient-tropic" />
        <StatCard icon={Wallet} label="Total budget" value={`$${totalBudget.toFixed(0)}`} grad="gradient-ocean" />
        <StatCard icon={TrendingUp} label="Cities saved" value={cities.length} grad="gradient-hero" />
      </div>

      {/* Upcoming trips */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-display font-bold">Upcoming trips</h2>
          <Link to="/trips" className="text-sm text-primary hover:underline">View all →</Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center bg-card/50">
            <Plane className="w-10 h-10 mx-auto text-muted-foreground" />
            <p className="mt-3 font-medium">No trips yet</p>
            <p className="text-sm text-muted-foreground">Start by creating your first adventure.</p>
            <Link to="/trips/new"><Button className="mt-4 gradient-hero text-white border-0">Plan a trip</Button></Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {upcoming.slice(0, 6).map((t) => (
              <Link key={t.id} to="/trips/$id" params={{ id: t.id }} className="group">
                <div className="card-hover relative rounded-2xl overflow-hidden shadow-card aspect-[5/4] bg-card">
                  <img
                    src={t.cover_url || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800"}
                    alt={t.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <div className="text-xs uppercase tracking-wider opacity-80">
                      {format(new Date(t.start_date), "MMM d")} – {format(new Date(t.end_date), "MMM d")}
                    </div>
                    <div className="text-xl font-display font-bold">{t.name}</div>
                    <div className="text-xs opacity-80 mt-0.5">
                      {differenceInDays(new Date(t.end_date), new Date(t.start_date)) + 1} days
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Popular cities */}
      <section className="mt-12">
        <h2 className="text-2xl font-display font-bold mb-4">Popular destinations</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {cities.map((c) => (
            <Link key={c.id} to="/cities" className="group">
              <div className="card-hover rounded-2xl overflow-hidden shadow-card aspect-square relative">
                <img src={c.image_url ?? ""} alt={c.name} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                  <div className="font-display font-bold text-sm">{c.name}</div>
                  <div className="text-xs opacity-80 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {c.country}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, grad }: any) {
  return (
    <div className="rounded-2xl bg-card p-5 shadow-card border border-border/60">
      <div className={`w-10 h-10 rounded-xl ${grad} grid place-items-center`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="mt-3 text-2xl font-display font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
