const API_BASE = 'https://api.quran.com/api/v4';
const QURAN_ROOT = document.getElementById('quran-full-render');
const SURAH_SELECT = document.getElementById('surah-select');
const AYAH_SELECT = document.getElementById('ayah-select');
const JUZ_SELECT = document.getElementById('juz-select');
const SCRIPT_SELECT = document.getElementById('script-select');

const surahAyahCounts = [7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6];

function updateAyahSelect(surahNum) {
    if (!AYAH_SELECT) return;
    AYAH_SELECT.innerHTML = '<option value="" disabled selected>Ayah...</option>';
    const count = surahAyahCounts[surahNum - 1];
    for (let i = 1; i <= count; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `Ayah ${i}`;
        AYAH_SELECT.appendChild(opt);
    }
}

// Global Audio Source
const AUDIO_BASE_EVERYAYAH = 'https://everyayah.com/data';

const RECITERS = [
    { id: 'alafasy', name: 'Mishary Rashid Alafasy', folder: 'Alafasy_128kbps' },
    { id: 'sudais', name: 'Abdur-Rahman Al-Sudais', folder: 'Abdurrahmaan_As-Sudais_192kbps' },
    { id: 'shuraim', name: 'Saoud Al-Shuraim', folder: 'Saood_ash-Shuraym_128kbps' },
    { id: 'abdul_basit_m', name: 'Abdul Basit (Murattal)', folder: 'Abdul_Basit_Murattal_192kbps' },
    { id: 'ayyoub', name: 'Muhammad Ayyoub', folder: 'Muhammad_Ayyoub_128kbps' },
    { id: 'maher', name: 'Maher Al-Muaiqly', folder: 'MaherAlMuaiqly128kbps' },
    { id: 'husary', name: 'Mahmoud Khalil Al-Husary', folder: 'Husary_128kbps' }
];

/* ── STATE ── */
let loadedPages = [];
let isLoadingBatch = false;
let currentScript = localStorage.getItem('full_quran_script') || 'uthmani';
let selectedReciter = RECITERS[0];
let currentAudio = null;
let currentPlayingSurah = 1;
let currentPlayingAyah = 1;
let currentPlaybackRate = 1;
let isRepeatMode = false;
let maxRepeat = 1;
let repeatCount = 0;
const BATCH_SIZE = 3; 

const PAGE_COUNTS = {
    'uthmani': 604,
    'indopak': 548
};

function getMaxPages() {
    return PAGE_COUNTS[currentScript] || 604;
}

const juzStarts = {
    1: [1, 1], 2: [2, 142], 3: [2, 253], 4: [3, 93], 5: [4, 24], 6: [4, 148],
    7: [5, 82], 8: [6, 111], 9: [7, 88], 10: [8, 41], 11: [9, 93], 12: [11, 6],
    13: [12, 53], 14: [15, 1], 15: [17, 1], 16: [18, 75], 17: [21, 1], 18: [23, 1],
    19: [25, 21], 20: [27, 56], 21: [29, 46], 22: [33, 31], 23: [36, 28], 24: [39, 32],
    25: [41, 47], 26: [46, 1], 27: [51, 31], 28: [58, 1], 29: [67, 1], 30: [78, 1]
};

