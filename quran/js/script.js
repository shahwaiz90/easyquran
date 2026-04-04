const API_BASE = 'https://api.quran.com/api/v4';
const AUDIO_BASE_LOCAL = '../urdu_audio_sliced';
const AUDIO_BASE_EVERYAYAH = 'https://everyayah.com/data';

const RECITERS = [
    { id: 'alafasy', name: 'Mishary Rashid Alafasy', folder: 'Alafasy_128kbps' },
    { id: 'sudais', name: 'Abdur-Rahman Al-Sudais', folder: 'Abdurrahmaan_As-Sudais_192kbps' },
    { id: 'shuraim', name: 'Saoud Al-Shuraim', folder: 'Saood_ash-Shuraym_128kbps' },
    { id: 'abdul_basit_m', name: 'Abdul Basit (Murattal)', folder: 'Abdul_Basit_Murattal_192kbps' },
    { id: 'abdul_basit_j', name: 'Abdul Basit (Mujawwad)', folder: 'Abdul_Basit_Mujawwad_128kbps' },
    { id: 'minshawi_m', name: 'Minshawy (Murattal)', folder: 'Minshawy_Murattal_128kbps' },
    { id: 'minshawi_j', name: 'Minshawy (Mujawwad)', folder: 'Minshawy_Mujawwad_64kbps' },
    { id: 'ayyoub', name: 'Muhammad Ayyoub', folder: 'Muhammad_Ayyoub_128kbps' },
    { id: 'maher', name: 'Maher Al-Muaiqly', folder: 'MaherAlMuaiqly128kbps' },
    { id: 'husary', name: 'Mahmoud Khalil Al-Husary', folder: 'Husary_128kbps' },
    { id: 'husary_j', name: 'Al-Husary (Mujawwad)', folder: 'Husary_128kbps_Mujawwad' },
    { id: 'husary_m', name: 'Al-Husary (Muallim)', folder: 'Husary_Muallim_128kbps' },
    { id: 'shatri', name: 'Abu Bakr Al-Shatri', folder: 'Abu_Bakr_Ash-Shaatree_128kbps' },
    { id: 'ghamadi', name: 'Saad Al-Ghamadi', folder: 'Ghamadi_40kbps' },
    { id: 'rifai', name: 'Hani ar-Rifai', folder: 'Hani_Rifai_192kbps' },
    { id: 'tablawi', name: 'Mohammad Al-Tablawi', folder: 'Mohammad_al_Tablaway_128kbps' },
    { id: 'dussary', name: 'Yaser Ad-Dussary', folder: 'Yasser_Ad-Dussary_128kbps' },
    { id: 'qutami', name: 'Nasser Alqatami', folder: 'Nasser_Alqatami_128kbps' },
    { id: 'hudhaify', name: 'Ali Al-Hudhaify', folder: 'Hudhaify_128kbps' },
    { id: 'bukhatir', name: 'Salah Bukhatir', folder: 'Salaah_AbdulRahman_Bukhatir_128kbps' },
    { id: 'urdu_shamshad', name: 'Urdu (Shamshad Ali Khan)', folder: 'translations/urdu_shamshad_ali_khan_46kbps' }
];

let currentSurah = 1;

// State Persistence Initialization
const savedReciterId = localStorage.getItem('quran_reciter_id');
let selectedReciter = RECITERS[0];
if (savedReciterId) {
    const found = RECITERS.find(r => r.id === savedReciterId);
    if (found) selectedReciter = found;
}

const savedMushaf = localStorage.getItem('quran_mushaf');
let currentMushaf = savedMushaf || 'indopak';

const savedTajweed = localStorage.getItem('quran_tajweed');
let isTajweedEnabled = savedTajweed === 'true';

let verseData = [];
let wbwTranslations = {};
let selectedEditions = {
    translations: [95, 97],
    tafseers: []
};
const tafseerObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            const tafId = el.dataset.tafid;
            const vKey = el.dataset.vkey;
            if (tafId && vKey) {
                requestTafseer(tafId, vKey);
                tafseerObserver.unobserve(el);
            }
        }
    });
}, { threshold: 0.1, rootMargin: '200px' });

// Scroll tracker to update player info based on screen position
const verseObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const vKey = entry.target.dataset.vkey;
            const surah = parseInt(entry.target.dataset.surah);
            const ayah = parseInt(entry.target.dataset.ayah);

            // Only update info if NOT currently playing something else
            if (!currentAudio || currentAudio.paused) {
                currentPlayingId = vKey;
                currentPlayingSurah = surah;
                currentPlayingAyah = ayah;
                const info = document.getElementById('player-verse-info');
                if (info) info.textContent = vKey;

                // Track Progress
                saveProgress(surah, ayah);

                // Update address bar as we scroll
                if (!window.isSingleView) {
                    const cleanUrl = `/surah/${surah}:${ayah}`;
                    history.replaceState({ surah, ayah, isSingle: false }, '', cleanUrl);
                }

                // Sync verse-selector dropdown if not already set
                const vSelector = document.getElementById('verse-selector');
                if (vSelector && vSelector.value != ayah) {
                    vSelector.value = ayah;
                }
            }
        }
    });
}, { threshold: 0.6 });
let comparativeData = {}; // Format: { editionId: { ayahNum: text } }
let localIndoPakData = null; // Local JSON data for IndoPak script
let currentAudio = null;
let currentPlayingId = null; // verseKey
let currentPlayingSurah = 1;
let currentPlayingAyah = 1;
let currentPlayingReciterId = null; // Track what reciter is currently loaded
let isRepeatMode = false;
let repeatCount = 0; // Current cycle
let currentPlaybackRate = 1.0;
let maxRepeat = 1; // 1 to 5

async function init() {
    // Check for pending SPA redirect path (from 404.html)
    const pendingPath = sessionStorage.getItem('spa_redirect_path');
    const lookupPath = pendingPath || window.location.pathname;

    if (pendingPath) {
        sessionStorage.removeItem('spa_redirect_path');
        history.replaceState(null, '', pendingPath);
    }

    // Extract surah ID from various path patterns (e.g. /surah/1, /surah/1:1, /quran/18)
    const match = lookupPath.match(/(?:\/surah\/|\/quran\/|surah-)(\d+)(?::(\d+))?/i);
    const urlParams = new URLSearchParams(window.location.search);
    const surahParam = urlParams.get('s') || urlParams.get('surah');

    let startAyah = null;
    if (match) {
        currentSurah = parseInt(match[1]);
        if (match[2]) startAyah = parseInt(match[2]);
    } else if (surahParam) {
        const parts = surahParam.split(':');
        currentSurah = parseInt(parts[0]);
        if (parts[1]) startAyah = parseInt(parts[1]);
    }

    showLoading(true);
    try {
        await populateSurahSelector();
        populateReciterSelector();
        populatePlayerReciterSelector();
        await loadTranslationsAndTafsirs();

        // If we have a surah selection (direct link or deep link)
        if (currentSurah > 1 || startAyah || urlParams.has('s') || urlParams.has('surah')) {
            const isSingle = startAyah && lookupPath.includes(':');
            const isJump = startAyah && lookupPath.includes('#');
            // Save state immediately on load so back-navigation works correctly
            history.replaceState({ surah: currentSurah, ayah: startAyah, isSingle: isSingle }, '', lookupPath);
            await loadSurah(currentSurah, startAyah, isSingle);
        } else {
            // Default: Show Dashboard
            currentLanguage = 'en';
            renderHomeScreen();
            // Also save initial home state
            history.replaceState({ home: true }, '', '/quran/');
        }
    } catch (error) { console.error("Init failed", error); }
    finally { showLoading(false); }
}

// Global Nav Helpers
window.navToSurah = (id, ayah = null) => {
    const url = `/surah/${id}${ayah ? ':' + ayah : ''}`;
    history.pushState({ surah: id, ayah: ayah, isSingle: false }, '', url);
    loadSurah(id, ayah, false);
};

window.navToHome = () => {
    history.pushState(null, '', '/quran/');
    renderHomeScreen();
};

// Handle browser back/forward buttons
window.addEventListener('popstate', (e) => {
    if (e.state && e.state.surah) {
        if (e.state.isSingle) {
            loadSingleVerse(e.state.surah, e.state.ayah);
        } else {
            loadSurah(e.state.surah, e.state.ayah);
        }
    } else {
        renderHomeScreen();
    }
});

