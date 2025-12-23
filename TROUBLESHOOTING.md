# Troubleshooting Vercel Meta Tags

## Issue: Still showing website logo instead of article image

### Step 1: Verify Static File is Removed
```bash
# Make sure article.html doesn't exist
ls -la article.html
# Should show: No such file or directory
```

If it exists, delete it:
```bash
rm article.html
```

### Step 2: Test API Function Directly
Visit: `https://your-site.vercel.app/api/article?id=YOUR_ARTICLE_ID`

**Expected:** You should see HTML with article-specific meta tags
**If you see error:** Check Vercel function logs

### Step 3: Check Vercel Deployment
1. Go to Vercel Dashboard
2. Check latest deployment logs
3. Look for errors in `/api/article` function

### Step 4: Verify Rewrite Rule
Your `vercel.json` should have:
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

### Step 5: Force Clear Cache
1. **Facebook Debugger:**
   - Visit: https://developers.facebook.com/tools/debug/
   - Enter your article URL
   - Click "Scrape Again" button (multiple times if needed)

2. **WhatsApp:**
   - Share the link in a chat
   - Wait 30-60 seconds for cache to update
   - If still wrong, try: `https://your-url/?_t=timestamp` to force refresh

### Step 6: Check Function Logs
In Vercel Dashboard:
- Go to your project → Functions tab
- Click on `api/article`
- Check for:
  - "Article Image URL: [URL]" - should show your Firebase Storage URL
  - Any error messages

## Debugging Checklist

- [ ] `article.html` file is deleted/removed (not just renamed)
- [ ] `vercel.json` has correct rewrite rule
- [ ] API function is accessible: `/api/article?id=ARTICLE_ID`
- [ ] API returns HTML with correct `og:image` meta tag
- [ ] Article in Firestore has `imageUrl` field with full URL
- [ ] Facebook/WhatsApp cache is cleared

## Testing Commands

```bash
# Check if article.html exists
ls -la article.html

# Check API function works locally (if you have Node.js)
# You'd need to set up local testing environment
```

## Common Solutions

### Solution 1: Delete Static File
If `article.html` still exists, delete it completely and redeploy.

### Solution 2: Check Article Data
Verify in Firestore that your article has:
- `imageUrl` field (full Firebase Storage URL)
- `status` = "published"
- `title` and `tagline` fields

### Solution 3: Update Vercel Config
Make sure `vercel.json` is in the root of `HaryanaSandhyaTimesAudience` folder.

### Solution 4: Redeploy
After making changes:
```bash
git add .
git commit -m "Fix meta tags"
git push
# Vercel will auto-deploy
```

## If Still Not Working

1. Check Vercel Function Logs for errors
2. Test API directly: `https://your-site.vercel.app/api/article?id=ARTICLE_ID`
3. View page source - check if meta tags have correct image URL
4. Try a different article to rule out data issues

