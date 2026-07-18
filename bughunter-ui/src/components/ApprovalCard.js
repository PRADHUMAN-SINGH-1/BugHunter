import { CheckCircle2, ShieldAlert, ScanSearch } from "lucide-react";
import { ScanPlanCard } from "./ScanPlanCard";

export function ApprovalCard({ gate, scanPlan, onAuthorize, onScope, onApprove, disabled }) {
  if (!gate) return null;
  if (gate.kind === "authorization") return <section className="approval-card panel"><div className="approval-icon amber"><ShieldAlert /></div><div><p className="eyebrow">SCOPE CONFIRMATION</p><h2>Do you have permission to test this target?</h2><p>BugHunter AI only scans applications you own or are explicitly authorized to assess.</p><button className="primary-button" onClick={onAuthorize} disabled={disabled}><CheckCircle2 size={17} /> I have authorization</button></div></section>;
  if (gate.kind === "scope") return <section className="approval-card panel"><div className="approval-icon purple"><ScanSearch /></div><div><p className="eyebrow">CHOOSE SCAN MODE</p><h2>How deep should this assessment go?</h2><p>Passive checks observe public behavior. Active checks add controlled reflection and SQLi heuristics.</p><div className="choice-actions"><button className="secondary-button" onClick={() => onScope(false)} disabled={disabled}>Passive only</button><button className="primary-button" onClick={() => onScope(true)} disabled={disabled}>Include active checks</button></div></div></section>;
  return <section className="approval-card plan-approval panel"><div className="approval-icon cyan"><CheckCircle2 /></div><div className="approval-content"><p className="eyebrow">READY FOR APPROVAL</p><h2>Review the plan before BugHunter AI starts.</h2><ScanPlanCard plan={scanPlan} /><button className="primary-button approve-button" onClick={onApprove} disabled={disabled}><CheckCircle2 size={17} /> Approve and run scan</button></div></section>;
}
