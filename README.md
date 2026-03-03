# 🌍 Regulation Intel MCP

Live global AI regulation intelligence. Query any jurisdiction's AI legal status, find regulatory arbitrage gaps, track new legislation, and assess compliance risk in real-time.

> **⚖️ Legal Disclaimer:** This tool aggregates publicly available regulatory information for educational and business intelligence purposes. It does NOT constitute legal advice. Always consult a qualified legal professional for jurisdiction-specific compliance interpretation.

## What It Does

Regulation Intel MCP provides instant access to:
- **AI regulatory status** across 50+ jurisdictions
- **Compliance requirements** by topic (facial recognition, generative AI, data privacy, bias auditing, transparency)
- **Regulatory arbitrage detection** — identify gaps and opportunities across regions
- **Change tracking** — stay informed of new legislation and enforcement actions
- **Full-text search** across all regulations and jurisdictions

Perfect for:
- AI startups navigating global compliance
- VCs assessing regulatory risk
- Compliance lawyers researching jurisdiction-specific rules
- Consultants building regulatory strategy
- Policy makers tracking international trends

---

## Installation

### Via Smithery (Recommended)

```bash
smithery install regulation-intel-mcp
```

Then add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "regulation-intel": {
      "command": "regulation-intel"
    }
  }
}
```

Restart Claude Desktop and the tool is live.

### Manual Installation

```bash
git clone https://github.com/blazik-coo/regulation-intel-mcp.git
cd regulation-intel-mcp
npm install
npm start
```

Server runs on `http://localhost:3423` by default. Set `PORT=3000 npm start` for a different port.

---

## 5 Core Tools

### 1. **get_jurisdiction_status** — Query AI legal status

Get the current regulatory landscape for a jurisdiction and topic.

```
Inputs:
  jurisdiction (string): "EU", "US-Federal", "UK", "UAE", "Singapore", "China", etc.
  topic (string): "facial recognition", "generative ai", "bias audit", "data retention", etc.

Example:
  Input: {"jurisdiction": "EU", "topic": "generative ai"}
  Output: {
    "status": "regulated",
    "law": "EU AI Act (2024)",
    "enforcement_start": "2025-01",
    "key_requirements": ["risk assessment", "transparency", "human oversight"],
    "penalties": "up to €30M or 6% of turnover",
    "next_deadline": "2025-01-02"
  }
```

### 2. **list_regulations** — All rules for a jurisdiction

Get the complete list of AI regulations active in a specific region.

```
Inputs:
  jurisdiction (string): "EU", "UK", "US-California", "China", etc.

Example:
  Input: {"jurisdiction": "US-California"}
  Output: [
    {"name": "SB-942 Bot Disclosure Law", "topic": "bots", "status": "active"},
    {"name": "AB-375 California Consumer Privacy Act", "topic": "data", "status": "active"},
    ...
  ]
```

### 3. **get_arbitrage_gaps** — Find regulatory opportunities

Identify jurisdictions with lighter regulation on specific AI use cases.

```
Inputs: None required

Example Output: {
  "gaps": [
    {"use_case": "facial recognition", "light_regulation": ["UAE", "Singapore"], "heavy_regulation": ["EU", "UK"]},
    {"use_case": "predictive analytics", "light_regulation": ["US-Federal"], "heavy_regulation": ["EU"]},
    ...
  ]
}
```

### 4. **search_regulations** — Full-text search

Search across all jurisdictions and all regulations by keyword.

```
Inputs:
  query (string): "facial recognition", "transparency", "bias audit", etc.

Example:
  Input: {"query": "facial recognition"}
  Output: {
    "results": [
      {"jurisdiction": "EU", "law": "EU AI Act", "excerpt": "...facial recognition banned in public spaces..."},
      {"jurisdiction": "UK", "law": "Data Protection Act", "excerpt": "...requires explicit consent..."},
      ...
    ],
    "total": 127
  }
```

### 5. **get_recent_changes** — Track new regulations

Get regulations that changed or went into enforcement in the last N days.

```
Inputs:
  days (integer): 7, 30, 365, etc.

Example:
  Input: {"days": 30}
  Output: {
    "changes": [
      {"jurisdiction": "UK", "law": "AI Bill", "enforcement_date": "2026-03-01", "impact": "high"},
      {"jurisdiction": "Singapore", "change_type": "guidance update", "date": "2026-02-28"},
      ...
    ],
    "total": 15
  }
```

---

## Rate Limits

### Free Tier
- **10 requests per minute** (per IP)
- No API key required
- Perfect for individual research and testing
- Subject to fair use policy

### Pro Tier (Coming Soon)
- **Unlimited requests**
- Priority support
- Webhook integration for regulation change alerts
- Custom jurisdiction data feeds
- [Sign up for early access](https://example.com/pro)

---

## Data Sources

We aggregate from:
- **EU AI Act Portal** — Official AI Act guidance and updates
- **Congress.gov API** — US federal legislation and bills
- **NCSL AI Legislation Tracker** — State-by-state AI laws
- **Official Government Sources** — China (MIIT, CAC), UK (AI Safety Institute), Singapore (Model AI Governance Framework), UAE tech strategy
- **International AI Policy Databases** — UN, OECD, academic research

Data refreshed **weekly** (or as legislation becomes available).

---

## Usage Examples

### Claude Desktop

Simply ask Claude:

> "What are the current facial recognition rules in the EU?"
> "Find regulatory arbitrage gaps for generative AI between US and EU"
> "What changed in AI regulation in the last 30 days?"

Claude will automatically call the right tools.

### Programmatic / API

```javascript
// Example with fetch
const result = await fetch('http://localhost:3423/tools/get_jurisdiction_status', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jurisdiction: 'EU',
    topic: 'generative ai'
  })
});

const data = await result.json();
console.log(data);
```

---

## Development

### Running Locally

```bash
npm install
npm start
```

Server runs on port 3423. Test with:

```bash
curl -X POST http://localhost:3423/tools/get_jurisdiction_status \
  -H 'Content-Type: application/json' \
  -d '{"jurisdiction":"EU","topic":"generative ai"}'
```

### Adding New Jurisdictions

Edit `data/regulations.json` and add jurisdiction entries following the existing schema. Then run `npm run crawl` to auto-update from sources.

### Running Tests

```bash
npm test
```

---

## Architecture

- **Server:** Express.js MCP server
- **Data:** JSON regulations database (auto-updated weekly)
- **Rate Limiter:** In-memory per-IP tracking (free tier)
- **Crawler:** Weekly auto-update from official sources (`crawler.js`)
- **Protocol:** MCP v1.0 compatible

---

## License

MIT — Use freely, but attribute and don't hold us liable for legal errors.

---

## Support

- **Issues:** [GitHub Issues](https://github.com/blazik-coo/regulation-intel-mcp/issues)
- **Discussions:** [GitHub Discussions](https://github.com/blazik-coo/regulation-intel-mcp/discussions)
- **Updates:** Watch this repo for regulation changes and new features

---

**Built for the AI era.** Stay compliant, spot opportunities, move fast. 🚀
