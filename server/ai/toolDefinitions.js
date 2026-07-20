const scanners = require("../scanners/scanEngine");
const { validateTarget } = require("../http/safeRequest");

const urlParameters = {
  type: "object",
  additionalProperties: false,
  required: ["url"],
  properties: { url: { type: "string", description: "Authorized HTTP or HTTPS target URL." } }
};

const baseUrlParameters = {
  type: "object",
  additionalProperties: false,
  required: ["baseUrl"],
  properties: { baseUrl: { type: "string", description: "Authorized base URL or object-ID URL prefix." } }
};

const rawFindingSchema = {
  type: "object",
  additionalProperties: false,
  required: ["finding", "severity"],
  properties: {
    finding: { type: "string" },
    severity: { type: "string" }
  }
};

const evidenceSchema = {
  type: "object",
  additionalProperties: false,
  required: ["sourceTools", "summary"],
  properties: {
    sourceTools: { type: "array", items: { type: "string" } },
    summary: { type: "string" }
  }
};

const normalizedFindingSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "severity", "confidence", "category", "evidence", "impact", "remediation", "manualVerification", "owasp", "codeExample"],
  properties: {
    title: { type: "string" },
    severity: { type: "string" },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    category: { type: "string" },
    evidence: evidenceSchema,
    impact: { type: "string" },
    remediation: { type: "string" },
    manualVerification: { type: "boolean" },
    owasp: { type: ["string", "null"] },
    codeExample: { type: ["string", "null"] }
  }
};

const rawFindingsParameters = {
  type: "object",
  additionalProperties: false,
  required: ["findings"],
  properties: { findings: { type: "array", items: rawFindingSchema } }
};

const normalizedFindingsParameters = {
  type: "object",
  additionalProperties: false,
  required: ["findings"],
  properties: { findings: { type: "array", items: normalizedFindingSchema } }
};

const functionTools = [
  { type: "function", name: "validate_target", description: "Validate that an authorized target uses HTTP(S) and meets BugHunter request policy.", strict: true, parameters: urlParameters },
  { type: "function", name: "run_header_scan", description: "Passively inspect HTTP security headers.", strict: true, parameters: urlParameters },
  { type: "function", name: "run_endpoint_discovery", description: "Discover a limited set of common application endpoints.", strict: true, parameters: baseUrlParameters },
  { type: "function", name: "run_crawl", description: "Passively crawl same-origin links from one page.", strict: true, parameters: urlParameters },
  { type: "function", name: "run_sensitive_scan", description: "Check a response for sensitive-data patterns. Never return raw secret values.", strict: true, parameters: urlParameters },
  { type: "function", name: "run_reflection_scan", description: "Run authorized reflected-input checks using controlled payloads.", strict: true, parameters: urlParameters },
  { type: "function", name: "run_sqli_scan", description: "Run authorized SQL-injection heuristics using controlled payloads.", strict: true, parameters: urlParameters },
  { type: "function", name: "run_idor_scan", description: "Run authorized sequential object-ID checks against a supplied URL prefix.", strict: true, parameters: baseUrlParameters },
  { type: "function", name: "normalize_findings", description: "Normalize raw scanner output into BugHunter finding records.", strict: true, parameters: rawFindingsParameters },
  { type: "function", name: "generate_security_report", description: "Generate a Markdown report from normalized findings only.", strict: true, parameters: normalizedFindingsParameters }
];

const toolNameToScanner = {
  run_header_scan: (args) => scanners.headers(args.url),
  run_endpoint_discovery: (args) => scanners.endpoints(args.baseUrl),
  run_crawl: (args) => scanners.crawl(args.url),
  run_sensitive_scan: (args) => scanners.sensitive(args.url),
  run_reflection_scan: (args) => scanners.scan(args.url),
  run_sqli_scan: (args) => scanners.sqli(args.url),
  run_idor_scan: (args) => scanners.idor(args.baseUrl)
};

