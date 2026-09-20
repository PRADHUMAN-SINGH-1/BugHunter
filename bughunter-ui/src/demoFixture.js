const demoTarget = "https://demo.bughunter.ai";

const findings = [
  {
    title: "Content Security Policy header is not configured",
    severity: "medium",
    confidence: 0.94,
    category: "security_headers",
    evidence: {
      sourceTools: ["run_header_scan"],
      summary: "The deterministic demo header scan found no Content-Security-Policy response header."
    },
    impact: "Without a Content Security Policy, a successful script-injection flaw has fewer browser-enforced containment controls.",
    remediation: "Define a restrictive Content-Security-Policy at the application or edge layer and refine it for the application's required origins.",
    manualVerification: true,
    owasp: "A05:2021 Security Misconfiguration",
    codeExample: "app.use(helmet.contentSecurityPolicy({ directives: { defaultSrc: [\"'self'\"] } }));"
  },
  {
    title: "Demo administrative route is discoverable",
    severity: "low",
    confidence: 0.81,
    category: "endpoint_discovery",
    evidence: {
      sourceTools: ["run_endpoint_discovery"],
      summary: "The deterministic demo endpoint discovery fixture returned /admin as a reachable route requiring review."
    },
    impact: "Reachable administrative routes increase attack surface if access controls, monitoring, or deployment exposure are misconfigured.",
    remediation: "Confirm the route is authenticated, authorized server-side, monitored, and not unintentionally exposed in production.",
    manualVerification: true,
    owasp: "A05:2021 Security Misconfiguration",
    codeExample: "app.use(\"/admin\", requireAdmin, adminRouter);"
  }
];

const report = [
  "# BugHunter AI Security Report",
  "",
  "## Executive Summary",
  "BugHunter AI recorded 2 evidence-backed finding(s), including 0 high or critical observation(s).",
  "",
  "## Technical Findings",
  "",
  "### 1. Content Security Policy header is not configured",
  "- Severity: medium",
  "- Confidence: 0.94",
  "- Evidence: The deterministic demo header scan found no Content-Security-Policy response header.",
  "- Recommendation: Define a restrictive Content-Security-Policy at the application or edge layer.",
  "",
  "### 2. Demo administrative route is discoverable",
  "- Severity: low",
  "- Confidence: 0.81",
  "- Evidence: The deterministic demo endpoint discovery fixture returned /admin as a reachable route requiring review.",
  "- Recommendation: Confirm the route is authenticated and authorized server-side."
].join("\n");

export function createLocalDemoAssessment() {
  return {
    status: "complete",
    demo: true,
    targetUrl: demoTarget,
    assistantMessage: "Demo assessment complete. I found two evidence-backed observations in the safe BugHunter sample application—one configuration gap to prioritize and one route to verify.",
    executiveSummary: "The safe demo completed with two evidence-backed observations. Prioritize the missing Content Security Policy, then verify that the administrative route is intentionally protected.",
    findings,
    report: { markdown: report },
    executedTools: ["validate_target", "run_header_scan", "run_endpoint_discovery", "normalize_findings", "generate_security_report"]
  };
}
