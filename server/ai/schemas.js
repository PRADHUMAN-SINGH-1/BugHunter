const severityValues = ["critical", "high", "medium", "low", "info"];

// This schema is deliberately narrow. The model can explain scanner evidence, but it
// cannot add arbitrary fields that might look like unverified security evidence.
const finalAssessmentSchema = {
  type: "object",
  additionalProperties: false,
  required: ["executiveSummary", "findings"],
  properties: {
    executiveSummary: { type: "string" },
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "title",
          "severity",
          "confidence",
          "category",
          "evidence",
          "impact",
          "remediation",
          "manualVerification",
          "owasp",
          "codeExample"
        ],
        properties: {
          title: { type: "string" },
          severity: { type: "string", enum: severityValues },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          category: { type: "string" },
          evidence: {
            type: "object",
            additionalProperties: false,
            required: ["sourceTools", "summary"],
            properties: {
              sourceTools: { type: "array", items: { type: "string" } },
              summary: { type: "string" }
            }
          },
          impact: { type: "string" },
          remediation: { type: "string" },
          manualVerification: { type: "boolean" },
          owasp: { type: ["string", "null"] },
          codeExample: { type: ["string", "null"] }
        }
      }
    }
  }
};

module.exports = { finalAssessmentSchema, severityValues };
