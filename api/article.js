// This file should be placed at: api/article.js
// Vercel Serverless Function to serve article pages with meta tags

export default async function handler(req, res) {
    // Get ID from query params (works for both /api/article?id=... and /article.html?id=... via rewrite)
    const id = req.query?.id;
    
    console.log('Article API called - ID:', id);
    console.log('Request URL:', req.url);
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
  
      // Helper to convert Firestore timestamp to Date
      const convertTimestamp = (timestampValue) => {
        if (!timestampValue) return null;
        // Firestore timestamp format: "2025-01-15T10:30:00.000Z"
        return new Date(timestampValue);
      };
      
      // Extract article data - handle all Firestore field types
      const article = {
        id: id,
        title: data.fields.title?.stringValue || 'Article',
        tagline: data.fields.tagline?.stringValue || '',
        imageUrl: data.fields.imageUrl?.stringValue || '',
        genre: data.fields.genre?.stringValue || '',
        location: data.fields.location?.stringValue || '',
        reporter: data.fields.reporter?.stringValue || '',
        content: data.fields.content?.stringValue || '',
        status: data.fields.status?.stringValue || 'published',
        publishedDate: convertTimestamp(data.fields.publishedDate?.timestampValue),
        updatedAt: convertTimestamp(data.fields.updatedAt?.timestampValue),
        additionalImages: data.fields.additionalImages?.arrayValue?.values?.map(v => v.stringValue) || [],
        views: data.fields.views?.integerValue ? parseInt(data.fields.views.integerValue) : (data.fields.views?.doubleValue ? parseInt(data.fields.views.doubleValue) : 0),
        likes: data.fields.likes?.integerValue ? parseInt(data.fields.likes.integerValue) : (data.fields.likes?.doubleValue ? parseInt(data.fields.likes.doubleValue) : 0)
      };
      
  
      console.log('Article loaded:', article.title);
      console.log('Image URL:', article.imageUrl);
      console.log('Additional Images:', article.additionalImages);
  
      // Build current URL - use article.html for canonical URL
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers.host;
      const articleUrl = `${protocol}://${host}/article.html?id=${id}`;
      const apiUrl = `${protocol}://${host}/api/article?id=${id}`;
  
      // Check if requester is a bot/crawler (more comprehensive detection)
      const userAgent = req.headers['user-agent'] || '';
      // WhatsApp uses various user agents: WhatsApp, WhatsAppBot, WhatsApp/2.x, etc.
      const isBot = /bot|crawler|spider|facebookexternalhit|facebook|whatsapp|whatsappbot|whatsapp\/|twitter|telegram|slack|linkedin|pinterest|googlebot|bingbot|yandex|baiduspider|duckduckbot|slurp|exabot|facebot|ia_archiver|headless|phantomjs|selenium/i.test(userAgent);
      
      console.log('Is Bot:', isBot);
      console.log('User-Agent:', userAgent);
  
      // Generate HTML with proper meta tags
      const html = `<!DOCTYPE html>
  <html lang="hi">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml(article.title)} - Haryana Sandhya Times</title>
      
      <!-- Canonical URL -->
      <link rel="canonical" href="${articleUrl}">
      
      <!-- Open Graph / Facebook / WhatsApp -->
      <meta property="og:type" content="article">
      <meta property="og:url" content="${articleUrl}">
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
      <meta name="twitter:url" content="${articleUrl}">
      <meta name="twitter:title" content="${escapeHtml(article.title)}">
      <meta name="twitter:description" content="${escapeHtml(article.tagline || article.title)}">
      ${article.imageUrl ? `<meta name="twitter:image" content="${escapeHtml(article.imageUrl)}">` : ''}
      
      <!-- Standard Meta -->
      <meta name="description" content="${escapeHtml(article.tagline || article.title)}">
      
      <link rel="stylesheet" href="/article.css">
      <link rel="stylesheet" href="/style.css">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  </head>
  <body>
      ${isBot ? `
      <!-- Simple content for bots - they only need meta tags, but we'll show content too -->
      <h1>${escapeHtml(article.title)}</h1>
      <p>${escapeHtml(article.tagline || '')}</p>
      ${article.imageUrl ? `<img src="${escapeHtml(article.imageUrl)}" alt="${escapeHtml(article.title)}" style="max-width:100%; height:auto;">` : ''}
      ${article.additionalImages && article.additionalImages.length > 0 ? article.additionalImages.map(img => `<img src="${escapeHtml(img)}" alt="Article image" style="max-width:100%; height:auto;">`).join('') : ''}
      <div>${article.content || ''}</div>
      ` : `
      <!-- Full page for users - complete HTML structure -->
      <header class="header">
          <div class="container">
              <div class="header-content">
                  <div class="logo-section">
                      <a href="/index.html" class="logo-link">
                          <img src="/logo2.png.jpg" alt="Haryana Sandhya Times Logo" class="logo" id="logoImg">
                          <div class="logo-text">
                              <h1 id="siteName">हरियाणा संध्या टाइम्स</h1>
                              <p class="tagline" id="siteTagline">सत्य की आवाज़</p>
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
                  <!-- Article Header -->
                  <div class="article-header">
                      <div class="article-genre" id="articleGenre"></div>
                      <h1 class="article-title" id="articleTitle"></h1>
                      <p class="article-tagline" id="articleTagline"></p>
                      
                      <div class="article-meta-info">
                          <div class="meta-item">
                              <i class="far fa-calendar"></i>
                              <span class="meta-label">Published:</span>
                              <span id="publishedDate"></span>
                              <span class="timezone">IST</span>
                          </div>
                          <div class="meta-item">
                              <i class="far fa-edit"></i>
                              <span class="meta-label">Updated:</span>
                              <span id="updatedDate"></span>
                              <span class="timezone">IST</span>
                          </div>
                          <div class="meta-item" id="locationItem" style="display: none;">
                              <i class="fas fa-map-marker-alt"></i>
                              <span id="articleLocation"></span>
                          </div>
                          <div class="meta-item" id="reporterItem" style="display: none;">
                              <i class="fas fa-user"></i>
                              <span id="articleReporter"></span>
                          </div>
                          <div class="meta-item">
                              <i class="fas fa-eye"></i>
                              <span id="articleViews">0</span>
                              <span class="meta-label">views</span>
                          </div>
                          <div class="meta-item">
                              <i class="fas fa-heart"></i>
                              <span id="articleLikes">0</span>
                              <span class="meta-label">likes</span>
                          </div>
                      </div>
  
                      <!-- Like and Share Buttons -->
                      <div class="like-share-section" style="display: flex; gap: 15px; align-items: center; margin-top: 20px; flex-wrap: wrap;">
                          <button class="like-btn" id="likeBtn" onclick="handleLike()" style="padding: 12px 24px; border: 2px solid #FF0F22; background: transparent; color: #FF0F22; border-radius: 25px; cursor: pointer; font-size: 1rem; font-weight: 600; display: flex; align-items: center; gap: 8px; transition: all 0.3s ease;">
                              <i class="far fa-heart" id="likeIcon"></i>
                              <span id="likeText">Like</span>
                          </button>
                          <div class="share-section" style="display: flex; gap: 10px;">
                          <button class="share-btn share-generic" onclick="shareArticle('generic')" title="Share">
                              <i class="fas fa-share-alt"></i>
                              <span>Share</span>
                          </button>
                          <button class="share-btn share-whatsapp" onclick="shareArticle('whatsapp')" title="Share on WhatsApp">
                              <i class="fab fa-whatsapp"></i>
                          </button>
                          <button class="share-btn share-facebook" onclick="shareArticle('facebook')" title="Share on Facebook">
                              <i class="fab fa-facebook-f"></i>
                          </button>
                          <button class="share-btn share-instagram" onclick="shareArticle('instagram')" title="Share on Instagram">
                              <i class="fab fa-instagram"></i>
                          </button>
                          <button class="share-btn share-twitter" onclick="shareArticle('twitter')" title="Share on X (Twitter)">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                              </svg>
                          </button>
                          </div>
                      </div>
                  </div>
  
                  <!-- Images Section -->
                  <div class="article-images" id="articleImages">
                      <div class="images-scroll-container" id="imagesContainer">
                          <!-- Images will be inserted here by article.js -->
                      </div>
                  </div>
  
                  <!-- Article Content -->
                  <div class="article-content" id="articleContent">
                      <!-- Content will be inserted here by article.js -->
                  </div>
              </div>
  
              <!-- Recommended Articles -->
              <div class="recommended-section">
                  <h2 class="section-title">Recommended Articles</h2>
                  
                  <div class="recommended-grid">
                      <div class="recommended-category">
                          <h3 class="category-title">
                              <i class="fas fa-tag"></i>
                              More from <span id="sameGenreTitle"></span>
                          </h3>
                          <div class="articles-grid" id="sameGenreArticles"></div>
                      </div>
                      
                      <div class="recommended-category" id="sameLocationSection" style="display: none;">
                          <h3 class="category-title">
                              <i class="fas fa-map-marker-alt"></i>
                              Latest from <span id="sameLocationTitle"></span>
                          </h3>
                          <div class="articles-grid" id="sameLocationArticles"></div>
                      </div>
                  </div>
              </div>
          </div>
      </main>
  
      <footer class="footer">
          <div class="container">
              <div class="footer-content">
                  <div class="footer-section">
                      <img src="/logo2.png.jpg" alt="Logo" class="footer-logo">
                      <h3 id="footerSiteName">हरियाणा संध्या टाइम्स</h3>
                      <p id="footerDesc">हरियाणा संध्या टाइम्स एक प्रमुख समाचार पोर्टल है जो निष्पक्ष और सत्य समाचार प्रदान करता है। हमारा उद्देश्य समाज को सूचित और जागरूक रखना है।</p>
                  </div>
                  <div class="footer-section">
                      <h4 id="footerShareTitle">हमें फॉलो करें</h4>
                      <div class="social-links">
                          <a href="#" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
                          <a href="#" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
                          <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
                          <a href="#" aria-label="YouTube"><i class="fab fa-youtube"></i></a>
                          <a href="#" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a>
                      </div>
                  </div>
                  <div class="footer-section">
                      <h4 id="footerNavigateTitle">नेविगेट</h4>
                      <ul class="footer-links">
                          <li><a href="/index.html#home" class="footer-link">होम</a></li>
                          <li><a href="/index.html#articles" class="footer-link">लेख</a></li>
                          <li><a href="/index.html#about" class="footer-link">हमारे बारे में</a></li>
                          <li><a href="/index.html#reporter" class="footer-link">रिपोर्टर बनें</a></li>
                      </ul>
                  </div>
              </div>
          </div>
          <div class="footer-bottom">
              <p id="footerMade">Made with <i class="fas fa-heart"></i> by <a href="https://humblesolutions.in" target="_blank">Humble Solutions Pvt Ltd</a></p>
          </div>
      </footer>
      
      <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
      <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
      <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-storage-compat.js"></script>
      <script>
          // Inject article data for article.js to use
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