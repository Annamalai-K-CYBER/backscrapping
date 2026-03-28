#!/usr/bin/env node

/**
 * 🎯 QUICK REFERENCE - Common Tasks
 * Copy-paste these commands to get started quickly
 */

console.log(`
╔════════════════════════════════════════════════════════════╗
║   🎯 QUICK REFERENCE - Copy & Paste Commands              ║
╚════════════════════════════════════════════════════════════╝

1️⃣  INSTALL & SETUP
────────────────────────────────────────────────────────────
  npm install
  cp .env.example .env
  # Edit .env with your API keys
  npm start

2️⃣  SUBMIT AI QUERY (Main Feature)
────────────────────────────────────────────────────────────
  curl -X POST http://localhost:5000/api/ai-query \\
    -H "Content-Type: application/json" \\
    -d '{
      "query": "What is machine learning?",
      "queryName": "machine-learning-intro"
    }'

3️⃣  GET ALL QUERIES
────────────────────────────────────────────────────────────
  curl http://localhost:5000/api/ai-queries

4️⃣  GET SPECIFIC QUERY (replace ID)
────────────────────────────────────────────────────────────
  curl http://localhost:5000/api/ai-queries/507f1f77bcf86cd799439011

5️⃣  RUN DEMO CLIENT
────────────────────────────────────────────────────────────
  node example-client.js

6️⃣  ORIGINAL MAPS FEATURES (Still Work!)
────────────────────────────────────────────────────────────
  # Fast scan
  curl "http://localhost:5000/api/maps?q=coffee%20shops"
  
  # Full details
  curl "http://localhost:5000/api/full?q=coffee%20shops"

════════════════════════════════════════════════════════════

🔧 TROUBLESHOOTING
────────────────────────────────────────────────────────────

MongoDB not running?
  mongod

Port 5000 already in use?
  # Kill process on port 5000 (macOS/Linux)
  lsof -ti:5000 | xargs kill -9
  
  # Windows
  netstat -ano | findstr :5000

Check if server is running?
  curl http://localhost:5000

View all API responses?
  curl http://localhost:5000/api/ai-queries | jq

📚 DOCUMENTATION FILES
────────────────────────────────────────────────────────────
  - README.md          → Full API documentation
  - GUIDE.md           → Complete implementation guide
  - IMPLEMENTATION.md  → What was added summary
  - example-client.js  → Working demo
  - .env.example       → Credential template

🚀 YOUR NEW FEATURES
────────────────────────────────────────────────────────────
  ✅ OpenRouter AI (10x calls per query)
  ✅ Excel file generation (auto-formatted)
  ✅ ImageKit cloud upload (public URLs)
  ✅ MongoDB storage (persistent data)
  ✅ REST API endpoints (3 new routes)

════════════════════════════════════════════════════════════
`);

// Example usage programmatically
const examples = {
  // Submit query
  submitQuery: \`
const axios = require('axios');

const result = await axios.post('http://localhost:5000/api/ai-query', {
  query: 'What is artificial intelligence?',
  queryName: 'ai-definition'
});

console.log('Excel URL:', result.data.imageKitUrl);
console.log('MongoDB ID:', result.data.mongodbId);
  \`,

  // Get all queries
  getAllQueries: \`
const axios = require('axios');

const queries = await axios.get('http://localhost:5000/api/ai-queries');
console.log('Total queries:', queries.data.count);
console.log('Queries:', queries.data.data);
  \`,

  // Get specific query
  getQuery: \`
const axios = require('axios');

const query = await axios.get('http://localhost:5000/api/ai-queries/QUERY_ID');
console.log('Query name:', query.data.data.queryName);
console.log('All 10 responses:', query.data.data.responses);
console.log('Download URL:', query.data.data.excelFileUrl);
  \`
};

console.log(`
📝 JAVASCRIPT EXAMPLES
════════════════════════════════════════════════════════════

Submit Query:
${examples.submitQuery}

Get All Queries:
${examples.getAllQueries}

Get Specific Query:
${examples.getQuery}

════════════════════════════════════════════════════════════
`);
