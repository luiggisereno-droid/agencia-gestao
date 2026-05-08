import { useState, useEffect } from "react";

import { db } from "./firebase";

import {
collection,
addDoc,
getDocs,
updateDoc,
doc
} from "firebase/firestore";

const CONSULTORAS = [
  { id: 1, nome: "Bruna", cor: "#6EE7B7" },
  { id: 2, nome: "Vitória", cor: "#93C5FD" },
  { id: 3, nome: "Joyce", cor: "#FCA5A5" },
  { id: 4, nome: "Julia", cor: "#FCD34D" },
];

const [clientes, setClientes] = useState([]);
useEffect(() => {
  carregarClientes();
}, []);

async function carregarClientes() {
  const querySnapshot = await getDocs(
    collection(db, "clientes")
  );

  const lista = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));

  setClientes(lista);
}
const CHECKLIST_ITENS = [
  { id: "anuncios", label: "Anúncios", icon: "📢" },
  { id: "ads", label: "Ads", icon: "🎯" },
  { id: "central_mkt", label: "Central de Marketing", icon: "📣" },
  { id: "estoque", label: "Estoque de Produtos", icon: "📦" },
  { id: "banidos", label: "Produtos Banidos", icon: "🚫" },
];

const SEMANAS = ["Sem 1", "Sem 2", "Sem 3", "Sem 4"];

function getWeekIdx() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return Math.min(Math.ceil((now.getDate() + start.getDay()) / 7) - 1, 3);
}

const initClienteData = () => {
  const d = {};
  CONSULTORAS.forEach((c) => {
    d[c.id] = {};
    CLIENTES[c.id].forEach((cliente) => {
      d[c.id][cliente] = {
        checklist: {},
        contatos: { 0: 0, 1: 0, 2: 0, 3: 0 },
        observacoes: { 0: "", 1: "", 2: "", 3: "" },
        crescimento: "",
        melhorias: "",
        pioras: "",
      };
      SEMANAS.forEach((_, si) => {
        d[c.id][cliente].checklist[si] = {};
        CHECKLIST_ITENS.forEach((item) => {
          d[c.id][cliente].checklist[si][item.id] = false;
        });
      });
    });
  });
  return d;
};

