import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/SiteHeader";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl text-foreground">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">Cette page n'existe pas.</p>
        <Link to="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
          Accueil
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    const msg = String((error as Error | undefined)?.message ?? "");
    const recover = (window as { __chunkRecover?: (m: string) => boolean }).__chunkRecover;
    if (recover?.(msg)) return;
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl text-foreground">Cette page n'a pas pu se charger</h1>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Mes garanties — vos garanties sous contrôle" },
      { name: "description", content: "Suivez la durée de garantie de vos objets et recevez une alerte avant expiration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Work+Sans:wght@400;500;600&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

// Garde-fou chargé avant tout module : si un morceau de code ne se charge pas
// (Safari : « Importing a module script failed »), on recharge jusqu'à 3 fois,
// puis on affiche un bouton de rechargement au lieu d'un écran vide.
const CHUNK_GUARD = `(function(){
var RE=/Importing a module script failed|Failed to fetch dynamically imported module|error loading dynamically imported module/i;
function showFallback(){
function render(){
if(document.getElementById("chunk-fallback"))return;
var d=document.createElement("div");d.id="chunk-fallback";
d.style.cssText="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#faf7f2;font-family:Georgia,serif;z-index:99999;text-align:center;padding:24px";
d.innerHTML='<div><p style="font-size:20px;margin-bottom:16px">La page n\\u2019a pas pu se charger complètement.</p><button onclick="location.reload()" style="background:#1a1a1a;color:#fff;padding:10px 20px;border-radius:8px;border:0;font-size:14px;cursor:pointer">Recharger la page</button></div>';
document.body.appendChild(d);
}
if(document.body)render();else document.addEventListener("DOMContentLoaded",render);
}
window.__chunkRecover=function(msg){
if(!RE.test(String(msg)))return false;
var n=0;try{n=Number(sessionStorage.getItem("chunk-reloads")||0);}catch(e){}
if(n<3){try{sessionStorage.setItem("chunk-reloads",String(n+1));}catch(e){}
location.reload();return true;}
showFallback();return false;
};
window.addEventListener("error",function(e){window.__chunkRecover(e.message);},true);
window.addEventListener("unhandledrejection",function(e){var r=e.reason;window.__chunkRecover(r&&r.message?r.message:String(r));});
window.addEventListener("vite:preloadError",function(e){e.preventDefault();window.__chunkRecover("Failed to fetch dynamically imported module");});
window.addEventListener("load",function(){setTimeout(function(){try{sessionStorage.removeItem("chunk-reloads");}catch(e){}},5000);});
})();`;

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <script dangerouslySetInnerHTML={{ __html: CHUNK_GUARD }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <SiteHeader />
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}