const surahs = [
    ["Al-Fatihah", "الفاتحة"], ["Al-Baqarah", "البقرة"], ["Ali 'Imran", "آل عمران"],
    ["An-Nisa", "النساء"], ["Al-Ma'idah", "المائدة"], ["Al-An'am", "الأنعام"],
    ["Al-A'raf", "الأعراف"], ["Al-Anfal", "الأنفال"], ["At-Tawbah", "التوبة"],
    ["Yunus", "يونس"], ["Hud", "هود"], ["Yusuf", "يوسف"], ["Ar-Ra'd", "الرعد"],
    ["Ibrahim", "إبراهيم"], ["Al-Hijr", "الحجر"], ["An-Nahl", "النحل"],
    ["Al-Isra", "الإسراء"], ["Al-Kahf", "الكهف"], ["Maryam", "مريم"],
    ["Taha", "طه"], ["Al-Anbya", "الأنبياء"], ["Al-Hajj", "الحج"],
    ["Al-Mu'minun", "المؤمنون"], ["An-Nur", "النور"], ["Al-Furqan", "الفرقان"],
    ["Ash-Shu'ara", "الشعراء"], ["An-Naml", "النمل"], ["Al-Qasas", "القصص"],
    ["Al-'Ankabut", "العنكبوت"], ["Ar-Rum", "الروم"], ["Luqman", "لقمان"],
    ["As-Sajdah", "السجدة"], ["Al-Ahzab", "الأحزاب"], ["Saba", "سبإ"],
    ["Fatir", "فاطر"], ["Ya-Sin", "يس"], ["As-Saffat", "الصافات"],
    ["Sad", "ص"], ["Az-Zumar", "الزمر"], ["Ghafir", "غافر"],
    ["Fussilat", "فصلت"], ["Ash-Shura", "الشورى"], ["Az-Zukhruf", "الزخرف"],
    ["Ad-Dukhan", "الدخان"], ["Al-Jathiyah", "الجاثية"], ["Al-Ahqaf", "الأحقاف"],
    ["Muhammad", "محمد"], ["Al-Fath", "الفتح"], ["Al-Hujurat", "الحجرات"],
    ["Qaf", "ق"], ["Adh-Dhariyat", "الذاريات"], ["At-Tur", "الطور"],
    ["An-Najm", "النجم"], ["Al-Qamar", "القمر"], ["Ar-Rahman", "الرحمن"],
    ["Al-Waqi'ah", "الواقعة"], ["Al-Hadid", "الحديد"], ["Al-Mujadila", "المجادلة"],
    ["Al-Hashr", "الحشر"], ["Al-Mumtahanah", "الممتحنة"], ["As-Saf", "الصف"],
    ["Al-Jumu'ah", "الجمعة"], ["Al-Munafiqun", "المنافقون"],
    ["At-Taghabun", "التغابن"], ["At-Talaq", "الطلاق"], ["At-Tahrim", "التحريم"],
    ["Al-Mulk", "الملك"], ["Al-Qalam", "القلم"], ["Al-Haqqah", "الحاقة"],
    ["Al-Ma'arij", "المعارج"], ["Nuh", "نوح"], ["Al-Jinn", "الجن"],
    ["Al-Muzzammil", "المزمل"], ["Al-Muddaththir", "المدثر"], ["Al-Qiyamah", "القيامة"],
    ["Al-Insan", "الإنسان"], ["Al-Mursalat", "المرسلات"], ["An-Naba", "النبأ"],
    ["An-Nazi'at", "النازعات"], ["'Abasa", "عبس"], ["At-Takwir", "التكوير"],
    ["Al-Infitar", "الإنفطار"], ["Al-Mutaffifin", "المطففين"], ["Al-Inshiqaq", "الإنشقاق"],
    ["Al-Buruj", "البروج"], ["At-Tariq", "الطارق"], ["Al-A'la", "الأعلى"],
    ["Al-Ghashiyah", "الغاشية"], ["Al-Fajr", "الفجر"], ["Al-Balad", "البلد"],
    ["Ash-Shams", "الشمس"], ["Al-Layl", "الليل"], ["Ad-Duhaa", "الضحى"],
    ["Ash-Sharh", "الشرح"], ["At-Tin", "التين"], ["Al-'Alaq", "العلق"],
    ["Al-Qadr", "القدر"], ["Al-Bayyinah", "البينة"], ["Az-Zalzalah", "الزلزلة"],
    ["Al-'Adiyat", "العاديات"], ["Al-Qari'ah", "القارعة"], ["At-Takathur", "التكاثر"],
    ["Al-'Asr", "العصر"], ["Al-Humazah", "الهمزة"], ["Al-Fil", "الفيل"],
    ["Quraysh", "قريش"], ["Al-Ma'un", "الماعون"], ["Al-Kawthar", "الکوثر"],
    ["Al-Kafirun", "الكافرون"], ["An-Nasr", "النصر"], ["Al-Masad", "المسد"],
    ["Al-Ikhlas", "الإخلاص"], ["Al-Falaq", "الفلق"], ["An-Nas", "الناس"]
];

/* ── CORE FETCH LOGIC ── */

