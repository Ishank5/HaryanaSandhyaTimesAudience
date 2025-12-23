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

    // Views and Likes
    const views = article.views !== undefined ? article.views : 0;
    const likes = article.likes !== undefined ? article.likes : 0;
    document.getElementById('articleViews').textContent = views.toLocaleString();
    document.getElementById('articleLikes').textContent = likes.toLocaleString();
    
    // Increment views when article is loaded
    incrementViews(article.id);
    
    // Initialize like button state
    initializeLikeButton(article.id, likes);

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
    const views = article.views !== undefined ? article.views : 0;
    const likes = article.likes !== undefined ? article.likes : 0;
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
            <div class="article-stats" style="display: flex; gap: 15px; margin-top: 10px; font-size: 0.9rem; color: #666;">
                <span><i class="fas fa-eye"></i> ${views.toLocaleString()}</span>
                <span><i class="fas fa-heart"></i> ${likes.toLocaleString()}</span>
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

    switch (platform) {
        case 'whatsapp':
            shareToWhatsApp(title, url);
            break;
        case 'facebook':
            shareToFacebook(url);
            break;
        case 'twitter':
            shareToTwitter(title, url);
            break;
        case 'instagram':
            shareToInstagram(url);
            break;
        case 'generic':
        default:
            shareGeneric(title, url);
            break;
    }
}

// Share to WhatsApp (simple - only title in message)
function shareToWhatsApp(title, url) {
    const message = title;
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(message + ' - ' + url)}`;
    window.open(shareUrl, '_blank');
}

// Share to Facebook
function shareToFacebook(url) {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank');
}

// Share to Twitter/X
function shareToTwitter(title, url) {
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank');
}

// Share to Instagram
function shareToInstagram(url) {
    alert('Please copy the link and share it on Instagram');
    copyToClipboard(url);
}

// Generic share (Web Share API)
function shareGeneric(title, url) {
    if (navigator.share) {
        navigator.share({
            title: title,
            text: title,
            url: url
        }).catch(err => {
            if (err.name !== 'AbortError') {
                console.log('Share failed, falling back to clipboard');
                copyToClipboard(url);
                alert('Link copied to clipboard!');
            }
        });
    } else {
        // Fallback: copy to clipboard
        copyToClipboard(url);
        alert('Link copied to clipboard!');
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

// Increment views
async function incrementViews(articleId) {
    try {
        const doc = await db.collection('articles').doc(articleId).get();
        if (!doc.exists) return;
        
        const article = doc.data();
        const currentViews = article.views !== undefined ? article.views : 0;
        
        await db.collection('articles').doc(articleId).update({
            views: currentViews + 1,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Update display
        document.getElementById('articleViews').textContent = (currentViews + 1).toLocaleString();
    } catch (error) {
        console.error('Error incrementing views:', error);
    }
}

// Initialize like button state
function initializeLikeButton(articleId, currentLikes) {
    const likedArticles = JSON.parse(localStorage.getItem('likedArticles') || '[]');
    const isLiked = likedArticles.includes(articleId);
    
    const likeBtn = document.getElementById('likeBtn');
    const likeIcon = document.getElementById('likeIcon');
    const likeText = document.getElementById('likeText');
    
    if (isLiked) {
        likeBtn.style.background = '#FF0F22';
        likeBtn.style.color = '#fff';
        likeIcon.classList.remove('far');
        likeIcon.classList.add('fas');
        likeText.textContent = 'Liked';
    } else {
        likeBtn.style.background = 'transparent';
        likeBtn.style.color = '#FF0F22';
        likeIcon.classList.remove('fas');
        likeIcon.classList.add('far');
        likeText.textContent = 'Like';
    }
}

// Handle like button click
async function handleLike() {
    if (!currentArticle) return;
    
    const articleId = currentArticle.id;
    const likedArticles = JSON.parse(localStorage.getItem('likedArticles') || '[]');
    const isLiked = likedArticles.includes(articleId);
    
    const likeBtn = document.getElementById('likeBtn');
    const likeIcon = document.getElementById('likeIcon');
    const likeText = document.getElementById('likeText');
    const likesElement = document.getElementById('articleLikes');
    
    try {
        const doc = await db.collection('articles').doc(articleId).get();
        if (!doc.exists) return;
        
        const article = doc.data();
        let currentLikes = article.likes !== undefined ? article.likes : 0;
        
        if (isLiked) {
            // Unlike - remove from localStorage
            const index = likedArticles.indexOf(articleId);
            if (index > -1) {
                likedArticles.splice(index, 1);
            }
            localStorage.setItem('likedArticles', JSON.stringify(likedArticles));
            
            // Update button
            likeBtn.style.background = 'transparent';
            likeBtn.style.color = '#FF0F22';
            likeIcon.classList.remove('fas');
            likeIcon.classList.add('far');
            likeText.textContent = 'Like';
            
            // Decrement likes
            currentLikes = Math.max(0, currentLikes - 1);
        } else {
            // Like - add to localStorage
            likedArticles.push(articleId);
            localStorage.setItem('likedArticles', JSON.stringify(likedArticles));
            
            // Update button
            likeBtn.style.background = '#FF0F22';
            likeBtn.style.color = '#fff';
            likeIcon.classList.remove('far');
            likeIcon.classList.add('fas');
            likeText.textContent = 'Liked';
            
            // Increment likes
            currentLikes = currentLikes + 1;
        }
        
        // Update in Firestore
        await db.collection('articles').doc(articleId).update({
            likes: currentLikes,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Update display
        likesElement.textContent = currentLikes.toLocaleString();
        
        // Update current article object
        currentArticle.likes = currentLikes;
    } catch (error) {
        console.error('Error handling like:', error);
    }
}

// Increment website visits counter
async function incrementWebsiteVisits() {
    try {
        const statsRef = db.collection('stats').doc('website');
        const statsDoc = await statsRef.get();
        
        if (statsDoc.exists) {
            // Document exists, increment the counter
            await statsRef.update({
                totalVisits: firebase.firestore.FieldValue.increment(1),
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            // Document doesn't exist, create it with initial value of 1
            await statsRef.set({
                totalVisits: 1,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    } catch (error) {
        console.error('Error incrementing website visits:', error);
        // Silently fail - don't interrupt user experience
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Increment website visit counter
    incrementWebsiteVisits();
    
    // Check if article data was injected by serverless function
    if (window.articleData) {
        // Article data already loaded from server
        currentArticle = window.articleData;
        displayArticle(window.articleData);
        loadRecommendedArticles(window.articleData);
        document.title = `${window.articleData.title} - Haryana Sandhya Times`;
        // Meta tags are already set in HTML, no need to set them again
    } else {
        // Load article from Firestore (fallback for direct access to article-view.html)
        loadArticle();
    }
});



