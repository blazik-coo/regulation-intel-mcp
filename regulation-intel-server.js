#!/usr/bin/env node

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3423;

// Load regulations data
const dataPath = path.join(__dirname, 'data', 'regulations.json');
let regulationsData = {};

try {
  regulationsData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
} catch (e) {
  console.error('Error loading regulations data:', e.message);
  process.exit(1);
}

// Rate limiting: simple in-memory rate limiter (10 req/min per IP)
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 10;

function checkRateLimit(ip) {
  const now = Date.now();
  const record = requestCounts.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
  
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + RATE_LIMIT_WINDOW;
  } else if (record.count >= RATE_LIMIT_MAX) {
    return false;
  } else {
    record.count++;
  }
  
  requestCounts.set(ip, record);
  return true;
}

app.use(express.json());

// Middleware: rate limiting (free tier)
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const ip = req.ip;
  
  if (!apiKey) {
    if (!checkRateLimit(ip)) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Free tier: 10 requests per minute. Provide X-API-Key header for unlimited access.',
        retry_after: 60
      });
    }
  }
  // API key auth would validate here (not implemented in free tier)
  next();
});

// ============ TOOLS ============

// Tool 1: get_jurisdiction_status(jurisdiction, topic)
function getJurisdictionStatus(jurisdiction, topic) {
  const jurisdictionData = regulationsData.jurisdictions.find(j => j.id === jurisdiction);
  
  if (!jurisdictionData) {
    return {
      error: `Jurisdiction '${jurisdiction}' not found`,
      available_jurisdictions: regulationsData.jurisdictions.map(j => j.id)
    };
  }
  
  const matchingRegs = jurisdictionData.regulations.filter(reg => {
    const regText = JSON.stringify(reg).toLowerCase();
    return regText.includes(topic.toLowerCase());
  });
  
  return {
    jurisdiction: jurisdiction,
    jurisdiction_name: jurisdictionData.name,
    topic: topic,
    arbitrage_score: jurisdictionData.arbitrage_score,
    enforcement_status: jurisdictionData.enforcement_status || 'not_specified',
    matching_regulations: matchingRegs,
    total_regulations: jurisdictionData.regulations.length,
    description: jurisdictionData.description || null
  };
}

// Tool 2: list_regulations(jurisdiction)
function listRegulations(jurisdiction) {
  const jurisdictionData = regulationsData.jurisdictions.find(j => j.id === jurisdiction);
  
  if (!jurisdictionData) {
    return {
      error: `Jurisdiction '${jurisdiction}' not found`,
      available_jurisdictions: regulationsData.jurisdictions.map(j => j.id)
    };
  }
  
  return {
    jurisdiction: jurisdiction,
    jurisdiction_name: jurisdictionData.name,
    jurisdiction_type: jurisdictionData.jurisdiction_type,
    arbitrage_score: jurisdictionData.arbitrage_score,
    last_update: jurisdictionData.last_update,
    enforcement_status: jurisdictionData.enforcement_status || null,
    total_regulations: jurisdictionData.regulations.length,
    regulations: jurisdictionData.regulations.map(reg => ({
      id: reg.id,
      name: reg.name,
      adoption_date: reg.adoption_date,
      enforcement_date: reg.enforcement_date,
      enforcement_status: reg.enforcement_status,
      description: reg.description,
      compliance_difficulty: reg.compliance_difficulty || null,
      estimated_compliance_cost_usd: reg.estimated_compliance_cost_usd || null
    }))
  };
}

// Tool 3: get_arbitrage_gaps()
function getArbitrageGaps() {
  const disclaimer = "⚠️ This data is for informational purposes only and does NOT constitute legal advice. Regulatory arbitrage strategies carry significant legal, compliance, and reputational risks. Consult qualified legal counsel before implementing any cross-jurisdiction strategy.";
  return {
    total_gaps: regulationsData.arbitrage_gaps.length,
    gaps: regulationsData.arbitrage_gaps.map(gap => ({
      jurisdiction_light: gap.jurisdiction_light,
      jurisdiction_heavy: gap.jurisdiction_heavy,
      light_regulation_score: regulationsData.jurisdictions.find(j => j.id === gap.jurisdiction_light)?.arbitrage_score,
      heavy_regulation_score: regulationsData.jurisdictions.find(j => j.id === gap.jurisdiction_heavy)?.arbitrage_score,
      gap_summary: gap.gap_summary,
      arbitrage_opportunity: gap.arbitrage_opportunity,
      timeline: gap.timeline,
      risk_level: gap.risk_level
    })),
    summary: `Regulatory gaps represent opportunities for jurisdiction shopping. Light-regulation jurisdictions (high arbitrage scores) offer minimal compliance burden. ${disclaimer}`,
    top_arbitrage_jurisdiction: {
      name: "United Arab Emirates",
      id: "UAE",
      score: 0.95,
      reason: `No AI-specific law; zero compliance requirement. Incorporate here, serve globally. ${disclaimer}`
    },
    disclaimer: disclaimer
  };
}