async function fetchPageVerses(pageNum) {
    const scriptField = currentScript === 'indopak' ? 'text_indopak,text_uthmani' : 'text_uthmani';
    const mushafId = currentScript === 'indopak' ? 7 : 1; 

    try {
        if (currentScript === 'indopak' && typeof INDOPAK_16LINE_MAPPING !== 'undefined' && INDOPAK_16LINE_MAPPING[pageNum]) {
            const [start, end] = INDOPAK_16LINE_MAPPING[pageNum];
            let sStart = parseInt(start.split(':')[0]), aStart = parseInt(start.split(':')[1]);
            let sEnd = parseInt(end.split(':')[0]), aEnd = parseInt(end.split(':')[1]);
            
            let promises = [];
            for (let s = sStart; s <= sEnd; s++) {
                let fromA = (s === sStart) ? aStart : 1;
                // If it's the last surah in the range, limit to aEnd. Otherwise fetch rest of the Surah (arbitrarily high limit like 300)
                let toA = (s === sEnd) ? aEnd : 300; 
                let url = `${API_BASE}/verses/by_chapter/${s}?from=${fromA}&to=${toA}&words=true&word_fields=${scriptField}&mushaf=${mushafId}`;
                promises.push(fetch(url).then(r => r.ok ? r.json() : { verses: [] }));
            }
            const results = await Promise.all(promises);
            let combinedVerses = [];
            results.forEach(data => { if (data.verses) combinedVerses = combinedVerses.concat(data.verses); });
            return combinedVerses;
        } else {
            let url = `${API_BASE}/verses/by_page/${pageNum}?words=true&word_fields=${scriptField}&mushaf=${mushafId}&per_page=300`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return data.verses || [];
        }
    } catch (e) {
        console.error(`Failed to fetch page ${pageNum}:`, e);
        return [];
    }
}

function processPageLines(verses, pageNum) {
    if (currentScript === 'indopak') {
        const linesMap = {};
        const layoutData = (typeof TAJ_LAYOUT !== 'undefined') ? TAJ_LAYOUT[pageNum] : null;

        if (layoutData) {
            // Initialize lines based on TAJ_LAYOUT
            layoutData.forEach(lineObj => {
                const ln = lineObj.ln;
                if (lineObj.t === 'surah_name') {
                    linesMap[ln] = { type: 'header', surah: lineObj.s };
                } else if (lineObj.t === 'basmallah') {
                    linesMap[ln] = { type: 'bismillah' };
                } else if (lineObj.t === 'ayah') {
                    linesMap[ln] = { type: 'words', data: [], f: lineObj.f, l: lineObj.l };
                }
            });

            // Map words to their respective lines based on global word ID computing using VERSE_GLOBAL_INDEX
            verses.forEach(v => {
                const verseStartIdx = (typeof VERSE_GLOBAL_INDEX !== 'undefined' && VERSE_GLOBAL_INDEX[v.verse_key]) ? VERSE_GLOBAL_INDEX[v.verse_key] : 1;
                
                if (v.words && v.words.length > 0) {
                    v.words.forEach(w => {
                        const wordId = verseStartIdx + Math.max(0, w.position - 1);
                        
                        // Find the corresponding line for this wordId
                        for (let l = 1; l <= 16; l++) {
                            const lineData = linesMap[l];
                            if (lineData && lineData.type === 'words' && lineData.f && lineData.l) {
                                if (wordId >= lineData.f && wordId <= lineData.l) {
                                    linesMap[l].data.push({
                                        ...w,
                                        textData: (w.char_type_name === 'end' && w.text_uthmani) ? w.text_uthmani : (w.text_indopak || w.text_uthmani || w.text),
                                        verse_key: v.verse_key,
                                        sajda: v.sajdah_number,
                                        juz: v.juz_number
                                    });
                                    break;
                                }
                            }
                        }
                    });
                }
            });
            return { linesMap, maxLine: 16 };
        } else {
            console.warn(`TAJ_LAYOUT missing for page ${pageNum}`);
        }
    }

    // Fallback or Uthmani logic
    let linesMap = {};
    let scriptField = currentScript === 'indopak' ? 'text_indopak' : 'text_uthmani';
    let maxLine = 15;

    verses.forEach(v => {
        const s = v.verse_key.split(':')[0];
        const a = v.verse_key.split(':')[1];
        
        if (a === '1' && s !== '1') {
            const firstWordLine = v.words[0] ? v.words[0].line_number : null;
            if (firstWordLine) {
                const headerLine = firstWordLine - 2;
                const basmalahLine = firstWordLine - 1;
                linesMap[headerLine] = { type: 'header', surah: s };
                if (s !== '9') linesMap[basmalahLine] = { type: 'bismillah' };
            }
        }

        v.words.forEach(w => {
            const lNum = w.line_number;
            if (lNum > maxLine) maxLine = lNum;
            if (!linesMap[lNum]) linesMap[lNum] = { type: 'words', data: [] };
            if (linesMap[lNum].type === 'words') {
                linesMap[lNum].data.push({
                    ...w,
                    textData: (w.char_type_name === 'end' && w.text_uthmani) ? w.text_uthmani : (currentScript === 'indopak' ? w.text_indopak : w.text_uthmani),
                    verse_key: v.verse_key,
                    sajda: v.sajdah_number,
                    juz: v.juz_number
                });
            }
        });
    });
    
    return { linesMap, maxLine: Math.max(maxLine, (currentScript === 'indopak' ? 16 : 15)) };
}

