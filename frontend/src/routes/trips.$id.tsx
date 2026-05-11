import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { RequireAuth } from "@/components/AppShell";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft, Plus, Trash2, Share2, Copy, Calendar, MapPin, Wallet, Backpack,
  StickyNote, Clock, DollarSign, Sparkles, Leaf,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export const Route = createFileRoute("/trips/$id")({
  component: () => <RequireAuth><TripDetail /></RequireAuth>,
});

const ACTIVITY_TYPES = ["culture", "food", "nature", "adventure", "nightlife", "leisure"];
const EXPENSE_CATS = ["transport", "stay", "activities", "meals", "other"];
const PACK_CATS = ["clothing", "toiletries", "electronics", "documents", "other"];
const COLORS = ["oklch(0.72 0.18 38)", "oklch(0.66 0.15 245)", "oklch(0.78 0.14 165)", "oklch(0.80 0.16 90)", "oklch(0.65 0.20 320)"];

function TripDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: trip, isLoading } = useQuery({
    queryKey: ["trip", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("trips").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: stops = [] } = useQuery({
    queryKey: ["stops", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stops").select("*, trip_activities(*), cities(*)").eq("trip_id", id).order("sequence");
      if (error) throw error;
      return data;
    },
  });

  const { data: cities = [] } = useQuery({
    queryKey: ["cities-all"],
    queryFn: async () => (await supabase.from("cities").select("*").order("name")).data ?? [],
  });

  if (isLoading || !trip) return <div className="p-10">Loading...</div>;

  const days = differenceInDays(new Date(trip.end_date), new Date(trip.start_date)) + 1;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <Link to="/trips" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to trips
      </Link>

      {/* Hero */}
      <div className="rounded-3xl overflow-hidden relative shadow-card aspect-[16/6] min-h-[200px]">
        <img
          src={trip.cover_url || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1600"}
          alt={trip.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 text-white">
          <div className="flex items-center gap-2 text-sm opacity-90">
            <Calendar className="w-4 h-4" />
            {format(new Date(trip.start_date), "MMM d")} – {format(new Date(trip.end_date), "MMM d, yyyy")}
            <span>·</span>
            <span>{days} days</span>
            <span>·</span>
            <span>{stops.length} stops</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold mt-1">{trip.name}</h1>
          {trip.description && <p className="opacity-90 mt-1 max-w-2xl">{trip.description}</p>}
        </div>
      </div>

      <Tabs defaultValue="itinerary" className="mt-6">
        <TabsList className="bg-card border border-border/60 p-1 h-auto flex-wrap">
          <TabsTrigger value="itinerary" className="data-[state=active]:gradient-hero data-[state=active]:text-white">
            <MapPin className="w-4 h-4 mr-1.5" /> Itinerary
          </TabsTrigger>
          <TabsTrigger value="budget" className="data-[state=active]:gradient-hero data-[state=active]:text-white">
            <Wallet className="w-4 h-4 mr-1.5" /> Budget
          </TabsTrigger>
          <TabsTrigger value="packing" className="data-[state=active]:gradient-hero data-[state=active]:text-white">
            <Backpack className="w-4 h-4 mr-1.5" /> Packing
          </TabsTrigger>
          <TabsTrigger value="notes" className="data-[state=active]:gradient-hero data-[state=active]:text-white">
            <StickyNote className="w-4 h-4 mr-1.5" /> Notes
          </TabsTrigger>
          <TabsTrigger value="share" className="data-[state=active]:gradient-hero data-[state=active]:text-white">
            <Share2 className="w-4 h-4 mr-1.5" /> Share
          </TabsTrigger>
        </TabsList>

        <TabsContent value="itinerary" className="mt-6">
          <ItineraryTab trip={trip} stops={stops} cities={cities} qc={qc} />
        </TabsContent>
        <TabsContent value="budget" className="mt-6">
          <BudgetTab trip={trip} stops={stops} qc={qc} />
        </TabsContent>
        <TabsContent value="packing" className="mt-6">
          <PackingTab tripId={trip.id} stops={stops} qc={qc} />
        </TabsContent>
        <TabsContent value="notes" className="mt-6">
          <NotesTab tripId={trip.id} stops={stops} qc={qc} />
        </TabsContent>
        <TabsContent value="share" className="mt-6">
          <ShareTab trip={trip} qc={qc} onDeleted={() => navigate({ to: "/trips" })} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* -------------------- Itinerary tab -------------------- */
function ItineraryTab({ trip, stops, cities, qc }: any) {
  const [adding, setAdding] = useState(false);
  const [newStop, setNewStop] = useState({ city_id: "", start_date: trip.start_date, end_date: trip.start_date });

  async function addStop() {
    if (!newStop.city_id) return toast.error("Pick a city");
    const city = cities.find((c: any) => c.id === newStop.city_id);
    const { error } = await supabase.from("stops").insert({
      trip_id: trip.id, city_id: newStop.city_id, city_name: city?.name,
      start_date: newStop.start_date, end_date: newStop.end_date, sequence: stops.length,
    });
    if (error) return toast.error(error.message);
    toast.success("Stop added");
    setAdding(false);
    qc.invalidateQueries({ queryKey: ["stops", trip.id] });
  }

  async function removeStop(id: string) {
    const { error } = await supabase.from("stops").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["stops", trip.id] });
  }

  return (
    <div className="space-y-5">
      {stops.length === 0 && !adding && (
        <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center bg-card/50">
          <MapPin className="w-10 h-10 mx-auto text-muted-foreground" />
          <p className="font-medium mt-3">No stops yet</p>
          <p className="text-sm text-muted-foreground">Add cities to start building your route.</p>
          <Button onClick={() => setAdding(true)} className="mt-4 gradient-hero text-white border-0">
            <Plus className="w-4 h-4 mr-1" /> Add first stop
          </Button>
        </div>
      )}

      {stops.map((stop: any, idx: number) => (
        <StopCard key={stop.id} stop={stop} idx={idx} qc={qc} tripId={trip.id} onRemove={() => removeStop(stop.id)} />
      ))}

      {adding ? (
        <div className="rounded-2xl bg-card p-5 border border-border/60 shadow-card space-y-3">
          <h4 className="font-display font-semibold">Add a stop</h4>
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <Label>City</Label>
              <Select value={newStop.city_id} onValueChange={(v) => setNewStop({ ...newStop, city_id: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select city" /></SelectTrigger>
                <SelectContent>{cities.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}, {c.country}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Arrive</Label>
              <Input type="date" value={newStop.start_date} onChange={(e) => setNewStop({ ...newStop, start_date: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label>Depart</Label>
              <Input type="date" value={newStop.end_date} onChange={(e) => setNewStop({ ...newStop, end_date: e.target.value })} className="mt-1.5" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={addStop} className="gradient-hero text-white border-0">Add stop</Button>
            <Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </div>
      ) : stops.length > 0 ? (
        <Button onClick={() => setAdding(true)} variant="outline" className="w-full h-12 border-dashed">
          <Plus className="w-4 h-4 mr-1" /> Add another stop
        </Button>
      ) : null}
    </div>
  );
}

function StopCard({ stop, idx, qc, tripId, onRemove }: any) {
  const [adding, setAdding] = useState(false);
  const [act, setAct] = useState({ name: "", type: "culture", cost: "0", duration_minutes: "60", time_slot: "10:00", day_offset: "0" });

  const { data: catalog = [] } = useQuery({
    queryKey: ["activities-catalog", stop.city_id],
    queryFn: async () => {
      if (!stop.city_id) return [];
      const { data } = await supabase.from("activities_catalog").select("*").eq("city_id", stop.city_id);
      return data ?? [];
    },
  });

  async function addCustom() {
    if (!act.name) return;
    const { error } = await supabase.from("trip_activities").insert({
      stop_id: stop.id, name: act.name, type: act.type,
      cost: Number(act.cost), duration_minutes: Number(act.duration_minutes),
      time_slot: act.time_slot, day_offset: Number(act.day_offset),
      sequence: stop.trip_activities?.length ?? 0,
    });
    if (error) return toast.error(error.message);
    toast.success("Activity added");
    setAdding(false);
    setAct({ name: "", type: "culture", cost: "0", duration_minutes: "60", time_slot: "10:00", day_offset: "0" });
    qc.invalidateQueries({ queryKey: ["stops", tripId] });
  }

  async function addFromCatalog(c: any) {
    const { error } = await supabase.from("trip_activities").insert({
      stop_id: stop.id, name: c.name, type: c.type, cost: c.avg_cost,
      duration_minutes: c.duration_minutes, time_slot: "10:00", day_offset: 0,
      sequence: stop.trip_activities?.length ?? 0,
    });
    if (error) return toast.error(error.message);
    toast.success("Added " + c.name);
    qc.invalidateQueries({ queryKey: ["stops", tripId] });
  }

  async function removeAct(id: string) {
    await supabase.from("trip_activities").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["stops", tripId] });
  }

  return (
    <div className="rounded-2xl bg-card border border-border/60 shadow-card overflow-hidden">
      <div className="p-5 flex items-start justify-between gap-3 gradient-tropic text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 grid place-items-center font-display font-bold">{idx + 1}</div>
          <div>
            <h3 className="font-display font-bold text-xl">{stop.cities?.name ?? stop.city_name}</h3>
            <p className="text-sm opacity-90">
              {stop.cities?.country}
              {stop.start_date && ` · ${format(new Date(stop.start_date), "MMM d")} – ${format(new Date(stop.end_date), "MMM d")}`}
            </p>
          </div>
        </div>
        <Button size="icon" variant="ghost" onClick={onRemove} className="text-white hover:bg-white/20">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-5 space-y-3">
        {stop.trip_activities?.length > 0 && (
          <div className="space-y-2">
            {stop.trip_activities.map((a: any) => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <div className="w-1.5 self-stretch rounded-full" style={{ background: COLORS[ACTIVITY_TYPES.indexOf(a.type) % COLORS.length] }} />
                <div className="flex-1">
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-3 mt-0.5">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{a.time_slot} · {a.duration_minutes}m</span>
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />${Number(a.cost).toFixed(0)}</span>
                    <span className="capitalize px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px]">{a.type}</span>
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => removeAct(a.id)}>
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {catalog.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 mt-2">Suggested activities</p>
            <div className="flex flex-wrap gap-2">
              {catalog.map((c: any) => (
                <button key={c.id} onClick={() => addFromCatalog(c)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:bg-accent transition">
                  + {c.name} <span className="text-muted-foreground">${Number(c.avg_cost).toFixed(0)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {adding ? (
          <div className="space-y-2 pt-2 border-t">
            <div className="grid md:grid-cols-2 gap-2">
              <Input placeholder="Activity name" value={act.name} onChange={(e) => setAct({ ...act, name: e.target.value })} />
              <Select value={act.type} onValueChange={(v) => setAct({ ...act, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ACTIVITY_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="time" value={act.time_slot} onChange={(e) => setAct({ ...act, time_slot: e.target.value })} />
              <Input type="number" placeholder="Cost $" value={act.cost} onChange={(e) => setAct({ ...act, cost: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button onClick={addCustom} className="gradient-hero text-white border-0" size="sm">Add</Button>
              <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)} className="border-dashed">
            <Plus className="w-3.5 h-3.5 mr-1" /> Custom activity
          </Button>
        )}
      </div>
    </div>
  );
}

/* -------------------- Budget tab -------------------- */
function BudgetTab({ trip, stops, qc }: any) {
  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses", trip.id],
    queryFn: async () => (await supabase.from("expenses").select("*").eq("trip_id", trip.id)).data ?? [],
  });

  const [exp, setExp] = useState({ amount: "", category: "activities", note: "" });

  // Compute activity totals from itinerary
  const activityTotal = stops.reduce((s: number, st: any) =>
    s + (st.trip_activities?.reduce((a: number, x: any) => a + Number(x.cost), 0) ?? 0), 0);
  const expTotal = expenses.reduce((s: number, e: any) => s + Number(e.amount), 0);
  const grandTotal = activityTotal + expTotal;
  const budget = Number(trip.budget ?? 0);
  const overBudget = grandTotal > budget && budget > 0;
  const days = differenceInDays(new Date(trip.end_date), new Date(trip.start_date)) + 1;

  const breakdownMap: Record<string, number> = { activities: activityTotal };
  expenses.forEach((e: any) => { breakdownMap[e.category] = (breakdownMap[e.category] ?? 0) + Number(e.amount); });
  const pieData = Object.entries(breakdownMap).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!exp.amount) return;
    const { error } = await supabase.from("expenses").insert({
      trip_id: trip.id, amount: Number(exp.amount), category: exp.category, note: exp.note || null,
    });
    if (error) return toast.error(error.message);
    setExp({ amount: "", category: "activities", note: "" });
    qc.invalidateQueries({ queryKey: ["expenses", trip.id] });
  }

  async function delExp(id: string) {
    await supabase.from("expenses").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["expenses", trip.id] });
  }

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        <div className={`rounded-2xl p-6 text-white shadow-glow ${overBudget ? "bg-destructive" : "gradient-hero"}`}>
          <div className="text-sm opacity-90">Total spending</div>
          <div className="text-4xl font-display font-bold mt-1">${grandTotal.toFixed(0)}</div>
          <div className="text-sm opacity-90 mt-1">
            of ${budget.toFixed(0)} budget · ${(grandTotal / Math.max(days, 1)).toFixed(0)}/day avg
            {overBudget && " · ⚠ Over budget"}
          </div>
        </div>

        <div className="rounded-2xl bg-card p-5 border border-border/60 shadow-card">
          <h3 className="font-display font-semibold mb-4">Breakdown by category</h3>
          {pieData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No costs yet — add activities or expenses.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={pieData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-card p-5 border border-border/60 shadow-card">
          <h3 className="font-display font-semibold mb-3">Expenses</h3>
          <form onSubmit={addExpense} className="grid md:grid-cols-4 gap-2 mb-4">
            <Input placeholder="Amount" type="number" value={exp.amount} onChange={(e) => setExp({ ...exp, amount: e.target.value })} />
            <Select value={exp.category} onValueChange={(v) => setExp({ ...exp, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{EXPENSE_CATS.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Note (optional)" value={exp.note} onChange={(e) => setExp({ ...exp, note: e.target.value })} className="md:col-span-1" />
            <Button type="submit" className="gradient-hero text-white border-0">Add</Button>
          </form>
          <div className="space-y-2">
            {expenses.length === 0 && <p className="text-sm text-muted-foreground">No manual expenses yet.</p>}
            {expenses.map((e: any) => (
              <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                <span className="capitalize text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">{e.category}</span>
                <span className="flex-1 text-sm">{e.note || "—"}</span>
                <span className="font-semibold">${Number(e.amount).toFixed(2)}</span>
                <Button size="icon" variant="ghost" onClick={() => delExp(e.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-5 border border-border/60 shadow-card h-fit">
        <h3 className="font-display font-semibold mb-3">Distribution</h3>
        {pieData.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="space-y-1.5 mt-3">
          {pieData.map((d, i) => (
            <div key={d.name} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="capitalize flex-1">{d.name}</span>
              <span className="font-medium">${d.value.toFixed(0)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------- Packing tab -------------------- */
function PackingTab({ tripId, stops, qc }: any) {
  const { data: items = [] } = useQuery({
    queryKey: ["checklist", tripId],
    queryFn: async () => (await supabase.from("checklist_items").select("*").eq("trip_id", tripId).order("created_at")).data ?? [],
  });
  const [item, setItem] = useState({ name: "", category: "clothing" });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!item.name) return;
    const { error } = await supabase.from("checklist_items").insert({ trip_id: tripId, name: item.name, category: item.category });
    if (error) return toast.error(error.message);
    setItem({ name: "", category: item.category });
    qc.invalidateQueries({ queryKey: ["checklist", tripId] });
  }
  async function toggle(id: string, packed: boolean) {
    await supabase.from("checklist_items").update({ is_packed: !packed }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["checklist", tripId] });
  }
  async function del(id: string) {
    await supabase.from("checklist_items").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["checklist", tripId] });
  }
  async function smartGenerate() {
    const types = new Set(stops.flatMap((s: any) => (s.trip_activities ?? []).map((a: any) => a.type)));
    const suggestions: { name: string; category: string }[] = [
      { name: "Passport", category: "documents" },
      { name: "Phone charger", category: "electronics" },
      { name: "Toothbrush", category: "toiletries" },
      { name: "T-shirts (5)", category: "clothing" },
      { name: "Socks & underwear", category: "clothing" },
    ];
    if (types.has("adventure")) suggestions.push({ name: "Hiking boots", category: "clothing" });
    if (types.has("nature")) suggestions.push({ name: "Sunscreen", category: "toiletries" });
    if (types.has("food")) suggestions.push({ name: "Reusable water bottle", category: "other" });
    if (types.has("nightlife")) suggestions.push({ name: "Going-out outfit", category: "clothing" });
    const { error } = await supabase.from("checklist_items")
      .insert(suggestions.map((s) => ({ trip_id: tripId, name: s.name, category: s.category })));
    if (error) return toast.error(error.message);
    toast.success(`Added ${suggestions.length} smart items`);
    qc.invalidateQueries({ queryKey: ["checklist", tripId] });
  }

  const grouped: Record<string, any[]> = {};
  items.forEach((i: any) => { (grouped[i.category] = grouped[i.category] ?? []).push(i); });
  const packed = items.filter((i: any) => i.is_packed).length;

  return (
    <div className="grid md:grid-cols-3 gap-5">
      <div className="md:col-span-2 space-y-4">
        <div className="rounded-2xl bg-card p-5 border border-border/60 shadow-card">
          <form onSubmit={add} className="grid md:grid-cols-3 gap-2">
            <Input placeholder="Item name" value={item.name} onChange={(e) => setItem({ ...item, name: e.target.value })} className="md:col-span-1" />
            <Select value={item.category} onValueChange={(v) => setItem({ ...item, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PACK_CATS.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
            </Select>
            <Button type="submit" className="gradient-hero text-white border-0">Add</Button>
          </form>
        </div>
        {Object.entries(grouped).map(([cat, list]) => (
          <div key={cat} className="rounded-2xl bg-card p-5 border border-border/60 shadow-card">
            <h4 className="font-display font-semibold capitalize mb-3">{cat}</h4>
            <div className="space-y-2">
              {list.map((i) => (
                <div key={i.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent">
                  <Checkbox checked={i.is_packed} onCheckedChange={() => toggle(i.id, i.is_packed)} />
                  <span className={`flex-1 ${i.is_packed ? "line-through text-muted-foreground" : ""}`}>{i.name}</span>
                  <Button size="icon" variant="ghost" onClick={() => del(i.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4 h-fit">
        <div className="rounded-2xl gradient-tropic p-5 text-white shadow-glow">
          <Backpack className="w-6 h-6" />
          <div className="text-3xl font-display font-bold mt-2">{packed}/{items.length}</div>
          <div className="text-sm opacity-90">items packed</div>
        </div>
        <div className="rounded-2xl bg-card p-5 border border-border/60 shadow-card">
          <Sparkles className="w-5 h-5 text-primary" />
          <h4 className="font-display font-semibold mt-2">Smart packing</h4>
          <p className="text-sm text-muted-foreground mt-1">Generate items from your itinerary's activities.</p>
          <Button onClick={smartGenerate} className="mt-3 w-full gradient-hero text-white border-0">Generate list</Button>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Notes tab -------------------- */
function NotesTab({ tripId, stops, qc }: any) {
  const { data: notes = [] } = useQuery({
    queryKey: ["notes", tripId],
    queryFn: async () => (await supabase.from("notes").select("*").eq("trip_id", tripId).order("created_at", { ascending: false })).data ?? [],
  });
  const [n, setN] = useState({ content: "", stop_id: "" });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!n.content.trim()) return;
    const { error } = await supabase.from("notes").insert({
      trip_id: tripId, content: n.content, stop_id: n.stop_id || null,
    });
    if (error) return toast.error(error.message);
    setN({ content: "", stop_id: "" });
    qc.invalidateQueries({ queryKey: ["notes", tripId] });
  }
  async function del(id: string) {
    await supabase.from("notes").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["notes", tripId] });
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <form onSubmit={add} className="rounded-2xl bg-card p-5 border border-border/60 shadow-card space-y-3">
        <Textarea placeholder="What happened today? Notes, memories, plans..." rows={3} value={n.content} onChange={(e) => setN({ ...n, content: e.target.value })} />
        <div className="flex gap-2">
          <Select value={n.stop_id} onValueChange={(v) => setN({ ...n, stop_id: v })}>
            <SelectTrigger className="flex-1"><SelectValue placeholder="Link to a stop (optional)" /></SelectTrigger>
            <SelectContent>
              {stops.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.cities?.name ?? s.city_name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button type="submit" className="gradient-hero text-white border-0">Add note</Button>
        </div>
      </form>
      {notes.map((note: any) => {
        const stop = stops.find((s: any) => s.id === note.stop_id);
        return (
          <div key={note.id} className="rounded-2xl bg-card p-5 border border-border/60 shadow-card">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>{format(new Date(note.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
              <div className="flex items-center gap-2">
                {stop && <span className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground">{stop.cities?.name ?? stop.city_name}</span>}
                <Button size="icon" variant="ghost" onClick={() => del(note.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
            <p className="whitespace-pre-wrap">{note.content}</p>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------- Share tab -------------------- */
function ShareTab({ trip, qc, onDeleted }: any) {
  const url = typeof window !== "undefined" ? `${window.location.origin}/public/trip/${trip.public_token}` : "";
  async function togglePublic(v: boolean) {
    const { error } = await supabase.from("trips").update({ is_public: v }).eq("id", trip.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["trip", trip.id] });
  }
  async function deleteTrip() {
    if (!confirm("Delete this trip permanently?")) return;
    const { error } = await supabase.from("trips").delete().eq("id", trip.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    onDeleted();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="rounded-2xl bg-card p-6 border border-border/60 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-lg">Public itinerary</h3>
            <p className="text-sm text-muted-foreground">Anyone with the link can view your trip (read-only).</p>
          </div>
          <Switch checked={trip.is_public} onCheckedChange={togglePublic} />
        </div>
        {trip.is_public && (
          <div className="mt-4 flex gap-2">
            <Input value={url} readOnly className="bg-muted" />
            <Button onClick={() => { navigator.clipboard.writeText(url); toast.success("Link copied!"); }} variant="outline">
              <Copy className="w-4 h-4 mr-1" /> Copy
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-card p-6 border border-border/60 shadow-card">
        <h3 className="font-display font-semibold text-lg flex items-center gap-2">
          <Leaf className="w-5 h-5 text-mint" /> Carbon footprint
        </h3>
        <p className="text-sm text-muted-foreground">Estimated based on stops & activities.</p>
        <div className="mt-3 flex items-center gap-4">
          <div className="text-4xl font-display font-bold text-gradient">{trip.green_score}</div>
          <div className="text-sm text-muted-foreground">Green score (0–100)</div>
        </div>
      </div>

      <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-6">
        <h3 className="font-display font-semibold text-lg text-destructive">Danger zone</h3>
        <p className="text-sm text-muted-foreground mt-1">Permanently delete this trip and all its data.</p>
        <Button onClick={deleteTrip} variant="destructive" className="mt-3">
          <Trash2 className="w-4 h-4 mr-2" /> Delete trip
        </Button>
      </div>
    </div>
  );
}
