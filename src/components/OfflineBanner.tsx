import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) return null;

  return (
    <div role="status" className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 px-6 text-center backdrop-blur-xs">
      <div className="max-w-sm space-y-4">
        <WifiOff className="mx-auto size-8 text-muted-foreground" aria-hidden />
        <h2 className="text-2xl text-foreground">Connexion Internet indisponible</h2>
        <p className="text-sm text-muted-foreground">
          Vérifiez votre réseau Wi-Fi ou vos données mobiles pour accéder à vos garanties et justificatifs.
        </p>
        <Button onClick={() => window.location.reload()}>Réessayer</Button>
      </div>
    </div>
  );
}