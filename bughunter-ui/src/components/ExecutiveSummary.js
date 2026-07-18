import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";

export function ExecutiveSummary({ summary, findings, executedTools }) {
  if (!summary) return null;
  const highRisk = findings.filter((finding) => ["high", "critical"].includes(String(finding.severity).toLowerCase())).length;
  return <section className="summary-section panel"><div className="summary-main"><div className="summary-icon"><ShieldCheck /></div><div><p className="eyebrow">EXECUTIVE SUMMARY</p><h2>{summary}</h2><p>Based on {executedTools.length} deterministic scanner tool{executedTools.length === 1 ? "" : "s"}. Findings without tool evidence are excluded.</p></div></div><div className="summary-stats"><div><AlertTriangle size={17} /><strong>{highRisk}</strong><span>High risk</span></div><div><CheckCircle2 size={17} /><strong>{findings.length}</strong><span>Evidence-backed</span></div></div></section>;
}