const metadataByTool = {
  run_header_scan: { category: "security_headers", owasp: "A05:2021 Security Misconfiguration", impact: "Missing browser and transport protections can increase exposure to common web attacks.", remediation: "Configure the missing headers at the application or edge layer.", codeExample: "app.use(helmet());" },
  run_endpoint_discovery: { category: "endpoint_discovery", owasp: "A05:2021 Security Misconfiguration", impact: "Unexpected reachable endpoints can expand the application's attack surface.", remediation: "Review whether the endpoint is intended, protected, and excluded from production when appropriate.", codeExample: null },
  run_crawl: { category: "attack_surface", owasp: "A05:2021 Security Misconfiguration", impact: "Discovered routes provide context for security review and access-control testing.", remediation: "Review discovered routes and protect administrative or sensitive paths.", codeExample: null },
  run_sensitive_scan: { category: "sensitive_data_exposure", owasp: "A02:2021 Cryptographic Failures", impact: "Exposed secrets or personal data may enable account compromise or unauthorized access.", remediation: "Remove exposed values, rotate affected credentials, and keep secrets server-side.", codeExample: "// Read secrets from server-side environment variables only\nconst apiKey = process.env.API_KEY;" },
  run_reflection_scan: { category: "xss", owasp: "A03:2021 Injection", impact: "Unescaped reflected input can create client-side injection risk.", remediation: "Apply context-aware output encoding and avoid dangerous HTML sinks for untrusted input.", codeExample: "element.textContent = untrustedValue; // never assign untrusted input to innerHTML" },
  run_sqli_scan: { category: "sqli", owasp: "A03:2021 Injection", impact: "SQL injection can expose or alter application data.", remediation: "Use parameterized queries and avoid string-built SQL.", codeExample: "db.query('SELECT * FROM users WHERE id = $1', [userId]);" },
  run_idor_scan: { category: "broken_access_control", owasp: "A01:2021 Broken Access Control", impact: "Weak object authorization can expose another user's data or actions.", remediation: "Authorize every object access against the authenticated user on the server.", codeExample: "if (resource.ownerId !== req.user.id) return res.sendStatus(403);" }
};

const normalizedSeverity = (severity) => String(severity || "LOW").toLowerCase();
const confidenceFor = (finding) => {
  if (/strong|error detected|no access control/i.test(finding)) return 0.82;
  if (/possible|differs|anomaly|interesting/i.test(finding)) return 0.58;
  return 0.35;
};

function asList(value) {
  return Array.isArray(value) ? value : [value];
}

function normalizeFindings(findings, sourceTool = "normalize_findings") {
  return asList(findings).filter(Boolean).map((finding) => {
    const metadata = metadataByTool[sourceTool] || { category: "security_observation", owasp: null, impact: "This observation requires developer review.", remediation: "Review the evidence and verify the behavior manually.", codeExample: null };
    return {
      title: finding.finding || "Security observation",
      severity: normalizedSeverity(finding.severity),
      confidence: confidenceFor(finding.finding || ""),
      category: metadata.category,
      evidence: { sourceTools: [sourceTool], summary: finding.finding || "Scanner returned an observation." },
      impact: metadata.impact,
      remediation: metadata.remediation,
      manualVerification: true,
      owasp: metadata.owasp,
      codeExample: metadata.codeExample
    };
  });
}

function reportMarkdown(findings) {
  const normalized = Array.isArray(findings) ? findings : [];
  const highRisk = normalized.filter((finding) => ["critical", "high"].includes(finding.severity)).length;
  const lines = [
    "# BugHunter AI Security Report",
    "",
    "## Executive Summary",
    `BugHunter AI recorded ${normalized.length} evidence-backed finding(s), including ${highRisk} high or critical observation(s).`,
    "",
    "## Technical Findings"
  ];
  normalized.forEach((finding, index) => {
    lines.push("", `### ${index + 1}. ${finding.title}`, `- Severity: ${finding.severity}`, `- Confidence: ${finding.confidence}`, `- OWASP: ${finding.owasp || "Not mapped"}`, `- Evidence: ${finding.evidence?.summary || "No evidence summary supplied."}`, `- Impact: ${finding.impact}`, `- Recommendation: ${finding.remediation}`);
    if (finding.codeExample) lines.push("", "```js", finding.codeExample, "```");
  });
  lines.push("", "## Recommendations", "Prioritize high-confidence findings, verify all heuristic results manually, and remediate only after confirming the affected context.");
  return lines.join("\n");
}

async function executeTool(name, args, allowedTools = []) {
  if (allowedTools.length && !allowedTools.includes(name)) {
    throw new Error(`Tool ${name} was not approved for this scan plan.`);
  }

  if (name === "validate_target") return { target: validateTarget(args.url) };
  if (name === "normalize_findings") return normalizeFindings(args.findings);
  if (name === "generate_security_report") return { markdown: reportMarkdown(args.findings) };
  if (!toolNameToScanner[name]) throw new Error(`Unknown tool: ${name}`);
  return toolNameToScanner[name](args);
}

module.exports = { functionTools, executeTool, normalizeFindings, reportMarkdown };
