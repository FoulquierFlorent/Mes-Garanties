import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { deleteMyAccount } from "@/lib/account-deletion.functions";
import { DELETE_CONFIRMATION_WORD } from "@/lib/account-deletion";

export function DeleteAccount({ sharedItems }: { sharedItems: number }) {
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState("");
  const [busy, setBusy] = useState(false);
  const ok = word.trim().toUpperCase() === DELETE_CONFIRMATION_WORD;

  async function confirm() {
    setBusy(true);
    try {
      const res = await deleteMyAccount({ data: { confirmation: word } });
      if (!res.deleted) { toast.error(res.error ?? "Suppression impossible."); return; }
      await supabase.auth.signOut();
      toast.success("Votre compte a été supprimé.");
      window.location.href = "/";
    } catch {
      toast.error("La suppression n’a pas pu aboutir. Réessayez plus tard.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-10 rounded-lg border border-destructive/40 p-5">
      <h2 className="text-xl">Supprimer mon compte</h2>
      <p className="mt-1 text-sm text-muted-foreground">Suppression définitive de votre compte et de vos données personnelles.</p>
      <Dialog open={open} onOpenChange={(n) => { if (!busy) { setOpen(n); setWord(""); } }}>
        <DialogTrigger asChild><Button variant="outline" className="mt-3 border-destructive/50 text-destructive">Supprimer définitivement mon compte</Button></DialogTrigger>
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-normal">Supprimer votre compte ?</DialogTitle>
            <DialogDescription>Cette action est définitive et ne peut pas être annulée.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div><p className="font-medium">Ce qui est effacé</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted-foreground">
                <li>Votre compte, votre adresse e-mail et votre mot de passe</li>
                <li>Votre espace privé (lien familial, téléphone, adresse, notes…)</li>
                <li>Vos réglages d’alertes et votre place dans le foyer</li>
                <li>Vos objets personnels, avec leurs photos, tickets et factures</li>
              </ul></div>
            <div><p className="font-medium">Ce qui reste</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted-foreground">
                <li>{sharedItems > 0 ? `Vos ${sharedItems} objet${sharedItems > 1 ? "s" : ""} partagé${sharedItems > 1 ? "s" : ""} avec le foyer y restent` : "Les objets partagés avec le foyer y restent"}, avec leurs justificatifs, pour que les autres membres gardent leurs garanties.</li>
                <li>Si vous êtes seul dans votre foyer, il est supprimé avec tous ses objets.</li>
              </ul></div>
            <div className="space-y-1.5 pt-1">
              <Label htmlFor="delete-confirm">Tapez {DELETE_CONFIRMATION_WORD} pour confirmer</Label>
              <Input id="delete-confirm" autoComplete="off" value={word} onChange={(e) => setWord(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="outline" disabled={busy} onClick={() => setOpen(false)}>Annuler</Button>
              <Button variant="destructive" disabled={!ok || busy} onClick={confirm}>{busy ? "Suppression…" : "Supprimer définitivement"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
