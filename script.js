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
const storage = firebase.storage();

const translations = {
    hi: {
        siteName: "हरियाणा संध्या टाइम्स",
        siteTagline: "सत्य की आवाज़",
        langText: "English",
        navHome: "होम",
        navArticles: "लेख",
        navAbout: "हमारे बारे में",
        navReporter: "रिपोर्टर बनें",
        recentArticlesTitle: "हाल के लेख",
        loadMoreText: "और देखें",
        loadingText: "लोड हो रहा है...",
        genresTitle: "श्रेणियाँ",
        backText: "वापस जाएं",
        aboutTitle: "हमारे बारे में",
        reporterTitle: "रिपोर्टर पंजीकरण",
        labelName: "नाम *",
        labelGender: "लिंग *",
        labelDOB: "जन्म तिथि *",
        labelFatherName: "पिता का नाम *",
        labelBloodGroup: "रक्त समूह *",
        labelAadhar: "आधार नंबर *",
        labelState: "राज्य *",
        labelDistrict: "जिला *",
        labelMobile: "मोबाइल नंबर *",
        labelWhatsapp: "व्हाट्सएप नंबर *",
        labelAddress: "पता *",
        labelPincode: "पिनकोड *",
        labelEmail: "ईमेल *",
        labelProfile: "प्रोफ़ाइल फोटो *",
        labelID: "आईडी प्रूफ *",
        labelOtherDocs: "अन्य दस्तावेज़",
        registerText: "पंजीकरण करें",
        optionSelect: "चुनें",
        optionMale: "पुरुष",
        optionFemale: "महिला",
        optionOther: "अन्य",
        optionSelectBG: "चुनें",
        footerSiteName: "हरियाणा संध्या टाइम्स",
        footerDesc: "हरियाणा संध्या टाइम्स एक प्रमुख समाचार पोर्टल है जो निष्पक्ष और सत्य समाचार प्रदान करता है। हमारा उद्देश्य समाज को सूचित और जागरूक रखना है।",
        footerShareTitle: "हमें फॉलो करें",
        footerNavigateTitle: "नेविगेट",
        footerHome: "होम",
        footerArticles: "लेख",
        footerAbout: "हमारे बारे में",
        footerReporter: "रिपोर्टर बनें",
        footerMade: "Made with <i class=\"fas fa-heart\"></i> by <a href=\"https://humblesolutions.in\" target=\"_blank\">Humble Solutions Pvt Ltd</a>",
        submitting: "सबमिट हो रहा है...",
        successMessage: "पंजीकरण सफलतापूर्वक पूर्ण हुआ!",
        errorMessage: "कुछ गलत हो गया। कृपया पुनः प्रयास करें।",
        breakingNewsLabel: "ब्रेकिंग न्यूज़"
    },
    en: {
        siteName: "Haryana Sandhya Times",
        siteTagline: "Voice of Truth",
        langText: "हिंदी",
        navHome: "Home",
        navArticles: "Articles",
        navAbout: "About Us",
        navReporter: "Become a Reporter",
        recentArticlesTitle: "Recent Articles",
        loadMoreText: "Load More",
        loadingText: "Loading...",
        genresTitle: "Categories",
        backText: "Go Back",
        aboutTitle: "About Us",
        reporterTitle: "Reporter Registration",
        labelName: "Name *",
        labelGender: "Gender *",
        labelDOB: "Date of Birth *",
        labelFatherName: "Father's Name *",
        labelBloodGroup: "Blood Group *",
        labelAadhar: "Aadhar Number *",
        labelState: "State *",
        labelDistrict: "District *",
        labelMobile: "Mobile Number *",
        labelWhatsapp: "WhatsApp Number *",
        labelAddress: "Address *",
        labelPincode: "Pincode *",
        labelEmail: "Email *",
        labelProfile: "Profile Picture *",
        labelID: "ID Proof *",
        labelOtherDocs: "Other Documents",
        registerText: "Register",
        optionSelect: "Select",
        optionMale: "Male",
        optionFemale: "Female",
        optionOther: "Other",
        optionSelectBG: "Select",
        footerSiteName: "Haryana Sandhya Times",
        footerDesc: "Haryana Sandhya Times is a leading news portal providing unbiased and truthful news. Our goal is to keep society informed and aware.",
        footerShareTitle: "Follow Us",
        footerNavigateTitle: "Navigate",
        footerHome: "Home",
        footerArticles: "Articles",
        footerAbout: "About Us",
        footerReporter: "Become a Reporter",
        footerMade: "Made with <i class=\"fas fa-heart\"></i> by <a href=\"https://humblesolutions.in\" target=\"_blank\">Humble Solutions Pvt Ltd</a>",
        submitting: "Submitting...",
        successMessage: "Registration completed successfully!",
        errorMessage: "Something went wrong. Please try again.",
        breakingNewsLabel: "Breaking News"
    }
};

