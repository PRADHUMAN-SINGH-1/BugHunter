import { Code2, Wrench } from "lucide-react";

export function RecommendationPanel({ remediation, codeExample }) {
  return <div className="finding-section recommendation-panel"><div className="section-label"><Wrench size={15} /> Recommended fix</div><p>{remediation}</p>{codeExample && <pre><Code2 size={14} />{codeExample}</pre>}</div>;
}
