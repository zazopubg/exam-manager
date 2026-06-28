// app.js
/** --- 0. MULTI-LANGUAGE SYSTEM (BADINI - SORANI) --- */

function translateUI(lang) {
    document.querySelectorAll('[data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        if (locales[lang] && locales[lang][key]) {
            el.innerHTML = locales[lang][key];
        }
    });

    document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
        const key = el.getAttribute('data-translate-placeholder');
        if (locales[lang] && locales[lang][key]) {
            el.setAttribute('placeholder', locales[lang][key]);
        }
    });

    const body = document.body;
    body.setAttribute('dir', 'rtl');

    // Re-render help if it's currently visible
    if (!document.getElementById('view-help').classList.contains('hidden')) {
        renderHelp();
    }
}

function setLanguage(lang) {
    appState.config.lang = lang;
    localStorage.setItem('examLang', lang);

    const btnKu = document.getElementById('lang-btn-ku');
    const btnAr = document.getElementById('lang-btn-ar');

    if (lang === 'ku') {
        btnKu.className = 'px-2 py-1 text-xs rounded-md transition font-bold bg-primary text-white';
        btnAr.className = 'px-2 py-1 text-xs rounded-md transition font-bold text-gray-400 hover:text-white';
    } else {
        btnAr.className = 'px-2 py-1 text-xs rounded-md transition font-bold bg-primary text-white';
        btnKu.className = 'px-2 py-1 text-xs rounded-md transition font-bold text-gray-400 hover:text-white';
    }

    translateUI(lang);
    updateStats();
    updateSectorSelectors();
    updateSearchSectorSelectors();
    if (appState.sectors.length > 0) {
        renderSectors();
    }
}

function t(key) {
    const lang = appState.config.lang || 'ku';
    return locales[lang][key] || locales['ku'][key] || key;
}

/** --- 1. APPLICATION STATE --- */
const appState = {
    students: [],
    sectors: [],
    unplaced: [],
    config: {
        schoolName: '',
        semester: '',
        managerName: '',
        cols: 3,
        desks: 5,
        mode: 'single',
        lang: 'ku',
        colorCards: false
    },
    headers: {
        serial: 'سەریال',
        name: 'ناڤ',
        className: 'پۆل',
        hoba: 'هۆبە',
        term: 'وەرز'
    },
    currentWorkbook: null
};

document.addEventListener("DOMContentLoaded", () => {
    loadConfigFromStorage();

    const savedLang = localStorage.getItem('examLang') || 'ku';
    setLanguage(savedLang);

    updateStats();
    updateSearchSectorSelectors();
});

/** --- 2. UI LOGIC & SIDEBAR COLLAPSE --- */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleIcon = document.getElementById('toggle-icon');

    if (sidebar.classList.contains('w-64')) {
        sidebar.classList.remove('w-64');
        sidebar.classList.add('w-0', 'overflow-hidden');
        toggleIcon.className = 'fas fa-chevron-left';
    } else {
        sidebar.classList.remove('w-0', 'overflow-hidden');
        sidebar.classList.add('w-64');
        toggleIcon.className = 'fas fa-chevron-right';
    }
}

function switchView(viewName) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-primary', 'text-white');
        btn.classList.add('text-gray-400');
    });
    const activeBtn = document.getElementById(`nav-${viewName}`);
    activeBtn.classList.remove('text-gray-400');
    activeBtn.classList.add('bg-primary', 'text-white');

    document.getElementById('view-controller').classList.add('hidden');
    document.getElementById('view-hall-map').classList.add('hidden');
    document.getElementById('view-search').classList.add('hidden');
    document.getElementById('view-print').classList.add('hidden');
    document.getElementById('view-help').classList.add('hidden');

    document.getElementById(`view-${viewName}`).classList.remove('hidden');

    if (viewName === 'hall-map') {
        renderSectors();
    } else if (viewName === 'help') {
        renderHelp();
    }
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toast-icon');
    document.getElementById('toast-msg').innerText = message;

    toast.classList.remove('translate-y-20', 'opacity-0', 'border-primary', 'border-green-500', 'border-red-500');

    if (type === 'success') { toast.classList.add('border-green-500');
        icon.innerHTML = '✅'; } else if (type === 'error') { toast.classList.add('border-red-500');
        icon.innerHTML = '❌'; } else { toast.classList.add('border-primary');
        icon.innerHTML = 'ℹ️'; }

    toast.classList.add('translate-y-0', 'opacity-100');
    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

function saveConfigToStorage() {
    appState.config.schoolName = document.getElementById('cfg-school').value;
    appState.config.semester = document.getElementById('cfg-semester').value;
    appState.config.managerName = document.getElementById('cfg-manager').value;
    localStorage.setItem('examConfig', JSON.stringify(appState.config));
}

function loadConfigFromStorage() {
    const saved = localStorage.getItem('examConfig');
    if (saved) {
        const parsed = JSON.parse(saved);
        document.getElementById('cfg-school').value = parsed.schoolName || '';
        document.getElementById('cfg-semester').value = parsed.semester || '';
        document.getElementById('cfg-manager').value = parsed.managerName || '';
        appState.config = { ...appState.config, ...parsed };
        document.getElementById('cfg-cols').value = appState.config.cols || 3;
        document.getElementById('cfg-desks').value = appState.config.desks || 5;
        document.getElementById('cfg-mode').value = appState.config.mode || 'single';

        const colorToggle = document.getElementById('print-color-toggle');
        if (colorToggle) {
            colorToggle.checked = !!appState.config.colorCards;
        }
    }
}

function toggleColorCards(checkbox) {
    appState.config.colorCards = checkbox.checked;
    saveConfigToStorage();
    showToast(t('colorCardsLabel') + " " + (checkbox.checked ? "✅" : "❌"), 'info');
}

function updateStats() {
    const total = appState.students.length;
    let seated = 0;

    if (appState.sectors.length > 0) {
        appState.sectors.forEach(sector => {
            sector.forEach(column => {
                column.forEach(desk => {
                    if (desk && desk.students) {
                        desk.students.forEach(s => { if (s) seated++; });
                    }
                });
            });
        });
    }

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-seated').innerText = seated;
    document.getElementById('stat-sectors').innerText = appState.sectors.length;
    document.getElementById('stat-unplaced').innerText = appState.unplaced.length;

    if (appState.unplaced.length > 0) document.getElementById('stat-unplaced').classList.add('text-red-500');
    else document.getElementById('stat-unplaced').classList.remove('text-red-500');
}

