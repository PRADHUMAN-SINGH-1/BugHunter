const cheerio = require("cheerio");
const { safeRequest, validateTarget } = require("../http/safeRequest");

const jsonLength = (value) => JSON.stringify(value ?? "").length;
const withQuery = (value, key, payload) => {
  const url = new URL(validateTarget(value));
  url.searchParams.set(key, payload);
  return url.toString();
};
const withPath = (value, path) => `${validateTarget(value).replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

async function scan(url) {
  const payloads = [
    "<script>alert(1)</script>",
    `\"><script>alert(1)</script>`,
    `'\"><img src=x onerror=alert(1)>`,
    `<svg/onload=alert(1)>`,
    `javascript:alert(1)`,
    `\" onmouseover=\"alert(1)`,
    `%3Cscript%3Ealert(1)%3C/script%3E`
  ];
  const target = validateTarget(url);
  const base = await safeRequest(target);
  const baseLength = jsonLength(base.data);
  const results = [];

  for (const payload of payloads) {
    const response = await safeRequest(withQuery(target, "q", payload));
    const body = JSON.stringify(response.data ?? "");
    const reflected = body.includes(payload) || body.includes(decodeURIComponent(payload)) || body.toLowerCase().includes("alert(1)");
    const diff = Math.abs(body.length - baseLength);
    let finding = "Safe";
    let severity = "LOW";

    if (reflected && diff > 20 && response.status === 200 && body.includes("<html")) {
      finding = "🚨 Strong XSS Indicator (Reflected + Response Change)";
      severity = "HIGH";
    } else if (reflected) {
      finding = "⚠️ Reflected Input (Check manually)";
      severity = "MEDIUM";
    } else if (diff > 50) {
      finding = "⚠️ Response Anomaly (Possible Injection)";
      severity = "MEDIUM";
    }

    results.push({ target, status: response.status, payload, finding, severity, evidence: { reflected, responseDelta: diff } });
  }
  return results;
}

async function idor(baseUrl) {
  const target = validateTarget(baseUrl);
  const results = [];
  const baseline = await safeRequest(`${target}1`);
  const baselineLength = jsonLength(baseline.data);

  for (let i = 1; i <= 10; i += 1) {
    const url = `${target}${i}`;
    const response = await safeRequest(url);
    const noAuth = await safeRequest(url, { headers: {} });
    const body = JSON.stringify(response.data ?? "");
    const noAuthBody = JSON.stringify(noAuth.data ?? "");
    const lengthDiff = Math.abs(body.length - baselineLength);
    const containsSensitive = /email|username|user|account|id/i.test(body);
    let finding = "Normal";
    let severity = "LOW";

    if (response.status === 200 && lengthDiff > 50 && containsSensitive) {
      finding = "🚨 Possible IDOR (Sensitive data exposed across IDs)";
      severity = "HIGH";
    } else if (response.status === 200 && lengthDiff > 30) {
      finding = "⚠️ Response differs (Check for IDOR manually)";
      severity = "MEDIUM";
    }
    if (body === noAuthBody && response.status === 200) {
      finding = "🚨 No Access Control (Potential IDOR)";
      severity = "HIGH";
    }
    results.push({ target: url, status: response.status, finding, severity, evidence: { responseDelta: lengthDiff, noAuthMatches: body === noAuthBody } });
  }
  return results;
}

function params(url) {
  const target = validateTarget(url);
  const parsed = new URL(target);
  const names = [...parsed.searchParams.keys()];
  if (names.length === 0 && !Number.isNaN(Number(parsed.pathname.split("/").pop()))) names.push("REST_ID_detected");
  return { target, status: "N/A", finding: names.length ? `Params: ${names.join(", ")}` : "No Params Found", severity: names.length ? "LOW" : "INFO", evidence: { parameters: names } };
}

