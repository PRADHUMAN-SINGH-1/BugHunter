const axios = require("axios");
const net = require("net");

const REQUEST_TIMEOUT_MS = Number(process.env.BUGHUNTER_REQUEST_TIMEOUT_MS || 8000);
const MAX_RESPONSE_BYTES = Number(process.env.BUGHUNTER_MAX_RESPONSE_BYTES || 2_000_000);

const isPrivateAddress = (hostname) => {
  if (process.env.BUGHUNTER_ALLOW_PRIVATE_TARGETS === "true") return false;

  const normalized = hostname.toLowerCase().replace(/[\[\]]/g, "");
  if (["localhost", "localhost.localdomain"].includes(normalized) || normalized.endsWith(".local")) {
    return true;
  }

  const version = net.isIP(normalized);
  if (version === 4) {
    const [a, b] = normalized.split(".").map(Number);
    return a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }

  if (version === 6) {
    return normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80:");
  }

  return false;
};

const validateTarget = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("A target URL is required.");
  }

  let target;
  try {
    target = new URL(value);
  } catch {
    throw new Error("Target must be a valid URL.");
  }

  if (!["http:", "https:"].includes(target.protocol)) {
    throw new Error("Only HTTP and HTTPS targets are supported.");
  }

  if (isPrivateAddress(target.hostname)) {
    throw new Error("Private-network targets are disabled. Set BUGHUNTER_ALLOW_PRIVATE_TARGETS=true for an authorized local demo target.");
  }

  return target.toString();
};

const safeRequest = async (url, options = {}) => {
  const target = validateTarget(url);

  try {
    const response = await axios.get(target, {
      timeout: REQUEST_TIMEOUT_MS,
      maxContentLength: MAX_RESPONSE_BYTES,
      maxBodyLength: MAX_RESPONSE_BYTES,
      maxRedirects: 3,
      validateStatus: () => true,
      headers: {
        "User-Agent": "BugHunter-AI/1.0",
        ...(options.headers || {})
      },
      ...options
    });

    return {
      status: response.status,
      data: response.data,
      headers: response.headers,
      durationMs: response.request?.res?.responseTime
    };
  } catch (error) {
    return {
      status: error.response?.status || 599,
      data: "",
      headers: error.response?.headers || {},
      error: error.code || "REQUEST_FAILED"
    };
  }
};

module.exports = { safeRequest, validateTarget };
