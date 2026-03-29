const express = require("express");
const cors = require("cors");
const { chromium } = require("playwright");
const axios = require("axios");
const ExcelJS = require("exceljs");
const ImageKit = require("imagekit");
const mongoose = require("mongoose");
const fs = require("fs-extra");
const path = require("path");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json({
  limit: '10mb'
}));

/**
 * ⚙ CONFIG
 */
const CONCURRENCY = 4;
const TIMEOUT = 60000;
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Get base URL for Render compatibility
const BASE_URL = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL || `http://localhost:${PORT}`;

// 🔑 API KEYS & CONFIG (Load from environment)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MONGODB_URI = process.env.MONGODB_URI;

// ⚠️ Validate required environment variables
const missingVars = [];
if (!OPENROUTER_API_KEY) missingVars.push("OPENROUTER_API_KEY");
if (!MONGODB_URI) missingVars.push("MONGODB_URI");
if (!process.env.IMAGEKIT_PUBLIC_KEY) missingVars.push("IMAGEKIT_PUBLIC_KEY");
if (!process.env.IMAGEKIT_PRIVATE_KEY) missingVars.push("IMAGEKIT_PRIVATE_KEY");
if (!process.env.IMAGEKIT_URL_ENDPOINT) missingVars.push("IMAGEKIT_URL_ENDPOINT");

if (missingVars.length > 0) {
  console.error("❌ ERROR: Missing required environment variables:", missingVars.join(", "));
  console.error("⚠️  Please set them in your Render environment settings");
  if (NODE_ENV === "production") {
    process.exit(1);
  }
}

// 🔐 Rate Limiting Middleware
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"), // 100 requests per windowMs
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", limiter);

// 🖼️ ImageKit Configuration
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

/**
 * 📦 MONGODB SCHEMA
 */
const scrapeSchema = new mongoose.Schema({
  originalQuery: String, // Original query from user
  excelFileUrl: String, // ImageKit URL
  createdAt: { type: Date, default: Date.now }
});

const ScrapeModel = mongoose.model("MapsScrape", scrapeSchema);

/**
 * 🔌 MONGODB CONNECTION
 */
async function connectDB() {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
      console.log("✅ MongoDB connected");
    }
  } catch (err) {
    console.error("❌ MongoDB error:", err.message);
  }
}

/**
 * 🤖 GENERATE 10 RELATED LOCATION VARIATIONS USING AI
 */
async function generateQueryVariations(baseQuery, count = 10) {
  try {
    console.log(`🤖 Using OpenRouter AI to generate ${count} location variations...`);
    console.log(`📝 API Key: ${OPENROUTER_API_KEY.substring(0, 20)}...`);
    
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: `Generate exactly ${count} location-based search queries related to the query: "${baseQuery}". 
            Include different areas, localities, and related places. 
            Return ONLY a JSON array with ${count} queries, nothing else.
            Example format: ["${baseQuery} in area1", "${baseQuery} in area2", ...]
            Generate real or realistic sounding locations related to where "${baseQuery}" would be found.`
          }
        ],
        temperature: 0.7
      },
      {
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": BASE_URL,
          "X-Title": "Maps Scraper",
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    let variations = [];
    try {
      const content = response.data.choices[0]?.message?.content || "[]";
      console.log(`📦 AI Response:`, content.substring(0, 100));
      variations = JSON.parse(content);
      if (!Array.isArray(variations)) {
        console.log(`⚠️ Not an array, converting...`);
        variations = [baseQuery];
      }
    } catch (e) {
      console.log(`⚠️ AI response parsing error:`, e.message);
      variations = Array(count).fill(baseQuery);
    }

    console.log(`✅ Generated ${variations.length} location variations`);
    return variations.slice(0, count);
  } catch (err) {
    console.error(`❌ AI Error (${err.response?.status || err.code}):`, err.response?.data?.error || err.message);
    
    // Fallback: Generate local variations
    console.log(`⚠️ Falling back to local generation...`);
    const localVariations = generateLocalQueryVariations(baseQuery, count);
    return localVariations;
  }
}

