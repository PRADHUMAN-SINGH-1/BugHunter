import { Play, ShieldCheck, Sparkles } from "lucide-react";
import "./App.css";
import "./SecurityConsole.css";
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
    <div className="app-shell security-console">
      <header className="topbar">
        <a className="brand" href="#workspace" aria-label="BugHunter AI home">
          <span className="brand-mark"><ShieldCheck size={20} /></span>
          <span>BugHunter <em>AI</em></span>
        </a>
        <div className="topbar-actions">
          <span className="topbar-status"><span /> SYSTEM READY</span>
          <span className="topbar-divider" />
          <span className="topbar-mode">EVIDENCE-FIRST SECURITY</span>
        </div>
      </header>

      <main id="workspace" className="workspace security-workspace">
        <section className="hero security-hero">
          <div className="hero-copy">
            <p className="eyebrow hero-eyebrow"><Sparkles size={13} /> APPLICATION SECURITY WORKSPACE</p>
            <h1>Test it. <span>Prove it.</span></h1>
            <p>Describe an authorized target and BugHunter will build a scan plan, collect deterministic evidence, and turn the results into developer-ready findings.</p>
            <div className="hero-actions">
              <button className="demo-button" onClick={assistant.runDemo} disabled={assistant.isWorking}>
                <Play size={15} fill="currentColor" /> {assistant.isWorking ? "Running demo…" : "Run safe demo"}
              </button>
              <span>Fixture-backed · no target traffic</span>
            </div>
          </div>

          <div className="security-readout">
            <div className="readout-title"><span>ASSESSMENT ENGINE</span><b><i /> ONLINE</b></div>
            <div className="readout-main">EVIDENCE-FIRST</div>
            <div className="readout-grid">
              <div><span>Authorization</span><strong>ENFORCED</strong></div>
              <div><span>Findings</span><strong>TOOL-BACKED</strong></div>
              <div><span>Network</span><strong>CONTROLLED</strong></div>
            </div>
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

        <section className="workspace-grid security-grid">
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
            <div className="context-card panel security-panel">
              <p className="eyebrow">ASSESSMENT WORKFLOW</p>
              <div className="context-steps">
                <span><b>01</b><strong>Describe</strong><small>Define the security goal.</small></span>
                <span><b>02</b><strong>Authorize</strong><small>Confirm scope and permissions.</small></span>
                <span><b>03</b><strong>Collect</strong><small>Execute approved evidence collectors.</small></span>
                <span><b>04</b><strong>Review</strong><small>Inspect evidence and remediation.</small></span>
              </div>
            </div>
            <ScanTimeline timeline={assistant.timeline} visible={assistant.isWorking || Boolean(assistant.assessment)} />
          </aside>
        </section>

        {assistant.assessment && (
          <section className="results-workspace security-results">
            <div className="results-header">
              <div>
                <p className="eyebrow">ASSESSMENT OUTPUT</p>
                <h2>Evidence-backed results</h2>
              </div>
              <span>{findings.length} finding{findings.length === 1 ? "" : "s"}</span>
            </div>
            <ExecutiveSummary
              summary={assistant.assessment.executiveSummary}
              findings={findings}
              executedTools={assistant.assessment.executedTools}
            />
            <div className="findings-heading">
              <div><p className="eyebrow">TECHNICAL FINDINGS</p><h2>Verified security signals</h2></div>
              <span>{findings.length}</span>
            </div>
            <div className="findings-list">
              {findings.length
                ? findings.map((finding, index) => (
                    <FindingCard key={finding.title + index} finding={finding} index={index} />
                  ))
                : <div className="empty-findings panel"><ShieldCheck size={22} /><h3>No evidence-backed findings were returned.</h3><p>The assistant excluded any claim that was not tied to a scanner tool.</p></div>}
            </div>
            <ReportPanel report={assistant.assessment.report} />
          </section>
        )}

        <AdvancedScannerDrawer />
      </main>
    </div>
  );
}

export default App;
