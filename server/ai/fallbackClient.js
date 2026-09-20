const DEFAULT_MODEL = "gemini-2.5-flash";

function hasFallbackKey() {
  return Boolean(process.env.FALLBACK_AI_API_KEY || process.env.GOOGLE_API_KEY);
}

function getFallbackModel() {
  return process.env.FALLBACK_AI_MODEL || process.env.GOOGLE_AI_MODEL || DEFAULT_MODEL;
}

function getFallbackKey() {
  return process.env.FALLBACK_AI_API_KEY || process.env.GOOGLE_API_KEY;
}

async function generateFallbackText(prompt) {
  const key = getFallbackKey();
  if (!key) throw new Error("No fallback AI key is configured.");

  const model = encodeURIComponent(getFallbackModel());
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": key
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || "Fallback AI request failed.");
  }

  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!text) throw new Error("Fallback AI returned an empty response.");
  return text;
}

module.exports = { generateFallbackText, getFallbackModel, hasFallbackKey };
