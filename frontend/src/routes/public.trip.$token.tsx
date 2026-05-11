import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Compass, Calendar, MapPin, Clock, DollarSign } from "lucide-react";
import { format, differenceInDays } from "date-fns";

export const Route = createFileRoute("/public/trip/$token")({
  component: PublicTrip,
});

function PublicTrip() {
  const { token } = Route.useParams();
  const { data: trip, isLoading } = useQuery({
    queryKey: ["public-trip", token],
    queryFn: async () => {
      const { data } = await supabase.from("trips").select("*, stops(*, trip_activities(*), cities(*))").eq("public_token", token).eq("is_public", true).maybeSingle();
      return data;
    },
  });

  if (isLoading) return <div className="min-h-screen grid place-items-center">Loading...</div>;
  if (!trip) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold">Trip not found</h1>
          <p className="text-muted-foreground mt-2">This itinerary is private or doesn't exist.</p>
        </div>
      </div>
    );
  }

  const days = differenceInDays(new Date(trip.end_date), new Date(trip.start_date)) + 1;
  const stops = (trip.stops ?? []).sort((a: any, b: any) => a.sequence - b.sequence);

  return (
    <div className="min-h-screen">
      <header className="glass border-b border-border/40 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-hero grid place-items-center shadow-glow">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl">Traveloop</span>
          </a>
          <a href="/auth" className="text-sm font-medium text-primary hover:underline">Plan your own →</a>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="rounded-3xl overflow-hidden relative aspect-[16/7] shadow-card">
          <img src={trip.cover_url || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1600"} alt={trip.name} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 text-white">
            <div className="flex items-center gap-2 text-sm opacity-90">
              <Calendar className="w-4 h-4" />
              {format(new Date(trip.start_date), "MMM d")} – {format(new Date(trip.end_date), "MMM d, yyyy")}
              <span>·</span><span>{days} days</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-bold mt-1">{trip.name}</h1>
            {trip.description && <p className="opacity-90 mt-1 max-w-2xl">{trip.description}</p>}
          </div>
        </div>

        <div className="mt-8 space-y-5">
          {stops.map((stop: any, idx: number) => (
            <div key={stop.id} className="rounded-2xl bg-card border border-border/60 shadow-card overflow-hidden">
              <div className="p-5 gradient-tropic text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 grid place-items-center font-display font-bold">{idx + 1}</div>
                <div>
                  <h3 className="font-display font-bold text-xl">{stop.cities?.name ?? stop.city_name}</h3>
                  <p className="text-sm opacity-90 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {stop.cities?.country}</p>
                </div>
              </div>
              {stop.trip_activities?.length > 0 && (
                <div className="p-5 space-y-2">
                  {stop.trip_activities.map((a: any) => (
                    <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                      <div className="flex-1">
                        <div className="font-medium">{a.name}</div>
                        <div className="text-xs text-muted-foreground flex flex-wrap gap-3 mt-0.5">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {a.time_slot} · {a.duration_minutes}m</span>
                          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ${Number(a.cost).toFixed(0)}</span>
                          <span className="capitalize px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px]">{a.type}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