window.navToSingleVerse = (surahId, ayahNum) => {
    const url = `/surah/${surahId}:${ayahNum}`;
    history.pushState({ surah: surahId, ayah: ayahNum, isSingle: true }, '', url);
    loadSurah(surahId, ayahNum, true);
};

async function loadSingleVerse(surahId, ayahNum) {
    // Legacy helper - redirected to unified loadSurah
    loadSurah(surahId, ayahNum, true);
}

function saveProgress(surah, ayah) {
    localStorage.setItem('quran_last_read', JSON.stringify({ surah, ayah, time: Date.now() }));

    // History (last 20 unique surahs)
    let history = JSON.parse(localStorage.getItem('quran_history') || '[]');
    history = history.filter(h => h.surah !== surah);
    history.unshift({ surah, ayah, time: Date.now() });
    localStorage.setItem('quran_history', JSON.stringify(history.slice(0, 20)));
}

function formatRelativeTime(timestamp) {
    if (!timestamp) return '';
    const diff = (Date.now() - timestamp) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 84600) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
}

async function renderHomeScreen() {
    // Header Sync (Centered Layout)
    const dashHeader = document.getElementById('dashboard-header-center');
    const readHeaderBack = document.getElementById('reader-header-back');
    const readHeaderCenter = document.getElementById('reader-header-center');
    const readHeaderRight = document.getElementById('reader-header-right');
    const playerBar = document.getElementById('audio-player-bar');

    if (dashHeader) dashHeader.style.display = 'flex';
    if (readHeaderBack) readHeaderBack.classList.remove('active');
    if (readHeaderRight) readHeaderRight.classList.remove('active');
    if (playerBar) playerBar.style.display = 'none';

    document.body.classList.remove('reader-view');
    document.body.classList.add('dashboard-view');

    document.getElementById('home-dashboard').style.display = 'block';
    document.getElementById('verses-container').style.display = 'none';

    const container = document.getElementById('home-dashboard');
    const lastRead = JSON.parse(localStorage.getItem('quran_last_read'));
    const history = JSON.parse(localStorage.getItem('quran_history') || '[]');

    let html = `
        <div class="hero-card" ${lastRead ? `onclick="${lastRead.type === '16-lines' ? `location.href='16-lines.html?p=${lastRead.parahId}&pg=${lastRead.page}'` : `navToSurah(${lastRead.surah}, ${lastRead.ayah})`}" style="cursor: pointer;"` : ''}>
            <h1 style="font-size: 3rem; font-weight: 850; margin-bottom: 12px; color: #ffffff; text-shadow: 0 2px 30px rgba(0,0,0,0.1); letter-spacing: -1px;">Assalamu Alaikum</h1>
            <p style="opacity: 0.98; font-size: 1.25rem; max-width: 700px; margin-bottom: 35px; line-height: 1.6; color: rgba(255,255,255,0.95);">Welcome to your premium Quran study companion. Explore deep translations and scholarly tafseers in a distraction-free environment.</p>
            
            ${lastRead ? `
                <div class="progress-card">
                    <div class="progress-play-icon">
                        <i data-lucide="play"></i>
                    </div>
                    <div class="progress-text">
                        <div class="progress-label">Continue Your Journey</div>
                        <div class="progress-title">
                            ${lastRead.type === '16-lines' 
                                ? `Parah ${lastRead.parahId} (16-Line) • Page ${lastRead.page}`
                                : `${allChapters[lastRead.surah - 1]?.name_simple || 'Surah ' + lastRead.surah} • Ayah ${lastRead.ayah}`
                            }
                        </div>
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    if (history.length > 0) {
        html += `
            <div class="history-section">
                <h3 class="section-title"><i data-lucide="history"></i> Recently Visited</h3>
                <div class="history-grid">
                    ${history.map(h => {
            const ch = allChapters[h.surah - 1];
            return `
                        <div class="history-item" onclick="navToSurah(${h.surah}, ${h.ayah})">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                                <div style="color: var(--primary-color); font-weight: 700; font-size: 0.95rem;">${ch?.name_simple || 'Surah ' + h.surah}</div>
                                <div style="font-size: 0.7rem; color: var(--text-muted); background: var(--secondary-color); padding: 2px 6px; border-radius: 4px;">${formatRelativeTime(h.time)}</div>
                            </div>
                            <div style="font-size: 0.8rem; color: var(--text-dark); opacity: 0.8;">Ayah ${h.ayah}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">${ch?.name_arabic || ''}</div>
                        </div>`;
        }).join('')}
                </div>
            </div>
        `;
    }

    html += `
        <div class="learning-section">
            <h3 class="section-title"><i data-lucide="graduation-cap"></i> Foundational Learning</h3>
            <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 25px; opacity: 0.8;">New to reading Quran? Start with these essential guides to master Arabic pronunciation and Tajweed.</p>
            <div class="learning-grid">
                <div class="learning-card" onclick="window.open('assets/Noorani-Qaidah-urdu.pdf', '_blank')">
                    <div class="learning-card-icon">
                        <i data-lucide="book"></i>
                    </div>
                    <div class="learning-card-info">
                        <div class="learning-name">Noorani Qaida</div>
                        <div class="learning-desc">The standard foundation for Arabic phonetics and letter recognition.</div>
                    </div>
                    <div class="learning-tag">Crucial</div>
                </div>
                <div class="learning-card" onclick="window.open('assets/Yassarnal Quran.pdf', '_blank')">
                    <div class="learning-card-icon">
                        <i data-lucide="book-open"></i>
                    </div>
                    <div class="learning-card-info">
                        <div class="learning-name">Yassarnal Quran</div>
                        <div class="learning-desc">A step-by-step methodology to achieve fluency in Quranic reading.</div>
                    </div>
                    <div class="learning-tag">Popular</div>
                </div>
                <div class="learning-card" onclick="window.open('assets/Simple rules of Tajweed.pdf', '_blank')">
                    <div class="learning-card-icon">
                        <i data-lucide="mic"></i>
                    </div>
                    <div class="learning-card-info">
                        <div class="learning-name">Tajweed Rules</div>
                        <div class="learning-desc">Essential rules for beautiful and correct Quranic recitation.</div>
                    </div>
                    <div class="learning-tag">Premium</div>
                </div>
            </div>
        </div>
    `;

    html += `
        <div class="surah-section">
            <h3 class="section-title"><i data-lucide="layout-grid"></i> All Surahs</h3>
            <div class="surah-browser-grid">
                ${allChapters.map(c => `
                    <div class="surah-card" onclick="navToSurah(${c.id})">
                        <div class="surah-card-num">${c.id}</div>
                        <div class="surah-card-info">
                            <div class="surah-name">${c.name_simple}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">${c.verses_count} Verses</div>
                        </div>
                        <div class="surah-card-arabic">${c.name_arabic}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    container.innerHTML = html;
    lucide.createIcons();
}

// Quran.com API does not provide a direct endpoint for all translations/tafsirs list, so we skip sidebar population for now.
// Predefined popular translations and tafseers for the sidebar
const POPULAR_TRANSLATIONS = [
    { id: 95, name: 'Tafhim-ul-Quran (EN)', author: 'Sayyid Abul Ala Maududi', language: 'en' },
    { id: 97, name: 'Tafheem (UR)', language: 'ur' },
    { id: 85, name: 'M.A.S. Abdel Haleem (EN)', author: 'Abdul Haleem', language: 'en' },
    { id: 20, name: 'Saheeh International (EN)', author: 'Sahih International', language: 'en' },
    { id: 84, name: 'T. Usmani (EN)', author: 'T. Usmani', language: 'en' },
    { id: 149, name: 'Bridges Translation (EN)', author: 'Fadel Soliman', language: 'en' },
    { id: 151, name: 'Taqi Usmani (UR)', language: 'ur' },
    { id: 234, name: 'Jalandhari (UR)', language: 'ur' },
    { id: 158, name: 'Bayan-ul-Quran (UR)', language: 'ur' }
];

