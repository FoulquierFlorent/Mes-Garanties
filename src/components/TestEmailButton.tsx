import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mail, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendAccountTestEmail } from "@/lib/test-email.functions";

export function TestEmailButton() {
  const send = useServerFn(sendAccountTestEmail);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function onSend() {
    setBusy(true);
    setMessage("");
    try {
      const result = await send();
      setMessage(result.sent ? "E-mail de test envoyé à l’adresse de votre compte. Vérifiez aussi vos courriers indésirables." : result.error ?? "Envoi impossible.");
    } catch {
      setMessage("Envoi impossible. Vérifiez votre connexion et réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4">
      <Button variant="outline" className="h-auto min-h-9 max-w-full whitespace-normal text-left" disabled={busy} onClick={onSend}>
        {busy ? <LoaderCircle className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none" /> : <Mail className="h-4 w-4 shrink-0" />}
        {busy ? "Envoi en cours…" : "Envoyer un e-mail de test"}
      </Button>
      <p role="status" className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}