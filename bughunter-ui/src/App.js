import {
  Activity,
  ArrowRight,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  Play,
  ScanLine,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Wrench
} from "lucide-react";
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
    <div className="app-shell editorial-app">
      <aside className="editorial-sidebar">
        <a href="#workspace" className="editorial-logo" aria-label="BugHunter AI home">
          <span className="editorial-logo-mark"><ShieldCheck size={18} /></span>
          <span>
            <strong>BugHunter <em>AI</em></strong>
            <small>SECURE WHAT YOU BUILD.</small>
          </span>
        </a>

        <nav className="editorial-nav" aria-label="Primary navigation">
          <a className="nav-item active" href="#workspace">
            <LayoutDashboard size={16} /> Assessment
          </a>
          <a className="nav-item" href="#findings">
            <Search size={16} /> Findings
            <span>{findings.length}</span>
          </a>
          <a className="nav-item" href="#scanners">
            <ScanLine size={16} /> Scanners
          </a>
          <a className="nav-item" href="#reports">
            <FileText size={16} /> Reports
          </a>
          <a className="nav-item" href="#trust-boundary">
            <Settings size={16} /> Trust & Safety
          </a>
        </nav>

        <div className="sidebar-quote">
          <span>“Security is a feature,<br />not an afterthought.”</span>
          <i />
          <small>Evidence first.</small>
        </div>

        <div className="sidebar-user">
          <span>PS</span>
          <div>
            <strong>Security Engineer</strong>
            <small>BugHunter workspace</small>
          </div>
        </div>
      </aside>

      <div className="editorial-main">
        <header className="editorial-topbar">
          <div className="project-switcher">
            <Target size={15} />
            <div>
              <span>WORKSPACE</span>
              <strong>bug-hunter</strong>
            </div>
            <ArrowRight size={13} />
          </div>

          <div className="topbar-center">
            <div className="search-shell">
              <Search size={15} />
              <span>Search targets, findings, or tools</span>
              <kbd>⌘ K</kbd>
            </div>
          </div>

          <div className="topbar-right">
            <span className="ready-chip"><i /> System Ready</span>
            <button className="demo-ghost" onClick={assistant.runDemo} disabled={assistant.isWorking}>
              <Play size={12} fill="currentColor" />
              {assistant.isWorking ? "Running" : "Run demo"}
            </button>
          </div>
        </header>

        <main id="workspace" className="editorial-content">
          <section className="editorial-hero">
            <div className="hero-copy">
              <div className="eyebrow editorial-eyebrow">
                <Sparkles size={12} /> APPLICATION SECURITY WORKSPACE
              </div>
              <h1>Turn security signals<br /><span>into real results.</span></h1>
              <p>Describe a target. Approve the plan. Let BugHunter collect evidence-backed findings and turn them into work your team can act on.</p>

              <div className="hero-meta-row">
                <span><i /> Controlled assessment</span>
                <span><CheckCircle2 size={13} /> Evidence-backed output</span>
                <span><ShieldCheck size={13} /> Authorization gated</span>
              </div>
            </div>

            <div className="hero-art" aria-hidden="true">
              <div className="hero-art-note">scan.<br />validate.<br />strengthen.</div>
              <div className="hero-art-line" />
              <div className="hero-art-orbit orbit-a" />
              <div className="hero-art-orbit orbit-b" />
              <div className="hero-art-dot dot-a" />
              <div className="hero-art-dot dot-b" />
            </div>
          </section>

          <section className="target-bar">
            <div className="target-bar-label"><Target size={14} /> TARGET</div>
            <div className="target-field-display">
              <span>Enter an authorized target in the assistant below</span>
              <b>HTTP(S) only</b>
            </div>
            <button className="start-assessment-button" onClick={() => document.querySelector(".chat-input textarea")?.focus()}>
              Start with assistant <ArrowRight size={14} />
            </button>
          </section>

          <section className="status-grid">
            <article>
              <div><span>WORKFLOW</span><LayoutDashboard size={15} /></div>
              <strong>Guided</strong>
              <small>Describe → authorize → approve → scan</small>
            </article>
            <article>
              <div><span>EVIDENCE</span><Wrench size={15} /></div>
              <strong>Deterministic</strong>
              <small>Scanner-backed results only</small>
            </article>
            <article>
              <div><span>FINDINGS</span><Activity size={15} /></div>
              <strong>{findings.length}</strong>
              <small>{highRiskCount} high / critical</small>
            </article>
            <article>
              <div><span>MODE</span><ShieldCheck size={15} /></div>
              <strong>Non-destructive</strong>
              <small>Active checks require approval</small>
            </article>
          </section>

          <ProgressIndicator isWorking={assistant.isWorking} />

          {assistant.error && (
            <div className="editorial-error error-banner" role="alert">
              <strong>Assessment paused.</strong>
              <span>{assistant.error}</span>
              <span>Verify authorization, target scope, or server configuration.</span>
            </div>
          )}

          <section className="workspace-layout">
            <div className="assistant-column">
              <div className="section-heading-row">
                <div>
                  <span className="section-number">01</span>
                  <div>
                    <strong>AI SECURITY ASSISTANT</strong>
                    <small>Plan, authorize, and interpret evidence.</small>
                  </div>
                </div>
                <span className="section-live"><i /> {assistant.isWorking ? "Working" : "Ready"}</span>
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

            <aside className="editorial-rail">
              <section className="editorial-card workflow-card">
                <div className="card-title-row">
                  <span>ASSESSMENT WORKFLOW</span>
                  <span>STEP 1 OF 4</span>
                </div>

                <div className="editorial-workflow">
                  <div className="workflow-node active">
                    <b>1</b><span><strong>Describe</strong><small>Define target + security goal</small></span>
                  </div>
                  <div className="workflow-node">
                    <b>2</b><span><strong>Authorize</strong><small>Confirm ownership + permissions</small></span>
                  </div>
                  <div className="workflow-node">
                    <b>3</b><span><strong>Approve</strong><small>Review the exact scan plan</small></span>
                  </div>
                  <div className="workflow-node">
                    <b>4</b><span><strong>Review</strong><small>Inspect evidence + remediation</small></span>
                  </div>
                </div>
              </section>

              <ScanTimeline
                timeline={assistant.timeline}
                visible={assistant.isWorking || Boolean(assistant.assessment)}
              />

              <section className="editorial-card trust-card" id="trust-boundary">
                <div className="card-title-row"><span>TRUST & SAFETY</span><span>BUILT IN</span></div>
                <div className="trust-note"><CheckCircle2 size={14} /> Findings require executed scanner evidence.</div>
                <div className="trust-note"><CheckCircle2 size={14} /> Active testing requires explicit approval.</div>
                <div className="trust-note"><CheckCircle2 size={14} /> Reports are generated from observed results.</div>
              </section>
            </aside>
          </section>

          {assistant.assessment && (
            <section className="editorial-results" id="findings">
              <div className="results-headline">
                <div>
                  <span className="section-number">02</span>
                  <div>
                    <strong>ASSESSMENT RESULTS</strong>
                    <small>Evidence-backed findings from completed scans.</small>
                  </div>
                </div>
                <div className="results-actions">
                  <span>{findings.length} findings</span>
                  <span>{assistant.assessment.executedTools?.length || 0} tools executed</span>
                </div>
              </div>

              <ExecutiveSummary
                summary={assistant.assessment.executiveSummary}
                findings={findings}
                executedTools={assistant.assessment.executedTools}
              />

              <div className="finding-list-head">
                <div>
                  <span>TECHNICAL FINDINGS</span>
                  <strong>Evidence you can act on.</strong>
                </div>
                <small>Source tools remain visible with every finding.</small>
              </div>

              <div className="findings-list">
                {findings.length
                  ? findings.map((finding, index) => (
                      <FindingCard
                        key={finding.title + index}
                        finding={finding}
                        index={index}
                      />
                    ))
                  : (
                      <div className="empty-findings panel">
                        <ShieldCheck size={21} />
                        <h3>No evidence-backed findings were returned.</h3>
                        <p>The assessment completed without a scanner-supported finding.</p>
                      </div>
                    )}
              </div>

              <div id="reports">
                <ReportPanel report={assistant.assessment.report} />
              </div>
            </section>
          )}

          <section id="scanners">
            <AdvancedScannerDrawer />
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
