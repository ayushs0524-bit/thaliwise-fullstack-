export type Lang = "en" | "hi";
export interface Member { age: number; sex: "F" | "M"; status: 0 | 1 | 2; allergies: string[] }
export interface Settings {
  budget: number; diet: number; pds_enabled: boolean; pds_kg_per_person_month: number; pds_price: number; month: number;
  quick_cook: boolean; no_fridge: boolean; excluded: string[]; diabetes: boolean; millet_boost: boolean; daily_fruit: boolean;
}
export interface PlanRequest extends Settings { members: Member[]; prices: Record<string, number> }
export interface Food {
  name: string; name_hi: string; icon: string; group: string; tag: string; price: number; allergens: string[]; max_g: number;
}
export interface Meta { allergens: string[]; diets: string[]; foods: Food[] }
export interface Item { name: string; name_hi: string; icon: string; group: string; pds: boolean; unit_price: number; kg: number; g_per_person_day: number; cost: number }
export interface Coverage { key: "energy" | "protein" | "iron" | "calcium"; required_week: number; plan_pct: number; basket_pct: number }
export type Binding = { type: "nutrient"; key: string } | { type: "energy_cap" } | { type: "pds_full" } | { type: "food_cap"; food: string; name_hi: string };
export interface MenuEntry { name: string; name_hi: string; grams: number }
export interface MenuDay { day: number; staples: MenuEntry[]; protein: MenuEntry[]; veg: MenuEntry[] }
export interface Safety { allergens: string[]; removed_foods: string[]; per_member: { member: number; age: number; allergies: string[] }[] }
export interface Modes { diet: string; diabetes: boolean; millet: boolean; fruit: boolean }
export interface PlanOk {
  feasible: true; cost: number; per_person_day: number; budget: number; diff: number; items: Item[]; safety: Safety; modes: Modes;
  need: { n: number; energy: number; protein: number; iron: number; calcium: number };
  coverage: Coverage[]; basket_cost: number; anemia: { plan: string; basket: string; plan_pct: number; basket_pct: number };
  binding: Binding[]; why: { name: string; pds: boolean; nutrient: string | null; share_pct: number | null; cost_pct: number }[];
  menu: MenuDay[]; saved_id?: number;
}
export interface PlanFail { feasible: false; hints: string[]; safety: Safety; modes: Modes }
export type Plan = PlanOk | PlanFail;
export interface Replan {
  feasible: boolean; old_at_new_prices?: number; new_cost?: number; savings?: number; changes?: { name: string; old_kg: number; new_kg: number }[]; label?: string;
}
export interface LivePrices { prices: Record<string, number>; missing: string[]; date?: string; error?: string }
export interface HistoryRow { id: number; created_at: string; cost: number; members: number }
