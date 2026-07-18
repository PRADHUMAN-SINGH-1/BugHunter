const OpenAI = require("openai");

let client;

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required to run the BugHunter AI assistant.");
  }

  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  return client;
}

function getModel() {
  return process.env.OPENAI_MODEL || "gpt-5.6";
}

module.exports = { getOpenAIClient, getModel };
