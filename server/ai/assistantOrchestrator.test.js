const test = require("node:test");
const assert = require("node:assert/strict");
const { createScanPlan, handleAssistantMessage, keepEvidenceBackedFindings, runToolLoop } = require("./assistantOrchestrator");
const { functionTools, normalizeFindings, reportMarkdown } = require("./toolDefinitions");

test("assistant requests a target before it can plan a scan", async () => {
  const result = await handleAssistantMessage({ message: "Analyze my staging application" });
  assert.equal(result.status, "needs_input");
  assert.match(result.assistantMessage, /URL/i);
});

test("assistant requires explicit authorization before planning", async () => {
  const result = await handleAssistantMessage({ message: "Analyze https://example.com" });
  assert.equal(result.status, "needs_input");
  assert.match(result.assistantMessage, /authorization/i);
});

test("assistant asks whether active checks are allowed", async () => {
  const result = await handleAssistantMessage({ message: "Analyze https://example.com", authorizationConfirmed: true });
  assert.equal(result.status, "needs_input");
  assert.equal(result.requiredInput, "activeTestingAllowed");
});

test("assistant returns an approval-gated passive plan", async () => {
  const result = await handleAssistantMessage({
    message: "Analyze https://example.com",
    authorizationConfirmed: true,
    activeTestingAllowed: false
  });
  assert.equal(result.status, "awaiting_approval");
  assert.equal(result.scanPlan.nonDestructive, true);
  assert.equal(result.scanPlan.activeTestingAllowed, false);
  assert.ok(result.scanPlan.estimatedRequests > 0);
});

test("active plans expose only checks shown in the plan", () => {
  const plan = createScanPlan("https://example.com", true);
  assert.ok(plan.toolNames.includes("run_reflection_scan"));
  assert.ok(plan.toolNames.includes("run_sqli_scan"));
  assert.equal(plan.toolNames.includes("run_idor_scan"), false);
});

test("assessment gate removes findings without executed evidence", () => {
  const findings = keepEvidenceBackedFindings({
    findings: [
      { evidence: { sourceTools: ["run_header_scan"] } },
      { evidence: { sourceTools: ["run_sqli_scan"] } },
      { evidence: { sourceTools: [] } }
    ]
  }, ["run_header_scan"]);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].evidence.sourceTools[0], "run_header_scan");
});

test("all model tools use strict schemas", () => {
  assert.ok(functionTools.length >= 10);
  functionTools.forEach((tool) => {
    assert.equal(tool.strict, true);
    assert.equal(tool.parameters.additionalProperties, false);
  });
});

test("normalizer and report builder retain a structured evidence trail", () => {
  const findings = normalizeFindings({ finding: "Missing CSP", severity: "HIGH" }, "run_header_scan");
  assert.equal(findings[0].evidence.sourceTools[0], "run_header_scan");
  assert.equal(findings[0].category, "security_headers");
  assert.match(reportMarkdown(findings), /Technical Findings/);
});

test("tool loop returns only an evidence-backed assessment", async () => {
  const replies = [
    {
      id: "response-1",
      output: [{ type: "function_call", name: "validate_target", call_id: "call-1", arguments: JSON.stringify({ url: "https://example.com" }) }]
    },
    {
      id: "response-2",
      output: [],
      output_text: JSON.stringify({ executiveSummary: "Validated the approved target.", findings: [] })
    }
  ];
  const calls = [];
  const client = { responses: { create: async (request) => { calls.push(request); return replies.shift(); } } };
  const assessment = await runToolLoop({
    message: "Analyze https://example.com",
    plan: { targetUrl: "https://example.com/", checks: [], toolNames: ["validate_target", "normalize_findings", "generate_security_report"] },
    client
  });
  assert.equal(assessment.findings.length, 0);
  assert.equal(assessment.toolResults[0].name, "validate_target");
  assert.equal(calls.length, 2);
  assert.equal(calls[1].input[0].type, "function_call_output");
});
