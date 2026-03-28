import { API_URL } from "@/lib/api";

export type PublicAppConfig = {
  team_registration_enabled: boolean;
  maintenance_mode: boolean;
};

const CONFIG_PATH = "/config";

const DEFAULT_PROD_API = "https://kidscup-back.onrender.com/api";
const DEFAULT_DEV_API = "http://127.0.0.1:3000/api";

/**
 * Absolute API base for Server Components / Node `fetch`.
 * `NEXT_PUBLIC_API_URL` is often a path (`/api`), which the browser resolves but Node cannot.
 * Set `API_URL` (e.g. `http://localhost:3000/api`) when the backend is not at the default host.
 */
function getApiBaseAbsoluteForServerFetch(): string {
  const direct = process.env.API_URL?.trim();
  if (direct) {
    return direct.replace(/\/$/, "");
  }
  const pub = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (pub?.startsWith("http://") || pub?.startsWith("https://")) {
    return pub.replace(/\/$/, "");
  }
  return (
    process.env.NODE_ENV === "production" ? DEFAULT_PROD_API : DEFAULT_DEV_API
  ).replace(/\/$/, "");
}

/** URL for the browser (SWR, client fetch). May be relative, e.g. `/api/config`. */
export function getPublicConfigUrl(): string {
  const base = API_URL.replace(/\/$/, "");
  return `${base}${CONFIG_PATH}`;
}

/** Absolute URL for `fetch` in RSC / route handlers / server actions. */
export function getPublicConfigFetchUrl(): string {
  return `${getApiBaseAbsoluteForServerFetch()}${CONFIG_PATH}`;
}

export function normalizePublicAppConfig(raw: unknown): PublicAppConfig {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const tri = (v: unknown): boolean =>
    v === true || v === "true" || v === 1 || v === "1";
  return {
    team_registration_enabled: tri(o.team_registration_enabled),
    maintenance_mode: tri(o.maintenance_mode),
  };
}

/** Parse API string values when used outside the JSON response (e.g. env). */
export function parseConfigBoolean(raw: string | undefined | null): boolean {
  if (raw == null) {
    return false;
  }
  const s = String(raw).trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes";
}

/**
 * Use from Server Components with caching, e.g.
 * `fetchPublicConfig({ next: { revalidate: 60 } })`.
 */
export async function fetchPublicConfig(init?: RequestInit): Promise<PublicAppConfig> {
  const res = await fetch(getPublicConfigFetchUrl(), init);
  if (!res.ok) {
    throw new Error(`Config request failed: ${res.status}`);
  }
  const json: unknown = await res.json();
  return normalizePublicAppConfig(json);
}
