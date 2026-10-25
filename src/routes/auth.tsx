import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import "@lovable.dev/cloud-auth-js/styles.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion — Garantia" },
      { name: "description", content: "Connectez-vous ou créez votre compte Garantia." },
      { property: "og:title", content: "Connexion — Garantia" },
      { property: "og:description", content: "Connectez-vous ou créez votre compte Garantia." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) { toast.error("Identifiants incorrects"); return; }
      navigate({ to: "/app" });
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/app" } });
      setLoading(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Vérifiez votre e-mail pour confirmer votre compte.");
    }
  }

  async function oauth(p: "google" | "lovable") {
    const r = await lovable.auth.signInWithOAuth(p, { redirect_uri: window.location.origin });
    if (r.error) { toast.error("Connexion impossible"); return; }
    if (r.redirected) { return; }
    navigate({ to: "/app" });
  }

  return (
    <main className="mx-auto max-w-sm px-5 py-20">
      <h1 className="text-4xl">{mode === "in" ? "Bon retour" : "Créer un compte"}</h1>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div className="space-y-1.5"><Label>E-mail</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Mot de passe</Label><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <Button className="w-full" disabled={loading}>{mode === "in" ? "Se connecter" : "S'inscrire"}</Button>
      </form>
      <div className="my-6 text-center text-xs text-muted-foreground">ou</div>
      <div className="space-y-2">
        <Button variant="outline" className="w-full" onClick={() => oauth("google")}>Continuer avec Google</Button>
        <button type="button" className="lovable-auth-button w-full" onClick={() => oauth("lovable")}>Continue with Lovable</button>
      </div>
      <button className="mt-6 w-full text-sm text-muted-foreground hover:text-foreground" onClick={() => setMode(mode === "in" ? "up" : "in")}>
        {mode === "in" ? "Pas de compte ? S'inscrire" : "Déjà inscrit ? Se connecter"}
      </button>
    </main>
  );
}
