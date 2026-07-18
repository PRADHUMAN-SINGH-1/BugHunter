import { Activity, LockKeyhole, Radar } from "lucide-react";

export function ScanPlanCard({ plan }) {
  if (!plan) return null;
  return <div className="scan-plan-card">
    <div className="scan-plan-top"><div><p className="eyebrow">PROPOSED SCAN PLAN</p><h3>{plan.targetUrl}</h3></div><span className="request-count"><Activity size={15} /> {plan.estimatedRequests} requests</span></div>
    <div className="plan-checks">
      {plan.checks.map((check) => <div key={check.tool}><Radar size={15} /><span>{check.label}</span><small>{check.mode}</small></div>)}
    </div>
    <p className="non-destructive"><LockKeyhole size={14} /> No destructive testing. Every active check is controlled and authorization-gated.</p>
  </div>;
}
