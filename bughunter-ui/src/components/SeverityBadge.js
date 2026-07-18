const labels = { critical: "Critical", high: "High", medium: "Medium", low: "Low", info: "Info" };

export function SeverityBadge({ severity = "info" }) {
  const value = String(severity).toLowerCase();
  return <span className={`severity-badge ${value}`}>{labels[value] || value}</span>;
}
