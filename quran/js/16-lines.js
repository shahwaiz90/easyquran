/** 
 * 16-Line Quran Reader Logic
 * Uses PDF.js for rendering
 */

let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let scale = 1.5;
let ctx = null;
let currentParah = null;
let verseToPageMap = {};
let globalIndexToVerse = {};
let swiper = null;
let renderedPages = new Set();

const SURAHS = [
    ["Al-Fatihah", "الفاتحة"], ["Al-Baqarah", "البقرة"], ["Ali 'Imran", "آل عمران"], ["An-Nisa'", "النساء"], ["Al-Ma'idah", "المائدة"], ["Al-An'am", "الأنعام"], ["Al-A'raf", "الأعراف"], ["Al-Anfal", "الأنفال"], ["At-Tawbah", "التوبة"], ["Yunus", "يونس"], ["Hud", "هود"], ["Yusuf", "يوسف"], ["Ar-Ra'd", "الرعد"], ["Ibrahim", "إبراهيم"], ["Al-Hijr", "الحجر"], ["An-Nahl", "النحل"], ["Al-Isra'", "الإسراء"], ["Al-Kahf", "الكهف"], ["Maryam", "مریم"], ["Ta-Ha", "طه"], ["Al-Anbiya'", "الأنبيآء"], ["Al-Hajj", "الحج"], ["Al-Mu'minun", "المؤمنون"], ["An-Nur", "النور"], ["Al-Furqan", "الفرقان"], ["Ash-Shu'ara'", "الشعراء"], ["An-Naml", "النمل"], ["Al-Qasas", "القصص"], ["Al-'Ankabut", "العنكبوت"], ["Ar-Rum", "الروم"], ["Luqman", "لقمان"], ["As-Sajdah", "السجدة"], ["Al-Ahzab", "الأحزاب"], ["Saba'", "سبأ"], ["Fatir", "فاطر"], ["Ya-Sin", "يس"], ["As-Saffat", "الصافات"], ["Sad", "ص"], ["Az-Zumar", "الزمر"], ["Ghafir", "غافر"], ["Fussilat", "فصلت"], ["Ash-Shura", "الشورى"], ["Az-Zukhruf", "الزخرف"], ["Ad-Dukhan", "الدخان"], ["Al-Jathiyah", "الجاثية"], ["Al-Ahqaf", "الأحقاف"], ["Muhammad", "محمد"], ["Al-Fath", "الفتح"], ["Al-Hujurat", "الحجرات"], ["Qaf", "ق"], ["Adh-Dhariyat", "الذاريات"], ["At-Tur", "الطور"], ["An-Najm", "النجم"], ["Al-Qamar", "القمر"], ["Ar-Rahman", "الرحمن"], ["Al-Waqi'ah", "الواقعة"], ["Al-Hadid", "الحديد"], ["Al-Mujadilah", "المجادلة"], ["Al-Hashr", "الحشر"], ["Al-Mumtahanah", "الممتحنة"], ["As-Saff", "الصف"], ["Al-Jumu'ah", "الجمعة"], ["Al-Munafiqun", "المنافقون"], ["At-Taghabun", "التغابن"], ["At-Talaq", "الطلاق"], ["At-Tahrim", "التحريم"], ["Al-Mulk", "الملك"], ["Al-Qalam", "القلم"], ["Al-Haqqah", "الحاقة"], ["Al-Ma'arij", "المعارج"], ["Nuh", "نوح"], ["Al-Jinn", "الجن"], ["Al-Muzzammil", "المزمل"], ["Al-Muddatthir", "المدثر"], ["Al-Qiyamah", "القيامة"], ["Al-Insan", "الإنسان"], ["Al-Mursalat", "المرسلات"], ["An-Naba'", "النبأ"], ["An-Nazi'at", "النازعات"], ["'Abasa", "عبس"], ["At-Takwir", "التكوير"], ["Al-Infitar", "الإنفطار"], ["Al-Mutaffifin", "المطففين"], ["Al-Inshiqaq", "الإنشقاق"], ["Al-Buruj", "البروج"], ["At-Tariq", "الطارق"], ["Al-A'la", "الأعلى"], ["Al-Ghashiyah", "الغاشية"], ["Al-Fajr", "الفجر"], ["Al-Balad", "البلد"], ["Ash-Shams", "الشمس"], ["Al-Layl", "الليل"], ["Ad-Duha", "الضحى"], ["Ash-Sharh", "الشرح"], ["At-Tin", "التين"], ["Al-'Alaq", "العلق"], ["Al-Qadr", "القدر"], ["Al-Bayyinah", "البينة"], ["Az-Zalzalah", "الزلزلة"], ["Al-'Adiyat", "العاديات"], ["Al-Qari'ah", "القارعة"], ["At-Takathur", "التكاثر"], ["Al-'Asr", "العصر"], ["Al-Humazah", "الهمزة"], ["Al-Fil", "الفيل"], ["Quraysh", "قريش"], ["Al-Ma'un", "الماعون"], ["Al-Kawthar", "الكوثر"], ["Al-Kafirun", "الكافرون"], ["An-Nasr", "النصر"], ["Al-Masad", "المسد"], ["Al-Ikhlas", "الإخلاص"], ["Al-Falaq", "الفلق"], ["An-Nas", "الناس"]
];

