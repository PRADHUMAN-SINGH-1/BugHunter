import { Check, Circle, Loader2 } from "lucide-react";

export function ScanTimeline({ timeline, visible }) {
  if (!visible) return null;
  return <section className="timeline panel"><div className="panel-heading"><div><p className="eyebrow">SCAN ACTIVITY</p><h2>Evidence timeline</h2></div></div><div className="timeline-steps">
    {timeline.map((step) => <div className={`timeline-step ${step.state}`} key={step.label}><div className="timeline-icon">{step.state === "complete" ? <Check size={14} /> : step.state === "active" ? <Loader2 size={14} /> : <Circle size={10} />}</div><span>{step.label}</span></div>)}
  </div></section>;
}
