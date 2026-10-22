import { useState } from "react";
import type { Lang, MenuEntry, PlanFail, PlanOk } from "../types";
import { allergenName, inr, list, t } from "../i18n";

export const ICON: Record<string, string> = { cer: "🌾", pul: "🫘", veg: "🥦", leaf: "🥬", fruit: "🍌", milk: "🥛", egg: "🥚", meat: "🍗", fish: "🐟", oil: "🫒", oth: "🥜" };
const nm = (lang: Lang, x: { name: string; name_hi: string }) => (lang === "hi" ? x.name_hi : x.name);

export function SafetyBanner({ lang, plan }: { lang: Lang; plan: PlanOk | PlanFail }) {
  const T = (k: string, v?: Record<string, string | number>) => t(lang, k, v);
  const { safety: s, modes: m } = plan;
  const dietKey = ["veg", "veg_egg", "non_veg", "vegan", "jain"].indexOf(m.diet);
  const modes = [T("d" + dietKey), m.diabetes && T("mDia"), m.millet && T("mMil"), m.fruit && T("mFru")].filter(Boolean).join(" · ");
  return (
    <div className="sfe">
      {s.allergens.length > 0 && (<>
        <b>{T("safe")} {s.allergens.map((a) => allergenName(lang, a)).join(", ")}</b>
        <div className="note">{s.per_member.map((p) => `${T("member")} ${p.member} (${p.age}): ${p.allergies.map((a) => allergenName(lang, a)).join(", ")}`).join(" · ")}</div>
        <div className="note">{T("removedF")}: {s.removed_foods.join(", ")}</div>
        <div className="note">{T("caution")}</div>
      </>)}
      <div className="note" style={s.allergens.length ? { marginTop: 8 } : undefined}>{T("mode")}: {modes}</div>
    </div>
  );
}

export function NoPlan({ lang, plan }: { lang: Lang; plan: PlanFail }) {
  return (
    <div className="al">{t(lang, "noPlan")}
      {plan.hints.length > 0 && <div style={{ marginTop: 8 }}><b>{t(lang, "tryOne")}</b><ul>{plan.hints.map((h) => <li key={h}>{t(lang, "h_" + h)}</li>)}</ul></div>}
    </div>
  );
}

const say = (lang: Lang, text: string) => {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text); u.lang = lang === "hi" ? "hi-IN" : "en-IN"; window.speechSynthesis.speak(u);
};

export function PlanView({ lang, plan, onSave, saved }: { lang: Lang; plan: PlanOk; onSave: () => void; saved: boolean }) {
  const [icons, setIcons] = useState(false);
  const T = (k: string) => t(lang, k);
  const line = (i: PlanOk["items"][number]) => `${nm(lang, i)} ${i.kg.toFixed(1)} ${T("kgUnit")}`;
  const share = () => {
    const text = `ThaliWise: ₹${inr(plan.cost)}\n` + plan.items.map((i) => `• ${line(i)}`).join("\n");
    if (navigator.share) navigator.share({ text }).catch(() => undefined);
    else window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
  };
  return (<>
    {plan.diff < 0 && <div className="al">{T("overMsg")} ₹{inr(-plan.diff)}</div>}
    <div className="mt">
      <div><b>₹{inr(plan.cost)}</b><span>{T("cost")}</span></div>
      <div><b>₹{plan.per_person_day.toFixed(0)}</b><span>{T("perDay")}</span></div>
      <div><b style={{ color: plan.diff >= 0 ? "var(--ok)" : "var(--bad)" }}>₹{inr(Math.abs(plan.diff))}</b><span>{plan.diff >= 0 ? T("under") : T("over")}</span></div>
    </div>
    <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
      <div className="tabs" style={{ margin: 0 }}><button className={icons ? "" : "on"} onClick={() => setIcons(false)}>{T("listView")}</button><button className={icons ? "on" : ""} onClick={() => setIcons(true)}>{T("iconView")}</button></div>
      <span style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: "0 0 auto" }}>
        <button className="btn" onClick={() => say(lang, plan.items.map(line).join(". "))}>🔊 {T("listen")}</button>
        <button className="btn" onClick={share}>{T("share")}</button>
        <button className="btn p" disabled={saved} onClick={onSave}>{saved ? T("saved") : T("save")}</button>
      </span>
    </div>
    {icons ? (
      <div className="ig">{plan.items.map((i) => (
        <div className="ci" key={i.name}><div className="e">{ICON[i.icon] ?? "🍽️"}</div><div>{nm(lang, i)}{i.pds && <span className="tag">PDS</span>}</div>
          <div className="q">{i.kg.toFixed(1)} <small>{T("kgUnit")}</small></div><div className="note">₹{inr(i.cost)}</div>
          <button className="btn s" aria-label={T("listen")} onClick={() => say(lang, line(i))}>🔊</button></div>))}</div>
    ) : (
      <div className="tbw"><table><thead><tr><th>{T("food")}</th><th className="n">{T("kg")}</th><th className="n">{T("gpd")}</th><th className="n">₹</th></tr></thead>
        <tbody>{plan.items.map((i) => (<tr key={i.name}><td>{ICON[i.icon] ?? "🍽️"} {nm(lang, i)}{i.pds && <span className="tag">PDS</span>}</td>
          <td className="n">{i.kg.toFixed(2)}</td><td className="n">{i.g_per_person_day.toFixed(0)}</td><td className="n">₹{inr(i.cost)}</td></tr>))}</tbody></table></div>
    )}
  </>);
}

