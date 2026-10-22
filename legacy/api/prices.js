// Vercel serverless function: live mandi prices from data.gov.in (Agmarknet daily prices).
// Setup: get a free API key at data.gov.in, then add it in Vercel -> Settings -> Environment Variables as DATA_GOV_API_KEY.
// Prices come back as Rs/quintal; we convert to Rs/kg. Commodity names must match Agmarknet spellings (edit MAP if a food returns nothing).
const RESOURCE = "9ef84268-d588-465a-a308-a864a43d0070";
const MAP = { // ThaliWise food -> [Agmarknet commodity, multiplier]
  "Potato": ["Potato", 1], "Onion": ["Onion", 1], "Tomato": ["Tomato", 1],
  "Rice": ["Rice", 1], "Wheat atta": ["Wheat", 1.15], // 1.15 = rough milling/packing markup, an assumption
  "Bajra": ["Bajra(Pearl Millet/Cumbu)", 1], "Ragi": ["Ragi (Finger Millet)", 1], "Jowar": ["Jowar(Sorghum)", 1],
  "Cauliflower": ["Cauliflower", 1], "Cabbage": ["Cabbage", 1], "Carrot": ["Carrot", 1], "Okra": ["Bhindi(Ladies Finger)", 1],
  "Banana": ["Banana", 1], "Guava": ["Guava", 1]
};
async function one(food, [commodity, mult], state, key) {
  const u = new URL("https://api.data.gov.in/resource/" + RESOURCE);
  u.search = new URLSearchParams({ "api-key": key, format: "json", limit: "50", "filters[state]": state, "filters[commodity]": commodity }).toString();
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 8000);
  try {
    const r = await fetch(u, { signal: ctl.signal });
    if (!r.ok) return null;
    const rows = ((await r.json()).records || []).map(x => ({ p: +x.modal_price, d: x.arrival_date })).filter(x => x.p > 0);
    if (!rows.length) return null;
    const ps = rows.map(x => x.p).sort((a, b) => a - b), med = ps[Math.floor(ps.length / 2)];
    return { price: Math.round(med / 100 * mult * 10) / 10, date: rows[0].d };
  } catch (e) { return null; } finally { clearTimeout(t); }
}
module.exports = async (req, res) => {
  const key = process.env.DATA_GOV_API_KEY, state = String((req.query && req.query.state) || "Delhi").slice(0, 40);
  if (!key) return res.status(503).json({ error: "DATA_GOV_API_KEY not set" });
  const names = Object.keys(MAP), out = await Promise.all(names.map(n => one(n, MAP[n], state, key)));
  const prices = {}, missing = []; let date = "";
  names.forEach((n, i) => out[i] ? (prices[n] = out[i].price, date = date || out[i].date) : missing.push(n));
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
  res.status(200).json({ state, date, source: "Agmarknet via data.gov.in", prices, missing });
};
