# 🚀 Google Maps Scraper + AI with Excel & ImageKit

A powerful Node.js server that combines Google Maps scraping with OpenRouter AI integration, featuring Excel export, ImageKit cloud storage, and MongoDB persistence.

## ✨ Features

- **🗺️ Google Maps Scraper** - Fast and full scraping modes for location data
- **🤖 AI Query Variations** - Generates 10 natural variations of your search query
- **📊 Excel Export** - Combined results from all 10 scrapes in one formatted file
- **🖼️ ImageKit Upload** - Cloud storage with automatic URL management
- **💾 MongoDB Storage** - Persistent storage of queries, variations, results, and file URLs
- **📋 Query History** - Retrieve all past scraping operations

## 🛠️ Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
```

3. **Update `.env` with your credentials:**
   - OpenRouter API Key (from https://openrouter.ai/keys)
   - MongoDB URI (local or Atlas)
   - ImageKit credentials (from https://imagekit.io/dashboard)

4. **Start MongoDB** (if local):
```bash
mongod
```

5. **Run the server:**
```bash
npm start
```

## 📚 API Endpoints

### 🗺️ Maps Scraping

#### Fast Scrape
```
GET /api/maps?q=coffee shops near me
```
Returns quick list of locations.

#### Full Scrape
```
GET /api/full?q=coffee shops near me
```
Returns detailed information for each location.

---

## 🤖 Maps Scraping with AI Query Variations (NEW)

### Scrape Google Maps (10 Variations + Excel Export)
```
POST /api/scrape-maps

Headers:
Content-Type: application/json

Body:
{
  "query": "restaurants in NYC"
}
```

**How it works:**
1. Backend uses AI to generate 10 natural variations of your query
2. Scrapes Google Maps for each variation
3. Combines all results (100+ locations)
4. Creates formatted Excel file with all results
5. Uploads to ImageKit and returns URL
6. Stores in MongoDB

**Response:**
```json
{
  "success": true,
  "message": "Scraping completed successfully",
  "originalQuery": "restaurants in NYC",
  "queryVariations": 10,
  "totalResults": 127,
  "excelFileUrl": "https://ik.imagekit.io/your_id/maps_scrape/restaurants_in_NYC_1234567890.xlsx",
  "mongodbId": "507f1f77bcf86cd799439011",
  "createdAt": "2024-03-28T10:30:00.000Z"
}
```

---

### Get Previous Scraped Data
```
GET /api/scrape-history
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "originalQuery": "restaurants in NYC",
      "queryVariations": ["best restaurants", "Italian restaurants", "cheap restaurants", ...],
      "allResults": [... combined results ...],
      "excelFileUrl": "https://ik.imagekit.io/...",
      "totalResults": 127,
      "createdAt": "2024-03-28T10:30:00.000Z"
    }
  ]
}
```

---

## 🔄 How It Works

1. **Submit a query** to `/api/scrape-maps` (e.g., "restaurants in NYC")
2. **AI generates 10 variations** using OpenRouter (e.g., "best restaurants", "Italian restaurants", etc.)
3. **Scrapes Google Maps 10 times** - one for each variation
4. **Combines all results** (100+ locations combined from 10 searches)
5. **Creates Excel file** with formatted data (Query Variation | Name | Rating | Address | Phone | Website)
6. **Uploads to ImageKit** and gets public download URL
7. **Stores in MongoDB** with all metadata
8. **Returns URL** for frontend to fetch/download

## 📊 Excel File Structure

The generated Excel file contains:
- Original query and generation timestamp
- All 10 query variations used
- Combined results from all 10 scraping operations
- Columns: Query Variation | Name | Rating | Address | Phone | Website | Category | URL
- Auto-formatted columns for readability
- Professional styling with headers

## 🔐 Environment Variables

```env
OPENROUTER_API_KEY=sk_***
MONGODB_URI=mongodb://localhost:27017/ai_queries
IMAGEKIT_PUBLIC_KEY=public_***
IMAGEKIT_PRIVATE_KEY=private_***
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/***
PORT=5000
```

## 📦 Dependencies

- **express** - Web framework
- **cors** - Cross-origin support
- **axios** - HTTP client for API calls
- **exceljs** - Excel file generation
- **imagekit** - Cloud storage client
- **mongoose** - MongoDB ODM
- **playwright** - Web scraping
- **fs-extra** - File system utilities

## 🚀 Example Usage

```bash
# Scrape with 10 AI-generated variations
curl -X POST http://localhost:5000/api/scrape-maps \
  -H "Content-Type: application/json" \
  -d '{
    "query": "coffee shops in NYC"
  }'

# Get all previous scrapes
curl http://localhost:5000/api/scrape-history

# Original Maps endpoints still work
curl "http://localhost:5000/api/maps?q=restaurants%20in%20NYC"
curl "http://localhost:5000/api/full?q=restaurants%20in%20NYC"
```

## 🐛 Troubleshooting

**MongoDB Connection Error:**
- Ensure MongoDB is running locally or update MONGODB_URI with Atlas connection

**ImageKit Upload Failed:**
- Verify ImageKit credentials in `.env`
- Check private key format

**OpenRouter API Error:**
- Confirm API key is valid
- Check request rate limits

## 📝 License

MIT

## 🤝 Support

For issues or questions, check the API endpoint responses for detailed error messages.
