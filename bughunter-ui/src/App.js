import {
  Activity,
  ArrowRight,
  ChevronDown,
  Download,
  FileText,
  Filter,
  Globe2,
  LayoutDashboard,
  LockKeyhole,
  Moon,
  Search,
  ScanLine,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  Wrench
} from "lucide-react";
import { useMemo, useState } from "react";
import "./App.css";
import "./SecurityConsole.css";
import { AdvancedScannerDrawer } from "./components/AdvancedScannerDrawer";
import { ApprovalCard } from "./components/ApprovalCard";
import { AssistantChat } from "./components/AssistantChat";
import { ReportPanel } from "./components/ReportPanel";
import { useAssistant } from "./hooks/useAssistant";

const scannerRows = [
  ["scan", "Scan", "run_reflection_scan"],
  ["headers", "Headers", "run_header_scan"],
  ["idor", "IDOR", "run_idor_scan"],
  ["params", "Parameters", "params"],
  ["sensitive", "Sensitive Data", "run_sensitive_scan"],
  ["endpoints", "Endpoints", "run_endpoint_discovery"],
  ["crawl", "Crawl", "run_crawl"],
  ["ratelimit", "Ratelimit", "ratelimit"],
  ["auth", "Auth", "auth"],
  ["sqli", "SQLi", "run_sqli_scan"]
];

const severityOrder = ["all", "critical", "high", "medium", "low", "info"];
const EMPTY_FINDINGS = [];

function getWorkflowStep({ assessment, gate, isWorking }) {
  if (assessment) return 4;
  if (isWorking && gate?.kind === "plan") return 3;
  if (gate?.kind === "authorization" || gate?.kind === "scope") return 2;
  return 1;
}

function findingStatus(finding) {
  return finding?.manualVerification ? "Review" : "Open";
}

function severityKey(value) {
  const normalized = String(value || "info").toLowerCase();
  return ["critical", "high", "medium", "low"].includes(normalized) ? normalized : "info";
}

