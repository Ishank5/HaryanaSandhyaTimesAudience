# Vercel Setup Guide for Haryana Sandhya Times

## Overview
This guide will help you deploy your news website to Vercel with proper meta tags for social media sharing (WhatsApp, Facebook, Twitter).

## What We've Set Up

1. **Serverless Function** (`api/article.js`): Serves article pages with meta tags for social media crawlers
2. **Vercel Configuration** (`vercel.json`): Routes article.html requests to the serverless function
3. **Simplified Sharing**: Share buttons now only send article title in message, preview is loaded from webpage meta tags

## Step-by-Step Setup

### Step 1: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Choose "Continue with GitHub" (recommended)
4. Authorize Vercel to access your GitHub repositories

### Step 2: Import Your Repository
1. After signing in, click "Add New..." → "Project"
2. Find your GitHub repository with the `HaryanaSandhyaTimesAudience` folder
3. Click "Import"

### Step 3: Configure Project Settings
1. **Root Directory**: Set to `HaryanaSandhyaTimesAudience` (if your repo has both admin and audience folders)
   - Click "Edit" next to Root Directory
   - Enter: `HaryanaSandhyaTimesAudience`
   
2. **Framework Preset**: Select "Other" or leave as auto-detected

3. **Build Command**: Leave empty (static site, no build needed)

4. **Output Directory**: Leave empty or set to `.` (current directory)

### Step 4: Deploy
1. Click "Deploy"
2. Wait for deployment to complete (usually 1-2 minutes)
3. You'll get a URL like: `your-project.vercel.app`

### Step 5: Test the Deployment
1. Visit your deployed site
2. Open an article page: `https://your-project.vercel.app/article.html?id=YOUR_ARTICLE_ID`
3. Share it on WhatsApp - you should see the image and title preview!

### Step 6: Set Up Custom Domain (Optional)
1. Go to your project settings
2. Click "Domains"
3. Add your custom domain (e.g., `haryanasandhyatimes.in`)
4. Follow DNS configuration instructions
5. Wait for DNS propagation (can take up to 24 hours, usually much faster)

## How It Works

### For Social Media Bots/Crawlers:
```
Bot visits: article.html?id=ABC123
    ↓
Vercel rewrite rule intercepts → routes to /api/article?id=ABC123
    ↓
Serverless function detects bot via User-Agent
    ↓
Fetches article data from Firestore
    ↓
Generates HTML with meta tags (og:image, og:title, etc.)
    ↓
Returns HTML to bot
    ↓
Bot sees image and title in meta tags ✅
```

### For Regular Users:
```
User visits: article.html?id=ABC123
    ↓
Vercel rewrite rule intercepts → routes to /api/article?id=ABC123
    ↓
Serverless function detects it's NOT a bot
    ↓
Redirects to: /article-view.html?id=ABC123
    ↓
Static article-view.html loads with JavaScript
    ↓
JavaScript fetches article and displays content ✅
```

## File Structure

```
HaryanaSandhyaTimesAudience/
├── api/
│   └── article.js          # Serverless function for meta tags
├── vercel.json             # Vercel configuration
├── article.html            # Your article page
├── article.js              # Client-side article logic (simplified sharing)
├── index.html
└── ... (other files)
```

## Testing Social Media Previews

### WhatsApp:
1. Share an article link
2. Wait a few seconds
3. You should see the article image and title in the preview

### Facebook Debugger:
1. Go to: https://developers.facebook.com/tools/debug/
2. Enter your article URL
3. Click "Debug"
4. You should see the image and title

### Twitter Card Validator:
1. Go to: https://cards-dev.twitter.com/validator
2. Enter your article URL
3. You should see the preview card

## Troubleshooting

### Issue: Meta tags not showing
**Solution:**
- Clear Facebook/WhatsApp cache using their debugger tools
- Facebook: https://developers.facebook.com/tools/debug/
- WhatsApp: Share the link and wait, then check preview

### Issue: Serverless function not working
**Solution:**
- Check Vercel deployment logs
- Verify `api/article.js` file exists
- Check `vercel.json` rewrite rule is correct

### Issue: Wrong article showing
**Solution:**
- Verify article ID is correct in URL
- Check Firestore has the article with correct ID
- Check serverless function logs in Vercel dashboard

### Issue: Images not loading in preview
**Solution:**
- Ensure image URLs in Firestore are absolute URLs (starting with https://)
- Check Firebase Storage CORS settings allow access
- Verify images are publicly accessible

## Environment Variables (If Needed)

Currently, the serverless function uses Firestore REST API which is public. If you need to use Firebase Admin SDK instead:

1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate a new private key
3. In Vercel: Project Settings → Environment Variables
4. Add: `FIREBASE_ADMIN_KEY` with the JSON content
5. Update `api/article.js` to use Admin SDK

## Deployment Updates

Every time you push to your GitHub repository:
- Vercel automatically detects changes
- Triggers a new deployment
- Updates your live site (usually in 1-2 minutes)

## Important Notes

1. **Free Tier Limits:**
   - 100GB bandwidth/month
   - Serverless functions: 100GB-hours/month
   - Should be more than enough for a news site

2. **Caching:**
   - Meta tags are cached for 1 hour
   - Clear cache if you update an article and want immediate preview update

3. **Firestore Access:**
   - Currently using public Firestore REST API
   - Your Firestore rules should allow read access to articles collection
   - Rule example: `allow read: if resource.data.status == 'published';`

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Test serverless function directly: `https://your-project.vercel.app/api/article?id=YOUR_ARTICLE_ID`

## Next Steps After Deployment

1. ✅ Test sharing on WhatsApp
2. ✅ Test sharing on Facebook
3. ✅ Test sharing on Twitter
4. ✅ Set up custom domain (if you have one)
5. ✅ Update any hardcoded URLs to use your new domain
6. ✅ Set up analytics (optional)

---

**Congratulations! Your site is now on Vercel with proper social media previews! 🎉**

