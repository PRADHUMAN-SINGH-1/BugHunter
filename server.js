const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.send("🚀 BugHunter API is running");
});

const PORT = process.env.PORT || 5001;

// helper
const safeRequest = async (url, options = {}) => {
  try {
    const res = await axios.get(url, options);
    return { status: res.status, data: res.data, headers: res.headers };
  } catch (err) {
    return { status: err.response?.status || 500, data: "", headers: {} };
  }
};


// ================= SCAN (UPGRADED) =================
app.post("/scan", async (req, res) => {
    const { url } = req.body;
  
    const payloads = [
      "<script>alert(1)</script>",
      `"><script>alert(1)</script>`,
      `'"><img src=x onerror=alert(1)>`,
      `<svg/onload=alert(1)>`,
      `javascript:alert(1)`,
      `" onmouseover="alert(1)`,
      `%3Cscript%3Ealert(1)%3C/script%3E` // encoded
    ];
  
    const results = [];
  
    // 🔹 Baseline response (VERY IMPORTANT)
    const base = await safeRequest(url);
    const baseLength = JSON.stringify(base.data).length;
  
    for (let p of payloads) {
      const testUrl = url + "?q=" + encodeURIComponent(p);
      const r = await safeRequest(testUrl);
  
      const body = JSON.stringify(r.data);
  
      // 🔥 Reflection checks
      const reflected =
        body.includes(p) ||
        body.includes(decodeURIComponent(p)) ||
        body.toLowerCase().includes("alert(1)");
  
      // 🔥 Response diffing
      const diff = Math.abs(body.length - baseLength);
  
      let finding = "Safe";
      let severity = "LOW";
  
      if (reflected &&
        diff > 20 &&
        r.status === 200 &&
        body.includes("<html")) {
        finding = "🚨 Strong XSS Indicator (Reflected + Response Change)";
        severity = "HIGH";
      } else if (reflected) {
        finding = "⚠️ Reflected Input (Check manually)";
        severity = "MEDIUM";
      } else if (diff > 50) {
        finding = "⚠️ Response Anomaly (Possible Injection)";
        severity = "MEDIUM";
      }
      
  
      results.push({
        target: url,
        status: r.status,
        payload: p,
        finding,
        severity
      });
    }
  
    res.json(results);
  });

// ================= IDOR (UPGRADED) =================
app.post("/idor", async (req, res) => {
    const { baseUrl } = req.body;
  
    const results = [];
  
    let baselineRes = await safeRequest(baseUrl + "1");
    const baselineBody = JSON.stringify(baselineRes.data);
    const baselineLength = baselineBody.length;
  
    for (let i = 1; i <= 10; i++) {
      const url = baseUrl + i;
  
      const r = await safeRequest(url);
  
      // 🔐 Simulate unauthorized request
      const noAuth = await safeRequest(url, {
        headers: {}
      });
  
      const body = JSON.stringify(r.data);
      const noAuthBody = JSON.stringify(noAuth.data);
  
      const lengthDiff = Math.abs(body.length - baselineLength);
  
      // 🔍 Pattern detection
      const containsSensitive =
        /email|username|user|account|id/i.test(body);
  
      const statusOk = r.status === 200;
  
      let finding = "Normal";
      let severity = "LOW";
  
      // 🚨 Strong IDOR signal
      if (statusOk && lengthDiff > 50 && containsSensitive) {
        finding = "🚨 Possible IDOR (Sensitive data exposed across IDs)";
        severity = "HIGH";
      }
  
      // ⚠️ Weak signal
      else if (statusOk && lengthDiff > 30) {
        finding = "⚠️ Response differs (Check for IDOR manually)";
        severity = "MEDIUM";
      }
  
      // 🔐 No auth protection
      if (body === noAuthBody && statusOk) {
        finding = "🚨 No Access Control (Potential IDOR)";
        severity = "HIGH";
      }
  
      results.push({
        target: url,
        status: r.status,
        finding,
        severity
      });
    }
  
    res.json(results);
  });