/**
 * � LOCAL FALLBACK - GENERATE LOCATION VARIATIONS
 */
function generateLocalQueryVariations(baseQuery, count = 10) {
  const areas = [];
  for (let i = 1; i <= count; i++) {
    areas.push(` in area ${i}`);
  }

  const variations = areas.map(area => `${baseQuery}${area}`);
  console.log(`✅ Generated ${variations.length} local location variations`);
  return variations;
}

/**
 * �📊 CREATE EXCEL FILE FROM SCRAPED MAPS DATA
 */
async function createExcelFile(originalQuery, queryVariations, allResults) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Google Maps Results");

  // Add headers with metadata
  const row1 = worksheet.addRow(["Original Query", originalQuery]);
  row1.getCell(1).font = { bold: true, size: 12 };
  
  const row2 = worksheet.addRow(["Generated At", new Date().toISOString()]);
  row2.getCell(1).font = { bold: true, size: 12 };
  
  const row3 = worksheet.addRow(["Total Variations", queryVariations.length]);
  row3.getCell(1).font = { bold: true, size: 12 };
  
  const row4 = worksheet.addRow(["Total Results", allResults.length]);
  row4.getCell(1).font = { bold: true, size: 12 };
  
  worksheet.addRow([]); // Empty row

  // Add all generated variations with bright formatting
  const varHeaderRow = worksheet.addRow(["GENERATED VARIATIONS"]);
  varHeaderRow.getCell(1).font = { bold: true, size: 11, color: { argb: "FFFFFF" } };
  varHeaderRow.getCell(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF00B050" }
  };
  
  queryVariations.forEach((variation, index) => {
    const varRow = worksheet.addRow([`${index + 1}. ${variation}`]);
    varRow.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE2EFDA" }
    };
  });
  worksheet.addRow([]); // Empty row

  // Add column headers
  worksheet.addRow([
    "Query Variation",
    "Name",
    "Rating",
    "Address",
    "Phone",
    "Website",
    "Category",
    "URL"
  ]);

  // Add results
  allResults.forEach((result) => {
    worksheet.addRow([
      result.queryVariation || "",
      result.name || "",
      result.rating || "",
      result.address || "",
      result.phone || "",
      result.website || "",
      result.category || "",
      result.url || ""
    ]);
  });

  // Format worksheet
  worksheet.columns = [
    { width: 20 },
    { width: 25 },
    { width: 10 },
    { width: 30 },
    { width: 15 },
    { width: 30 },
    { width: 15 },
    { width: 35 }
  ];

  // Style column headers (calculate row based on variations count)
  const headerRowNum = 8 + queryVariations.length;
  worksheet.getRow(headerRowNum).font = { bold: true };
  worksheet.getRow(headerRowNum).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4472C4" }
  };
  worksheet.getRow(headerRowNum).font.color = { argb: "FFFFFFFF" };

  const fileName = `maps_scrape_${Date.now()}.xlsx`;
  const filePath = path.join(__dirname, fileName);

  await workbook.xlsx.writeFile(filePath);
  console.log(`✅ Excel file created: ${fileName}`);

  return filePath;
}

/**
 * 🖼️ UPLOAD TO IMAGEKIT
 */
async function uploadToImageKit(filePath, originalQuery) {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const fileName = `maps_scrape/${originalQuery.replace(/\\s+/g, "_")}_${Date.now()}.xlsx`;

    const result = await imagekit.upload({
      file: fileBuffer,
      fileName: fileName,
      tags: ["maps-scrape", originalQuery]
    });

    console.log(`✅ Uploaded to ImageKit: ${result.url}`);
    return result.url;

  } catch (err) {
    console.error("❌ ImageKit upload error:", err.message);
    throw err;
  }
}

/**
 * 💾 SAVE TO MONGODB
 */
