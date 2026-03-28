/**
 * hadith.js - Main logic for the Hadith collections reader
 */

let hadithData = {
    ar: [],
    translation: []
};

let currentLanguage = 'en';
let currentBookId = null;
let currentCollection = 'bukhari';
let allBooks = [];
const BASE_PATH = '/hadith';
const ALL_COLLECTIONS = ['bukhari', 'muslim', 'tirmidhi', 'abudawud', 'nasai', 'ibnmajah', 'malik', 'ahmad', 'darimi'];

const COLLECTION_NAMES = {
    'bukhari': 'Sahih al-Bukhari',
    'muslim': 'Sahih Muslim',
    'tirmidhi': 'Jami` at-Tirmidhi',
    'abudawud': 'Sunan Abi Dawud',
    'nasai': 'Sunan an-Nasa\'i',
    'ibnmajah': 'Sunan Ibn Majah',
    'malik': 'Muwatta Malik',
    'ahmad': 'Musnad Ahmad',
    'darimi': 'Sunan ad-Darimi'
};

const LANGUAGE_SUPPORT = {
    'bukhari': ['en', 'ur', 'bn'],
    'muslim': ['en'],
    'abudawud': ['en', 'ur'],
    'nasai': ['en'],
    'tirmidhi': ['en'],
    'ibnmajah': ['en', 'ur'],
    'malik': ['en'],
    'ahmad': ['en'],
    'darimi': ['en']
};

const COLLECTION_METADATA = {
    'bukhari': {
        about: "Sahih al-Bukhari is a collection of hadith compiled by Imam Muhammad al-Bukhari (d. 256 AH/870 CE) (rahimahullah). His collection is recognized by the overwhelming majority of the Muslim world to be the most authentic collection of reports of the Sunnah of the Prophet Muhammad (ﷺ). It contains over 7500 hadith (with repetitions) in 97 books. The translation provided here is by Dr. M. Muhsin Khan.",
        bio: "Imam Muhammad al-Bukhari (194–256 AH) is one of the greatest scholars of hadith. He spent sixteen years compiling his Sahih, selecting only the most authentic narrations from over 600,000 reports he had collected. He died in 256 AH (870 CE)."
    },
    'muslim': {
        about: "Sahih Muslim is the second most authentic collection of hadith after Sahih al-Bukhari. It was compiled by Imam Muslim ibn al-Hajjaj al-Naysaburi (rahimahullah). The collection includes roughly 7,500 hadith (with repetitions) across 57 books.",
        bio: "Imam Muslim was born in 204 AH (817 CE) in Nishapur. He traveled extensively to Iraq, Hijaz, Syria, and Egypt to study under great scholars like Ahmad ibn Hanbal and Al-Bukhari. He passed away in 261 AH (875 CE)."
    },
    'tirmidhi': {
        about: "Jami` at-Tirmidhi is one of the 'Six Books' (Al-Kutub al-Sittah) of hadith. It was compiled by Imam Abu 'Isa at-Tirmidhi (rahimahullah). It is known for its classification of each hadith (Authentic, Fair, or Weak).",
        bio: "Imam at-Tirmidhi (209–279 AH / 824–892 AD) was born in Tirmidh. He was a student of Imam al-Bukhari and was known for his exceptional memory and meticulous scholarship in the science of hadith."
    },
    'abudawud': {
        about: "Sunan Abi Dawud was compiled by Imam Abu Dawud Sulayman ibn al-Ash'ath (rahimahullah). It focuses primarily on traditions containing legal rulings (Ahkam). It contains 5,274 hadith in 43 books.",
        bio: "Imam Abu Dawud (202–275 AH) was born in Sijistan. He traveled across the Muslim world to collect authentic narrations and was one of the most prominent students of Imam Ahmad ibn Hanbal."
    },
    'nasai': {
        about: "Sunan an-Nasa'i is one of the six major collections of hadith, compiled by Imam Ahmad an-Nasa'i (rahimahullah). It has the fewest weak hadiths among the Sunan collections.",
        bio: "Imam an-Nasa'i (215–303 AH) was born in Nasa. He was famous for his strictness in evaluating narrators and his vast knowledge of the defects in hadith chains (ilal)."
    },
    'ibnmajah': {
        about: "Sunan Ibn Majah was compiled by Imam Muhammad ibn Yazid Ibn Majah (rahimahullah). It is the last of the six major books of hadith, containing 4,341 hadith in 37 books.",
        bio: "Imam Ibn Majah (209–273 AH) was born in Qazwin. He was a great scholar of tafsir, history, and hadith, and he traveled widely to Iraq, Syria, Egypt, and Hijaz for his studies."
    },
    'malik': {
        about: "Muwatta Malik is one of the earliest and most respected collections of hadith and legal rulings, compiled by Imam Malik ibn Anas (rahimahullah), the founder of the Maliki school.",
        bio: "Imam Malik ibn Anas (93–179 AH / 711–795 CE) lived his entire life in Madinah. He is known as 'The Imam of the Abode of Hijrah' and was a teacher to many great scholars, including Imam ash-Shafi'i."
    },
    'ahmad': {
        about: "Musnad Ahmad is one of the largest and most famous collections of hadith, containing approximately 27,000 narrations arranged by the companion (Sahabi) from whom they were narrated.",
        bio: "Imam Ahmad ibn Hanbal (164–241 AH) was the founder of the Hanbali school of jurisprudence. He is widely respected for his steadfastness during the trial of the 'Creation of the Quran' (Mihna)."
    },
    'darimi': {
        about: "Sunan ad-Darimi, compiled by Imam Abdullah ibn Abd ar-Rahman ad-Darimi (rahimahullah), is highly regarded for its topical arrangement and the high status of its narrators.",
        bio: "Imam ad-Darimi (d. 255 AH/869 CE) was a prominent scholar from Samarkand. He was known for his mastery of hadith and was highly praised by his contemporaries, including Imam al-Bukhari."
    }
};

