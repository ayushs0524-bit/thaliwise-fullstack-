import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getHistory, getMeta, getPlan, getReplan } from "./api";
import Household from "./components/Household";
import PriceMonitor from "./components/PriceMonitor";
import { MenuView, NoPlan, NutritionView, PlanView, SafetyBanner, WhyView } from "./components/Views";
import { t } from "./i18n";
import type { HistoryRow, Lang, Member, Meta, Plan, PlanRequest, Replan, Settings } from "./types";

const DEFAULT_MEMBERS: Member[] = [
  { age: 32, sex: "F", status: 0, allergies: [] }, { age: 36, sex: "M", status: 0, allergies: [] },
  { age: 8, sex: "F", status: 0, allergies: [] }, { age: 5, sex: "M", status: 0, allergies: [] },
];
const DEFAULT_SETTINGS: Settings = {
  budget: 1500, diet: 0, pds_enabled: true, pds_kg_per_person_month: 5, pds_price: 0, month: new Date().getMonth(),
  quick_cook: false, no_fridge: false, excluded: [], diabetes: false, millet_boost: false, daily_fruit: false,
};
const TABS = ["tPlan", "tWhy", "tNut", "tMenu", "tPrice"] as const;

export default function App() {
  const [lang, setLang] = useState<Lang>(navigator.language.toLowerCase().startsWith("hi") ? "hi" : "en");
  const [meta, setMeta] = useState<Meta | null>(null);
  const [members, setMembers] = useState<Member[]>(DEFAULT_MEMBERS);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [plan, setPlan] = useState<Plan | null>(null);
  const [replan, setReplan] = useState<Replan | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [tab, setTab] = useState(0);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const request: PlanRequest = useMemo(() => ({ ...settings, members, prices }), [settings, members, prices]);
  const householdAllergens = useMemo(() => new Set(members.flatMap((m) => m.allergies)), [members]);
  const T = (k: string) => t(lang, k);

  useEffect(() => { getMeta().then(setMeta).catch(() => setError(true)); }, []);

  // Re-plan automatically (debounced) whenever the household, settings or prices change.
  const seq = useRef(0);
  useEffect(() => {
    if (!meta) return;
    const ctl = new AbortController(), id = ++seq.current;
    setLoading(true); setSaved(false);
    const timer = setTimeout(() => {
      getPlan(request, ctl.signal)
        .then((p) => { if (id === seq.current) { setPlan(p); setError(false); } })
        .catch((e: unknown) => { if (!(e instanceof DOMException && e.name === "AbortError")) setError(true); })
        .finally(() => { if (id === seq.current) setLoading(false); });
    }, 250);
    return () => { clearTimeout(timer); ctl.abort(); };
  }, [request, meta]);

  const refreshHistory = useCallback(() => { getHistory().then(setHistory).catch(() => undefined); }, []);
  useEffect(() => { if (TABS[tab] === "tPrice") refreshHistory(); }, [tab, refreshHistory]);

  const applyPrices = async (np: Record<string, number>) => {
    try { setReplan(await getReplan(request, np)); } catch { setReplan(null); }
    setPrices((p) => ({ ...p, ...np }));
  };
  const save = async () => { try { await getPlan(request, undefined, true); setSaved(true); refreshHistory(); } catch { setError(true); } };

  return (
    <>
      <header>
        <div><h1>Thali<em>Wise</em></h1><p>{T("tagline")}</p></div>
        <div className="row" style={{ flex: "0 0 auto" }}>
          <button className="btn" onClick={() => setLang(lang === "en" ? "hi" : "en")}>{lang === "en" ? "हिन्दी" : "English"}</button>
          <button className="btn" onClick={() => window.print()}>🖨️</button>
        </div>
      </header>
      <div className="layout">
        {meta ? <Household lang={lang} meta={meta} members={members} setMembers={setMembers} settings={settings} setSettings={setSettings} householdAllergens={householdAllergens} /> : <aside className="panel">{error ? T("err") : T("loading")}</aside>}
        <main>
          <div className="tabs" role="tablist">{TABS.map((k, i) => <button key={k} role="tab" aria-selected={tab === i} className={tab === i ? "on" : ""} onClick={() => setTab(i)}>{T(k)}</button>)}</div>
          {error && <div className="al">{T("err")}</div>}
          {loading && !plan && <p className="note">{T("loading")}</p>}
          {plan && (<>
            <SafetyBanner lang={lang} plan={plan} />
            {!plan.feasible ? <NoPlan lang={lang} plan={plan} /> : (<>
              {tab === 0 && <PlanView lang={lang} plan={plan} onSave={save} saved={saved} />}
              {tab === 1 && <WhyView lang={lang} plan={plan} />}
              {tab === 2 && <NutritionView lang={lang} plan={plan} />}
              {tab === 3 && <MenuView lang={lang} plan={plan} />}
            </>)}
            {tab === 4 && meta && <PriceMonitor lang={lang} meta={meta} prices={prices} replan={replan} history={history} onApply={applyPrices} onReset={() => { setPrices({}); setReplan(null); }} />}
          </>)}
          <p className="note" style={{ marginTop: 20 }}>{T("disclaimer")}</p>
        </main>
      </div>
    </>
  );
}