let currentLang = 'hi';
let currentPage = 'home';
let articlesData = [];
let displayedArticles = 10;
let genres = [];

// Automatic icon mapping based on genre name
function getGenreIcon(genreName) {
    if (!genreName) return 'fas fa-newspaper';
    
    const genreLower = genreName.toLowerCase().trim();
    const iconMap = {
        // News & Current Affairs
        'news': 'fas fa-newspaper',
        'current affairs': 'fas fa-globe',
        'breaking news': 'fas fa-bullhorn',
        'latest news': 'fas fa-clock',
        
        // Politics
        'politics': 'fas fa-landmark',
        'political': 'fas fa-landmark',
        'election': 'fas fa-vote-yea',
        'government': 'fas fa-building',
        
        // Sports
        'sports': 'fas fa-football-ball',
        'cricket': 'fas fa-baseball-ball',
        'football': 'fas fa-futbol',
        'hockey': 'fas fa-hockey-puck',
        'tennis': 'fas fa-table-tennis',
        
        // Entertainment
        'entertainment': 'fas fa-film',
        'movies': 'fas fa-film',
        'bollywood': 'fas fa-theater-masks',
        'music': 'fas fa-music',
        'tv': 'fas fa-tv',
        'television': 'fas fa-tv',
        
        // Business & Economy
        'business': 'fas fa-briefcase',
        'economy': 'fas fa-chart-line',
        'finance': 'fas fa-money-bill-wave',
        'stock market': 'fas fa-chart-bar',
        
        // Technology
        'technology': 'fas fa-laptop',
        'tech': 'fas fa-microchip',
        'science': 'fas fa-flask',
        'innovation': 'fas fa-lightbulb',
        
        // Health & Lifestyle
        'health': 'fas fa-heartbeat',
        'fitness': 'fas fa-dumbbell',
        'lifestyle': 'fas fa-spa',
        'fashion': 'fas fa-tshirt',
        'food': 'fas fa-utensils',
        
        // Education
        'education': 'fas fa-graduation-cap',
        'school': 'fas fa-school',
        'university': 'fas fa-university',
        
        // Crime & Legal
        'crime': 'fas fa-gavel',
        'legal': 'fas fa-balance-scale',
        'court': 'fas fa-gavel',
        
        // Weather & Nature
        'weather': 'fas fa-cloud-sun',
        'environment': 'fas fa-leaf',
        'nature': 'fas fa-tree',
        
        // Local & Regional
        'local': 'fas fa-map-marker-alt',
        'city': 'fas fa-city',
        'haryana': 'fas fa-map-marker-alt',
        
        // Culture & Society
        'culture': 'fas fa-monument',
        'society': 'fas fa-users',
        'festival': 'fas fa-masks-theater',
        'tradition': 'fas fa-torii-gate',
        
        // Agriculture
        'agriculture': 'fas fa-tractor',
        'farming': 'fas fa-seedling',
        
        // Transport
        'transport': 'fas fa-bus',
        'traffic': 'fas fa-car',
        
        // Default
        'default': 'fas fa-newspaper'
    };
    
    // Try exact match first
    if (iconMap[genreLower]) {
        return iconMap[genreLower];
    }
    
    // Try partial match
    for (const [key, icon] of Object.entries(iconMap)) {
        if (genreLower.includes(key) || key.includes(genreLower)) {
            return icon;
        }
    }
    
    // Return default icon
    return iconMap.default;
}