const POPULAR_TAFSEERS = [
    { id: 169, name: 'Ibn Kathir (EN)', language: 'en' },
    { id: 168, name: 'Maarif al-Quran (EN)', language: 'en' },
    { id: 817, name: 'Tazkir ul Quran (EN)', language: 'en' },
    { id: 160, name: 'Ibn Kathir (UR)', language: 'ur' },
    { id: 159, name: 'Bayan ul Quran (UR)', language: 'ur' },
    { id: 157, name: 'Fi Zilal al-Quran (UR)', language: 'ur' },
    { id: 818, name: 'Tazkir ul Quran (UR)', language: 'ur' }
];

async function loadTranslationsAndTafsirs() {
    console.log("Populating translations and tafseer sidebar...");
    const transList = document.getElementById('translation-list');
    const tafList = document.getElementById('tafseer-list');

    if (!transList || !tafList) {
        console.error("Sidebar containers not found!");
        return;
    }

    transList.innerHTML = ''; // Clear first
    tafList.innerHTML = '';

    POPULAR_TRANSLATIONS.forEach(t => {
        transList.appendChild(createEditionItem(t.id, t.name, 'translations'));
    });

    POPULAR_TAFSEERS.forEach(t => {
        tafList.appendChild(createEditionItem(t.id, t.name, 'tafseers'));
    });
    console.log("Sidebar population complete.");
}

function createEditionItem(id, name, type) {
    const a = document.createElement('a');
    a.href = "javascript:void(0)";
    a.className = 'nav-link';
    a.dataset.id = id;

    const icon = document.createElement('i');
    icon.dataset.lucide = type === 'translations' ? 'languages' : 'book-open';
    icon.style.width = '20px';
    icon.style.marginRight = '15px';

    const span = document.createElement('span');
    span.textContent = name;
    span.style.fontSize = '0.85rem';

    a.appendChild(icon);
    a.appendChild(span);

    // Set initial active state if already selected
    const idNum = parseInt(id);
    if (selectedEditions[type].includes(idNum)) {
        a.classList.add('active');
    }

    a.onclick = async (e) => {
        e.preventDefault();
        const idx = selectedEditions[type].indexOf(idNum);
        if (idx === -1) {
            selectedEditions[type].push(idNum);
            a.classList.add('active');
        } else {
            selectedEditions[type].splice(idx, 1);
            a.classList.remove('active');
        }
        console.log(`Updated ${type} collection:`, selectedEditions[type]);
        await loadSurah(currentSurah);
        lucide.createIcons();
    };
    return a;
}

// Not implemented for quran.com API in this version
async function fetchComparativeData(id, type) { }

function populateReciterSelector() {
    const reciterSelect = document.getElementById('reciter-selector');
    if (!reciterSelect) return;
    reciterSelect.innerHTML = RECITERS.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
    reciterSelect.value = selectedReciter.id; // Correctly initialize from saved state
    reciterSelect.onchange = (e) => {
        selectedReciter = RECITERS.find(r => r.id === e.target.value);
        localStorage.setItem('quran_reciter_id', selectedReciter.id);

        // Sync player bar if it matches
        const playerSelect = document.getElementById('player-reciter-select');
        if (playerSelect) playerSelect.value = selectedReciter.id;

        // If something is playing, restart with new reciter
        if (currentAudio && !currentAudio.paused) {
            playRecitation(currentPlayingSurah, currentPlayingAyah, currentPlayingId);
        }
    };
}

function populatePlayerReciterSelector() {
    const playerSelect = document.getElementById('player-reciter-select');
    if (!playerSelect) return;
    playerSelect.innerHTML = RECITERS.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
    playerSelect.value = selectedReciter.id;
}

function changePlayerReciter(reciterId) {
    selectedReciter = RECITERS.find(r => r.id === reciterId);
    localStorage.setItem('quran_reciter_id', selectedReciter.id);

    // Sync header selector
    const headerSelect = document.getElementById('reciter-selector');
    if (headerSelect) headerSelect.value = reciterId;

    // If something is playing, restart with new reciter
    if (currentAudio && !currentAudio.paused) {
        playRecitation(currentPlayingSurah, currentPlayingAyah, currentPlayingId);
    }
}

function changePlaybackSpeed(speed) {
    currentPlaybackRate = parseFloat(speed);
    if (currentAudio) {
        currentAudio.playbackSpeed = currentPlaybackRate;
        currentAudio.playbackRate = currentPlaybackRate;
    }
    // Sync speed selectors if multiple exist
    document.querySelectorAll('.speed-select').forEach(s => s.value = speed);
}

let allChapters = []; // Store for Navigator
async function populateSurahSelector() {
    try {
        const response = await fetch(`${API_BASE}/chapters`);
        const data = await response.json();
        const selector = document.getElementById('surah-selector');
        if (!data.chapters || !Array.isArray(data.chapters)) {
            if (selector) selector.innerHTML = '<option disabled selected>No Surahs found</option>';
            return;
        }
        allChapters = data.chapters;

        if (selector) {
            selector.innerHTML = '';
            data.chapters.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = `${c.id}. ${c.name_simple} (${c.name_arabic})`;
                selector.appendChild(opt);
            });
            selector.value = currentSurah;
            selector.onchange = (e) => { currentSurah = e.target.value; comparativeData = {}; loadSurah(currentSurah); };
        }
    } catch (err) {
        console.error("Surah select populate failed", err);
    }
}

async function loadSurah(surahId, startAyah = null, isSingle = false) {
    const requestId = Date.now();
    loadSurah.lastRequestId = requestId;
    window.isSingleView = isSingle;

    showLoading(true);
    const cleanSurahId = parseInt(surahId);
    currentSurah = cleanSurahId;

    let url = `${API_BASE}/verses/by_chapter/${cleanSurahId}?words=true&per_page=300&word_fields=text_uthmani,text_indopak,text_v1,text_uthmani_tajweed`;
    if (selectedEditions.translations.length > 0) {
        url += `&translations=${selectedEditions.translations.join(',')}`;
    }
    // Tafseers are fetched separately or provided in details endpoint usually, but verses endpoint supports it in some versions.
    // However, Quran.com V4 usually requires a separate call for tafsir per verse or specific fields.

    try {
        const response = await fetch(url);

        // Try loading IndoPak if needed, but don't block everything if it fails
        if (currentMushaf === 'indopak' && !localIndoPakData) {
            try {
                const resp = await fetch(`data/surahs/${surahId}.json`);
                if (resp.ok) localIndoPakData = await resp.json();
            } catch (err) { console.warn("Local IndoPak fetch failed", err); }
        }

        const data = await response.json();
        verseData = data.verses;

        // Tafseers are now fetched per verse on demand or via lazy loading
        comparativeData = {};

        // Populate comparativeData with translations from verseData for the modal
        verseData.forEach(v => {
            if (v.translations) {
                v.translations.forEach(tr => {
                    const trId = tr.resource_id;
                    if (!comparativeData[trId]) comparativeData[trId] = {};
                    comparativeData[trId][v.verse_key] = tr.text;
                });
            }
        });

        if (requestId === loadSurah.lastRequestId) {
            renderVerses(isSingle, startAyah);
            const chInfo = await (await fetch(`${API_BASE}/chapters/${cleanSurahId}`)).json();
            document.getElementById('current-surah-title').textContent = `${chInfo.chapter.id}. Surah ${chInfo.chapter.name_simple} (${chInfo.chapter.name_arabic})`;

            // Switch View
            document.getElementById('current-surah-title').textContent = `${chInfo.chapter.id}. Surah ${chInfo.chapter.name_simple} (${chInfo.chapter.name_arabic})`;

            // Switch View - Unified SPA (Centered Layout)
            const dashHeader = document.getElementById('dashboard-header-center');
            const readHeaderBack = document.getElementById('reader-header-back');
            const readHeaderCenter = document.getElementById('reader-header-center');
            const readHeaderRight = document.getElementById('reader-header-right');

            const home = document.getElementById('home-dashboard');
            const verses = document.getElementById('verses-container');
            const playerBar = document.getElementById('audio-player-bar');

            if (dashHeader) dashHeader.style.display = 'none';
            if (readHeaderCenter) readHeaderCenter.style.display = 'flex';
            if (readHeaderBack) readHeaderBack.style.display = 'flex';
            if (readHeaderRight) readHeaderRight.style.display = 'flex';

            document.body.classList.add('reader-view');
            document.body.classList.remove('dashboard-view');

            if (home) home.style.display = 'none';
            if (verses) verses.style.display = 'block';
            if (playerBar) playerBar.style.display = 'flex';

            const contentArea = document.querySelector('.content-area');
            if (contentArea) contentArea.scrollTo(0, 0);

            // Populate Verse Selector
            const vSelector = document.getElementById('verse-selector');
            if (vSelector) {
                vSelector.innerHTML = '<option value="" disabled selected>Ayah</option>';
                for (let v = 1; v <= chInfo.chapter.verses_count; v++) {
                    const vo = document.createElement('option');
                    vo.value = v; vo.textContent = `${v}`;
                    vSelector.appendChild(vo);
                }
                vSelector.onchange = (e) => {
                    const val = e.target.value;
                    const card = document.querySelector(`.verse-card[data-ayah="${val}"]`);
                    if (card) {
                        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        card.classList.add('highlight-pulse');
                        setTimeout(() => card.classList.remove('highlight-pulse'), 2000);
                        const cleanUrl = `/surah/${currentSurah}:${val}`;
                        history.replaceState({ surah: currentSurah, ayah: val }, '', cleanUrl);
                    }
                };
            }

            const targetAyah = startAyah || (window.location.hash ? window.location.hash.substring(1) : null);
            if (targetAyah) {
                const card = document.querySelector(`.verse-card[data-ayah="${targetAyah}"]`);
                if (card) {
                    setTimeout(() => {
                        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        card.classList.add('highlight-pulse');
                        setTimeout(() => card.classList.remove('highlight-pulse'), 2000);
                        if (vSelector) vSelector.value = targetAyah;
                        const pInfo = document.getElementById('player-verse-info');
                        if (pInfo) pInfo.textContent = `${cleanSurahId}:${targetAyah}`;
                    }, 500);
                }
            }
        }
    } catch (e) {
        console.error("LoadSurah failed:", e);
    } finally {
        if (requestId === loadSurah.lastRequestId) showLoading(false);
    }
}

