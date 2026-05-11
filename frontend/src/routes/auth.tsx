import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Compass, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) navigate({ to: "/dashboard" }); }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name }, emailRedirectTo: window.location.origin + "/dashboard" },
        });
        if (error) throw error;
        toast.success("Welcome aboard! 🎉");
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/auth",
        });
        if (error) throw error;
        toast.success("Check your inbox for a reset link.");
        setMode("signin");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Visual side */}
      <div className="relative hidden md:block overflow-hidden">
        <img src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1600" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 gradient-hero opacity-70 mix-blend-multiply" />
        <div className="relative h-full flex flex-col justify-between p-10 text-white">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur grid place-items-center">
              <Compass className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-xl">Traveloop</span>
          </Link>
          <div>
            <h2 className="text-4xl font-display font-bold leading-tight">Where will you go next?</h2>
            <p className="mt-3 text-white/90 max-w-md">Plan colorful itineraries, track budgets, pack smart, and share your adventure.</p>
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Link>
          <h1 className="text-3xl font-display font-bold">
            {mode === "signup" ? "Create account" : mode === "forgot" ? "Reset password" : "Welcome back"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {mode === "signup" ? "Start planning your next adventure." : mode === "forgot" ? "We'll email you a reset link." : "Sign in to continue planning."}
          </p>
          <form onSubmit={submit} className="space-y-4 mt-8">
            {mode === "signup" && (
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Alex Voyager" className="h-11 mt-1.5" />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className="h-11 mt-1.5" />
            </div>
            {mode !== "forgot" && (
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="pw">Password</Label>
                  {mode === "signin" && (
                    <button type="button" onClick={() => setMode("forgot")} className="text-xs text-primary hover:underline">Forgot?</button>
                  )}
                </div>
                <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="h-11 mt-1.5" />
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full h-11 gradient-hero text-white border-0 shadow-glow hover:opacity-95">
              {loading ? "Working..." : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
            </Button>
          </form>
          <div className="mt-6 text-sm text-center text-muted-foreground">
            {mode === "signin" ? (
              <>No account? <button onClick={() => setMode("signup")} className="text-primary font-medium hover:underline">Sign up</button></>
            ) : (
              <>Have an account? <button onClick={() => setMode("signin")} className="text-primary font-medium hover:underline">Sign in</button></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