async function saveScrapeToMongoDB(originalQuery, imageKitUrl) {
  try {
    const scrape = new ScrapeModel({
      originalQuery,
      excelFileUrl: imageKitUrl
    });

    await scrape.save();
    console.log(`✅ Saved to MongoDB with ID: ${scrape._id}`);
    return scrape;

  } catch (err) {
    console.error("❌ MongoDB save error:", err.message);
    throw err;
  }
}

/**
 * ⚡ CONTEXT OPTIMIZATION
 */
async function createFastContext(browser) {
  const context = await browser.newContext();

  await context.route("**/*", route => {
    const type = route.request().resourceType();
    if (["image", "stylesheet", "font", "media"].includes(type)) {
      route.abort();
    } else {
      route.continue();
    }
  });

  return context;
}

/**
 * ⚡ SCROLL
 */
async function autoScroll(page) {
  await page.evaluate(async () => {
    const panel = document.querySelector('div[role="feed"]');

    for (let i = 0; i < 30; i++) {
      panel.scrollBy(0, 3000);
      await new Promise(r => setTimeout(r, 400));
    }
  });
}

/**
 * ⚡ GET LINKS
 */
async function getLinks(page, query) {
  const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: TIMEOUT });
  await page.waitForSelector('div[role="feed"]');

  await autoScroll(page);

  const links = await page.$$eval(".Nv2PK a", els =>
    [...new Set(els.map(e => e.href).filter(Boolean))]
  );

  return links.slice(0, 50);
}

/**
 * ⚡ FAST SCRAPER (LIST VIEW)
 */
