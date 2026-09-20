const DEFAULT_MODEL = "gemini-2.5-flash";

function hasGeminiKey() {
  return Boolean(process.env.FALLBACK_AI_API_KEY);
}

function getGeminiModel() {
  return process.env.FALLBACK_AI_MODEL || DEFAULT_MODEL;
}

async function generateGeminiText(prompt) {
  if (!hasGeminiKey()) {
    throw new Error("No fallback AI key is configured.");
  }

  const model = encodeURIComponent(getGeminiModel());
  const key = encodeURIComponent(process.env.FALLBACK_AI_API_KEY);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.15,
        responseMimeType: "application/json"
      }
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.error?.message || "Fallback AI request failed.";
    throw new Error(message);
  }

  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!text) throw new Error("Fallback AI returned an empty response.");

  return text;
}

module.exports = { generateGeminiText, getGeminiModel, hasGeminiKey };
