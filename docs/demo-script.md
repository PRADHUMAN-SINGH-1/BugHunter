# BugHunter AI · 90-second demo script

## Setup

Run the API on port 5001 and the React app on port 3000. Keep the landing page open. No OpenAI key is required for this script.

## Script

**0–10 seconds — framing**

“BugHunter AI is your AI Application Security Engineer. Instead of configuring a collection of scanners, a developer describes the security outcome they need.”

Point to the conversational workspace and the authorization-first framing.

**10–20 seconds — instant proof**

Click **Analyze Demo Application**.

“For this demo, I’m using a fixture-backed sample target. It is safe, deterministic, requires no network call, and gives judges the exact workflow they would use on an authorized application.”

**20–35 seconds — orchestration, not a spinner**

Point to the progress indicator and timeline.

“The product makes the work visible: validation, planning, header inspection, endpoint discovery, evidence correlation, and report generation. In a real assessment, these stages are backed by the existing deterministic scanners.”

**35–55 seconds — evidence-first result**

When the assessment appears, point to executive summary and the first finding.

“GPT-5.6 is the reasoning layer—not the source of facts. Every finding shows severity, confidence, OWASP mapping, evidence source, business impact, remediation, code guidance, and a manual-verification requirement.”

Expand a finding and point to the source tool chip.

**55–70 seconds — developer action**

“This is deliberately not a vague AI warning. The CSP result identifies the missing control and provides an actionable implementation starting point. The exposed admin route is framed as a reviewable observation, not an invented breach.”

**70–82 seconds — report**

Click the Markdown or PDF export.

“The same evidence becomes a developer-ready report, closing the gap between discovery and remediation.”

**82–90 seconds — preserved depth**

Open **Advanced scanners**.

“For expert workflows, every original scanner is still available. BugHunter AI changes the experience, not the reliability of the underlying evidence collectors.”

## Fallback

If the local API is not running, explain that real scans use `POST /api/assistant/message`; the core UI can still be shown. Do not attempt to scan an external target during judging.