function createPageSection(pageNum, verses) {
    const section = document.createElement('section');
    section.className = `full-quran-page mushaf-page-mode ${currentScript}-mode`;
    section.id = `page-${pageNum}`;
    section.dataset.page = pageNum;
    
    const pageHeader = document.createElement('div');
    pageHeader.className = 'mushaf-page-header';
    
    let startVerse = verses.length > 0 ? verses[0].verse_key : "??";
    let endVerse = verses.length > 0 ? verses[verses.length - 1].verse_key : "??";

    pageHeader.innerHTML = `
        <div class="page-meta">Page ${pageNum}</div>
        <div class="page-meta">${startVerse} ─ ${endVerse}</div>
    `;
    section.appendChild(pageHeader);

    const pageWrapper = document.createElement('div');
    pageWrapper.className = `mushaf-page-wrapper ${currentScript === 'indopak' ? 'indopak-mushaf sixteen-lines' : ''}`;
    
    const { linesMap, maxLine } = processPageLines(verses, pageNum);
    const totalLines = currentScript === 'indopak' ? 16 : Math.max(maxLine, 15);

    for (let l = 1; l <= totalLines; l++) {
        let lineDiv = document.createElement('div');
        
        if (!linesMap[l]) {
            lineDiv.className = 'mushaf-line empty-line';
            lineDiv.style.minHeight = '2.2em';
            pageWrapper.appendChild(lineDiv);
            continue;
        }

        const lineData = linesMap[l];
        
        if (lineData.type === 'header') {
            lineDiv.className = `mushaf-line banner-line surah-header-line ${currentScript === 'indopak' ? 'indopak-local' : ''}`;
            const surahNum = parseInt(lineData.surah);
            const surahName = (typeof surahs !== 'undefined' && surahs[surahNum - 1]) ? surahs[surahNum - 1][0] : `Surah ${surahNum}`;
            lineDiv.innerHTML = `<div class="surah-header-banner">${surahName}</div>`;
        } 
        else if (lineData.type === 'bismillah') {
            lineDiv.className = 'mushaf-line banner-line bismillah-line';
            lineDiv.innerHTML = `<div class="bismillah-text">بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</div>`;
        } 
        else if (lineData.type === 'words') {
            lineDiv.className = `mushaf-line words-line ${currentScript === 'indopak' ? 'indopak-local indopak-mushaf' : ''}`;
            if (lineData.data.length < 6) lineDiv.classList.add('short-line');
            
            lineData.data.forEach(w => {
                let text = w.textData || w.text;
                let isEnd = w.char_type_name === 'end';
                let isFirstWord = w.position === 1;
                let vKey = w.verse_key;
                
                const parts = vKey.split(':');
                const sNum = parseInt(parts[0]);
                const aNum = parseInt(parts[1]);
                
                let wordSpan = document.createElement('span');
                wordSpan.className = isEnd ? 'verse-end' : 'quran-word-unit';
                if (isEnd) wordSpan.id = `v-${vKey.replace(':', '-')}`;
                wordSpan.dataset.vkey = vKey;
                wordSpan.dataset.surah = sNum;
                wordSpan.dataset.ayah = aNum;
                wordSpan.dataset.juz = w.juz || '';

                if (isEnd && currentScript === 'indopak') {
                    text = '۝' + text;
                }

                let metadata = (typeof VERSE_METADATA !== 'undefined') ? VERSE_METADATA[vKey] : null;
                
                if (isFirstWord && metadata && metadata.rub) {
                    text = `<span class="rub-icon" style="color:var(--primary-color); font-size: 0.9em; margin-left: 5px;">۞</span>` + text;
                }

                wordSpan.innerHTML = text;
                
                if (isEnd && w.sajda) {
                    wordSpan.innerHTML += `<span class="sajda-icon" style="color:var(--primary-color); margin-right: 5px;" title="Sajdah #${w.sajda}">۩</span>`;
                }
                
                wordSpan.onclick = () => playRecitation(sNum, aNum, vKey);
                
                lineDiv.appendChild(wordSpan);
                
                // If this word ends a Ruku, add the marker to the line margin
                if (isEnd && metadata && metadata.ruku) {
                    let rukuCountText = metadata.ruku_number ? metadata.ruku_number : "";
                    let rukuMarker = document.createElement('div');
                    rukuMarker.className = 'ruku-margin-marker';
                    rukuMarker.title = "End of Ruku";
                    rukuMarker.innerHTML = `ع<div style="font-size:0.6em; margin-top:-3px;">${rukuCountText}</div>`;
                    lineDiv.appendChild(rukuMarker);
                }
            });
        }
        pageWrapper.appendChild(lineDiv);
    }
    
    section.appendChild(pageWrapper);
    const pageFooter = document.createElement('div');
    pageFooter.className = 'mushaf-page-footer';
    pageFooter.innerText = pageNum;
    section.appendChild(pageFooter);
    
    return section;
}

