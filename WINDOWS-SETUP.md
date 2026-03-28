# 🪟 Windows Setup Instructions

## Step-by-Step Setup for Windows Users

### 1️⃣ Prerequisites

**Install Node.js:**
1. Download from https://nodejs.org/
2. Choose LTS version
3. Run installer with default settings
4. Verify: Open PowerShell and run `node --version`

**Install MongoDB (Optional but recommended):**
1. Download from https://www.mongodb.com/try/download/community
2. Run installer with default settings
3. MongoDB will auto-start as Windows Service

**OR Use MongoDB Atlas (Cloud):**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster
4. Get connection string

---

### 2️⃣ Clone/Extract Project

```powershell
# Navigate to your project directory
cd c:\add\pp\web

# Check if files exist
ls
# Should show: server.js, package.json, .env.example, README.md, etc.
```

---

### 3️⃣ Install Dependencies

```powershell
# In PowerShell, navigate to project folder
cd c:\add\pp\web

# Install all npm packages
npm install

# This will create node_modules folder (takes 1-2 minutes)
```

---

### 4️⃣ Configure Credentials

**Step A: Create .env file**

Method 1 - Using PowerShell:
```powershell
Copy-Item .env.example .env
```

Method 2 - Using Notepad:
1. Right-click in folder
2. Click "New" → "Text Document"
3. Name it `.env`
4. Paste the content from `.env.example`

**Step B: Get API Keys**

1. **OpenRouter API Key:**
   - Go to https://openrouter.ai/keys
   - Sign up for free
   - Create API key
   - Copy the key

2. **ImageKit Credentials:**
   - Go to https://imagekit.io/dashboard
   - Sign up for free
   - In Dashboard, find:
     - Public Key (in Settings)
     - Private Key (in Settings)
     - URL Endpoint (in Settings)

3. **MongoDB URI:**
   - **Local:** `mongodb://localhost:27017/ai_queries`
   - **Atlas:** Get from connection string in cluster settings

**Step C: Edit .env file**

```powershell
# Open .env in Notepad
notepad .env
```

Fill in your credentials:
```env
OPENROUTER_API_KEY=sk_your_actual_key_here
MONGODB_URI=mongodb://localhost:27017/ai_queries
IMAGEKIT_PUBLIC_KEY=your_public_key_here
IMAGEKIT_PRIVATE_KEY=your_private_key_here
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
PORT=5000
```

Save and close!

---

### 5️⃣ Start MongoDB (if using local)

```powershell
# MongoDB service should auto-start
# To verify it's running:
Get-Service MongoDB | Select Status

# If not running, start it:
Start-Service MongoDB
```

**Skip if using MongoDB Atlas**

---

### 6️⃣ Start the Server

```powershell
# In PowerShell, in project folder
npm start

# You should see:
# 🚀 Server running at http://localhost:5000
# ✅ MongoDB connected
```

---

### 7️⃣ Test the Server

**Option A: Using PowerShell**

```powershell
# Open new PowerShell window

# Test basic endpoint
Invoke-WebRequest http://localhost:5000 | Select-Object StatusCode, Content

# Submit AI query
$body = @{
    query = "What is artificial intelligence?"
    queryName = "ai-definition"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:5000/api/ai-query `
  -Method POST `
  -Body $body `
  -ContentType "application/json" | Select-Object StatusCode, Content
```

**Option B: Using cURL (easier)**

```powershell
# Submit query
curl -X POST http://localhost:5000/api/ai-query `
  -H "Content-Type: application/json" `
  -d '{
    "query": "What is machine learning?",
    "queryName": "ml-intro"
  }'

# Get all queries
curl http://localhost:5000/api/ai-queries
```

**Option C: Using Demo Client**

```powershell
# In new PowerShell window
node example-client.js
```

---

## 📋 Common Windows Errors & Solutions

### Error: "npm is not recognized"
**Solution:** Restart PowerShell or Command Prompt after installing Node.js

### Error: "MongoDB service not running"
**Solution:**
```powershell
# Start MongoDB service
Start-Service MongoDB

# Or change to local? 
# Edit .env: MONGODB_URI=mongodb://localhost:27017/ai_queries
# Then start mongod manually
```

### Port 5000 already in use
**Solution:**
```powershell
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with the number shown above)
taskkill /PID 1234 /F
```

### "Cannot find module 'exceljs'"
**Solution:**
```powershell
# You forgot npm install, run:
npm install

# Or a specific module:
npm install exceljs
```

### ECONNREFUSED to MongoDB
**Solution:**
```powershell
# Start MongoDB service
Start-Service MongoDB

# Or use Atlas: Update MONGODB_URI in .env to Atlas connection string
```

### Cannot write .env file
**Solution:**
```powershell
# Use PowerShell directly:
Set-Content -Path .env -Value @"
OPENROUTER_API_KEY=your_key_here
MONGODB_URI=mongodb://localhost:27017/ai_queries
... (rest of content)
"@
```

---

## 🎯 Complete Workflow

```
1. npm install
   ↓
2. Create .env file
   ↓
3. Add API keys to .env
   ↓
4. npm start
   ↓
5. Server runs! 🚀
   ↓
6. Test with curl or example-client.js
   ↓
7. Open ImageKit URL to download Excel
```

---

## ✅ Verification Checklist

- [ ] Node.js installed (`node --version` shows version)
- [ ] Project folder: `cd c:\add\pp\web`
- [ ] Dependencies: `npm install` completed
- [ ] .env file created with 5 fields
- [ ] All API keys filled in
- [ ] MongoDB running (if local): `Get-Service MongoDB`
- [ ] Server starts: `npm start` → no errors
- [ ] Can access http://localhost:5000
- [ ] Can POST to /api/ai-query
- [ ] Excel file generates and downloads
- [ ] Query stored in MongoDB

---

## 🚀 Windows Terminal Tips

**Multiple PowerShell windows:**
```powershell
# Window 1: Start server
npm start

# Window 2: Run demo
node example-client.js

# Window 3: Check status
curl http://localhost:5000
```

**Keep server running:**
- Don't close PowerShell window while testing
- Server will stop when window is closed

**View actual API response:**
```powershell
curl http://localhost:5000/api/ai-queries | ConvertFrom-Json | ConvertTo-Json
```

---

## 🔒 Security Notes for Windows

1. **Don't commit .env to git:**
   ```powershell
   # .env is already in .gitignore (should be)
   ```

2. **Keep API keys secret:**
   - Never share .env file
   - Regenerate keys if accidentally shared
   - Use environment variables in production

3. **Windows Firewall:**
   - First run might ask for network access
   - Click "Allow" for Node.js

---

## 📞 Still Having Issues?

1. **Check all files exist:**
   ```powershell
   ls c:\add\pp\web
   ```

2. **Verify Node.js:**
   ```powershell
   node --version
   npm --version
   ```

3. **Check npm packages:**
   ```powershell
   npm list --depth=0
   ```

4. **View server logs:**
   - Server output shows all operations
   - Look for error messages
   - Screenshot errors for help

5. **Test each service separately:**
   - Ping OpenRouter ✓
   - Ping ImageKit ✓
   - Ping MongoDB ✓

---

**Happy coding on Windows! 🎉**
