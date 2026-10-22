"""ThaliWise core: nutrition requirements, food filtering, LP optimizer, explanations, weekly menu.
Pure Python (numpy/scipy only) so it can be unit-tested without a web server or database."""
from __future__ import annotations
import math
from typing import Any
import numpy as np
from scipy.optimize import linprog

W = 7  # days per week
# [kcal, protein g, iron mg, calcium mg] per day (sample values, ICMR-NIN style categories)
CATS = [[1000, 15, 8, 600], [1360, 20, 11, 600], [1700, 30, 15, 650], [2200, 40, 16, 850], [2060, 40, 28, 850],
        [2800, 55, 22, 1000], [2400, 50, 30, 1000], [2700, 54, 19, 1000], [2200, 46, 29, 1000],
        [2550, 55, 27, 1000], [2700, 62, 23, 1000], [2100, 50, 19, 1000]]
DIETS = ["veg", "veg_egg", "non_veg", "vegan", "jain"]  # index = request.diet
ALLERGENS = ["peanut", "milk", "lactose", "egg", "gluten", "soy", "sesame", "fish"]
TYPICAL_BASKET = [("Wheat atta", 300), ("Rice", 150), ("Toor dal", 30), ("Cooking oil", 20), ("Potato", 100), ("Onion", 50)]  # g/AE/day
NUTRIENTS = [("energy", "kcal"), ("protein", "protein"), ("iron", "iron"), ("calcium", "calcium")]
DAYS_ONCE = {"cer", "oil", "milk", "oth", "fruit"}  # foods served every day in the menu
SERVINGS = {"egg": 4, "meat": 3, "pul": 4, "veg": 5, "leaf": 3}


def requirement(m: dict) -> list[int]:
    a = max(1, int(m.get("age") or 1)); f = m.get("sex") == "F"
    i = 0 if a < 4 else 1 if a < 7 else 2 if a < 10 else (4 if f else 3) if a < 13 else (6 if f else 5) if a < 18 else (8 if f else 7) if a < 60 else 11
    if f and 15 <= a < 50:
        if m.get("status") == 1: i = 9   # pregnant
        if m.get("status") == 2: i = 10  # lactating
    return CATS[i]


def household_need(members: list[dict]) -> dict:
    k = p = f = c = 0
    for m in members:
        r = requirement(m); k += r[0]; p += r[1]; f += r[2]; c += r[3]
    return dict(k=k, p=p, f=f, c=c, n=len(members), ae=k / 2200)


def in_season(food: dict, month: int) -> bool:
    a, b = food.get("season_start"), food.get("season_end")
    if a is None: return True
    return a <= month <= b if a <= b else (month >= a or month <= b)


def diet_ok(fl: dict, d: int) -> bool:
    if fl.get("meat") and d != 2: return False
    if fl.get("egg") and d not in (1, 2): return False
    if fl.get("dairy") and d == 3: return False
    if fl.get("root") and d == 4: return False
    return True


def household_allergens(members: list[dict]) -> set[str]:
    return {a for m in members for a in (m.get("allergies") or [])}


def blocked_by(food: dict, allergens: set[str]) -> list[str]:
    return [a for a in food.get("allergens", []) if a in allergens]


def filter_foods(foods: list[dict], req: dict, relax: set[str] = frozenset()) -> list[dict]:
    """Hard rules first: allergies and diet are never relaxed."""
    d = req.get("diet", 0); al = household_allergens(req["members"]); ex = set(req.get("excluded") or [])
    quick = req.get("quick_cook") and "quick_cook" not in relax
    nofr = req.get("no_fridge") and "no_fridge" not in relax
    dia = req.get("diabetes") and "diabetes" not in relax
    out = []
    for f in foods:
        fl = f.get("flags", {})
        if f["tag"] == "pds" and not req.get("pds_enabled", True): continue
        if blocked_by(f, al) or not diet_ok(fl, d): continue
        if fl.get("cold") and nofr: continue
        if "excluded" not in relax and f["name"] in ex: continue
        if dia and fl.get("sug"): continue
        if quick and f["cook_min"] > 30: continue
        if not in_season(f, req.get("month", 9)): continue
        out.append(f)
    return out


def _price(f: dict, req: dict, prices: dict) -> float:
    if f["tag"] == "pds": return max(0.0, float(req.get("pds_price") or 0))
    return float(prices.get(f["name"], f["price"]))