async function headers(url) {
  const target = validateTarget(url);
  const response = await safeRequest(target);
  const h = response.headers;
  const issues = [];
  let score = 100;
  if (!h["x-frame-options"]) { issues.push("Missing X-Frame-Options"); score -= 15; }
  if (!h["content-security-policy"]) { issues.push("Missing CSP"); score -= 25; }
  else if (h["content-security-policy"].includes("unsafe-inline")) { issues.push("Weak CSP (unsafe-inline allowed)"); score -= 15; }
  if (!h["strict-transport-security"]) { issues.push("Missing HSTS"); score -= 20; }
  if (!h["x-content-type-options"]) { issues.push("Missing X-Content-Type-Options"); score -= 10; }
  else if (h["x-content-type-options"] !== "nosniff") { issues.push("X-Content-Type-Options not set to nosniff"); score -= 5; }
  if (!h["referrer-policy"]) { issues.push("Missing Referrer-Policy"); score -= 5; }
  if (!h["permissions-policy"]) { issues.push("Missing Permissions-Policy"); score -= 5; }
  const severity = score < 50 ? "HIGH" : score < 75 ? "MEDIUM" : "LOW";
  return { target, status: response.status, finding: issues.length ? `Score: ${score}/100 | Issues: ${issues.join(", ")}` : "All security headers properly configured", severity, evidence: { score, issues } };
}

async function sensitive(url) {
  const target = validateTarget(url);
  const response = await safeRequest(target);
  const text = JSON.stringify(response.data ?? "");
  const findings = [];
  if (/eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/.test(text)) findings.push({ type: "JWT Token", severity: "HIGH" });
  if (/AKIA[0-9A-Z]{16}/.test(text)) findings.push({ type: "AWS Access Key", severity: "HIGH" });
  if (/AIza[0-9A-Za-z\-_]{35}/.test(text)) findings.push({ type: "Google API Key", severity: "HIGH" });
  if (/-----BEGIN PRIVATE KEY-----/.test(text)) findings.push({ type: "Private Key Exposure", severity: "CRITICAL" });
  if (/Bearer\s[A-Za-z0-9\-_\.]+/.test(text)) findings.push({ type: "Bearer Token", severity: "HIGH" });
  if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text)) findings.push({ type: "Email Address", severity: "LOW" });
  const severityRank = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
  const top = findings.reduce((max, item) => severityRank[item.severity] > severityRank[max.severity] ? item : max, { severity: "LOW" });
  return { target, status: response.status, finding: findings.length ? findings.map((item) => item.type).join(", ") : "No Sensitive Data", severity: top.severity, evidence: { matches: findings.map((item) => item.type), redacted: true } };
}

async function endpoints(baseUrl) {
  const target = validateTarget(baseUrl);
  const paths = ["/admin", "/admin/login", "/dashboard", "/api", "/api/v1", "/user", "/users", "/auth", "/login", "/config", "/.env", "/backup", "/backup.zip", "/test", "/dev", "/staging", "/graphql", "/server-status"];
  const baseline = await safeRequest(target);
  const baseLength = jsonLength(baseline.data);
  const results = [];
  for (const path of paths) {
    const response = await safeRequest(withPath(target, path));
    const diff = Math.abs(jsonLength(response.data) - baseLength);
    let finding = "Not Found";
    let severity = "LOW";
    if (response.status === 200 && diff > 30) { finding = "🚨 Endpoint Found (Real Content)"; severity = "HIGH"; }
    else if (response.status === 403) { finding = "🔐 Forbidden (Exists)"; severity = "MEDIUM"; }
    else if (response.status === 401) { finding = "🔑 Auth Required"; severity = "MEDIUM"; }
    else if (response.status >= 500) { finding = "⚠️ Server Error (Interesting)"; severity = "MEDIUM"; }
    results.push({ target: path, status: response.status, finding, severity, evidence: { responseDelta: diff } });
  }
  return results;
}

async function crawl(url) {
  const target = validateTarget(url);
  const response = await safeRequest(target);
  const $ = cheerio.load(response.data || "");
  const origin = new URL(target).origin;
  const linksSet = new Set();
  const endpointsFound = [];
  $("a").each((_, element) => {
    const href = $(element).attr("href");
    if (!href) return;
    try {
      const absolute = new URL(href, target);
      if (absolute.origin !== origin) return;
      absolute.hash = "";
      const normalized = absolute.toString();
      linksSet.add(normalized);
      if (/api|admin|login|dashboard|\.json|\.php|\.env/i.test(normalized)) endpointsFound.push(normalized);
    } catch {}
  });
  const links = [...linksSet];
  let finding = links.length ? `Links: ${links.slice(0, 5).join(", ")}` : "No links found";
  let severity = links.length ? "INFO" : "LOW";
  if (endpointsFound.length) { finding += ` | 🚨 Interesting endpoints: ${endpointsFound.slice(0, 3).join(", ")}`; severity = "MEDIUM"; }
  return { target, status: response.status, finding, severity, evidence: { links, interestingEndpoints: endpointsFound } };
}

