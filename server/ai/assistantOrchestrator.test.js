const test = require("node:test");
const assert = require("node:assert/strict");
const { createScanPlan, handleAssistantMessage, keepEvidenceBackedFindings, runToolLoop } = require("./assistantOrchestrator");
const { functionTools, normalizeFindings, reportMarkdown } = require("./toolDefinitions");
const { finalAssessmentSchema } = require("./schemas");

function assertOpenAISchema(schema, path = "schema") {
  assert.ok(schema && typeof schema === "object", `${path} must be an object`);
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  assert.ok(types.length > 0 && types.every((type) => ["string", "number", "integer", "boolean", "object", "array", "null"].includes(type)), `${path} has an invalid type`);

  if (types.includes("object")) {
    assert.equal(schema.additionalProperties, false, `${path} objects must set additionalProperties=false`);
    assert.ok(Array.isArray(schema.required), `${path} objects must define required`);
    const propertyNames = Object.keys(schema.properties || {});
    assert.deepEqual([...schema.required].sort(), [...propertyNames].sort(), `${path} required must match properties`);
    propertyNames.forEach((name) => assertOpenAISchema(schema.properties[name], `${path}.properties.${name}`));
  }

  if (types.includes("array")) {
    assert.ok(schema.items && typeof schema.items === "object", `${path} arrays must define items`);
    assertOpenAISchema(schema.items, `${path}.items`);
  }

  if (schema.anyOf) schema.anyOf.forEach((variant, index) => assertOpenAISchema(variant, `${path}.anyOf[${index}]`));
}

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

test("all model tools and structured outputs use OpenAI-compatible strict schemas", () => {
  assert.ok(functionTools.length >= 10);
  functionTools.forEach((tool) => {
    assert.equal(tool.strict, true);
    assert.equal(tool.parameters.additionalProperties, false);
    assertOpenAISchema(tool.parameters, `tool:${tool.name}`);
  });
  assertOpenAISchema(finalAssessmentSchema, "finalAssessmentSchema");
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
