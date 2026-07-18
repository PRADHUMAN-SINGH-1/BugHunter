export function ConfidenceBadge({ confidence = 0 }) {
  const percentage = Math.round(Number(confidence) * 100);
  const tone = percentage >= 75 ? "strong" : percentage >= 50 ? "moderate" : "review";
  return <span className={`confidence-badge ${tone}`}>{percentage}% confidence</span>;
}
