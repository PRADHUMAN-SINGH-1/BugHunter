import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import jsPDF from "jspdf";
import { Cell } from "recharts";

function App() {
  const [url, setUrl] = useState("");
  const [tab, setTab] = useState("scan");
  const [result, setResult] = useState([]);
  const [loading, setLoading] = useState(false);

  const tools = [
    "scan",
    "idor",
    "params",
    "headers",
    "sensitive",
    "endpoints",
    "crawl",
    "ratelimit",
    "auth",
    "sqli"
  ];

  const run = async () => {
    if (!url) return alert("Enter URL");

    setLoading(true);

    const body =
      tab === "idor" || tab === "endpoints"
        ? { baseUrl: url }
        : { url };

    try {
      const res = await fetch(`https://bughunter-h9tw.onrender.com/${tab}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!data) return;

      if (Array.isArray(data)) {
        setResult(data);
      } else {
        setResult([data]);
      }
    } catch (err) {
      alert("Server error");
    }

    setLoading(false);
  };

  const color = (severity) => {
    if (severity === "HIGH") return "#7f1d1d";
    if (severity === "MEDIUM") return "#78350f";
    return "#064e3b";
  };

  // 🔥 DASHBOARD STATS
  const getStats = () => {
    let high = 0;
    let medium = 0;
    let low = 0;

    result.forEach((r) => {
      if (r.severity === "HIGH") high++;
      else if (r.severity === "MEDIUM") medium++;
      else low++;
    });

    return {
      total: result.length,
      high,
      medium,
      low
    };
  };

  const stats = getStats();

  // 📊 CHART DATA
  const chartData = [
    { name: "HIGH", value: stats.high },
    { name: "MEDIUM", value: stats.medium },
    { name: "LOW", value: stats.low }
  ];

  // 📄 EXPORT PDF
  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("BugHunter Scan Report", 20, 20);

    doc.setFontSize(12);

    let y = 30;

    result.forEach((r) => {
      doc.text(`Target: ${r.target}`, 20, y);
      y += 6;
      doc.text(`Status: ${r.status}`, 20, y);
      y += 6;
      doc.text(`Finding: ${r.finding}`, 20, y);
      y += 6;
      doc.text(`Severity: ${r.severity}`, 20, y);
      y += 6;

      if (r.payload) {
        doc.text(`Payload: ${r.payload}`, 20, y);
        y += 6;
      }

      y += 6;

      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save("BugHunter_Report.pdf");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#020617", color: "white" }}>
      
      {/* SIDEBAR */}
      <div style={{
        width: 220,
        background: "#020617",
        borderRight: "1px solid #1e293b",
        padding: 20
      }}>
        <h2 style={{ color: "#38bdf8" }}>BugHunter</h2>

        {tools.map((t) => (
          <div
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "10px 12px",
              marginTop: 10,
              borderRadius: 8,
              cursor: "pointer",
              background: tab === t ? "#38bdf8" : "transparent",
              color: tab === t ? "#000" : "#94a3b8"
            }}
          >
            {t.toUpperCase()}
          </div>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: 30 }}>
        
        {/* HEADER */}
        <h1 style={{ color: "#38bdf8" }}>Dashboard</h1>

        {/* SUMMARY CARDS */}
        <div style={{ display: "flex", gap: 20, marginTop: 20 }}>
          <div style={{ background: "#020617", padding: 20, borderRadius: 12, border: "1px solid #1e293b", width: 150 }}>
            <p>Total</p>
            <h2>{stats.total}</h2>
          </div>

          <div style={{ background: "#7f1d1d", padding: 20, borderRadius: 12, width: 150 }}>
            <p>HIGH</p>
            <h2>{stats.high}</h2>
          </div>

          <div style={{ background: "#78350f", padding: 20, borderRadius: 12, width: 150 }}>
            <p>MEDIUM</p>
            <h2>{stats.medium}</h2>
          </div>

          <div style={{ background: "#064e3b", padding: 20, borderRadius: 12, width: 150 }}>
            <p>LOW</p>
            <h2>{stats.low}</h2>
          </div>
        </div>

{/* 📊 CHART */}
<div style={{
  marginTop: 30,
  background: "#020617",
  padding: 20,
  borderRadius: 12,
  border: "1px solid #1e293b"
}}>
  <h3>📊 Vulnerability Distribution</h3>

  {stats.total === 0 ? (
    <div style={{
      height: 250,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#94a3b8"
    }}>
      No scan data yet 🚫
    </div>
  ) : (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={chartData}>
          <XAxis dataKey="name" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip />

          <Bar dataKey="value">
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.name === "HIGH"
                    ? "#ef4444"
                    : entry.name === "MEDIUM"
                    ? "#f59e0b"
                    : "#10b981"
                }
              />
            ))}
          </Bar>

        </BarChart>
      </ResponsiveContainer>
    </div>
  )}
</div>

        {/* INPUT + BUTTONS */}
        <div style={{ marginTop: 30 }}>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://target.com"
            style={{
              padding: 12,
              width: 400,
              borderRadius: 8,
              border: "1px solid #1e293b",
              background: "#020617",
              color: "white"
            }}
          />

          <button
            onClick={run}
            style={{
              marginLeft: 10,
              padding: "12px 20px",
              borderRadius: 8,
              border: "none",
              background: "#22c55e",
              color: "black",
              cursor: "pointer"
            }}
          >
            ▶ Run {tab.toUpperCase()}
          </button>

          <button
            onClick={exportPDF}
            style={{
              marginLeft: 10,
              padding: "12px 20px",
              borderRadius: 8,
              border: "none",
              background: "#38bdf8",
              color: "black",
              cursor: "pointer"
            }}
          >
            📄 Export PDF
          </button>
        </div>

        {/* LOADING */}
        {loading && <p style={{ marginTop: 20 }}>⏳ Running scan...</p>}

        {/* RESULTS */}
        <div style={{ marginTop: 30 }}>
          {result.map((r, i) => (
            <div
              key={i}
              style={{
                background: color(r.severity),
                padding: 20,
                marginBottom: 15,
                borderRadius: 12,
                boxShadow: "0 0 15px rgba(0,0,0,0.4)"
              }}
            >
              <p><b>🎯 Target:</b> {r.target}</p>
              <p><b>📡 Status:</b> {r.status}</p>

              <p>
                <b>🧠 Finding:</b> {r.finding}
                <span style={{
                  marginLeft: 10,
                  padding: "4px 8px",
                  borderRadius: 6,
                  background:
                    r.severity === "HIGH"
                      ? "#ef4444"
                      : r.severity === "MEDIUM"
                      ? "#f59e0b"
                      : "#10b981",
                  color: "black",
                  fontSize: 12
                }}>
                  {r.severity}
                </span>
              </p>

              {r.payload && <p><b>💉 Payload:</b> {r.payload}</p>}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default App;
