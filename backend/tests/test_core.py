"""Run: python tests/test_core.py   (also works with pytest)"""
import json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from app.core import solve, replan, filter_foods, household_allergens
FOODS = json.load(open(pathlib.Path(__file__).resolve().parents[1] / "app" / "foods_seed.json", encoding="utf8"))
BASE = dict(members=[dict(age=32, sex="F", status=0), dict(age=36, sex="M", status=0), dict(age=8, sex="F", status=0), dict(age=5, sex="M", status=0)],
            budget=1500, diet=0, pds_enabled=True, pds_kg_per_person_month=5, pds_price=0, month=9, excluded=[])

def with_(**k): return {**BASE, **k}
def names(r): return {i["name"] for i in r["items"]}

def test_matches_html_prototype():
    r = solve(BASE, FOODS)  # the HTML prototype's optimizer gave Rs 715 for this household in October
    assert r["feasible"] and round(r["cost"]) == 715, r["cost"]

def test_allergy_is_hard_rule():
    m = [dict(BASE["members"][0], allergies=["gluten"]), dict(BASE["members"][1], allergies=["peanut"])] + BASE["members"][2:]
    r = solve(with_(members=m), FOODS)
    assert r["feasible"] and not names(r) & {"Wheat atta", "Wheat (PDS)", "Groundnuts"}
    assert r["safety"]["allergens"] == ["gluten", "peanut"]

def test_diets():
    assert not names(solve(with_(diet=3), FOODS)) & {"Milk", "Curd", "Paneer", "Eggs", "Chicken", "Fish (rohu)"}
    assert not names(solve(with_(diet=4), FOODS)) & {"Potato", "Onion", "Carrot", "Eggs", "Chicken"}
    for d in (0, 1, 2, 3, 4): assert solve(with_(diet=d), FOODS)["feasible"], d

def test_health_options():
    r = solve(with_(diabetes=True, millet_boost=True, daily_fruit=True), FOODS)
    assert r["feasible"] and "Jaggery" not in names(r) and names(r) & {"Banana", "Guava"}

def test_infeasible_gives_hints():
    ex = [f["name"] for f in FOODS if f["name"] in ("Ragi", "Bajra", "Jowar", "Chana dal", "Moong dal", "Besan", "Spinach", "Fenugreek leaves")]
    r = solve(with_(diet=3, quick_cook=True, excluded=ex), FOODS)
    assert not r["feasible"] and "excluded" in r["hints"]

def test_menu_totals_match_plan():
    r = solve(BASE, FOODS)
    for it in r["items"]:
        tot = sum(e["grams"] for d in r["menu"] for col in ("staples", "protein", "veg") for e in d[col] if e["name"] == it["name"])
        assert abs(tot - it["kg"] * 1000) < 1, it["name"]

def test_replan_saves_money():
    r = replan(BASE, FOODS, {}, {"Ragi": 150})
    assert r["feasible"] and r["savings"] >= 0 and r["new_cost"] <= r["old_at_new_prices"] + 1e-6

if __name__ == "__main__":
    for n, f in list(globals().items()):
        if n.startswith("test_"): f(); print("ok", n)