function updateSectorSelectors() {
    const mapSelect = document.getElementById('map-sector-select');
    const printSelect = document.getElementById('print-sector-select');

    let options = `<option value="all">${t('filterAll')}</option>`;
    appState.sectors.forEach((_, i) => {
        options += `<option value="${i}">${t('sector')} ${i + 1}</option>`;
    });

    if (mapSelect) mapSelect.innerHTML = options;
    if (printSelect) printSelect.innerHTML = options;
}

function updateSearchSectorSelectors() {
    const searchSelect = document.getElementById('search-sector-filter');
    if (!searchSelect) return;

    let options = `<option value="all">${t('filterAll')}</option>`;
    appState.sectors.forEach((_, i) => {
        options += `<option value="${i}">${t('sector')} ${i + 1}</option>`;
    });
    searchSelect.innerHTML = options;
}

/** --- 3. EXCEL MODULE --- */
const ExcelModule = {
    handleUpload: function(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (typeof XLSX === 'undefined') {
            showToast(t('toastSelectSheet'), 'error');
            return;
        }

        document.getElementById('excel-upload-status').innerHTML = `<span class="text-yellow-500"><span style="font-style:normal;">⏳</span> ${t('readingFile')}</span>`;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                appState.currentWorkbook = workbook;

                const checkboxesDiv = document.getElementById('excel-sheet-checkboxes');
                checkboxesDiv.innerHTML = '';

                workbook.SheetNames.forEach((sheetName, index) => {
                    const worksheet = workbook.Sheets[sheetName];
                    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    let studentCount = 0;
                    for (let i = 1; i < rows.length; i++) {
                        if (rows[i] && String(rows[i][1] || '').trim()) {
                            studentCount++;
                        }
                    }

                    checkboxesDiv.innerHTML += `
                                <label class="flex items-center justify-between p-1.5 hover:bg-gray-800 rounded border border-gray-700 bg-gray-900/50 cursor-pointer">
                                    <div class="flex items-center gap-2">
                                        <input type="checkbox" class="excel-sheet-checkbox w-4 h-4 text-primary rounded border-gray-600 focus:ring-primary" value="${sheetName}" checked>
                                        <span class="text-sm text-gray-200 font-semibold">${sheetName}</span>
                                    </div>
                                    <span class="text-xs bg-blue-900/40 text-blue-300 border border-blue-800/30 px-2 py-0.5 rounded-md font-bold">${studentCount} ${t('studentCountSuffix')}</span>
                                </label>
                            `;
                });

                document.getElementById('excel-sheet-container').classList.remove('hidden');
                document.getElementById('excel-upload-status').innerHTML = `<span class="text-blue-400"><span style="font-style:normal;">👆</span> ${t('readyText')}</span>`;

            } catch (err) {
                console.error('Error reading file structure:', err);
                showToast('Error reading file structure', 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    },

    toggleAllSheets: function(state) {
        document.querySelectorAll('.excel-sheet-checkbox').forEach(cb => {
            cb.checked = state;
        });
    },

    detectHeaders: function(headerRow) {
        headerRow.forEach((col, idx) => {
            const val = String(col || '').trim().toLowerCase();
            if (val.includes('سەریال') || val.includes('serial') || val.includes('سوريا') || val.includes('رقم')) {
                appState.headers.serialIdx = idx;
            } else if (val.includes('ناڤ') || val.includes('name') || val.includes('الاسم')) {
                appState.headers.nameIdx = idx;
            } else if (val.includes('پۆل') || val.includes('class') || val.includes('الصف') || val.includes('المرحلة')) {
                appState.headers.classIdx = idx;
            } else if (val.includes('هۆبە') || val.includes('hoba') || val.includes('الشعبة') || val.includes('section')) {
                appState.headers.hobaIdx = idx;
            } else if (val.includes('وەرز') || val.includes('term') || val.includes('الفصل')) {
                appState.headers.termIdx = idx;
            }
        });
    },

    parseStudents: function(rows, sheetName) {
        const students = [];
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            const nameCol = String(row[appState.headers.nameIdx] || '').trim();
            if (!nameCol) continue;

            const student = {
                id: 'stu_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                serial: String(row[appState.headers.serialIdx] || '-'),
                name: nameCol,
                className: String(row[appState.headers.classIdx] || 'گشتی').trim(),
                hoba: String(row[appState.headers.hobaIdx] || '-').trim(),
                term: String(row[appState.headers.termIdx] || '-').trim(),
                sheet: sheetName
            };
            students.push(student);
        }
        return students;
    },

    processSheets: function() {
        if (!appState.currentWorkbook) {
            showToast('الرجاء رفع ملف إكسل أولاً', 'error');
            return;
        }

        const checkboxes = document.querySelectorAll('.excel-sheet-checkbox:checked');
        if (checkboxes.length === 0) {
            showToast(t('toastSelectSheet'), 'error');
            return;
        }

        let allNewStudents = [];
        let headersSet = false;

        appState.headers.serialIdx = 0;
        appState.headers.nameIdx = 1;
        appState.headers.classIdx = 2;
        appState.headers.hobaIdx = 3;
        appState.headers.termIdx = 4;

        try {
            checkboxes.forEach(cb => {
                const sheetName = cb.value;
                const worksheet = appState.currentWorkbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (rows.length > 0 && !headersSet) {
                    const headerRow = rows[0];
                    if (headerRow) {
                        this.detectHeaders(headerRow);
                        appState.headers.serial = headerRow[appState.headers.serialIdx] || t('serialHeader');
                        appState.headers.name = headerRow[appState.headers.nameIdx] || t('nameHeader');
                        appState.headers.className = headerRow[appState.headers.classIdx] || t('classHeader');
                        appState.headers.hoba = headerRow[appState.headers.hobaIdx] || t('hobaHeader');
                        appState.headers.term = headerRow[appState.headers.termIdx] || t('termHeader');
                    }
                    headersSet = true;
                }

                const newStudents = this.parseStudents(rows, sheetName);
                allNewStudents = allNewStudents.concat(newStudents);
            });

            appState.students = appState.students.concat(allNewStudents);

            showToast(t('toastSuccessImport').replace('{count}', allNewStudents.length), 'success');
            document.getElementById('excel-upload-status').innerHTML = `<span class="text-green-500"><span style="font-style:normal;">✅</span> ${allNewStudents.length} ${t('readyText')}</span>`;

            document.getElementById('excel-sheet-container').classList.add('hidden');
            document.getElementById('excel-add-btn').disabled = true;

            updateStats();

        } catch (err) {
            console.error('Error processing sheets:', err);
            showToast('حدث خطأ أثناء معالجة البيانات. تأكد من تنسيق الملف.', 'error');
        }
    }
};

