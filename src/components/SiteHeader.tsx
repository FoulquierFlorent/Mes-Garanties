import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const [signedIn, setSignedIn] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="font-serif text-2xl">
          Garantia<span className="text-accent">.</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-4 text-sm">
          {signedIn ? (
            <>
              <Link to="/app" className="px-2 py-1 hover:text-accent" activeProps={{ className: "text-accent" }}>Objets</Link>
              <Link to="/calendrier" className="px-2 py-1 hover:text-accent" activeProps={{ className: "text-accent" }}>Calendrier</Link>
              <Button variant="ghost" size="sm" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}>
                Déconnexion
              </Button>
            </>
          ) : (
            <>
              <Link to="/tarifs" className="px-2 py-1 hover:text-accent">Tarifs</Link>
              <Button asChild size="sm"><Link to="/auth">Se connecter</Link></Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