async function loadBatch(direction = 'next', customStart = null) {
    if (isLoadingBatch) return;
    isLoadingBatch = true;
    
    const loader = document.querySelector(direction === 'next' ? '#load-more-trigger' : '#load-prev-trigger');
    if (loader) loader.style.opacity = '1';

    let start, end;
    const max = getMaxPages();
    
    if (direction === 'next') {
        if (customStart !== null) {
            start = customStart;
        } else {
            start = loadedPages.length === 0 ? 1 : Math.max(...loadedPages) + 1;
        }
        
        if (start > max) { 
            isLoadingBatch = false; 
            if (loader) loader.style.opacity = '0';
            return; 
        }
        end = Math.min(start + BATCH_SIZE - 1, max);
    } else {
        const minLoaded = loadedPages.length === 0 ? 1 : Math.min(...loadedPages);
        end = minLoaded - 1;
        if (end < 1) { 
            isLoadingBatch = false; 
            if (loader) loader.style.opacity = '0';
            return; 
        }
        start = Math.max(end - BATCH_SIZE + 1, 1);
    }

    const contentArea = document.querySelector('.content-area');
    const scrollPos = contentArea ? contentArea.scrollTop : 0;
    const oldHeight = QURAN_ROOT.scrollHeight;

    if (direction === 'prev') {
        for (let p = end; p >= start; p--) {
            if (!loadedPages.includes(p)) {
                const pageData = await fetchPageVerses(p);
                const section = createPageSection(p, pageData);
                QURAN_ROOT.prepend(section);
                loadedPages.push(p);
            }
        }
    } else {
        for (let p = start; p <= end; p++) {
            if (!loadedPages.includes(p)) {
                const pageData = await fetchPageVerses(p);
                const section = createPageSection(p, pageData);
                QURAN_ROOT.appendChild(section);
                loadedPages.push(p);
            }
        }
    }
    
    loadedPages.sort((a,b) => a - b);
    if (direction === 'prev' && contentArea) {
        const newHeight = QURAN_ROOT.scrollHeight;
        contentArea.scrollTop = scrollPos + (newHeight - oldHeight);
    }

    isLoadingBatch = false;
    if (loader) loader.style.opacity = '0';
}

