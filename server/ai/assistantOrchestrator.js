const { getOpenAIClient, getModel } = require("./openaiClient");
const { generateFallbackText, hasFallbackKey } = require("./fallbackClient");
const { SECURITY_ASSISTANT_PROMPT } = require("./prompts");
const { finalAssessmentSchema } = require("./schemas");
const { functionTools, executeTool, normalizeFindings, reportMarkdown } = require("./toolDefinitions");
const { validateTarget } = require("../http/safeRequest");

const passiveTools = ["validate_target", "run_header_scan", "run_endpoint_discovery", "run_crawl", "run_sensitive_scan", "normalize_findings", "generate_security_report"];
const activeTools = ["run_reflection_scan", "run_sqli_scan", "run_idor_scan"];

function extractTarget(message = "") {
  const match = String(message).match(/https?:\/\/[^\s"'<>]+/i);
  return match?.[0];
}

function createScanPlan(targetUrl, activeTestingAllowed) {
  const checks = [
    { tool: "run_header_scan", label: "Inspect security headers", requests: 1, mode: "passive" },
    { tool: "run_endpoint_discovery", label: "Discover common application endpoints", requests: 19, mode: "passive" },
    { tool: "run_crawl", label: "Map same-origin links", requests: 1, mode: "passive" },
    { tool: "run_sensitive_scan", label: "Check for exposed sensitive-data patterns", requests: 1, mode: "passive" }
  ];

  if (activeTestingAllowed) {
    checks.push(
      { tool: "run_reflection_scan", label: "Analyze reflected input with controlled payloads", requests: 8, mode: "active" },
      { tool: "run_sqli_scan", label: "Run controlled SQL-injection heuristics", requests: 7, mode: "active" }
    );
  }

  return {
    targetUrl,
    checks,
    estimatedRequests: checks.reduce((total, check) => total + check.requests, 0),
    nonDestructive: true,
    activeTestingAllowed,
    // The allowlist mirrors the visible plan. The model cannot silently add an
    // unapproved active scanner, even when that scanner exists in the backend.
    toolNames: ["validate_target", ...checks.map((check) => check.tool), "normalize_findings", "generate_security_report"]
  };
}

function approvalMessage(plan) {
  const items = plan.checks.map((check) => `✓ ${check.label}`).join("\n");
  return `I will:\n${items}\n\nEstimated requests: ${plan.estimatedRequests}.\nNo destructive testing will be performed. Do you approve this scan plan?`;
}

function parseAssessment(response) {
  try {
    return JSON.parse(response.output_text);
  } catch {
    throw new Error("The AI response did not match the required structured assessment format.");
  }
}

// The model may phrase findings, but this gate keeps only findings traceable to
// a tool that actually ran in the current scan. This is the main anti-hallucination boundary.
function keepEvidenceBackedFindings(assessment, executedToolNames) {
  const findings = Array.isArray(assessment.findings) ? assessment.findings : [];
  return findings.filter((finding) => {
    const sources = finding?.evidence?.sourceTools || [];
    return sources.length > 0 && sources.every((source) => executedToolNames.includes(source));
  });
}

async function runGeminiFallback({ message, plan }) {
  const rawResults = [];
  const approvedScannerTools = plan.checks.map((check) => check.tool);

  const validation = await executeTool("validate_target", { url: plan.targetUrl }, plan.toolNames);
  rawResults.push({ tool: "validate_target", result: validation });

  for (const toolName of approvedScannerTools) {
    const args = toolName === "run_endpoint_discovery" || toolName === "run_idor_scan"
      ? { baseUrl: plan.targetUrl }
      : { url: plan.targetUrl };

    const result = await executeTool(toolName, args, plan.toolNames);
    rawResults.push({ tool: toolName, result });
  }

  const normalizedFindings = [];
  for (const entry of rawResults) {
    if (!entry.tool.startsWith("run_")) continue;
    const values = Array.isArray(entry.result) ? entry.result : [entry.result];
    for (const value of values) {
      normalizedFindings.push(...normalizeFindings(value, entry.tool));
    }
  }

  let executiveSummary = normalizedFindings.length
    ? `The approved assessment completed with ${normalizedFindings.length} evidence-backed observation(s). Review heuristic results manually before remediation.`
    : "The approved assessment completed without evidence-backed findings.";

  if (hasFallbackKey()) {
    try {
      const compactFindings = normalizedFindings.slice(0, 40).map((finding) => ({
        title: finding.title,
        severity: finding.severity,
        category: finding.category,
        evidence: finding.evidence.summary
      }));

      const result = await generateFallbackText([
        "You are BugHunter's security-report summarizer.",
        "Do not invent vulnerabilities or modify the supplied findings.",
        "Return JSON with exactly one property: executiveSummary.",
        "Keep it concise and factual. State that the observations are evidence-backed and heuristic findings should be manually verified.",
        JSON.stringify({ targetUrl: plan.targetUrl, userRequest: message, findings: compactFindings })
      ].join("\n"));

      const parsed = JSON.parse(result);
      if (typeof parsed.executiveSummary === "string" && parsed.executiveSummary.trim()) {
        executiveSummary = parsed.executiveSummary.trim();
      }
    } catch (_geminiError) {
      // Deterministic summary remains available when the fallback model fails.
    }
  }

  return {
    executiveSummary,
    findings: normalizedFindings,
    report: { markdown: reportMarkdown(normalizedFindings) },
    toolResults: rawResults
  };
}

async function runToolLoop({ message, plan, client: suppliedClient }) {
  const client = suppliedClient || (process.env.OPENAI_API_KEY ? getOpenAIClient() : null);

  if (!client) {
    if (!hasFallbackKey()) {
      throw new Error("Configure an AI provider key on the server before starting an approved assessment.");
    }
    try {
      return await runGeminiFallback({ message, plan });
    } catch (_fallbackProviderError) {
      throw new Error("The AI service is temporarily unavailable. Check the configured fallback AI key and try again.");
    }
  }

  try {
    const allowedTools = plan.toolNames;
    const tools = functionTools.filter((tool) => allowedTools.includes(tool.name));
    const toolResults = [];
    let response = await client.responses.create({
      model: getModel(),
      instructions: SECURITY_ASSISTANT_PROMPT,
      input: `User request: ${message}\nAuthorized target: ${plan.targetUrl}\nApproved plan: ${JSON.stringify(plan.checks)}\nUse tools to collect evidence before producing findings.`,
      tools,
      tool_choice: "auto",
      parallel_tool_calls: false,
      text: { format: { type: "json_schema", name: "bughunter_security_assessment", strict: true, schema: finalAssessmentSchema } }
    });

    for (let round = 0; round < 12; round += 1) {
      const calls = (response.output || []).filter((item) => item.type === "function_call");
      if (!calls.length) {
        const assessment = parseAssessment(response);
        const executedToolNames = toolResults.map((result) => result.name);
        const findings = keepEvidenceBackedFindings(assessment, executedToolNames);
        return {
          executiveSummary: assessment.executiveSummary,
          findings,
          report: { markdown: reportMarkdown(findings) },
          toolResults
        };
      }

      const outputs = [];
      for (const call of calls) {
        const args = JSON.parse(call.arguments || "{}");
        const result = await executeTool(call.name, args, allowedTools);
        toolResults.push({ name: call.name, result });
        outputs.push({ type: "function_call_output", call_id: call.call_id, output: JSON.stringify(result) });
      }

      response = await client.responses.create({
        model: getModel(),
        previous_response_id: response.id,
        input: outputs,
        tools,
        tool_choice: "auto",
        parallel_tool_calls: false,
        text: { format: { type: "json_schema", name: "bughunter_security_assessment", strict: true, schema: finalAssessmentSchema } }
      });
    }

    throw new Error("The assistant exceeded the maximum tool-call rounds.");
  } catch (_primaryProviderError) {
    if (!suppliedClient && hasFallbackKey()) {
      try {
        return await runGeminiFallback({ message, plan });
      } catch (_fallbackProviderError) {
        throw new Error("The AI service is temporarily unavailable. Check the configured fallback AI key and try again.");
      }
    }
    throw new Error("The AI service is temporarily unavailable. Configure a server-side fallback AI key and try again.");
  }
}

async function handleAssistantMessage(input) {
  const message = String(input?.message || "").trim();
  if (!message) return { status: "needs_input", assistantMessage: "Tell me what you want to analyze and include the target URL." };

  const candidateTarget = input?.targetUrl || extractTarget(message);
  if (!candidateTarget) {
    return { status: "needs_input", assistantMessage: "What authorized staging or test URL should I analyze? Please provide a full HTTP(S) URL." };
  }

  let targetUrl;
  try {
    targetUrl = validateTarget(candidateTarget);
  } catch (error) {
    return { status: "error", assistantMessage: error.message };
  }

  if (input?.authorizationConfirmed !== true) {
    return { status: "needs_input", targetUrl, assistantMessage: "Before I plan a scan, confirm that you own this target or have explicit authorization to test it." };
  }

  if (typeof input?.activeTestingAllowed !== "boolean") {
    return { status: "needs_input", targetUrl, assistantMessage: "Do you allow authorized active checks (controlled reflection and SQLi heuristics), or should I run passive checks only?", requiredInput: "activeTestingAllowed" };
  }

  const plan = createScanPlan(targetUrl, input.activeTestingAllowed);
  if (input?.approvalConfirmed !== true) {
    return { status: "awaiting_approval", targetUrl, scanPlan: plan, assistantMessage: approvalMessage(plan) };
  }

  try {
    const assessment = await runToolLoop({ message, plan });
    return {
      status: "complete",
      targetUrl,
      scanPlan: plan,
      assistantMessage: assessment.executiveSummary,
      executiveSummary: assessment.executiveSummary,
      findings: assessment.findings,
      report: assessment.report,
      executedTools: assessment.toolResults.map((result) => result.name)
    };
  } catch (error) {
    return { status: "error", targetUrl, scanPlan: plan, assistantMessage: error.message };
  }
}

module.exports = { createScanPlan, handleAssistantMessage, keepEvidenceBackedFindings, runToolLoop };
