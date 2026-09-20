import { Activity, ArrowUpRight, CheckCircle2, Play, ShieldCheck, Terminal } from "lucide-react";
import "./App.css";
import "./Redesign.css";
import { AdvancedScannerDrawer } from "./components/AdvancedScannerDrawer";
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
          <span className="brand-mark"><ShieldCheck size={19} /></span>
          <span><b>BUGHUNTER</b><small>APPLICATION SECURITY</small></span>
        </a>
        <div className="header-meta">
          <span><i /> SYSTEM READY</span>
          <span className="header-divider" />
          <span>DETERMINISTIC EVIDENCE</span>
          <span className="version-tag">v1.0</span>
        </div>
      </header>

      <main id="workspace" className="workspace redesign-workspace">
        <section className="console-intro">
          <div className="intro-copy">
            <div className="section-kicker"><Terminal size={13} /> SECURITY ASSESSMENT CONSOLE</div>
            <h1>Find the signal.<br /><span>Prove the vulnerability.</span></h1>
            <p>Describe what you need tested. BugHunter builds an authorized plan, executes deterministic evidence collectors, and turns the resulting signals into actionable findings.</p>
            <div className="intro-actions">
              <button className="console-primary" onClick={assistant.runDemo} disabled={assistant.isWorking}>
                <Play size={15} fill="currentColor" /> {assistant.isWorking ? "Assessment running" : "Run safe demo"}
              </button>
              <span className="action-note"><CheckCircle2 size={14} /> Fixture-backed · no target traffic</span>
            </div>
          </div>
          <div className="system-readout">
            <div className="readout-head"><span>ASSESSMENT ENGINE</span><span className="readout-live">ONLINE</span></div>
            <div className="readout-core"><Activity size={20} /><strong>EVIDENCE-FIRST</strong></div>
            <div className="readout-row"><span>Authorization gate</span><b>ENFORCED</b></div>
            <div className="readout-row"><span>Model findings</span><b>TOOL-BACKED</b></div>
            <div className="readout-row"><span>Network posture</span><b>CONTROLLED</b></div>
          </div>
        </section>

        <ProgressIndicator isWorking={assistant.isWorking} />
        {assistant.error && <div className="error-banner" role="alert"><strong>Assessment paused.</strong><span>{assistant.error}</span><span>Check the target URL, authorization, or backend configuration and try again.</span></div>}

        <AdvancedScannerDrawer />

        <section className="analysis-layout">
          <div className="conversation-column">
            <div className="section-label"><span>01</span> ANALYSIS WORKSPACE <em>LIVE</em></div>
            <AssistantChat messages={assistant.messages} onSend={assistant.sendMessage} isWorking={assistant.isWorking} />
            <ApprovalCard gate={assistant.gate} scanPlan={assistant.scanPlan} onAuthorize={assistant.confirmAuthorization} onScope={assistant.chooseScope} onApprove={assistant.approvePlan} disabled={assistant.isWorking} />
          </div>
          <aside className="context-column">
            <div className="context-card panel console-panel">
              <div className="card-heading"><span>WORKFLOW</span><ArrowUpRight size={15} /></div>
              <div className="workflow-list">
                <div><b>01</b><span><strong>Describe</strong> Define the security goal.</span></div>
                <div><b>02</b><span><strong>Authorize</strong> Approve scope and checks.</span></div>
                <div><b>03</b><span><strong>Collect</strong> Run deterministic tools.</span></div>
                <div><b>04</b><span><strong>Prove</strong> Review evidence and remediation.</span></div>
              </div>
            </div>
            <ScanTimeline timeline={assistant.timeline} visible={assistant.isWorking || Boolean(assistant.assessment)} />
          </aside>
        </section>

        {assistant.assessment && <section className="results-workspace redesign-results">
          <div className="results-header"><div><div className="section-kicker">ASSESSMENT OUTPUT</div><h2>Evidence-backed results</h2></div><span>{findings.length} finding{findings.length === 1 ? "" : "s"}</span></div>
          <ExecutiveSummary summary={assistant.assessment.executiveSummary} findings={findings} executedTools={assistant.assessment.executedTools} />
          <div className="findings-heading"><div><p className="eyebrow">TECHNICAL FINDINGS</p><h2>Evidence, not guesses.</h2></div><span>{findings.length} finding{findings.length === 1 ? "" : "s"}</span></div>
          <div className="findings-list">{findings.length ? findings.map((finding, index) => <FindingCard key={`${finding.title}-${index}`} finding={finding} index={index} />) : <div className="empty-findings panel"><ShieldCheck size={24} /><h3>No evidence-backed findings were returned.</h3><p>The assistant excluded any claim that was not tied to a scanner tool.</p></div>}</div>
          <ReportPanel report={assistant.assessment.report} />
        </section>}
      </main>
    </div>
  );
}

export default App;