function playRecitation(s, a, verseKey) {
    const playerBar = document.getElementById('audio-player-bar');
    const playerPlayBtn = document.getElementById('player-play-btn');
    const playerInfo = document.getElementById('player-verse-info');

    document.querySelectorAll('.playing').forEach(v => v.classList.remove('playing'));
    document.querySelectorAll(`[data-vkey="${verseKey}"]`).forEach(el => el.classList.add('playing'));

    if (playerBar) {
        playerBar.style.display = 'flex';
        playerBar.classList.add('active');
    }
    if (playerInfo) playerInfo.textContent = verseKey;

    if (currentAudio && currentPlayingSurah === s && currentPlayingAyah === a) {
        if (!currentAudio.paused && !currentAudio.ended) {
            currentAudio.pause();
            if (playerPlayBtn) playerPlayBtn.innerHTML = '<i data-lucide="play"></i>';
            lucide.createIcons();
            return;
        } else if (currentAudio.paused) {
            currentAudio.play();
            if (playerPlayBtn) playerPlayBtn.innerHTML = '<i data-lucide="pause"></i>';
            lucide.createIcons();
            return;
        }
    }

    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }

    currentPlayingSurah = s;
    currentPlayingAyah = a;

    const sPad = String(s).padStart(3, '0');
    const aPad = String(a).padStart(3, '0');
    const url = `${AUDIO_BASE_EVERYAYAH}/${selectedReciter.folder}/${sPad}${aPad}.mp3`;

    if (playerPlayBtn) playerPlayBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i>';
    lucide.createIcons();

    currentAudio = new Audio(url);
    currentAudio.playbackRate = currentPlaybackRate;
    
    currentAudio.onplaying = () => {
        if (playerPlayBtn) playerPlayBtn.innerHTML = '<i data-lucide="pause"></i>';
        lucide.createIcons();
        const firstWordEl = document.querySelector(`[data-vkey="${verseKey}"]`);
        if(firstWordEl) {
            const rect = firstWordEl.getBoundingClientRect();
            if (rect.top < 100 || rect.bottom > window.innerHeight - 150) {
                firstWordEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    };

    currentAudio.onended = () => {
        if (isRepeatMode) {
            playRecitation(currentPlayingSurah, currentPlayingAyah, `${currentPlayingSurah}:${currentPlayingAyah}`);
        } else {
            playNextAyah();
        }
    };

    currentAudio.onerror = () => {
        console.error("Audio error", url);
        if (playerPlayBtn) playerPlayBtn.innerHTML = '<i data-lucide="play"></i>';
        lucide.createIcons();
        setTimeout(() => playNextAyah(), 1000);
    };

    currentAudio.play();
}

function togglePlayerPause() {
    if (currentPlayingSurah) {
        playRecitation(currentPlayingSurah, currentPlayingAyah, `${currentPlayingSurah}:${currentPlayingAyah}`);
    }
}

function stopRecitation() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    document.querySelectorAll('.playing').forEach(v => v.classList.remove('playing'));
    const playerPlayBtn = document.getElementById('player-play-btn');
    if (playerPlayBtn) playerPlayBtn.innerHTML = '<i data-lucide="play"></i>';
    const playerBar = document.getElementById('audio-player-bar');
    if (playerBar) playerBar.classList.remove('active');
    lucide.createIcons();
}

function playNextAyah() {
    let nextS = currentPlayingSurah;
    let nextA = currentPlayingAyah + 1;
    let nextVKey = `${nextS}:${nextA}`;
    let nextEl = document.querySelector(`[data-vkey="${nextVKey}"]`);
    
    if (nextEl) {
        playRecitation(nextS, nextA, nextVKey);
    } else {
        fetch(`${API_BASE}/verses/by_key/${currentPlayingSurah}:${currentPlayingAyah + 1}?words=true`)
            .then(res => res.json())
            .then(data => {
                if (data.verse) {
                    let pageNum = (currentScript === 'indopak') ? findPageForVerse(nextS, nextA) : data.verse.words[0].page_number;
                    if (pageNum) {
                        jumpToPage(pageNum).then(() => {
                            setTimeout(() => playRecitation(nextS, nextA, nextVKey), 500);
                        });
                    }
                } else {
                    nextS++;
                    nextA = 1;
                    let nKey = `${nextS}:1`;
                    fetch(`${API_BASE}/verses/by_key/${nKey}?words=true`)
                        .then(r => r.json())
                        .then(d => {
                             if(d.verse) {
                                let pageNum = (currentScript === 'indopak') ? findPageForVerse(nextS, nextA) : d.verse.words[0].page_number;
                                if (pageNum) {
                                    jumpToPage(pageNum).then(() => {
                                        setTimeout(() => playRecitation(nextS, nextA, nKey), 500);
                                    });
                                }
                             }
                        });
                }
            });
    }
}

function playPreviousAyah() {
    if (currentPlayingAyah > 1) {
        const prevA = currentPlayingAyah - 1;
        const vKey = `${currentPlayingSurah}:${prevA}`;
        const el = document.querySelector(`[data-vkey="${vKey}"]`);
        if (el) playRecitation(currentPlayingSurah, prevA, vKey);
        else {
            fetch(`${API_BASE}/verses/by_key/${vKey}?words=true`)
                .then(r => r.json())
                .then(d => {
                    if (d.verse) {
                        jumpToPage(d.verse.words[0].page_number).then(() => {
                            setTimeout(() => playRecitation(currentPlayingSurah, prevA, vKey), 500);
                        });
                    }
                });
        }
    }
}

function changePlayerReciter(id) {
    selectedReciter = RECITERS.find(r => r.id === id) || RECITERS[0];
    if (currentAudio) {
        currentAudio.pause();
        playRecitation(currentPlayingSurah, currentPlayingAyah, `${currentPlayingSurah}:${currentPlayingAyah}`);
    }
}

