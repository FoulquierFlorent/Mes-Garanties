import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

/** Champ à compléter par l'éditeur, clairement signalé. */
export function ToFill({ children }: { children: ReactNode }) {
  return (
    <mark className="rounded bg-banner px-1.5 py-0.5 font-medium text-banner-foreground">
      [À compléter : {children}]
    </mark>
  );
}

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <Link to="/" className="text-sm text-muted-foreground hover:underline">← Accueil</Link>
      <h1 className="mt-4 font-serif text-3xl">{title}</h1>
      <p className="mt-3 rounded-md border bg-banner p-3 text-sm text-banner-foreground">
        Les passages entre crochets sont à compléter avec les informations de l’éditeur avant la mise en ligne.
      </p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc">
        {children}
      </div>
      <p className="mt-10 text-xs text-muted-foreground">Dernière mise à jour : <ToFill>date</ToFill></p>
    </main>
  );
}

export function LegalLinks() {
  return (
    <nav className="flex flex-wrap justify-center gap-4">
      <Link to="/mentions-legales" className="hover:underline">Mentions légales</Link>
      <Link to="/confidentialite" className="hover:underline">Confidentialité</Link>
      <Link to="/cgu" className="hover:underline">CGU</Link>
    </nav>
  );
}
