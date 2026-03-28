# 🚀 Complete Implementation Guide

## Overview

This implementation adds the following to your existing server:

### ✨ New Features Added
1. **OpenRouter AI Integration** - Call any AI model 10 times per query
2. **Excel Generation** - Automatically create formatted Excel files
3. **ImageKit Upload** - Cloud storage with public URLs
4. **MongoDB Storage** - Persistent data with query retrieval
5. **RESTful API** - Query management endpoints

---

## 🔧 Setup Instructions

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Get API Keys

#### OpenRouter API
1. Go to https://openrouter.ai/keys
2. Create new API key
3. Copy the key

#### ImageKit 
1. Go to https://imagekit.io/dashboard
2. Create new account (free tier available)
3. Get:
   - Public Key
   - Private Key
   - URL Endpoint (e.g., https://ik.imagekit.io/your_id)

#### MongoDB
- **Local**: Install MongoDB Community Edition
- **Atlas**: Create free cluster at https://www.mongodb.com/cloud/atlas

### Step 3: Configure Environment
Create `.env` file:
```env
OPENROUTER_API_KEY=sk_your_key_here
MONGODB_URI=mongodb://localhost:27017/ai_queries
IMAGEKIT_PUBLIC_KEY=your_public_key
IMAGEKIT_PRIVATE_KEY=your_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
PORT=5000
```

### Step 4: Start Server
```bash
npm start
```

---

## 📌 API Usage Examples

### Example 1: Submit AI Query (Main Feature)

**Request:**
```bash
curl -X POST http://localhost:5000/api/ai-query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the advantages and disadvantages of microservices architecture?",
    "queryName": "microservices-analysis"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "AI query processed successfully",
  "queryName": "microservices-analysis",
  "responseCount": 10,
  "imageKitUrl": "https://ik.imagekit.io/your_id/ai_responses/microservices-analysis_1711613400000.xlsx",
  "mongodbId": "507f1f77bcf86cd799439011",
  "createdAt": "2024-03-28T10:30:00.000Z"
}
```

**What Happens:**
1. Your query is sent to OpenRouter AI 10 times
2. Each call has slightly different temperature (0.7 to 1.0)
3. All 10 responses are collected
4. An Excel file is generated with all responses
5. Excel file is uploaded to ImageKit
6. MongoDB stores the query data and ImageKit URL
7. The ImageKit URL is returned for download

---

### Example 2: Get All Stored Queries

**Request:**
```bash
curl http://localhost:5000/api/ai-queries
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "queryName": "microservices-analysis",
      "responses": [
        "Microservices advantages: 1. Scalability...",
        "Benefits of microservices: Independent...",
        ...
      ],
      "excelFileUrl": "https://ik.imagekit.io/your_id/ai_responses/microservices-analysis_1711613400000.xlsx",
      "createdAt": "2024-03-28T10:30:00.000Z"
    }
  ]
}
```

---

### Example 3: Get Single Query Details

**Request:**
```bash
curl http://localhost:5000/api/ai-queries/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "queryName": "microservices-analysis",
    "responses": [...10 responses...],
    "excelFileUrl": "https://ik.imagekit.io/...",
    "createdAt": "2024-03-28T10:30:00.000Z"
  }
}
```

---

### Example 4: Original Maps Scraping (Still Works!)

**Fast Mode:**
```bash
curl "http://localhost:5000/api/maps?q=best%20restaurants%20in%20NYC"
```

**Full Mode:**
```bash
curl "http://localhost:5000/api/full?q=best%20restaurants%20in%20NYC"
```

---

## 🎯 Complete Workflow

### Manual Flow (Using cURL)

```bash
# 1. Submit query
RESPONSE=$(curl -X POST http://localhost:5000/api/ai-query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Best practices for Docker deployment",
    "queryName": "docker-deployment"
  }')

# 2. Extract ImageKit URL from response
IMAGEKIT_URL=$(echo $RESPONSE | grep -o '"imageKitUrl":"[^"]*' | cut -d'"' -f4)

# 3. Download Excel file
curl $IMAGEKIT_URL -o docker-deployment.xlsx

# 4. View all queries
curl http://localhost:5000/api/ai-queries | jq
```

### Programmatic Flow (Node.js)

```javascript
const axios = require("axios");

// Submit AI query
const result = await axios.post("http://localhost:5000/api/ai-query", {
  query: "Explain JWT authentication in detail",
  queryName: "jwt-auth-guide"
});

console.log("Excel file URL:", result.data.imageKitUrl);
console.log("MongoDB ID:", result.data.mongodbId);

// Get all queries
const queries = await axios.get("http://localhost:5000/api/ai-queries");
console.log("Total queries stored:", queries.data.count);

// Get specific query
const query = await axios.get(`http://localhost:5000/api/ai-queries/${result.data.mongodbId}`);
console.log("All 10 responses:", query.data.data.responses);
```

---

## 📊 Generated Excel File Structure

The Excel file contains:

| Column | Content |
|--------|---------|
| A | Query Name |
| B | Query Name Value |
| A | Generated At |
| B | Timestamp |
| A | Response # |
| B | Content |
| A | 1 |
| B | First AI response |
| A | 2 |
| B | Second AI response |
| ... | ... |
| A | 10 |
| B | Tenth AI response |

**Formatting:**
- Auto-fit columns (A: 15px, B: 80px)
- Header row: Bold + Gray background
- Proper date formatting
- Clean layout

---

## 🔐 Security Considerations

1. **Never commit `.env` to version control**
2. **Rotate API keys regularly**
3. **Use environment variables in production**
4. **Validate query input on backend**
5. **Rate limit requests if needed**
6. **Use HTTPS in production**

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** 
- Local: `mongod` must be running
- Atlas: Check connection string in `.env`

### ImageKit Upload Failed
```
Error: Invalid credentials
```
**Solution:**
- Verify ImageKit keys in `.env`
- Check that private key format is correct

### OpenRouter API Error
```
Error: 401 Unauthorized
```
**Solution:**
- Verify API key in `.env`
- Check that key has not expired
- Ensure budget limits not reached

### Port Already in Use
```
Error: listen EADDRINUSE :::5000
```
**Solution:**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :5000   # Windows
taskkill /PID <PID> /F
```

---

## 📈 Monitoring & Logging

The server logs all major operations:

```
✅ Response 1/10 received
✅ Response 2/10 received
...
✅ Excel file created: ai_query_1711613400000.xlsx
✅ Uploaded to ImageKit: https://ik.imagekit.io/...
✅ Saved to MongoDB with ID: 507f1...
🧹 Cleaned up temporary files
```

Check for these logs to verify each step.

---

## 🚀 Advanced Usage

### Custom AI Model
Edit `server.js` line ~140 to change model:
```javascript
model: "gpt-4",  // Change from "openrouter/auto"
```

### Batch Processing
```javascript
const queries = [
  { query: "React patterns", queryName: "react" },
  { query: "Vue patterns", queryName: "vue" },
  { query: "Angular patterns", queryName: "angular" }
];

for (const q of queries) {
  await axios.post("http://localhost:5000/api/ai-query", q);
  await new Promise(r => setTimeout(r, 2000)); // Rate limiting
}
```

### Export to Different Format
Modify the Excel generation to support CSV, JSON, etc.

---

## 📞 Support & Questions

1. Check MongoDB is running
2. Verify all API keys in `.env`
3. Check browser console for network errors
4. Review server logs for detailed errors
5. Test with provided `example-client.js`

---

## 📝 File Structure

```
.
├── server.js                 # Main server (UPDATED)
├── package.json             # Dependencies (UPDATED)
├── .env.example             # Template for credentials
├── .env                      # Your credentials (create this)
├── README.md                # Full documentation
├── GUIDE.md                 # This file
├── example-client.js        # Demo client
├── setup.sh                 # Setup script (Linux/Mac)
└── setup.bat               # Setup script (Windows)
```

---

## ✅ Verification Checklist

- [ ] All dependencies installed (`npm install`)
- [ ] `.env` file created with all keys
- [ ] MongoDB running (local or Atlas)
- [ ] ImageKit account created & keys added
- [ ] OpenRouter API key obtained
- [ ] Server starts without errors (`npm start`)
- [ ] Can make requests to `/api/ai-query`
- [ ] Excel files generated successfully
- [ ] MongoDB storing data
- [ ] ImageKit URLs working

Happy coding! 🚀
