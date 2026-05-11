import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Eye, Pencil, MapPin } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/trips/")({
  component: () => <RequireAuth><TripsList /></RequireAuth>,
});

function TripsList() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: trips = [], isLoading } = useQuery({
    queryKey: ["trips", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips").select("*, stops(count)").eq("user_id", user!.id).order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  async function deleteTrip(id: string) {
    if (!confirm("Delete this trip? This can't be undone.")) return;
    const { error } = await supabase.from("trips").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Trip deleted");
    qc.invalidateQueries({ queryKey: ["trips"] });
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold">My trips</h1>
          <p className="text-muted-foreground mt-1">All your adventures, organized.</p>
        </div>
        <Link to="/trips/new">
          <Button size="lg" className="gradient-hero text-white border-0 shadow-glow">
            <Plus className="w-4 h-4 mr-2" /> New trip
          </Button>
        </Link>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => <div key={i} className="aspect-[5/4] rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : trips.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border p-16 text-center bg-card/50">
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground" />
            <h3 className="font-display font-bold text-xl mt-4">No trips yet</h3>
            <p className="text-muted-foreground mt-1">Plan your first adventure to get started.</p>
            <Link to="/trips/new"><Button className="mt-5 gradient-hero text-white border-0">Create trip</Button></Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {trips.map((t: any) => (
              <div key={t.id} className="card-hover rounded-2xl overflow-hidden shadow-card bg-card border border-border/60">
                <div className="relative aspect-[16/10]">
                  <img
                    src={t.cover_url || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800"}
                    alt={t.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <div className="font-display font-bold text-lg">{t.name}</div>
                    <div className="text-xs opacity-90">
                      {format(new Date(t.start_date), "MMM d")} – {format(new Date(t.end_date), "MMM d, yyyy")}
                    </div>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {t.stops?.[0]?.count ?? 0} stops · {differenceInDays(new Date(t.end_date), new Date(t.start_date)) + 1} days
                  </div>
                  <div className="flex gap-1">
                    <Link to="/trips/$id" params={{ id: t.id }}>
                      <Button size="icon" variant="ghost"><Eye className="w-4 h-4" /></Button>
                    </Link>
                    <Link to="/trips/$id" params={{ id: t.id }}>
                      <Button size="icon" variant="ghost"><Pencil className="w-4 h-4" /></Button>
                    </Link>
                    <Button size="icon" variant="ghost" onClick={() => deleteTrip(t.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
