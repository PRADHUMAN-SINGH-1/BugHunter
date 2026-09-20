const express = require("express");
const { handleAssistantMessage } = require("../ai/assistantOrchestrator");
const { createDemoAssessment } = require("../demo/demoAssessment");

const assistantRoutes = express.Router();

assistantRoutes.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    aiConfigured: Boolean(process.env.OPENAI_API_KEY || process.env.FALLBACK_AI_API_KEY || process.env.GOOGLE_API_KEY)
  });
});

assistantRoutes.post("/message", async (req, res) => {
  const response = await handleAssistantMessage(req.body || {});
  const statusCode = response.status === "error" ? 400 : 200;
  res.status(statusCode).json(response);
});

// A fixture-backed route keeps the live demo reliable while using the exact
// response contract consumed by the AI workspace. It is intentionally separate
// from /message so real assessments always retain authorization gating.
assistantRoutes.post("/demo", (_req, res) => {
  res.json(createDemoAssessment());
});

module.exports = assistantRoutes;
