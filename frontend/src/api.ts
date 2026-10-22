import type { HistoryRow, LivePrices, Meta, Plan, PlanRequest, Replan } from "./types";

const BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(BASE + path, { headers: { "Content-Type": "application/json" }, ...init });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json() as Promise<T>;
}
const post = (body: unknown, signal?: AbortSignal): RequestInit => ({ method: "POST", body: JSON.stringify(body), signal });

export const getMeta = () => call<Meta>("/api/meta");
export const getPlan = (req: PlanRequest, signal?: AbortSignal, save = false) => call<Plan>(`/api/plan?save=${save}`, post(req, signal));
export const getReplan = (request: PlanRequest, new_prices: Record<string, number>) => call<Replan>("/api/replan", post({ request, new_prices }));
export const getLive = (state: string) => call<LivePrices>(`/api/prices/live?state=${encodeURIComponent(state)}`);
export const getHistory = () => call<HistoryRow[]>("/api/history");