const SURAH_AYAH_COUNTS = [7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6];

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

// Initialize when metadata is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Note: Global canvas/ctx are no longer used for the main viewer
    
    // Initialize Selectors
    initSelectors();
    buildVerseToPageMap();

    // PDF Controls
    document.getElementById('prev-page').addEventListener('click', onPrevPage);
    document.getElementById('next-page').addEventListener('click', onNextPage);
    


    // Selector Change Events
    document.getElementById('surah-select').addEventListener('change', onSurahChange);
    document.getElementById('ayah-select').addEventListener('change', onAyahChange);

    populateParahs();
    // populateSurahs(); // Removed per user request

    // Check for query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const p = urlParams.get('p');
    const pg = urlParams.get('pg');
    const s = urlParams.get('surah');
    const a = urlParams.get('ayah') || 1;

    if (p && pg) {
        loadParah(parseInt(p), parseInt(pg));
    } else if (s) {
        navigateToVerse(parseInt(s), parseInt(a));
    } else {
        checkLastRead();
    }
});

// Expose to global scope for inline onclicks
window.loadParah = loadParah;
window.navigateToVerse = navigateToVerse;

window.clear16LinesHistory = function() {
    if (confirm('Clear all 16-line Quran progress and start from the beginning?')) {
        localStorage.removeItem('eq_16lines_progress');
        window.location.reload();
    }
};

window.resumeReading = () => {
    const saved = localStorage.getItem('eq_16lines_progress');
    if (saved) {
        const data = JSON.parse(saved);
        loadParah(parseInt(data.parahId), parseInt(data.page));
    }
};

/**
 * Initialize Surah and Ayah Selectors
 */
function initSelectors() {
    const parahSelect = document.getElementById('parah-select');
    const surahSelect = document.getElementById('surah-select');
    const ayahSelect = document.getElementById('ayah-select');
    
    if (parahSelect) {
        parahSelect.innerHTML = QURAN_16_LINES_DATA.parahs.map(p => 
            `<option value="${p.id}">Parah ${p.id}</option>`
        ).join('');
        parahSelect.addEventListener('change', (e) => loadParah(parseInt(e.target.value)));
    }

    if (surahSelect) {
        surahSelect.innerHTML = SURAHS.map((s, i) => 
            `<option value="${i + 1}">${i + 1}. ${s[0]}</option>`
        ).join('');
        surahSelect.addEventListener('change', onSurahChange);
    }

    if (ayahSelect) {
        ayahSelect.addEventListener('change', onAyahChange);
        updateAyahCount(1);
    }
}

function updateAyahCount(surahNum) {
    const ayahSelect = document.getElementById('ayah-select');
    if (!ayahSelect) return;

    const count = SURAH_AYAH_COUNTS[surahNum - 1];
    ayahSelect.innerHTML = Array.from({ length: count }, (_, i) => 
        `<option value="${i + 1}">${i + 1}</option>`
    ).join('');
}

