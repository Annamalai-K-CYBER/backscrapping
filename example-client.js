#!/usr/bin/env node

/**
 * 🤖 AI Query Client - Example Usage
 * Run: node example-client.js
 */

const axios = require("axios");

const API_URL = "http://localhost:5000";

// Color console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m"
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.blue}═══ ${msg} ═══${colors.reset}\n`)
};

/**
 * 🤖 Example 1: Submit AI Query
 */
async function submitAIQuery() {
  log.header("1️⃣ SUBMIT AI QUERY");

  try {
    const payload = {
      query: "What are the top 5 Node.js best practices for production environments?",
      queryName: "nodejs-production-best-practices"
    };

    log.info(`Submitting query: "${payload.queryName}"`);
    log.info(`Query: "${payload.query.substring(0, 50)}..."`);

    const response = await axios.post(`${API_URL}/api/ai-query`, payload, {
      timeout: 120000 // 2 minutes timeout
    });

    if (response.data.success) {
      log.success(`Query processed successfully!`);
      console.log(`\n📊 Results:`);
      console.log(`  • Query Name: ${response.data.queryName}`);
      console.log(`  • Responses Generated: ${response.data.responseCount}`);
      console.log(`  • MongoDB ID: ${response.data.mongodbId}`);
      console.log(`  • ImageKit URL: ${response.data.imageKitUrl}`);
      console.log(`  • Created: ${response.data.createdAt}\n`);

      return response.data;
    }
  } catch (err) {
    if (err.code === "ECONNREFUSED") {
      log.error("Cannot connect to server. Is it running on port 5000?");
    } else if (err.response?.status === 400) {
      log.error(`Bad request: ${err.response.data.error}`);
    } else if (err.code === "ENOTFOUND") {
      log.error("Server not found. Make sure the server is running.");
    } else {
      log.error(`Request failed: ${err.message}`);
    }
  }
}

/**
 * 📋 Example 2: Get All Queries
 */
async function getAllQueries() {
  log.header("2️⃣ GET ALL STORED QUERIES");

  try {
    const response = await axios.get(`${API_URL}/api/ai-queries`);

    if (response.data.success) {
      log.success(`Found ${response.data.count} queries`);

      if (response.data.count > 0) {
        console.log("\n📝 Query List:");
        response.data.data.forEach((item, index) => {
          console.log(`\n  ${index + 1}. ${item.queryName}`);
          console.log(`     • ID: ${item._id}`);
          console.log(`     • Responses: ${item.responses.length}`);
          console.log(`     • File: ${item.excelFileUrl.substring(0, 60)}...`);
          console.log(`     • Created: ${new Date(item.createdAt).toLocaleString()}`);
        });
      } else {
        log.warning("No queries found. Submit one first!");
      }
    }
  } catch (err) {
    if (err.code === "ECONNREFUSED") {
      log.error("Cannot connect to server on port 5000");
    } else {
      log.error(`Failed to fetch queries: ${err.message}`);
    }
  }
}

/**
 * 📄 Example 3: Get Single Query Details
 */
async function getQueryDetails(queryId) {
  log.header("3️⃣ GET QUERY DETAILS");

  if (!queryId) {
    log.warning("Query ID required. Get it from getAllQueries() first");
    return;
  }

  try {
    log.info(`Fetching details for ID: ${queryId}`);

    const response = await axios.get(`${API_URL}/api/ai-queries/${queryId}`);

    if (response.data.success) {
      const query = response.data.data;

      log.success(`Query found: ${query.queryName}`);
      console.log(`\n📊 Full Details:`);
      console.log(`  • Query Name: ${query.queryName}`);
      console.log(`  • Total Responses: ${query.responses.length}`);
      console.log(`  • Created: ${new Date(query.createdAt).toLocaleString()}`);
      console.log(`\n📌 ImageKit URL:`);
      console.log(`  ${query.excelFileUrl}\n`);
      console.log(`📝 First Response Preview:`);
      console.log(`  ${query.responses[0].substring(0, 150)}...\n`);
    }
  } catch (err) {
    if (err.response?.status === 404) {
      log.error("Query not found. Invalid ID?");
    } else {
      log.error(`Failed to fetch query: ${err.message}`);
    }
  }
}

/**
 * 🗺️ Example 4: Maps Scraping
 */
async function scrapeMaps() {
  log.header("4️⃣ SCRAPE GOOGLE MAPS (BONUS)");

  try {
    const query = "coffee shops in San Francisco";
    log.info(`Scraping: "${query}"`);

    const response = await axios.get(`${API_URL}/api/maps`, {
      params: { q: query }
    });

    if (response.data.success) {
      log.success(`Found ${response.data.count} locations (fast mode)`);

      if (response.data.data.length > 0) {
        console.log("\n📍 First 3 Results:");
        response.data.data.slice(0, 3).forEach((place, i) => {
          console.log(`\n  ${i + 1}. ${place.name}`);
          console.log(`     Rating: ${place.rating || "N/A"} ⭐`);
          console.log(`     Address: ${place.address}`);
        });
      }
    }
  } catch (err) {
    log.error(`Maps scraping failed: ${err.message}`);
  }
}

/**
 * 🎯 Main Demo Flow
 */
async function runDemo() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║   🤖 AI Query Client - Complete API Demo                 ║
║   Server: http://localhost:5000                           ║
╚═══════════════════════════════════════════════════════════╝
  `);

  // Step 1: Submit query
  const result = await submitAIQuery();

  if (!result) {
    log.error("Could not submit query. Stopping demo.");
    process.exit(1);
  }

  // Wait a moment
  await new Promise(r => setTimeout(r, 2000));

  // Step 2: Get all queries
  await getAllQueries();

  // Wait a moment
  await new Promise(r => setTimeout(r, 1000));

  // Step 3: Get specific query details
  if (result && result.mongodbId) {
    await getQueryDetails(result.mongodbId);
  }

  // Wait a moment
  await new Promise(r => setTimeout(r, 1000));

  // Step 4: Bonus - Try maps scraping
  await scrapeMaps();

  console.log(`
╔═══════════════════════════════════════════════════════════╗
║   ✅ Demo Complete!                                       ║
║   Check the ImageKit URL to download your Excel file     ║
╚═══════════════════════════════════════════════════════════╝
  `);
}

// Run the demo
runDemo().catch(err => {
  log.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
