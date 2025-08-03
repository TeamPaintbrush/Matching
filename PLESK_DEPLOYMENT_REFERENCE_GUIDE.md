# 🚀 Plesk Deployment Reference Guide
## Complete Guide for React/Node.js Apps with Git Integration

*Created: August 3, 2025*  
*Last Updated: August 3, 2025*

---

## 📋 Table of Contents
1. [Project Structure Requirements](#project-structure-requirements)
2. [Step-by-Step Deployment Process](#step-by-step-deployment-process)
3. [Common Issues & Solutions](#common-issues--solutions)
4. [Environment Configuration](#environment-configuration)
5. [Troubleshooting Checklist](#troubleshooting-checklist)
6. [VS Code Setup](#vs-code-setup)

---

## 🏗️ Project Structure Requirements

### ✅ Correct Structure for Plesk
Your project MUST have this structure for Plesk deployment:

```
your-project/
├── index.js                 # ⭐ CRITICAL: Node.js server in ROOT
├── package.json            # ⭐ CRITICAL: Contains ALL dependencies
├── .env                    # Environment variables (NO SECRETS)
├── build/                  # React production build
│   ├── index.html         # Production HTML
│   └── static/            # Compiled CSS/JS
├── src/                   # React source code
├── public/                # React public assets
└── node_modules/          # Dependencies (auto-generated)
```

### ❌ Common Structure Mistakes
- Having `backend/index.js` instead of root `index.js`
- Having separate frontend/backend repositories
- Development `index.html` in root (conflicts with build)
- Missing `"type": "module"` in package.json for ES modules

---

## 🔧 Step-by-Step Deployment Process

### Phase 1: Local Project Setup

#### 1. **Unify Frontend and Backend** (if separate)
```bash
# If you have separate repos, combine them:
cp backend/index.js ./index.js
cp backend/.env ./backend.env  # for reference only
```

#### 2. **Update package.json**
```json
{
  "name": "your-app",
  "type": "module",
  "scripts": {
    "start": "node index.js",        # ⭐ CRITICAL for Plesk
    "dev": "react-scripts start",    # Local development
    "build": "react-scripts build",  # Production build
    "server": "node index.js"        # Local server test
  },
  "dependencies": {
    // React dependencies
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-scripts": "5.0.1",
    // Backend dependencies
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "openai": "^4.20.1"  # Add your API packages
  }
}
```

#### 3. **Configure index.js Server**
```javascript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;  // Let Plesk manage port

app.use(cors());
app.use(express.json());

// ⭐ CRITICAL: Serve React build files
app.use(express.static(path.join(__dirname, 'build')));

// Your API routes here
app.post('/api/your-endpoint', (req, res) => {
  // Your API logic
});

// ⭐ CRITICAL: Catch-all for React routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

#### 4. **Configure .env** (NO SECRETS)
```env
# For Plesk production deployment - use relative URLs
REACT_APP_API_URL=
# Add your API keys in Plesk environment variables
OPENAI_API_KEY=
```

#### 5. **Build and Test Locally**
```bash
# Remove old files
rm -rf build dist node_modules

# Fresh install
npm install

# Build production version
npm run build

# Test server locally
npm run server
# Should work at http://localhost:3000 or your PORT
```

### Phase 2: Git Setup

#### 6. **Clean Git Repository**
```bash
# Remove development index.html if it exists
rm index.html  # Only if it conflicts with build/index.html

# Stage all changes
git add -A

# Commit
git commit -m "Configure for Plesk deployment"

# Push to GitHub
git push origin master
```

### Phase 3: Plesk Configuration

#### 7. **Domain Setup in Plesk**
1. Go to **Domains** → **Your Domain**
2. Enable **Node.js**

#### 8. **Git Integration**
1. Go to **Git** section
2. **Repository URL**: `https://github.com/YourUsername/YourRepo.git`
3. **Branch**: `master` or `main`
4. **Repository Path**: `/httpdocs`
5. Click **Pull Updates**

#### 9. **Node.js Configuration**
1. Go to **Node.js** section
2. **Node.js Version**: Latest stable (24.5.0+)
3. **Application Startup File**: `index.js` ⭐ CRITICAL
4. **Application Mode**: `production`
5. **Document Root**: `/httpdocs`

#### 10. **Environment Variables**
Add in Node.js → Environment Variables:
```
OPENAI_API_KEY=your-actual-api-key-here
NODE_ENV=production
```

#### 11. **Install Dependencies**
1. Click **NPM install** in Node.js section
2. Wait for completion

#### 12. **Restart Application**
1. Click **Restart App**
2. Test your site: `https://yourdomain.plesk.page`

---

## 🐛 Common Issues & Solutions

### Issue 1: "The file does not exist" - Application Startup File
**Problem**: Plesk can't find `index.js`  
**Solution**: 
- Ensure `index.js` is in repository ROOT, not in `/backend` folder
- Check Git pull was successful
- Verify file permissions

### Issue 2: Blank Page Loading
**Symptoms**: Page loads but shows blank white screen  
**Diagnosis**: Check F12 Developer Tools → Console  
**Solutions**:
- **MIME type error**: Remove development `index.html` from root
- **404 errors**: Check static file paths in build
- **JavaScript errors**: Check API endpoints and environment variables

### Issue 3: "Failed to load module script" Error
**Problem**: `Expected JavaScript module but got HTML`  
**Root Cause**: Development index.html conflicting with production build  
**Solution**: 
```bash
rm index.html  # Remove development file
git add -A && git commit -m "Remove development index.html"
git push origin master
```

### Issue 4: API Endpoints Not Working
**Problem**: 404 on `/api/*` requests  
**Solutions**:
- Check `index.js` has API routes defined
- Verify Node.js app is running (not just static files)
- Check environment variables for API keys

### Issue 5: Build Files Not Found
**Problem**: React app not loading, 404 on static files  
**Solutions**:
- Ensure `npm run build` was run before Git push
- Check `build/` folder exists in repository
- Verify static file serving in `index.js`

---

## ⚙️ Environment Configuration

### Development (.env.development)
```env
REACT_APP_API_URL=http://localhost:7777/api
OPENAI_API_KEY=your-dev-key
PORT=7777
```

### Production (Plesk Environment Variables)
```env
OPENAI_API_KEY=your-production-key
NODE_ENV=production
# PORT is managed by Plesk automatically
```

---

## ✅ Troubleshooting Checklist

### Before Deployment
- [ ] `index.js` exists in repository root
- [ ] `package.json` has `"start": "node index.js"`
- [ ] `npm run build` completed successfully
- [ ] Local server works: `npm run server`
- [ ] No API keys committed to Git
- [ ] No development `index.html` in root

### After Git Pull in Plesk
- [ ] Files visible in File Manager
- [ ] `index.js` exists and has correct content
- [ ] `build/` folder exists with static files
- [ ] `package.json` has all dependencies

### Node.js Configuration
- [ ] Application Startup File: `index.js`
- [ ] Application Mode: `production`
- [ ] Environment variables set (API keys)
- [ ] NPM install completed
- [ ] Application restarted

### Testing & Debugging
- [ ] Site loads without errors
- [ ] F12 Console shows no errors
- [ ] API endpoints respond correctly
- [ ] Network tab shows successful requests

---

## 💻 VS Code Setup

### Recommended Extensions
```json
{
  "recommendations": [
    "ms-vscode.vscode-json",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint"
  ]
}
```

### Git Configuration
```bash
# Set up Git credentials
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Connect to repository
git remote add origin https://github.com/YourUsername/YourRepo.git
```

### Useful VS Code Tasks
Create `.vscode/tasks.json`:
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Build for Production",
      "type": "shell",
      "command": "npm run build",
      "group": "build"
    },
    {
      "label": "Start Local Server",
      "type": "shell",
      "command": "npm run server",
      "group": "build",
      "isBackground": true
    },
    {
      "label": "Deploy to Git",
      "type": "shell",
      "command": "git add -A && git commit -m 'Deploy update' && git push origin master",
      "group": "build"
    }
  ]
}
```

---

## 🎯 Quick Reference Commands

### Local Development
```bash
# Start fresh
rm -rf node_modules build dist
npm install
npm run build
npm run server

# Deploy
git add -A
git commit -m "Your message"
git push origin master
```

### Plesk Deployment
1. **Git** → Pull Updates
2. **Node.js** → NPM install
3. **Node.js** → Restart App
4. Test site

---

## 📞 Emergency Troubleshooting

### If Site is Completely Broken
1. **Check Plesk Node.js logs** for errors
2. **Disable Node.js** temporarily to serve static files
3. **Rollback Git** to last working commit
4. **Check file permissions** in File Manager

### Quick Diagnostic Tools
- **F12 Developer Tools** → Console tab
- **F12 Developer Tools** → Network tab
- **View Page Source** to see what HTML is served
- **Plesk Node.js logs** for server errors

---

## 🏆 Success Indicators

### Your site is working correctly when:
- [ ] URL loads without blank page
- [ ] F12 Console shows no errors
- [ ] API endpoints return expected data
- [ ] React routing works (page refresh doesn't break)
- [ ] All static assets load (CSS, images, JS)

---

*Remember: When in doubt, use F12 Developer Tools - they'll show you exactly what's wrong!* 🔍

---

**Happy Deploying!** 🎉