export function WhyView({ lang, plan }: { lang: Lang; plan: PlanOk }) {
  const T = (k: string, v?: Record<string, string | number>) => t(lang, k, v);
  const lim = plan.binding.map((b) => {
    if (b.type === "nutrient") return T("tight", { n: T(b.key) });
    if (b.type === "energy_cap") return T("eCap");
    if (b.type === "pds_full") return T("pFull");
    return T("fCap", { n: lang === "hi" ? b.name_hi : b.food });
  });
  return (<>
    <h3>{T("limits")}</h3>
    <div className="ev"><ul>{(lim.length ? lim : [T("noLimits")]).map((l, i) => <li key={i}>{l}</li>)}</ul></div>
    <h3>{T("whyEach")}</h3>
    <div className="tbw"><table><tbody>{plan.why.map((w) => {
      const it = plan.items.find((i) => i.name === w.name)!;
      const reason = w.pds ? T("pdsReason") : w.nutrient && w.share_pct != null ? T("supplies", { a: w.share_pct.toFixed(0), b: w.cost_pct.toFixed(0), n: lang === "hi" ? T(w.nutrient) : T(w.nutrient).toLowerCase() }) : "";
      return <tr key={w.name}><td>{ICON[it.icon] ?? "🍽️"} {nm(lang, it)}</td><td>{reason}</td></tr>;
    })}</tbody></table></div>
  </>);
}

const pill = (lang: Lang, level: string) => <span className={`pill ${level === "low" ? "p0" : level === "medium" ? "p1" : "p2"}`}>{t(lang, level)}</span>;

export function NutritionView({ lang, plan }: { lang: Lang; plan: PlanOk }) {
  const T = (k: string, v?: Record<string, string | number>) => t(lang, k, v);
  const unit = (k: string) => (k === "energy" ? "kcal" : k === "protein" ? "g" : "mg");
  const iron = plan.coverage.find((c) => c.key === "iron")!;
  return (<>
    <h3>{T("nutH")}</h3>
    <div className="tbw"><table><thead><tr><th></th><th className="n">{T("required")}</th><th style={{ width: "44%" }}>{T("thaliwise")} · {T("typical")}</th></tr></thead>
      <tbody>{plan.coverage.map((c) => (<tr key={c.key}><td>{T(c.key)}</td><td className="n">{inr(c.required_week)} {unit(c.key)}</td>
        <td><div className="row" style={{ justifyContent: "space-between", fontSize: 12 }}><span>{c.plan_pct.toFixed(0)}%</span><span className="note">{c.basket_pct.toFixed(0)}%</span></div>
          <div className="bar"><i style={{ width: `${Math.min(c.plan_pct, 100)}%`, background: "var(--ok)" }} /></div>
          <div className="bar"><i style={{ width: `${Math.min(c.basket_pct, 100)}%`, background: "var(--bad)" }} /></div></td></tr>))}</tbody></table></div>
    <div className="ev"><b>{T("nutSum", { a: inr(plan.cost), b: inr(plan.basket_cost), c: iron.basket_pct.toFixed(0), d: iron.plan_pct.toFixed(0) })}</b>
      <p>{T("anemia")}: {T("typical")} {pill(lang, plan.anemia.basket)} → {T("thaliwise")} {pill(lang, plan.anemia.plan)}</p>
      <p className="note">{T("anemiaNote")}</p><p className="note">{T("basketNote")}</p></div>
  </>);
}

export function MenuView({ lang, plan }: { lang: Lang; plan: PlanOk }) {
  const T = (k: string) => t(lang, k), days = list(lang, "days");
  const cell = (es: MenuEntry[]) => es.length ? es.map((e, i) => <div key={i}>{nm(lang, e)} {e.grams >= 1000 ? `${(e.grams / 1000).toFixed(1)} ${T("kgUnit")}` : `${Math.max(10, Math.round(e.grams / 10) * 10)} g`}</div>) : "—";
  return (<>
    <h3>{T("menuH")}</h3>
    <div className="tbw"><table><thead><tr><th></th><th>{T("mc1")}</th><th>{T("mc2")}</th><th>{T("mc3")}</th></tr></thead>
      <tbody>{plan.menu.map((d) => <tr key={d.day}><td><b>{days[d.day]}</b></td><td>{cell(d.staples)}</td><td>{cell(d.protein)}</td><td>{cell(d.veg)}</td></tr>)}</tbody></table></div>
    <p className="note">{T("menuNote")}</p>
  </>);
}