function renderVerses(isSingleMode = false, singleAyahNum = null) {
    const container = document.getElementById('verses-container');
    container.innerHTML = '';
    const isWbw = false;

    // Determine target list
    const targetVerses = isSingleMode
        ? verseData.filter(v => v.verse_number == singleAyahNum)
        : verseData;

    targetVerses.forEach(verse => {
        const card = document.createElement('div');
        card.className = 'verse-card';
        card.dataset.vkey = verse.verse_key;
        card.dataset.surah = verse.chapter_id || currentSurah;
        card.dataset.ayah = verse.verse_number;

        // Observe for scroll tracking
        verseObserver.observe(card);

        // Verse Header
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.marginBottom = '20px';
        header.innerHTML = `<span style="font-weight:700; color:var(--text-muted); font-size: 0.85rem; cursor:pointer;" onclick="openComparativeModal(${verse.verse_number})">${verse.verse_key}</span>`;

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.alignItems = 'center';
        actions.style.gap = '10px';

        // Play options container
        const playContainer = document.createElement('div');
        playContainer.className = 'play-options-container';

        const dBtn = document.createElement('button');
        dBtn.innerHTML = '<i data-lucide="external-link"></i>';
        dBtn.className = 'verse-action-btn';
        dBtn.title = "Open Dedicated View";
        dBtn.onclick = () => navToSingleVerse(currentSurah, verse.verse_number);
        actions.appendChild(dBtn);

        const cBtn = document.createElement('button');
        cBtn.innerHTML = '<i data-lucide="link"></i>';
        cBtn.className = 'verse-action-btn copy-btn';
        cBtn.dataset.vkey = verse.verse_key;
        cBtn.title = "Copy Link";
        cBtn.onclick = () => copyVerseLink(verse.verse_key);
        actions.appendChild(cBtn);

        const wBtn = document.createElement('button');
        wBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
        wBtn.className = 'verse-action-btn';
        wBtn.title = "Share on WhatsApp";
        wBtn.onclick = () => shareToWhatsApp(verse.verse_key);
        actions.appendChild(wBtn);

        const sBtn = document.createElement('button');
        sBtn.innerHTML = '<i data-lucide="share-2"></i>';
        sBtn.className = 'verse-action-btn';
        sBtn.title = "Other Share Options";
        sBtn.onclick = () => shareVerse(verse.verse_key);
        actions.appendChild(sBtn);

        const pBtn = document.createElement('button');
        pBtn.id = `play-btn-${verse.verse_key}`;
        pBtn.innerHTML = '<i data-lucide="play"></i>';
        pBtn.className = 'verse-action-btn';
        pBtn.title = "Play Options";
        pBtn.onclick = (e) => {
            e.stopPropagation();
            togglePlayOptions(verse.verse_key);
        };

        const playPopup = document.createElement('div');
        playPopup.id = `play-popup-${verse.verse_key}`;
        playPopup.className = 'play-options-popup';
        playPopup.style.width = '240px';
        playPopup.innerHTML = `
            <div class="play-option-item" onclick="handlePlayAction(${currentSurah}, ${verse.verse_number}, '${verse.verse_key}', 'single')">
                <i data-lucide="play-circle" style="width:16px;"></i> Play this Ayah (Single)
            </div>
            <div class="play-option-item" onclick="handlePlayAction(${currentSurah}, ${verse.verse_number}, '${verse.verse_key}', 'continuous')">
                <i data-lucide="fast-forward" style="width:16px;"></i> Continue from here (Continuous)
            </div>
        `;

        playContainer.appendChild(pBtn);
        playContainer.appendChild(playPopup);
        actions.appendChild(playContainer);
        header.appendChild(actions);
        card.appendChild(header);

        // Quranic Text Container
        const arabicDiv = document.createElement('div');
        arabicDiv.className = `quran-text mushaf-${currentMushaf} ${isTajweedEnabled ? 'tajweed-text' : ''}`;

        if (isWbw) {
            arabicDiv.classList.add('wbw-container');
            verse.words.forEach(word => {
                const wordGroup = document.createElement('div');
                wordGroup.className = 'wbw-word-group';

                const arabicWord = document.createElement('span');
                arabicWord.className = 'quran-word';
                // Use local IndoPak if available and current mushaf is set to it
                let text = word.text_uthmani || word.text;
                if (currentMushaf === 'indopak') {
                    text = word.text_indopak || word.text;
                } else if (isTajweedEnabled && word.text_uthmani_tajweed) {
                    text = word.text_uthmani_tajweed;
                }
                arabicWord.textContent = text;

                const meaning = document.createElement('span');
                meaning.className = 'wbw-meaning';
                meaning.textContent = word.translation.text;
                meaning.style.fontSize = '1.1rem'; // Significantly increased
                meaning.style.fontFamily = "'ClearText', Inter, sans-serif";
                meaning.style.fontWeight = "500";

                wordGroup.appendChild(arabicWord);
                if (word.char_type_name === 'word') {
                    wordGroup.appendChild(meaning);
                }
                arabicDiv.appendChild(wordGroup);
            });
        } else {
            arabicDiv.style.textAlign = 'right';
            arabicDiv.style.fontSize = currentMushaf === 'indopak' ? '3rem' : '2.5rem';

            if (currentMushaf === 'indopak' && localIndoPakData && localIndoPakData[verse.verse_key]) {
                arabicDiv.textContent = localIndoPakData[verse.verse_key].text;
            } else {
                // Join words for full text rendering (fallback or Uthmani)
                arabicDiv.textContent = verse.words.map(w => {
                    if (currentMushaf === 'indopak') return w.text_indopak || w.text;
                    if (isTajweedEnabled && w.text_uthmani_tajweed) return w.text_uthmani_tajweed;
                    return w.text_uthmani || w.text;
                }).join(' ');
            }
        }

        card.appendChild(arabicDiv);

        // Add Translations and Tafseers Block
        const transContainer = document.createElement('div');
        transContainer.className = 'translation-block';
        card.appendChild(transContainer);

        // 1. Existing Translations
        if (verse.translations && verse.translations.length > 0) {
            verse.translations.forEach(t => {
                const tDiv = document.createElement('div');
                tDiv.className = 'translation-item-wrapper'; // New class or just style
                tDiv.style.marginBottom = '12px';
                tDiv.style.borderBottom = '1px solid rgba(245, 158, 11, 0.1)';
                tDiv.style.paddingBottom = '12px';

                const tName = POPULAR_TRANSLATIONS.find(pt => pt.id == t.resource_id)?.name || 'Translation';
                const isUrdu = tName.includes('(UR)') || tName.includes('Tafheem') || tName.includes('Jalandhari');
                tDiv.innerHTML = `
                    <div style="font-size:0.65rem; color:var(--accent-color); text-transform:uppercase; font-weight:800; margin-bottom:4px;">${tName}</div>
                    <div class="${isUrdu ? 'urdu-text' : ''}" style="color:var(--text-main); line-height: ${isUrdu ? '2.8' : '1.6'};">${t.text}</div>
                `;
                transContainer.appendChild(tDiv);
            });
        }

        // 2. Separate API Calls for Tafseers (Lazy Loaded)
        if (selectedEditions.tafseers.length > 0) {
            selectedEditions.tafseers.forEach(id => {
                const tafId = parseInt(id);
                const placeholder = document.createElement('div');
                placeholder.id = `tafseer-${tafId}-${verse.verse_key}`;
                placeholder.className = 'tafseer-main-content collapsible';
                placeholder.dataset.tafid = tafId;
                placeholder.dataset.vkey = verse.verse_key;
                placeholder.style.marginTop = '20px';
                placeholder.innerHTML = `<div class="tafseer-loading" style="font-size: 0.75rem; color: var(--text-muted); opacity: 0.5;">Waiting for viewport...</div>`;
                card.appendChild(placeholder);

                // Observe for lazy loading
                tafseerObserver.observe(placeholder);
            });
        }

        container.appendChild(card);
    });
    lucide.createIcons();
}

