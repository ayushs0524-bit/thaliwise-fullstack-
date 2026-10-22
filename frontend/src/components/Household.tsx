import type { Lang, Member, Meta, Settings } from "../types";
import { allergenName, list, t } from "../i18n";

interface Props {
  lang: Lang; meta: Meta; members: Member[]; setMembers: (m: Member[]) => void;
  settings: Settings; setSettings: (s: Settings) => void; householdAllergens: Set<string>;
}

export default function Household({ lang, meta, members, setMembers, settings, setSettings, householdAllergens }: Props) {
  const T = (k: string) => t(lang, k);
  const upd = (i: number, patch: Partial<Member>) => setMembers(members.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  const toggleAllergy = (i: number, a: string) => {
    const cur = members[i].allergies;
    upd(i, { allergies: cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a] });
  };
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setSettings({ ...settings, [k]: v });
  const check = (k: "pds_enabled" | "quick_cook" | "no_fridge" | "diabetes" | "millet_boost" | "daily_fruit", label: string) => (
    <label className="ck"><input type="checkbox" checked={settings[k]} onChange={(e) => set(k, e.target.checked)} /><span>{T(label)}</span></label>
  );
  const blocked = (a: string[]) => a.some((x) => householdAllergens.has(x));
  const toggleExcluded = (name: string) =>
    set("excluded", settings.excluded.includes(name) ? settings.excluded.filter((x) => x !== name) : [...settings.excluded, name]);

  return (
    <aside>
      <section className="panel">
        <h3>{T("household")}</h3>
        {members.map((m, i) => (
          <div className="mx" key={i}>
            <div className="row">
              <div><label className="f">{T("age")}</label>
                <input type="number" min={0} max={110} value={m.age} onChange={(e) => upd(i, { age: Math.max(0, Math.min(110, Number(e.target.value) || 0)) })} /></div>
              <div><label className="f">{T("sex")}</label>
                <select value={m.sex} onChange={(e) => upd(i, { sex: e.target.value as "F" | "M", status: 0 })}><option value="F">{T("F")}</option><option value="M">{T("M")}</option></select></div>
              <div><label className="f">{T("status")}</label>
                <select value={m.status} disabled={m.sex !== "F" || m.age < 15 || m.age >= 50} onChange={(e) => upd(i, { status: Number(e.target.value) as 0 | 1 | 2 })}>
                  <option value={0}>{T("s0")}</option><option value={1}>{T("s1")}</option><option value={2}>{T("s2")}</option></select></div>
              <button className="btn s" aria-label={T("remove")} disabled={members.length <= 1} onClick={() => setMembers(members.filter((_, j) => j !== i))}>×</button>
            </div>
            <div className="chips">
              <span className="note" style={{ alignSelf: "center" }}>{T("allergy")}:</span>
              {meta.allergens.map((a) => (
                <button key={a} type="button" className={`chip ${m.allergies.includes(a) ? "on" : ""}`} aria-pressed={m.allergies.includes(a)} onClick={() => toggleAllergy(i, a)}>
                  {allergenName(lang, a)}
                </button>
              ))}
            </div>
          </div>
        ))}
        {members.length < 12 && <button className="btn" onClick={() => setMembers([...members, { age: 30, sex: "F", status: 0, allergies: [] }])}>{T("addMember")}</button>}
        <p className="note">{T("allergyNote")}</p>
      </section>

      <section className="panel">
        <h3>{T("budget")}</h3>
        <label className="f">{T("budgetL")}</label>
        <input type="number" min={0} value={settings.budget} onChange={(e) => set("budget", Math.max(0, Number(e.target.value) || 0))} />
        <label className="f">{T("diet")}</label>
        <select value={settings.diet} onChange={(e) => set("diet", Number(e.target.value))}>{[0, 1, 2, 3, 4].map((d) => <option key={d} value={d}>{T("d" + d)}</option>)}</select>
        <label className="f">{T("month")}</label>
        <select value={settings.month} onChange={(e) => set("month", Number(e.target.value))}>{list(lang, "months").map((m, i) => <option key={i} value={i}>{m}</option>)}</select>
      </section>

      <section className="panel">
        <h3>{T("pdsH")}</h3>
        {check("pds_enabled", "pdsOn")}
        {settings.pds_enabled && (<>
          <label className="f">{T("pdsKg")}</label>
          <input type="number" min={0} step={0.5} value={settings.pds_kg_per_person_month} onChange={(e) => set("pds_kg_per_person_month", Math.max(0, Number(e.target.value) || 0))} />
          <label className="f">{T("pdsPrice")}</label>
          <input type="number" min={0} step={0.5} value={settings.pds_price} onChange={(e) => set("pds_price", Math.max(0, Number(e.target.value) || 0))} />
        </>)}
      </section>

      <section className="panel">
        <h3>{T("prefH")}</h3>
        {check("quick_cook", "quick")}{check("no_fridge", "nofridge")}
        <label className="f">{T("avoid")}</label>
        <div className="exl">
          {meta.foods.filter((f) => f.tag !== "pds").map((f) => blocked(f.allergens)
            ? <label className="ck" key={f.name}><input type="checkbox" checked disabled /><span><s>{lang === "hi" ? f.name_hi : f.name}</s><span className="tag">⚠ {f.allergens.filter((a) => householdAllergens.has(a)).map((a) => allergenName(lang, a)).join("/")}</span></span></label>
            : <label className="ck" key={f.name}><input type="checkbox" checked={settings.excluded.includes(f.name)} onChange={() => toggleExcluded(f.name)} /><span>{lang === "hi" ? f.name_hi : f.name}</span></label>)}
        </div>
      </section>

      <section className="panel">
        <h3>{T("healthH")}</h3>
        {check("diabetes", "dia")}{check("millet_boost", "mil")}{check("daily_fruit", "fru")}
      </section>
    </aside>
  );
}
