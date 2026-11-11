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
    <header className="sticky top-0 z-30 border-b bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:h-16 sm:px-5">
        <Link to="/" className="shrink-0 font-serif text-xl sm:text-2xl">
          Mes garanties<span className="text-accent">.</span>
        </Link>
        <nav className="flex min-w-0 items-center gap-0.5 text-sm sm:gap-4">
          {signedIn ? (
            <>
              <Link to="/calendrier" className="inline-flex min-h-11 items-center border-b-2 border-transparent px-1.5 hover:text-accent sm:px-2" activeProps={{ className: "border-accent font-medium text-accent" }}>Calendrier</Link>
              <Link to="/app" className="inline-flex min-h-11 items-center border-b-2 border-transparent px-1.5 hover:text-accent sm:px-2" activeProps={{ className: "border-accent font-medium text-accent" }}>Objets</Link>
              <Link to="/foyer" className="inline-flex min-h-11 items-center border-b-2 border-transparent px-1.5 hover:text-accent sm:px-2" activeProps={{ className: "border-accent font-medium text-accent" }}>Foyer</Link>
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}>
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
