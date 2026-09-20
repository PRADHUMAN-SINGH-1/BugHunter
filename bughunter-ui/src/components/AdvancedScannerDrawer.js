import { CheckCircle2, ChevronDown, Play, SlidersHorizontal, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { runLegacyScanner } from "../api/client";
import { SeverityBadge } from "./SeverityBadge";

const scanners = [
  { key: "scan", label: "Scan", hint: "Reflected-input checks" },
  { key: "idor", label: "IDOR", hint: "Object access checks" },
  { key: "params", label: "Params", hint: "Parameter discovery" },
  { key: "headers", label: "Headers", hint: "HTTP security headers" },
  { key: "sensitive", label: "Sensitive", hint: "Sensitive-data patterns" },
  { key: "endpoints", label: "Endpoints", hint: "Common route discovery" },
  { key: "crawl", label: "Crawl", hint: "Same-origin links" },
  { key: "ratelimit", label: "Ratelimit", hint: "Throttle behavior" },
  { key: "auth", label: "Auth", hint: "Authentication behavior" },
  { key: "sqli", label: "SQLi", hint: "SQL injection heuristics" }
];

function flattenScannerResponse(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  return response ? [response] : [];
}

function resultStatus(result) {
  if (typeof result?.status === "number") return "HTTP " + result.status;
  if (typeof result?.status === "string") return result.status;
  return "Completed";
}

function evidenceText(result) {
  if (result?.evidence?.summary) return result.evidence.summary;
  if (result?.evidence?.issues?.length) return result.evidence.issues.join(" · ");
  if (result?.evidence?.matches?.length) return result.evidence.matches.join(" · ");
  if (result?.evidence?.links?.length) return result.evidence.links.length + " same-origin links discovered";
  if (result?.finding) return result.finding;
  return "Evidence returned by scanner.";
}

export function AdvancedScannerDrawer() {
  const [target, setTarget] = useState("");
  const [scanner, setScanner] = useState("headers");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [completedAt, setCompletedAt] = useState("");

  const selected = useMemo(
    () => scanners.find((tool) => tool.key === scanner) || scanners[0],
    [scanner]
  );

  const run = async () => {
    const normalizedTarget = target.trim();
    if (!normalizedTarget) {
      setError("Enter an authorized target URL before running a scanner.");
      setResults([]);
      return;
    }

    setLoading(true);
    setError("");
    setCompletedAt("");

    try {
      const response = await runLegacyScanner(scanner, normalizedTarget);
      const normalizedResults = flattenScannerResponse(response);
      setResults(normalizedResults);

      if (!normalizedResults.length) {
        setError("The scanner completed but returned no evidence.");
      } else {
        setCompletedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      }
    } catch (requestError) {
      setResults([]);
      setError(requestError.message || "Scanner request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="advanced-scanners-section" aria-label="Advanced scanners">
      <div className="scanner-section-head">
        <div>
          <div className="section-kicker">
            <SlidersHorizontal size={13} />
            DIRECT EVIDENCE TOOLKIT
          </div>
          <div className="scanner-title-row">
            <div>
              <h2>Advanced scanners</h2>
              <p>Run one deterministic module at a time against an authorized HTTP(S) target.</p>
            </div>
            <div className="scanner-count"><span>{scanners.length}</span> modules</div>
          </div>
        </div>
      </div>

      <div className="scanner-selected-bar">
        <div>
          <span>SELECTED MODULE</span>
          <strong>{selected.label}</strong>
          <small>{selected.hint}</small>
        </div>
        <div className="scanner-selected-status">
          {loading ? <><span className="scanner-status-dot busy" /> Running</> : completedAt ? <><CheckCircle2 size={14} /> Completed {completedAt}</> : <><span className="scanner-status-dot" /> Ready</>}
        </div>
      </div>

      <div className="scanner-control-grid">
        <label className="scanner-field target-field">
          <span>01 · AUTHORIZED TARGET</span>
          <input
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") run();
            }}
            placeholder="https://staging.example.com"
            autoComplete="url"
            inputMode="url"
          />
        </label>

        <label className="scanner-field">
          <span>02 · EVIDENCE MODULE</span>
          <select value={scanner} onChange={(event) => setScanner(event.target.value)}>
            {scanners.map((tool) => (
              <option key={tool.key} value={tool.key}>{tool.label}</option>
            ))}
          </select>
        </label>

        <button className="scanner-run-button" onClick={run} disabled={loading} type="button">
          <Play size={14} fill="currentColor" />
          {loading ? "RUNNING" : "RUN SCANNER"}
        </button>
      </div>

      <div className="scanner-module-strip" role="tablist" aria-label="Scanner modules">
        {scanners.map((tool, index) => (
          <button
            key={tool.key}
            type="button"
            role="tab"
            aria-selected={tool.key === scanner}
            className={tool.key === scanner ? "selected" : ""}
            onClick={() => {
              setScanner(tool.key);
              setError("");
            }}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            {tool.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="scanner-inline-error" role="alert">
          <XCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {results.length > 0 && (
        <div className="scanner-results">
          <div className="scanner-results-head">
            <div>
              <span>SCAN OUTPUT</span>
              <strong>{results.length} evidence record{results.length === 1 ? "" : "s"}</strong>
            </div>
            <small>{selected.label} · {target}</small>
          </div>

          <div className="scanner-results-grid">
            {results.map((result, index) => (
              <article className="scanner-result-card" key={(result?.target || selected.key) + "-" + index}>
                <div className="result-card-top">
                  <div className="result-primary">
                    <div className="result-title-row">
                      <strong>{result?.finding || "Scanner result"}</strong>
                      <SeverityBadge severity={result?.severity || "INFO"} />
                    </div>
                    <p>{result?.target || target} · {resultStatus(result)}</p>
                  </div>
                </div>

                <div className="result-evidence-summary">
                  <span>Observed evidence</span>
                  <strong>{evidenceText(result)}</strong>
                </div>

                <details>
                  <summary>
                    <span><SlidersHorizontal size={12} /> Raw evidence</span>
                    <ChevronDown size={14} />
                  </summary>
                  <pre>{JSON.stringify(result?.evidence || result, null, 2)}</pre>
                </details>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