function changePlaybackRate(rate) {
    currentPlaybackRate = parseFloat(rate);
    if (currentAudio) {
        currentAudio.playbackRate = currentPlaybackRate;
    }
}

function toggleRepeatMode() {
    isRepeatMode = !isRepeatMode;
    const btn = document.getElementById('player-repeat-btn');
    const badge = document.getElementById('repeat-count-badge');
    if (btn) btn.classList.toggle('active', isRepeatMode);
    if (badge) {
        badge.style.display = isRepeatMode ? 'flex' : 'none';
        badge.textContent = '∞';
    }
}

async function jumpToPage(pageNum) {
    let el = document.getElementById(`page-${pageNum}`);
    if (!el) {
        QURAN_ROOT.innerHTML = '';
        loadedPages = []; 
        await loadBatch('next', pageNum);
        el = document.getElementById(`page-${pageNum}`);
    }
    if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function findPageForVerse(surah, ayah) {
    const keyVal = surah * 1000 + ayah;
    if (currentScript === 'indopak' && typeof INDOPAK_16LINE_MAPPING !== 'undefined') {
        for (let pNum in INDOPAK_16LINE_MAPPING) {
            const [start, end] = INDOPAK_16LINE_MAPPING[pNum];
            const [s1, a1] = start.split(':').map(Number);
            const [s2, a2] = end.split(':').map(Number);
            const startVal = s1 * 1000 + a1;
            const endVal = s2 * 1000 + a2;
            if (keyVal >= startVal && keyVal <= endVal) return parseInt(pNum);
        }
    }
    return null;
}

async function jumpToSurah(num, targetAyah = 1) {
    let pNum = null;

    if (currentScript === 'indopak' && typeof INDOPAK_16LINE_MAPPING !== 'undefined') {
        const targetScore = parseInt(num) * 1000 + parseInt(targetAyah);
        for (let p = 1; p <= 548; p++) {
            if (!INDOPAK_16LINE_MAPPING[p]) continue;
            const [start, end] = INDOPAK_16LINE_MAPPING[p];
            let [sStart, aStart] = start.split(':').map(Number);
            let [sEnd, aEnd] = end.split(':').map(Number);
            
            let startScore = sStart * 1000 + aStart;
            let endScore = sEnd * 1000 + aEnd;
            
            if (targetScore >= startScore && targetScore <= endScore) {
                pNum = p;
                break;
            }
        }
    } else {
        const mushafId = currentScript === 'indopak' ? 7 : 1;
        try {
            const res = await fetch(`${API_BASE}/verses/by_key/${num}:${targetAyah}?mushaf=${mushafId}`);
            const data = await res.json();
            if (data.verse) {
                pNum = data.verse.page_number;
            }
        } catch (e) {
            console.error(`Failed to fetch page for jump:`, e);
        }
    }

    if (pNum) {
        await jumpToPage(pNum);
        setTimeout(() => {
            const vKey = `${num}:${targetAyah}`;
            const vEl = document.querySelector(`[data-vkey="${vKey}"]`);
            if (vEl) {
                vEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                document.querySelectorAll('.playing').forEach(el => el.classList.remove('playing'));
                document.querySelectorAll(`[data-vkey="${vKey}"]`).forEach(w => w.classList.add('playing'));
                saveProgress();
            }
        }, 800);
    }
}

function handleVerseJump() {
    const sId = SURAH_SELECT.value;
    const aId = document.getElementById('verse-jump-input').value;
    if (sId && aId) jumpToSurah(parseInt(sId), parseInt(aId));
    else if (sId) jumpToSurah(parseInt(sId), 1);
}

function handlePageJump() {
    const pId = document.getElementById('page-jump-input').value;
    const pageNum = parseInt(pId);
    const max = getMaxPages();
    if (pageNum && pageNum >= 1 && pageNum <= max) jumpToPage(pageNum);
    else alert(`Please enter a valid page number between 1 and ${max}.`);
}

document.getElementById('verse-jump-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleVerseJump();
});
document.getElementById('page-jump-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handlePageJump();
});

async function jumpToJuz(num) {
    const [s, a] = juzStarts[num];
    await jumpToSurah(s, a);
}