function openComparativeModal(verseNum) {
    console.log("Opening comparative modal for verse number:", verseNum);
    const verse = verseData.find(v => v.verse_number == verseNum);
    if (!verse) {
        console.error("Verse not found in verseData for number:", verseNum);
        return;
    }

    const modal = document.getElementById('comparative-modal');
    document.getElementById('modal-title').textContent = `Verse ${verse.verse_key}`;

    // Arabic in Modal
    const modalArabic = document.getElementById('modal-arabic');
    modalArabic.className = `arabic-text mushaf-${currentMushaf} ${isTajweedEnabled ? 'tajweed-text' : ''}`;
    modalArabic.innerHTML = verse.words.map(w => w.char_type_name === 'word' ? (currentMushaf === 'indopak' ? w.text_indopak : (isTajweedEnabled && w.text_uthmani_tajweed ? w.text_uthmani_tajweed : w.text_uthmani)) : w.text_uthmani).join(' ');

    const body = document.getElementById('modal-comparative-body');
    body.innerHTML = '';

    // Segregate by Language
    const groupedTrans = { ur: [], en: [], other: [] };

    if (verse.translations) {
        verse.translations.forEach(t => {
            const info = POPULAR_TRANSLATIONS.find(pt => pt.id == t.resource_id);
            const lang = info?.language === 'ur' ? 'ur' : (info?.language === 'en' ? 'en' : 'other');
            groupedTrans[lang].push({ info, text: t.text });
        });
    }

    // Render Urdu Group First
    if (groupedTrans.ur.length > 0) {
        const urHead = document.createElement('div');
        urHead.className = 'modal-group-header';
        urHead.textContent = 'اردو تراجم (Urdu Translations)';
        body.appendChild(urHead);

        groupedTrans.ur.forEach(item => {
            const row = createComparativeRow(item.info, item.text, true);
            body.appendChild(row);
        });
    }

    // Render English Group
    if (groupedTrans.en.length > 0) {
        const enHead = document.createElement('div');
        enHead.className = 'modal-group-header';
        enHead.textContent = 'English Translations';
        body.appendChild(enHead);

        groupedTrans.en.forEach(item => {
            const row = createComparativeRow(item.info, item.text, false);
            body.appendChild(row);
        });
    }

    // 2. Add Selected Tafseers from comparativeData
    selectedEditions.tafseers.forEach(id => {
        const vKey = verse.verse_key;
        const info = POPULAR_TAFSEERS.find(pt => pt.id == id);
        const isUrdu = info?.language === 'ur' || info?.name?.includes('(UR)');

        const row = document.createElement('div');
        row.style.marginBottom = '25px';
        row.id = `modal-tafseer-${id}-${vKey}`;

        if (comparativeData[id] && comparativeData[id][vKey]) {
            row.innerHTML = createComparativeRowHeader(info, true) +
                `<div class="${isUrdu ? 'urdu-text' : ''}" style="color:#444; line-height: ${isUrdu ? '2.5' : '1.7'}; font-size: ${isUrdu ? '1.1rem' : '0.95rem'}; direction: ${isUrdu ? 'rtl' : 'ltr'};">
                                ${comparativeData[id][vKey]}
                             </div>`;
        } else {
            row.innerHTML = `<div class="tafseer-loading" style="font-size: 0.8rem; color: var(--text-muted); opacity: 0.6;">Loading ${info?.name || 'Tafseer'}...</div>`;
            requestTafseer(id, vKey);
        }
        body.appendChild(row);
    });

    if (body.children.length === 0) {
        body.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:40px;">Please select translations or tafseers from the sidebar for comparison.</p>';
    }

    modal.style.display = 'flex';
    lucide.createIcons();
}

function createComparativeRow(info, text, isUrdu) {
    const row = document.createElement('div');
    row.style.marginBottom = '20px';
    row.style.padding = '15px';
    row.style.borderRadius = '10px';
    row.style.background = isUrdu ? '#fdfcf7' : '#f8fafc';
    row.style.border = '1px solid #eef2f7';

    row.innerHTML = `
        <div style="font-size:0.65rem; color:var(--text-muted); font-weight:700; margin-bottom:10px; opacity:0.7;">
            ${info?.name || 'Translation'}
        </div>
        <div class="${isUrdu ? 'urdu-text' : ''}" style="color:var(--text-main); line-height: ${isUrdu ? '2.5' : '1.6'}; font-size: ${isUrdu ? '1rem' : '0.95rem'}; direction: ${isUrdu ? 'rtl' : 'ltr'};">
            ${text}
        </div>
    `;
    return row;
}

function createComparativeRowHeader(info, isTafseer) {
    const color = isTafseer ? 'var(--accent-color)' : 'var(--primary)';
    return `<div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                <span style="background:${color}; color:white; padding:2px 8px; border-radius:4px; font-size:0.6rem; text-transform:uppercase; font-weight:700;">${info?.name || 'Content'}</span>
             </div>`;
}

function closeModal() { document.getElementById('comparative-modal').style.display = 'none'; }
function playAudio(url) {
    if (currentAudio) { currentAudio.pause(); }
    currentAudio = new Audio(url);
    currentAudio.play();
}

function playRecitation(s, a, verseKey) {
    const playBtn = document.getElementById(`play-btn-${verseKey}`);

    // Toggle logic
    if (currentPlayingId === verseKey && currentAudio) {
        if (!currentAudio.paused) {
            currentAudio.pause();
            playBtn.innerHTML = '<i data-lucide="play" style="width:16px; height:16px;"></i>';
            lucide.createIcons();
            return;
        } else {
            currentAudio.play();
            playBtn.innerHTML = '<i data-lucide="pause" style="width:16px; height:16px;"></i>';
            lucide.createIcons();
            return;
        }
    }

    // Stop current if any
    if (currentAudio) {
        currentAudio.pause();
        const prevBtn = document.getElementById(`play-btn-${currentPlayingId}`);
        if (prevBtn) {
            prevBtn.innerHTML = '<i data-lucide="play" style="width:16px; height:16px;"></i>';
        }
    }

    const surah = String(s).padStart(3, '0'); const ayah = String(a).padStart(3, '0');
    const url = selectedReciter.id === 'local_urdu' ? `${AUDIO_BASE_LOCAL}/${surah}/${surah}${ayah}.mp3` : `${AUDIO_BASE_EVERYAYAH}/${selectedReciter.folder}/${surah}${ayah}.mp3`;

    currentAudio = new Audio(url);
    currentPlayingId = verseKey;

    playBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin" style="width:16px; height:16px;"></i>';
    lucide.createIcons();

    currentAudio.play().then(() => {
        playBtn.innerHTML = '<i data-lucide="pause" style="width:16px; height:16px;"></i>';
        lucide.createIcons();
    }).catch(e => {
        console.warn(e);
        playBtn.innerHTML = '<i data-lucide="play" style="width:16px; height:16px;"></i>';
        lucide.createIcons();
    });

    currentAudio.onended = () => {
        if (isRepeatMode) {
            // Replay the same ayah when repeat is active
            playRecitation(currentPlayingSurah, currentPlayingAyah, currentPlayingId);
        } else {
            playBtn.innerHTML = '<i data-lucide="play" style="width:16px; height:16px;"></i>';
            lucide.createIcons();
            currentPlayingId = null;
            currentAudio = null;
        }
    };
}
// Duplicate showLoading removed to allow the optimized version below to function.