def optimize(F: list[dict], N: dict, ent: float, opts: dict) -> tuple[np.ndarray, float] | None:
    """min cost s.t. nutrition + food-group + per-food limits. x is in units of 100 g per week."""
    n = len(F); ae = N["ae"]
    if n == 0: return None
    rows: list[tuple[np.ndarray, float]] = []  # each is  a.x >= b
    def add(vec, b): rows.append((np.array(vec, dtype=float), float(b)))
    kc = [f["kcal"] for f in F]
    add(kc, W * N["k"]); add([-v for v in kc], -1.15 * W * N["k"])
    add([f["protein"] for f in F], W * N["p"]); add([f["iron"] for f in F], W * N["f"]); add([f["calcium"] for f in F], W * N["c"])
    def grp(groups, v): add([1 if f["group"] in groups else 0 for f in F], W * ae * v)
    grp({"veg", "leaf"}, 1.5); grp({"leaf"}, .5); grp({"pul"}, .7 if opts.get("diabetes") else .5); grp({"oil"}, .15)
    if opts.get("millet"): add([1 if f.get("flags", {}).get("mil") else 0 for f in F], W * ae * .5)
    if opts.get("fruit"): grp({"fruit"}, 1)
    ub = []
    for f in F:
        mx = f["max_g"] * (.5 if opts.get("diabetes") and f.get("flags", {}).get("hgi") else 1)
        ub.append(W * ae * mx / 100)
    pds = [1.0 if f["tag"] == "pds" else 0.0 for f in F]
    A = [-r[0] for r in rows]; b = [-r[1] for r in rows]
    if any(pds): A.append(np.array(pds)); b.append(ent)
    c = [f["_price"] / 10 for f in F]
    res = linprog(c, A_ub=np.array(A), b_ub=np.array(b), bounds=[(0, u) for u in ub], method="highs")
    if res.status != 0: return None
    return res.x, float(res.fun)


def _tot(F, q, key): return float(sum(qi * f[key] for qi, f in zip(q, F)))


def solve(req: dict, foods: list[dict], prices: dict | None = None, relax: set[str] = frozenset(), explain: bool = True) -> dict:
    prices = prices or {}
    members = req["members"]; N = household_need(members)
    opts = dict(diabetes=bool(req.get("diabetes")) and "diabetes" not in relax,
                millet=bool(req.get("millet_boost")) and "millet_boost" not in relax,
                fruit=bool(req.get("daily_fruit")) and "daily_fruit" not in relax)
    al = household_allergens(members)
    F = [dict(f, _price=_price(f, req, prices)) for f in filter_foods(foods, req, relax)]
    ent = N["n"] * max(0.0, float(req.get("pds_kg_per_person_month") or 0)) * 12 / 52 * 10
    sol = optimize(F, N, ent, opts) if N["n"] and F else None
    removed = [f["name"] for f in foods if blocked_by(f, al)]
    safety = dict(allergens=sorted(al), removed_foods=removed,
                  per_member=[dict(member=i + 1, age=m.get("age"), allergies=m.get("allergies") or []) for i, m in enumerate(members) if m.get("allergies")])
    modes = dict(diet=DIETS[req.get("diet", 0)], diabetes=opts["diabetes"], millet=opts["millet"], fruit=opts["fruit"])
    budget = max(0.0, float(req.get("budget") or 0))
    if sol is None:
        hints = []
        if explain:
            on = dict(quick_cook=req.get("quick_cook"), no_fridge=req.get("no_fridge"), excluded=req.get("excluded"),
                      millet_boost=req.get("millet_boost"), daily_fruit=req.get("daily_fruit"), diabetes=req.get("diabetes"))
            hints = [k for k, v in on.items() if v and solve(req, foods, prices, {k}, explain=False)["feasible"]]
        return dict(feasible=False, hints=hints, safety=safety, modes=modes, n_foods=len(F))
    q, cost = sol
    items = [dict(name=f["name"], name_hi=f["name_hi"], icon=f["icon"], group=f["group"], pds=f["tag"] == "pds", unit_price=f["_price"],
                  kg=float(qi) / 10, g_per_person_day=float(qi) * 100 / W / N["n"], cost=float(qi) * f["_price"] / 10, cap_g=f["max_g"])
             for qi, f in zip(q, F) if qi * 100 >= 20]
    items.sort(key=lambda a: -a["cost"])
    out = dict(feasible=True, cost=cost, per_person_day=cost / W / N["n"], budget=budget, diff=budget - cost, items=items, safety=safety, modes=modes,
               need=dict(n=N["n"], energy=N["k"] * W, protein=N["p"] * W, iron=N["f"] * W, calcium=N["c"] * W), n_foods=len(F))
    if not explain: return out
    # --- nutrition coverage vs typical basket (at current market prices)
    need_w = dict(energy=N["k"] * W, protein=N["p"] * W, iron=N["f"] * W, calcium=N["c"] * W)
    market = [dict(f, _price=_price(f, req, prices)) for f in foods if f["tag"] != "pds"]
    bq = []
    for f in market:
        g = next((g for n, g in TYPICAL_BASKET if n == f["name"]), 0)
        bq.append(g / 100 * N["ae"] * W)
    basket_cost = sum(qi * f["_price"] / 10 for qi, f in zip(bq, market))
    cov = []
    for key, col in NUTRIENTS:
        cov.append(dict(key=key, required_week=need_w[key], plan_pct=_tot(F, q, col) / need_w[key] * 100, basket_pct=_tot(market, bq, col) / need_w[key] * 100))
    iron = next(c for c in cov if c["key"] == "iron")
    level = lambda p: "low" if p >= 100 else "medium" if p >= 75 else "high"
    out["coverage"] = cov; out["basket_cost"] = basket_cost
    out["anemia"] = dict(plan=level(iron["plan_pct"]), basket=level(iron["basket_pct"]), plan_pct=iron["plan_pct"], basket_pct=iron["basket_pct"])
    # --- why: binding limits and per-food reason
    binding = []
    for c in cov:
        if c["key"] != "energy" and c["plan_pct"] < 100.6: binding.append(dict(type="nutrient", key=c["key"]))
        if c["key"] == "energy" and c["plan_pct"] > 114.4: binding.append(dict(type="energy_cap"))
    for qi, f in zip(q, F):
        if qi >= N["ae"] * W * f["max_g"] / 100 - 1e-6: binding.append(dict(type="food_cap", food=f["name"], name_hi=f["name_hi"]))
    if ent > 0 and sum(qi for qi, f in zip(q, F) if f["tag"] == "pds") >= ent - 1e-6: binding.append(dict(type="pds_full"))
    totals = {k: _tot(F, q, col) for k, col in NUTRIENTS}; cols = dict(NUTRIENTS)
    by_name = {a["name"]: a for a in items}; why = []
    for qi, f in zip(q, F):
        it = by_name.get(f["name"])
        if not it: continue
        cs = it["cost"] / cost if cost > 0 else 0; best = None; bv = 0
        for k, col in NUTRIENTS:
            sh = qi * f[col] / totals[k] if totals[k] else 0
            v = sh / max(cs, .005)
            if sh >= .03 and v > bv: bv, best = v, (k, sh)
        why.append(dict(name=f["name"], pds=it["pds"], nutrient=best[0] if best else None, share_pct=best[1] * 100 if best else None, cost_pct=cs * 100))
    out["binding"] = binding; out["why"] = why
    out["menu"] = weekly_menu(items)
    return out


