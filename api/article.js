// This file should be placed at: api/article.js
// Vercel Serverless Function to serve article pages with meta tags

export default async function handler(req, res) {
    const id = req.query?.id;
    
    console.log('Article API called - ID:', id);
    console.log('User-Agent:', req.headers['user-agent']);
    
    if (!id) {
      return res.status(400).send('Article ID required');
    }
  
    try {
      // Fetch article from Firestore using REST API
      const projectId = 'haryanasandhyatimes-fb72f';
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/articles/${id}`;
      
      const response = await fetch(firestoreUrl);
      
      if (!response.ok) {
        console.error('Firestore error:', response.status);
        return res.status(404).send('Article not found');
      }
      
      const data = await response.json();
      
      if (!data.fields || data.fields.status?.stringValue !== 'published') {
        return res.status(404).send('Article not found or not published');
      }
  
      // Extract article data
      const article = {
        id: id,
        title: data.fields.title?.stringValue || 'Article',
        tagline: data.fields.tagline?.stringValue || '',
        imageUrl: data.fields.imageUrl?.stringValue || '',
        genre: data.fields.genre?.stringValue || '',
        location: data.fields.location?.stringValue || '',
        reporter: data.fields.reporter?.stringValue || '',
        content: data.fields.content?.stringValue || ''
      };
  
      console.log('Article loaded:', article.title);
      console.log('Image URL:', article.imageUrl);
  
      // Build current URL
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers.host;
      const currentUrl = `${protocol}://${host}/article.html?id=${id}`;
  
      // Check if requester is a bot/crawler
      const userAgent = req.headers['user-agent'] || '';
      const isBot = /bot|crawler|spider|facebook|whatsapp|twitter|telegram|slack|linkedin/i.test(userAgent);
      
      console.log('Is Bot:', isBot);
  
      // Generate HTML with proper meta tags
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
      <meta property="og:site_name" content="Haryana Sandhya Times">
      <meta property="og:locale" content="hi_IN">
      ${article.imageUrl ? `
      <meta property="og:image" content="${escapeHtml(article.imageUrl)}">
      <meta property="og:image:secure_url" content="${escapeHtml(article.imageUrl)}">
      <meta property="og:image:type" content="image/jpeg">
      <meta property="og:image:width" content="1200">
      <meta property="og:image:height" content="630">
      <meta property="og:image:alt" content="${escapeHtml(article.title)}">` : ''}
      
      <!-- Twitter Card -->
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:url" content="${currentUrl}">
      <meta name="twitter:title" content="${escapeHtml(article.title)}">
      <meta name="twitter:description" content="${escapeHtml(article.tagline || article.title)}">
      ${article.imageUrl ? `<meta name="twitter:image" content="${escapeHtml(article.imageUrl)}">` : ''}
      
      <!-- Standard Meta -->
      <meta name="description" content="${escapeHtml(article.tagline || article.title)}">
      
      ${!isBot ? `
      <link rel="stylesheet" href="/article.css">
      <link rel="stylesheet" href="/style.css">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      ` : ''}
  </head>
  <body>
      ${isBot ? `
      <!-- Simple content for bots -->
      <h1>${escapeHtml(article.title)}</h1>
      <p>${escapeHtml(article.tagline || '')}</p>
      ${article.imageUrl ? `<img src="${escapeHtml(article.imageUrl)}" alt="${escapeHtml(article.title)}" style="max-width:100%">` : ''}
      ` : `
      <!-- Full page for users -->
      <header class="header">
          <div class="container">
              <div class="header-content">
                  <div class="logo-section">
                      <a href="/index.html" class="logo-link">
                          <img src="/logo2.png.jpg" alt="Haryana Sandhya Times Logo" class="logo">
                          <div class="logo-text">
                              <h1>हरियाणा संध्या टाइम्स</h1>
                              <p class="tagline">सत्य की आवाज़</p>
                          </div>
                      </a>
                  </div>
                  <button class="lang-toggle" id="langToggle">
                      <i class="fas fa-language"></i>
                      <span id="langText">English</span>
                  </button>
              </div>
          </div>
      </header>
  
      <main class="article-main">
          <div class="container">
              <div class="article-container">
                  <div class="article-header">
                      <div class="article-genre" id="articleGenre"></div>
                      <h1 class="article-title" id="articleTitle"></h1>
                      <p class="article-tagline" id="articleTagline"></p>
                      
                      <div class="article-meta-info">
                          <div class="meta-item">
                              <i class="far fa-calendar"></i>
                              <span class="meta-label">Published:</span>
                              <span id="publishedDate"></span>
                          </div>
                          <div class="meta-item" id="locationItem" style="display: none;">
                              <i class="fas fa-map-marker-alt"></i>
                              <span id="articleLocation"></span>
                          </div>
                      </div>
  
                      <div class="share-section">
                          <button class="share-btn share-whatsapp" onclick="shareArticle('whatsapp')">
                              <i class="fab fa-whatsapp"></i>
                          </button>
                          <button class="share-btn share-facebook" onclick="shareArticle('facebook')">
                              <i class="fab fa-facebook-f"></i>
                          </button>
                      </div>
                  </div>
  
                  <div class="article-images" id="articleImages">
                      <div class="images-scroll-container" id="imagesContainer"></div>
                  </div>
  
                  <div class="article-content" id="articleContent"></div>
              </div>
          </div>
      </main>
  
      <footer class="footer">
          <div class="container">
              <p>© Haryana Sandhya Times</p>
          </div>
      </footer>
      
      <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
      <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
      <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-storage-compat.js"></script>
      <script>
          window.articleData = ${JSON.stringify(article)};
      </script>
      <script src="/article.js"></script>
      `}
  </body>
  </html>`;
  
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
      res.status(200).send(html);
      
    } catch (error) {
      console.error('Error loading article:', error);
      res.status(500).send('Error loading article');
    }
  }
  
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