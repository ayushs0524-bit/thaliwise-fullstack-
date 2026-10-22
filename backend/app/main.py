import os
from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from . import core
from .db import Food, SavedPlan, engine, init_db, load_foods
from .prices import fetch_live


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db(); yield


app = FastAPI(title="ThaliWise API", version="2.0.0", lifespan=lifespan)
origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",") if o.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["*"], allow_headers=["*"])


def get_db():
    with Session(engine) as s: yield s


class Member(BaseModel):
    age: int = Field(ge=0, le=110)
    sex: str = Field(pattern="^[FM]$")
    status: int = Field(default=0, ge=0, le=2)  # 0 none, 1 pregnant, 2 lactating
    allergies: list[str] = []


class PlanRequest(BaseModel):
    members: list[Member] = Field(min_length=1, max_length=12)
    budget: float = Field(default=1500, ge=0)
    diet: int = Field(default=0, ge=0, le=4)  # 0 veg, 1 veg+egg, 2 non-veg, 3 vegan, 4 jain
    pds_enabled: bool = True
    pds_kg_per_person_month: float = Field(default=5, ge=0)
    pds_price: float = Field(default=0, ge=0)
    month: int = Field(default=9, ge=0, le=11)
    quick_cook: bool = False
    no_fridge: bool = False
    excluded: list[str] = []
    diabetes: bool = False
    millet_boost: bool = False
    daily_fruit: bool = False
    prices: dict[str, float] = {}  # per-request price overrides (Rs/kg)


class ReplanRequest(BaseModel):
    request: PlanRequest
    new_prices: dict[str, float]


class PriceUpdate(BaseModel):
    prices: dict[str, float]


def _req(r: PlanRequest) -> dict:
    d = r.model_dump(); bad = {a for m in d["members"] for a in m["allergies"]} - set(core.ALLERGENS)
    if bad: raise HTTPException(422, f"Unknown allergen: {sorted(bad)}")
    return d


@app.get("/api/health")
def health(): return {"ok": True}


@app.get("/api/meta")
def meta(db: Session = Depends(get_db)):
    return dict(allergens=core.ALLERGENS, diets=core.DIETS, foods=load_foods(db))


@app.post("/api/plan")
def plan(r: PlanRequest, save: bool = False, db: Session = Depends(get_db)):
    d = _req(r); foods = load_foods(db); out = core.solve(d, foods, d["prices"])
    if save and out["feasible"]:
        row = SavedPlan(household=dict(members=[dict(age=m["age"], sex=m["sex"], status=m["status"], allergies=m["allergies"]) for m in d["members"]], diet=d["diet"]),
                        cost=out["cost"], plan=dict(items=[(i["name"], round(i["kg"], 2)) for i in out["items"]]))
        db.add(row); db.commit(); out["saved_id"] = row.id
    return out


@app.post("/api/replan")
def replan(r: ReplanRequest, db: Session = Depends(get_db)):
    d = _req(r.request)
    return core.replan(d, load_foods(db), d["prices"], r.new_prices)


@app.get("/api/history")
def history(db: Session = Depends(get_db)):
    rows = db.scalars(select(SavedPlan).order_by(SavedPlan.id.desc()).limit(10))
    return [dict(id=x.id, created_at=x.created_at, cost=x.cost, members=len(x.household["members"]), items=x.plan["items"]) for x in rows]


@app.get("/api/prices/live")
async def live(state: str = Query("Delhi", max_length=40)):
    return await fetch_live(state)


@app.put("/api/prices")
def set_prices(p: PriceUpdate, db: Session = Depends(get_db)):
    """Persist default prices (e.g. after a live fetch)."""
    from datetime import datetime, timezone
    n = 0
    for f in db.scalars(select(Food).where(Food.name.in_(list(p.prices)))):
        if f.tag != "pds": f.price = p.prices[f.name]; f.price_source = "manual"; f.price_updated = datetime.now(timezone.utc); n += 1
    db.commit(); return dict(updated=n)
