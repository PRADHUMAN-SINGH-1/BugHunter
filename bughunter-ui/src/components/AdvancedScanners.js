import { ChevronDown, Play, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { runLegacyScanner } from "../api/client";
import { SeverityBadge } from "./SeverityBadge";

const scanners = ["scan", "idor", "params", "headers", "sensitive", "endpoints", "crawl", "ratelimit", "auth", "sqli"];

export function AdvancedScanners() {
  const [target, setTarget] = useState("");
  const [scanner, setScanner] = useState("headers");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    if (!target.trim()) {
      setError("Enter an authorized target URL.");
      return;
    }

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

  return (
    <section className="advanced-tools">
      <div className="advanced-tools-shell">
        <div className="advanced-tools-head">
          <div>
            <div className="section-kicker">DIRECT EVIDENCE TOOLS</div>
            <h2>Advanced scanners</h2>
            <p>Focused access to the original deterministic modules for authorized checks.</p>
          </div>
          <div className="advanced-tools-count"><b>{scanners.length}</b> modules</div>
        </div>

        <div className="advanced-tools-controls">
          <div className="advanced-field">
            <label htmlFor="advanced-target">AUTHORIZED TARGET</label>
            <input
              id="advanced-target"
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              placeholder="https://staging.example.com"
            />
          </div>

          <div className="advanced-field">
            <label htmlFor="advanced-scanner">SCANNER</label>
            <select
              id="advanced-scanner"
              value={scanner}
              onChange={(event) => setScanner(event.target.value)}
            >
              {scanners.map((tool) => <option key={tool} value={tool}>{tool}</option>)}
            </select>
          </div>

          <button className="advanced-run" onClick={run} disabled={loading}>
            <Play size={12} /> {loading ? "Running" : "Run scanner"}
          </button>
        </div>

        <div className="advanced-tools-list">
          {scanners.map((tool, index) => (
            <button
              key={tool}
              className={`advanced-tool ${scanner === tool ? "active" : ""}`}
              onClick={() => setScanner(tool)}
              type="button"
              aria-pressed={scanner === tool}
            >
              <strong>{String(index + 1).padStart(2, "0")}</strong>
              {tool}
            </button>
          ))}
        </div>

        {error && <div className="advanced-error">{error}</div>}

        {results.length > 0 && (
          <div className="advanced-results">
            {results.map((result, index) => (
              <article className="advanced-result" key={`${result.target || "result"}-${index}`}>
                <div className="advanced-result-top">
                  <div>
                    <strong>{result.finding}</strong>
                    <p>{result.target} · {result.status}</p>
                  </div>
                  <SeverityBadge severity={result.severity} />
                </div>
                <details>
                  <summary>
                    <span><SlidersHorizontal size={12} /> Evidence</span>
                    <ChevronDown size={12} />
                  </summary>
                  <pre>{JSON.stringify(result.evidence || result, null, 2)}</pre>
                </details>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
