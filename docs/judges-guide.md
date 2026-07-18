# Judge’s guide

## What to evaluate

| Dimension | Where to look |
| --- | --- |
| Technical implementation | Strict tool schemas, evidence gate, scanner reuse, structured API contracts |
| Design | AI-first workspace, glass UI, responsive layout, timelines, rich finding cards |
| Impact | Lowers the cognitive load from raw scanner output to remediation-ready guidance |
| Creativity | GPT-5.6 acts as an authorization-aware security engineer rather than a chat wrapper |

## Quick tour

1. Click **Analyze Demo Application** for an isolated, predictable assessment.
2. Review the animated timeline and executive summary.
3. Expand a finding to inspect evidence, OWASP mapping, remediation, and code sample.
4. Export the report.
5. Open **Advanced scanners** to see the preserved deterministic scanner surface.

## Trust model

- The model cannot make direct network requests.
- Backend tool definitions have strict JSON schemas.
- A model can only access tools listed in the approved scan plan.
- Real scans require explicit authorization, scan-mode selection, and approval.
- A final evidence gate discards findings that are not linked to executed tools.
- Demo mode is fixture-backed and does not scan a real target.

## Suggested judge questions

**Does GPT-5.6 invent vulnerabilities?** No. It is constrained to interpret scanner evidence; untraceable findings are removed before the response reaches the UI.

**Why preserve deterministic scanners?** They provide repeatable, inspectable evidence while the model supplies orchestration, prioritization, and developer communication.

**Can a developer still use individual scanners?** Yes. They live in Advanced Scanners, keeping the AI workflow primary without removing expert controls.

**What needs an API key?** Only real post-approval GPT-5.6 assessments. The Build Week demo is fully local and deterministic.
