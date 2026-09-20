import { Activity, CheckCircle2, Play, ShieldCheck, Terminal } from "lucide-react";
import "./App.css";
import "./Redesign.css";
import { AdvancedScanners } from "./components/AdvancedScanners";
import { ApprovalCard } from "./components/ApprovalCard";
import { AssistantChat } from "./components/AssistantChat";
import { ExecutiveSummary } from "./components/ExecutiveSummary";
import { FindingCard } from "./components/FindingCard";
import { ProgressIndicator } from "./components/ProgressIndicator";
import { ReportPanel } from "./components/ReportPanel";
import { ScanTimeline } from "./components/ScanTimeline";
import { useAssistant } from "./hooks/useAssistant";

function App() {
  const assistant = useAssistant();
  const findings = assistant.assessment?.findings || [];

  return (
    <div className="app-shell redesign-shell">
      <header className="security-header">
        <a className="security-brand" href="#workspace" aria-label="BugHunter AI home">
          <span className="brand-mark"><ShieldCheck size={18} /></span>
          <span><b>BUGHUNTER</b><small>APPLICATION SECURITY</small></span>
        </a>
        <div className="header-meta">
          <span><i /> SYSTEM READY</span>
          <span className="header-divider" />
          <span>AUTHORIZATION GATE ENFORCED</span>
          <span className="version-tag">v1.0</span>
        </div>
      </header>

      <main id="workspace" className="workspace redesign-workspace">
        <section className="workspace-intro">
          <div>
            <div className="section-kicker"><Terminal size={12} /> SECURITY ASSESSMENT</div>
            <h1>Application security workspace</h1>
            <p>Define the target and security objective, review the proposed checks, then inspect only evidence-backed results.</p>
            <div className="intro-actions">
              <button className="console-primary" onClick={assistant.runDemo} disabled={assistant.isWorking}>
                <Play size={14} fill="currentColor" /> {assistant.isWorking ? "Assessment running" : "Run safe demo"}
              </button>
              <span className="action-note"><CheckCircle2 size={14} /> Fixture-backed · no target traffic</span>
            </div>
          </div>
          <div className="status-panel">
            <div className="status-panel-head">
              <span>ASSESSMENT ENGINE</span>
              <b><i /> ONLINE</b>
            </div>
            <div className="status-main"><Activity size={19} /> EVIDENCE-FIRST</div>
            <div className="status-row"><span>Authorization</span><strong>ENFORCED</strong></div>
            <div className="status-row"><span>Findings</span><strong>TOOL-BACKED</strong></div>
            <div className="status-row"><span>Network</span><strong>CONTROLLED</strong></div>
          </div>
        </section>

        <ProgressIndicator isWorking={assistant.isWorking} />
        {assistant.error && (
          <div className="error-banner" role="alert">
            <strong>Assessment paused.</strong>
            <span>{assistant.error}</span>
            <span>Check the target URL, authorization, or backend configuration and try again.</span>
          </div>
        )}

        <section className="analysis-layout">
          <div className="conversation-column">
            <div className="section-label"><span>01</span> SECURITY CONVERSATION <em>LIVE</em></div>
            <AssistantChat messages={assistant.messages} onSend={assistant.sendMessage} isWorking={assistant.isWorking} />
            <ApprovalCard
              gate={assistant.gate}
              scanPlan={assistant.scanPlan}
              onAuthorize={assistant.confirmAuthorization}
              onScope={assistant.chooseScope}
              onApprove={assistant.approvePlan}
              disabled={assistant.isWorking}
            />
          </div>

          <aside className="context-column">
            <div className="context-card panel console-panel">
              <div className="card-heading"><span>ASSESSMENT WORKFLOW</span></div>
              <div className="workflow-list">
                <div><b>01</b><span><strong>Describe</strong> Define the security goal.</span></div>
                <div><b>02</b><span><strong>Authorize</strong> Confirm scope and permissions.</span></div>
                <div><b>03</b><span><strong>Collect</strong> Execute approved evidence collectors.</span></div>
                <div><b>04</b><span><strong>Review</strong> Inspect evidence and remediation.</span></div>
              </div>
            </div>
            <ScanTimeline timeline={assistant.timeline} visible={assistant.isWorking || Boolean(assistant.assessment)} />
          </aside>
        </section>

        {assistant.assessment && (
          <section className="results-workspace redesign-results">
            <div className="results-header">
              <div><div className="section-kicker">ASSESSMENT OUTPUT</div><h2>Evidence-backed results</h2></div>
              <span>{findings.length} finding{findings.length === 1 ? "" : "s"}</span>
            </div>

            <ExecutiveSummary
              summary={assistant.assessment.executiveSummary}
              findings={findings}
              executedTools={assistant.assessment.executedTools}
            />

            <div className="findings-heading">
              <div><p className="eyebrow">TECHNICAL FINDINGS</p><h2>Verified security signals</h2></div>
              <span>{findings.length} finding{findings.length === 1 ? "" : "s"}</span>
            </div>

            <div className="findings-list">
              {findings.length ? findings.map((finding, index) => (
                <FindingCard key={finding.title + "-" + index} finding={finding} index={index} />
              )) : (
                <div className="empty-findings panel">
                  <ShieldCheck size={22} />
                  <h3>No evidence-backed findings were returned.</h3>
                  <p>The assistant excluded any claim that was not tied to a scanner tool.</p>
                </div>
              )}
            </div>
            <ReportPanel report={assistant.assessment.report} />
          </section>
        )}

        <AdvancedScanners />
      </main>
    </div>
  );
}

export default App;