// ================= PARAMS =================
app.post("/params", async (req, res) => {
    const { url } = req.body;
  
    const urlObj = new URL(url);
    const params = [];
  
    urlObj.searchParams.forEach((v, k) => {
      params.push(k);
    });
  
    if (params.length === 0) {
      const parts = url.split("/");
      const last = parts[parts.length - 1];
      if (!isNaN(last)) {
        params.push("REST_ID_detected");
      }
    }
  
    res.json({
      target: url,
      status: "N/A",
      finding: params.length
        ? "Params: " + params.join(", ")
        : "No Params Found",
      severity: params.length ? "LOW" : "INFO"
    });
  });

// ================= HEADERS (UPGRADED) =================
app.post("/headers", async (req, res) => {
  const { url } = req.body;

  const r = await safeRequest(url);
  const h = r.headers;

  const issues = [];
  let score = 100;

  // 🔒 X-Frame-Options
  if (!h["x-frame-options"]) {
    issues.push("Missing X-Frame-Options");
    score -= 15;
  }

  // 🔒 CSP
  if (!h["content-security-policy"]) {
    issues.push("Missing CSP");
    score -= 25;
  } else if (h["content-security-policy"].includes("unsafe-inline")) {
    issues.push("Weak CSP (unsafe-inline allowed)");
    score -= 15;
  }

  // 🔒 HSTS
  if (!h["strict-transport-security"]) {
    issues.push("Missing HSTS");
    score -= 20;
  }

  // 🔒 X-Content-Type-Options
  if (!h["x-content-type-options"]) {
    issues.push("Missing X-Content-Type-Options");
    score -= 10;
  } else if (h["x-content-type-options"] !== "nosniff") {
    issues.push("X-Content-Type-Options not set to nosniff");
    score -= 5;
  }

  // 🔒 Referrer Policy
  if (!h["referrer-policy"]) {
    issues.push("Missing Referrer-Policy");
    score -= 5;
  }

  // 🔒 Permissions Policy
  if (!h["permissions-policy"]) {
    issues.push("Missing Permissions-Policy");
    score -= 5;
  }

  // 📊 Severity logic
  let severity = "LOW";

  if (score < 50) severity = "HIGH";
  else if (score < 75) severity = "MEDIUM";

  res.json({
    target: url,
    status: r.status,
    finding:
      issues.length > 0
        ? `Score: ${score}/100 | Issues: ${issues.join(", ")}`
        : "All security headers properly configured",
    severity
  });
});
// ================= SENSITIVE (UPGRADED) =================
app.post("/sensitive", async (req, res) => {
    const { url } = req.body;
  
    const r = await safeRequest(url);
    const text = JSON.stringify(r.data);
  
    const findings = [];
  
    // 🔥 JWT Token
    if (/eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/.test(text)) {
      findings.push({
        type: "JWT Token",
        severity: "HIGH"
      });
    }
  
    // 🔥 AWS Access Key
    if (/AKIA[0-9A-Z]{16}/.test(text)) {
      findings.push({
        type: "AWS Access Key",
        severity: "HIGH"
      });
    }
  
    // 🔥 Google API Key
    if (/AIza[0-9A-Za-z\-_]{35}/.test(text)) {
      findings.push({
        type: "Google API Key",
        severity: "HIGH"
      });
    }
  
    // 🔥 Private Key
    if (/-----BEGIN PRIVATE KEY-----/.test(text)) {
      findings.push({
        type: "Private Key Exposure",
        severity: "CRITICAL"
      });
    }
  
    // 🔥 Bearer Token
    if (/Bearer\s[A-Za-z0-9\-_\.]+/.test(text)) {
      findings.push({
        type: "Bearer Token",
        severity: "HIGH"
      });
    }
  
    // 📧 Email (low severity)
    if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text)) {
      findings.push({
        type: "Email Address",
        severity: "LOW"
      });
    }
  
    // 🎯 Final output formatting (IMPORTANT)
    if (findings.length === 0) {
      return res.json({
        target: url,
        status: r.status,
        finding: "No Sensitive Data",
        severity: "LOW"
      });
    }
  
    // Pick highest severity
    const severityRank = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
      CRITICAL: 4
    };
  
    let top = findings.reduce((max, f) =>
      severityRank[f.severity] > severityRank[max.severity] ? f : max
    );
  
    res.json({
      target: url,
      status: r.status,
      finding: findings.map(f => f.type).join(", "),
      severity: top.severity
    });
  });