export default function App() {
  const [aba, setAba] = useState("checklist");
  const [semanaAtiva, setSemanaAtiva] = useState(getWeekIdx());
  const [consultoraSelecionada, setConsultoraSelecionada] = useState(1);
  const [clienteSelecionado, setClienteSelecionado] = useState(CLIENTES[1][0]);
  const [data, setData] = useState(initClienteData());
  const [duvidas, setDuvidas] = useState(Object.fromEntries(CONSULTORAS.map((c) => [c.id, []])));
  const [novaDuvida, setNovaDuvida] = useState(Object.fromEntries(CONSULTORAS.map((c) => [c.id, ""])));

  const cor = CONSULTORAS.find((c) => c.id === consultoraSelecionada).cor;
  const clientes = CLIENTES[consultoraSelecionada];
  const clienteData = data[consultoraSelecionada][clienteSelecionado];

  const selecionarConsultora = (id) => {
    setConsultoraSelecionada(id);
    setClienteSelecionado(CLIENTES[id][0]);
  };

  const toggleCheck = (itemId) => {
    setData((prev) => ({
      ...prev,
      [consultoraSelecionada]: {
        ...prev[consultoraSelecionada],
        [clienteSelecionado]: {
          ...prev[consultoraSelecionada][clienteSelecionado],
          checklist: {
            ...prev[consultoraSelecionada][clienteSelecionado].checklist,
            [semanaAtiva]: {
              ...prev[consultoraSelecionada][clienteSelecionado].checklist[semanaAtiva],
              [itemId]: !prev[consultoraSelecionada][clienteSelecionado].checklist[semanaAtiva][itemId],
            },
          },
        },
      },
    }));
  };

  const updateField = (field, value) => {
    setData((prev) => ({
      ...prev,
      [consultoraSelecionada]: {
        ...prev[consultoraSelecionada],
        [clienteSelecionado]: {
          ...prev[consultoraSelecionada][clienteSelecionado],
          [field]: value,
        },
      },
    }));
  };

  const updateContato = (semIdx, value) => {
    setData((prev) => ({
      ...prev,
      [consultoraSelecionada]: {
        ...prev[consultoraSelecionada],
        [clienteSelecionado]: {
          ...prev[consultoraSelecionada][clienteSelecionado],
          contatos: {
            ...prev[consultoraSelecionada][clienteSelecionado].contatos,
            [semIdx]: Number(value),
          },
        },
      },
    }));
  };

  const updateObservacao = (semIdx, value) => {
    setData((prev) => ({
      ...prev,
      [consultoraSelecionada]: {
        ...prev[consultoraSelecionada],
        [clienteSelecionado]: {
          ...prev[consultoraSelecionada][clienteSelecionado],
          observacoes: {
            ...prev[consultoraSelecionada][clienteSelecionado].observacoes,
            [semIdx]: value,
          },
        },
      },
    }));
  };

  const adicionarDuvida = (consultId) => {
    const texto = novaDuvida[consultId].trim();
    if (!texto) return;
    setDuvidas((prev) => ({ ...prev, [consultId]: [...prev[consultId], { texto, resolvida: false, data: new Date().toLocaleDateString("pt-BR") }] }));
    setNovaDuvida((prev) => ({ ...prev, [consultId]: "" }));
  };

  const toggleDuvida = (consultId, idx) => {
    setDuvidas((prev) => ({ ...prev, [consultId]: prev[consultId].map((d, i) => i === idx ? { ...d, resolvida: !d.resolvida } : d) }));
  };

  const removerDuvida = (consultId, idx) => {
    setDuvidas((prev) => ({ ...prev, [consultId]: prev[consultId].filter((_, i) => i !== idx) }));
  };

  const progresso = (consultId, cliente, semIdx) => {
    const checks = data[consultId][cliente].checklist[semIdx];
    const done = Object.values(checks).filter(Boolean).length;
    const total = CHECKLIST_ITENS.length;
    return { done, total, pct: Math.round((done / total) * 100) };
  };

  const progressoGeral = (consultId, semIdx) => {
    const clts = CLIENTES[consultId];
    const total = clts.length * CHECKLIST_ITENS.length;
    const done = clts.reduce((acc, cl) => acc + Object.values(data[consultId][cl].checklist[semIdx]).filter(Boolean).length, 0);
    return Math.round((done / total) * 100);
  };

  const totalContatosCliente = (consultId, cliente) =>
    Object.values(data[consultId][cliente].contatos).reduce((a, b) => a + b, 0);

  const checks = clienteData.checklist[semanaAtiva];
  const done = Object.values(checks).filter(Boolean).length;
  const pct = Math.round((done / CHECKLIST_ITENS.length) * 100);

  const corTag = cor === "#6EE7B7" ? "tag-verde" : cor === "#93C5FD" ? "tag-azul" : cor === "#FCD34D" ? "tag-amarelo" : "tag-vermelha";

  return (
    <div style={{ minHeight: "100vh", background: "#0D0F14", color: "#E8EAF0", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #1A1D24; } ::-webkit-scrollbar-thumb { background: #2E3240; border-radius: 4px; }
        .card { background: #151820; border: 1px solid #1E2230; border-radius: 16px; }
        .btn-aba { background: transparent; border: none; cursor: pointer; padding: 9px 18px; border-radius: 10px; font-family: inherit; font-size: 13px; font-weight: 500; transition: all .2s; color: #6B7280; }
        .btn-aba.ativo { background: #1E2230; color: #E8EAF0; }
        .btn-aba:hover:not(.ativo) { color: #C4C9D8; }
        .check-item { display: flex; align-items: center; gap: 12px; padding: 11px 14px; border-radius: 10px; cursor: pointer; transition: background .15s; }
        .check-item:hover { background: #1A1D28; }
        .checkbox { width: 20px; height: 20px; border-radius: 6px; border: 2px solid #2E3240; display: flex; align-items: center; justify-content: center; transition: all .15s; flex-shrink: 0; }
        .pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .input-sutil { background: #1A1D28; border: 1px solid #2E3240; border-radius: 10px; padding: 10px 14px; color: #E8EAF0; font-family: inherit; font-size: 14px; width: 100%; outline: none; resize: none; transition: border .2s; }
        .input-sutil:focus { border-color: #4B5570; }
        .num-btn { background: #1E2230; border: none; color: #9CA3AF; width: 28px; height: 28px; border-radius: 7px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; transition: all .15s; }
        .num-btn:hover { background: #2E3240; color: #E8EAF0; }
        .progress-bar { height: 5px; background: #1E2230; border-radius: 3px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 3px; transition: width .4s ease; }
        .semana-btn { padding: 6px 12px; border-radius: 8px; border: 1px solid #2E3240; background: transparent; color: #6B7280; cursor: pointer; font-family: inherit; font-size: 12px; transition: all .15s; }
        .semana-btn.ativo { background: #1E2230; border-color: #3E4560; color: #E8EAF0; }
        .metric-card { background: #0F1117; border: 1px solid #1A1D28; border-radius: 12px; padding: 14px; }
        textarea.input-sutil { min-height: 72px; }
        .cliente-btn { padding: 8px 12px; border-radius: 9px; border: 1px solid #1E2230; background: transparent; color: #6B7280; cursor: pointer; font-family: inherit; font-size: 12px; font-weight: 500; transition: all .15s; text-align: left; }
        .cliente-btn.ativo { color: #E8EAF0; }
        .cliente-btn:hover:not(.ativo) { color: #B0B8CC; border-color: #2E3240; }
        .tag-verde { background: rgba(110,231,183,.12); color: #6EE7B7; }
        .tag-vermelha { background: rgba(252,165,165,.12); color: #FCA5A5; }
        .tag-azul { background: rgba(147,197,253,.12); color: #93C5FD; }
        .tag-amarelo { background: rgba(252,211,77,.12); color: #FCD34D; }
      `}</style>

      {/* Header */}
      <div style={{ padding: "20px 24px 0", borderBottom: "1px solid #1E2230" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2, color: "#4B5570", textTransform: "uppercase", marginBottom: 3 }}>Painel da Agência</div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700 }}>Gestão de Contas</h1>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#4B5570" }}>Semana ativa</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#6EE7B7" }}>{SEMANAS[semanaAtiva]}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {[
            { id: "checklist", label: "✓ Checklist" },
            { id: "contatos", label: "💬 Contatos" },
            { id: "metricas", label: "📈 Métricas" },
            { id: "visao_geral", label: "⬛ Visão Geral" },
            { id: "duvidas", label: "🙋 Dúvidas com Geovanne" },
          ].map((a) => (
            <button key={a.id} className={`btn-aba ${aba === a.id ? "ativo" : ""}`} onClick={() => setAba(a.id)}>{a.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px 24px" }}>

        {/* Seletor de consultora */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {CONSULTORAS.map((c) => {
            const pg = progressoGeral(c.id, semanaAtiva);
            const ativa = consultoraSelecionada === c.id;
            return (
              <div key={c.id} onClick={() => selecionarConsultora(c.id)} style={{
                padding: "7px 14px", borderRadius: 10, cursor: "pointer",
                border: `1px solid ${ativa ? c.cor + "55" : "#1E2230"}`,
                background: ativa ? "#1E2230" : "transparent",
                color: ativa ? "#E8EAF0" : "#6B7280",
                fontSize: 13, fontWeight: 500, transition: "all .15s",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ color: c.cor }}>●</span>
                {c.nome}
                <span style={{ fontSize: 11, color: pg === 100 ? "#6EE7B7" : "#6B7280" }}>{pg}%</span>
              </div>
            );
          })}
        </div>

        {/* Layout 2 colunas */}
        {aba !== "visao_geral" && aba !== "duvidas" && (
          <div style={{ display: "flex", gap: 14 }}>

            {/* Sidebar clientes */}
            <div style={{ width: 155, flexShrink: 0 }}>
              <div style={{ fontSize: 10, color: "#4B5570", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Clientes</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {clientes.map((cl) => {
                  const p = progresso(consultoraSelecionada, cl, semanaAtiva);
                  const ativo = clienteSelecionado === cl;
                  return (
                    <div key={cl} className={`cliente-btn ${ativo ? "ativo" : ""}`} onClick={() => setClienteSelecionado(cl)}
                      style={{ borderColor: ativo ? cor + "55" : "#1E2230", background: ativo ? "#1A1D28" : "transparent" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 100 }}>{cl}</span>
                        {aba === "checklist" && (
                          <span style={{ fontSize: 10, color: p.pct === 100 ? "#6EE7B7" : p.pct > 0 ? cor : "#3E4560", flexShrink: 0, marginLeft: 4 }}>
                            {p.done}/{p.total}
                          </span>
                        )}
                      </div>
                      {ativo && aba === "checklist" && (
                        <div className="progress-bar" style={{ marginTop: 5 }}>
                          <div className="progress-fill" style={{ width: `${p.pct}%`, background: p.pct === 100 ? "#6EE7B7" : cor }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Conteúdo */}
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* CHECKLIST */}
              {aba === "checklist" && (
                <div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                    {SEMANAS.map((s, i) => {
                      const p = progresso(consultoraSelecionada, clienteSelecionado, i);
                      return (
                        <button key={i} className={`semana-btn ${semanaAtiva === i ? "ativo" : ""}`} onClick={() => setSemanaAtiva(i)}>
                          {s}{p.done > 0 && <span style={{ marginLeft: 4, color: p.pct === 100 ? "#6EE7B7" : cor, fontSize: 10 }}>{p.pct}%</span>}
                        </button>
                      );
                    })}
                  </div>
                  <div className="card" style={{ padding: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: cor }} />
                      <span style={{ fontWeight: 600, fontSize: 15 }}>{clienteSelecionado}</span>
                      <span className={`pill ${corTag}`} style={{ marginLeft: "auto", fontSize: 10 }}>
                        {CONSULTORAS.find(c => c.id === consultoraSelecionada).nome}
                      </span>
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 11, color: "#6B7280" }}>Progresso {SEMANAS[semanaAtiva]}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: pct === 100 ? "#6EE7B7" : "#E8EAF0" }}>{done}/{CHECKLIST_ITENS.length}</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: pct === 100 ? "#6EE7B7" : cor }} />
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {CHECKLIST_ITENS.map((item) => {
                        const checked = checks[item.id];
                        return (
                          <div key={item.id} className="check-item" onClick={() => toggleCheck(item.id)} style={{ opacity: checked ? .5 : 1 }}>
                            <div className="checkbox" style={{ background: checked ? cor : "transparent", borderColor: checked ? "transparent" : "#2E3240" }}>
                              {checked && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#0D0F14" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                            </div>
                            <span style={{ fontSize: 13, textDecoration: checked ? "line-through" : "none" }}>{item.icon} {item.label}</span>
                            {checked && <span className="pill tag-verde" style={{ marginLeft: "auto", fontSize: 10 }}>✓</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* CONTATOS */}
              {aba === "contatos" && (
                <div className="card" style={{ padding: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: cor }} />
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{clienteSelecionado}</span>
                    <span style={{ fontSize: 11, color: "#6B7280", marginLeft: "auto" }}>contatos diretos</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                    {SEMANAS.map((s, i) => {
                      const val = clienteData.contatos[i];
                      return (
                        <div key={i} className="metric-card" style={{ borderColor: i === semanaAtiva ? cor + "44" : "#1A1D28" }}>
                          <div style={{ fontSize: 10, color: "#6B7280", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                            <span>{s}</span>
                            {i === semanaAtiva && <span style={{ color: cor, fontSize: 9 }}>● atual</span>}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <button className="num-btn" onClick={() => updateContato(i, Math.max(0, val - 1))}>−</button>
                            <span style={{ fontSize: 26, fontWeight: 700, color: val > 0 ? cor : "#3E4560", minWidth: 36, textAlign: "center" }}>{val}</span>
                            <button className="num-btn" onClick={() => updateContato(i, val + 1)}>+</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ background: "#0F1117", borderRadius: 10, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#6B7280" }}>Total no mês</span>
                    <span style={{ fontSize: 22, fontWeight: 700, color: cor }}>{totalContatosCliente(consultoraSelecionada, clienteSelecionado)}</span>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <label style={{ fontSize: 11, color: "#FCD34D", display: "block", marginBottom: 5 }}>📝 Observações — {SEMANAS[semanaAtiva]}</label>
                    <textarea
                      className="input-sutil"
                      style={{ minHeight: 80, borderColor: clienteData.observacoes[semanaAtiva] ? "#FCD34D44" : "#2E3240" }}
                      placeholder="Anote problemas, pendências ou detalhes importantes da conversa com o cliente..."
                      value={clienteData.observacoes[semanaAtiva]}
                      onChange={(e) => updateObservacao(semanaAtiva, e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* MÉTRICAS */}
              {aba === "metricas" && (
                <div className="card" style={{ padding: 18 }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                    {SEMANAS.map((s, i) => (
                      <button key={i} className={`semana-btn ${semanaAtiva === i ? "ativo" : ""}`} onClick={() => setSemanaAtiva(i)}>{s}</button>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: cor }} />
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{clienteSelecionado}</span>
                    <span style={{ fontSize: 11, color: "#6B7280", marginLeft: "auto" }}>{SEMANAS[semanaAtiva]}</span>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 11, color: "#6B7280", display: "block", marginBottom: 5 }}>📊 Crescimento da conta</label>
                    <input className="input-sutil" placeholder="Ex: +12% faturamento, novos pedidos..." value={clienteData.crescimento} onChange={(e) => updateField("crescimento", e.target.value)} />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 11, color: "#6EE7B7", display: "block", marginBottom: 5 }}>✅ Melhorias</label>
                    <textarea className="input-sutil" placeholder="O que melhorou? CTR, ROAS, novos anúncios..." value={clienteData.melhorias} onChange={(e) => updateField("melhorias", e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#FCA5A5", display: "block", marginBottom: 5 }}>⚠️ Pioras</label>
                    <textarea className="input-sutil" placeholder="O que piorou? Produtos banidos, estoque..." value={clienteData.pioras} onChange={(e) => updateField("pioras", e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DÚVIDAS COM GEOVANNE */}
        {aba === "duvidas" && (
          <div>
            <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 16 }}>
              Cada consultora pode anotar aqui as dúvidas para falar com o Geovanne. Marque como resolvida quando for respondida.
            </div>
            {CONSULTORAS.map((c) => {
              const pendentes = duvidas[c.id].filter((d) => !d.resolvida).length;
              return (
                <div key={c.id} className="card" style={{ padding: 18, marginBottom: 14, borderColor: c.cor + "22" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.cor }} />
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{c.nome}</span>
                    {pendentes > 0 && (
                      <span style={{ background: c.cor + "22", color: c.cor, fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 20 }}>
                        {pendentes} pendente{pendentes > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Input nova dúvida */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                    <input
                      className="input-sutil"
                      style={{ flex: 1 }}
                      placeholder="Escreva uma dúvida para o Geovanne..."
                      value={novaDuvida[c.id]}
                      onChange={(e) => setNovaDuvida((prev) => ({ ...prev, [c.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && adicionarDuvida(c.id)}
                    />
                    <button
                      onClick={() => adicionarDuvida(c.id)}
                      style={{ background: c.cor + "22", border: `1px solid ${c.cor}44`, color: c.cor, borderRadius: 10, padding: "0 16px", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}
                    >
                      + Adicionar
                    </button>
                  </div>

                  {/* Lista de dúvidas */}
                  {duvidas[c.id].length === 0 ? (
                    <div style={{ fontSize: 12, color: "#3E4560", textAlign: "center", padding: "16px 0" }}>Nenhuma dúvida anotada ainda</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {duvidas[c.id].map((d, idx) => (
                        <div key={idx} style={{
                          display: "flex", alignItems: "flex-start", gap: 10,
                          padding: "10px 12px", borderRadius: 10,
                          background: d.resolvida ? "#0F1117" : "#13161E",
                          border: `1px solid ${d.resolvida ? "#1A1D28" : c.cor + "33"}`,
                          opacity: d.resolvida ? 0.55 : 1,
                        }}>
                          <div
                            onClick={() => toggleDuvida(c.id, idx)}
                            style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${d.resolvida ? "#3E4560" : c.cor}`, background: d.resolvida ? c.cor + "44" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}
                          >
                            {d.resolvida && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#E8EAF0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, textDecoration: d.resolvida ? "line-through" : "none", color: d.resolvida ? "#6B7280" : "#E8EAF0" }}>{d.texto}</div>
                            <div style={{ fontSize: 10, color: "#4B5570", marginTop: 3 }}>{d.data} {d.resolvida && "· ✓ Resolvida"}</div>
                          </div>
                          <button onClick={() => removerDuvida(c.id, idx)} style={{ background: "transparent", border: "none", color: "#3E4560", cursor: "pointer", fontSize: 14, padding: 2, lineHeight: 1 }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* VISÃO GERAL */}
        {aba === "visao_geral" && (
          <div>
            <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
              {SEMANAS.map((s, i) => (
                <button key={i} className={`semana-btn ${semanaAtiva === i ? "ativo" : ""}`} onClick={() => setSemanaAtiva(i)}>{s}</button>
              ))}
            </div>
            {CONSULTORAS.map((c) => {
              const pg = progressoGeral(c.id, semanaAtiva);
              return (
                <div key={c.id} className="card" style={{ padding: 16, marginBottom: 14, borderColor: c.cor + "22" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.cor }} />
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{c.nome}</span>
                    <span style={{ fontSize: 11, color: "#6B7280" }}>{CLIENTES[c.id].length} clientes</span>
                    <div className="progress-bar" style={{ flex: 1 }}>
                      <div className="progress-fill" style={{ width: `${pg}%`, background: pg === 100 ? "#6EE7B7" : c.cor }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: pg === 100 ? "#6EE7B7" : c.cor }}>{pg}%</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {CLIENTES[c.id].map((cl) => {
                      const p = progresso(c.id, cl, semanaAtiva);
                      const contatos = totalContatosCliente(c.id, cl);
                      const d = data[c.id][cl];
                      return (
                        <div key={cl} style={{
                          background: "#0F1117",
                          border: `1px solid ${p.pct === 100 ? c.cor + "55" : "#1A1D28"}`,
                          borderRadius: 10, padding: "10px 12px", flex: "1 1 120px", minWidth: 110,
                        }}>
                          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6, color: "#E8EAF0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cl}</div>
                          <div className="progress-bar" style={{ marginBottom: 6 }}>
                            <div className="progress-fill" style={{ width: `${p.pct}%`, background: p.pct === 100 ? "#6EE7B7" : c.cor }} />
                          </div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 10, color: p.pct === 100 ? "#6EE7B7" : "#6B7280" }}>{p.done}/{p.total} ✓</span>
                            {contatos > 0 && <span style={{ fontSize: 10, color: c.cor }}>💬 {contatos}</span>}
                          </div>
                          {d.crescimento && <div style={{ fontSize: 10, color: "#6EE7B7", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📈 {d.crescimento}</div>}
                          {d.pioras && <div style={{ fontSize: 10, color: "#FCA5A5", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>⚠️ {d.pioras}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
