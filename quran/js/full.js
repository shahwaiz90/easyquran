let currentScript = 'indopak';
let loadedPages = [];
let isLoadingBatch = false;
let verseToPageMap = {};

// Config & State
const surahAyahCounts = [7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6];
const surahs = [
    ["Al-Fatihah", "الفاتحة"], ["Al-Baqarah", "البقرة"], ["Ali 'Imran", "آل عمران"], ["An-Nisa'", "النساء"], ["Al-Ma'idah", "المائدة"], ["Al-An'am", "الأنعام"], ["Al-A'raf", "الأعراف"], ["Al-Anfal", "الأنفال"], ["At-Tawbah", "التوبة"], ["Yunus", "يونس"], ["Hud", "هود"], ["Yusuf", "يوسف"], ["Ar-Ra'd", "الرعد"], ["Ibrahim", "إبراهيم"], ["Al-Hijr", "الحجر"], ["An-Nahl", "النحل"], ["Al-Isra'", "الإسراء"], ["Al-Kahf", "الكهف"], ["Maryam", "مریم"], ["Ta-Ha", "طه"], ["Al-Anbiya'", "الأنبياء"], ["Al-Hajj", "الحج"], ["Al-Mu'minun", "المؤمنون"], ["An-Nur", "النور"], ["Al-Furqan", "الفرقان"], ["Ash-Shu'ara'", "الشعراء"], ["An-Naml", "النمل"], ["Al-Qasas", "القصص"], ["Al-'Ankabut", "العنكبوت"], ["Ar-Rum", "الروم"], ["Luqman", "لوقمان"], ["As-Sajdah", "السجدة"], ["Al-Ahzab", "الأحزاب"], ["Saba'", "سبأ"], ["Fatir", "فاطر"], ["Ya-Sin", "يس"], ["As-Saffat", "الصافات"], ["Sad", "ص"], ["Az-Zumar", "الزمر"], ["Ghafir", "غافر"], ["Fussilat", "فصلت"], ["Ash-Shura", "الشورى"], ["Az-Zukhruf", "الزخرف"], ["Ad-Dukhan", "الدخان"], ["Al-Jathiyah", "الجاثية"], ["Al-Ahqaf", "الأحقاف"], ["Muhammad", "محمد"], ["Al-Fath", "الفتح"], ["Al-Hujurat", "الحجرات"], ["Qaf", "ق"], ["Adh-Dhariyat", "الذاريات"], ["At-Tur", "الطور"], ["An-Najm", "النجم"], ["Al-Qamar", "القرمر"], ["Ar-Rahman", "الرحمن"], ["Al-Waqi'ah", "الواقعة"], ["Al-Hadid", "الحديد"], ["Al-Mujadilah", "المجادلة"], ["Al-Hashr", "الحشر"], ["Al-Mumtahanah", "الممتحنة"], ["As-Saff", "الصف"], ["Al-Jumu'ah", "الجمعة"], ["Al-Munafiqun", "المنافقون"], ["At-Taghabun", "التغابن"], ["At-Talaq", "الطلاق"], ["At-Tahrim", "التحريم"], ["Al-Mulk", "الملك"], ["Al-Qalam", "القرمر"], ["Al-Haqqah", "الحاقة"], ["Al-Ma'arij", "المعارج"], ["Nuh", "نوح"], ["Al-Jinn", "الجن"], ["Al-Muzzammil", "المزمل"], ["Al-Muddatthir", "المدثر"], ["Al-Qiyamah", "القيامة"], ["Al-Insan", "الإنسان"], ["Al-Mursalat", "المرسلات"], ["An-Naba'", "النبأ"], ["An-Nazi'at", "النازعات"], ["'Abasa", "عبس"], ["At-Takwir", "التكوير"], ["Al-Infitar", "الانفطار"], ["Al-Mutaffifin", "المطففين"], ["Al-Inshiqaq", "الانشقاق"], ["Al-Buruj", "البروج"], ["At-Tariq", "الطارق"], ["Al-A'la", "الأعلى"], ["Al-Ghashiyah", "الغاشية"], ["Al-Fajr", "الفجر"], ["Al-Balad", "البلد"], ["Ash-Shams", "الشمس"], ["Al-Layl", "الليل"], ["Ad-Duha", "الضحى"], ["Ash-Sharh", "الشرح"], ["At-Tin", "التين"], ["Al-'Alaq", "العلق"], ["Al-Qadr", "القدر"], ["Al-Bayyinah", "البينة"], ["Az-Zalzalah", "الزلزلة"], ["Al-'Adiyat", "العاديات"], ["Al-Qari'ah", "القارعة"], ["At-Takathur", "التكاثر"], ["Al-'Asr", "العصر"], ["Al-Humazah", "الهمزة"], ["Al-Fil", "الفيل"], ["Quraysh", "قريش"], ["Al-Ma'un", "الماعون"], ["Al-Kawthar", "الکوثر"], ["Al-Kafirun", "الکافرون"], ["An-Nasr", "النصر"], ["Al-Masad", "المسد"], ["Al-Ikhlas", "الإخلاص"], ["Al-Falaq", "الفلق"], ["An-Nas", "الناس"]
];
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

