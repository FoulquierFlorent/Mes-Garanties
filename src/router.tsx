import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// Safari affiche « Importing a module script failed » quand une page mise à jour
// cherche un ancien morceau de code : on recharge une seule fois pour récupérer la version fraîche.
const CHUNK_ERROR = /Importing a module script failed|Failed to fetch dynamically imported module|error loading dynamically imported module/i;
if (typeof window !== "undefined" && !(window as { __chunkGuard?: boolean }).__chunkGuard) {
  (window as { __chunkGuard?: boolean }).__chunkGuard = true;
  const recover = (msg: string) => {
    if (!CHUNK_ERROR.test(msg)) return;
    const last = Number(sessionStorage.getItem("chunk-reload") || 0);
    if (Date.now() - last < 10000) return;
    sessionStorage.setItem("chunk-reload", String(Date.now()));
    window.location.reload();
  };
  window.addEventListener("vite:preloadError", (e) => { e.preventDefault(); recover("Failed to fetch dynamically imported module"); });
  window.addEventListener("error", (e) => recover(String(e.message)));
  window.addEventListener("unhandledrejection", (e) => recover(String((e.reason as Error)?.message ?? e.reason)));
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