function App() {
  const assistant = useAssistant();
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return window.localStorage.getItem("bughunter-theme") === "dark";
    } catch (_error) {
      return false;
    }
  });
  const findings = useMemo(() => assistant.assessment?.findings || EMPTY_FINDINGS, [assistant.assessment]);
  const executedTools = assistant.assessment?.executedTools || [];
  const workflowStep = getWorkflowStep(assistant);
  const [findingQuery, setFindingQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [expandedFinding, setExpandedFinding] = useState(null);
  const [showSeverityFilters, setShowSeverityFilters] = useState(true);

  const severityCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    findings.forEach((finding) => { counts[severityKey(finding.severity)] += 1; });
    return counts;
  }, [findings]);

  const filteredFindings = useMemo(() => {
    const query = findingQuery.trim().toLowerCase();
    return findings.filter((finding) => {
      const matchesSeverity = severityFilter === "all" || severityKey(finding.severity) === severityFilter;
      const haystack = [
        finding.title,
        finding.category,
        finding.evidence?.summary,
        finding.remediation,
        ...(finding.evidence?.sourceTools || [])
      ].join(" ").toLowerCase();
      return matchesSeverity && (!query || haystack.includes(query));
    });
  }, [findings, findingQuery, severityFilter]);

  const clearAssistant = () => {
    assistant.reset();
    setFindingQuery("");
    setSeverityFilter("all");
    setExpandedFinding(null);
  };

  const toolStatus = (toolName) => {
    if (executedTools.includes(toolName)) return "Completed";
    if (assistant.isWorking && workflowStep >= 3) return "Running";
    return "Not run";
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className={`reference-app editorial-app ${darkMode ? "theme-dark" : ""}`}>
      <aside className="reference-sidebar">
        <a href="#workspace" className="reference-logo" aria-label="BugHunter AI home">
          <span className="reference-logo-mark"><ShieldCheck size={20} /></span>
          <span>
            <strong>BugHunter <em>AI</em></strong>
            <small>SECURE WHAT YOU BUILD</small>
          </span>
        </a>

        <nav className="reference-nav" aria-label="Primary">
          <button className="reference-nav-item active" onClick={() => scrollTo("workspace")}><LayoutDashboard size={16} /> Assessment</button>
          <button className="reference-nav-item" onClick={() => scrollTo("findings")}><Search size={16} /> Findings <span>{findings.length}</span></button>
          <button className="reference-nav-item" onClick={() => scrollTo("scanners")}><ScanLine size={16} /> Scanners</button>
          <button className="reference-nav-item" onClick={() => scrollTo("reports")}><FileText size={16} /> Reports</button>
          <button className="reference-nav-item" onClick={() => scrollTo("workspace")}><Globe2 size={16} /> Projects</button>
          <button className="reference-nav-item" onClick={() => scrollTo("trust-boundary")}><Settings size={16} /> Settings</button>
        </nav>

        <div className="reference-quote">
          <div>“Security is a feature,<br />not an afterthought.”</div>
          <i />
          <small>Evidence first.</small>
        </div>

        <div className="reference-user">
          <span>PS</span>
          <div><strong>Pradhuman Singh</strong><small>Security Engineer</small></div>
        </div>
      </aside>

      <div className="reference-main">
        <header className="reference-topbar">
          <div className="workspace-switcher">
            <Target size={15} />
            <div><span>WORKSPACE</span><strong>bug-hunter</strong></div>
            <ChevronDown size={14} />
          </div>

          <div className="reference-search">
            <Search size={15} />
            <input
              aria-label="Search targets, findings, or tools"
              value={findingQuery}
              onChange={(event) => setFindingQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                const query = findingQuery.trim().toLowerCase();
                if (!query) {
                  document.querySelector(".reference-assistant-card .chat-input textarea")?.focus();
                  return;
                }
                const target = findings.some((finding) =>
                  [finding.title, finding.category, finding.evidence?.summary, ...(finding.evidence?.sourceTools || [])]
                    .join(" ")
                    .toLowerCase()
                    .includes(query)
                ) ? "findings" : "scanners";
                scrollTo(target);
              }}
              placeholder="Search targets, findings, or tools..."
            />
            <kbd>⌘ K</kbd>
          </div>

          <div className="reference-top-actions">
            <button
              type="button"
              className={`theme-control ${darkMode ? "active" : ""}`}
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={darkMode ? "Switch to light theme" : "Switch to dark theme"}
              onClick={() => setDarkMode((value) => {
                const next = !value;
                try {
                  window.localStorage.setItem("bughunter-theme", next ? "dark" : "light");
                } catch (_error) {
                  // Theme still changes for the current session if storage is unavailable.
                }
                return next;
              })}
            >
              {darkMode ? <Moon size={13} /> : <Sun size={13} />}
              <span>{darkMode ? "Dark" : "Light"}</span>
            </button>
            <span className="reference-ready"><i /> System Ready</span>
          </div>
        </header>

        <main id="workspace" className="reference-content">
          <section className="reference-hero">
            <div className="reference-hero-copy">
              <div className="reference-eyebrow">APPLICATION SECURITY WORKSPACE</div>
              <h1>Turn security signals<br /><span>into real results.</span></h1>
              <p>Describe a target. Approve the plan. Let BugHunter collect evidence-backed findings and turn them into work your team can act on.</p>
            </div>

            <div className="reference-hero-art" aria-hidden="true">
              <div className="reference-note">Scan.<br />Validate.<br />Strengthen.</div>
              <div className="reference-ribbon ribbon-one" />
              <div className="reference-ribbon ribbon-two" />
              <div className="reference-arrow" />
            </div>

            <section className="reference-engine">
              <div className="reference-engine-head">
                <span><Wrench size={13} /> Assessment Engine</span>
                <strong><i /> Online</strong>
              </div>
              <div className="reference-engine-grid">
                <div><span><LockKeyhole size={14} /></span><small>Authorization</small><b>Enforced</b></div>
                <div><span><Globe2 size={14} /></span><small>Network</small><b>Controlled</b></div>
                <div><span><FileText size={14} /></span><small>Evidence</small><b>Tool-backed</b></div>
                <div><span><Sparkles size={14} /></span><small>AI Assistant</small><b>Active</b></div>
              </div>
            </section>
          </section>

          <section className="reference-main-grid">
            <div className="reference-assistant-column">
              <section className="reference-assistant-card">
                <AssistantChat
                  messages={assistant.messages}
                  onSend={assistant.sendMessage}
                  isWorking={assistant.isWorking}
                  onClear={clearAssistant}
                />
              </section>
              <ApprovalCard
                gate={assistant.gate}
                scanPlan={assistant.scanPlan}
                onAuthorize={assistant.confirmAuthorization}
                onScope={assistant.chooseScope}
                onApprove={assistant.approvePlan}
                disabled={assistant.isWorking}
              />
            </div>

            <aside className="reference-right-rail">
              <section className="reference-card workflow-reference">
                <div className="reference-card-head">
                  <span><LayoutDashboard size={14} /> Assessment Workflow</span>
                  <small>Step {workflowStep} of 4</small>
                </div>

                <div className="reference-step-list">
                  {[
                    ["Describe", "Define the target and security goal"],
                    ["Authorize", "Confirm ownership and permissions"],
                    ["Collect", "Execute authorized checks"],
                    ["Review", "Inspect evidence and remediation"]
                  ].map(([label, detail], index) => {
                    const step = index + 1;
                    const state = step < workflowStep ? "complete" : step === workflowStep ? "active" : "pending";
                    return (
                      <div className={`reference-step ${state}`} key={label}>
                        <b>{step}</b>
                        <span><strong>{label}</strong><small>{detail}</small></span>
                        <em>{state === "complete" ? "Done" : state === "active" ? "In progress" : "Pending"}</em>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="reference-card tool-reference">
                <div className="reference-card-head">
                  <span><Activity size={14} /> Live Tool Execution</span>
                  <small>{assistant.isWorking ? "Running" : "Idle"}</small>
                </div>
                <div className="tool-grid">
                  {scannerRows.map(([key, label, backendTool]) => (
                    <div key={key} className={`tool-status tool-status-${toolStatus(backendTool).toLowerCase().replace(/\\s+/g, "-")}`}>
                      <span className="tool-status-icon">{key === "scan" ? <Search size={12} /> : key === "crawl" ? <Globe2 size={12} /> : key === "headers" ? <ShieldCheck size={12} /> : <ScanLine size={12} />}</span>
                      <strong>{label}</strong>
                      <small>{toolStatus(backendTool)}</small>
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </section>

          <section id="findings" className="reference-findings">
            <div className="reference-section-head">
              <div className="reference-section-title"><span className="section-icon violet"><FileText size={16} /></span><div><strong>Findings</strong><small>Evidence-backed results from completed scans.</small></div></div>
              <div className="reference-findings-actions">
                <div className="finding-search"><Search size={13} /><input value={findingQuery} onChange={(event) => setFindingQuery(event.target.value)} placeholder="Search findings..." /></div>
                <button type="button" className={`findings-filter-button ${showSeverityFilters ? "active" : ""}`} onClick={() => setShowSeverityFilters((value) => !value)} aria-label="Toggle severity filters"><Filter size={13} /></button>
                <button type="button" className="findings-export" onClick={() => {
                  const markdown = assistant.assessment?.report?.markdown;
                  if (!markdown) {
                    scrollTo("reports");
                    return;
                  }
                  const href = URL.createObjectURL(new Blob([markdown], { type: "text/markdown" }));
                  const link = document.createElement("a");
                  link.href = href;
                  link.download = "bughunter-ai-report.md";
                  link.click();
                  URL.revokeObjectURL(href);
                }}><Download size={13} /> Export Report</button>
              </div>
            </div>

            {showSeverityFilters && <div className="severity-filters">
              {severityOrder.map((severity) => (
                <button key={severity} type="button" className={severityFilter === severity ? "selected" : ""} onClick={() => setSeverityFilter(severity)}>
                  {severity === "all" ? "All" : severity.charAt(0).toUpperCase() + severity.slice(1)}
                  <span>{severity === "all" ? findings.length : severityCounts[severity]}</span>
                </button>
              ))}
            </div>}

            <div className="findings-table-wrap">
              <table className="findings-table">
                <thead>
                  <tr><th>#</th><th>Severity</th><th>Finding</th><th>Evidence</th><th>Source Tool</th><th>Status</th><th>Recommendation</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredFindings.map((finding, index) => {
                    const open = expandedFinding === index;
                    const severity = severityKey(finding.severity);
                    return (
                      <tr key={finding.title + index} className={open ? "open" : ""}>
                        <td>{index + 1}</td>
                        <td><span className={`severity-pill ${severity}`}>{severity}</span></td>
                        <td><strong>{finding.title}</strong><small>{finding.category || "security observation"}</small></td>
                        <td><span className="evidence-link">{finding.evidence?.summary || "Scanner evidence"} <ArrowRight size={11} /></span></td>
                        <td>{finding.evidence?.sourceTools?.join(", ") || "scanner"}</td>
                        <td><span className={`status-pill status-${findingStatus(finding).toLowerCase()}`}>{findingStatus(finding)}</span></td>
                        <td>{finding.remediation || "Review scanner evidence and verify manually."}</td>
                        <td><button className="view-button" type="button" onClick={() => setExpandedFinding(open ? null : index)}>View <ChevronDown size={12} className={open ? "rotated" : ""} /></button></td>
                      </tr>
                    );
                  })}
                  {!filteredFindings.length && (
                    <tr className="empty-table-row"><td colSpan="8"><div><ShieldCheck size={18} /><strong>No findings yet</strong><small>Run an assessment to see results here.</small></div></td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {expandedFinding !== null && filteredFindings[expandedFinding] && (
              <div className="finding-inspector">
                <div><span>Finding detail</span><strong>{filteredFindings[expandedFinding].title}</strong></div>
                <p>{filteredFindings[expandedFinding].evidence?.summary}</p>
                <div className="inspector-grid">
                  <span><b>Impact</b>{filteredFindings[expandedFinding].impact || "Review the observed behavior in context."}</span>
                  <span><b>Remediation</b>{filteredFindings[expandedFinding].remediation}</span>
                  <span><b>Evidence source</b>{(filteredFindings[expandedFinding].evidence?.sourceTools || []).join(", ")}</span>
                  <span><b>Manual verification</b>{filteredFindings[expandedFinding].manualVerification ? "Required" : "Not required"}</span>
                </div>
              </div>
            )}
          </section>

          <section id="reports" className="reference-report-anchor">
            <ReportPanel report={assistant.assessment?.report} />
          </section>

          <section id="scanners">
            <AdvancedScannerDrawer />
          </section>

          {assistant.error && (
            <div className="reference-error error-banner" role="alert">
              <strong>Assessment paused.</strong>
              <span>{assistant.error}</span>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