function switchLanguage() {
    currentLang = currentLang === 'hi' ? 'en' : 'hi';
    const t = translations[currentLang];
    
    Object.keys(t).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            if (key === 'footerMade') {
                element.innerHTML = t[key];
            } else {
                element.textContent = t[key];
            }
        }
    });
    
    // Reload live news to update label
    loadLiveNews();
}

function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.querySelectorAll('.nav-link, .footer-link').forEach(link => {
        link.classList.remove('active');
    });
    
    document.getElementById(`${sectionName}Section`).classList.add('active');
    document.querySelectorAll(`[data-page="${sectionName}"]`).forEach(link => {
        link.classList.add('active');
    });
    
    currentPage = sectionName;
    
    if (window.innerWidth <= 768) {
        document.getElementById('navMenu').classList.remove('active');
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString(currentLang === 'hi' ? 'hi-IN' : 'en-IN', options);
}

function getTimestampMillis(timestamp) {
    if (!timestamp) return 0;
    
    // Handle Firestore Timestamp object
    if (timestamp.toMillis && typeof timestamp.toMillis === 'function') {
        return timestamp.toMillis();
    }
    
    // Handle Timestamp with seconds property
    if (timestamp.seconds) {
        return timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000;
    }
    
    // Handle Date object
    if (timestamp instanceof Date) {
        return timestamp.getTime();
    }
    
    // Handle toDate() method
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().getTime();
    }
    
    // Handle number (milliseconds)
    if (typeof timestamp === 'number') {
        return timestamp;
    }
    
    return 0;
}

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
    card.addEventListener('click', () => openArticle(article.id));
    return card;
}

function openArticle(articleId) {
    window.location.href = `article.html?id=${articleId}`;
}

async function loadLiveNews() {
    try {
        const liveNewsSnapshot = await db.collection('liveNews')
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();
        
        const liveNews = liveNewsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        displayLiveNews(liveNews);
    } catch (error) {
        console.error('Error loading live news:', error);
        // Hide breaking news container if there's an error
        document.getElementById('breakingNewsContainer').style.display = 'none';
    }
}