// Lazy Loading and Separate API logic for Tafseers
const tafseerQueue = [];
let isProcessingQueue = false;

async function requestTafseer(tafId, verseKey) {
    tafseerQueue.push({ tafId, verseKey });
    processTafseerQueue();
}

async function processTafseerQueue() {
    if (isProcessingQueue || tafseerQueue.length === 0) return;
    isProcessingQueue = true;

    while (tafseerQueue.length > 0) {
        const { tafId, verseKey } = tafseerQueue.shift();

        // Skip if already loaded in this session
        if (comparativeData[tafId] && comparativeData[tafId][verseKey]) {
            renderTafseerIntoPlaceholder(tafId, verseKey, comparativeData[tafId][verseKey]);
            continue;
        }

        try {
            // Corrected endpoint (using QDC API which is more reliable for single verse tafsirs)
            const response = await fetch(`https://api.quran.com/api/qdc/tafsirs/${tafId}/by_ayah/${verseKey}`);
            const data = await response.json();

            // Note: QDC API structure is slightly different: data.tafsir.text
            if (data.tafsir && data.tafsir.text) {
                if (!comparativeData[tafId]) comparativeData[tafId] = {};
                comparativeData[tafId][verseKey] = data.tafsir.text;
                renderTafseerIntoPlaceholder(tafId, verseKey, data.tafsir.text);
            }
        } catch (err) {
            console.error(`Failed separate tafseer fetch for ${verseKey}`, err);
        }

        // Small delay to prevent rate issues as we process queue
        await new Promise(r => setTimeout(r, 100));
    }
    isProcessingQueue = false;
}

function renderTafseerIntoPlaceholder(tafId, vKey, text) {
    const el = document.getElementById(`tafseer-${tafId}-${vKey}`);
    const modalEl = document.getElementById(`modal-tafseer-${tafId}-${vKey}`);
    const tInfo = POPULAR_TAFSEERS.find(pt => pt.id == tafId);
    const isUrdu = tInfo?.language === 'ur' || (tInfo?.name || '').includes('(UR)');

    // Create preview and full text for collapsing logic
    const isLong = text.length > 500;

    const contentHtml = `
        <div class="tafseer-wrapper">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom: 1px solid rgba(245, 158, 11, 0.1); padding-bottom:8px;">
                <div style="font-size:0.65rem; color:var(--accent-color); text-transform:uppercase; font-weight:800;">${tInfo?.name || 'Tafseer'}</div>
                ${isLong ? `<button class="read-less-top-btn" onclick="toggleTafseer(this, true)" style="display:none; font-size:0.75rem; color:var(--accent-color); font-weight:700; background:none; border:none; cursor:pointer;">Minimize ↑</button>` : ''}
            </div>
            <div class="${isUrdu ? 'urdu-text' : ''} tafseer-content-body" 
                 style="color:var(--text-main); line-height: ${isUrdu ? '2.8' : '1.7'}; font-size: ${isUrdu ? '1.15rem' : '1rem'}; direction: ${isUrdu ? 'rtl' : 'ltr'}; max-height: ${isLong ? '350px' : 'none'}; overflow: hidden; position: relative; transition: max-height 0.4s ease-out;">
                ${text}
                ${isLong ? `<div class="tafseer-fade" style="position: absolute; bottom: 0; left: 0; right: 0; height: 60px; background: linear-gradient(transparent, #fffbeb);"></div>` : ''}
            </div>
            ${isLong ? `<button class="read-more-btn" onclick="toggleTafseer(this, false)" style="background:none; border:none; color:var(--accent-color); font-weight:800; font-size:0.85rem; padding:15px 0 5px; cursor:pointer; width:100%; text-align:center;">Read More ↓</button>` : ''}
        </div>
    `;

    if (el) {
        el.innerHTML = contentHtml;
        el.classList.remove('collapsible'); // Remove loading state
    }

    if (modalEl) {
        modalEl.innerHTML = createComparativeRowHeader(tInfo, true) +
            `<div class="${isUrdu ? 'urdu-text' : ''}" style="color:#444; line-height: ${isUrdu ? '2.5' : '1.7'}; font-size: ${isUrdu ? '1.1rem' : '0.95rem'}; direction: ${isUrdu ? 'rtl' : 'ltr'};">
                                ${text}
                             </div>`;
    }
}

function toggleTafseer(btn, isTop) {
    const parent = btn.closest('.tafseer-wrapper');
    const body = parent.querySelector('.tafseer-content-body');
    const fade = body.querySelector('.tafseer-fade');
    const topBtn = parent.querySelector('.read-less-top-btn');
    const bottomBtn = parent.querySelector('.read-more-btn');

    if (body.style.maxHeight === 'none') {
        body.style.maxHeight = '250px';
        fade.style.display = 'block';
        if (bottomBtn) {
            bottomBtn.style.display = 'block';
            bottomBtn.textContent = 'Read More ↓';
        }
        if (topBtn) topBtn.style.display = 'none';

        // Scroll back to top of card if top minimize clicked
        if (isTop) parent.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        body.style.maxHeight = 'none';
        fade.style.display = 'none';
        if (bottomBtn) bottomBtn.textContent = 'Read Less ↑';
        if (topBtn) topBtn.style.display = 'block';
    }
}

// Recitation Selection & Continuous Logic
function togglePlayOptions(verseKey) {
    // Direct Toggle: If this specific verse is already playing/active, just pause/resume it directly
    if (currentPlayingId === verseKey && currentAudio) {
        playRecitation(currentPlayingSurah, currentPlayingAyah, verseKey);
        return;
    }

    const allPopups = document.querySelectorAll('.play-options-popup');
    allPopups.forEach(p => { if (p.id !== `play-popup-${verseKey}`) p.style.display = 'none'; });

    const popup = document.getElementById(`play-popup-${verseKey}`);
    if (popup) {
        popup.style.display = popup.style.display === 'block' ? 'none' : 'block';
    }

    // Close on click outside
    const closePopup = (e) => {
        if (!popup.contains(e.target)) {
            popup.style.display = 'none';
            document.removeEventListener('click', closePopup);
        }
    };
    setTimeout(() => document.addEventListener('click', closePopup), 10);
}

let isContinuousPlay = false;

function handlePlayAction(s, a, verseKey, mode) {
    isContinuousPlay = (mode === 'continuous');
    const popup = document.getElementById(`play-popup-${verseKey}`);
    if (popup) popup.style.display = 'none';

    playRecitation(s, a, verseKey);
}