async function ratelimit(url) {
  const target = validateTarget(url);
  let blocked = false;
  const times = [];
  for (let i = 0; i < 10; i += 1) {
    const start = Date.now();
    const response = await safeRequest(target);
    times.push(Date.now() - start);
    if (response.status === 429) blocked = true;
  }
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const max = Math.max(...times);
  let finding = "🟢 No Rate Limit Observed";
  let severity = "LOW";
  if (blocked) { finding = "🛡️ Rate Limit Detected"; severity = "INFO"; }
  else if (max > avg * 2) { finding = "⚠️ Possible Throttling (Response delay spike)"; severity = "MEDIUM"; }
  return { target, status: "N/A", finding, severity, evidence: { requests: times.length, averageMs: avg, maxMs: max, blocked } };
}

async function auth(url) {
  const target = validateTarget(url);
  const noAuth = await safeRequest(target);
  const fakeAuth = await safeRequest(target, { headers: { Authorization: "Bearer fake_token" } });
  const malformedAuth = await safeRequest(target, { headers: { Authorization: "Bearer 123" } });
  const adminAuth = await safeRequest(target, { headers: { Authorization: "Bearer admin_token" } });
  const bodies = { noAuth: JSON.stringify(noAuth.data ?? ""), fake: JSON.stringify(fakeAuth.data ?? ""), malformed: JSON.stringify(malformedAuth.data ?? ""), admin: JSON.stringify(adminAuth.data ?? "") };
  const containsSensitive = (text) => /admin|dashboard|user|account|email/i.test(text);
  let finding = "Auth seems enforced";
  let severity = "LOW";
  if (bodies.noAuth.length > 0 && bodies.noAuth.length === bodies.fake.length) { finding = "🚨 No Authentication Required (Broken Access Control)"; severity = "HIGH"; }
  else if (containsSensitive(bodies.fake) || containsSensitive(bodies.admin)) { finding = "🚨 Privilege Access Possible with Fake Token"; severity = "HIGH"; }
  else if (bodies.noAuth.length !== bodies.fake.length || bodies.fake.length !== bodies.malformed.length) { finding = "⚠️ Auth Behavior Differs (Check manually)"; severity = "MEDIUM"; }
  return { target, status: noAuth.status, finding, severity, evidence: { comparedResponses: ["noAuth", "fake", "malformed", "admin"] } };
}

async function sqli(url) {
  const target = validateTarget(url);
  const payloads = [`' OR '1'='1`, `\" OR \"1\"=\"1`, `' OR 1=1--`, `' OR SLEEP(3)--`, `\" OR SLEEP(3)--`, `' WAITFOR DELAY '0:0:3'--`];
  const baselineStart = Date.now();
  const baseline = await safeRequest(target);
  const baselineTime = Date.now() - baselineStart;
  const baselineLength = jsonLength(baseline.data);
  const results = [];
  for (const payload of payloads) {
    const start = Date.now();
    const response = await safeRequest(withQuery(target, "id", payload));
    const duration = Date.now() - start;
    const body = JSON.stringify(response.data ?? "");
    const diff = Math.abs(body.length - baselineLength);
    let finding = "Safe";
    let severity = "LOW";
    if (/sql|syntax|mysql|postgres|query failed/i.test(body)) { finding = "🚨 SQL Error Detected (Possible Injection)"; severity = "HIGH"; }
    else if (duration > baselineTime + 2000) { finding = "⏱️ Time Delay Detected (Possible SQL Injection)"; severity = "HIGH"; }
    else if (diff > 100 && response.status === 200) { finding = "⚠️ Significant Response Change (Possible SQL Injection)"; severity = "MEDIUM"; }
    results.push({ target, status: response.status, payload, finding, severity, evidence: { responseDelta: diff, durationMs: duration, baselineMs: baselineTime } });
  }
  return results;
}

module.exports = { scan, idor, params, headers, sensitive, endpoints, crawl, ratelimit, auth, sqli };
