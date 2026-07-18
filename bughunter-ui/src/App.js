import { useState } from "react";
import { ArrowUpRight, Bot, Menu, Play, ShieldCheck, Sparkles } from "lucide-react";
import "./App.css";
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const assistant = useAssistant();
  const findings = assistant.assessment?.findings || [];

  return <div className="app-shell">
    <div className="ambient ambient-one" /><div className="ambient ambient-two" />
    <header className="topbar">
      <a className="brand" href="#workspace" aria-label="BugHunter AI home"><span className="brand-mark"><ShieldCheck size={22} /></span><span>BugHunter <em>AI</em></span></a>
      <div className="topbar-actions"><span className="topbar-status"><span /> Evidence-first analysis</span><button className="advanced-trigger" onClick={() => setDrawerOpen(true)}><Menu size={17} /> Advanced scanners</button></div>
    </header>

    <main id="workspace" className="workspace">
      <section className="hero">
        <div className="hero-copy"><p className="eyebrow hero-eyebrow"><Sparkles size={14} /> YOUR AI APPLICATION SECURITY ENGINEER</p><h1>Security clarity<br /><span>at the speed of code.</span></h1><p>Describe your goal. BugHunter AI plans authorized checks, traces deterministic evidence, and turns security signals into developer-ready action.</p><div className="hero-actions"><button className="demo-button" onClick={assistant.runDemo} disabled={assistant.isWorking}><Play size={16} fill="currentColor" /> Analyze Demo Application</button><span>Safe sample · no API key · predictable results</span></div></div>
        <div className="hero-orbit"><div className="orbit-core"><Bot size={31} /><span>AI</span></div><i /><i /><i /></div>
      </section>

      <ProgressIndicator isWorking={assistant.isWorking} />
      {assistant.error && <div className="error-banner" role="alert"><strong>Assessment paused.</strong><span>{assistant.error}</span><span>Check the target URL, authorization, or backend configuration and try again.</span></div>}

      <section className="workspace-grid">
        <div className="conversation-column">
          <AssistantChat messages={assistant.messages} onSend={assistant.sendMessage} isWorking={assistant.isWorking} />
          <ApprovalCard gate={assistant.gate} scanPlan={assistant.scanPlan} onAuthorize={assistant.confirmAuthorization} onScope={assistant.chooseScope} onApprove={assistant.approvePlan} disabled={assistant.isWorking} />
        </div>
        <aside className="context-column">
          <div className="context-card panel"><p className="eyebrow">HOW IT WORKS</p><div className="context-steps"><span><b>01</b> Describe your goal</span><span><b>02</b> Approve the plan</span><span><b>03</b> Review evidence</span></div><button onClick={() => setDrawerOpen(true)}>Need a focused check? <ArrowUpRight size={15} /></button></div>
          <ScanTimeline timeline={assistant.timeline} visible={assistant.isWorking || Boolean(assistant.assessment)} />
        </aside>
      </section>

      {assistant.assessment && <section className="results-workspace">
        <ExecutiveSummary summary={assistant.assessment.executiveSummary} findings={findings} executedTools={assistant.assessment.executedTools} />
        <div className="findings-heading"><div><p className="eyebrow">TECHNICAL FINDINGS</p><h2>Evidence, not guesses.</h2></div><span>{findings.length} finding{findings.length === 1 ? "" : "s"}</span></div>
        <div className="findings-list">{findings.length ? findings.map((finding, index) => <FindingCard key={`${finding.title}-${index}`} finding={finding} index={index} />) : <div className="empty-findings panel"><ShieldCheck size={24} /><h3>No evidence-backed findings were returned.</h3><p>The assistant excluded any claim that was not tied to a scanner tool.</p></div>}</div>
        <ReportPanel report={assistant.assessment.report} />
      </section>}
    </main>
    <AdvancedScannerDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
  </div>;
}

export default App;