function displayLiveNews(liveNews) {
    const container = document.getElementById('breakingNewsContainer');
    const tickerContent = document.getElementById('tickerContent');
    const tickerWrapper = tickerContent.parentElement;
    
    if (!liveNews || liveNews.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    // Show container if we have news
    container.style.display = 'flex';
    
    // Remove any existing duplicate
    const existingDuplicate = tickerWrapper.querySelector('.ticker-duplicate');
    if (existingDuplicate) {
        existingDuplicate.remove();
    }
    
    // Clear previous content
    tickerContent.innerHTML = '';
    
    // Create news items
    liveNews.forEach((news, index) => {
        const newsItem = document.createElement('span');
        newsItem.className = 'ticker-item';
        
        // Extract text from news object (handle both 'text' field and direct text)
        const newsText = news.text || news.title || '';
        // Remove quotes if present
        const cleanText = newsText.replace(/^["']|["']$/g, '');
        
        newsItem.textContent = cleanText;
        tickerContent.appendChild(newsItem);
        
        // Add separator between items (except for the last one)
        if (index < liveNews.length - 1) {
            const separator = document.createElement('span');
            separator.className = 'ticker-separator';
            separator.textContent = ' • ';
            tickerContent.appendChild(separator);
        }
    });
    
    // Duplicate content for seamless infinite loop - append to same parent
    const duplicate = tickerContent.cloneNode(true);
    duplicate.className = 'ticker-content ticker-duplicate';
    tickerContent.parentElement.appendChild(duplicate);
}

async function loadArticles() {
    try {
        document.getElementById('loading').style.display = 'flex';
        const articlesSnapshot = await db.collection('articles')
            .where('status', '==', 'published')
            .get();
        
        // Convert to array and filter/sort
        articlesData = articlesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Filter to ensure only published articles (double-check)
        articlesData = articlesData.filter(article => article.status === 'published');
        
        // Sort by publishedDate descending (newest first)
        articlesData.sort((a, b) => {
            const aTime = getTimestampMillis(a.publishedDate);
            const bTime = getTimestampMillis(b.publishedDate);
            return bTime - aTime; // Descending order (newest first)
        });
        
        displayArticles();
        document.getElementById('loading').style.display = 'none';
    } catch (error) {
        console.error('Error loading articles:', error);
        document.getElementById('loading').style.display = 'none';
    }
}

function displayArticles() {
    const grid = document.getElementById('articlesGrid');
    grid.innerHTML = '';
    
    const articlesToShow = articlesData.slice(0, displayedArticles);
    articlesToShow.forEach(article => {
        grid.appendChild(createArticleCard(article));
    });
    
    const loadMoreBtn = document.getElementById('loadMore');
    if (articlesData.length > displayedArticles) {
        loadMoreBtn.style.display = 'flex';
    } else {
        loadMoreBtn.style.display = 'none';
    }
}

function loadMore() {
    displayedArticles += 10;
    displayArticles();
}

async function loadGenres() {
    try {
        const genresSnapshot = await db.collection('genres').get();
        genres = genresSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        displayGenres();
    } catch (error) {
        console.error('Error loading genres:', error);
    }
}

function displayGenres() {
    const grid = document.getElementById('genresGrid');
    grid.innerHTML = '';
    
    genres.forEach(genre => {
        const card = document.createElement('div');
        card.className = 'genre-card';
        // Use saved icon if available, otherwise auto-assign
        const icon = genre.icon || getGenreIcon(genre.name);
        card.innerHTML = `
            <i class="${icon}"></i>
            <h3>${genre.name}</h3>
        `;
        card.addEventListener('click', () => showGenreArticles(genre));
        grid.appendChild(card);
    });
}

async function showGenreArticles(genre) {
    try {
        document.getElementById('genresGrid').style.display = 'none';
        document.getElementById('genreArticlesContainer').style.display = 'block';
        document.getElementById('selectedGenreTitle').textContent = genre.name;
        
        const articlesSnapshot = await db.collection('articles')
            .where('genre', '==', genre.name)
            .get();
        
        // Convert to array and filter by status
        let genreArticles = articlesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Filter to show only published articles
        genreArticles = genreArticles.filter(article => article.status === 'published');
        
        // Sort by publishedDate descending (newest first)
        genreArticles.sort((a, b) => {
            const aTime = getTimestampMillis(a.publishedDate);
            const bTime = getTimestampMillis(b.publishedDate);
            return bTime - aTime; // Descending order (newest first)
        });
        
        const grid = document.getElementById('genreArticlesGrid');
        grid.innerHTML = '';
        
        genreArticles.forEach(article => {
            grid.appendChild(createArticleCard(article));
        });
        
        if (genreArticles.length === 0) {
            grid.innerHTML = `<p style="text-align: center; color: #666; padding: 40px;">No articles found in this category.</p>`;
        }
    } catch (error) {
        console.error('Error loading genre articles:', error);
    }
}

function backToGenres() {
    document.getElementById('genresGrid').style.display = 'grid';
    document.getElementById('genreArticlesContainer').style.display = 'none';
}

async function loadAboutContent() {
    try {
        const aboutDoc = await db.collection('settings').doc('about').get();
        if (aboutDoc.exists) {
            const aboutData = aboutDoc.data();
            const aboutContent = document.getElementById('aboutContent');
            aboutContent.innerHTML = `
                <div style="text-align: center; margin-bottom: 30px;">
                    ${aboutData.imageUrl ? `<img src="${aboutData.imageUrl}" alt="${aboutData.name}" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; margin-bottom: 20px;">` : ''}
                    <h3 style="font-size: 1.5rem; margin-bottom: 10px;">${aboutData.name || ''}</h3>
                </div>
                <div style="line-height: 1.8; color: #444;">
                    ${aboutData.description || ''}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading about content:', error);
    }
}

async function uploadFile(file, path) {
    const storageRef = storage.ref();
    const fileRef = storageRef.child(`${path}/${Date.now()}_${file.name}`);
    await fileRef.put(file);
    return await fileRef.getDownloadURL();
}

async function handleReporterFormSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const registerText = document.getElementById('registerText');
    const originalText = registerText.textContent;
    
    submitBtn.disabled = true;
    registerText.textContent = translations[currentLang].submitting;
    
    try {
        const formData = new FormData(e.target);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            if (key !== 'profilePic' && key !== 'idProof' && key !== 'otherDocs') {
                data[key] = value;
            }
        }
        
        if (formData.get('profilePic').size > 0) {
            data.profilePicUrl = await uploadFile(formData.get('profilePic'), 'reporters/profiles');
        }
        
        if (formData.get('idProof').size > 0) {
            data.idProofUrl = await uploadFile(formData.get('idProof'), 'reporters/ids');
        }
        
        const otherDocsFiles = formData.getAll('otherDocs');
        if (otherDocsFiles.length > 0 && otherDocsFiles[0].size > 0) {
            data.otherDocsUrls = [];
            for (let file of otherDocsFiles) {
                if (file.size > 0) {
                    const url = await uploadFile(file, 'reporters/documents');
                    data.otherDocsUrls.push(url);
                }
            }
        }
        
        data.submittedAt = firebase.firestore.FieldValue.serverTimestamp();
        data.status = 'pending';
        
        await db.collection('reporterApplications').add(data);
        
        alert(translations[currentLang].successMessage);
        e.target.reset();
        
    } catch (error) {
        console.error('Error submitting form:', error);
        alert(translations[currentLang].errorMessage);
    } finally {
        submitBtn.disabled = false;
        registerText.textContent = originalText;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('langToggle').addEventListener('click', switchLanguage);
    
    document.querySelectorAll('.nav-link, .footer-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.target.getAttribute('data-page');
            showSection(page);
        });
    });
    
    document.getElementById('navToggle').addEventListener('click', () => {
        document.getElementById('navMenu').classList.toggle('active');
    });
    
    document.getElementById('loadMore').addEventListener('click', loadMore);
    
    document.getElementById('backToGenres').addEventListener('click', backToGenres);
    
    document.getElementById('reporterForm').addEventListener('submit', handleReporterFormSubmit);
    
    // Increment website visit counter
    incrementWebsiteVisits();
    
    loadLiveNews();
    loadArticles();
    loadGenres();
    loadAboutContent();
});

// Increment website visits counter (date-wise)
async function incrementWebsiteVisits() {
    try {
        const statsRef = db.collection('stats').doc('website');
        const statsDoc = await statsRef.get();
        
        // Get current date in YYYY-MM-DD format (IST)
        const now = new Date();
        const istDate = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
        const dateKey = istDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        
        if (statsDoc.exists) {
            const stats = statsDoc.data();
            const dailyVisits = stats.dailyVisits || {};
            const currentCount = dailyVisits[dateKey] || 0;
            
            // Update the specific date's count
            await statsRef.update({
                [`dailyVisits.${dateKey}`]: currentCount + 1,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            // Document doesn't exist, create it with initial value for today
            await statsRef.set({
                dailyVisits: {
                    [dateKey]: 1
                },
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    } catch (error) {
        console.error('Error incrementing website visits:', error);
        // Silently fail - don't interrupt user experience
    }
}