async function fastScrape(query) {
  const browser = await chromium.launch({
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu"
  ]
});
  const context = await createFastContext(browser);
  const page = await context.newPage();

  await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(query)}`);
  await page.waitForSelector('div[role="feed"]');

  await autoScroll(page);

  const results = await page.$$eval(".Nv2PK", cards =>
    cards.map(card => {
      const clean = txt =>
        txt?.replace(/[^\x20-\x7E]/g, "").trim() || "";

      const name = clean(card.querySelector(".qBF1Pd")?.innerText);
      const rating = clean(card.querySelector(".MW4etd")?.innerText);

      const info = [...card.querySelectorAll(".W4Efsd span")]
        .map(e => clean(e.innerText))
        .filter(Boolean);

      const filtered = info.filter(t =>
        !t.match(/^\d+(\.\d+)?$/) &&
        !t.toLowerCase().includes("review") &&
        !t.includes("★")
      );

      const address = filtered.sort((a, b) => b.length - a.length)[0] || "";

      return {
        name,
        rating,
        address,
        link: card.querySelector("a")?.href || ""
      };
    })
  );

  await browser.close();
  return results;
}

/**
 * 🧠 DETAIL SCRAPER (FINAL FIXED)
 */
async function scrapeOne(context, link) {
  const page = await context.newPage();

  try {
    // ✅ IMPORTANT CHANGE
    await page.goto(link, { waitUntil: "networkidle", timeout: TIMEOUT });

    await page.waitForSelector("h1", { timeout: 15000 });
    await page.waitForTimeout(2500);

    const data = await page.evaluate(() => {
      const clean = txt =>
        txt?.replace(/[^\x20-\x7E]/g, "").trim() || "";

      const getText = sel =>
        clean(document.querySelector(sel)?.innerText);

      const getAttr = (sel, attr) =>
        document.querySelector(sel)?.getAttribute(attr) || "";

      const allText = document.body.innerText;

      // ⭐ RATING + REVIEWS
      let rating = "";
      let reviews = "";

      const ratingEl = document.querySelector('div[role="img"]');
      if (ratingEl) {
        const label = ratingEl.getAttribute("aria-label") || "";
        const m = label.match(/([\d.]+).*?([\d,]+)/);
        if (m) {
          rating = m[1];
          reviews = m[2];
        }
      }

      if (!rating) {
        rating = getText(".MW4etd");
      }

      if (!reviews) {
        const m = allText.match(/([\d,]+)\s+reviews/);
        if (m) reviews = m[1];
      }

      // 📍 ADDRESS
      const address = getText('[data-item-id="address"]');

      // 📞 PHONE
      let phone = getText('[data-item-id="phone"]');
      if (!phone) {
        const m = allText.match(/\+?\d[\d\s-]{8,}/);
        if (m) phone = clean(m[0]);
      }

      // 🌐 WEBSITE
      let website = getAttr('a[data-item-id="authority"]', "href");
      if (!website) {
        const links = [...document.querySelectorAll("a")];
        const ext = links.find(a =>
          a.href &&
          !a.href.includes("google") &&
          a.href.startsWith("http")
        );
        if (ext) website = ext.href;
      }

      // 📌 CATEGORY
      const category =
        getText('button[jsaction="pane.rating.category"]') ||
        getText(".DkEaL");

      // 📍 COORDINATES (🔥 FINAL FIX)
      let latitude = "";
      let longitude = "";

      const url = window.location.href;

      // Method 1
      let m1 = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (m1) {
        latitude = m1[1];
        longitude = m1[2];
      }

      // Method 2 (MOST IMPORTANT)
      if (!latitude) {
        let m2 = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
        if (m2) {
          latitude = m2[1];
          longitude = m2[2];
        }
      }

      // Method 3 fallback
      if (!latitude) {
        const meta = document.querySelector('meta[property="og:image"]')?.content;
        const m3 = meta?.match(/center=(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (m3) {
          latitude = m3[1];
          longitude = m3[2];
        }
      }

      return {
        name: getText("h1"),
        rating,
        reviews,
        address,
        phone,
        website,
        category,
        latitude,
        longitude,
        url
      };
    });

    await page.close();
    return data;

  } catch (err) {
    console.log("❌ Failed:", link);
    await page.close();
    return null;
  }
}

/**
 * 🚀 FULL SCRAPER
 */
async function fullScrape(query) {
  const browser = await chromium.launch({
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu"
  ]
});
  const context = await createFastContext(browser);

  const page = await context.newPage();

  let links = await getLinks(page, query);
  await page.close();

  let results = [];
  let index = 0;

  async function worker() {
    while (index < links.length) {
      const link = links[index++];

      let data = null;

      for (let i = 0; i < 3; i++) {
        data = await scrapeOne(context, link);
        if (data && data.name) break;
      }

      if (data) {
        console.log("✔", data.name);
        results.push(data);
      }

      await new Promise(r => setTimeout(r, 400)); // anti-block
    }
  }

  await Promise.all(
    Array.from({ length: CONCURRENCY }, () => worker())
  );

  await browser.close();
  return results;
}

/**
 * 🌐 ROUTES
 */
app.get("/", (req, res) => {
  res.send("🚀 FINAL Google Maps Scraper (LAT/LNG FIXED) + 🤖 AI with ImageKit + MongoDB");
});

app.get("/api/maps", async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: "Missing query" });

  const data = await fastScrape(q);

  res.json({
    success: true,
    mode: "fast",
    count: data.length,
    data
  });
});

app.get("/api/full", async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: "Missing query" });

  const data = await fullScrape(q);

  res.json({
    success: true,
    mode: "full",
    count: data.length,
    data
  });
});

/**
 * 🌐 SCRAPE GOOGLE MAPS WITH 10 QUERY VARIATIONS
 */
app.post("/api/scrape-maps", async (req, res) => {
  try {
    const { query, count = 10 } = req.body;

    // 🔐 Input Validation
    if (!query) {
      return res.status(400).json({
        success: false,
        error: "Query parameter is required"
      });
    }

    // Validate query string
    if (typeof query !== "string") {
      return res.status(400).json({
        success: false,
        error: "Query must be a string"
      });
    }

    if (query.trim().length < 2 || query.trim().length > 200) {
      return res.status(400).json({
        success: false,
        error: "Query must be between 2 and 200 characters"
      });
    }

    // Validate count
    if (!Number.isInteger(count) || count < 1 || count > 20) {
      return res.status(400).json({
        success: false,
        error: "Count must be an integer between 1 and 20"
      });
    }

    // Sanitize query
    const sanitizedQuery = query.trim().replace(/[<>;"']/g, "");

    await connectDB();

    console.log(`\n🚀 Starting Maps Scrape for: "${sanitizedQuery}"\n`);

    // Step 1: Generate query variations using AI
    console.log(`🤖 Generating ${count} query variations using AI...`);
    const queryVariations = await generateQueryVariations(sanitizedQuery, count);
    console.log("Query Variations:", queryVariations);

    // Step 2: Scrape Google Maps for each variation
    console.log(`\n📍 Scraping Google Maps for ${queryVariations.length} variations...\n`);
    const allResults = [];

    for (let i = 0; i < queryVariations.length; i++) {
      const variation = queryVariations[i];
      console.log(`\n⏳ Scraping variation ${i + 1}/${queryVariations.length}: "${variation}"`);
      
      try {
        const scrapedData = await fullScrape(variation);
        
        // Add query variation to each result
        const resultsWithVariation = scrapedData.map(item => ({
          ...item,
          queryVariation: variation
        }));
        
        allResults.push(...resultsWithVariation);
        console.log(`✅ Got ${scrapedData.length} detailed results from variation ${i + 1}`);
      } catch (err) {
        console.log(`⚠️ Error scraping variation ${i + 1}: ${err.message}`);
      }

      // Delay between scrapes to avoid blocking
      await new Promise(r => setTimeout(r, 2000));
    }

    console.log(`\n📊 Total results collected: ${allResults.length}\n`);
    
    // Debug: Log first few results to verify queryVariation
    if (allResults.length > 0) {
      console.log(`📝 Sample results (first 3):`);
      allResults.slice(0, 3).forEach((r, i) => {
        console.log(`  ${i + 1}. Name: "${r.name}", QueryVariation: "${r.queryVariation}"`);
      });
    }

    // Step 3: Create Excel file
    console.log("📊 Creating Excel file...");
    const excelFilePath = await createExcelFile(query, queryVariations, allResults);

    // Step 4: Upload to ImageKit
    console.log("🖼️ Uploading to ImageKit...");
    const imageKitUrl = await uploadToImageKit(excelFilePath, query);

    // Step 5: Save to MongoDB
    console.log("💾 Saving to MongoDB...");
    const savedData = await saveScrapeToMongoDB(query, imageKitUrl);

    // Clean up temporary Excel file
    await fs.remove(excelFilePath);
    console.log("🧹 Cleaned up temporary files\n");

    res.json({
      success: true,
      message: "Scraping completed successfully",
      originalQuery: query,
      queryVariations: queryVariations.length,
      totalResults: allResults.length,
      excelFileUrl: imageKitUrl,
      mongodbId: savedData._id,
      createdAt: savedData.createdAt
    });

  } catch (err) {
    console.error("❌ Error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 📋 GET SCRAPING HISTORY
 */
app.get("/api/scrape-history", async (req, res) => {
  try {
    await connectDB();
    const scrapes = await ScrapeModel.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: scrapes.length,
      data: scrapes
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 🚀 START SERVER
 */

connectDB().catch(err => console.log("MongoDB connection warning:", err.message));

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║   🚀 Server running at " + BASE_URL + "         ║");
  console.log("║   ✅ Features:                            ║");
  console.log("║      - Google Maps Scraper                ║");
  console.log("║      - OpenRouter AI (10x calls)          ║");
  console.log("║      - Excel Export                       ║");
  console.log("║      - ImageKit Upload                    ║");
  console.log("║      - MongoDB Storage                    ║");
  console.log("║   🌍 Environment: " + NODE_ENV + "                         ║");
  console.log("╚════════════════════════════════════════╝\n");
});

// ✅ Graceful shutdown for Render
process.on("SIGTERM", async () => {
  console.log("📋 SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error("❌ Force shutdown due to timeout");
    process.exit(1);
  }, 10000);
});