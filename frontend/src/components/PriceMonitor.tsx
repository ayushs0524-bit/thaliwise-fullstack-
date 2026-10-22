import { useState } from "react";
import { getLive } from "../api";
import type { HistoryRow, Lang, Meta, Replan } from "../types";
import { inr, t } from "../i18n";

interface Props {
  lang: Lang; meta: Meta; prices: Record<string, number>; replan: Replan | null; history: HistoryRow[];
  onApply: (p: Record<string, number>) => void; onReset: () => void;
}

export default function PriceMonitor({ lang, meta, prices, replan, history, onApply, onReset }: Props) {
  const T = (k: string, v?: Record<string, string | number>) => t(lang, k, v);
  const foods = meta.foods.filter((f) => f.tag !== "pds");
  const priceOf = (name: string) => prices[name] ?? foods.find((f) => f.name === name)?.price ?? 0;
  const [state, setState] = useState("Delhi"), [msg, setMsg] = useState(""), [simFood, setSimFood] = useState(foods[0]?.name ?? ""), [pct, setPct] = useState(50), [csv, setCsv] = useState("");

  const live = async () => {
    setMsg("…");
    try {
      const j = await getLive(state.trim());
      const n = Object.keys(j.prices).length;
      if (!n) throw new Error(j.error ?? "empty");
      onApply(j.prices); setMsg(T("liveOk", { n, d: j.date ?? "" }));
    } catch { setMsg(T("liveErr")); }
  };
  const importCsv = () => {
    const np: Record<string, number> = {};
    csv.split("\n").forEach((line) => {
      const [n, p] = line.split(",").map((x) => x.trim()); const f = foods.find((z) => z.name.toLowerCase() === n?.toLowerCase());
      if (f && Number(p) >= 0 && p !== "") np[f.name] = Number(p);
    });
    if (Object.keys(np).length) onApply(np);
  };
  const nameOf = (n: string) => { const f = meta.foods.find((z) => z.name === n); return lang === "hi" && f ? f.name_hi : n; };

  return (<>
    <div className="ev"><b>{T("live")}</b>
      <div className="row" style={{ marginTop: 8 }}><input type="text" value={state} aria-label={T("stateL")} onChange={(e) => setState(e.target.value)} /><button className="btn p" style={{ flex: "0 0 auto" }} onClick={live}>{T("fetch")}</button></div>
      <p className="note">{msg || T("liveNote")}</p><p className="note">{T("stateL")}</p></div>

    <div className="ev"><b>{T("sim")}</b>
      <div className="row" style={{ marginTop: 8 }}>
        <select value={simFood} onChange={(e) => setSimFood(e.target.value)}>{foods.map((f) => <option key={f.name} value={f.name}>{nameOf(f.name)}</option>)}</select>
        <input type="number" value={pct} style={{ maxWidth: 90 }} onChange={(e) => setPct(Number(e.target.value) || 0)} /><span style={{ flex: "0 0 auto" }}>%</span>
        <button className="btn p" style={{ flex: "0 0 auto" }} onClick={() => onApply({ [simFood]: Math.max(0, Math.round(priceOf(simFood) * (1 + pct / 100) * 10) / 10) })}>{T("apply")}</button></div></div>

    {replan?.feasible && (
      <div className="ev"><div className="mt"><div><b>₹{inr(replan.old_at_new_prices ?? 0)}</b><span>{T("oldNew")}</span></div><div><b>₹{inr(replan.new_cost ?? 0)}</b><span>{T("newPlan")}</span></div>
        <div><b style={{ color: "var(--ok)" }}>₹{inr(replan.savings ?? 0)}</b><span>{T("savings")}</span></div></div>
        {replan.changes?.length ? (<><b>{T("changed")}</b><ul>{replan.changes.map((c) => <li key={c.name}>{nameOf(c.name)}: {c.old_kg.toFixed(2)} → {c.new_kg.toFixed(2)}</li>)}</ul></>) : <p className="note">{T("same")}</p>}</div>)}

    <div className="ev"><b>{T("editPrices")}</b>
      <div className="tbw" style={{ maxHeight: 260, overflow: "auto", marginTop: 8 }}><table><tbody>{foods.map((f) => (
        <tr key={f.name + priceOf(f.name)}><td>{nameOf(f.name)}</td><td className="n" style={{ width: 110 }}>
          <input type="number" min={0} step={0.5} defaultValue={priceOf(f.name)} onBlur={(e) => { const v = Number(e.target.value); if (e.target.value !== "" && v >= 0 && v !== priceOf(f.name)) onApply({ [f.name]: v }); }} /></td></tr>))}</tbody></table></div></div>

    <div className="ev"><b>{T("csvH")}</b>
      <textarea rows={3} value={csv} placeholder="Rice,48" onChange={(e) => setCsv(e.target.value)} style={{ marginTop: 8 }} />
      <div className="row" style={{ marginTop: 8 }}><button className="btn p" style={{ flex: "0 0 auto" }} onClick={importCsv}>{T("apply")}</button><button className="btn" style={{ flex: "0 0 auto" }} onClick={onReset}>{T("reset")}</button></div></div>

    {history.length > 0 && <div className="ev"><b>{T("history")}</b><ul>{history.map((h) => <li key={h.id}>{new Date(h.created_at).toLocaleDateString()} · {h.members} {T("people")} · ₹{inr(h.cost)}</li>)}</ul></div>}
  </>);
}
