const express = require("express");
const scanners = require("../scanners/scanEngine");

const routeInput = {
  idor: "baseUrl",
  endpoints: "baseUrl",
  params: "url",
  headers: "url",
  sensitive: "url",
  crawl: "url",
  ratelimit: "url",
  auth: "url",
  sqli: "url",
  scan: "url"
};

const asyncRoute = (handler) => (req, res) => {
  Promise.resolve(handler(req, res)).catch((error) => {
    res.status(400).json({ error: error.message || "Scan failed" });
  });
};

const scannerRoutes = express.Router();
Object.entries(routeInput).forEach(([route, input]) => {
  scannerRoutes.post(`/${route}`, asyncRoute(async (req, res) => {
    const value = req.body?.[input];
    if (!value) throw new Error(`Missing request field: ${input}`);
    const result = await scanners[route](value);
    res.json(result);
  }));
});

module.exports = scannerRoutes;