function playRecitation(s, a, verseKey) {
    const playBtn = document.getElementById(`play-btn-${verseKey}`);
    const playerBar = document.getElementById('audio-player-bar');
    const playerPlayBtn = document.getElementById('player-play-btn');
    const playerInfo = document.getElementById('player-verse-info');

    // Manage card highlighting
    document.querySelectorAll('.verse-card').forEach(c => c.classList.remove('playing'));
    const currentCard = playBtn?.closest('.verse-card');
    if (currentCard) currentCard.classList.add('playing');

    // Show player bar
    if (playerBar) {
        playerBar.style.display = 'flex';
        playerBar.classList.add('active');
    }
    if (playerInfo) playerInfo.textContent = verseKey;

    // Toggle logic for current track - ONLY if reciter matches too
    if (currentPlayingId === verseKey && currentAudio && currentPlayingReciterId === selectedReciter.id) {
        if (!currentAudio.paused && !currentAudio.ended) {
            currentAudio.pause();
            if (playBtn) playBtn.innerHTML = '<i data-lucide="play" style="width:14px; height:14px;"></i>';
            if (playerPlayBtn) playerPlayBtn.innerHTML = '<i data-lucide="play"></i>';
            lucide.createIcons();
            return;
        } else {
            currentAudio.play();
            if (playBtn) playBtn.innerHTML = '<i data-lucide="pause" style="width:14px; height:14px;"></i>';
            if (playerPlayBtn) playerPlayBtn.innerHTML = '<i data-lucide="pause"></i>';
            lucide.createIcons();
            return;
        }
    }

    // Stop and Reset current UI
    if (currentAudio) {
        currentAudio.pause();
        const prevBtn = document.getElementById(`play-btn-${currentPlayingId}`);
        if (prevBtn) {
            prevBtn.innerHTML = '<i data-lucide="play" style="width:14px; height:14px;"></i>';
        }
    }

    currentPlayingId = verseKey;
    currentPlayingSurah = s;
    currentPlayingAyah = a;
    currentPlayingReciterId = selectedReciter.id;

    const surah = String(s).padStart(3, '0'); const ayah = String(a).padStart(3, '0');
    const url = (selectedReciter.id === 'local_urdu')
        ? `${AUDIO_BASE_LOCAL}/${surah}/${surah}${ayah}.mp3`
        : `${AUDIO_BASE_EVERYAYAH}/${selectedReciter.folder}/${surah}${ayah}.mp3`;

    if (playBtn) playBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin" style="width:14px; height:14px;"></i>';
    if (playerPlayBtn) playerPlayBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i>';
    lucide.createIcons();

    currentAudio = new Audio(url);
    currentAudio.playbackRate = currentPlaybackRate;
    currentAudio.onplaying = () => {
        if (playBtn) playBtn.innerHTML = '<i data-lucide="pause" style="width:14px; height:14px;"></i>';
        if (playerPlayBtn) playerPlayBtn.innerHTML = '<i data-lucide="pause"></i>';
        lucide.createIcons();
    };

    currentAudio.onerror = (e) => {
        console.error("Audio Load Error:", url, e);
        if (playBtn) playBtn.innerHTML = '<i data-lucide="play" style="width:14px; height:14px;"></i>';
        if (playerPlayBtn) playerPlayBtn.innerHTML = '<i data-lucide="play"></i>';
        lucide.createIcons();
        alert(`Audio cannot be loaded. Please check your connection or try another reciter.\n\nSource: ${url}`);
    };

    currentAudio.onended = () => {
        if (playBtn) playBtn.innerHTML = '<i data-lucide="play" style="width:14px; height:14px;"></i>';
        if (playerPlayBtn) playerPlayBtn.innerHTML = '<i data-lucide="play"></i>';
        lucide.createIcons();

        // Handle Repeat Logic
        if (isRepeatMode && repeatCount < maxRepeat - 1) {
            repeatCount++;
            playRecitation(s, a, verseKey);
            return;
        }

        // Reset repeat cycle for next manual play or continuous
        if (isRepeatMode) {
            const badge = document.getElementById('repeat-count-badge');
            if (badge) badge.textContent = maxRepeat + 'x';
        }
        repeatCount = 0;

        if (isContinuousPlay) {
            playNextAyah();
        } else {
            // Un-highlight when stopped/ended
            if (currentCard) currentCard.classList.remove('playing');
            // Keep currentPlayingId so player play button can restart it
            currentAudio = null;
        }
    };

    currentAudio.onerror = (e) => {
        console.error("Audio Load Error", e);
        if (currentCard) currentCard.classList.remove('playing');
        if (playBtn) playBtn.innerHTML = '<i data-lucide="play" style="width:14px; height:14px;"></i>';
        if (playerPlayBtn) playerPlayBtn.innerHTML = '<i data-lucide="play"></i>';
        lucide.createIcons();
        isContinuousPlay = false;
        currentAudio = null;
    };

    currentAudio.play();
}

function togglePlayerPause() {
    if (currentPlayingId) {
        // If it's already playing, playRecitation will pause it.
        // If it was paused/ended, playRecitation will start it.
        playRecitation(currentPlayingSurah, currentPlayingAyah, currentPlayingId);
    }
}

function stopRecitation() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    const playBtn = document.getElementById(`play-btn-${currentPlayingId}`);
    if (playBtn) playBtn.innerHTML = '<i data-lucide="play" style="width:14px; height:14px;"></i>';

    const playerPlayBtn = document.getElementById('player-play-btn');
    if (playerPlayBtn) playerPlayBtn.innerHTML = '<i data-lucide="play"></i>';

    const bar = document.getElementById('audio-player-bar');
    if (bar) bar.classList.remove('active');

    document.querySelectorAll('.verse-card').forEach(c => c.classList.remove('playing'));

    // Do not set currentPlayingId to null, so togglePlayerPause can restart it
    isContinuousPlay = false;
    lucide.createIcons();
}

function playNextAyah() {
    const nextAyahNum = currentPlayingAyah + 1;
    const nextVerse = verseData.find(v => v.verse_number === nextAyahNum);
    if (nextVerse) {
        const nextCard = document.querySelector(`.verse-card[data-ayah="${nextAyahNum}"]`);
        if (nextCard) nextCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        playRecitation(currentPlayingSurah, nextAyahNum, nextVerse.verse_key);
    } else {
        isContinuousPlay = false;
        stopRecitation();
    }
}

function playPreviousAyah() {
    const prevAyahNum = currentPlayingAyah - 1;
    if (prevAyahNum < 1) return;

    const prevVerse = verseData.find(v => v.verse_number === prevAyahNum);
    if (prevVerse) {
        const prevCard = document.querySelector(`.verse-card [onclick*="openComparativeModal(${prevAyahNum})"]`)?.closest('.verse-card');
        if (prevCard) prevCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

        playRecitation(currentPlayingSurah, prevAyahNum, prevVerse.verse_key);
    }
}

function toggleRepeatMode() {
    const btn = document.getElementById('player-repeat-btn');
    const badge = document.getElementById('repeat-count-badge');

    // Toggle repeat mode (infinite repeat)
    isRepeatMode = !isRepeatMode;
    if (isRepeatMode) {
        // Activate infinite repeat
        btn.classList.add('active');
        badge.style.display = 'flex';
        badge.textContent = '∞';
    } else {
        // Deactivate repeat
        btn.classList.remove('active');
        badge.style.display = 'none';
        badge.textContent = '1x';
    }
    // Reset counters
    repeatCount = 0;
    maxRepeat = 1;
}

function copyVerseLink(verseKey) {
    const parts = verseKey.split(':');
    const shareUrl = `${window.location.origin}/surah/${parts[0]}:${parts[1]}`;

    navigator.clipboard.writeText(shareUrl).then(() => {
        // Find the button to show feedback
        const btn = document.querySelector(`.copy-btn[data-vkey="${verseKey}"]`);
        if (btn) {
            const originalIcon = btn.innerHTML;
            btn.innerHTML = '<i data-lucide="check" style="width:14px; height:14px; color:#10b981;"></i>';
            lucide.createIcons();
            setTimeout(() => {
                btn.innerHTML = originalIcon;
                lucide.createIcons();
            }, 2000);
        }
    }).catch(err => {
        console.error('Failed to copy', err);
    });
}

