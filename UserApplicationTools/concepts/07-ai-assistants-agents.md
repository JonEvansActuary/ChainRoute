# Concept: AI Assistants and Agents

**Platform:** Integrable into Web Builder, Web Verifier, Desktop, CLI, or standalone chat  
**Primary job:** Make building and verifying easier via natural language, suggestions, and automation.  
**Demand:** Growing — form fatigue and “explain this” are high-value.

## 7.1 Build Assistant

**Where:** Web Builder, Desktop app, or CLI chat.

**Capabilities:**

- **Natural-language event:** User says “Record that this painting was authenticated by Lab X on 2026-01-15” → agent suggests `eventType: "authentication"`, `timestamp`, `summary: { lab: "Lab X", date: "2026-01-15" }` and placeholder support slots (e.g. “certificate,” “photo”).
- **From description:** “Transfer from Alice to Bob at auction” → suggest eventType “transfer,” summary with from/to, and “auction” support labels.
- **Form prefill:** “Same as last event but date today” → copy previous event, update timestamp.
- **Support file roles:** User uploads 4 files; agent suggests labels (e.g. “photo,” “certificate,” “invoice”) from filenames or optional lightweight analysis (e.g. image vs PDF).
- **Folder scan:** “These 10 files are for Event 2” → agent groups them and suggests which are “photo” vs “report” for `supports[]` labels.

**Implementation:** LLM with tool use: “create_event_draft” with structured output (eventType, summary, support labels). Optional vision for “what’s in this image?” to suggest labels. No signing; only suggestions and draft JSON.

## 7.2 Verify / Explain Agent

**Where:** Web Verifier, Mobile Verify, or standalone chat.

**Capabilities:**

- **“Explain this chain”:** User pastes link or tx hash → agent calls Verification API (or runs verification), gets chain + events → returns plain-language summary: “This chain has 6 events: authentication, transport, auction drop-off, live bidding, handover, long-term storage. Genesis created on …; last event signed by 0x….”
- **“Who signed event 3?”** → Answer from chain data (delegate address + optional lookup).
- **“Is this chain complete?”** → Check backward to genesis, forward to latest; report gaps or “complete from genesis to Event N.”
- **Anomaly hints:** “Timestamps have a 30-day gap between event 2 and 3”; “Delegate changed at event 4” — short explanations.
- **Q&A over chain:** “When was it authenticated?” “What’s the last event?” — RAG over timeline and blob summaries.

**Implementation:** LLM with tools: “verify_chain(txHash),” “get_chain_summary(genesisHash).” Agent receives structured chain; formats answers and flags anomalies from rules (e.g. timestamp order, delegate changes).

## 7.3 Integration Patterns

- **In-app chat:** Web Builder and Verifier have a “Ask” or “Explain” panel; same backend or same client-side agent.
- **CLI:** `chainroute explain <tx-hash>` or `chainroute suggest-event "Transfer from A to B"` for power users.
- **Standalone bot:** Slack/Discord or web chat that accepts links and returns verification summary + link to full verifier.
- **API for agents:** Verification API returns machine-readable chain; Build API (future) accepts “draft from natural language” so any client can implement an assistant.

## Success Metrics

- Build: User creates one event using only a sentence and one click to accept suggestion.
- Verify: User gets a 2–3 sentence “explanation” of a chain without reading raw JSON or tx hashes.
- No signing or key access by the agent; only suggestions and read-only verification.
