import { Activity, CheckCircle2, Play, ShieldCheck, Sparkles } from "lucide-react";
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
  const highRiskCount = findings.filter((finding) => ["high", "critical"].includes(String(finding.severity).toLowerCase())).length;

  return (
    <div className="app-shell security-console">
      <header className="security-header">
        <a className="security-brand" href="#workspace" aria-label="BugHunter AI home">
          <span className="security-mark"><ShieldCheck size={18} /></span>
          <span>
            <b>BUGHUNTER <em>AI</em></b>
            <small>APPLICATION SECURITY</small>
          </span>
        </a>

        <div className="header-status">
          <span className="header-live"><i /> SYSTEM READY</span>
          <span className="header-divider" />
          <span className="header-caption">EVIDENCE-FIRST ENGINE</span>
        </div>
      </header>

      <main id="workspace" className="security-page">
        <section className="assessment-head">
          <div>
            <div className="section-kicker"><Sparkles size={12} /> ASSESSMENT WORKSPACE</div>
            <h1>Security assessment</h1>
            <p>Define an authorized target, approve the checks, and review only evidence produced by the scanners.</p>
          </div>

          <div className="assessment-state">
            <div className="state-top">
              <span>ENGINE STATUS</span>
              <strong><i /> ONLINE</strong>
            </div>
            <div className="state-row"><span>Authorization</span><b>REQUIRED</b></div>
            <div className="state-row"><span>Network posture</span><b>CONTROLLED</b></div>
            <div className="state-row"><span>AI role</span><b>INTERPRETATION</b></div>
          </div>
        </section>

        <section className="metric-strip">
          <article><span>MODE</span><strong>GUIDED ASSESSMENT</strong><small>Plan before scan</small></article>
          <article><span>EVIDENCE</span><strong>DETERMINISTIC</strong><small>Scanner-backed</small></article>
          <article><span>FINDINGS</span><strong>{findings.length}</strong><small>{highRiskCount} high/critical</small></article>
          <article><span>SCOPE</span><strong>NON-DESTRUCTIVE</strong><small>Active checks need approval</small></article>
        </section>

        <ProgressIndicator isWorking={assistant.isWorking} />

        {assistant.error && (
          <div className="error-banner security-error" role="alert">
            <strong>Assessment paused.</strong>
            <span>{assistant.error}</span>
            <span>Configure the active AI provider or verify the target and authorization.</span>
          </div>
        )}

        <section className="primary-workspace">
          <div className="primary-column">
            <div className="section-label">
              <span>01</span>
              SECURITY CONVERSATION
              <em>{assistant.isWorking ? "RUNNING" : "READY"}</em>
            </div>

            <AssistantChat
              messages={assistant.messages}
              onSend={assistant.sendMessage}
              isWorking={assistant.isWorking}
            />

            <ApprovalCard
              gate={assistant.gate}
              scanPlan={assistant.scanPlan}
              onAuthorize={assistant.confirmAuthorization}
              onScope={assistant.chooseScope}
              onApprove={assistant.approvePlan}
              disabled={assistant.isWorking}
            />
          </div>

          <aside className="side-rail">
            <section className="rail-panel workflow-panel">
              <div className="rail-title">
                <span>ASSESSMENT FLOW</span>
                <span className="rail-status">LIVE</span>
              </div>
              <div className="workflow-steps">
                <div className="workflow-step active"><b>01</b><span><strong>Describe</strong><small>Target + security goal</small></span></div>
                <div className="workflow-step"><b>02</b><span><strong>Authorize</strong><small>Ownership + scope</small></span></div>
                <div className="workflow-step"><b>03</b><span><strong>Approve</strong><small>Exact scanner plan</small></span></div>
                <div className="workflow-step"><b>04</b><span><strong>Review</strong><small>Evidence + remediation</small></span></div>
              </div>
            </section>

            <ScanTimeline
              timeline={assistant.timeline}
              visible={assistant.isWorking || Boolean(assistant.assessment)}
            />

            <section className="rail-panel trust-panel">
              <div className="rail-title"><span>TRUST BOUNDARY</span></div>
              <div className="trust-line"><CheckCircle2 size={14} /><span>Findings require executed scanner evidence.</span></div>
              <div className="trust-line"><CheckCircle2 size={14} /><span>Active testing is explicitly gated.</span></div>
              <div className="trust-line"><CheckCircle2 size={14} /><span>Reports are generated from observed results.</span></div>
            </section>
          </aside>
        </section>

        {assistant.assessment && (
          <section className="results-workspace security-results">
            <div className="results-heading">
              <div>
                <div className="section-kicker">02 · ASSESSMENT OUTPUT</div>
                <h2>Evidence-backed results</h2>
              </div>
              <div className="results-meta">
                <span>{findings.length} findings</span>
                <span>{assistant.assessment.executedTools?.length || 0} tools executed</span>
              </div>
            </div>

            <ExecutiveSummary
              summary={assistant.assessment.executiveSummary}
              findings={findings}
              executedTools={assistant.assessment.executedTools}
            />

            <div className="finding-section-head">
              <div>
                <span>TECHNICAL FINDINGS</span>
                <h3>Verified security signals</h3>
              </div>
              <small>All observations retain their scanner evidence.</small>
            </div>

            <div className="findings-list">
              {findings.length
                ? findings.map((finding, index) => (
                    <FindingCard key={finding.title + index} finding={finding} index={index} />
                  ))
                : (
                    <div className="empty-findings panel">
                      <ShieldCheck size={21} />
                      <h3>No evidence-backed findings were returned.</h3>
                      <p>The assessment completed without a scanner-supported finding.</p>
                    </div>
                  )}
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
