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

    // Check if Android (for intent URL)
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isAndroid) {
        // Android: Try Web Share API first, then Intent URL
        try {
            console.log('Android detected, trying Web Share API first');
            
            if (navigator.share) {
                const file = await fetchImageAsFile(imageUrl, 'article-image.jpg');
                
                // Try Web Share API with file (best method)
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: title,
                            text: message
                        });
                        console.log('Web Share API successful on Android!');
                        return;
                    } catch (shareError) {
                        if (shareError.name === 'AbortError') {
                            return;
                        }
                        console.log('Web Share API failed, trying Intent URL:', shareError);
                    }
                } else {
                    // Try sharing anyway (some browsers don't check canShare correctly)
                    try {
                        await navigator.share({
                            files: [file],
                            text: `${title}\n\n${message}`
                        });
                        console.log('Web Share API successful (without canShare check)!');
                        return;
                    } catch (directError) {
                        console.log('Direct share failed, using Intent URL fallback');
                    }
                }
            }
            
            // Fallback: Use Android Intent URL
            console.log('Using Android Intent URL method');
            
            // Download image first so user can attach it
            downloadImage(imageUrl, 'article-image.jpg');
            
            // Use WhatsApp Intent URL to open WhatsApp with pre-filled text
            // Format: intent://send/#Intent;scheme=whatsapp;action=android.intent.action.SEND;S.android.intent.extra.TEXT=text;package=com.whatsapp;end
            const encodedMessage = encodeURIComponent(message);
            const whatsappIntent = `intent://send/#Intent;scheme=whatsapp;action=android.intent.action.SEND;S.android.intent.extra.TEXT=${encodedMessage};package=com.whatsapp;end`;
            
            // Try to open intent
            setTimeout(() => {
                window.location.href = whatsappIntent;
                
                // Show instruction after a moment
                setTimeout(() => {
                    alert('WhatsApp is opening with the message. The image has been downloaded to your gallery - please attach it from the gallery when sharing in WhatsApp.');
                }, 1000);
            }, 300);
            
        } catch (error) {
            console.error('Error with Android share:', error);
            // Final fallback
            downloadImage(imageUrl, 'article-image.jpg');
            setTimeout(() => {
                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
                alert('Image downloaded! Please attach it in WhatsApp from your gallery.');
            }, 500);
        }
        return;
    }

    // For iOS or other mobile devices, use Web Share API
    if (isMobile && navigator.share) {
        try {
            console.log('Mobile device detected, trying Web Share API');
            const file = await fetchImageAsFile(imageUrl, 'article-image.jpg');
            
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: title,
                        text: message
                    });
                    return;
                } catch (shareError) {
                    if (shareError.name === 'AbortError') {
                        return;
                    }
                    throw shareError;
                }
            }
        } catch (error) {
            console.error('Web Share API failed:', error);
        }
    }

    // Fallback for all platforms: Download image and open WhatsApp
    downloadImage(imageUrl, 'article-image.jpg');
    setTimeout(() => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        if (isMobile) {
            alert('Image downloaded! Please attach it in WhatsApp from your gallery.');
        } else {
            alert('Image downloaded! Please attach it manually in WhatsApp Web.');
        }
    }, 500);
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
        console.log('Fetching image with URL:', imageUrl);
        
        // First, try direct fetch with CORS
        let response;
        try {
            response = await fetch(imageUrl, { 
                mode: 'cors',
                credentials: 'omit'
            });
        } catch (fetchError) {
            console.log('Direct fetch failed, trying canvas method:', fetchError);
            // If direct fetch fails due to CORS, use canvas method
            return await fetchImageViaCanvas(imageUrl, filename);
        }
        
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        console.log('Blob created, size:', blob.size, 'type:', blob.type);
        
        // Ensure we have a valid image type
        const imageType = blob.type || 'image/jpeg';
        const file = new File([blob], filename, { type: imageType });
        console.log('File created:', file.name, file.size, file.type);
        
        return file;
    } catch (error) {
        console.error('Error fetching image:', error);
        // Try canvas method as fallback
        try {
            console.log('Attempting canvas method as fallback...');
            return await fetchImageViaCanvas(imageUrl, filename);
        } catch (canvasError) {
            console.error('Canvas method also failed:', canvasError);
            throw error;
        }
    }
}

// Alternative method using canvas to handle CORS issues
async function fetchImageViaCanvas(imageUrl, filename) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Enable CORS
        
        img.onload = function() {
            try {
                // Create canvas and draw image
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                // Convert canvas to blob
                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('Failed to convert canvas to blob'));
                        return;
                    }
                    const file = new File([blob], filename, { type: 'image/jpeg' });
                    console.log('File created via canvas:', file.name, file.size);
                    resolve(file);
                }, 'image/jpeg', 0.95);
            } catch (error) {
                reject(error);
            }
        };
        
        img.onerror = function(error) {
            console.error('Image load error:', error);
            reject(new Error('Failed to load image'));
        };
        
        // Start loading the image
        img.src = imageUrl;
    });
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

// Helper function to convert File to Base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result;
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
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



