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
    const text = currentArticle.tagline || title;

    let shareUrl = '';

    switch (platform) {
        case 'whatsapp':
            shareUrl = `https://wa.me/?text=${encodeURIComponent(title + ' - ' + url)}`;
            window.open(shareUrl, '_blank');
            break;
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
            window.open(shareUrl, '_blank');
            break;
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
            window.open(shareUrl, '_blank');
            break;
        case 'instagram':
            // Instagram doesn't support direct URL sharing, open in new tab
            alert('Please copy the link and share it on Instagram');
            copyToClipboard(url);
            break;
        case 'generic':
        default:
            if (navigator.share) {
                navigator.share({
                    title: title,
                    text: text,
                    url: url
                }).catch(err => console.log('Error sharing', err));
            } else {
                // Fallback: copy to clipboard
                copyToClipboard(url);
                alert('Link copied to clipboard!');
            }
            break;
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadArticle();
});