let selectedReciter = RECITERS[0];
let currentAudio = null;
let currentPlayingS = 1;
let currentPlayingA = 1;
let isPlaying = false;
let isRepeating = false;

// UI Selection Helpers
const getQuranRoot = () => document.getElementById('quran-full-render');
const getSurahSelect = () => document.getElementById('surah-select');
const getAyahSelect = () => document.getElementById('ayah-select');
const getPageInput = () => document.getElementById('page-jump-input');

// --- Initialization & Data Fetching ---

async function ensureDataReady() {
    if (typeof TARTEEL_TAJ_DATA !== 'undefined' && Object.keys(TARTEEL_TAJ_DATA).length > 0) {
        buildVerseMap();
        return true;
    }
    for (let i = 0; i < 40; i++) {
        await new Promise(r => setTimeout(r, 200));
        if (typeof TARTEEL_TAJ_DATA !== 'undefined' && Object.keys(TARTEEL_TAJ_DATA).length > 0) {
            buildVerseMap();
            return true;
        }
    }
    return false;
}

function buildVerseMap() {
    if (Object.keys(verseToPageMap).length > 0) return;
    for (const [page, lines] of Object.entries(TARTEEL_TAJ_DATA)) {
        lines.forEach(line => {
            if (line.surah && (line.type === 'surah_name' || line.type === 'surah-header')) {
                const key = `${line.surah}:1`; // Start of surah
                if (!verseToPageMap[key]) verseToPageMap[key] = parseInt(page);
            }
            if (line.type === 'ayah') {
                line.words.forEach(w => {
                    const key = `${w.s}:${w.a}`;
                    if (!verseToPageMap[key]) verseToPageMap[key] = parseInt(page);
                });
            }
        });
    }
}

async function fetchPageVerses(pageNum) {
    try {
        const ready = await ensureDataReady();
        if (ready && TARTEEL_TAJ_DATA[pageNum]) return { localData: TARTEEL_TAJ_DATA[pageNum] };
        const res = await fetch(`https://api.quran.com/api/v4/verses/by_page/${pageNum}?words=true&mushaf=7&per_page=300`);
        const data = await res.json();
        return { verses: data.verses || [], localData: null };
    } catch (e) { return { localData: null }; }
}

// --- Header Sync ---

function updateHeaderControls(s, a, p) {
    const ss = getSurahSelect(); if (ss && ss.value != s) ss.value = s;
    updateAyahSelect(s, a);
    const pin = getPageInput(); if (pin) pin.value = p;
}

// --- Audio Player Logic ---

function updatePlayerUI() {
    const info = document.getElementById('player-verse-info');
    if (info) info.textContent = `${currentPlayingS}:${currentPlayingA}`;
    const btn = document.getElementById('player-play-btn');
    if (btn) btn.innerHTML = isPlaying ? '<i data-lucide="pause"></i>' : '<i data-lucide="play"></i>';
    const rBtn = document.getElementById('player-repeat-btn');
    if (rBtn) rBtn.classList.toggle('active', isRepeating);
    if (window.lucide) lucide.createIcons();
}

function highlightPlayingVerse() {
    document.querySelectorAll('.quran-word-unit.playing').forEach(el => el.classList.remove('playing'));
    const key = `${currentPlayingS}:${currentPlayingA}`;
    document.querySelectorAll(`.quran-word-unit[data-key="${key}"]`).forEach(el => el.classList.add('playing'));
}

