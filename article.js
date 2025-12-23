const firebaseConfig = {
  apiKey: "AIzaSyDclckQnSOOCiYt6d8H4BLy9fuuF-nUwV8",
  authDomain: "haryanasandhyatimes-fb72f.firebaseapp.com",
  projectId: "haryanasandhyatimes-fb72f",
  storageBucket: "haryanasandhyatimes-fb72f.firebasestorage.app",
  messagingSenderId: "94477299526",
  appId: "1:94477299526:web:bed36e6c101f0d9059ff47",
  measurementId: "G-1JECMXTWXD"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let currentArticle = null;

// Get article ID from URL
function getArticleId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Format date with IST timezone
function formatDateIST(timestamp) {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    // Convert to IST (UTC+5:30)
    const istDate = new Date(date.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Asia/Kolkata'
    };
    
    return date.toLocaleDateString('en-IN', options);
}

// Load article
async function loadArticle() {
    const articleId = getArticleId();
    if (!articleId) {
        document.body.innerHTML = '<div style="text-align: center; padding: 50px;"><h2>Article not found</h2><a href="index.html">Go to Home</a></div>';
        return;
    }

    try {
        const doc = await db.collection('articles').doc(articleId).get();
        if (!doc.exists) {
            document.body.innerHTML = '<div style="text-align: center; padding: 50px;"><h2>Article not found</h2><a href="index.html">Go to Home</a></div>';
            return;
        }

        const article = { id: doc.id, ...doc.data() };
        
        // Only show published articles
        if (article.status !== 'published') {
            document.body.innerHTML = '<div style="text-align: center; padding: 50px;"><h2>Article not available</h2><a href="index.html">Go to Home</a></div>';
            return;
        }

        currentArticle = article;
        displayArticle(article);
        loadRecommendedArticles(article);
        
        // Update page title
        document.title = `${article.title} - Haryana Sandhya Times`;
        
        // Set meta tags for social sharing (WhatsApp, Facebook, etc.)
        setMetaTags(article);
        
    } catch (error) {
        console.error('Error loading article:', error);
        document.body.innerHTML = '<div style="text-align: center; padding: 50px;"><h2>Error loading article</h2><a href="index.html">Go to Home</a></div>';
    }
}

// Display article
function displayArticle(article) {
    // Genre
    if (article.genre) {
        document.getElementById('articleGenre').textContent = article.genre;
    }

    // Title
    document.getElementById('articleTitle').textContent = article.title || '';

    // Tagline
    if (article.tagline) {
        document.getElementById('articleTagline').textContent = article.tagline;
    } else {
        document.getElementById('articleTagline').style.display = 'none';
    }

    // Published Date
    if (article.publishedDate) {
        document.getElementById('publishedDate').textContent = formatDateIST(article.publishedDate);
    }

    // Updated Date
    if (article.updatedAt) {
        document.getElementById('updatedDate').textContent = formatDateIST(article.updatedAt);
    } else if (article.publishedDate) {
        document.getElementById('updatedDate').textContent = formatDateIST(article.publishedDate);
    }

    // Location
    if (article.location) {
        document.getElementById('articleLocation').textContent = article.location;
        document.getElementById('locationItem').style.display = 'flex';
    }

    // Reporter
    if (article.reporter) {
        document.getElementById('articleReporter').textContent = article.reporter;
        document.getElementById('reporterItem').style.display = 'flex';
    }

    // Images
    const imagesContainer = document.getElementById('imagesContainer');
    imagesContainer.innerHTML = '';
    
    const allImages = [];
    if (article.imageUrl) {
        allImages.push(article.imageUrl);
    }
    if (article.additionalImages && article.additionalImages.length > 0) {
        allImages.push(...article.additionalImages);
    }

    if (allImages.length > 0) {
        allImages.forEach((imageUrl, index) => {
            const imgDiv = document.createElement('div');
            imgDiv.className = 'article-image-item';
            imgDiv.innerHTML = `<img src="${imageUrl}" alt="Article Image ${index + 1}" loading="lazy">`;
            imagesContainer.appendChild(imgDiv);
        });
    } else {
        document.getElementById('articleImages').style.display = 'none';
    }

    // Content
    if (article.content) {
        document.getElementById('articleContent').innerHTML = article.content;
    }
}

// Load recommended articles
async function loadRecommendedArticles(article) {
    try {
        // Load articles from same genre
        const genreSnapshot = await db.collection('articles')
            .where('genre', '==', article.genre)
            .where('status', '==', 'published')
            .get();

        let genreArticles = [];
        genreSnapshot.forEach(doc => {
            if (doc.id !== article.id) {
                genreArticles.push({ id: doc.id, ...doc.data() });
            }
        });

        // Sort by publishedDate
        genreArticles.sort((a, b) => {
            const aTime = getTimestampMillis(a.publishedDate);
            const bTime = getTimestampMillis(b.publishedDate);
            return bTime - aTime;
        });

        // Show only 4 articles
        genreArticles = genreArticles.slice(0, 4);

        if (genreArticles.length > 0) {
            document.getElementById('sameGenreTitle').textContent = article.genre;
            displayArticleCards(genreArticles, 'sameGenreArticles');
        } else {
            document.querySelector('.recommended-category').style.display = 'none';
        }

        // Load articles from same location
        if (article.location) {
            const locationSnapshot = await db.collection('articles')
                .where('location', '==', article.location)
                .where('status', '==', 'published')
                .get();

            let locationArticles = [];
            locationSnapshot.forEach(doc => {
                if (doc.id !== article.id) {
                    locationArticles.push({ id: doc.id, ...doc.data() });
                }
            });

            // Sort by publishedDate
            locationArticles.sort((a, b) => {
                const aTime = getTimestampMillis(a.publishedDate);
                const bTime = getTimestampMillis(b.publishedDate);
                return bTime - aTime;
            });

            // Show only 4 articles
            locationArticles = locationArticles.slice(0, 4);

            if (locationArticles.length > 0) {
                document.getElementById('sameLocationTitle').textContent = article.location;
                document.getElementById('sameLocationSection').style.display = 'block';
                displayArticleCards(locationArticles, 'sameLocationArticles');
            }
        }
    } catch (error) {
        console.error('Error loading recommended articles:', error);
    }
}

// Display article cards
function displayArticleCards(articles, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    articles.forEach(article => {
        const card = createArticleCard(article);
        container.appendChild(card);
    });
}

// Create article card
function createArticleCard(article) {
    const card = document.createElement('div');
    card.className = 'article-card';
    card.innerHTML = `
        <img src="${article.imageUrl || 'placeholder.jpg'}" alt="${article.title}" class="article-image">
        <div class="article-content">
            <p class="article-tagline">${article.tagline || ''}</p>
            <div class="article-meta">
                <span class="article-date">
                    <i class="far fa-clock"></i>
                    ${formatDate(article.publishedDate)}
                </span>
                ${article.genre ? `<span class="genre-badge">${article.genre}</span>` : ''}
            </div>
        </div>
    `;
    card.addEventListener('click', () => {
        window.location.href = `article.html?id=${article.id}`;
    });
    return card;
}

// Format date helper
function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
}

