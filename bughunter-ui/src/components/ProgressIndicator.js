export function ProgressIndicator({ isWorking }) {
  if (!isWorking) return null;
  return <div className="progress-indicator"><span className="pulse-dot" /> BugHunter AI is working with your approved scope</div>;
}