async function playAudioFor(s, a) {
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    currentPlayingS = s; currentPlayingA = a;
    const fileName = String(s).padStart(3, '0') + String(a).padStart(3, '0') + '.mp3';
    const url = `https://everyayah.com/data/${selectedReciter.folder}/${fileName}`;
    currentAudio = new Audio(url);
    currentAudio.onplay = () => { isPlaying = true; updatePlayerUI(); highlightPlayingVerse(); };
    currentAudio.onpause = () => { isPlaying = false; updatePlayerUI(); };
    currentAudio.onended = () => { if (isRepeating) playAudioFor(currentPlayingS, currentPlayingA); else playNextAyah(); };
    currentAudio.onerror = () => { isPlaying = false; updatePlayerUI(); };
    try { await currentAudio.play(); } catch (e) { isPlaying = false; updatePlayerUI(); }
}

window.togglePlayerPause = function() {
    if (!currentAudio) { playAudioFor(currentPlayingS, currentPlayingA); return; }
    if (isPlaying) currentAudio.pause(); else currentAudio.play();
};

window.stopRecitation = function() {
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    isPlaying = false; document.querySelectorAll('.quran-word-unit.playing').forEach(el => el.classList.remove('playing'));
    updatePlayerUI();
};

window.playNextAyah = function() {
    let nextS = currentPlayingS, nextA = currentPlayingA + 1;
    if (nextA > surahAyahCounts[nextS - 1]) { nextS++; nextA = 1; }
    if (nextS > 114) return;
    playAudioFor(nextS, nextA);
};

window.playPrevAyah = function() {
    let prevS = currentPlayingS, prevA = currentPlayingA - 1;
    if (prevA < 1) { prevS--; if (prevS < 1) return; prevA = surahAyahCounts[prevS - 1]; }
    playAudioFor(prevS, prevA);
};

window.toggleRepeat = function() { isRepeating = !isRepeating; updatePlayerUI(); };
window.changeReciter = function(id) {
    const r = RECITERS.find(x => x.id === id);
    if (r) { 
        selectedReciter = r; 
        if (isPlaying) playAudioFor(currentPlayingS, currentPlayingA); 
    }
};

function populateReciterSelector() {
    const s = document.getElementById('player-reciter-select');
    if (!s) return;
    s.innerHTML = RECITERS.map(r => `<option value="${r.id}" ${r.id === selectedReciter.id ? 'selected' : ''}>${r.name}</option>`).join('');
}

// --- Mushaf Rendering ---