// Get timestamp in milliseconds
function getTimestampMillis(timestamp) {
    if (!timestamp) return 0;
    if (timestamp.toMillis && typeof timestamp.toMillis === 'function') {
        return timestamp.toMillis();
    }
    if (timestamp.seconds) {
        return timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000;
    }
    if (timestamp instanceof Date) {
        return timestamp.getTime();
    }
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().getTime();
    }
    if (typeof timestamp === 'number') {
        return timestamp;
    }
    return 0;
}

// Share article
function shareArticle(platform) {
    if (!currentArticle) return;

    const url = window.location.href;
    const title = currentArticle.title;
    const tagline = currentArticle.tagline || title;
    const imageUrl = currentArticle.imageUrl || '';

    switch (platform) {
        case 'whatsapp':
            shareToWhatsAppWithImage(title, tagline, url, imageUrl);
            break;
        case 'facebook':
            shareToFacebook(title, tagline, url, imageUrl);
            break;
        case 'twitter':
            shareToTwitter(title, tagline, url, imageUrl);
            break;
        case 'instagram':
            shareToInstagram(title, tagline, url, imageUrl);
            break;
        case 'generic':
        default:
            shareGeneric(title, tagline, url, imageUrl);
            break;
    }
}

// Share to WhatsApp with image
async function shareToWhatsAppWithImage(title, tagline, url, imageUrl) {
    const message = `${title}\n\n${tagline}\n\n📰 ${url}`;
    
    if (!imageUrl) {
        // No image, just share text
        const shareUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(shareUrl, '_blank');
        return;
    }

    try {
        const file = await fetchImageAsFile(imageUrl, 'article-image.jpg');
        
        // Check if Web Share API with files is supported
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: title,
                    text: message
                });
                return; // Success - image shared automatically!
            } catch (shareError) {
                if (shareError.name === 'AbortError') {
                    return; // User cancelled
                }
            }
        }
        
        // Fallback for mobile
        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            downloadImage(imageUrl, 'article-image.jpg');
            setTimeout(() => {
                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
            }, 500);
        } else {
            // Desktop fallback
            downloadImage(imageUrl, 'article-image.jpg');
            setTimeout(() => {
                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
                alert('Image downloaded! Please attach it manually in WhatsApp Web.');
            }, 500);
        }
    } catch (error) {
        console.error('Error sharing to WhatsApp:', error);
        // Fallback to text-only
        const shareUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(shareUrl, '_blank');
    }
}

// Share to Facebook
async function shareToFacebook(title, tagline, url, imageUrl) {
    // Facebook will fetch meta tags automatically, so we just share the URL
    // But we can also try Web Share API with image for better mobile experience
    if (navigator.share && imageUrl) {
        try {
            const file = await fetchImageAsFile(imageUrl, 'article-image.jpg');
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: title,
                    text: `${tagline}\n\n${url}`
                });
                return;
            }
        } catch (error) {
            console.log('Web Share API failed, using Facebook URL');
        }
    }
    
    // Standard Facebook share URL
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank');
}

