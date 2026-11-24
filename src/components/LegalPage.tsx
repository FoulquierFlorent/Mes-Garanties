import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export const LEGAL_UPDATED_AT = "24 novembre 2026";

export function LegalPage({
  title,
  updatedAt = LEGAL_UPDATED_AT,
  children,
}: {
  title: string;
  updatedAt?: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <Link to="/" className="text-sm text-muted-foreground hover:underline">← Accueil</Link>
      <h1 className="mt-4 font-serif text-3xl">{title}</h1>
      <div className="mt-8 space-y-6 text-sm leading-relaxed [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc">
        {children}
      </div>
      <p className="mt-10 text-xs text-muted-foreground">Dernière mise à jour : {updatedAt}</p>
      <footer className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
        <LegalLinks />
      </footer>
    </main>
  );
}

export function LegalLinks() {
  return (
    <nav className="flex flex-wrap justify-center gap-4">
      <Link to="/mentions-legales" className="hover:underline">Mentions légales</Link>
      <Link to="/confidentialite" className="hover:underline">Confidentialité</Link>
      <Link to="/cgu" className="hover:underline">CGU</Link>
      <Link to="/suppression-compte" className="hover:underline">Suppression de compte</Link>
      <Link to="/aide" className="hover:underline">Aide et assistance</Link>
    </nav>
  );
}
