const express = require("express");
const cors = require("cors");
const scannerRoutes = require("./server/routes/scannerRoutes");
const assistantRoutes = require("./server/routes/assistantRoutes");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({ origin: process.env.BUGHUNTER_FRONTEND_ORIGIN || true }));
app.use(express.json({ limit: "32kb" }));

app.get("/", (_req, res) => {
  res.json({ name: "BugHunter AI", status: "ok", version: "phase-1" });
});

app.use(scannerRoutes);
app.use("/api/assistant", assistantRoutes);

app.use((error, _req, res, _next) => {
  res.status(500).json({ error: "Unexpected server error" });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log("🚀 BugHunter AI server started");
    console.log(`🌐 Running on http://localhost:${PORT}`);
  });
}

module.exports = app;
