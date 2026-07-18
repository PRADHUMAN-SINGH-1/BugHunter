const test = require("node:test");
const assert = require("node:assert/strict");
const scanners = require("./scanEngine");
const { validateTarget } = require("../http/safeRequest");

test("exports the complete legacy scanner surface", () => {
  assert.deepEqual(Object.keys(scanners).sort(), [
    "auth",
    "crawl",
    "endpoints",
    "headers",
    "idor",
    "params",
    "ratelimit",
    "scan",
    "sensitive",
    "sqli"
  ]);
});

test("normalizes valid HTTP targets", () => {
  assert.equal(validateTarget("https://example.com"), "https://example.com/");
});

test("rejects unsupported protocols", () => {
  assert.throws(() => validateTarget("file:///etc/passwd"), /HTTP and HTTPS/);
});

test("rejects private targets unless explicitly enabled", () => {
  assert.throws(() => validateTarget("http://127.0.0.1:3000"), /Private-network targets/);
});

test("parameter analysis returns structured evidence", () => {
  const result = scanners.params("https://example.com/items/42?user=7");
  assert.equal(result.severity, "LOW");
  assert.deepEqual(result.evidence.parameters, ["user"]);
});
