"""PostgreSQL (or SQLite fallback) storage: foods + prices + saved plan history."""
import json, os, pathlib
from datetime import datetime, timezone
from sqlalchemy import JSON, Float, Integer, String, DateTime, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

url = os.getenv("DATABASE_URL", "sqlite:///./thaliwise.db")
if url.startswith("postgres://"): url = "postgresql+psycopg2://" + url[len("postgres://"):]
elif url.startswith("postgresql://"): url = "postgresql+psycopg2://" + url[len("postgresql://"):]
engine = create_engine(url, pool_pre_ping=True)


class Base(DeclarativeBase): pass


class Food(Base):
    __tablename__ = "foods"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(60), unique=True)
    name_hi: Mapped[str] = mapped_column(String(80))
    icon: Mapped[str] = mapped_column(String(20)); group: Mapped[str] = mapped_column(String(20)); tag: Mapped[str] = mapped_column(String(10), default="")
    kcal: Mapped[float] = mapped_column(Float); protein: Mapped[float] = mapped_column(Float); iron: Mapped[float] = mapped_column(Float); calcium: Mapped[float] = mapped_column(Float)
    max_g: Mapped[float] = mapped_column(Float); cook_min: Mapped[int] = mapped_column(Integer)
    season_start: Mapped[int | None] = mapped_column(Integer, nullable=True); season_end: Mapped[int | None] = mapped_column(Integer, nullable=True)
    allergens: Mapped[list] = mapped_column(JSON, default=list); flags: Mapped[dict] = mapped_column(JSON, default=dict)
    price: Mapped[float] = mapped_column(Float)  # Rs/kg, market price
    price_source: Mapped[str] = mapped_column(String(40), default="sample")
    price_updated: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class SavedPlan(Base):
    """Only saved on the user's explicit request. Holds no names, only household composition and the plan."""
    __tablename__ = "plan_history"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    household: Mapped[dict] = mapped_column(JSON); cost: Mapped[float] = mapped_column(Float); plan: Mapped[dict] = mapped_column(JSON)


COLS = ["name", "name_hi", "icon", "group", "tag", "kcal", "protein", "iron", "calcium", "max_g", "cook_min", "season_start", "season_end", "allergens", "flags", "price"]


def init_db() -> None:
    Base.metadata.create_all(engine)
    with Session(engine) as s:
        if s.scalar(select(Food.id).limit(1)) is None:
            seed = json.loads((pathlib.Path(__file__).parent / "foods_seed.json").read_text(encoding="utf8"))
            s.add_all(Food(**{k: r[k] for k in COLS}) for r in seed); s.commit()


def load_foods(s: Session) -> list[dict]:
    return [{k: getattr(f, k) for k in COLS} | {"price_source": f.price_source} for f in s.scalars(select(Food).order_by(Food.id))]