function saveProgress() {
    let activePage = 1;
    let firstWord = null;

    document.querySelectorAll('.full-quran-page').forEach(page => {
        const rect = page.getBoundingClientRect();
        if (rect.top <= window.innerHeight / 3 && rect.bottom >= window.innerHeight / 3) {
            activePage = parseInt(page.dataset.page);
            if (!firstWord) firstWord = page.querySelector('[data-vkey]');
        }
    });

    if (activePage) {
        localStorage.setItem('full_quran_last_page', activePage);
        const pageInput = document.getElementById('page-jump-input');
        if (pageInput && document.activeElement !== pageInput) pageInput.value = activePage;

        if (firstWord) {
            const vkey = firstWord.dataset.vkey;
            const [s, a] = vkey.split(':').map(Number);
            if (SURAH_SELECT && parseInt(SURAH_SELECT.value) !== s) {
                SURAH_SELECT.value = s;
                updateAyahSelect(s);
            }
            if (AYAH_SELECT && document.activeElement !== AYAH_SELECT) AYAH_SELECT.value = a;
            if (JUZ_SELECT && firstWord.dataset.juz && parseInt(JUZ_SELECT.value) !== parseInt(firstWord.dataset.juz)) {
                JUZ_SELECT.value = firstWord.dataset.juz;
            }
            const playerInfo = document.getElementById('player-verse-info');
            if (playerInfo) playerInfo.textContent = vkey;
        }
        updateLastReadUI();
    }
}

function updateLastReadUI() {
    const page = localStorage.getItem('full_quran_last_page');
    const container = document.getElementById('last-read-container');
    const text = document.getElementById('last-read-text');
    if (page && container && text) {
        container.style.display = 'inline-flex';
        text.textContent = `Page ${page}`;
    }
}

function jumpToLastRead() {
    const page = localStorage.getItem('full_quran_last_page');
    if (page) jumpToPage(parseInt(page));
}

document.addEventListener('DOMContentLoaded', () => {
    for (let i = 1; i <= 114; i++) {
        const opt = document.createElement('option'); opt.value = i;
        opt.textContent = `${i}. ${surahs[i-1][0]}`;
        SURAH_SELECT.appendChild(opt);
    }
    for (let i = 1; i <= 30; i++) {
        const opt = document.createElement('option'); opt.value = i;
        opt.textContent = `Para ${i}`;
        JUZ_SELECT.appendChild(opt);
    }
    
    const pSelect = document.getElementById('player-reciter-select');
    RECITERS.forEach(r => {
        const opt = document.createElement('option'); opt.value = r.id;
        opt.textContent = r.name;
        pSelect.appendChild(opt);
    });

    SCRIPT_SELECT.value = currentScript;
    SCRIPT_SELECT.onchange = (e) => {
        currentScript = e.target.value;
        localStorage.setItem('full_quran_script', currentScript);
        QURAN_ROOT.innerHTML = '';
        loadedPages = [];
        loadBatch();
    };

    SURAH_SELECT.onchange = (e) => {
        const sNum = parseInt(e.target.value);
        updateAyahSelect(sNum);
        jumpToSurah(sNum, 1);
    };

    AYAH_SELECT.onchange = (e) => {
        const sNum = parseInt(SURAH_SELECT.value);
        const aNum = parseInt(e.target.value);
        if (sNum && aNum) jumpToSurah(sNum, aNum);
    };

    JUZ_SELECT.onchange = (e) => jumpToJuz(parseInt(e.target.value));

    const contentArea = document.querySelector('.content-area');
    let scrollTimeout;
    if (contentArea) {
        contentArea.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(saveProgress, 150);
        });
    }

    const loadObserver = new IntersectionObserver((entries) => {
        if(entries[0].isIntersecting) loadBatch('next');
    }, { root: contentArea, rootMargin: '0px 0px 500px 0px' });
    
    const trigger = document.getElementById('load-more-trigger');
    if(trigger) loadObserver.observe(trigger);

    const prevObserver = new IntersectionObserver((entries) => {
        if(entries[0].isIntersecting) loadBatch('prev');
    }, { root: contentArea, rootMargin: '500px 0px 0px 0px' });

    const prevTrigger = document.getElementById('load-prev-trigger');
    if (prevTrigger) prevObserver.observe(prevTrigger);

    const lastPage = localStorage.getItem('full_quran_last_page');
    if(lastPage) loadedPages = [parseInt(lastPage)-1];
    loadBatch().then(() => updateLastReadUI());
});

window.addEventListener('load', () => {
    const sidebar = document.querySelector('eq-sidebar');
    const toggle = document.getElementById('sidebar-toggle');
    if (toggle && sidebar) toggle.onclick = () => sidebar.toggle();
});