def weekly_menu(items: list[dict]) -> list[dict]:
    """Spread weekly quantities over 7 days. Totals match the plan; dals/veg/greens are rotated."""
    days = [dict(day=i, staples=[], protein=[], veg=[]) for i in range(7)]; c = 0
    for it in items:
        g = it["group"]; kg = it["kg"]
        n = 7 if g in DAYS_ONCE else min(SERVINGS.get(g, 7), max(1, round(kg / .15)))
        st = 0 if g in DAYS_ONCE else c * 2
        if g not in DAYS_ONCE: c += 1
        col = "protein" if g in ("pul", "egg", "meat") else "veg" if g in ("veg", "leaf") else "staples"
        for i in range(n):
            days[(st + (i * 7) // n) % 7][col].append(dict(name=it["name"], name_hi=it["name_hi"], grams=kg * 1000 / n))
    return days


def replan(req: dict, foods: list[dict], base_prices: dict, new_prices: dict) -> dict:
    """Old plan re-priced at new prices vs the re-optimized plan."""
    prev = solve(req, foods, base_prices, explain=False)
    merged = {**base_prices, **new_prices}
    cur = solve(req, foods, merged)
    if not (prev["feasible"] and cur["feasible"]): return dict(feasible=False)
    pk = {i["name"]: i["kg"] for i in prev["items"]}; nk = {i["name"]: i["kg"] for i in cur["items"]}
    px = {f["name"]: _price(f, req, merged) for f in foods}
    oa = sum(i["kg"] * px[i["name"]] for i in prev["items"])
    changes = [dict(name=n, old_kg=pk.get(n, 0), new_kg=nk.get(n, 0)) for n in sorted(set(pk) | set(nk)) if abs(pk.get(n, 0) - nk.get(n, 0)) >= .05]
    return dict(feasible=True, old_at_new_prices=oa, new_cost=cur["cost"], savings=max(0.0, oa - cur["cost"]), changes=changes, plan=cur)