// Share to Twitter/X
async function shareToTwitter(title, tagline, url, imageUrl) {
    const message = `${title}\n\n${tagline}`;
    
    // Twitter Web Share API support is limited, so we'll use URL method
    // For mobile, try Web Share API first
    if (navigator.share && imageUrl && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        try {
            const file = await fetchImageAsFile(imageUrl, 'article-image.jpg');
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: title,
                    text: `${message}\n\n${url}`
                });
                return;
            }
        } catch (error) {
            console.log('Web Share API failed, using Twitter URL');
        }
    }
    
    // Standard Twitter share URL
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank');
}

// Share to Instagram
async function shareToInstagram(title, tagline, url, imageUrl) {
    if (!imageUrl) {
        alert('Please copy the link and share it on Instagram');
        copyToClipboard(url);
        return;
    }

    // Instagram doesn't support URL sharing directly
    // Download image and copy link, user can post manually
    try {
        downloadImage(imageUrl, 'article-image.jpg');
        
        // Copy formatted message to clipboard
        const message = `${title}\n\n${tagline}\n\n${url}`;
        copyToClipboard(message);
        
        alert('Image downloaded and message copied! Open Instagram and create a new post with the downloaded image. The message with link is in your clipboard - paste it as the caption.');
    } catch (error) {
        console.error('Error sharing to Instagram:', error);
        alert('Please download the image and share it manually on Instagram');
        downloadImage(imageUrl, 'article-image.jpg');
        copyToClipboard(url);
    }
}

// Generic share (Web Share API)
async function shareGeneric(title, tagline, url, imageUrl) {
    if (navigator.share) {
        try {
            const shareData = {
                title: title,
                text: `${tagline}\n\n${url}`,
                url: url
            };
            
            // Try to include image if available
            if (imageUrl) {
                try {
                    const file = await fetchImageAsFile(imageUrl, 'article-image.jpg');
                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        shareData.files = [file];
                    }
                } catch (error) {
                    console.log('Could not add image to share');
                }
            }
            
            await navigator.share(shareData);
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.log('Share failed, falling back to clipboard');
                copyToClipboard(url);
                alert('Link copied to clipboard!');
            }
        }
    } else {
        // Fallback: copy to clipboard
        copyToClipboard(url);
        alert('Link copied to clipboard!');
    }
}

// Helper function to fetch image and convert to File object
async function fetchImageAsFile(imageUrl, filename) {
    try {
        const response = await fetch(imageUrl, { mode: 'cors' });
        if (!response.ok) throw new Error('Failed to fetch image');
        const blob = await response.blob();
        return new File([blob], filename, { type: blob.type || 'image/jpeg' });
    } catch (error) {
        console.error('Error fetching image:', error);
        throw error;
    }
}

// Helper function to download image
function downloadImage(url, filename) {
    try {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        // Clean up after a short delay
        setTimeout(() => {
            document.body.removeChild(link);
        }, 100);
    } catch (error) {
        console.error('Error downloading image:', error);
        // Fallback: open image in new tab
        window.open(url, '_blank');
    }
}

// Copy to clipboard
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
    } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }
}

// Set meta tags for social media sharing (WhatsApp, Facebook, Twitter, etc.)
function setMetaTags(article) {
    // Get the current page URL (absolute)
    const currentUrl = window.location.href;
    
    // Get article details
    const title = article.title || 'Article - Haryana Sandhya Times';
    const description = article.tagline || article.title || 'Read this article on Haryana Sandhya Times';
    // Ensure image URL is absolute (Firebase Storage URLs are already absolute)
    const imageUrl = article.imageUrl || '';
    
    // Helper function to set or update meta tag
    function setMetaTag(property, content, isProperty = true) {
        let meta = document.querySelector(`meta[${isProperty ? 'property' : 'name'}="${property}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            if (isProperty) {
                meta.setAttribute('property', property);
            } else {
                meta.setAttribute('name', property);
            }
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
    }
    
    // Set Open Graph tags
    setMetaTag('og:type', 'article');
    setMetaTag('og:url', currentUrl);
    setMetaTag('og:title', title);
    setMetaTag('og:description', description);
    setMetaTag('og:site_name', 'Haryana Sandhya Times');
    setMetaTag('og:locale', 'hi_IN');
    
    // Set image only if available
    if (imageUrl) {
        setMetaTag('og:image', imageUrl);
        setMetaTag('og:image:secure_url', imageUrl);
        setMetaTag('og:image:type', 'image/jpeg');
        setMetaTag('og:image:width', '1200');
        setMetaTag('og:image:height', '630');
        setMetaTag('og:image:alt', title);
    }
    
    // Set Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image', false);
    setMetaTag('twitter:url', currentUrl, false);
    setMetaTag('twitter:title', title, false);
    setMetaTag('twitter:description', description, false);
    if (imageUrl) {
        setMetaTag('twitter:image', imageUrl, false);
    }
    
    // Set standard meta description
    setMetaTag('description', description, false);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadArticle();
});



