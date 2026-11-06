import { useState } from "react";
import { UserMinus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export function RemoveMember({ householdId, userId, name, plan, onRemoved }: { householdId: string; userId: string; name: string; plan: string; onRemoved: () => void }) {
  const [busy, setBusy] = useState(false);
  if (plan !== "famille") return null;

  async function remove() {
    setBusy(true);
    const { error } = await supabase.from("household_members").delete().eq("household_id", householdId).eq("user_id", userId);
    setBusy(false);
    if (error) { toast.error("Retrait du membre impossible"); return; }
    toast.success(`${name} a été retiré du foyer`);
    onRemoved();
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="mt-1 w-full text-muted-foreground"><UserMinus />Retirer</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Retirer {name} du foyer ?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>Cette personne perdra l’accès aux objets, garanties, justificatifs et au calendrier partagés par les autres membres.</p>
              <p>Les objets qu’elle a ajoutés restent dans le foyer et conservent son prénom. Cette action ne supprime ni son compte ni ces objets.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction disabled={busy} onClick={remove}>{busy ? "Retrait…" : "Confirmer le retrait"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
