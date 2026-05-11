import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { MapPin, TrendingUp, DollarSign, Search } from "lucide-react";

export const Route = createFileRoute("/cities")({
  component: () => <RequireAuth><Cities /></RequireAuth>,
});

function Cities() {
  const [q, setQ] = useState("");
  const { data: cities = [] } = useQuery({
    queryKey: ["cities-all"],
    queryFn: async () => (await supabase.from("cities").select("*").order("popularity", { ascending: false })).data ?? [],
  });
  const filtered = cities.filter((c: any) =>
    c.name.toLowerCase().includes(q.toLowerCase()) || c.country.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-display font-bold">Explore destinations</h1>
      <p className="text-muted-foreground mt-1">{cities.length} cities to inspire your next trip.</p>

      <div className="relative mt-6 max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search cities or countries..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-10 h-11" />
      </div>

      <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((c: any) => (
          <div key={c.id} className="card-hover rounded-2xl overflow-hidden bg-card border border-border/60 shadow-card">
            <div className="relative aspect-[16/10]">
              <img src={c.image_url ?? ""} alt={c.name} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <div className="font-display font-bold text-xl">{c.name}</div>
                <div className="text-sm flex items-center gap-1 opacity-90"><MapPin className="w-3.5 h-3.5" /> {c.country}</div>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-muted-foreground">{c.description}</p>
              <div className="flex items-center justify-between gap-2 mt-3 text-xs">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/10 text-secondary">
                  <DollarSign className="w-3 h-3" /> Cost {c.cost_index}/100
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                  <TrendingUp className="w-3 h-3" /> Popular {c.popularity}%
                </div>
              </div>
              <Link to="/trips/new" className="mt-3 inline-flex w-full items-center justify-center px-4 py-2 rounded-xl gradient-hero text-white text-sm font-medium shadow-soft hover:opacity-95">
                Add to trip
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