function createPageSection(pageNum, data) {
    const section = document.createElement('section');
    section.className = 'mushaf-page'; section.id = `page-${pageNum}`; section.dataset.page = pageNum;
    const wrapper = document.createElement('div');
    wrapper.className = 'mushaf-page-wrapper sixteen-lines indopak-mushaf';

    if (data.localData) {
        data.localData.forEach((line, idx) => {
            const lineDiv = document.createElement('div');
            lineDiv.className = 'mushaf-line';
            if (line.center) lineDiv.style.justifyContent = 'center';

            if (line.type === 'surah_name' || line.type === 'surah-header') {
                const sIdx = parseInt(line.surah) - 1;
                lineDiv.className = 'mushaf-line banner-line';
                lineDiv.innerHTML = `
                    <div class="surah-header-banner">
                        <div class="banner-accent left"></div>
                        <div class="banner-content">
                            <div class="banner-top-ar">${surahs[sIdx]?.[1] || ''}</div>
                            <div class="banner-info-row">
                                <div class="banner-meta-item">
                                    <span class="meta-label">Surah</span>
                                    <span class="meta-value">${line.surah}</span>
                                </div>
                                <div class="banner-meta-item">
                                    <span class="meta-label">Ayat</span>
                                    <span class="meta-value">${surahAyahCounts[sIdx]}</span>
                                </div>
                            </div>
                        </div>
                        <div class="banner-accent right"></div>
                    </div>`;
                wrapper.appendChild(lineDiv);

                // AUTO-INJECT Bismillah if missing in data (except Surah 9 and Surah 1)
                const surahNum = parseInt(line.surah);
                if (surahNum !== 9 && surahNum !== 1) {
                    const nextLine = data.localData[idx + 1];
                    if (!nextLine || (nextLine.type !== 'basmallah' && nextLine.type !== 'bismillah')) {
                        const bisDiv = document.createElement('div');
                        bisDiv.className = 'mushaf-line bismillah-line';
                        bisDiv.innerHTML = '<div class="bismillah-text">بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</div>';
                        wrapper.appendChild(bisDiv);
                    }
                }
                return; // Already appended
            } else if (line.type === 'basmallah' || line.type === 'bismillah') {
                lineDiv.className = 'mushaf-line bismillah-line';
                lineDiv.innerHTML = '<div class="bismillah-text">بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</div>';
            } else if (line.type === 'ayah') {
                lineDiv.className = 'mushaf-line words-line';
                line.words.forEach(w => {
                    const span = document.createElement('span');
                    span.className = 'quran-word-unit'; span.innerHTML = w.t; span.dataset.key = `${w.s}:${w.a}`;
                    span.onclick = (e) => { e.stopPropagation(); playAudioFor(parseInt(w.s), parseInt(w.a)); };
                    lineDiv.appendChild(span);
                });
            }
            wrapper.appendChild(lineDiv);
        });

        // Quran Completion Message on last page
        if (pageNum == 548) {
            const completionDiv = document.createElement('div');
            completionDiv.className = 'quran-completion-message';
            completionDiv.innerHTML = `
                <div class="completion-ornament">
                    <img src="https://easyquran.com/wp-content/uploads/2023/11/divider-gold.png" alt="" style="max-width: 200px;">
                </div>
                <div class="completion-arabic">تَمَّتْ بِالْخَيْرِ</div>
                <div class="completion-sadaq">صَدَقَ اللّٰهُ الْعَظِیْمُ</div>
                <div class="completion-text">الحمد لله رب العالمين</div>
            `;
            wrapper.appendChild(completionDiv);
        }
    }
    const ft = document.createElement('div'); ft.className = 'page-number-footer'; ft.textContent = pageNum;
    wrapper.appendChild(ft); section.appendChild(wrapper);
    return section;
}

// --- Initialization & Lifecycle ---

async function loadBatch(direction = 'next', startPage = null) {
    if (isLoadingBatch) return; isLoadingBatch = true;
    let start = startPage ? parseInt(startPage) : (loadedPages.length ? Math.max(...loadedPages) + 1 : 1);
    
    // STOP if we are past the last page
    if (start > 548) { 
        isLoadingBatch = false; 
        const loader = document.getElementById('load-more-trigger');
        if (loader) loader.style.display = 'none';
        return; 
    }

    let end = Math.min(start + (startPage ? 4 : 2), 548);
    const root = getQuranRoot(); if (!root) { isLoadingBatch = false; return; }
    const loader = document.getElementById('load-more-trigger');
    if (loader) { loader.style.display = (end >= 548 && direction === 'next') ? 'none' : 'flex'; loader.style.opacity = '1'; }

    for (let p = start; p <= end; p++) {
        if (!loadedPages.includes(p)) {
            const data = await fetchPageVerses(p);
            const sec = createPageSection(p, data);
            if (direction === 'prev') root.prepend(sec); else root.appendChild(sec);
            loadedPages.push(p);
        }
    }
    loadedPages.sort((a,b)=>a-b); isLoadingBatch = false;
    if (loader) loader.style.opacity = '0.5';
    highlightPlayingVerse();
}

function updateAyahSelect(surahNum, current = 1) {
    const as = getAyahSelect(); if (!as) return;
    as.innerHTML = ''; const count = surahAyahCounts[surahNum-1] || 0;
    for (let i = 1; i <= count; i++) {
        const opt = document.createElement('option'); opt.value = i; opt.textContent = `Ayat ${i}`; as.appendChild(opt);
    }
    as.value = current;
}

window.handlePageJump = async function() {
    const input = getPageInput(); if (!input || !input.value) return;
    jumpToPage(parseInt(input.value));
};