// ================= ENDPOINTS (UPGRADED) =================
app.post("/endpoints", async (req, res) => {
    const { baseUrl } = req.body;
  
    const paths = [
      "/admin",
      "/admin/login",
      "/dashboard",
      "/api",
      "/api/v1",
      "/user",
      "/users",
      "/auth",
      "/login",
      "/config",
      "/.env",
      "/backup",
      "/backup.zip",
      "/test",
      "/dev",
      "/staging",
      "/graphql",
      "/server-status"
    ];
  
    const results = [];
  
    // 🔹 Baseline (for filtering fake responses)
    const base = await safeRequest(baseUrl);
    const baseLen = JSON.stringify(base.data).length;
  
    for (let p of paths) {
      const fullUrl = baseUrl + p;
      const r = await safeRequest(fullUrl);
  
      const bodyLen = JSON.stringify(r.data).length;
      const diff = Math.abs(bodyLen - baseLen);
  
      let finding = "Not Found";
      let severity = "LOW";
  
      if (r.status === 200 && diff > 30) {
        finding = "🚨 Endpoint Found (Real Content)";
        severity = "HIGH";
      } 
      else if (r.status === 403) {
        finding = "🔐 Forbidden (Exists)";
        severity = "MEDIUM";
      } 
      else if (r.status === 401) {
        finding = "🔑 Auth Required";
        severity = "MEDIUM";
      } 
      else if (r.status >= 500) {
        finding = "⚠️ Server Error (Interesting)";
        severity = "MEDIUM";
      }
  
      results.push({
        target: p,
        status: r.status,
        finding,
        severity
      });
    }
  
    res.json(results);
  });
// ================= CRAWL (UPGRADED) =================
app.post("/crawl", async (req, res) => {
    const { url } = req.body;
  
    const r = await safeRequest(url);
    const $ = cheerio.load(r.data);
  
    const base = new URL(url).origin;
  
    const linksSet = new Set();
    const endpoints = [];
  
    $("a").each((i, el) => {
      let href = $(el).attr("href");
  
      if (!href) return;
  
      try {
        // 🔗 Normalize URL
        if (href.startsWith("/")) {
          href = base + href;
        }
  
        // Skip external links
        if (!href.startsWith(base)) return;
  
        // Remove fragments
        href = href.split("#")[0];
  
        linksSet.add(href);
  
        // 🔍 Endpoint detection
        if (
          /api|admin|login|dashboard|\.json|\.php|\.env/i.test(href)
        ) {
          endpoints.push(href);
        }
  
      } catch (e) {}
    });
  
    const links = Array.from(linksSet);
  
    let finding = "No links found";
    let severity = "LOW";
  
    if (links.length > 0) {
      finding = `Links: ${links.slice(0, 5).join(", ")}`;
      severity = "INFO";
    }
  
    // 🚨 If sensitive endpoints found
    if (endpoints.length > 0) {
      finding += ` | 🚨 Interesting endpoints: ${endpoints.slice(0, 3).join(", ")}`;
      severity = "MEDIUM";
    }
  
    res.json({
      target: url,
      status: r.status,
      finding,
      severity
    });
  });

// ================= RATELIMIT (UPGRADED) =================
app.post("/ratelimit", async (req, res) => {
    const { url } = req.body;
  
    let blocked = false;
    let times = [];
  
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
  
      const r = await safeRequest(url);
  
      const end = Date.now();
      const duration = end - start;
  
      times.push(duration);
  
      if (r.status === 429) blocked = true;
    }
  
    // 📊 Analyze timing
    const avg =
      times.reduce((a, b) => a + b, 0) / times.length;
  
    const max = Math.max(...times);
  
    let finding = "🟢 No Rate Limit";
    let severity = "LOW";
  
    if (blocked) {
      finding = "🚨 Rate Limit Detected (429 responses)";
      severity = "HIGH";
    } else if (max > avg * 2) {
      finding = "⚠️ Possible Throttling (Response delay spike)";
      severity = "MEDIUM";
    }
  
    res.json({
      target: url,
      status: "N/A",
      finding,
      severity
    });
  });

