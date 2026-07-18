import { Fingerprint } from "lucide-react";

export function EvidencePanel({ evidence }) {
  return <div className="finding-section evidence-panel"><div className="section-label"><Fingerprint size={15} /> Evidence</div><p>{evidence?.summary || "No evidence summary was supplied."}</p><div className="tool-chips">{(evidence?.sourceTools || []).map((tool) => <span key={tool}>{tool.replaceAll("_", " ")}</span>)}</div></div>;
}