function shareToWhatsApp(verseKey) {
    const card = document.querySelector(`.verse-card[data-vkey="${verseKey}"]`);
    if (!card) return;

    // Get Surah Title from the header or select
    const surahSelect = document.getElementById('surah-selector');
    const surahName = surahSelect ? surahSelect.options[surahSelect.selectedIndex].text : `Surah ${currentSurah}`;

    // Arabic
    const arabic = card.querySelector('.quran-text')?.innerText || '';

    // Collect all loaded translations/tafseers in that card
    let shareText = `📖 *${surahName} (${verseKey})*\n\n`;
    shareText += `${arabic}\n\n`;

    const contents = card.querySelectorAll('.translation-block > div, .tafseer-wrapper');
    contents.forEach(content => {
        const title = content.querySelector('div:first-child')?.innerText || '';
        const text = content.querySelector('.urdu-text, div:last-child')?.innerText || '';
        if (text) {
            shareText += `📜 *${title}*\n${text.substring(0, 500)}${text.length > 500 ? '...' : ''}\n\n`;
        }
    });

    const parts = verseKey.split(':');
    const shareUrl = `${window.location.origin}/surah/${parts[0]}:${parts[1]}`;
    shareText += `Read more at: ${shareUrl}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
}

function shareVerse(verseKey) {
    const card = document.querySelector(`.verse-card[data-vkey="${verseKey}"]`);
    if (!card) return;

    // Get Surah Title from the header or select
    const surahSelect = document.getElementById('surah-selector');
    const surahName = surahSelect ? surahSelect.options[surahSelect.selectedIndex].text : `Surah ${currentSurah}`;

    // Arabic
    const arabic = card.querySelector('.quran-text')?.innerText || '';

    // Collect all loaded translations/tafseers in that card
    let shareText = `📖 *${surahName} (${verseKey})*\n\n`;
    shareText += `${arabic}\n\n`;

    const contents = card.querySelectorAll('.translation-block > div, .tafseer-wrapper');
    contents.forEach(content => {
        const title = content.querySelector('div:first-child')?.innerText || '';
        const text = content.querySelector('.urdu-text, div:last-child')?.innerText || '';
        if (text) {
            shareText += `📜 *${title}*\n${text.substring(0, 500)}${text.length > 500 ? '...' : ''}\n\n`;
        }
    });

    const parts = verseKey.split(':');
    const shareUrl = `${window.location.origin}/surah/${parts[0]}:${parts[1]}`;
    shareText += `Read more at: ${shareUrl}`;

    // Native Share API
    if (navigator.share) {
        navigator.share({
            title: `Quran ${verseKey}`,
            text: shareText,
            url: shareUrl
        }).catch(err => console.log('Share failed', err));
    } else {
        // Fallback: WhatsApp directly
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
        window.open(whatsappUrl, '_blank');
    }
}
function showLoading(s) {
    const loading = document.getElementById('loading');
    const home = document.getElementById('home-dashboard');
    const verses = document.getElementById('verses-container');

    if (loading) loading.style.display = s ? 'flex' : 'none';
    if (home) home.style.display = s ? 'none' : (document.body.classList.contains('dashboard-view') ? 'block' : 'none');
    if (verses) verses.style.display = s ? 'none' : (document.body.classList.contains('reader-view') ? 'block' : 'none');
}

// Side-bar mobile toggle integration for Quran reader
document.addEventListener('DOMContentLoaded', () => {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.onclick = () => {
            const eqSidebar = document.querySelector('eq-sidebar');
            if (eqSidebar && typeof eqSidebar.toggle === 'function') {
                eqSidebar.toggle();
            }
        };
    }
});

let navigatorSelectedSurahId = null;

function openNavigator() {
    const modal = document.getElementById('navigator-modal');
    modal.style.display = 'flex';
    const sInput = document.getElementById('surah-search');
    const vInput = document.getElementById('jump-verse-num');
    if (sInput) sInput.value = '';
    if (vInput) vInput.value = '';

    renderSurahGrid(allChapters);
    selectSurahInNavigator(currentSurah);
    if (sInput) sInput.focus();
    lucide.createIcons();
}

// Keyboard shortcuts for the modal
document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('navigator-modal');
    if (modal && modal.style.display === 'flex') {
        if (e.key === 'Escape') closeNavigator();
        if (e.key === 'Enter') {
            // If we are in the ayah input, jump. If search, jump to first result.
            if (document.activeElement.id === 'surah-search') {
                const first = document.querySelector('.surah-grid-card');
                if (first) first.click();
            } else {
                executeJump();
            }
        }
    }
});

function closeNavigator() {
    document.getElementById('navigator-modal').style.display = 'none';
}

function handleOutsideNavigatorClick(e) {
    if (e.target.id === 'navigator-modal') closeNavigator();
}

function renderSurahGrid(chapters) {
    const grid = document.getElementById('surah-navigator-grid');
    if (!grid) return;
    grid.innerHTML = '';

    chapters.forEach(c => {
        const card = document.createElement('div');
        const isActive = parseInt(c.id) == navigatorSelectedSurahId;
        card.className = `surah-grid-card ${isActive ? 'active' : ''}`;
        card.id = `nav-surah-${c.id}`;
        card.onclick = () => selectSurahInNavigator(c.id);

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px;">
                <span class="surah-num">${c.id}</span>
                <span class="surah-arabic">${c.name_arabic}</span>
            </div>
            <div class="surah-name">${c.name_simple}</div>
            <div style="font-size: 0.65rem; color: var(--text-muted); opacity: 0.7;">${c.verses_count} Ayahs • ${c.revelation_place}</div>
        `;
        grid.appendChild(card);
        if (isActive && chapters.length === allChapters.length) {
            setTimeout(() => card.scrollIntoView({ block: 'center', behavior: 'auto' }), 10);
        }
    });
}

function filterSurahs(query) {
    const q = query.replaceAll(' ', '').toLowerCase();

    // Support Command Format like "12:12"
    if (q.includes(':')) {
        const parts = q.split(':');
        const sId = parseInt(parts[0]);
        const aId = parseInt(parts[1]);
        if (sId && sId > 0 && sId <= 114) {
            selectSurahInNavigator(sId);
            const vInput = document.getElementById('jump-verse-num');
            if (vInput && aId) vInput.value = aId;
            // Also filter the grid to show just that surah
            const filtered = allChapters.filter(c => c.id === sId);
            renderSurahGrid(filtered);
            return;
        }
    }

    const filtered = allChapters.filter(c =>
        c.name_simple.toLowerCase().includes(q) ||
        c.name_arabic.includes(q) ||
        c.id.toString() === q ||
        (q.length > 2 && c.id.toString().startsWith(q))
    );
    renderSurahGrid(filtered);
}

// State managed by openNavigator
function selectSurahInNavigator(id) {
    navigatorSelectedSurahId = parseInt(id);
    document.querySelectorAll('.surah-grid-card').forEach(c => c.classList.remove('active'));
    const activeCard = document.getElementById(`nav-surah-${id}`);
    if (activeCard) activeCard.classList.add('active');

    const info = allChapters.find(c => parseInt(c.id) == id);
    if (info) {
        const titleArea = document.getElementById('selected-surah-info');
        if (titleArea) titleArea.innerHTML = `<span style="opacity: 0.6; font-weight: 400;">Surah</span> ${info.name_simple} <span style="font-family: 'Amiri'; margin-left: 8px;">${info.name_arabic}</span>`;

        const vInput = document.getElementById('jump-verse-num');
        if (vInput) {
            vInput.max = info.verses_count;
            vInput.placeholder = `Ayah 1-${info.verses_count}`;
            vInput.focus();
        }
    }
}

function executeJump() {
    if (!navigatorSelectedSurahId) return;

    const verseNum = document.getElementById('jump-verse-num').value;

    // Close modal
    closeNavigator();

    if (navigatorSelectedSurahId != currentSurah) {
        currentSurah = navigatorSelectedSurahId;
        const targetUrl = verseNum ? `/surah/${currentSurah}:${verseNum}` : `/surah/${currentSurah}`;
        history.pushState({ surah: currentSurah, ayah: verseNum }, '', targetUrl);
        loadSurah(currentSurah, verseNum);
    } else if (verseNum) {
        // Same surah, just scroll
        const target = document.querySelector(`.verse-card[data-ayah="${verseNum}"]`);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            target.classList.add('highlight-pulse');
            setTimeout(() => target.classList.remove('highlight-pulse'), 2000);
            const cleanUrl = `/surah/${currentSurah}:${verseNum}`;
            history.replaceState({ surah: currentSurah, ayah: verseNum }, '', cleanUrl);
        }
    }
}

init();

// Global Shortcut Listener 
window.addEventListener('keydown', (e) => {
    // Prevent default / search behavior and open our explorer
    if (e.key === '/' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        openNavigator();
    }

    // Command + K or Ctrl + K shortcut support
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openNavigator();
    }

    // ESC to close any modal
    if (e.key === 'Escape') {
        closeModal();
        closeNavigator();
    }
});