// Cookie Helpers
function setCookie(name, value, days = 365) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Check for pending SPA redirect path (from 404.html)
    const pendingPath = sessionStorage.getItem('spa_redirect_path');
    if (pendingPath) {
        sessionStorage.removeItem('spa_redirect_path');
        history.replaceState(null, '', pendingPath);
    }
    
    lucide.createIcons();
    
    // 1. Determine Initial Language from Cookie or default
    const savedLang = getCookie('hadith_lang');
    currentLanguage = savedLang || 'en';
    const langSelector = document.getElementById('hadith-lang-selector');
    if (langSelector) langSelector.value = currentLanguage;

    // 2. Initial Route Handling
    await handleRouting();
    
    setupEventListeners();
    
    // Mobile Sidebar Toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.onclick = () => {
             const eqSidebar = document.querySelector('eq-sidebar');
             if (eqSidebar && typeof eqSidebar.toggle === 'function') {
                 eqSidebar.toggle();
             }
        };
    }

    // Handle back/forward buttons
    window.onpopstate = () => handleRouting();
});

// Main Route Logic
async function handleRouting() {
    const path = window.location.pathname;
    const parts = path.split('/').filter(p => p !== '');
    
    // Find collection and deep link info
    // URL pattern: /hadith/collection/reference
    const baseIdx = parts.indexOf('hadith');
    let collection = null;
    let reference = null;

    // Reset search when routing
    const searchInput = document.getElementById('hadith-search-input');
    if (searchInput && searchInput.value !== '') {
        searchInput.value = '';
        document.getElementById('search-results-view').style.display = 'none';
        document.getElementById('search-query-text').textContent = '';
    }

    if (baseIdx !== -1 && parts.length > baseIdx + 1) {
        collection = parts[baseIdx + 1];
        if (parts.length > baseIdx + 2) {
            reference = parts[baseIdx + 2];
        }
    }

    if (!collection || collection === 'index.html' || collection === 'all') {
        // Global Mode - ENFORCE ENGLISH on Home
        currentCollection = 'all';
        currentLanguage = 'en'; 
        const langSelector = document.getElementById('hadith-lang-selector');
        if (langSelector) langSelector.value = 'en';
        
        // Hide breadcrumbs on Global home
        const bc = document.querySelector('.breadcrumb-mini');
        if (bc) bc.style.display = 'none';

        updateSidebarActiveState('all');
        renderGlobalBooksGrid();
        return;
    }
    
    // Show breadcrumbs on deeper pages
    const bc = document.querySelector('.breadcrumb-mini');
    if (bc) bc.style.display = 'flex';

    // If collection changed, reload data
    if (collection !== currentCollection || hadithData.ar.length === 0) {
        await loadLanguageData(currentLanguage, collection);
        return; // loadLanguageData calls route again if needed
    }

    updateSidebarActiveState(collection);

    if (reference) {
        if (reference.startsWith('book-')) {
            const bId = parseInt(reference.replace('book-', ''));
            navigateToBook(bId, false);
        } else if (reference.includes(':')) {
            const [bId, hId] = reference.split(':');
            renderSingleHadithView(parseInt(bId), hId, false);
        } else {
            renderBooksGrid(false);
        }
    } else {
        renderBooksGrid(false);
    }
}