/** --- 4. ANTI-CHEAT ALGORITHM AND DISTRIBUTION --- */
function normalizeDigits(str) {
    const easternToWestern = {
        '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
        '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
        '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
        '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
    };
    return str.replace(/[٠-٩۰-۹]/g, d => easternToWestern[d] || d);
}

function getStageLevel(className) {
    if (!className) return '';
    const normalized = normalizeDigits(className);
    const match = normalized.match(/\d+/);
    return match ? match[0] : className.trim().toLowerCase();
}

function areStudentsFromSameStage(s1, s2) {
    if (!s1 || !s2) return false;
    if (s1.className === s2.className) return true;
    const lvl1 = getStageLevel(s1.className);
    const lvl2 = getStageLevel(s2.className);
    return (lvl1 === lvl2 && lvl1 !== '');
}

function createEmptyGrid(cols, desks, maxPerDesk) {
    return Array(cols).fill(null).map(() =>
        Array(desks).fill(null).map(() => ({
            students: Array(maxPerDesk).fill(null)
        }))
    );
}

function shuffleArray(array) {
    let shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function calculatePlacementViolations(student, grid, c, d, seatPos, mode) {
    if (!student) return 0;
    let violations = 0;

    if (mode === 'double' && seatPos === 1) {
        const neighbor = grid[c][d].students[0];
        if (neighbor && areStudentsFromSameStage(neighbor, student)) {
            violations += 10;
        }
    }

    if (d > 0) {
        grid[c][d - 1].students.forEach(neighbor => {
            if (neighbor && areStudentsFromSameStage(neighbor, student)) violations += 5;
        });
    }
    if (d < appState.config.desks - 1) {
        const frontDesk = grid[c][d + 1];
        if (frontDesk) {
            frontDesk.students.forEach(neighbor => {
                if (neighbor && areStudentsFromSameStage(neighbor, student)) violations += 5;
            });
        }
    }
    if (c > 0) {
        grid[c - 1][d].students.forEach(neighbor => {
            if (neighbor && areStudentsFromSameStage(neighbor, student)) violations += 5;
        });
    }
    if (c < appState.config.cols - 1) {
        const leftDesk = grid[c + 1][d];
        if (leftDesk) {
            leftDesk.students.forEach(neighbor => {
                if (neighbor && areStudentsFromSameStage(neighbor, student)) violations += 5;
            });
        }
    }

    return violations;
}

function executeDistribution() {
    saveConfigToStorage();

    if (appState.students.length === 0) {
        showToast(t('toastNoData'), 'error');
        return;
    }

    const cols = parseInt(document.getElementById('cfg-cols').value);
    const desks = parseInt(document.getElementById('cfg-desks').value);
    const mode = document.getElementById('cfg-mode').value;
    const maxPerDesk = mode === 'double' ? 2 : 1;

    appState.config.cols = cols;
    appState.config.desks = desks;
    appState.config.mode = mode;

    appState.sectors = [];
    appState.unplaced = [];

    let studentsLeft = [...appState.students];

    let stageGroups = {};
    studentsLeft.forEach(s => {
        let stage = getStageLevel(s.className);
        if (!stageGroups[stage]) stageGroups[stage] = [];
        stageGroups[stage].push(s);
    });

    let interleavedStudents = [];
    let stages = Object.keys(stageGroups);
    let hasMore = true;
    let indexPointer = 0;

    while (hasMore) {
        hasMore = false;
        stages.forEach(st => {
            if (stageGroups[st][indexPointer]) {
                interleavedStudents.push(stageGroups[st][indexPointer]);
                hasMore = true;
            }
        });
        indexPointer++;
    }

    studentsLeft = interleavedStudents;

    while (studentsLeft.length > 0) {
        let currentGrid = createEmptyGrid(cols, desks, maxPerDesk);
        let placedInThisSector = false;

        for (let c = 0; c < cols; c++) {
            for (let d = 0; d < desks; d++) {
                for (let seatPos = 0; seatPos < maxPerDesk; seatPos++) {
                    if (studentsLeft.length === 0) break;

                    let bestCandidateIdx = -1;
                    let minViolations = Infinity;

                    let checkLimit = Math.min(20, studentsLeft.length);
                    for (let i = 0; i < checkLimit; i++) {
                        let candidate = studentsLeft[i];
                        let violations = calculatePlacementViolations(candidate, currentGrid, c, d, seatPos, mode);
                        if (violations < minViolations) {
                            minViolations = violations;
                            bestCandidateIdx = i;
                            if (minViolations === 0) break;
                        }
                    }

                    if (bestCandidateIdx !== -1) {
                        let student = studentsLeft.splice(bestCandidateIdx, 1)[0];
                        currentGrid[c][d].students[seatPos] = student;
                        placedInThisSector = true;
                    }
                }
            }
        }

        if (placedInThisSector) {
            appState.sectors.push(currentGrid);
        } else {
            break;
        }
    }

    updateStats();
    updateSectorSelectors();
    updateSearchSectorSelectors();
    showToast(t('toastSuccessDist').replace('{count}', appState.sectors.length), 'success');
    switchView('hall-map');
}

/** --- 5. INTERACTIVE MAP --- */
let draggedItem = null;

function renderSectors() {
    const wrapper = document.getElementById('sectors-wrapper');
    const msg = document.getElementById('empty-map-msg');
    const selectedFilter = document.getElementById('map-sector-select').value;

    if (appState.sectors.length === 0) {
        wrapper.classList.add('hidden');
        msg.classList.remove('hidden');
        return;
    }

    msg.classList.add('hidden');
    wrapper.classList.remove('hidden');
    wrapper.innerHTML = '';

    const maxSeats = appState.config.mode === 'double' ? 2 : 1;

    appState.sectors.forEach((gridMap, sectorIndex) => {
        if (selectedFilter !== 'all' && parseInt(selectedFilter) !== sectorIndex) return;

        const sectorContainer = document.createElement('div');
        sectorContainer.className = 'bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-lg';

        const sectorHeader = document.createElement('h3');
        sectorHeader.className = 'text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2 flex justify-between items-center';
        sectorHeader.innerHTML = `<span>${t('sector')}: ${sectorIndex + 1}</span> <span class="text-xs bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full"><span style="font-style:normal;">ℹ️</span> ${t('deskOneLabel')}</span>`;
        sectorContainer.appendChild(sectorHeader);

        const gridContainer = document.createElement('div');
        gridContainer.style.display = 'flex';
        gridContainer.style.flexDirection = 'row';
        gridContainer.style.gap = '16px';
        gridContainer.style.width = '100%';

        gridMap.forEach((columnData, cIndex) => {
            const columnDiv = document.createElement('div');
            columnDiv.style.display = 'flex';
            columnDiv.style.flexDirection = 'column-reverse';
            columnDiv.style.gap = '12px';
            columnDiv.style.flex = '1';

            columnData.forEach((deskData, dIndex) => {
                const deskDiv = document.createElement('div');
                deskDiv.className = 'bg-gray-700/50 border-2 border-gray-600 rounded-lg p-2 min-h-[100px] flex flex-col gap-2 transition-all seat-cell';

                const deskHeader = document.createElement('div');
                deskHeader.className = 'text-center text-xs text-gray-400 border-b border-gray-600 pb-1 mb-1';
                deskHeader.innerText = `${t('desk')} ${dIndex + 1} | ${t('row')} ${cIndex + 1}`;
                deskDiv.appendChild(deskHeader);

                for (let s = 0; s < maxSeats; s++) {
                    const seatSlot = document.createElement('div');
                    seatSlot.className = 'flex-1 bg-gray-800 rounded p-2 text-center border border-gray-700 relative group drop-zone flex flex-col justify-center transition-colors';

                    seatSlot.dataset.sector = sectorIndex;
                    seatSlot.dataset.col = cIndex;
                    seatSlot.dataset.desk = dIndex;
                    seatSlot.dataset.pos = s;

                    const student = deskData.students[s];
                    if (student) {
                        seatSlot.classList.add('border-primary/50', 'student-item');
                        seatSlot.draggable = true;
                        const colorHash = Math.abs(student.className.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0)) % 360;

                        seatSlot.innerHTML = `
                                    <div class="pointer-events-none w-full">
                                        <div class="w-1.5 h-full absolute right-0 top-0 rounded-r opacity-70" style="background-color: hsl(${colorHash}, 70%, 50%)"></div>
                                        <div class="font-bold text-white truncate text-sm px-1" title="${student.name}">${student.name}</div>
                                        <div class="text-gray-400 mt-1 flex flex-col px-1" style="font-size: 10px;">
                                            <div class="flex justify-between">
                                                <span><span class="text-[9px] text-gray-500">${t('serialHeader')}:</span> ${student.serial || '-'}</span>
                                                <span><span class="text-[9px] text-gray-500">${t('classHeader')}:</span> <span class="text-blue-300">${student.className}</span></span>
                                            </div>
                                            <div class="flex justify-between mt-0.5">
                                                <span><span class="text-[9px] text-gray-500">${t('hobaHeader')}:</span> ${student.hoba}</span>
                                                <span><span class="text-[9px] text-gray-500">${t('termHeader')}:</span> <span class="text-orange-300">${student.term || '-'}</span></span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onclick="showMoveMenu(${sectorIndex}, ${cIndex}, ${dIndex}, ${s})" class="absolute bottom-1 left-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] px-2 py-0.5 rounded opacity-70 hover:opacity-100 transition pointer-events-auto z-10">
                                        <i class="fas fa-arrow-right"></i> نقل
                                    </button>
                                `;

                        seatSlot.addEventListener('dragstart', handleDragStart);
                        seatSlot.addEventListener('dragend', handleDragEnd);
                    } else {
                        seatSlot.innerHTML = `<span class="text-gray-500 italic block pointer-events-none text-xs">${t('emptySeat')}</span>`;
                    }

                    seatSlot.addEventListener('dragover', handleDragOver);
                    seatSlot.addEventListener('dragleave', handleDragLeave);
                    seatSlot.addEventListener('drop', handleDrop);
                    deskDiv.appendChild(seatSlot);
                }
                columnDiv.appendChild(deskDiv);
            });

            gridContainer.appendChild(columnDiv);
        });

        sectorContainer.appendChild(gridContainer);
        wrapper.appendChild(sectorContainer);
    });
}

