import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/trips/new")({
  component: () => <RequireAuth><NewTrip /></RequireAuth>,
});

function NewTrip() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", description: "", start_date: "", end_date: "", cover_url: "", budget: "1500",
  });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase
      .from("trips")
      .insert({
        user_id: user!.id,
        name: form.name,
        description: form.description || null,
        start_date: form.start_date,
        end_date: form.end_date,
        cover_url: form.cover_url || null,
        budget: Number(form.budget),
      })
      .select()
      .single();
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Trip created! Now build your itinerary.");
    navigate({ to: "/trips/$id", params: { id: data.id } });
  }

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">
      <Link to="/trips" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to trips
      </Link>
      <h1 className="text-3xl md:text-4xl font-display font-bold">Plan a new trip</h1>
      <p className="text-muted-foreground mt-1">Start with the basics — you can add stops next.</p>

      <form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl bg-card p-6 md:p-8 shadow-card border border-border/60">
        <div>
          <Label htmlFor="name">Trip name</Label>
          <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Summer in Italy" className="h-11 mt-1.5" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start">Start date</Label>
            <Input id="start" type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="h-11 mt-1.5" />
          </div>
          <div>
            <Label htmlFor="end">End date</Label>
            <Input id="end" type="date" required value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="h-11 mt-1.5" />
          </div>
        </div>
        <div>
          <Label htmlFor="budget">Budget (USD)</Label>
          <Input id="budget" type="number" min="0" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} className="h-11 mt-1.5" />
        </div>
        <div>
          <Label htmlFor="cover">Cover image URL (optional)</Label>
          <Input id="cover" value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} placeholder="https://..." className="h-11 mt-1.5" />
        </div>
        <div>
          <Label htmlFor="desc">Description</Label>
          <Textarea id="desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What's the vibe?" className="mt-1.5" />
        </div>
        <Button type="submit" disabled={loading} className="w-full h-11 gradient-hero text-white border-0 shadow-glow">
          {loading ? "Creating..." : "Create trip"}
        </Button>
      </form>
    </div>
  );
}
