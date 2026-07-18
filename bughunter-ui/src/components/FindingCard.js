import { ChevronDown, CircleCheck, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { EvidencePanel } from "./EvidencePanel";
import { RecommendationPanel } from "./RecommendationPanel";
import { SeverityBadge } from "./SeverityBadge";

export function FindingCard({ finding, index }) {
  const [open, setOpen] = useState(index === 0);
  return <article className={`finding-card ${String(finding.severity).toLowerCase()}`}>
    <button className="finding-top" onClick={() => setOpen(!open)} aria-expanded={open}>
      <div className="finding-title"><div className="finding-number">{String(index + 1).padStart(2, "0")}</div><div><h3>{finding.title}</h3><p>{finding.category?.replaceAll("_", " ")}</p></div></div>
      <div className="finding-meta"><SeverityBadge severity={finding.severity} /><ConfidenceBadge confidence={finding.confidence} /><ChevronDown className={open ? "open" : ""} size={18} /></div>
    </button>
    {open && <div className="finding-detail">
      <EvidencePanel evidence={finding.evidence} />
      <div className="finding-section"><div className="section-label"><ShieldAlert size={15} /> Business impact</div><p>{finding.impact}</p></div>
      <div className="finding-details-grid"><div className="detail-item"><span>OWASP</span><strong>{finding.owasp || "Not mapped"}</strong></div><div className="detail-item"><span>Verification</span><strong>{finding.manualVerification ? "Manual verification required" : "Evidence confirmed"}</strong></div></div>
      <RecommendationPanel remediation={finding.remediation} codeExample={finding.codeExample} />
      <div className="manual-note"><CircleCheck size={15} /> Scanner evidence is preserved. Verify the finding in context before remediation.</div>
    </div>}
  </article>;
}
