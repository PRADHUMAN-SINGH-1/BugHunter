const { reportMarkdown } = require("../ai/toolDefinitions");

const DEMO_TARGET = "https://demo.bughunter.ai";

// This fixture represents output from BugHunter's deterministic scanner contract.
// It deliberately never makes a network request, so a Build Week demo is safe,
// fast, repeatable, and does not need an OpenAI key.
function createDemoAssessment() {
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

  return {
    status: "complete",
    demo: true,
    targetUrl: DEMO_TARGET,
    assistantMessage: "Demo assessment complete. I found two evidence-backed observations in the safe BugHunter sample application—one configuration gap to prioritize and one route to verify.",
    executiveSummary: "The safe demo completed with two evidence-backed observations. Prioritize the missing Content Security Policy, then verify that the administrative route is intentionally protected.",
    findings,
    report: { markdown: reportMarkdown(findings) },
    executedTools: ["validate_target", "run_header_scan", "run_endpoint_discovery", "normalize_findings", "generate_security_report"]
  };
}

module.exports = { DEMO_TARGET, createDemoAssessment };