// ================= AUTH (UPGRADED) =================
app.post("/auth", async (req, res) => {
    const { url } = req.body;
  
    // 🔹 Different auth scenarios
    const noAuth = await safeRequest(url);
  
    const fakeAuth = await safeRequest(url, {
      headers: {
        Authorization: "Bearer fake_token"
      }
    });
  
    const malformedAuth = await safeRequest(url, {
      headers: {
        Authorization: "Bearer 123"
      }
    });
  
    const adminAuth = await safeRequest(url, {
      headers: {
        Authorization: "Bearer admin_token"
      }
    });
  
    const bodies = {
      noAuth: JSON.stringify(noAuth.data),
      fake: JSON.stringify(fakeAuth.data),
      malformed: JSON.stringify(malformedAuth.data),
      admin: JSON.stringify(adminAuth.data)
    };
  
    const lengths = {
      noAuth: bodies.noAuth.length,
      fake: bodies.fake.length,
      malformed: bodies.malformed.length,
      admin: bodies.admin.length
    };
  
    // 🔍 Sensitive keyword detection
    const containsSensitive = (text) =>
      /admin|dashboard|user|account|email/i.test(text);
  
    let finding = "Auth seems enforced";
    let severity = "LOW";
  
    // 🚨 No auth but still access
    if (lengths.noAuth > 0 && lengths.noAuth === lengths.fake) {
      finding = "🚨 No Authentication Required (Broken Access Control)";
      severity = "HIGH";
    }
  
    // 🚨 Fake/admin token works
    else if (
      containsSensitive(bodies.fake) ||
      containsSensitive(bodies.admin)
    ) {
      finding = "🚨 Privilege Access Possible with Fake Token";
      severity = "HIGH";
    }
  
    // ⚠️ Behavior differs
    else if (
      lengths.noAuth !== lengths.fake ||
      lengths.fake !== lengths.malformed
    ) {
      finding = "⚠️ Auth Behavior Differs (Check manually)";
      severity = "MEDIUM";
    }
  
    res.json({
      target: url,
      status: noAuth.status,
      finding,
      severity
    });

  });
// ================= SQLI (NEW) =================
app.post("/sqli", async (req, res) => {
    const { url } = req.body;
  
    const payloads = [
      `' OR '1'='1`,
      `" OR "1"="1`,
      `' OR 1=1--`,
      `' OR SLEEP(3)--`,
      `" OR SLEEP(3)--`,
      `' WAITFOR DELAY '0:0:3'--`
    ];
  
    const results = [];
  
    // 🔹 baseline
    const baseStart = Date.now();
    const baseRes = await safeRequest(url);
    const baseTime = Date.now() - baseStart;
    const baseLength = JSON.stringify(baseRes.data).length;
  
    for (let p of payloads) {
      const testUrl = url + "?id=" + encodeURIComponent(p);
  
      const start = Date.now();
      const r = await safeRequest(testUrl);
      const duration = Date.now() - start;
  
      const body = JSON.stringify(r.data);
      const diff = Math.abs(body.length - baseLength);
  
      let finding = "Safe";
      let severity = "LOW";
  
      // 🔥 Error-based detection
      if (/sql|syntax|mysql|postgres|query failed/i.test(body)) {
        finding = "🚨 SQL Error Detected (Possible Injection)";
        severity = "HIGH";
      }
  
      // 🔥 Time-based detection
      else if (duration > baseTime + 2000) {
        finding = "⏱️ Time Delay Detected (Possible SQL Injection)";
        severity = "HIGH";
      }
  
      // ⚠️ Response anomaly
      else if (diff > 100 && r.status === 200) {
        finding = "⚠️ Significant Response Change (Possible SQL Injection)";
        severity = "MEDIUM";
      }
  
      results.push({
        target: url,
        status: r.status,
        payload: p,
        finding,
        severity
      });
    }
  
    res.json(results);
  });
  app.listen(PORT, () => {
    console.log("🚀 Server started successfully");
    console.log(`🌐 Running on http://localhost:${PORT}`);
});