function handleDragStart(e) {
    draggedItem = {
        sector: parseInt(e.target.dataset.sector),
        col: parseInt(e.target.dataset.col),
        desk: parseInt(e.target.dataset.desk),
        pos: parseInt(e.target.dataset.pos)
    };
    e.target.classList.add('opacity-50');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    e.target.classList.remove('opacity-50');
    document.querySelectorAll('.drop-zone').forEach(el => el.classList.remove('drag-over'));
    draggedItem = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const zone = e.target.closest('.drop-zone');
    if (zone) zone.classList.add('drag-over');
    return false;
}

function handleDragLeave(e) {
    const zone = e.target.closest('.drop-zone');
    if (zone) zone.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const zone = e.target.closest('.drop-zone');
    if (!zone) return false;
    zone.classList.remove('drag-over');

    if (!draggedItem) return false;

    const targetSector = parseInt(zone.dataset.sector);
    const targetCol = parseInt(zone.dataset.col);
    const targetDesk = parseInt(zone.dataset.desk);
    const targetPos = parseInt(zone.dataset.pos);

    const sourceArray = appState.sectors[draggedItem.sector][draggedItem.col][draggedItem.desk].students;
    const targetArray = appState.sectors[targetSector][targetCol][targetDesk].students;

    const student1 = sourceArray[draggedItem.pos];
    const student2 = targetArray[targetPos];

    sourceArray[draggedItem.pos] = student2;
    targetArray[targetPos] = student1;

    renderSectors();
    updateStats();
    return false;
}