function onSurahChange(e) {
    const surahNum = parseInt(e.target.value);
    updateAyahCount(surahNum);
    navigateToVerse(surahNum, 1);
}

function onAyahChange(e) {
    const surahNum = parseInt(document.getElementById('surah-select').value);
    const ayahNum = parseInt(e.target.value);
    navigateToVerse(surahNum, ayahNum);
}

/**
 * Build verseToPageMap from TAJ_LAYOUT
 */
function buildVerseToPageMap() {
    if (typeof TAJ_LAYOUT === 'undefined') return;
    
    verseToPageMap = {}; 
    verseLookupArray = [];

    // Build reverse map for VERSE_GLOBAL_INDEX if available
    if (typeof VERSE_GLOBAL_INDEX !== 'undefined') {
        verseLookupArray = Object.entries(VERSE_GLOBAL_INDEX)
            .map(([k, v]) => ({ v: k, i: v }))
            .sort((a, b) => a.i - b.i);
            
        for (const [key, val] of Object.entries(VERSE_GLOBAL_INDEX)) {
            globalIndexToVerse[val] = key;
        }
    }

    // Build verseToPageMap from TAJ_LAYOUT segments
    for (const [page, segments] of Object.entries(TAJ_LAYOUT)) {
        const pageNum = parseInt(page);
        for (const seg of segments) {
            if (seg.t === 'ayah') {
                for (let i = seg.f; i <= seg.l; i++) {
                    verseToPageMap[i] = pageNum;
                }
            }
        }
    }
}

/**
 * Navigate to special Surah:Ayah
 */
function navigateToVerse(surah, ayah) {
    if (typeof VERSE_GLOBAL_INDEX === 'undefined') return;
    
    const key = `${surah}:${ayah}`;
    const globalIndex = VERSE_GLOBAL_INDEX[key];
    
    if (globalIndex && verseToPageMap[globalIndex]) {
        const page = verseToPageMap[globalIndex];
        jumpToGlobalPage(page);
    }
}

/**
 * Parah Page Offsets (Data-driven for 548-page IndoPak layout)
 */
const PARAH_OFFSETS = [
    1, 20, 37, 56, 73, 91, 109, 127, 145, 163, 181, 199, 217, 235, 253, 271, 289, 307, 325, 343, 362, 379, 398, 415, 433, 451, 469, 487, 507, 527
];

let verseLookupArray = [];

/**
 * Handle Global Page Jump
 * @param {number} globalPage 
 */
function jumpToGlobalPage(globalPage) {
    if (globalPage < 1 || globalPage > 548) return;
    
    // Find which parah this page belongs to
    let parahId = 1;
    for (let i = 0; i < PARAH_OFFSETS.length; i++) {
        if (globalPage >= PARAH_OFFSETS[i]) {
            parahId = i + 1;
        } else {
            break;
        }
    }
    
    // Calculate relative page inside that parah PDF
    const relativePage = globalPage - PARAH_OFFSETS[parahId - 1] + 1;
    
    // If parah is already loaded, just jump slide
    if (currentParah && currentParah.id === parahId) {
        if (swiper) swiper.slideTo(relativePage - 1);
    } else {
        loadParah(parahId, relativePage);
    }
}

/**
 * Sync header selectors based on global page
 */
