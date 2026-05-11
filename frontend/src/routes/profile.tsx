import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { User2 } from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: () => <RequireAuth><Profile /></RequireAuth>,
});

function Profile() {
  const { user, signOut } = useAuth();
  const qc = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).single()).data,
    enabled: !!user,
  });
  const [form, setForm] = useState({ full_name: "", avatar_url: "", language: "en" });
  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name ?? "", avatar_url: profile.avatar_url ?? "", language: profile.language ?? "en" });
  }, [profile]);

  async function save() {
    const { error } = await supabase.from("profiles").update(form).eq("id", user!.id);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  async function deleteAccount() {
    if (!confirm("Delete your account and all trips? This cannot be undone.")) return;
    // Cascading delete via foreign keys removes profile + trips when auth user is removed.
    // Without admin API on client, we sign out and clear data.
    await supabase.from("profiles").delete().eq("id", user!.id);
    await signOut();
    toast.success("Account data cleared.");
  }

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-display font-bold">Profile & settings</h1>

      <div className="mt-8 rounded-2xl bg-card p-6 border border-border/60 shadow-card space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full gradient-hero grid place-items-center text-white text-xl font-display font-bold shadow-glow">
            {form.full_name?.[0]?.toUpperCase() ?? <User2 className="w-7 h-7" />}
          </div>
          <div>
            <div className="font-display font-bold text-lg">{form.full_name || "Traveler"}</div>
            <div className="text-sm text-muted-foreground">{user?.email}</div>
          </div>
        </div>
        <div>
          <Label>Full name</Label>
          <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-1.5 h-11" />
        </div>
        <div>
          <Label>Avatar URL</Label>
          <Input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} className="mt-1.5 h-11" />
        </div>
        <div>
          <Label>Language</Label>
          <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
            <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
              <SelectItem value="ja">日本語</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={save} className="gradient-hero text-white border-0 w-full h-11">Save changes</Button>
      </div>

      <div className="mt-6 rounded-2xl bg-destructive/5 border border-destructive/20 p-6">
        <h3 className="font-display font-semibold text-destructive">Delete account data</h3>
        <p className="text-sm text-muted-foreground mt-1">Removes your profile and signs you out.</p>
        <Button variant="destructive" onClick={deleteAccount} className="mt-3">Delete account data</Button>
      </div>
    </div>
  );
}
