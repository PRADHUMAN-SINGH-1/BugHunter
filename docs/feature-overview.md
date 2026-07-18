# Feature overview

## AI-first workflow

| Feature | User value | Implementation |
| --- | --- | --- |
| Conversational request | Describe an outcome instead of selecting scanner modules | `AssistantChat`, `ChatInput`, assistant API |
| Authorization gates | Clear, safe assessment consent | Assistant orchestrator + `ApprovalCard` |
| Scan plan | Visible scope, request estimate, and non-destructive posture | `createScanPlan`, `ScanPlanCard` |
| Live timeline | Understand progress instead of waiting on a spinner | `useAssistant`, `ScanTimeline` |
| Evidence-backed result | Separate verified observations from unsupported claims | Tool results + evidence gate |
| Developer report | Move from discovery to remediation | Markdown contract + PDF/Markdown export |

## Scanner reuse

BugHunter AI preserves the original scanner capabilities:

- Reflection/XSS heuristics
- SQL injection heuristics
- IDOR checks
- Security-header analysis
- Sensitive-data detection
- Endpoint discovery
- Same-origin crawling
- Authentication comparison
- Rate limiting
- PDF reporting

The AI workflow promotes the most useful approved checks into a plan. The Advanced Scanners drawer retains direct access to focused legacy scanner APIs.

## Presentation polish

- Premium dark palette, glass surfaces, clear typography hierarchy, and responsive layout
- Motion for message arrival, scan state, timeline activity, hover/focus feedback, and results
- `prefers-reduced-motion` support
- Guidance-focused input, explicit error recovery, and evidence-safe empty states
- Fixture-backed demo mode for a dependable Build Week walkthrough