/** --- 6. MOVE STUDENT BETWEEN SECTORS --- */
function showMoveMenu(sourceSector, sourceCol, sourceDesk, sourcePos) {
    const student = appState.sectors[sourceSector][sourceCol][sourceDesk].students[sourcePos];
    if (!student) {
        showToast('لا يوجد طالب في هذا المقعد!', 'error');
        return;
    }

    const menu = document.createElement('div');
    menu.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center';
    menu.id = 'move-menu';
    menu.onclick = function(e) {
        if (e.target === this) closeMoveMenu();
    };

    let menuHTML = `
                <div class="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full shadow-2xl" onclick="event.stopPropagation()">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-bold text-white">${t('moveStudent') || 'نقل الطالب'}</h3>
                        <button onclick="closeMoveMenu()" class="text-gray-400 hover:text-white text-xl">&times;</button>
                    </div>
                    <div class="mb-4">
                        <p class="text-sm text-gray-300 mb-2">${t('selectSector') || 'اختر القاطع الذي تريد النقل إليه:'}</p>
                        <div id="sector-list" class="max-h-60 overflow-y-auto space-y-2">
            `;

    let hasSectors = false;
    appState.sectors.forEach((gridMap, idx) => {
        let count = 0;
        gridMap.forEach(col => {
            col.forEach(desk => {
                desk.students.forEach(s => { if (s) count++; });
            });
        });

        const cols = appState.config.cols || 3;
        const desks = appState.config.desks || 5;
        const maxPerDesk = appState.config.mode === 'double' ? 2 : 1;
        const maxCapacity = cols * desks * maxPerDesk;
        const isFull = count >= maxCapacity;

        if (idx === sourceSector) {
            menuHTML += `
                        <div class="w-full text-left p-3 rounded-lg bg-gray-700/30 border border-gray-600/50 text-gray-500 cursor-not-allowed">
                            <span class="font-bold">${t('sector')} ${idx + 1}</span>
                            <span class="text-xs text-gray-500">(${t('currentSector') || 'الحالي'})</span>
                        </div>
                    `;
            hasSectors = true;
            return;
        }

        hasSectors = true;
        menuHTML += `
                    <button onclick="moveStudent(${sourceSector}, ${sourceCol}, ${sourceDesk}, ${sourcePos}, ${idx})" 
                            class="w-full text-left p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700 border border-gray-600 transition flex justify-between items-center ${isFull ? 'opacity-50 cursor-not-allowed' : ''}"
                            ${isFull ? 'disabled' : ''}>
                        <span class="font-bold text-white">${t('sector')} ${idx + 1}</span>
                        <span class="text-xs text-gray-400">${count} ${t('studentCountSuffix')}</span>
                        ${isFull ? '<span class="text-red-400 text-xs">(ممتلئ)</span>' : ''}
                    </button>
                `;
    });

    if (!hasSectors) {
        menuHTML += `
                    <div class="text-center text-gray-500 py-4 text-sm">
                        ${t('noOtherSectors') || 'لا توجد قطاعات أخرى متاحة'}
                    </div>
                `;
    }

    menuHTML += `
                        </div>
                    </div>
                    <button onclick="createNewSectorAndMove(${sourceSector}, ${sourceCol}, ${sourceDesk}, ${sourcePos})" 
                            class="w-full text-center p-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold transition mb-2">
                        <i class="fas fa-plus ml-2"></i> ${t('newSector') || 'إنشاء قاطع جديد'}
                    </button>
                    <button onclick="closeMoveMenu()" class="w-full text-center p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition">
                        ${t('cancel') || 'إلغاء'}
                    </button>
                </div>
            `;

    menu.innerHTML = menuHTML;
    document.body.appendChild(menu);
}

function closeMoveMenu() {
    const menu = document.getElementById('move-menu');
    if (menu) {
        menu.remove();
    }
}

function moveStudent(sourceSector, sourceCol, sourceDesk, sourcePos, targetSector) {
    if (targetSector >= appState.sectors.length) {
        showToast('القاطع غير موجود!', 'error');
        closeMoveMenu();
        return;
    }

    const sourceArray = appState.sectors[sourceSector][sourceCol][sourceDesk].students;
    const student = sourceArray[sourcePos];

    if (!student) {
        showToast('لا يوجد طالب في هذا المقعد!', 'error');
        closeMoveMenu();
        return;
    }

    const targetGrid = appState.sectors[targetSector];
    const cols = appState.config.cols || 3;
    const desks = appState.config.desks || 5;
    const maxSeats = appState.config.mode === 'double' ? 2 : 1;
    let found = false;

    for (let c = 0; c < cols; c++) {
        for (let d = 0; d < desks; d++) {
            for (let s = 0; s < maxSeats; s++) {
                if (!targetGrid[c][d].students[s]) {
                    targetGrid[c][d].students[s] = student;
                    sourceArray[sourcePos] = null;
                    found = true;
                    break;
                }
            }
            if (found) break;
        }
        if (found) break;
    }

    if (found) {
        showToast(`تم نقل الطالب ${student.name} إلى القاطع ${targetSector + 1}`, 'success');
        closeMoveMenu();
        renderSectors();
        updateStats();
    } else {
        showToast('القاطع الهدف ممتلئ! لا يوجد مقاعد فارغة.', 'error');
    }
}

function createNewSectorAndMove(sourceSector, sourceCol, sourceDesk, sourcePos) {
    const cols = parseInt(document.getElementById('cfg-cols').value) || 3;
    const desks = parseInt(document.getElementById('cfg-desks').value) || 5;
    const maxPerDesk = appState.config.mode === 'double' ? 2 : 1;

    const newGrid = createEmptyGrid(cols, desks, maxPerDesk);
    appState.sectors.push(newGrid);

    const targetSector = appState.sectors.length - 1;
    moveStudent(sourceSector, sourceCol, sourceDesk, sourcePos, targetSector);

    updateSectorSelectors();
}

