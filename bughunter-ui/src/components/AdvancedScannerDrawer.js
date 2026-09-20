import { ChevronDown, Play, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { runLegacyScanner } from "../api/client";
import { SeverityBadge } from "./SeverityBadge";

const scanners = ["scan", "idor", "params", "headers", "sensitive", "endpoints", "crawl", "ratelimit", "auth", "sqli"];

export function AdvancedScannerDrawer() {
  const [target, setTarget] = useState("");
  const [scanner, setScanner] = useState("headers");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    if (!target.trim()) return setError("Enter an authorized target URL.");
    setLoading(true);
    setError("");
    try {
      const response = await runLegacyScanner(scanner, target);
      setResults(Array.isArray(response) ? response : [response]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return <section className="advanced-scanners-section">
    <div className="scanner-section-head">
      <div>
        <div className="section-kicker"><SlidersHorizontal size={13} /> DIRECT EVIDENCE TOOLKIT</div>
        <h2>Advanced scanners</h2>
        <p>Focused access to the original deterministic modules. No drawer, no hidden tools.</p>
      </div>
      <div className="scanner-count"><span>{scanners.length}</span> modules available</div>
    </div>

    <div className="scanner-control-grid">
      <label className="scanner-field target-field">
        <span>01 · AUTHORIZED TARGET</span>
        <input value={target} onChange={(event) => setTarget(event.target.value)} placeholder="https://staging.example.com" />
      </label>
      <label className="scanner-field">
        <span>02 · EVIDENCE MODULE</span>
        <select value={scanner} onChange={(event) => setScanner(event.target.value)}>
          {scanners.map((tool) => <option key={tool} value={tool}>{tool}</option>)}
        </select>
      </label>
      <button className="scanner-run-button" onClick={run} disabled={loading}>
        <Play size={15} fill="currentColor" /> {loading ? "RUNNING" : "RUN SCANNER"}
      </button>
    </div>

    <div className="scanner-module-strip">
      {scanners.map((tool, index) => <button key={tool} className={tool === scanner ? "selected" : ""} onClick={() => setScanner(tool)}><span>{String(index + 1).padStart(2, "0")}</span>{tool}</button>)}
    </div>

    {error && <p className="scanner-error">{error}</p>}

    {results.length > 0 && <div className="scanner-results-grid">
      {results.map((result, index) => <article className="scanner-result-card" key={`${result.target}-${index}`}>
        <div className="result-card-top"><div><strong>{result.finding}</strong><p>{result.target} · {result.status}</p></div><SeverityBadge severity={result.severity} /></div>
        <details><summary><span><SlidersHorizontal size={13} /> Evidence payload</span><ChevronDown size={14} /></summary><pre>{JSON.stringify(result.evidence || result, null, 2)}</pre></details>
      </article>)}
    </div>}
  </section>;
}
