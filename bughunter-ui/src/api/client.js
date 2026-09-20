import { createLocalDemoAssessment } from "../demoFixture";

const configuredBase = (process.env.REACT_APP_API_BASE_URL || "").trim().replace(/\/$/, "");
const isProduction = process.env.NODE_ENV === "production";
const API_BASE_URL = configuredBase || (isProduction ? window.location.origin : "http://localhost:5001");

async function post(path, body) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  } catch (error) {
    const hint = configuredBase
      ? "The API server could not be reached. Check the deployed backend URL and CORS settings."
      : isProduction
        ? "The frontend has no REACT_APP_API_BASE_URL configured. Point it at the deployed BugHunter API."
        : "Start the BugHunter API on http://localhost:5001.";
    throw new Error(`${hint} (${error.message})`);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.assistantMessage || data.error || `The request failed with HTTP ${response.status}.`);
  }
  return data;
}

export const sendAssistantMessage = (body) => post("/api/assistant/message", body);
export const runDemoAssessment = async () => {
  try {
    return await post("/api/assistant/demo", {});
  } catch (_error) {
    return createLocalDemoAssessment();
  }
};

export const runLegacyScanner = (scanner, target) => {
  const body = scanner === "idor" || scanner === "endpoints" ? { baseUrl: target } : { url: target };
  return post(`/${scanner}`, body);
};

export const apiConfig = {
  baseUrl: API_BASE_URL,
  configured: Boolean(configuredBase),
  production: isProduction
};
