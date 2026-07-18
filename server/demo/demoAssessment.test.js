const test = require("node:test");
const assert = require("node:assert/strict");
const { DEMO_TARGET, createDemoAssessment } = require("./demoAssessment");

test("demo assessment is deterministic and evidence-backed", () => {
  const demo = createDemoAssessment();
  assert.equal(demo.status, "complete");
  assert.equal(demo.targetUrl, DEMO_TARGET);
  assert.equal(demo.findings.length, 2);
  assert.ok(demo.findings.every((finding) => finding.evidence.sourceTools.length));
  assert.match(demo.report.markdown, /Content Security Policy/);
});