// Tool 4: search_regulations(query)
function searchRegulations(query) {
  const results = [];
  const lowerQuery = query.toLowerCase();
  
  regulationsData.jurisdictions.forEach(jurisdiction => {
    jurisdiction.regulations.forEach(reg => {
      const regText = JSON.stringify(reg).toLowerCase();
      if (regText.includes(lowerQuery)) {
        results.push({
          jurisdiction: jurisdiction.id,
          jurisdiction_name: jurisdiction.name,
          regulation_id: reg.id,
          regulation_name: reg.name,
          description: reg.description,
          enforcement_status: reg.enforcement_status,
          estimated_compliance_cost_usd: reg.estimated_compliance_cost_usd || null
        });
      }
    });
  });
  
  return {
    query: query,
    total_results: results.length,
    results: results,
    jurisdictions_affected: [...new Set(results.map(r => r.jurisdiction))],
    search_timestamp: new Date().toISOString()
  };
}

// Tool 5: get_recent_changes(days)
function getRecentChanges(days) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const changes = [];
  
  regulationsData.jurisdictions.forEach(jurisdiction => {
    jurisdiction.regulations.forEach(reg => {
      const enforcementDate = new Date(reg.enforcement_date);
      if (enforcementDate >= cutoffDate) {
        changes.push({
          jurisdiction: jurisdiction.id,
          jurisdiction_name: jurisdiction.name,
          regulation_name: reg.name,
          enforcement_date: reg.enforcement_date,
          enforcement_status: reg.enforcement_status,
          days_since_enforcement: Math.floor((new Date() - enforcementDate) / (1000 * 60 * 60 * 24))
        });
      }
    });
  });
  
  return {
    days_lookback: days,
    total_recent_changes: changes.length,
    changes: changes.sort((a, b) => new Date(b.enforcement_date) - new Date(a.enforcement_date)),
    report_timestamp: new Date().toISOString()
  };
}

// ============ MCP PROTOCOL ENDPOINTS ============

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'regulation-intel-mcp',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor(process.uptime())
  });
});

// List available tools (MCP standard)
app.get('/tools', (req, res) => {
  res.json({
    tools: [
      {
        name: 'get_jurisdiction_status',
        description: 'Get current AI legal status for a specific jurisdiction and topic',
        parameters: {
          jurisdiction: 'string (e.g., EU, US-Federal, UK, UAE, Singapore)',
          topic: 'string (e.g., "facial recognition", "generative ai")'
        }
      },
      {
        name: 'list_regulations',
        description: 'List all AI regulations for a given country/region',
        parameters: {
          jurisdiction: 'string (e.g., EU, US-California, China)'
        }
      },
      {
        name: 'get_arbitrage_gaps',
        description: 'Identify regulatory arbitrage opportunities across jurisdictions',
        parameters: {}
      },
      {
        name: 'search_regulations',
        description: 'Full-text search across all jurisdictions and regulations',
        parameters: {
          query: 'string (e.g., "facial recognition", "transparency", "bias audit")'
        }
      },
      {
        name: 'get_recent_changes',
        description: 'Get regulations that changed/enforced in the last N days',
        parameters: {
          days: 'integer (e.g., 7, 30, 365)'
        }
      }
    ],
    total_tools: 5
  });
});

// Tool: get_jurisdiction_status
app.post('/tools/get_jurisdiction_status', (req, res) => {
  const { jurisdiction, topic } = req.body;
  
  if (!jurisdiction || !topic) {
    return res.status(400).json({
      error: 'Missing required parameters',
      required: ['jurisdiction', 'topic']
    });
  }
  
  const result = getJurisdictionStatus(jurisdiction, topic);
  res.json(result);
});

// Tool: list_regulations
app.post('/tools/list_regulations', (req, res) => {
  const { jurisdiction } = req.body;
  
  if (!jurisdiction) {
    return res.status(400).json({
      error: 'Missing required parameter: jurisdiction'
    });
  }
  
  const result = listRegulations(jurisdiction);
  res.json(result);
});

// Tool: get_arbitrage_gaps
app.post('/tools/get_arbitrage_gaps', (req, res) => {
  const result = getArbitrageGaps();
  res.json(result);
});

// Tool: search_regulations
app.post('/tools/search_regulations', (req, res) => {
  const { query } = req.body;
  
  if (!query) {
    return res.status(400).json({
      error: 'Missing required parameter: query'
    });
  }
  
  const result = searchRegulations(query);
  res.json(result);
});

// Tool: get_recent_changes
app.post('/tools/get_recent_changes', (req, res) => {
  const { days } = req.body;
  
  if (!days || typeof days !== 'number' || days < 0) {
    return res.status(400).json({
      error: 'Missing or invalid required parameter: days (must be positive integer)'
    });
  }
  
  const result = getRecentChanges(days);
  res.json(result);
});

// Catch-all for invalid endpoints
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    available_endpoints: [
      'GET /health',
      'GET /tools',
      'POST /tools/get_jurisdiction_status',
      'POST /tools/list_regulations',
      'POST /tools/get_arbitrage_gaps',
      'POST /tools/search_regulations',
      'POST /tools/get_recent_changes'
    ]
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`\n✅ Regulation Intel MCP Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 Tools: http://localhost:${PORT}/tools`);
  console.log(`\nReady to handle requests. Ctrl+C to stop.\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

module.exports = app;
