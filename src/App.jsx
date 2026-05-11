import { useState, useEffect, useCallback } from "react";
import { supabase } from "./firebase";
const CONSULTORES_CLIENTES = {
  Bruna: ["Bradisfer", "Ritmus", "Sucesso", "Classic Tintas", "Tubets"],
  Vitória: ["Barto Equipamentos", "Cambero", "PJ Atacadista", "MS Distribuidora", "Caio Guarujá"],
  Joyce: ["DP Marketplace", "Mendes", "Lojas Mami", "Multilitoral", "Outlet das Tintas", "Printlar"],
  Julia: ["Evo", "Terramar", "AG Distribuidora", "Ricah", "Projeto Rio Preto"],
};
const consultores = Object.keys(CONSULTORES_CLIENTES);
const avatarColors = { Bruna: "#f472b6", Vitória: "#818cf8", Joyce: "#2dd4bf", Julia: "#34d399" };
const urgenciaCor = { normal: "#818cf8", urgente: "#f59e0b", critico: "#ef4444" };
function buildInitialState(def) {
  const s = {};
  consultores.forEach(c => CONSULTORES_CLIENTES[c].forEach(cli => { s[`${c}||${cli}`] = { ...def }; }));
  return s;
}
const defChecklist = { produtosBanidos: "", estoque: "", ads: "", pesos: "", data: "" };
const defAds = { roas: "", impressoes: "", cliques: "", investimento: "", ctr: "", data: "" };
const defMetricas = { crescimento: "", queda: "", proximosPassos: "", data: "" };
function Avatar({ name, size = 38 }) {
  const color = avatarColors[name] || "#64748b";
  return <div style={{ width: size, height: size, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: size * 0.38, color: "#fff", flexShrink: 0 }}>{name[0]}</div>;
}
function Badge({ text, color }) {
  return <span style={{ background: color + "22", color, border:  1px solid ${color}44 , borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{text}</span>;
}
const inputStyle = { width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
const labelStyle = { fontSize: 11, color: "#94a3b8", fontWeight: 700, letterSpacing: 1, marginBottom: 6, display: "block", textTransform: "uppercase" };
const cardStyle = { background: "#1e293b", border: "1px solid #334155", borderRadius: 14, padding: "20px 22px", marginBottom: 16 };
xport default function App() {
  const [tab, setTab] = useState("checklist");
  const [consultor, setConsultor] = useState("Bruna");
  const [cliente, setCliente] = useState(CONSULTORES_CLIENTES["Bruna"][0]);
  const [checklist, setChecklist] = useState(() => buildInitialState(defChecklist));
  const [ads, setAds] = useState(() => buildInitialState(defAds));
  const [metricas, setMetricas] = useState(() => buildInitialState(defMetricas));
  const [duvidas, setDuvidas] = useState([]);
  const [novaDuvida, setNovaDuvida] = useState({ consultor: "Bruna", texto: "", urgencia: "normal" });
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("idle");
  const today = new Date().toLocaleDateString("pt-BR");
  const ck =  ${consultor}||${cliente} ;
  const accentColor = avatarColors[consultor] || "#6366f1";
  useEffect(() => {
    async function load() {
      try {
        const [ckRes, adsRes, metRes, divRes] = await Promise.all([
          supabase.from("checklist").select("*"),
          supabase.from("ads").select("*"),
          supabase.from("metricas").select("*"),
          supabase.from("duvidas").select("*").order("id", { ascending: false }),
        ]);
        if (ckRes.data?.length) { const s = buildInitialState(defChecklist); ckRes.data.forEach(r => { if (s[r.id] !== undefined) s[r.id] = r.data; }); setChecklist(s); }
        if (adsRes.data?.length) { const s = buildInitialState(defAds); adsRes.data.forEach(r => { if (s[r.id] !== undefined) s[r.id] = r.data; }); setAds(s); }
        if (metRes.data?.length) { const s = buildInitialState(defMetricas); metRes.data.forEach(r => { if (s[r.id] !== undefined) s[r.id] = r.data; }); setMetricas(s); }
        if (divRes.data?.length) setDuvidas(divRes.data);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    load();
  }, []);
  const showSave = useCallback((ok) => { setSaveStatus(ok ? "saved" : "error"); setTimeout(() => setSaveStatus("idle"), 2000); }, []);
  async function handleChange(setter, key, table, field, value) {
    const updated = { ...((table === "checklist" ? checklist : table === "ads" ? ads : metricas)[key] || {}), [field]: value, data: today };
    setter(prev => ({ ...prev, [key]: updated }));
    setSaveStatus("saving");
    const { error } = await supabase.from(table).upsert({ id: key, data: updated });
    showSave(!error);
  }
  function handleConsultorChange(c) { setConsultor(c); setCliente(CONSULTORES_CLIENTES[c][0]); }
  async function addDuvida() {
    if (!novaDuvida.texto.trim()) return;
    const nova = { id: Date.now(), consultor: novaDuvida.consultor, texto: novaDuvida.texto, urgencia: novaDuvida.urgencia, data: today, resolvido: false };
    setSaveStatus("saving");
    const { error } = await supabase.from("duvidas").insert(nova);
    if (!error) { setDuvidas(prev => [nova, ...prev]); setNovaDuvida(d => ({ ...d, texto: "" })); }
    showSave(!error);
  }
  async function toggleResolvido(id, atual) {
    setSaveStatus("saving");
    const { error } = await supabase.from("duvidas").update({ resolvido: !atual }).eq("id", id);
    if (!error) setDuvidas(prev => prev.map(x => x.id === id ? { ...x, resolvido: !x.resolvido } : x));
    showSave(!error);
  }
  const tabs = [{ id: "checklist", label: "✅ Checklist" }, { id: "ads", label: "📊 ADS" }, { id: "duvidas", label: "❓ Dúvidas p/ Geovanne" }, { id: "metricas", label: "📈 Métricas" }];
  if (loading) return <div style={{ minHeight: "100vh", background: "#080d1a", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontFamily: "sans-serif" }}>🛒 Carregando...</div>;
eturn (
    <div style={{ minHeight: "100vh", background: "#080d1a", fontFamily: "'DM Sans','Segoe UI',sans-serif", color: "#e2e8f0" }}>
      <div style={{ background: "linear-gradient(135deg,#1a2540,#0f172a)", borderBottom: "1px solid #1e3a5f", padding: "0 24px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1040, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#6366f1,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>🛒</div>
            <div><div style={{ fontWeight: 800, fontSize: 15 }}>Marketplace Agency</div><div style={{ fontSize: 11, color: "#475569" }}>Painel de Gestão</div></div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {saveStatus === "saving" && <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 700 }}>💾 Salvando...</span>}
            {saveStatus === "saved" && <span style={{ fontSize: 12, color: "#22c55e", fontWeight: 700 }}>✓ Salvo!</span>}
            {saveStatus === "error" && <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 700 }}>✗ Erro</span>}
            <div style={{ fontSize: 12, color: "#475569", background: "#1e293b", padding: "4px 12px", borderRadius: 20, border: "1px solid #334155" }}>{today}</div>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "24px 18px" }}>
        {tab !== "duvidas" && (<>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>Consultora</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {consultores.map(c => (
                <button key={c} onClick={() => handleConsultorChange(c)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 16px 7px 9px", borderRadius: 40, border: consultor === c ?  2px solid ${avatarColors[c]}  : "2px solid #1e293b", background: consultor === c ? avatarColors[c] + "18" : "#1e293b", color: consultor === c ? avatarColors[c] : "#64748b", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
                  <Avatar name={c} size={32} />{c}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>Clientes de {consultor}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {CONSULTORES_CLIENTES[consultor].map(cli => (
                <button key={cli} onClick={() => setCliente(cli)} style={{ padding: "6px 14px", borderRadius: 20, border: cliente === cli ?  2px solid ${accentColor}  : "2px solid #1e293b", background: cliente === cli ? accentColor + "22" : "#1e293b", color: cliente === cli ? accentColor : "#64748b", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>{cli}</button>
              ))}
            </div>
          </div>
        </>)}
        <div style={{ display: "flex", gap: 3, marginBottom: 26, background: "#1e293b", borderRadius: 12, padding: 4, flexWrap: "wrap" }}>
          {tabs.map(t => (<button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, minWidth: 120, padding: "9px 12px", borderRadius: 9, border: "none", background: tab === t.id ? "#0f172a" : "transparent", color: tab === t.id ? "#e2e8f0" : "#64748b", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>{t.label}</button>))}
        </div>
{tab === "checklist" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <Avatar name={consultor} />
              <div><div style={{ fontWeight: 800, fontSize: 18 }}>Checklist Diário</div><div style={{ fontSize: 13, color: accentColor, fontWeight: 600 }}>{consultor} → {cliente}</div></div>
            </div>
            {[{ field: "produtosBanidos", label: "🚫 Produtos Banidos", ph: "Ex: 3 produtos banidos." },{ field: "estoque", label: "📦 Estoque de Produtos", ph: "Ex: 12 produtos críticos." },{ field: "ads", label: "💸 ADS", ph: "Ex: Campanhas ativas: 5." },{ field: "pesos", label: "⚖️ Pesos dos Produtos", ph: "Ex: Corrigido peso de 8 produtos." }].map(({ field, label, ph }) => (
              <div key={field} style={{ ...cardStyle, borderLeft:  3px solid ${accentColor}44  }}>
                <label style={labelStyle}>{label}</label>
                <textarea rows={3} value={checklist[ck]?.[field] || ""} onChange={e => handleChange(setChecklist, ck, "checklist", field, e.target.value)} placeholder={ph} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
                {checklist[ck]?.data && <div style={{ marginTop: 6, fontSize: 11, color: "#475569" }}>Atualizado: {checklist[ck].data}</div>}
              </div>
            ))}
          </div>
        )}
        {tab === "ads" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <Avatar name={consultor} />
              <div><div style={{ fontWeight: 800, fontSize: 18 }}>ADS — Performance</div><div style={{ fontSize: 13, color: accentColor, fontWeight: 600 }}>{consultor} → {cliente}</div></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[{ field: "roas", label: "🎯 ROAS", ph: "Ex: 4.2" },{ field: "impressoes", label: "👁️ Impressões", ph: "Ex: 128.400" },{ field: "cliques", label: "🖱️ Cliques", ph: "Ex: 3.210" },{ field: "investimento", label: "💰 Investimento (R$)", ph: "Ex: 1.250,00" },{ field: "ctr", label: "📊 CTR (%)", ph: "Ex: 2,5%" }].map(({ field, label, ph }) => (
                <div key={field} style={{ ...cardStyle, marginBottom: 0 }}>
                  <label style={labelStyle}>{label}</label>
                  <input value={ads[ck]?.[field] || ""} onChange={e => handleChange(setAds, ck, "ads", field, e.target.value)} placeholder={ph} style={inputStyle} />
                </div>
              ))}
            </div>
            {ads[ck]?.data && <div style={{ marginTop: 12, fontSize: 11, color: "#475569" }}>Atualizado: {ads[ck].data}</div>}
          </div>
        )}
{tab === "duvidas" && (
          <div>
            <div style={{ marginBottom: 20 }}><div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>❓ Dúvidas Para Geovanne</div><div style={{ fontSize: 13, color: "#64748b" }}>Mural coletivo</div></div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
              {consultores.map(c => { const count = duvidas.filter(d => d.consultor === c && !d.resolvido).length; return (
                <div key={c} style={{ display: "flex", alignItems: "center", gap: 8, background: "#1e293b", border: `1px solid ${count > 0 ? avatarColors[c] + "66" : "#334155"}`, borderRadius: 10, padding: "8px 14px" }}>
                  <Avatar name={c} size={26} />
                  <span style={{ fontWeight: 700, fontSize: 13, color: count > 0 ? avatarColors[c] : "#64748b" }}>{c}</span>
                  {count > 0 && <span style={{ background: avatarColors[c], color: "#fff", borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 800 }}>{count}</span>}
                </div>
              ); })}
            </div>
            <div style={{ ...cardStyle, borderTop: "3px solid #6366f1", marginBottom: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#a5b4fc", marginBottom: 16 }}>✏️ Nova dúvida</div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Quem está perguntando</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {consultores.map(c => (<button key={c} onClick={() => setNovaDuvida(d => ({ ...d, consultor: c }))} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px 6px 8px", borderRadius: 24, border: novaDuvida.consultor === c ? `2px solid ${avatarColors[c]}` : "2px solid #334155", background: novaDuvida.consultor === c ? avatarColors[c] + "22" : "transparent", color: novaDuvida.consultor === c ? avatarColors[c] : "#64748b", cursor: "pointer", fontWeight: 700, fontSize: 13 }}><Avatar name={c} size={22} />{c}</button>))}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Urgência</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[{ v: "normal", label: "🟢 Normal", color: "#818cf8" },{ v: "urgente", label: "🟡 Urgente", color: "#f59e0b" },{ v: "critico", label: "🔴 Crítico", color: "#ef4444" }].map(({ v, label, color }) => (<button key={v} onClick={() => setNovaDuvida(d => ({ ...d, urgencia: v }))} style={{ padding: "6px 16px", borderRadius: 24, border: novaDuvida.urgencia === v ? `2px solid ${color}` : "2px solid #334155", background: novaDuvida.urgencia === v ? color + "22" : "transparent", color: novaDuvida.urgencia === v ? color : "#64748b", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>{label}</button>))}
                </div>
              </div>
              <label style={labelStyle}>Dúvida</label>
              <textarea rows={3} value={novaDuvida.texto} onChange={e => setNovaDuvida(d => ({ ...d, texto: e.target.value }))} placeholder="Escreva sua dúvida para o Geovanne..." style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, marginBottom: 14 }} />
              <button onClick={addDuvida} style={{ background: "linear-gradient(135deg,#6366f1,#06b6d4)", color: "#fff", border: "none", borderRadius: 8, padding: "11px 30px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>+ Enviar</button>
            </div>
            {duvidas.length === 0 ? <div style={{ textAlign: "center", padding: "52px 0", color: "#475569" }}>💬 Nenhuma dúvida ainda.</div> : duvidas.map(d => (
              <div key={d.id} style={{ ...cardStyle, borderLeft: `4px solid ${urgenciaCor[d.urgencia] || "#818cf8"}`, opacity: d.resolvido ? 0.45 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <Avatar name={d.consultor} size={38} />
                    <div><div style={{ fontWeight: 800, fontSize: 15, color: avatarColors[d.consultor] }}>{d.consultor}</div><div style={{ fontSize: 11, color: "#475569" }}>{d.data}</div></div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Badge text={(d.urgencia || "normal").toUpperCase()} color={urgenciaCor[d.urgencia] || "#818cf8"} />
                    <button onClick={() => toggleResolvido(d.id, d.resolvido)} style={{ background: d.resolvido ? "#22c55e22" : "#0f172a", border: `1px solid ${d.resolvido ? "#22c55e" : "#334155"}`, color: d.resolvido ? "#22c55e" : "#64748b", borderRadius: 6, padding: "5px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>{d.resolvido ? "✓ Resolvido" : "Marcar resolvido"}</button>
                  </div>
                </div>
                <div style={{ marginTop: 12, fontSize: 14, lineHeight: 1.75, color: d.resolvido ? "#475569" : "#cbd5e1" }}>{d.texto}</div>
              </div>
            ))}
          </div>
        )}
{tab === "metricas" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <Avatar name={consultor} />
              <div><div style={{ fontWeight: 800, fontSize: 18 }}>Métricas</div><div style={{ fontSize: 13, color: accentColor, fontWeight: 600 }}>{consultor} → {cliente}</div></div>
            </div>
            {[{ field: "crescimento", label: "📈 Crescimento — O que foi feito", ph: "Descreva as ações positivas...", color: "#22c55e" },{ field: "queda", label: "📉 Queda — O que precisa ser feito", ph: "Identifique pontos de queda...", color: "#ef4444" },{ field: "proximosPassos", label: "🚀 Próximos Passos", ph: "Planejamento para os próximos dias...", color: "#6366f1" }].map(({ field, label, ph, color }) => (
              <div key={field} style={{ ...cardStyle, borderLeft: `4px solid ${color}` }}>
                <label style={{ ...labelStyle, color }}>{label}</label>
                <textarea rows={4} value={metricas[ck]?.[field] || ""} onChange={e => handleChange(setMetricas, ck, "metricas", field, e.target.value)} placeholder={ph} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
              </div>
            ))}
            {metricas[ck]?.data && <div style={{ fontSize: 11, color: "#475569", marginBottom: 20 }}>Atualizado: {metricas[ck].data}</div>}
            <div style={{ marginTop: 32 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: "#64748b", marginBottom: 14, letterSpacing: 1, textTransform: "uppercase" }}>Visão Geral</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 12 }}>
                {consultores.map(c => {
                  const total = CONSULTORES_CLIENTES[c].length;
                  const comDados = CONSULTORES_CLIENTES[c].filter(cli => metricas[`${c}||${cli}`]?.crescimento).length;
                  const pct = total ? Math.round((comDados / total) * 100) : 0;
                  return (
                    <button key={c} onClick={() => handleConsultorChange(c)} style={{ background: c === consultor ? avatarColors[c] + "18" : "#1e293b", border: `1px solid ${c === consultor ? avatarColors[c] : "#334155"}`, borderRadius: 12, padding: "16px", cursor: "pointer", textAlign: "left" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><Avatar name={c} size={30} /><span style={{ fontWeight: 700, fontSize: 14, color: c === consultor ? avatarColors[c] : "#e2e8f0" }}>{c}</span></div>
                      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>{total} clientes · {comDados} com dados</div>
                      <div style={{ height: 4, background: "#334155", borderRadius: 4, overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: avatarColors[c], borderRadius: 4 }} /></div>
                      <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>{pct}% preenchido</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`*{box-sizing:border-box;}textarea:focus,input:focus{border-color:#6366f1!important;}`}</style>
    </div>
  );
}