async function jumpToPage(p, targetKey = null) {
    if (!p) return;
    const root = getQuranRoot(); if (!root) return;
    root.innerHTML = ''; loadedPages = [];
    await loadBatch('next', p);
    const el = document.getElementById(`page-${p}`);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        if (targetKey) {
            setTimeout(() => {
                const vEl = document.querySelector(`.quran-word-unit[data-key="${targetKey}"]`);
                if (vEl) vEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
        }
    }
}

function saveToHistory(pageNum) {
    const pEl = document.getElementById(`page-${pageNum}`);
    let sNum = 1, aNum = 1;
    if (pEl) {
        const fw = pEl.querySelector('.quran-word-unit');
        if (fw) { const parts = fw.dataset.key.split(':'); sNum = parseInt(parts[0]); aNum = parseInt(parts[1]); }
    }
    let h = JSON.parse(localStorage.getItem('full_quran_history_v2') || '[]');
    const entry = { p: pageNum, s: sNum, a: aNum, time: Date.now() };
    h = h.filter(x => x.p !== pageNum); h.unshift(entry);
    localStorage.setItem('full_quran_history_v2', JSON.stringify(h.slice(0, 10)));
    localStorage.setItem('full_quran_last_page', pageNum);
}

function updateLastReadUI() {
    const h = JSON.parse(localStorage.getItem('full_quran_history_v2') || '[]');
    const banner = document.getElementById('full-history-banner');
    const cont = document.getElementById('history-items-container');
    if (h.length > 0 && banner && cont) {
        banner.style.display = 'flex';
        cont.innerHTML = h.map(x => `
            <div class="last-read-card" onclick="jumpToPage(${x.p})">
                <div class="card-surah-line"><span class="card-surah-name">${surahs[x.s-1][0]}</span><span class="card-surah-arabic">${surahs[x.s-1][1]}</span></div>
                <div class="card-verse-info">Verse ${x.s}:${x.a}</div><div class="card-page-label">Page ${x.p}</div>
            </div>`).join('');
    }
}

function init() {
    populateReciterSelector();
    const ss = getSurahSelect();
    const as = getAyahSelect();
    if (ss && as) {
        surahs.forEach((s, i) => { const opt = document.createElement('option'); opt.value = i+1; opt.textContent = `${i+1}. ${s[0]}`; ss.appendChild(opt); });
        ss.value = 1; updateAyahSelect(1);
        
        ss.onchange = (e) => { 
            const sNum = parseInt(e.target.value);
            updateAyahSelect(sNum);
            const p = verseToPageMap[`${sNum}:1`];
            if (p) jumpToPage(p, `${sNum}:1`);
        };
        
        as.onchange = (e) => {
            const sNum = parseInt(ss.value);
            const aNum = parseInt(e.target.value);
            const key = `${sNum}:${aNum}`;
            const p = verseToPageMap[key];
            if (p) jumpToPage(p, key);
        };
    }
    const contentArea = document.querySelector('.content-area');
    let st;
    if (contentArea) contentArea.onscroll = () => {
        clearTimeout(st);
        st = setTimeout(() => {
            const sections = document.querySelectorAll('.mushaf-page');
            let cp = null, minTop = Infinity, curSurah = 1, curAyah = 1;
            sections.forEach(s => { 
                const r = s.getBoundingClientRect(); 
                if (Math.abs(r.top) < minTop) { 
                    minTop = Math.abs(r.top); cp = parseInt(s.dataset.page); 
                    const fw = s.querySelector('.quran-word-unit');
                    if (fw) { const parts = fw.dataset.key.split(':'); curSurah = parseInt(parts[0]); curAyah = parseInt(parts[1]); }
                } 
            });
            if (cp) {
                saveToHistory(cp); updateLastReadUI();
                updateHeaderControls(curSurah, curAyah, cp);
            }
        }, 300);
    };
    const trig = document.getElementById('load-more-trigger');
    if (trig) {
        new IntersectionObserver(e => { if (e[0].isIntersecting && !isLoadingBatch) loadBatch('next'); }, { root: contentArea, rootMargin: '1000px' }).observe(trig);
    }
    const last = localStorage.getItem('full_quran_last_page');
    ensureDataReady().then(() => {
       loadBatch('next', last || 1).then(() => { updateLastReadUI(); updatePlayerUI(); });
    });
}

if (document.readyState === 'complete' || document.readyState === 'interactive') init();
else document.addEventListener('DOMContentLoaded', init);