// Load Arabic and Translation JSON
async function loadLanguageData(lang, collection = 'bukhari') {
    showLoader(true);
    try {
        currentCollection = collection;

        // Update sidebar component drop-down based on supported langs
        const eqSidebar = document.querySelector('eq-sidebar');
        if (eqSidebar && typeof eqSidebar.setAvailableLanguages === 'function') {
            const supported = LANGUAGE_SUPPORT[collection] || ['en'];
            eqSidebar.setAvailableLanguages(supported);
            
            // If current lang is not supported for this collection, switch back to 'en'
            if (!supported.includes(lang)) {
                console.warn(`${lang} is not supported for ${collection}. Switching to English.`);
                lang = 'en'; // Use English instead for data fetching
                currentLanguage = 'en';
                const langSelector = document.getElementById('hadith-lang-selector');
                if (langSelector) langSelector.value = 'en';
            }
        }
        
        // Reset and Load data
        const arResponse = await fetch(`/assets/${collection}/${collection}_ar.json`);
        hadithData.ar = await arResponse.json();

        let transResponse = await fetch(`/assets/${collection}/${collection}_${lang}.json`);
        let transData = await transResponse.json();
        
        let isFallback = false;
        if (transData.length === 0 && lang !== 'ar' && lang !== 'en') {
            console.warn(`Falling back to English for ${collection}`);
            const fallbackResponse = await fetch(`/assets/${collection}/${collection}_en.json`);
            transData = await fallbackResponse.json();
            isFallback = true;
        }

        hadithData.translation = transData;
        currentLanguage = isFallback ? 'en' : lang; // temporary language for current collection
        
        const subtitleEl = document.getElementById('book-selection-view').querySelector('.view-subtitle');
        subtitleEl.innerHTML = `Authenticated narrations from ${COLLECTION_NAMES[collection]}.`;

        // Update Metadata Card
        const metaCard = document.getElementById('collection-metadata');
        const meta = COLLECTION_METADATA[collection];
        if (meta) {
            document.getElementById('metadata-about').textContent = meta.about;
            document.getElementById('metadata-bio').textContent = meta.bio;
            metaCard.style.display = 'block';
        } else {
            metaCard.style.display = 'none';
        }

        extractBooks();

        // Finalize routing now that data is loaded
        const path = window.location.pathname;
        const parts = path.split('/').filter(p => p !== '');
        const baseIdx = parts.indexOf('hadith');
        const reference = (baseIdx !== -1 && parts.length > baseIdx + 2) ? parts[baseIdx + 2] : null;

        if (reference) {
            if (reference.startsWith('book-')) {
                const bId = parseInt(reference.replace('book-', ''));
                navigateToBook(bId, false);
            } else if (reference.includes(':')) {
                const [bId, hId] = reference.split(':');
                renderSingleHadithView(parseInt(bId), hId, false);
            } else {
                renderBooksGrid(false);
            }
        } else {
            renderBooksGrid(false);
        }

    } catch (error) {
        console.error('Error loading hadith data:', error);
    } finally {
        showLoader(false);
    }
}


// Extract a unique list of books from the translation data
function extractBooks() {
    const bookMap = new Map();
    
    hadithData.translation.forEach(hadith => {
        if (!bookMap.has(hadith.book_number)) {
            // Find corresponding Arabic book name
            const arHadith = hadithData.ar.find(h => h.book_number === hadith.book_number);
            const hRefStr = hadith.hadith_number || "";
            const hNum = parseInt(hRefStr.match(/\d+/)?.[0]) || hadith.in_book_hadith_number;
            
            bookMap.set(hadith.book_number, {
                id: hadith.book_number,
                name: hadith.book_name,
                nameAr: arHadith ? arHadith.book_name : '',
                first: hNum,
                last: hNum
            });
        } else {
            const b = bookMap.get(hadith.book_number);
            const hRefStr = hadith.hadith_number || "";
            const hNum = parseInt(hRefStr.match(/\d+/)?.[0]) || hadith.in_book_hadith_number;
            
            if (hNum > 0) {
                b.first = Math.min(b.first, hNum);
                b.last = Math.max(b.last, hNum);
            }
        }
    });

    allBooks = Array.from(bookMap.values()).sort((a, b) => a.id - b.id);
}

