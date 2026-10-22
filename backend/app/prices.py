"""Live mandi prices from data.gov.in (Agmarknet). Needs env DATA_GOV_API_KEY. Rs/quintal -> Rs/kg."""
import asyncio, os
import httpx

RESOURCE = "9ef84268-d588-465a-a308-a864a43d0070"
# ThaliWise food -> (Agmarknet commodity name, multiplier). Edit names if a food comes back in `missing`.
MAP = {"Potato": ("Potato", 1), "Onion": ("Onion", 1), "Tomato": ("Tomato", 1), "Rice": ("Rice", 1),
       "Wheat atta": ("Wheat", 1.15),  # 1.15 = rough milling markup (assumption)
       "Bajra": ("Bajra(Pearl Millet/Cumbu)", 1), "Ragi": ("Ragi (Finger Millet)", 1), "Jowar": ("Jowar(Sorghum)", 1),
       "Cauliflower": ("Cauliflower", 1), "Cabbage": ("Cabbage", 1), "Carrot": ("Carrot", 1), "Okra": ("Bhindi(Ladies Finger)", 1),
       "Banana": ("Banana", 1), "Guava": ("Guava", 1)}


async def _one(client: httpx.AsyncClient, commodity: str, mult: float, state: str, key: str):
    try:
        r = await client.get(f"https://api.data.gov.in/resource/{RESOURCE}",
                             params={"api-key": key, "format": "json", "limit": "50", "filters[state]": state, "filters[commodity]": commodity})
        r.raise_for_status()
        rows = [(float(x["modal_price"]), x.get("arrival_date", "")) for x in r.json().get("records", []) if float(x.get("modal_price") or 0) > 0]
        if not rows: return None
        ps = sorted(p for p, _ in rows)
        return round(ps[len(ps) // 2] / 100 * mult, 1), rows[0][1]
    except Exception:
        return None


async def fetch_live(state: str) -> dict:
    key = os.getenv("DATA_GOV_API_KEY")
    if not key: return dict(error="DATA_GOV_API_KEY not set", prices={}, missing=list(MAP))
    async with httpx.AsyncClient(timeout=8) as client:
        res = await asyncio.gather(*[_one(client, c, m, state, key) for c, m in MAP.values()])
    prices, missing, date = {}, [], ""
    for name, r in zip(MAP, res):
        if r: prices[name] = r[0]; date = date or r[1]
        else: missing.append(name)
    return dict(state=state, date=date, source="Agmarknet via data.gov.in", prices=prices, missing=missing)
