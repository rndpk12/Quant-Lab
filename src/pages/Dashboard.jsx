import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { getMarketData } from "../services/api";
import {
  optimizePortfolio,
} from "../services/api";

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const C = {
  bg:       "#FAFAFA",
  surface:  "#FFFFFF",
  card:     "#FFFFFF",
  border:   "#E5E7EB",
  borderMd: "#D1D5DB",
  text:     "#0A0A0A",
  muted:    "#6B7280",
  subtle:   "#9CA3AF",
  dim:      "#F3F4F6",
  dimMd:    "#E5E7EB",
  green:    "#059669",
  greenBg:  "#ECFDF5",
  red:      "#DC2626",
  redBg:    "#FEF2F2",
  amber:    "#D97706",
};

// ── NSE_STOCKS — GLOBAL SCOPE ─────────────────────────────────────────────────
const NSE_STOCKS = [
  "RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS",
  "SBIN.NS", "LT.NS", "ITC.NS", "BAJFINANCE.NS", "HINDUNILVR.NS",
  "AXISBANK.NS", "KOTAKBANK.NS", "ASIANPAINT.NS", "MARUTI.NS", "TITAN.NS",
  "SUNPHARMA.NS", "ULTRACEMCO.NS", "NTPC.NS", "POWERGRID.NS", "BHARTIARTL.NS",
  "WIPRO.NS", "HCLTECH.NS", "TECHM.NS", "DRREDDY.NS", "CIPLA.NS",
  "DIVISLAB.NS", "APOLLOHOSP.NS", "NESTLEIND.NS", "BRITANNIA.NS", "DABUR.NS",
  "PIDILITIND.NS", "BERGEPAINT.NS", "HAVELLS.NS", "SIEMENS.NS", "ABB.NS",
  "TATAPOWER.NS", "ADANIPORTS.NS", "ADANIENT.NS", "COALINDIA.NS", "ONGC.NS",
  "BPCL.NS", "IOC.NS", "GAIL.NS", "INDUSINDBK.NS", "FEDERALBNK.NS",
  "BANDHANBNK.NS", "IDFCFIRSTB.NS", "PNB.NS", "CANBK.NS", "BANKBARODA.NS",
];

const STRATEGY_COMPARISON = [
  { name: "Equal Weight",   return: 18.4, vol: 12.6, sharpe: 1.46 },
  { name: "Mean Variance",  return: 24.1, vol: 10.2, sharpe: 2.36 },
  { name: "HRP",            return: 21.8, vol:  9.4, sharpe: 2.32 },
  { name: "CVaR",           return: 19.2, vol:  8.8, sharpe: 2.18 },
  { name: "Min Volatility", return: 14.6, vol:  7.1, sharpe: 2.06 },
];

const MARKET = [
  {
    label: "NIFTY 50",
    key: "nifty",
    change: "+1.14%",
    up: true,
  },
  {
    label: "SENSEX",
    key: "sensex",
    change: "+1.02%",
    up: true,
  },
  {
    label: "NIFTY BANK",
    key: "bank",
    change: "-0.32%",
    up: false,
  },
  {
    label: "INDIA VIX",
    key: "vix",
    change: "-4.21%",
    up: false,
  },
];


const NAV_ITEMS = ["Dashboard", "Portfolio", "Analytics", "Settings"];

const STRATEGY_LABEL_MAP = {
  equal_weight:   "Equal Weight",
  mean_variance:  "Mean Variance",
  hrp:            "HRP",
  cvar:           "CVaR",
  min_volatility: "Min Volatility",
};

const mono = "'IBM Plex Mono', 'Courier New', monospace";
const sans = "'Inter', 'Segoe UI', system-ui, sans-serif";

// ── ANIMATION HOOKS ───────────────────────────────────────────────────────────
function useFadeIn(delay = 0) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, []);
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(16px)",
    transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
  };
}



function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (typeof target !== "number") return;
    let start = null;
    const raf = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(+(target * ease).toFixed(2));
      if (p < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [target]);
  return val;
}

// ── SECTION HEADER ────────────────────────────────────────────────────────────
function SectionHeader({ label, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
      <span style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, fontFamily: mono, fontWeight: 500 }}>
        {label}
      </span>
      {right && <span style={{ fontSize: 11, color: C.subtle, fontFamily: mono }}>{right}</span>}
    </div>
  );
}

