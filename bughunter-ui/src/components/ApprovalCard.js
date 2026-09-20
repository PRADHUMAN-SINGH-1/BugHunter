import { CheckCircle2, ScanSearch, ShieldAlert } from "lucide-react";
import { ScanPlanCard } from "./ScanPlanCard";

export function ApprovalCard({ gate, scanPlan, onAuthorize, onScope, onApprove, disabled }) {
  if (!gate) return null;

  if (gate.kind === "authorization") {
    return (
      <section className="reference-approval approval-card approval-scope-card">
        <div className="reference-approval-icon authorization-icon"><ShieldAlert size={21} /></div>
        <div className="reference-approval-body">
          <div className="reference-approval-kicker">
            <span>SCOPE CONFIRMATION</span>
            <strong>STEP 2 · REQUIRED</strong>
          </div>
          <h2>Do you have permission to test this target?</h2>
          <p>BugHunter only scans applications you own or are explicitly authorized to assess. Confirm that this target is inside your approved testing scope.</p>
          <div className="reference-approval-actions">
            <button className="reference-primary-button" onClick={onAuthorize} disabled={disabled}>
              <CheckCircle2 size={16} /> I have authorization
            </button>
          </div>
          <div className="reference-approval-note"><ShieldAlert size={13} /> Authorization is required before any active or passive assessment begins.</div>
        </div>
      </section>
    );
  }

  if (gate.kind === "scope") {
    return (
      <section className="reference-approval approval-card reference-scan-mode-card">
        <div className="reference-approval-icon mode-icon"><ScanSearch size={21} /></div>
        <div className="reference-approval-body">
          <div className="reference-approval-kicker">
            <span>CHOOSE SCAN MODE</span>
            <strong>STEP 3 · YOUR CHOICE</strong>
          </div>
          <h2>How deep should this assessment go?</h2>
          <p>Passive checks observe public behavior. Active checks add controlled reflection and SQLi heuristics and require the authorization you just confirmed.</p>
          <div className="reference-scope-options">
            <button className="reference-scope-option" onClick={() => onScope(false)} disabled={disabled}>
              <span className="scope-option-title">Passive only</span>
              <span className="scope-option-copy">Headers, public endpoints, crawl and other low-impact checks.</span>
            </button>
            <button className="reference-scope-option selected" onClick={() => onScope(true)} disabled={disabled}>
              <span className="scope-option-title">Include active checks</span>
              <span className="scope-option-copy">Controlled reflection and SQLi heuristics within the approved target.</span>
            </button>
          </div>
          <div className="reference-approval-note"><CheckCircle2 size={13} /> Every active check remains explicitly gated and evidence-backed.</div>
        </div>
      </section>
    );
  }

  return (
    <section className="reference-approval approval-card reference-plan-card">
      <div className="reference-approval-icon plan-icon"><CheckCircle2 size={21} /></div>
      <div className="reference-approval-body">
        <div className="reference-approval-kicker">
          <span>READY FOR APPROVAL</span>
          <strong>STEP 4 · CONFIRM</strong>
        </div>
        <h2>Review the scan plan before BugHunter starts.</h2>
        <ScanPlanCard plan={scanPlan} />
        <div className="reference-approval-actions">
          <button className="reference-primary-button" onClick={onApprove} disabled={disabled}>
            <CheckCircle2 size={16} /> Approve and run scan
          </button>
        </div>
      </div>
    </section>
  );
}
