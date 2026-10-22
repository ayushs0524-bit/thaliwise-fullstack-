# ThaliWise: the cheapest nutritious week for every family
Team Synapse · Hack@BVP 8.0 · PS4 Nutri-Equity Engine

| Layer | Tech |
|---|---|
| Front end | React 18 + TypeScript (Vite) |
| Back end | FastAPI + SciPy (HiGHS) linear-programming optimizer |
| Database | PostgreSQL (SQLite fallback if `DATABASE_URL` is empty): foods, prices, saved-plan history |

## Features
Cheapest weekly plan that meets energy, protein, iron and calcium for every member (ICMR-NIN style categories) · PDS-aware · per-member **allergies** (hard rule) · vegetarian / veg+egg / non-veg / vegan / Jain · diabetes-friendly, millet boost, daily fruit · season, quick-cook, no-fridge filters · re-plan on price change (manual, CSV, live Agmarknet) · anemia indicator · "why this plan" · day-by-day menu · Hindi + English, large icons, read-aloud, share, print.

## Run locally
```bash
# 1. database (optional: skip to use SQLite)
docker compose up -d

# 2. backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # then: export $(cat .env | xargs)   (or leave DATABASE_URL unset for SQLite)
python tests/test_core.py       # optimizer tests (should print 7 "ok")
uvicorn app.main:app --reload   # http://localhost:8000/docs

# 3. frontend (new terminal)
cd frontend
npm install
npm run dev                     # http://localhost:5173  (proxies /api to :8000)
```
Tables are created and the 35 foods seeded automatically on first start.

## Deploy
1. **Database:** create a free Postgres on [Neon](https://neon.tech); copy the connection string.
2. **Backend (Render):** New → Blueprint → select this repo (uses `render.yaml`). Set `DATABASE_URL`, `CORS_ORIGINS` (your Vercel URL), optional `DATA_GOV_API_KEY`. Check `https://<api>.onrender.com/api/health`.
3. **Front end (Vercel):** Import repo → **Root Directory: `frontend`** → add env var `VITE_API_URL=https://<api>.onrender.com` → Deploy.
Free Render services sleep when idle: open the API URL a few minutes before your demo.

## API
`GET /api/meta` · `POST /api/plan[?save=true]` · `POST /api/replan` · `GET /api/prices/live?state=Maharashtra` · `PUT /api/prices` · `GET /api/history` · `GET /api/health` (interactive docs at `/docs`)

## Honest limits
Prices, nutrient values and requirements are sample figures; replace with IFCT / ICMR-NIN / live mandi data. Allergy filtering is ingredient-based and cannot detect cross-contact. Allergy, diabetes and anemia features are decision aids, not medical advice. Plans are saved only when the user presses **Save**, and contain no names.

`legacy/` holds the original single-file HTML prototype as a fallback.