function syncSelectors(globalPage) {
    // Show selectors when in viewer
    document.getElementById('navigation-controls').style.display = 'flex';

    // Update Parah Select
    const parahSelect = document.getElementById('parah-select');
    if (parahSelect && currentParah) {
        parahSelect.value = currentParah.id;
    }

    if (typeof TAJ_LAYOUT === 'undefined' || !TAJ_LAYOUT[globalPage]) return;

    // Find the first ayah word index on this page
    const segments = TAJ_LAYOUT[globalPage];
    let firstAyahIndex = null;
    let explicitSurah = null;

    for (const seg of segments) {
        if (seg.t === 'surah_name' && !explicitSurah) {
            explicitSurah = seg.s;
        }
        if (seg.t === 'ayah' && firstAyahIndex === null) {
            firstAyahIndex = seg.f;
        }
        if (explicitSurah && firstAyahIndex !== null) break;
    }

    if (firstAyahIndex !== null) {
        // Find which verse this word index belongs to
        let foundVerse = verseLookupArray[0];
        for (let i = 0; i < verseLookupArray.length; i++) {
            if (verseLookupArray[i].i <= firstAyahIndex) {
                foundVerse = verseLookupArray[i];
            } else {
                break;
            }
        }
        
        if (foundVerse) {
            const [s, a] = foundVerse.v.split(':').map(Number);
            const targetSurah = explicitSurah || s;
            
            const ss = document.getElementById('surah-select');
            if (ss && ss.value != targetSurah) {
                ss.value = targetSurah;
                updateAyahCount(targetSurah);
            }
            const as = document.getElementById('ayah-select');
            if (as) as.value = a;
        }
    } else if (explicitSurah) {
        const ss = document.getElementById('surah-select');
        if (ss && ss.value != explicitSurah) {
            ss.value = explicitSurah;
            updateAyahCount(explicitSurah);
            const as = document.getElementById('ayah-select');
            if (as) as.value = 1;
        }
    }
}


/**
 * Populate Parah List with Arabic names
 */
function populateParahs() {
    const list = document.getElementById('parah-grid');
    if (!list) return;

    list.innerHTML = QURAN_16_LINES_DATA.parahs.map(p => `
        <div class="parah-card" onclick="loadParah(${p.id})">
            <span class="parah-num">PARAH ${p.id}</span>
            <span class="parah-name">${p.name}</span>
            <span class="parah-name arabic-font" style="opacity: 0.5; font-size: 1.4rem;">${p.nameArabic}</span>
        </div>
    `).join('');
}


/**
 * Load the PDF for a parah
 */
async function loadParah(id, startPage = 1) {
    // Ensure id is numeric
    id = parseInt(id);
    startPage = parseInt(startPage) || 1;

    const parah = QURAN_16_LINES_DATA.parahs.find(p => p.id === id);
    if (!parah) return;
    
    currentParah = parah;
    showLoading(`Loading Parah ${id}: ${parah.name}...`);
    
    try {
        // Encode URL to handle spaces properly
        const safeUrl = parah.url.split('/').map(part => encodeURIComponent(part)).join('/');
        const loadingTask = pdfjsLib.getDocument(safeUrl);
        pdfDoc = await loadingTask.promise;
        
        // Prepare Swiper Slides
        const wrapper = document.getElementById('swiper-wrapper');
        wrapper.innerHTML = Array.from({ length: pdfDoc.numPages }).map((_, i) => `
            <div class="swiper-slide">
                <canvas id="pdf-canvas-${i + 1}"></canvas>
            </div>
        `).join('');

        // UI Setup
        document.getElementById('page-title').textContent = `Parah ${id}: ${parah.name}`;
        
        // Show viewer
        document.getElementById('view-selection').style.display = 'none';
        document.getElementById('view-viewer').style.display = 'flex';
        document.getElementById('viewer-header-actions').style.display = 'block';
        document.getElementById('navigation-controls').style.display = 'flex';
        
        // Clear rendering cache
        renderedPages.clear();
        if (swiper) swiper.destroy();

        // Initialize Swiper with smooth sliding transition
        swiper = new Swiper('#pdf-swiper', {
            effect: 'slide',
            dir: 'rtl',
            grabCursor: true,
            speed: 500,
            initialSlide: startPage - 1,
            on: {
                afterInit: function() {
                    pageNum = startPage;
                    renderPage(pageNum);
                    // Pre-render neighbors
                    if (pageNum > 1) renderPage(pageNum - 1);
                    if (pageNum < pdfDoc.numPages) renderPage(pageNum + 1);
                },
                slideChange: function() {
                    const page = swiper.activeIndex + 1;
                    pageNum = page;
                    renderPage(page);
                    // Lazy load neighbors
                    if (page > 1) renderPage(page - 1);
                    if (page < pdfDoc.numPages) renderPage(page + 1);
                    
                    updateUILablesAndSync(page);
                }
            }
        });
        
    } catch (err) {
        console.error("Error loading PDF:", err);
        alert("Failed to load PDF. Please check your local files or connection.");
    } finally {
        hideLoading();
        updateUILablesAndSync(startPage);
    }
}