// ── METRIC CARD ───────────────────────────────────────────────────────────────
function MetricCard({ label, value, suffix = "", colorBySign = false, loading = false, delay = 0 }) {
  const anim = useFadeIn(delay);
  const isNum = typeof value === "number";
  const isPos = parseFloat(value) >= 0;
  const col = colorBySign ? (isPos ? C.green : C.red) : C.text;
  const bgCol = colorBySign ? (isPos ? C.greenBg : C.redBg) : C.card;
  const animated = useCountUp(isNum && !loading ? value : 0);

  return (
    <div style={{
      background: bgCol,
      border: `1px solid ${colorBySign ? (isPos ? "#A7F3D0" : "#FECACA") : C.border}`,
      borderRadius: 16, padding: "24px", position: "relative", overflow: "hidden", ...anim,
    }}>
      <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted, fontFamily: mono, marginBottom: 10 }}>
        {label}
      </div>
      {loading ? (
        <div style={{ height: 40, display: "flex", alignItems: "center" }}>
          <div style={{ width: 80, height: 8, background: C.dimMd, borderRadius: 4, animation: "shimmer 1.5s infinite" }} />
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
          <span style={{ fontSize: 36, fontWeight: 700, color: col, fontFamily: mono, lineHeight: 1, letterSpacing: "-0.02em" }}>
            {colorBySign && isPos ? "+" : ""}
            {isNum ? animated.toFixed(2) : value}
          </span>
          {suffix && <span style={{ fontSize: 16, color: col, fontWeight: 400 }}>{suffix}</span>}
        </div>
      )}
    </div>
  );
}

