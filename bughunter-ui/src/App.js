import { Activity, ArrowUpRight, Play, ShieldCheck, Sparkles } from "lucide-react";
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
  const highRiskCount = findings.filter((finding) =>
    ["high", "critical"].includes(String(finding.severity).toLowerCase())
  ).length;

  return (
    <div className="app-shell security-console">
      <header className="app-header">
        <div className="app-header-left">
          <a className="brand-lockup" href="#workspace" aria-label="BugHunter AI home">
            <span className="brand-icon"><ShieldCheck size={17} /></span>
            <span>
              <b>BugHunter <em>AI</em></b>
              <small>APPLICATION SECURITY</small>
            </span>
          </a>
          <span className="header-rule" />
          <span className="environment-label">CONTROLLED ASSESSMENT</span>
        </div>

        <div className="app-header-right">
          <span className="header-live"><i /> SYSTEM READY</span>
          <button
            className="header-action"
            onClick={assistant.runDemo}
            disabled={assistant.isWorking}
          >
            <Play size={12} fill="currentColor" />
            {assistant.isWorking ? "RUNNING" : "RUN SAFE DEMO"}
          </button>
        </div>
      </header>

      <main id="workspace" className="product-page">
        <section className="command-header">
          <div>
            <div className="section-kicker"><Sparkles size={12} /> SECURITY WORKSPACE</div>
            <h1>Assess an application with evidence, not noise.</h1>
            <p>
              Describe an authorized target. Review the scope, approve the checks,
              and inspect the scanner evidence before acting on a finding.
            </p>
          </div>

          <div className="engine-card">
            <div className="engine-top">
              <span>ASSESSMENT ENGINE</span>
              <strong><i /> ONLINE</strong>
            </div>
            <div className="engine-mode"><Activity size={16} /> EVIDENCE-FIRST</div>
            <div className="engine-meta">
              <span>Authorization <b>ENFORCED</b></span>
              <span>Network <b>CONTROLLED</b></span>
              <span>AI <b>INTERPRETATION</b></span>
            </div>
          </div>
        </section>

        <section className="overview-strip" aria-label="Assessment overview">
          <article>
            <span>WORKFLOW</span>
            <strong>GUIDED</strong>
            <small>Plan → approve → scan</small>
          </article>
          <article>
            <span>EVIDENCE</span>
            <strong>DETERMINISTIC</strong>
            <small>Scanner-backed output</small>
          </article>
          <article>
            <span>FINDINGS</span>
            <strong>{findings.length}</strong>
            <small>{highRiskCount} high / critical</small>
          </article>
          <article>
            <span>MODE</span>
            <strong>NON-DESTRUCTIVE</strong>
            <small>Active checks are gated</small>
          </article>
        </section>

        <ProgressIndicator isWorking={assistant.isWorking} />

        {assistant.error && (
          <div className="error-banner product-error" role="alert">
            <strong>Assessment paused</strong>
            <span>{assistant.error}</span>
            <span>Verify authorization, target scope, or server configuration.</span>
          </div>
        )}

        <section className="workbench-grid">
          <div className="workbench-main">
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

          <aside className="workbench-rail">
            <section className="rail-card">
              <div className="rail-card-head">
                <span>ASSESSMENT FLOW</span>
                <ArrowUpRight size={13} />
              </div>

              <div className="workflow-list">
                <div className="workflow-item active">
                  <b>01</b>
                  <span><strong>Describe</strong><small>Target + security goal</small></span>
                </div>
                <div className="workflow-item">
                  <b>02</b>
                  <span><strong>Authorize</strong><small>Ownership + scope</small></span>
                </div>
                <div className="workflow-item">
                  <b>03</b>
                  <span><strong>Approve</strong><small>Exact scanner plan</small></span>
                </div>
                <div className="workflow-item">
                  <b>04</b>
                  <span><strong>Review</strong><small>Evidence + remediation</small></span>
                </div>
              </div>
            </section>

            <ScanTimeline
              timeline={assistant.timeline}
              visible={assistant.isWorking || Boolean(assistant.assessment)}
            />

            <section className="rail-card trust-card">
              <div className="rail-card-head"><span>TRUST BOUNDARY</span></div>
              <div className="trust-item"><i /> Findings require executed scanner evidence.</div>
              <div className="trust-item"><i /> Active testing requires explicit approval.</div>
              <div className="trust-item"><i /> Reports are generated from observed results.</div>
            </section>
          </aside>
        </section>

        {assistant.assessment && (
          <section className="results-workspace">
            <div className="results-toolbar">
              <div>
                <div className="section-kicker">02 · ASSESSMENT OUTPUT</div>
                <h2>Evidence-backed results</h2>
              </div>
              <div className="results-stats">
                <span>{findings.length} findings</span>
                <span>{assistant.assessment.executedTools?.length || 0} tools executed</span>
              </div>
            </div>

            <ExecutiveSummary
              summary={assistant.assessment.executiveSummary}
              findings={findings}
              executedTools={assistant.assessment.executedTools}
            />

            <div className="findings-toolbar">
              <div>
                <span>TECHNICAL FINDINGS</span>
                <h3>Verified security signals</h3>
              </div>
              <small>Scanner-backed observations</small>
            </div>

            <div className="findings-list">
              {findings.length ? findings.map((finding, index) => (
                <FindingCard
                  key={finding.title + index}
                  finding={finding}
                  index={index}
                />
              )) : (
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