function updateUILablesAndSync(relPage) {
    document.getElementById('prev-page').disabled = (relPage <= 1);
    document.getElementById('next-page').disabled = (relPage >= pdfDoc.numPages);
    
    const globalPage = PARAH_OFFSETS[currentParah.id - 1] + relPage - 1;
    syncSelectors(globalPage);
    saveProgress(currentParah.id, relPage);
}

/**
 * Render a specific page to its canvas slide
 */
async function renderPage(num) {
    if (renderedPages.has(num)) return;
    renderedPages.add(num);

    try {
        const page = await pdfDoc.getPage(num);
        const canvas = document.getElementById(`pdf-canvas-${num}`);
        if (!canvas) return;
        const context = canvas.getContext('2d');
        
        // Calculate scale
        const container = document.getElementById('viewer-container');
        const containerWidth = container.clientWidth - 40;
        const containerHeight = container.clientHeight - 40;
        const viewport = page.getViewport({ scale: 1 });
        
        // Fit to both width and height to prevent cutoff
        const scaleW = containerWidth / viewport.width;
        const scaleH = containerHeight / viewport.height;
        const dynamicScale = Math.min(scaleW, scaleH, 2); 
        
        const scaledViewport = page.getViewport({ scale: dynamicScale });
        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;
        
        const renderContext = {
            canvasContext: context,
            viewport: scaledViewport
        };
        
        await page.render(renderContext).promise;
    } catch (err) {
        console.error(`Rendering error on page ${num}:`, err);
        renderedPages.delete(num); // retry later
    }
}

/**
 * Controls
 */
function onPrevPage() {
    if (swiper) swiper.slidePrev();
}

function onNextPage() {
    if (swiper) swiper.slideNext();
}



/**
 * View Switchers
 */
function showSelection() {
    window.location.reload();
}

/**
 * Progress Persistence
 */
function saveProgress(parahId, page) {
    // 16-line specific storage
    const data = {
        parahId: parahId,
        page: page,
        timestamp: new Date().getTime()
    };
    localStorage.setItem('eq_16lines_progress', JSON.stringify(data));

    // Unified storage for dashboard
    localStorage.setItem('quran_last_read', JSON.stringify({
        type: '16-lines',
        parahId: parahId,
        page: page,
        time: Date.now()
    }));
}

function checkLastRead() {
    const saved = localStorage.getItem('eq_16lines_progress');
    if (saved) {
        const data = JSON.parse(saved);
        // Show a banner or auto-load?
        // For now, just a button/link could be added but let's keep it simple.
        // If the user wants to continue reading, we can show a special card.
        const parah = QURAN_16_LINES_DATA.parahs.find(p => p.id === data.parahId);
        if (parah) {
            const banner = document.createElement('div');
            banner.style.cssText = "background: #e8f5e9; padding: 15px; border-radius: 12px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; border: 1px solid #c8e6c9;";
            banner.innerHTML = `
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="background: #1a4d2e; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <i data-lucide="book-open"></i>
                    </div>
                    <div>
                        <div style="font-weight: 700; color: #1a4d2e;">Continue Reading</div>
                        <div style="font-size: 13px; color: #666;">Parah ${data.parahId}: ${parah.name} (Page ${data.page})</div>
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button onclick="window.resumeReading()" style="background: #1a4d2e; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer;">Resume</button>
                    <button onclick="window.clear16LinesHistory()" style="background: transparent; color: #e11d48; border: 1px solid #fecdd3; padding: 8px; border-radius: 8px; cursor: pointer;" title="Clear Progress">
                        <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                    </button>
                </div>
            `;
            const container = document.getElementById('view-selection');
            container.insertBefore(banner, container.firstChild);
            if (window.lucide) lucide.createIcons();
        }
    }
}

/**
 * Loading state
 */
function showLoading(text) {
    document.getElementById('loading-overlay').style.display = 'flex';
    document.getElementById('loading-text').textContent = text;
}

function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
}