// ── HEALTH SCORE ──────────────────────────────────────────────────────────────
function HealthScore({ portfolio }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { if (portfolio) setTimeout(() => setReady(true), 100); }, [portfolio]);

  if (!portfolio) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0", color: C.subtle, fontFamily: mono, fontSize: 11, letterSpacing: "0.08em" }}>
        GENERATE A PORTFOLIO TO SEE HEALTH
      </div>
    );
  }

  const weights = Object.values(portfolio.weights);
  const maxWeight = Math.max(...weights);
  const holdingCount = weights.length;
  const sharpe = portfolio.metrics.sharpe_ratio;
  const vol = portfolio.metrics.volatility;

  const checks = [
    { label: "Diversification",      pass: holdingCount >= 4, note: `${holdingCount} holdings` },
    { label: "Risk-adjusted return", pass: sharpe > 1,         note: `Sharpe ${sharpe.toFixed(2)}` },
    { label: "Concentration",        pass: maxWeight < 0.4,    note: `Max ${(maxWeight * 100).toFixed(0)}%` },
    { label: "Volatility control",   pass: vol < 20,           note: `${vol.toFixed(1)}% p.a.` },
  ];

  const passed = checks.filter(c => c.pass).length;
  const score = Math.round((passed / checks.length) * 100);
  const circ = 2 * Math.PI * 45;
  const dash = ready ? (score / 100) * circ : 0;
  const scoreColor = score >= 75 ? C.green : score >= 50 ? C.amber : C.red;
  const scoreBg = score >= 75 ? C.greenBg : score >= 50 ? "#FFFBEB" : C.redBg;

  return (
    <div style={{ display: "flex", gap: 28, alignItems: "flex-start", flexWrap: "wrap" }}>
      <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="45" fill="none" stroke={C.dimMd} strokeWidth="7" />
          <circle cx="60" cy="60" r="45" fill="none" stroke={scoreColor} strokeWidth="7"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            transform="rotate(-90 60 60)"
            style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: scoreBg, borderRadius: "50%", margin: 14 }}>
          <span style={{ fontSize: 26, fontWeight: 700, color: scoreColor, fontFamily: mono, lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: 9, color: C.muted, fontFamily: mono, letterSpacing: "0.08em" }}>/100</span>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 180 }}>
        {checks.map((c, i) => (
          <div key={c.label} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 0",
            borderBottom: i < checks.length - 1 ? `1px solid ${C.border}` : "none",
            animation: ready ? `fadeUp 0.4s ease ${i * 80}ms both` : "none",
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
              background: c.pass ? C.greenBg : C.redBg,
              border: `1.5px solid ${c.pass ? "#6EE7B7" : "#FCA5A5"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: c.pass ? C.green : C.red }}>
                {c.pass ? "✓" : "✗"}
              </span>
            </div>
            <span style={{ flex: 1, fontSize: 12, color: C.text, fontFamily: sans }}>{c.label}</span>
            <span style={{ fontSize: 11, color: C.muted, fontFamily: mono }}>{c.note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ALLOCATION TABLE ──────────────────────────────────────────────────────────
function AllocationTable({ weights }) {
  const [hov, setHov] = useState(null);
  if (!weights) return null;
  const entries = Object.entries(weights).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(e => e[1]));

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${C.border}` }}>
          {["Ticker", "Exchange", "Weight", ""].map(h => (
            <th key={h} style={{
              padding: "0 12px 12px", fontSize: 10, letterSpacing: "0.1em", textAlign: "left",
              color: C.muted, textTransform: "uppercase", fontFamily: mono, fontWeight: 500,
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {entries.map(([ticker, w], i) => (
          <tr key={ticker}
            style={{
              borderBottom: i < entries.length - 1 ? `1px solid ${C.border}` : "none",
              background: hov === i ? C.dim : "transparent",
              transition: "background 0.15s",
            }}
            onMouseEnter={() => setHov(i)}
            onMouseLeave={() => setHov(null)}
          >
            <td style={{ padding: "13px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, background: C.dim,
                  border: `1px solid ${C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <span style={{ fontSize: 9, color: C.muted, fontFamily: mono, fontWeight: 600 }}>
                    {ticker.split(".")[0].slice(0, 3)}
                  </span>
                </div>
                <span style={{ fontSize: 13, color: C.text, fontFamily: mono, fontWeight: 500 }}>{ticker}</span>
              </div>
            </td>
            <td style={{ padding: "13px 12px" }}>
              <span style={{
                fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase",
                color: C.muted, background: C.dim, border: `1px solid ${C.border}`,
                borderRadius: 4, padding: "3px 7px", fontFamily: mono,
              }}>
                {ticker.split(".")[1] || "EQ"}
              </span>
            </td>
            <td style={{ padding: "13px 12px" }}>
              <span style={{ fontSize: 15, color: C.text, fontFamily: mono, fontWeight: 700 }}>
                {(w * 100).toFixed(1)}%
              </span>
            </td>
            <td style={{ padding: "13px 12px", width: 140 }}>
              <div style={{ height: 4, background: C.dim, borderRadius: 99 }}>
                <div style={{
                  width: `${(w / max) * 100}%`, height: "100%",
                  background: C.text, borderRadius: 99,
                  transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                }} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── STRATEGY TABLE ────────────────────────────────────────────────────────────
function StrategyTable({ active }) {
  const [hov, setHov] = useState(null);
  const maxSharpe = Math.max(...STRATEGY_COMPARISON.map(s => s.sharpe));
  const activeLabel = STRATEGY_LABEL_MAP[active] || active;

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${C.border}` }}>
          {["Strategy", "Annual Return", "Volatility", "Sharpe Ratio"].map(h => (
            <th key={h} style={{
              padding: "0 14px 12px", fontSize: 10, letterSpacing: "0.1em",
              color: C.muted, textAlign: "left", textTransform: "uppercase",
              fontFamily: mono, fontWeight: 500,
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {STRATEGY_COMPARISON.map((row, i) => {
          const isActive = row.name === activeLabel;
          return (
            <tr key={row.name}
              style={{
                borderBottom: i < STRATEGY_COMPARISON.length - 1 ? `1px solid ${C.border}` : "none",
                background: hov === i ? C.dim : isActive ? "#F9FAFB" : "transparent",
                transition: "background 0.15s",
              }}
              onMouseEnter={() => setHov(i)}
              onMouseLeave={() => setHov(null)}
            >
              <td style={{ padding: "13px 14px", borderLeft: isActive ? `3px solid ${C.text}` : "3px solid transparent" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: C.text, fontFamily: sans }}>
                    {row.name}
                  </span>
                  {isActive && (
                    <span style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text, background: C.text + "10", border: `1px solid ${C.borderMd}`, borderRadius: 4, padding: "2px 7px", fontFamily: mono }}>
                      Active
                    </span>
                  )}
                  {row.name !== "Equal Weight" && !isActive && (
                    <span style={{ fontSize: 9, letterSpacing: "0.1em", color: C.subtle, fontFamily: mono }}>
                      Soon
                    </span>
                  )}
                </div>
              </td>
              <td style={{ padding: "13px 14px" }}>
                <span style={{ fontSize: 13, color: row.return >= 0 ? C.green : C.red, fontFamily: mono, fontWeight: 600 }}>
                  {row.return >= 0 ? "+" : ""}{row.return}%
                </span>
              </td>
              <td style={{ padding: "13px 14px" }}>
                <span style={{ fontSize: 13, color: C.muted, fontFamily: mono }}>{row.vol}%</span>
              </td>
              <td style={{ padding: "13px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, maxWidth: 100, height: 4, background: C.dimMd, borderRadius: 99 }}>
                    <div style={{ width: `${(row.sharpe / maxSharpe) * 100}%`, height: "100%", background: C.text, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 12, color: C.text, fontFamily: mono, minWidth: 28 }}>{row.sharpe}</span>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── STOCK SEARCH INPUT ────────────────────────────────────────────────────────
function StockSearch({ selectedStocks, setSelectedStocks, inputBase }) {
  const [stockInput, setStockInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const ref = useRef(null);

  const filtered = stockInput.trim().length > 0
    ? NSE_STOCKS.filter(s =>
        s.toLowerCase().includes(stockInput.toLowerCase()) &&
        !selectedStocks.includes(s)
      ).slice(0, 8)
    : [];

  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addStock = (stock) => {
    if (!selectedStocks.includes(stock)) {
      setSelectedStocks(prev => [...prev, stock]);
    }
    setStockInput("");
    setShowDropdown(false);
  };

  const removeStock = (stock) => {
    setSelectedStocks(prev => prev.filter(s => s !== stock));
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Search input */}
      <input
        value={stockInput}
        onChange={e => { setStockInput(e.target.value); setShowDropdown(true); }}
        onFocus={() => setShowDropdown(true)}
        placeholder="Search stock (e.g. TCS, INFY)..."
        style={inputBase}
      />

      {/* Dropdown */}
      {showDropdown && filtered.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.10)", zIndex: 200,
          maxHeight: 220, overflowY: "auto",
        }}>
          {filtered.map(stock => (
            <div
              key={stock}
              onMouseDown={() => addStock(stock)}
              style={{
                padding: "10px 14px", cursor: "pointer", fontSize: 13,
                fontFamily: mono, color: C.text,
                borderBottom: `1px solid ${C.border}`,
                display: "flex", alignItems: "center", gap: 10,
                transition: "background 0.1s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = C.dim}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{
                width: 28, height: 28, borderRadius: 6, background: C.dim,
                border: `1px solid ${C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <span style={{ fontSize: 8, color: C.muted, fontWeight: 600 }}>
                  {stock.split(".")[0].slice(0, 3)}
                </span>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{stock}</div>
                <div style={{ fontSize: 10, color: C.subtle }}>NSE · Equity</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Holdings count */}
      <div style={{ fontSize: 10, color: C.subtle, fontFamily: mono, marginTop: 6 }}>
        {selectedStocks.length} {selectedStocks.length === 1 ? "Holding" : "Holdings"} Selected
      </div>

      {/* Chips */}
      {selectedStocks.length > 0 && (
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10,
          padding: "10px", background: C.dim, borderRadius: 10,
          border: `1px solid ${C.border}`,
        }}>
          {selectedStocks.map(stock => (
            <div key={stock} style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "4px 10px", background: "#fff",
              border: `1px solid ${C.border}`, borderRadius: 99,
              fontSize: 11, fontFamily: mono, color: C.text,
            }}>
              {stock}
              <button
                onClick={() => removeStock(stock)}
                style={{
                  background: "none", border: "none", padding: 0,
                  cursor: "pointer", color: C.muted, fontSize: 12,
                  lineHeight: 1, display: "flex", alignItems: "center",
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [selectedStocks, setSelectedStocks] = useState([
    "RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS",
  ]);
  const [portfolioName, setPortfolioName] = useState("My Portfolio");
  const [strategy, setStrategy] = useState("equal_weight");   // ← fixed: backend value
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const heroAnim    = useFadeIn(0);
  const marketAnim  = useFadeIn(100);
  const builderAnim = useFadeIn(200);
  const [marketData, setMarketData] = useState(null);

  useEffect(() => {
  async function loadMarket() {
    try {
      const data =
        await getMarketData();

      setMarketData(data);
    } catch (err) {
      console.error(err);
    }
  }

  loadMarket();

  const interval =
    setInterval(loadMarket, 60000);

  return () =>
    clearInterval(interval);
}, []);

  // ── GENERATE PORTFOLIO ─────────────────────────────────────────────────────
  const handleGenerate = async () => {
    const tickers = selectedStocks;   // ← fixed: use selectedStocks
    if (tickers.length === 0) { setError("Select at least one stock."); return; }
    setLoading(true); setError(null); setPortfolio(null);
    try {
      const res = await axios.post("http://127.0.0.1:8000/api/portfolio/optimize", { tickers, strategy });
      setPortfolio(res.data);
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || "Unknown error";
      setError(`${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const inputBase = {
    width: "100%", padding: "10px 12px",
    background: C.dim, border: `1.5px solid ${C.border}`,
    borderRadius: 10, color: C.text, fontSize: 13, fontFamily: sans,
    outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
  };

  return (
    <div style={{ minHeight: "100vh", width: "100%", background: C.bg, color: C.text, fontFamily: sans, overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600;700&display=swap');
        html, body, #root { margin: 0; padding: 0; width: 100%; background: #FAFAFA; }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 4px; }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes pulse   { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes shimmer { 0%,100%{opacity:0.4} 50%{opacity:1} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }
        input:focus, textarea:focus, select:focus {
          border-color: #0A0A0A !important;
          box-shadow: 0 0 0 3px rgba(10,10,10,0.06) !important;
        }
        @media (max-width: 900px) {
          .main-grid    { grid-template-columns: 1fr !important; }
          .metrics-grid { grid-template-columns: 1fr 1fr !important; }
          .two-col      { grid-template-columns: 1fr !important; }
          .market-strip { grid-template-columns: 1fr 1fr !important; }
          .hero-inner   { flex-direction: column !important; align-items: flex-start !important; gap: 20px !important; }
          .stat-row     { justify-content: flex-start !important; }
          .nav-links    { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        @media (max-width: 600px) {
          .metrics-grid { grid-template-columns: 1fr !important; }
          .market-strip { grid-template-columns: 1fr !important; }
          .main-pad     { padding: 20px 16px !important; }
          .nav-pad      { padding: 0 16px !important; }
          .hero-h1      { font-size: 40px !important; }
        }
        .mobile-menu-btn { display: none; }
        .mobile-nav { display: none; animation: slideDown 0.2s ease; }
        .mobile-nav.open { display: flex; }
        button { cursor: pointer; }
        select option { background: white; color: #0A0A0A; }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{
        height: 60, borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center",
        padding: "0 40px", position: "sticky", top: 0,
        background: "rgba(250,250,250,0.95)", backdropFilter: "blur(12px)",
        zIndex: 100, width: "100%",
      }} className="nav-pad">

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 40 }}>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em", color: C.text, fontFamily: sans }}>
            Quant Lab
          </span>
          
        </div>

        <div className="nav-links" style={{ display: "flex", gap: 2, flex: 1 }}>
          {NAV_ITEMS.map(item => (
            <button key={item} onClick={() => setActiveNav(item)} style={{
              background: "transparent", border: "none", padding: "6px 14px",
              borderRadius: 8, color: activeNav === item ? C.text : C.muted,
              fontSize: 13, fontWeight: activeNav === item ? 600 : 400,
              fontFamily: sans, transition: "all 0.15s",
              
            }}
              onMouseEnter={e => e.currentTarget.style.color = C.text}
              onMouseLeave={e => { if (activeNav !== item) e.currentTarget.style.color = C.muted; }}
            >{item}</button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: "auto" }}>
          {error && (
            <span style={{ fontSize: 11, color: C.red, fontFamily: mono, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              ⚠ {error}
            </span>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 11px", background: C.greenBg, border: `1px solid #A7F3D0`, borderRadius: 20 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.green, animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 10, color: C.green, fontFamily: mono, letterSpacing: "0.1em", fontWeight: 600 }}>LIVE</span>
          </div>
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(v => !v)}
            style={{ background: "none", border: "none", padding: 6, color: C.text, fontSize: 18 }}>
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {/* Mobile nav */}
      <div className={`mobile-nav${mobileMenuOpen ? " open" : ""}`}
        style={{ flexDirection: "column", background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "8px 16px 16px" }}>
        {NAV_ITEMS.map(item => (
          <button key={item} onClick={() => { setActiveNav(item); setMobileMenuOpen(false); }}
            style={{ background: "none", border: "none", textAlign: "left", padding: "10px 4px", fontSize: 15, color: activeNav === item ? C.text : C.muted, fontWeight: activeNav === item ? 600 : 400 }}>
            {item}
          </button>
        ))}
      </div>

      <main className="main-pad" style={{ width: "100%", padding: "36px 40px", boxSizing: "border-box" }}>

        {/* ── HERO ── */}
        <div style={{ marginBottom: 32, ...heroAnim }}>
          <div style={{ fontSize: 10, color: C.subtle, fontFamily: mono, letterSpacing: "0.14em", marginBottom: 14 }}>
            QUANTITATIVE PORTFOLIO ANALYTICS · NSE / BSE
          </div>
          <div className="hero-inner" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
            <div>
              <h1 className="hero-h1" style={{ fontSize: 58, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 0.95, color: C.text }}>
                Quant Lab
              </h1>
              <p style={{ fontSize: 15, color: C.muted, marginTop: 12, fontWeight: 400 }}>
                AI-Powered Portfolio Analytics Platform
              </p>
            </div>
            <div className="stat-row" style={{ display: "flex", gap: 0, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
              {[["NSE / BSE ","Live"],["FastAPI","Backend"],["5","Strategies"]].map(([v, l], i) => (
                <div key={l} style={{
                  padding: "14px 24px", textAlign: "center",
                  borderRight: i < 2 ? `1px solid ${C.border}` : "none",
                  background: C.surface,
                }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: C.text, fontFamily: mono, letterSpacing: "-0.02em" }}>{v}</div>
                  <div style={{ fontSize: 9, color: C.muted, fontFamily: mono, letterSpacing: "0.1em", marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── MARKET STRIP ── */}
        <div className="market-strip" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 28, ...marketAnim }}>
          {MARKET.map((m, i) => (
            <div key={i} style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 12, padding: "14px 16px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              transition: "box-shadow 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
            >
              <div>
                <div style={{ fontSize: 9, color: C.subtle, fontFamily: mono, letterSpacing: "0.1em", marginBottom: 5 }}>{m.label}</div>
                <div
  style={{
    fontSize: 15,
    fontWeight: 600,
    color: C.text,
    fontFamily: mono
  }}
>
  {marketData?.[m.key]?.value?.toLocaleString() ?? "-"}
</div>
              </div>
              <span
  style={{
    fontSize: 12,
    color:
      marketData?.[m.key]?.change >= 0
        ? C.green
        : C.red,

    fontFamily: mono,
    fontWeight: 700,

    background:
      marketData?.[m.key]?.change >= 0
        ? C.greenBg
        : C.redBg,

    padding: "4px 9px",
    borderRadius: 8,
  }}
>
  {marketData?.[m.key]?.change ?? 0}%
</span>
            </div>
          ))}
        </div>

        {/* ── MAIN GRID ── */}
        <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 16, marginBottom: 16, ...builderAnim }}>

          {/* ── PORTFOLIO BUILDER ── */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <SectionHeader label="Portfolio Builder" />

            {/* Name */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: C.muted, fontFamily: mono, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Name</div>
              <input value={portfolioName} onChange={e => setPortfolioName(e.target.value)} style={inputBase} />
            </div>

            {/* Stock search + chips */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: C.muted, fontFamily: mono, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Holdings</div>
              <StockSearch
                selectedStocks={selectedStocks}
                setSelectedStocks={setSelectedStocks}
                inputBase={inputBase}
              />
            </div>

            {/* Strategy */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: C.muted, fontFamily: mono, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Strategy</div>
              <div style={{ position: "relative" }}>
                <select value={strategy} onChange={e => setStrategy(e.target.value)}
                  style={{ ...inputBase, appearance: "none", cursor: "pointer", paddingRight: 32 }}>
                  <option value="equal_weight">Equal Weight</option>
                  <option value="mean_variance">Mean Variance</option>
                  <option disabled>HRP (Coming Soon)</option>
                  <option disabled>CVaR (Coming Soon)</option>
                </select>
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: C.muted, pointerEvents: "none", fontSize: 11 }}>▾</span>
              </div>
            </div>

            {/* Capital */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 11, color: C.muted, fontFamily: mono, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Capital</div>
              <div style={{ display: "flex", border: `1.5px solid ${C.border}`, borderRadius: 10, overflow: "hidden", background: C.dim }}>
                <div style={{ padding: "10px 12px", fontSize: 13, color: C.muted, borderRight: `1px solid ${C.border}`, background: C.dimMd }}>₹</div>
                <input defaultValue="1,00,000"
                  style={{ flex: 1, padding: "10px 12px", background: "transparent", border: "none", color: C.text, fontSize: 13, fontFamily: sans, outline: "none" }}
                />
              </div>
            </div>

            {/* Generate button */}
            <button onClick={handleGenerate} disabled={loading || selectedStocks.length === 0}
              style={{
                width: "100%", padding: "13px",
                background: (loading || selectedStocks.length === 0) ? C.dimMd : C.text,
                border: "none", borderRadius: 12,
                color: (loading || selectedStocks.length === 0) ? C.muted : "#fff",
                fontSize: 13, fontWeight: 600, fontFamily: sans,
                letterSpacing: "0.02em",
                cursor: (loading || selectedStocks.length === 0) ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                boxShadow: (loading || selectedStocks.length === 0) ? "none" : "0 4px 12px rgba(0,0,0,0.15)",
              }}
              onMouseEnter={e => { if (!loading && selectedStocks.length > 0) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)"; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = (loading || selectedStocks.length === 0) ? "none" : "0 4px 12px rgba(0,0,0,0.15)"; }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
                  <span style={{ width: 13, height: 13, border: "2px solid rgba(0,0,0,0.2)", borderTopColor: C.text, borderRadius: "50%", display: "inline-block", animation: "spin 0.75s linear infinite" }} />
                  Computing…
                </span>
              ) : `Generate Portfolio → (${selectedStocks.length} stocks)`}
            </button>
          </div>

          {/* ── METRICS GRID ── */}
          <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 12 }}>
            <MetricCard label="Annual Return" value={portfolio?.metrics.annual_return ?? 0} suffix="%" colorBySign loading={loading} delay={50} />
            <MetricCard label="Volatility"    value={portfolio?.metrics.volatility     ?? 0} suffix="%" loading={loading} delay={120} />
            <MetricCard label="Sharpe Ratio"  value={portfolio?.metrics.sharpe_ratio   ?? 0} loading={loading} delay={190} />
            <MetricCard label="Strategy"      value={portfolio ? (STRATEGY_LABEL_MAP[portfolio.strategy] || portfolio.strategy) : "—"} loading={loading} delay={260} />
          </div>
        </div>

        {/* ── ALLOCATION + HEALTH ── */}
        {portfolio && (
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16, animation: "fadeUp 0.5s ease" }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <SectionHeader label="Portfolio Allocation" right={`${Object.keys(portfolio.weights).length} Holdings`} />
              {/* Scrollable for 50+ stocks */}
              <div style={{ maxHeight: "450px", overflowY: "auto" }}>
                <AllocationTable weights={portfolio.weights} />
              </div>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <SectionHeader label="Portfolio Health" />
              <HealthScore portfolio={portfolio} />
            </div>
          </div>
        )}

        {/* ── STRATEGY COMPARISON ── */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "24px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <SectionHeader label="Strategy Comparison" right="Backtested · 3Y · NSE" />
          <StrategyTable active={strategy} />
        </div>

        {/* ── FOOTER ── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: 8,
          paddingTop: 20, borderTop: `1px solid ${C.border}`,
        }}>
          <span style={{ fontSize: 10, color: C.subtle, fontFamily: mono, letterSpacing: "0.08em" }}>
            QUANT LAB · v2.4.1 · FASTAPI + YFINANCE · NSE/BSE
          </span>
          <span style={{ fontSize: 10, color: C.subtle, fontFamily: mono }}>
            NOT FINANCIAL ADVICE
          </span>
        </div>

      </main>
    </div>
  );
}