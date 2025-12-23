# Quick Start: Deploy to Vercel

## 🚀 3-Step Setup

### Step 1: Push Code to GitHub
```bash
cd HaryanaSandhyaTimesAudience
git add .
git commit -m "Add Vercel serverless function for meta tags"
git push
```

### Step 2: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click "Add New..." → "Project"
3. Select your repository
4. **Important:** Set Root Directory to: `HaryanaSandhyaTimesAudience`
5. Click "Deploy"
6. Wait 1-2 minutes for deployment

### Step 3: Test
1. Visit your deployed site: `https://your-project.vercel.app`
2. Open an article: `/article.html?id=YOUR_ARTICLE_ID`
3. Share it on WhatsApp - you should see the preview! 🎉

## 📁 Files Created

✅ `api/article.js` - Serverless function for meta tags
✅ `vercel.json` - Vercel configuration
✅ `article-view.html` - Static article page for users
✅ `VERCEL_SETUP.md` - Detailed setup guide

## 🔧 How Sharing Works Now

**WhatsApp/Facebook/Twitter:**
- Only article **title** goes in the message
- Article **image and title** are loaded automatically from webpage meta tags
- No more manual image downloads needed!

**Example:**
- Message: "Your Article Title - https://yoursite.com/article.html?id=123"
- Preview shows: Article image + title automatically ✅

## 🐛 Troubleshooting

**Problem:** Meta tags not showing
**Solution:** Clear cache using:
- Facebook: https://developers.facebook.com/tools/debug/
- WhatsApp: Share link again after clearing cache

**Problem:** Serverless function error
**Solution:** Check Vercel logs in dashboard → Deployments → View Function Logs

## ✨ That's It!

Your site is now on Vercel with proper social media previews!

