// Vercel Serverless Function to serve article pages with meta tags for social media scrapers
export default async function handler(req, res) {
  // Extract article ID from query string
  const url = new URL(req.url, `http://${req.headers.host}`);
  const id = url.searchParams.get('id');
  
  if (!id) {
    return res.status(400).send('Article ID required');
  }

  try {
    // Fetch article from Firestore using REST API
    const projectId = 'haryanasandhyatimes-fb72f';
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/articles/${id}`;
    
    const response = await fetch(firestoreUrl);
    const data = await response.json();
    
    if (!data.fields || data.fields.status?.stringValue !== 'published') {
      return res.status(404).send('Article not found');
    }

    // Extract article data from Firestore document
    const article = {
      id: id,
      title: data.fields.title?.stringValue || 'Article',
      tagline: data.fields.tagline?.stringValue || '',
      imageUrl: data.fields.imageUrl?.stringValue || '',
      genre: data.fields.genre?.stringValue || '',
      location: data.fields.location?.stringValue || '',
      reporter: data.fields.reporter?.stringValue || '',
      content: data.fields.content?.stringValue || '',
      publishedDate: data.fields.publishedDate?.timestampValue || '',
      updatedAt: data.fields.updatedAt?.timestampValue || ''
    };

    // Get the current URL (for og:url)
    const host = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const currentUrl = `${protocol}://${host}/article.html?id=${id}`;

    // Check if it's a bot/crawler based on User-Agent
    const userAgent = req.headers['user-agent'] || '';
    const isBot = /bot|crawler|spider|crawling|facebookexternalhit|WhatsApp|Twitterbot|LinkedInBot|Slackbot|facebook/i.test(userAgent);
    
    // For bots: Return HTML with meta tags
    // For users: Return redirect to static file (bypassing rewrite to avoid loop)
    if (!isBot) {
      // Regular user - serve the actual article.html content but with meta tags pre-filled
      // We'll redirect them using a client-side redirect to avoid rewrite loop
      const redirectHtml = `<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="refresh" content="0; url=/article-view.html?id=${id}">
    <script>window.location.href = '/article-view.html?id=${id}';</script>
</head>
<body>Redirecting...</body>
</html>`;
      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(redirectHtml);
      return;
    }

    // For bots: Generate HTML with meta tags
    const html = `<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(article.title)} - Haryana Sandhya Times</title>
    
    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="${currentUrl}">
    <meta property="og:title" content="${escapeHtml(article.title)}">
    <meta property="og:description" content="${escapeHtml(article.tagline || article.title)}">
    ${article.imageUrl ? `<meta property="og:image" content="${escapeHtml(article.imageUrl)}">` : ''}
    ${article.imageUrl ? `<meta property="og:image:secure_url" content="${escapeHtml(article.imageUrl)}">` : ''}
    ${article.imageUrl ? `<meta property="og:image:type" content="image/jpeg">` : ''}
    ${article.imageUrl ? `<meta property="og:image:width" content="1200">` : ''}
    ${article.imageUrl ? `<meta property="og:image:height" content="630">` : ''}
    ${article.imageUrl ? `<meta property="og:image:alt" content="${escapeHtml(article.title)}">` : ''}
    <meta property="og:site_name" content="Haryana Sandhya Times">
    <meta property="og:locale" content="hi_IN">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${currentUrl}">
    <meta name="twitter:title" content="${escapeHtml(article.title)}">
    <meta name="twitter:description" content="${escapeHtml(article.tagline || article.title)}">
    ${article.imageUrl ? `<meta name="twitter:image" content="${escapeHtml(article.imageUrl)}">` : ''}
    
    <!-- Standard Meta -->
    <meta name="description" content="${escapeHtml(article.tagline || article.title)}">
</head>
<body>
    <!-- This content is for bots/crawlers only -->
    <h1>${escapeHtml(article.title)}</h1>
    <p>${escapeHtml(article.tagline || '')}</p>
    ${article.imageUrl ? `<img src="${escapeHtml(article.imageUrl)}" alt="${escapeHtml(article.title)}" style="max-width: 100%; height: auto;">` : ''}
    <div>${article.content || ''}</div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).send(html);
    
  } catch (error) {
    console.error('Error loading article:', error);
    res.status(500).send('Error loading article');
  }
}

// Helper function to escape HTML
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.toString().replace(/[&<>"']/g, m => map[m]);
}

