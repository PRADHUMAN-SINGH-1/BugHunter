import { ChevronDown, Play, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { runLegacyScanner } from "../api/client";
import { SeverityBadge } from "./SeverityBadge";

const scanners = ["scan", "idor", "params", "headers", "sensitive", "endpoints", "crawl", "ratelimit", "auth", "sqli"];

export function AdvancedScannerDrawer({ open, onClose }) {
  const [target, setTarget] = useState("");
  const [scanner, setScanner] = useState("headers");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const run = async () => {
    if (!target.trim()) return setError("Enter an authorized target URL.");
    setLoading(true); setError("");
    try { const response = await runLegacyScanner(scanner, target); setResults(Array.isArray(response) ? response : [response]); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  };
  return <aside className={`advanced-drawer ${open ? "open" : ""}`} aria-hidden={!open}>
    <div className="drawer-head"><div><p className="eyebrow">ADVANCED SCANNERS</p><h2>Direct evidence tools</h2></div><button onClick={onClose} className="icon-button"><X size={19} /></button></div>
    <p>These original scanners remain available for focused, authorized checks.</p>
    <label>Target URL<input value={target} onChange={(event) => setTarget(event.target.value)} placeholder="https://staging.example.com" /></label>
    <label>Scanner<select value={scanner} onChange={(event) => setScanner(event.target.value)}>{scanners.map((tool) => <option key={tool} value={tool}>{tool}</option>)}</select></label>
    <button className="primary-button run-scanner" onClick={run} disabled={loading}><Play size={16} /> {loading ? "Running…" : "Run scanner"}</button>
    {error && <p className="drawer-error">{error}</p>}
    <div className="drawer-results">{results.map((result, index) => <article key={`${result.target}-${index}`}><div><strong>{result.finding}</strong><p>{result.target} · {result.status}</p></div><SeverityBadge severity={result.severity} /><details><summary><SlidersHorizontal size={14} /> Evidence <ChevronDown size={14} /></summary><pre>{JSON.stringify(result.evidence || result, null, 2)}</pre></details></article>)}</div>
  </aside>;
}
