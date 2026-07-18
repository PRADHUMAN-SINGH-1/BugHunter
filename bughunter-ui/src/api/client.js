const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || "http://localhost:5001").replace(/\/$/, "");

async function post(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.assistantMessage || data.error || "The request could not be completed.");
  return data;
}

export const sendAssistantMessage = (body) => post("/api/assistant/message", body);
export const runDemoAssessment = () => post("/api/assistant/demo", {});

export const runLegacyScanner = (scanner, target) => {
  const body = scanner === "idor" || scanner === "endpoints" ? { baseUrl: target } : { url: target };
  return post(`/${scanner}`, body);
};