// Render the grid of books for selection
function renderBooksGrid(pushToHistory = true) {
    currentBookId = null;
    if (pushToHistory) {
        history.pushState(null, '', `${BASE_PATH}/${currentCollection}/`);
    }
    updateSidebarActiveState();

    // Show language selector on collection books page
    const footer = document.querySelector('.sidebar-footer');
    if (footer) footer.classList.remove('hidden');

    const titleEl = document.getElementById('book-selection-view').querySelector('h1');
    titleEl.textContent = COLLECTION_NAMES[currentCollection] || 'All Collections';
    if (currentLanguage === 'ur') titleEl.classList.add('urdu');
    else titleEl.classList.remove('urdu');
    
    document.getElementById('book-selection-view').querySelector('.view-subtitle').textContent = `Authenticated narrations from ${COLLECTION_NAMES[currentCollection] || currentCollection}.`;
    document.title = `${COLLECTION_NAMES[currentCollection] || 'Hadith'} - Easy Quran`;

    const isUrdu = currentLanguage === 'ur';

    const grid = document.getElementById('books-grid');
    grid.innerHTML = '';
    
    allBooks.forEach(book => {
        const card = document.createElement('a');
        card.href = `${BASE_PATH}/${currentCollection}/book-${book.id}`;
        card.className = 'book-card';
        card.innerHTML = `
            <div class="book-number-row">
                <span class="book-number">Book ${book.id}</span>
                <span class="book-range">${book.first} - ${book.last}</span>
            </div>
            <div class="book-name ${isUrdu ? 'urdu' : ''}">${book.name}</div>
            <div class="book-card-arrow">
                <i data-lucide="arrow-right" style="width: 16px; height: 16px;"></i>
            </div>
        `;
        card.onclick = (e) => {
            e.preventDefault();
            navigateToBook(book.id);
        };
        grid.appendChild(card);
    });

    document.getElementById('book-selection-view').style.display = 'block';
    document.getElementById('hadith-list-view').style.display = 'none';
    document.getElementById('search-results-view').style.display = 'none';
    document.getElementById('breadcrumb-book').textContent = 'All Books';
    
    // Crucial: Create icons for dynamically added cards
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Global View: Books from EVERY collection
async function renderGlobalBooksGrid() {
    currentBookId = null;
    currentCollection = 'all';
    const grid = document.getElementById('books-grid');
    grid.innerHTML = '<div class="loader-container"><div class="loader"></div></div>';
    
    // Hide language selector on global index page
    const footer = document.querySelector('.sidebar-footer');
    if (footer) footer.classList.add('hidden');
    
    // Hide metadata on global view
    const metaCard = document.getElementById('collection-metadata');
    if (metaCard) metaCard.style.display = 'none';

    const globalTitle = document.getElementById('book-selection-view').querySelector('h1');

    globalTitle.textContent = 'All Collections';
    if (currentLanguage === 'ur') globalTitle.classList.add('urdu');
    else globalTitle.classList.remove('urdu');

    document.getElementById('book-selection-view').querySelector('.view-subtitle').textContent = 'Explore thousands of authenticated narrations from the 9 major collections of Ahadith.';
    document.getElementById('breadcrumb-book').textContent = 'General Overview';
    document.title = 'All Hadith Collections - Easy Quran';

    const allGlobalBooks = [];

    // Parallel fetch all metadata
    const fetchPromises = ALL_COLLECTIONS.map(async (collKey) => {
        try {
            const resp = await fetch(`/assets/${collKey}/${collKey}_${currentLanguage}.json`);
            const data = await resp.json();
            const bookMap = new Map();
            data.forEach(h => {
                if(!bookMap.has(h.book_number)) {
                    bookMap.set(h.book_number, {
                        collection: collKey,
                        id: h.book_number,
                        name: h.book_name
                    });
                }
            });
            return Array.from(bookMap.values());
        } catch(e) { return []; }
    });

    const results = await Promise.all(fetchPromises);
    results.forEach(books => allGlobalBooks.push(...books));

    grid.innerHTML = '';
    allGlobalBooks.forEach(book => {
        const card = document.createElement('a');
        card.href = `${BASE_PATH}/${book.collection}/book-${book.id}`;
        card.className = 'book-card';
        card.innerHTML = `
            <div class="book-number" style="font-size: 0.7rem;">${COLLECTION_NAMES[book.collection]} • Book ${book.id}</div>
            <div class="book-name ${currentLanguage === 'ur' ? 'urdu' : ''}" style="margin-bottom: 5px;">${book.name}</div>
            <div class="book-card-arrow">
                <i data-lucide="arrow-right" style="width: 16px; height: 16px;"></i>
            </div>
        `;
        card.onclick = (e) => {
            e.preventDefault();
            currentCollection = book.collection;
            loadLanguageData(currentLanguage, book.collection).then(() => navigateToBook(book.id));
        };
        grid.appendChild(card);
    });

    document.getElementById('book-selection-view').style.display = 'block';
    document.getElementById('hadith-list-view').style.display = 'none';
    document.getElementById('search-results-view').style.display = 'none';
    document.getElementById('btn-back-to-books').style.display = 'none';
    
    // Crucial: Create icons for dynamically added cards
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Navigate to a specific book
function navigateToBook(bookId, pushToHistory = true) {
    currentBookId = bookId;
    const book = allBooks.find(b => b.id === bookId);
    if (!book) return;

    if (pushToHistory) {
        history.pushState(null, '', `${BASE_PATH}/${currentCollection}/book-${bookId}`);
    }
    updateSidebarActiveState();

    // Keep language selector visible
    const footer = document.querySelector('.sidebar-footer');
    if (footer) footer.classList.remove('hidden');
    
    document.getElementById('view-book-number').textContent = `Book ${book.id}`;
    const headerName = document.getElementById('view-book-name');
    headerName.textContent = book.name;
    if (currentLanguage === 'ur') headerName.classList.add('urdu');
    else headerName.classList.remove('urdu');
    
    document.getElementById('breadcrumb-book').textContent = book.name;
    
    renderHadiths(bookId);

    document.getElementById('book-selection-view').style.display = 'none';
    document.getElementById('hadith-list-view').style.display = 'block';
    document.getElementById('search-results-view').style.display = 'none';
    document.getElementById('btn-back-to-books').style.display = 'flex';
    
    // Scroll to top
    document.querySelector('.content-area').scrollTop = 0;
}

// Render Hadiths in a book
function renderHadiths(bookId) {
    const container = document.getElementById('hadiths-container');
    container.innerHTML = '';

    const bookHadiths = hadithData.translation.filter(h => h.book_number === bookId);

    bookHadiths.forEach(hadith => {
        const index = hadithData.translation.indexOf(hadith);
        const arHadith = hadithData.ar[index];

        const card = createHadithCard(hadith, arHadith);
        container.appendChild(card);
    });
    lucide.createIcons();
}

// Single Hadith View
function renderSingleHadithView(bookId, hadithNum, pushToHistory = true) {
    const book = allBooks.find(b => b.id === bookId);
    if (!book) return;

    if (pushToHistory) {
        history.pushState(null, '', `${BASE_PATH}/${currentCollection}/${bookId}:${hadithNum}`);
    }

    // Keep language selector visible
    const footer = document.querySelector('.sidebar-footer');
    if (footer) footer.classList.remove('hidden');

    const container = document.getElementById('hadiths-container');
    container.innerHTML = '';
    
    const hadith = hadithData.translation.find(h => h.book_number === bookId && (h.in_book_hadith_number == hadithNum || h.hadith_number.includes(hadithNum)));
    const index = hadithData.translation.indexOf(hadith);
    const arHadith = hadithData.ar[index];

    if (hadith) {
        const card = createHadithCard(hadith, arHadith);
        card.classList.remove('collapsed');
        card.classList.add('expanded');
        container.appendChild(card);
        lucide.createIcons();
    }

    document.getElementById('view-book-number').textContent = `Book ${book.id}`;
    document.getElementById('view-book-name').textContent = `Hadith ${hadithNum}`;
    document.getElementById('breadcrumb-book').textContent = book.name;
    
    document.getElementById('book-selection-view').style.display = 'none';
    document.getElementById('hadith-list-view').style.display = 'block';
    document.getElementById('search-results-view').style.display = 'none';
}

// Highlighting utility
function highlightText(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

// Arabic normalization helper (removes tashkeel)
function normalizeArabic(text) {
    return text.replace(/[\u064B-\u0652]/g, "");
}

// Helper to create a Hadith Card element
function createHadithCard(hadith, arHadith, searchQuery = null, specificColl = null) {
    const card = document.createElement('div');
    card.className = 'hadith-card collapsed';
    
    // Toggle expand/collapse on card click
    card.onclick = (e) => {
        // Don't toggle if clicking a button inside actions
        if (e.target.closest('.hadith-actions')) return;
        card.classList.toggle('collapsed');
        card.classList.toggle('expanded');
    };
    
    const isUrdu = currentLanguage === 'ur';
    const isBengali = currentLanguage === 'bn';
    const activeColl = specificColl || currentCollection;

    let narratorHtml = hadith.narrator;
    let textHtml = hadith.text;
    let arabicHtml = arHadith ? arHadith.text : 'Arabic text not found';

    if (searchQuery) {
        narratorHtml = highlightText(narratorHtml, searchQuery);
        textHtml = highlightText(textHtml, searchQuery);
        arabicHtml = highlightText(arabicHtml, searchQuery);
    }

    // Link for deep linking
    const hadithId = hadith.hadith_number.replace(/\s+/g, '-').toLowerCase();
    card.id = hadithId;

    card.innerHTML = `
        <div class="hadith-meta">
            <div class="hadith-ref">
                <span class="hadith-ref-text">${hadith.hadith_number}</span>
                <span class="hadith-book-ref">In-book reference${hadith.in_book_reference}</span>
            </div>
            <div class="hadith-actions">
                <a href="${BASE_PATH}/${activeColl}/${hadith.book_number}:${hadith.in_book_hadith_number}" class="hadith-link-btn" title="Open Dedicated View" onclick="event.preventDefault(); currentCollection='${activeColl}'; loadLanguageData(currentLanguage, '${activeColl}').then(() => renderSingleHadithView(${hadith.book_number}, '${hadith.in_book_hadith_number}'))">
                    <i data-lucide="external-link"></i>
                </a>
                <a href="javascript:void(0)" class="hadith-link-btn" title="Copy Direct Link" onclick="navigator.clipboard.writeText(window.location.origin + '${BASE_PATH}/${activeColl}/${hadith.book_number}:${hadith.in_book_hadith_number}'); alert('Link copied!'); return false;">
                    <i data-lucide="link"></i>
                </a>
                <a href="javascript:void(0)" 
                   class="hadith-link-btn" 
                   title="Share to WhatsApp" 
                   data-coll="${activeColl}"
                   data-ref="${hadith.hadith_number}"
                   data-text="${hadith.text.replace(/"/g, '&quot;')}"
                   data-narrator="${hadith.narrator.replace(/"/g, '&quot;')}"
                   onclick="shareToWhatsApp(this); return false;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>
                <a href="javascript:void(0)" 
                   class="hadith-link-btn share-btn" 
                   title="More Share Options" 
                   data-coll="${activeColl}"
                   data-ref="${hadith.hadith_number}"
                   data-text="${hadith.text.replace(/"/g, '&quot;')}"
                   data-narrator="${hadith.narrator.replace(/"/g, '&quot;')}"
                   onclick="shareHadithElement(this); return false;">
                    <i data-lucide="share-2"></i>
                </a>
            </div>
        </div>
        ${hadith.chapter_name && hadith.chapter_name !== 'باب' ? `<div class="chapter-badge">${hadith.chapter_name}</div>` : ''}
        
        <div class="hadith-body">
            <!-- Arabic Content (Visible only if Arabic selected) -->
            ${currentLanguage === 'ar' ? `
                <div class="hadith-arabic">${arabicHtml}</div>
            ` : ''}

            <!-- Translation Content (Visible if translation selected) -->
            ${currentLanguage !== 'ar' ? `
                <div class="hadith-content">
                    <div class="hadith-narrator ${isUrdu ? 'urdu' : ''}">${narratorHtml}</div>
                    <div class="hadith-text ${isUrdu ? 'urdu' : ''} ${isBengali ? 'bengali' : ''}">${textHtml}</div>
                </div>
            ` : ''}
        </div>
    `;
    return card;
}

// Global/Local Search logic
// Global/Local Search logic
const collectionCache = new Map();

async function performSearch(query) {
    if (!query || query.trim().length < 2) return;
    
    const lowerQuery = query.toLowerCase();
    const normalizedQuery = normalizeArabic(lowerQuery);
    let totalFound = 0;
    const itemsToRender = [];
    
    showLoader(true);

    if (currentCollection !== 'all') {
        const count = doLocalSearch(query, hadithData, itemsToRender, currentCollection);
        totalFound = count;
    } else {
        // MULTI-COLLECTION MEGA SEARCH - Optimized with Parallel Fetching & Caching
        const fetchAndSearch = async (collKey) => {
            try {
                let data = collectionCache.get(collKey);
                
                if (!data) {
                    const [trResp, arResp] = await Promise.all([
                        fetch(`/assets/${collKey}/${collKey}_${currentLanguage}.json`),
                        fetch(`/assets/${collKey}/${collKey}_ar.json`)
                    ]);
                    
                    data = {
                        translation: await trResp.json(),
                        ar: await arResp.json()
                    };
                    collectionCache.set(collKey, data);
                }
                
                const count = doLocalSearch(query, data, itemsToRender, collKey);
                return count;
            } catch(e) {
                console.warn(`Search failed for ${collKey}:`, e);
                return 0;
            }
        };

        const counts = await Promise.all(ALL_COLLECTIONS.map(coll => fetchAndSearch(coll)));
        totalFound = counts.reduce((sum, c) => sum + c, 0);
    }
    
    renderSearchResults(query, itemsToRender, totalFound);
    showLoader(false);
}

function doLocalSearch(query, data, results, collKey) {
    const lowerQuery = query.toLowerCase();
    const normalizedQuery = normalizeArabic(lowerQuery);
    let countInColl = 0;
    
    for (let i = 0; i < data.translation.length; i++) {
        const hadith = data.translation[i];
        const arHadith = data.ar[i];
        
        const matchesText = (hadith.text.toLowerCase().includes(lowerQuery) || 
                             hadith.narrator.toLowerCase().includes(lowerQuery) ||
                             (arHadith && normalizeArabic(arHadith.text.toLowerCase()).includes(normalizedQuery)));
        
        const matchesNum = (hadith.hadith_number.toLowerCase().includes(lowerQuery) ||
                            hadith.in_book_hadith_number.toString() === lowerQuery ||
                            `${hadith.book_number}:${hadith.in_book_hadith_number}` === lowerQuery);
        
        if (matchesText || matchesNum) {
            countInColl++;
            results.push({hadith, arHadith, collKey});
        }
    }
    return countInColl;
}

function renderSearchResults(query, results, totalFound) {
    const resultsView = document.getElementById('search-results-view');
    const resultsContainer = document.getElementById('search-results-container');
    const queryText = document.getElementById('search-query-text');
    
    queryText.textContent = `Found ${totalFound.toLocaleString()} hadith(s) for "${query}"`;
    resultsContainer.innerHTML = '';

    if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">No hadiths found matching your search.</div>';
    } else {
        results.forEach(res => {
            const card = createHadithCard(res.hadith, res.arHadith, query, res.collKey);
            resultsContainer.appendChild(card);
        });
        lucide.createIcons();
    }

    document.getElementById('book-selection-view').style.display = 'none';
    document.getElementById('hadith-list-view').style.display = 'none';
    resultsView.style.display = 'block';
}

// Event Listeners
function setupEventListeners() {

    // Home/All Collections Link
    const navHadithMain = document.getElementById('nav-hadith-main');
    if (navHadithMain) {
        navHadithMain.onclick = (e) => {
            e.preventDefault();
            history.pushState(null, '', BASE_PATH + '/');
            handleRouting();
        };
    }

    // Logo click to Home
    const logoLink = document.querySelector('.sidebar .logo');
    if (logoLink) {
        logoLink.style.cursor = 'pointer';
        logoLink.onclick = () => {
             history.pushState(null, '', BASE_PATH + '/');
             handleRouting();
        };
    }

    // Collection Links
    document.querySelectorAll('#collections-list .nav-link').forEach(link => {
        link.onclick = (e) => {
            e.preventDefault();
            const coll = link.getAttribute('data-collection');
            history.pushState(null, '', `${BASE_PATH}/${coll}/`);
            handleRouting();
        };
    });

    // Language selector (Check main document then check Sidebar component if needed)
    const langSelector = document.getElementById('hadith-lang-selector');
    if (langSelector) {
        langSelector.onchange = (e) => {
            setCookie('hadith_lang', e.target.value);
            loadLanguageData(e.target.value, currentCollection);
        };
    }

    // Search input
    const searchInput = document.getElementById('hadith-search-input');
    if (searchInput) {
        let searchTimeout;
        searchInput.oninput = (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            console.log('Search input triggered:', query);
            searchTimeout = setTimeout(() => {
                if (query.length === 0) {
                    if (currentBookId) navigateToBook(currentBookId);
                    else renderBooksGrid();
                } else if (query.length >= 2) {
                    performSearch(query);
                }
            }, 500);
        };
    }

    // Sidebar Read Quran button (Let browser handle href directly)
    // No onclick needed

    // Breadcrumbs
    const bcHome = document.getElementById('breadcrumb-home');
    if (bcHome) {
        bcHome.onclick = () => {
            history.pushState(null, '', BASE_PATH + '/');
            handleRouting();
        };
    }

    const bcColl = document.getElementById('breadcrumb-collection');
    if (bcColl) {
        bcColl.onclick = () => {
            if (currentCollection !== 'all') {
                history.pushState(null, '', `${BASE_PATH}/${currentCollection}/`);
                handleRouting();
            } else {
                history.pushState(null, '', BASE_PATH + '/');
                handleRouting();
            }
        };
    }

    const bcBook = document.getElementById('breadcrumb-book');
    if (bcBook) {
        bcBook.onclick = () => {
            if (currentBookId) navigateToBook(currentBookId);
            else if (currentCollection !== 'all') renderBooksGrid();
            else handleRouting();
        };
    }
}

// UI Helpers
// Update Active State in Sidebar
function updateSidebarActiveState(collection) {
    const sidebar = document.querySelector('eq-sidebar');
    if (sidebar && sidebar.updateActiveFromPath) {
        sidebar.updateActiveFromPath();
    }

    // Dynamic Search Placeholder
    const searchInput = document.getElementById('hadith-search-input');
    if (searchInput) {
        if (currentCollection === 'all') {
            searchInput.placeholder = 'Search across All Collections (114,000+ Hadiths)...';
        } else {
            const name = COLLECTION_NAMES[currentCollection] || currentCollection;
            searchInput.placeholder = `Search in ${name}...`;
        }
    }
}

function showLoader(show) {
    const grid = document.getElementById('books-grid');
    const container = document.getElementById('hadiths-container');
    const searchResults = document.getElementById('search-results-container');
    
    if (show) {
        const loader = '<div class="loader-container"><div class="loader"></div></div>';
        if (currentBookId === null && document.getElementById('search-results-view').style.display !== 'block') {
            grid.innerHTML = loader;
        } else if (document.getElementById('search-results-view').style.display === 'block') {
            searchResults.innerHTML = loader;
        } else {
            container.innerHTML = loader;
        }
    }
}

function shareHadithElement(el) {
    const coll = el.getAttribute('data-coll');
    const ref = el.getAttribute('data-ref');
    const text = el.getAttribute('data-text').replace(/&quot;/g, '"');
    const narrator = el.getAttribute('data-narrator').replace(/&quot;/g, '"');
    
    const collName = COLLECTION_NAMES[coll] || coll;
    const shareTitle = `Hadith: ${collName} (${ref})`;
    const shareBody = `Narrated by: ${narrator}\n\n"${text}"\n\nShared via Easy Quran`;
    const shareUrl = window.location.origin + `${BASE_PATH}/${coll}/${ref.split(' ')[0]}`; // Direct book-level link
    
    // Try Web Share API (Mobile/Modern)
    if (navigator.share) {
        navigator.share({
            title: shareTitle,
            text: shareBody,
            url: shareUrl
        }).catch(err => {
            console.log('Share error:', err);
        });
    } else {
        // Fallback: Clipboard + WhatsApp URL
        const fullClipText = `${shareTitle}\n\n${shareBody}\n\nRead more: ${shareUrl}`;
        navigator.clipboard.writeText(fullClipText).then(() => {
            if (confirm('Hadith text copied to clipboard!\n\nWould you like to open WhatsApp to paste it?')) {
                window.open(`https://wa.me/?text=${encodeURIComponent(fullClipText)}`, '_blank');
            }
        });
    }
}

function shareToWhatsApp(el) {
    const coll = el.getAttribute('data-coll');
    const ref = el.getAttribute('data-ref');
    const text = el.getAttribute('data-text').replace(/&quot;/g, '"');
    const narrator = el.getAttribute('data-narrator').replace(/&quot;/g, '"');
    
    const collName = COLLECTION_NAMES[coll] || coll;
    const fullText = `Hadith: ${collName} (${ref})\n\nNarrated by: ${narrator}\n\n"${text}"\n\nShared via Easy Quran\nLink: ${window.location.origin}${BASE_PATH}/${coll}/${ref.split(' ')[0]}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(fullText)}`, '_blank');
}
