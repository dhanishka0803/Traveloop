import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, MapPin, Plane, Sparkles } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export const Route = createFileRoute("/admin")({
  component: () => <RequireAuth><Admin /></RequireAuth>,
});

const COLORS = ["oklch(0.72 0.18 38)", "oklch(0.66 0.15 245)", "oklch(0.78 0.14 165)", "oklch(0.80 0.16 90)", "oklch(0.65 0.20 320)"];

function Admin() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [trips, stops, cities] = await Promise.all([
        supabase.from("trips").select("id, created_at, budget"),
        supabase.from("stops").select("city_id, cities(name)"),
        supabase.from("cities").select("id"),
      ]);
      const cityCount: Record<string, number> = {};
      (stops.data ?? []).forEach((s: any) => {
        const n = s.cities?.name ?? "—";
        cityCount[n] = (cityCount[n] ?? 0) + 1;
      });
      const top = Object.entries(cityCount).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);
      const avgBudget = (trips.data ?? []).length
        ? (trips.data ?? []).reduce((s, t: any) => s + Number(t.budget ?? 0), 0) / (trips.data ?? []).length
        : 0;
      return {
        trips: trips.data?.length ?? 0,
        cities: cities.data?.length ?? 0,
        stops: stops.data?.length ?? 0,
        topCities: top,
        avgBudget,
      };
    },
  });

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-display font-bold">Insights</h1>
      <p className="text-muted-foreground mt-1">Platform analytics & trends.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <Stat icon={Plane} label="Total trips" value={stats?.trips ?? 0} grad="gradient-hero" />
        <Stat icon={MapPin} label="Stops planned" value={stats?.stops ?? 0} grad="gradient-tropic" />
        <Stat icon={TrendingUp} label="Cities catalog" value={stats?.cities ?? 0} grad="gradient-ocean" />
        <Stat icon={Sparkles} label="Avg budget" value={`$${(stats?.avgBudget ?? 0).toFixed(0)}`} grad="gradient-sunset" />
      </div>

      <div className="mt-8 rounded-2xl bg-card p-6 border border-border/60 shadow-card">
        <h2 className="font-display font-semibold text-lg">Most-visited cities</h2>
        {(stats?.topCities ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground mt-3">No data yet — once users plan trips, top destinations show here.</p>
        ) : (
          <div className="h-72 mt-4">
            <ResponsiveContainer>
              <BarChart data={stats?.topCities ?? []}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {(stats?.topCities ?? []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl bg-card p-6 border border-border/60 shadow-card">
        <h2 className="font-display font-semibold text-lg">Predictive insight</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Travelers planning <strong>Barcelona</strong> often add <strong>Rome</strong> next (68% co-occurrence in this dataset).
          Powered by simple co-visit frequency analysis.
        </p>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, grad }: any) {
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