/** --- 7. GLOBAL SEARCH FUNCTION --- */
function performGlobalSearch(searchTerm) {
    const resultsWrapper = document.getElementById('search-results-wrapper');
    const emptyMsg = document.getElementById('search-empty-msg');
    const sectorFilter = document.getElementById('search-sector-filter').value;

    if (!searchTerm || searchTerm.trim() === '') {
        resultsWrapper.classList.add('hidden');
        emptyMsg.classList.remove('hidden');
        return;
    }

    const term = searchTerm.trim().toLowerCase();
    let results = [];

    // البحث في جميع القواطع
    appState.sectors.forEach((gridMap, sectorIndex) => {
        // تطبيق الفلتر
        if (sectorFilter !== 'all' && parseInt(sectorFilter) !== sectorIndex) return;

        gridMap.forEach((column, colIndex) => {
            column.forEach((desk, deskIndex) => {
                desk.students.forEach((student, seatIndex) => {
                    if (student) {
                        const nameMatch = student.name.toLowerCase().includes(term);
                        const serialMatch = student.serial.toLowerCase().includes(term);

                        if (nameMatch || serialMatch) {
                            results.push({
                                student: student,
                                sector: sectorIndex + 1,
                                col: colIndex + 1,
                                desk: deskIndex + 1,
                                seat: seatIndex + 1,
                                maxSeats: appState.config.mode === 'double' ? 2 : 1
                            });
                        }
                    }
                });
            });
        });
    });

    // عرض النتائج
    if (results.length === 0) {
        resultsWrapper.classList.add('hidden');
        emptyMsg.classList.remove('hidden');
        emptyMsg.innerHTML = `
                    <div class="flex flex-col items-center justify-center py-12 text-gray-500">
                        <i class="fas fa-search text-5xl mb-4 opacity-30"></i>
                        <p class="text-xl font-bold text-gray-400">${t('searchNotFound')}</p>
                        <p class="text-sm text-gray-500 mt-2">"${searchTerm}"</p>
                    </div>
                `;
        return;
    }

    emptyMsg.classList.add('hidden');
    resultsWrapper.classList.remove('hidden');

    let html = `
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-bold text-white">${t('searchResults')}</h3>
                    <span class="text-sm text-gray-400">${t('searchFound')} ${results.length}</span>
                </div>
                <div class="space-y-3">
            `;

    results.forEach((result, index) => {
        const student = result.student;
        html += `
                    <div class="bg-gray-700/30 border border-gray-600 rounded-lg p-4 hover:bg-gray-700/50 transition">
                        <div class="flex flex-col md:flex-row justify-between gap-4">
                            <div class="flex-1">
                                <div class="flex items-center gap-3 mb-2">
                                    <span class="font-bold text-lg text-white">${student.name}</span>
                                    <span class="text-sm text-gray-400">#${student.serial || '-'}</span>
                                </div>
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                    <div><span class="text-gray-400">${t('searchClass')}:</span> <span class="font-bold text-blue-300">${student.className}</span></div>
                                    <div><span class="text-gray-400">${t('searchHoba')}:</span> <span class="font-bold text-purple-300">${student.hoba}</span></div>
                                    <div><span class="text-gray-400">${t('searchTerm')}:</span> <span class="font-bold text-orange-300">${student.term || '-'}</span></div>
                                </div>
                            </div>
                            <div class="flex flex-col md:items-end justify-center bg-gray-800/50 rounded-lg p-3 min-w-[150px] border border-gray-700">
                                <div class="text-xs text-gray-400 mb-1">${t('searchLocation')}:</div>
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-1 text-sm font-bold">
                                    <div><span class="text-green-400">${t('searchSector')}:</span> ${result.sector}</div>
                                    <div><span class="text-blue-400">${t('searchRow')}:</span> ${result.col}</div>
                                    <div><span class="text-yellow-400">${t('searchDesk')}:</span> ${result.desk}</div>
                                    <div><span class="text-purple-400">${t('searchSeat')}:</span> ${result.seat}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
    });

    html += '</div>';
    resultsWrapper.innerHTML = html;
}

/** --- 8. HELP PAGE RENDERER (BADINI - SORANI) --- */
function renderHelp() {
    const container = document.getElementById('help-content');
    if (!container) return;

    const lang = appState.config.lang;

    const sections = [
        { id: 1, title: t('helpSection1'), content: t('helpSection1Content') },
        { id: 2, title: t('helpSection2'), content: `
                    <p>${t('helpSection2Content')}</p>
                    <div class="mt-4 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                        <h4 class="font-bold text-green-400 mb-2">${t('helpExcelTitle')}</h4>
                        <p class="text-sm text-gray-300 mb-3">${t('helpExcelDesc')}</p>
                        <table class="w-full text-sm text-left border-collapse border border-gray-600">
                            <thead>
                                <tr class="bg-gray-800">
                                    <th class="border border-gray-600 px-3 py-2 text-center">A</th>
                                    <th class="border border-gray-600 px-3 py-2 text-center">B</th>
                                    <th class="border border-gray-600 px-3 py-2 text-center">C</th>
                                    <th class="border border-gray-600 px-3 py-2 text-center">D</th>
                                    <th class="border border-gray-600 px-3 py-2 text-center">E</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td class="border border-gray-600 px-3 py-2 text-center text-gray-400">${t('helpExcelColA')}</td>
                                    <td class="border border-gray-600 px-3 py-2 text-center text-green-400 font-bold">${t('helpExcelColB')}</td>
                                    <td class="border border-gray-600 px-3 py-2 text-center text-blue-400 font-bold">${t('helpExcelColC')}</td>
                                    <td class="border border-gray-600 px-3 py-2 text-center text-purple-400">${t('helpExcelColD')}</td>
                                    <td class="border border-gray-600 px-3 py-2 text-center text-orange-400">${t('helpExcelColE')}</td>
                                </tr>
                            </tbody>
                        </table>
                        <p class="text-xs text-gray-400 mt-3">${t('helpExcelNote')}</p>
                        <p class="text-xs text-gray-300 mt-2"><span class="font-bold">${t('helpExcelExample')}</span> [1, ئەحمەد, 10, A, 1]</p>
                    </div>
                ` },
        { id: 3, title: t('helpSection3'), content: t('helpSection3Content') },
        { id: 4, title: t('helpSection4'), content: t('helpSection4Content') },
        { id: 5, title: t('helpSection5'), content: t('helpSection5Content') },
        { id: 6, title: t('helpSection6'), content: t('helpSection6Content') },
        { id: 7, title: t('helpSection7'), content: t('helpSection7Content') },
        { id: 8, title: t('helpSection8'), content: t('helpSection8Content') }
    ];

    let html = '';
    sections.forEach(section => {
        html += `
                    <div class="bg-gray-800/50 rounded-xl border border-gray-700/60 p-5">
                        <h3 class="text-lg font-bold text-white mb-3 flex items-center gap-2">
                            <span class="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm">${section.id}</span>
                            ${section.title}
                        </h3>
                        <div class="text-gray-300 space-y-2 text-sm leading-relaxed">
                            ${section.content}
                        </div>
                    </div>
                `;
    });

    container.innerHTML = html;
}

/** --- 9. PRINTING LOGIC --- */
const pastelPalettes = [
    { bg: '#e0f2fe', border: '#0284c7', text: '#0369a1' },
    { bg: '#dcfce7', border: '#16a34a', text: '#15803d' },
    { bg: '#f3e8ff', border: '#7c3aed', text: '#6d28d9' },
    { bg: '#fef9c3', border: '#ca8a04', text: '#a16207' },
    { bg: '#ffe4e6', border: '#e11d48', text: '#be123c' },
    { bg: '#ccfbf1', border: '#0d9488', text: '#0f766e' },
    { bg: '#ffedd5', border: '#ea580c', text: '#c2410c' },
    { bg: '#e0e7ff', border: '#4f46e5', text: '#4338ca' }
];

function getClassColor(className) {
    if (!className) return { bg: '#ffffff', border: '#000000', text: '#000000' };
    let hash = 0;
    for (let i = 0; i < className.length; i++) {
        hash = className.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % pastelPalettes.length;
    return pastelPalettes[index];
}

function renderStudentPrintBlock(student, nameFontSize) {
    if (!student) return `
                <div class="seat-block text-gray-400 italic" style="font-size: 12px; display: flex; align-items: center; justify-content: center; height: 100%; background: #ffffff;">
                    ${t('emptySeat')}
                </div>`;

    const useColor = appState.config.colorCards;
    let blockStyle = 'background: #ffffff;';
    let labelStyle = 'background: #f1f5f9; color: #1e293b;';
    let nameColor = '#000000';

    if (useColor) {
        const palette = getClassColor(student.className);
        blockStyle = `background-color: ${palette.bg} !important; border: 1.5px solid ${palette.border} !important; border-radius: 4px; margin: 2px;`;
        labelStyle = `background-color: ${palette.border} !important; color: white !important;`;
        nameColor = palette.text;
    }

    return `
                <div class="seat-block" style="padding: 6px; display: flex; flex-direction: column; height: 100%; width: 100%; box-sizing: border-box; text-align: center; justify-content: space-between; ${blockStyle} -webkit-print-color-adjust: exact; print-color-adjust: exact;">
                    <div style="font-size: 14px; font-weight: bold; color: #000; padding-bottom: 4px; border-bottom: 1px dashed #cbd5e1; flex-shrink: 0; width: 100%;">
                        ${student.serial || '-'}
                    </div>
                    <div style="font-size: ${nameFontSize}px; font-weight: bold; color: ${nameColor}; width: 100%; flex-grow: 1; display: flex; align-items: center; justify-content: center; line-height: 1.3; padding: 4px 0; word-wrap: break-word; overflow-wrap: break-word;">
                        ${student.name}
                    </div>
                    <div style="width: 100%; display: flex; flex-direction: column; gap: 4px; flex-shrink: 0;">
                        <div style="font-size: 11px; font-weight: bold; ${labelStyle} padding: 4px; border-radius: 4px; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
                            ${student.className} - ${student.hoba}
                        </div>
                        <div style="font-size: 10px; font-weight: bold; color: #475569;">
                            ${student.term || '-'}
                        </div>
                    </div>
                </div>
            `;
}

function getPrintHeaderAndFooter(title, sectorNum, studentsData) {
    const school = appState.config.schoolName || t('schoolLabel');
    const sem = appState.config.semester || t('semesterLabel');
    const manager = appState.config.managerName || '';

    const classCounts = {};
    let totalStudents = 0;

    studentsData.forEach(student => {
        if (student) {
            const nameTrimmed = student.name ? student.name.trim() : '';
            if (nameTrimmed === '' || nameTrimmed === 'فارغ' || nameTrimmed === 'ڤالا') {
                return;
            }

            const className = student.className || 'گشتی';
            classCounts[className] = (classCounts[className] || 0) + 1;
            totalStudents++;
        }
    });

    const sortedClasses = Object.keys(classCounts).sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ''));
        const numB = parseInt(b.replace(/\D/g, ''));
        return numA - numB;
    });

    let statsRows = '';
    if (sortedClasses.length === 0) {
        statsRows = `<span style="display: inline-block; color: #999; font-size: 9px;">${t('noStudents') || 'قوتابی نییە'}</span>`;
    } else {
        sortedClasses.forEach(className => {
            statsRows += `
                        <span style="display: inline-block; background: #f1f5f9; border: 1px solid #ddd; border-radius: 3px; padding: 0 5px; margin: 1px 2px; font-size: 9px; font-weight: bold; white-space: nowrap;">
                            ${className}: ${classCounts[className]}
                        </span>
                    `;
        });
    }

    statsRows += `
                <span style="display: inline-block; background: #e2e8f0; border: 1px solid #94a3b8; border-radius: 3px; padding: 0 5px; margin: 1px 2px; font-size: 9px; font-weight: bold; color: #1e293b; white-space: nowrap;">
                    ${t('statsTotal')}: ${totalStudents}
                </span>
            `;

    const header = `
                <div class="print-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #333; padding-bottom: 4px; margin-bottom: 4px; font-family: 'Noto Kufi Arabic', sans-serif;">
                    <div style="flex: 1; text-align: right; font-weight: bold; font-size: 24px; color: #000;">${school}</div>
                    <div style="flex: 1; text-align: center; font-weight: bold;">
                        <div style="font-size: 14px;">${sem}</div>
                        ${title ? `<div style="font-size: 11px; margin-top: 2px; color: #333;">${title}</div>` : ''}
                    </div>
                    <div style="flex: 1; text-align: left; font-weight: bold; font-size: 24px; color: #000;">${t('sector')} ${sectorNum}</div>
                </div>
            `;

    const footer = `
                <div class="print-footer" style="width: 100%; display: flex; flex-direction: row; justify-content: space-between; align-items: center; margin-top: auto; border-top: 1.5px solid #333; font-family: 'Noto Kufi Arabic', sans-serif; background: #fff; padding: 3px 2px 2px 2px; font-size: 10px;">
                    <div style="flex: 2; text-align: right; padding-right: 4px;">
                        <div style="font-weight: bold; font-size: 9px; color: #555; margin-bottom: 1px;">${t('statsReport')}:</div>
                        <div style="line-height: 1.5;">
                            ${statsRows}
                        </div>
                    </div>
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0 8px;">
                        <div style="font-size: 9px; font-weight: bold; color: #555; text-align: center;">${t('managerSign')}</div>
                        <div style="font-weight: bold; font-size: 12px; color: #000; text-align: center; margin-top: 1px;">${manager}</div>
                    </div>
                    <div style="flex: 0.5;"></div>
                </div>
            `;

    return { header, footer };
}

function generatePrintHTML(type) {
    const cols = appState.config.cols;
    const desks = appState.config.desks;
    const mode = appState.config.mode;

    const selectedSectorPrint = document.getElementById('print-sector-select').value;
    const nameFontSize = document.getElementById('print-font-size') ? document.getElementById('print-font-size').value : 12;

    let sectorsToPrint = [];
    if (selectedSectorPrint === 'all') {
        sectorsToPrint = appState.sectors.map((gridMap, i) => ({ gridMap, sIndex: i }));
    } else {
        const idx = parseInt(selectedSectorPrint);
        sectorsToPrint = [{ gridMap: appState.sectors[idx], sIndex: idx }];
    }

    let html = '';

    let emptyHeaders = '';
    let emptyCells = '';
    for (let i = 1; i <= 11; i++) {
        emptyHeaders += `<th style="width: 3.6%;"></th>`;
        emptyCells += `<td></td>`;
    }

    sectorsToPrint.forEach(item => {
        const { gridMap, sIndex } = item;
        const sectorNum = sIndex + 1;

        const allStudents = [];
        gridMap.forEach(column => {
            column.forEach(desk => {
                desk.students.forEach(student => {
                    if (student) allStudents.push(student);
                });
            });
        });

        const cardDetails = getPrintHeaderAndFooter('', sectorNum, allStudents);
        const listDetails = getPrintHeaderAndFooter(t('attendanceTitle'), sectorNum, allStudents);

        let cardHtml = '';
        let gridHTML = `<div class="hall-print-grid">`;

        gridMap.forEach((columnData, c) => {
            gridHTML += `<div class="print-column">`;
            columnData.forEach((deskData, d) => {
                gridHTML += `<div class="print-desk">`;
                gridHTML += `<div class="desk-body">`;

                if (mode === 'single') {
                    gridHTML += renderStudentPrintBlock(deskData.students[0], nameFontSize);
                } else if (mode === 'double') {
                    gridHTML += renderStudentPrintBlock(deskData.students[0], nameFontSize);
                    gridHTML += renderStudentPrintBlock(deskData.students[1], nameFontSize);
                }

                gridHTML += `</div></div>`;
            });
            gridHTML += `</div>`;
        });
        gridHTML += `</div>`;

        cardHtml = `
                    <div class="print-page print-page-cards">
                        ${cardDetails.header}
                        ${gridHTML}
                        ${cardDetails.footer}
                    </div>
                `;

        let listHtml = '';
        let rowsHTML = '';
        let index = 1;

        gridMap.forEach((columnData, c) => {
            columnData.forEach((deskData, d) => {
                deskData.students.forEach(student => {
                    if (student) {
                        rowsHTML += `
                                    <tr>
                                        <td style="width: 3%;">${index++}</td>
                                        <td style="width: 7%; font-weight: bold; font-size: 10px;">${student.serial || '-'}</td>
                                        <td style="width: 22%; font-weight: bold; text-align: right; padding-right: 6px; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${student.name}</td>
                                        <td style="width: 17%; font-size: 8px;">${student.className}</td>
                                        <td style="width: 5%; font-size: 9px;">${student.hoba}</td>
                                        <td style="width: 6%; color: #475569; font-size: 9px; font-weight: bold;">${c+1} / ${d+1}</td>
                                        ${emptyCells}
                                    </tr>
                                `;
                    }
                });
            });
        });

        listHtml = `
                    <div class="print-page print-page-list">
                        ${listDetails.header}
                        <div style="flex-grow: 1; width: 100%; margin-bottom: 10px;">
                            <table class="print-table">
                                <thead>
                                    <tr>
                                        <th style="width: 3%;">ز</th>
                                        <th style="width: 7%;">${appState.headers.serial}</th>
                                        <th style="width: 22%;">${appState.headers.name}</th>
                                        <th style="width: 17%; font-size: 8px;">${appState.headers.className}</th>
                                        <th style="width: 5%;">${appState.headers.hoba}</th>
                                        <th style="width: 6%; font-size: 8px;">جهـ</th>
                                        ${emptyHeaders}
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rowsHTML}
                                </tbody>
                            </table>
                        </div>
                        ${listDetails.footer}
                    </div>
                `;

        if (type === 'cards') {
            html += cardHtml;
        } else if (type === 'list') {
            html += listHtml;
        } else if (type === 'combined') {
            html += cardHtml;
            html += listHtml;
        }
    });

    return html;
}

function printDocument(type) {
    if (appState.sectors.length === 0) {
        showToast(t('toastNoData'), 'error');
        return;
    }

    const isAndroidApp = window.navigator.userAgent.toLowerCase().includes('wv') || (window.android && typeof window.android.print === 'function');
    if (isAndroidApp) {
        showToast(t('toastAndroidApp'), 'info');
    }

    const printArea = document.getElementById('print-area');
    printArea.innerHTML = generatePrintHTML(type);

    window.print();

    setTimeout(() => { printArea.innerHTML = ''; }, 1000);
}