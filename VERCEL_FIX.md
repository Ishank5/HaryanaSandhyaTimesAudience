# Fixing Vercel Meta Tags Issue

## Problem
The debugger is showing static HTML meta tags (logo2.png.jpg) instead of article-specific meta tags.

## Root Cause
Vercel might be serving the static `article.html` file instead of routing through the serverless function.

## Solution Steps

### 1. Delete/Rename Static article.html
The static file needs to be removed so Vercel's rewrite rule works:

```bash
# The file has already been moved to article.html.backup
# Make sure article.html doesn't exist in your repo
```

### 2. Verify Rewrite Rule
The `vercel.json` should have:
```json
{
  "rewrites": [
    {
      "source": "/article.html",
      "destination": "/api/article"
    }
  ]
}
```

### 3. Test the API Directly
Visit: `https://your-site.vercel.app/api/article?id=YOUR_ARTICLE_ID`

You should see HTML with meta tags. If you see an error, check Vercel function logs.

### 4. Clear Cache
After redeploying:
- Facebook Debugger: Use "Scrape Again" button
- WhatsApp: The cache will update automatically after some time

## Debugging

1. **Check Vercel Function Logs:**
   - Go to Vercel Dashboard → Your Project → Deployments
   - Click on latest deployment → Functions tab
   - Check for any errors in `api/article`

2. **Test Function Directly:**
   - Visit: `https://your-site.vercel.app/api/article?id=ARTICLE_ID`
   - You should see HTML with meta tags
   - Check page source - should have `og:image` with article image URL

3. **Check if Rewrite Works:**
   - Visit: `https://your-site.vercel.app/article.html?id=ARTICLE_ID`
   - Should route to the API function
   - Check browser DevTools Network tab - response should come from `/api/article`

## Common Issues

### Issue 1: Function not being called
**Solution:** Make sure `article.html` doesn't exist as a static file

### Issue 2: CORS error fetching from Firestore
**Solution:** Check Firestore security rules allow read access

### Issue 3: Image URL is empty
**Solution:** Check article in Firestore has `imageUrl` field populated

## Quick Fix Commands

```bash
# Make sure article.html is deleted/moved
cd HaryanaSandhyaTimesAudience
rm article.html  # If it exists

# Commit and push
git add .
git commit -m "Remove static article.html, use API only"
git push

# Vercel will auto-redeploy
```

