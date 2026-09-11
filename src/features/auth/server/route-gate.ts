const PUBLIC_PAGES = new Set(["/", "/login", "/register"]);
const PUBLIC_API = new Set(["/api/health", "/api/metrics"]);
const CREDENTIAL_POSTS = new Set(["/login", "/register"]);
const SIGNED_OUT_ONLY = new Set(["/login", "/register"]);

export type RouteVerdict = {
  api: boolean;
  guarded: boolean;
  credentialPost: boolean;
  signedOutOnly: boolean;
};

export function isApiPath(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/");
}

export function classifyRoute(pathname: string, method: string): RouteVerdict {
  const api = isApiPath(pathname);
  return {
    api,
    guarded: api ? !PUBLIC_API.has(pathname) : !PUBLIC_PAGES.has(pathname),
    credentialPost: CREDENTIAL_POSTS.has(pathname) && method === "POST",
    signedOutOnly: SIGNED_OUT_ONLY.has(pathname) && method === "GET",
  };
}
