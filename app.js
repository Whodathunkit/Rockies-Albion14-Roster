import { 
    initFirebase, 
    firebaseConfig, 
    setSyncBadge, 
    resolveFirebaseMediaUrl, 
    savePersistentData 
} from './firebase.js';

import { 
    players, 
    playerProfilesMap, 
    applyProfileDocToRoster, 
    renderRoster, 
    openPlayerModal, 
    closePlayerModal, 
    refreshActivePlayerModalUI,
    openFamilyPhotoLightbox, 
    closeFamilyPhotoLightbox, 
    openEditFamilyModal, 
    closeEditFamilyModal, 
    saveFamilyDetails, 
    processFamilyPhotoFile, 
    savePlayerVideoUrl,
    getAllRosterPlayers,
    getAvailablePlayers,
    isPlayerAvailable,
    togglePlayerAttendance,
    markAllAttendance,
    addGuestPlayer,
    removeGuestPlayer,
    activePlayerCard
} from './roster.js';

import { 
    matchState, 
    updateMatchState, 
    renderMatchTracker, 
    renderPastMatches, 
    renderStatsComparison, 
    renderShootout, 
    toggleMatchTimer, 
    startTimer, 
    pauseTimer, 
    resetTimer, 
    adjustStat, 
    setMatchPeriod, 
    resumeMatchFromFinal, 
    recordShootoutKick, 
    resetShootout, 
    setMatchMOTM,
    openGoalModal, 
    closeGoalModal, 
    confirmRockiesGoal, 
    openOpponentGoalModal, 
    closeOpponentGoalModal, 
    confirmOpponentGoal, 
    openDefensiveModal, 
    closeDefensiveModal, 
    confirmDefensiveStop, 
    deleteMatchEvent, 
    archiveMatchToHistory, 
    resetNewMatch, 
    openEditMatchModal, 
    closeEditMatchModal, 
    saveEditedMatch, 
    deletePastMatch, 
    deletePastMatchEvent, 
    openVideoClipModal, 
    closeVideoClipModal 
} from './tracker.js';

import { 
    scheduleEvents, 
    updateScheduleEvents, 
    currentScheduleFilter, 
    filterSchedule, 
    renderSchedule, 
    togglePastEventsSchedule,
    openAddEventModal, 
    closeAddEventModal, 
    saveNewScheduleEvent, 
    deleteScheduleEvent 
} from './schedule.js';

import { 
    leagueStandings, 
    updateLeagueStandings, 
    renderStandings, 
    openEditStandingsModal, 
    closeEditStandingsModal, 
    saveEditedStandings, 
    addStandingsTeam, 
    deleteStandingsTeam, 
    handleStandingsScreenshotUpload, 
    confirmApplyAiStandings, 
    renderLeaderboard 
} from './standings.js';

// --- Storage & Cookie Session Persistence Helpers ---
function getCookie(name) {
    try {
        const matches = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
        return matches ? decodeURIComponent(matches[1]) : null;
    } catch {
        return null;
    }
}

function setCookie(name, value, days = 30) {
    try {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
    } catch {}
}

function deleteCookie(name) {
    try {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    } catch {}
}

export function isPasscodeUnlocked() {
    try {
        if (localStorage.getItem('rfc14_pass_unlocked') === 'true') return true;
    } catch {}
    try {
        if (sessionStorage.getItem('rfc14_pass_unlocked') === 'true') return true;
    } catch {}
    try {
        if (getCookie('rfc14_pass_unlocked') === 'true') return true;
    } catch {}
    return false;
}

export function setPasscodeUnlocked(unlocked) {
    if (unlocked) {
        try { localStorage.setItem('rfc14_pass_unlocked', 'true'); } catch {}
        try { sessionStorage.setItem('rfc14_pass_unlocked', 'true'); } catch {}
        setCookie('rfc14_pass_unlocked', 'true', 30);
    } else {
        try { localStorage.removeItem('rfc14_pass_unlocked'); } catch {}
        try { sessionStorage.removeItem('rfc14_pass_unlocked'); } catch {}
        deleteCookie('rfc14_pass_unlocked');
    }
}

export function getSavedCoachMode() {
    try {
        if (localStorage.getItem('rfc14_coach_mode') === 'true') return true;
    } catch {}
    try {
        if (sessionStorage.getItem('rfc14_coach_mode') === 'true') return true;
    } catch {}
    try {
        if (getCookie('rfc14_coach_mode') === 'true') return true;
    } catch {}
    return false;
}

export function setSavedCoachMode(active) {
    if (active) {
        try { localStorage.setItem('rfc14_coach_mode', 'true'); } catch {}
        try { sessionStorage.setItem('rfc14_coach_mode', 'true'); } catch {}
        setCookie('rfc14_coach_mode', 'true', 7);
    } else {
        try { localStorage.removeItem('rfc14_coach_mode'); } catch {}
        try { sessionStorage.removeItem('rfc14_coach_mode'); } catch {}
        deleteCookie('rfc14_coach_mode');
    }
}

// Application State
export let isCoachMode = getSavedCoachMode();
export let currentTab = 'roster';
export let pendingCoachAction = null;

// Update full application UI
export function updateAllViews() {
    renderRoster(matchState, isCoachMode);
    renderMatchTracker(isCoachMode);
    renderStatsComparison();
    renderShootout();
    renderPastMatches(isCoachMode);
    renderSchedule(leagueStandings, isCoachMode);
    renderStandings(isCoachMode);
    renderLeaderboard(matchState);
    updateModeToggleButton();
}

// Tab Switching Logic
export function switchTab(tabName) {
    currentTab = tabName;
    ['roster', 'tracker', 'schedule', 'standings', 'leaderboard'].forEach(t => {
        const view = document.getElementById(`view-${t}`);
        const btn = document.getElementById(`tab-btn-${t}`);
        if (view) {
            if (t === tabName) {
                view.classList.remove('hidden');
            } else {
                view.classList.add('hidden');
            }
        }
        if (btn) {
            if (t === tabName) {
                btn.className = "tab-btn active px-3.5 py-1.5 rounded-xl border border-transparent transition whitespace-nowrap flex items-center space-x-1.5";
            } else {
                btn.className = "tab-btn px-3.5 py-1.5 rounded-xl border border-transparent text-gray-400 hover:text-white hover:bg-zinc-800 transition whitespace-nowrap flex items-center space-x-1.5";
            }
        }
    });

    // Refresh contents when tab opens
    if (tabName === 'standings') renderStandings(isCoachMode);
    if (tabName === 'leaderboard') renderLeaderboard(matchState);
    if (tabName === 'schedule') renderSchedule(leagueStandings, isCoachMode);
    if (tabName === 'roster') renderRoster(matchState, isCoachMode);
    if (tabName === 'tracker') {
        renderMatchTracker(isCoachMode);
        renderStatsComparison();
        renderShootout();
        renderPastMatches(isCoachMode);
    }
}

// Passcode Gate Logic
export function handleFamilyPassSubmit(event) {
    if (event) {
        if (typeof event.preventDefault === 'function') event.preventDefault();
        if (typeof event.stopPropagation === 'function') event.stopPropagation();
    }
    const input = document.getElementById('family-passcode-input');
    const errorEl = document.getElementById('family-pass-error');
    const gate = document.getElementById('family-pass-gate');

    const entered = (input?.value || '').trim().toLowerCase();
    // Valid passcodes: albion14, 1414, rockies14 (and friendly variations)
    const validCodes = ['albion14', '1414', 'rockies14'];

    if (validCodes.includes(entered)) {
        setPasscodeUnlocked(true);
        if (gate) {
            gate.classList.add('hidden');
            gate.style.display = 'none';
        }
        if (errorEl) errorEl.classList.add('hidden');
    } else {
        if (errorEl) errorEl.classList.remove('hidden');
        if (input) {
            input.value = '';
            input.focus();
        }
    }
    return false;
}

export function relockSite() {
    setPasscodeUnlocked(false);
    setSavedCoachMode(false);
    isCoachMode = false;
    const gate = document.getElementById('family-pass-gate');
    const input = document.getElementById('family-passcode-input');
    const errorEl = document.getElementById('family-pass-error');
    if (errorEl) errorEl.classList.add('hidden');
    if (gate) {
        gate.classList.remove('hidden');
        gate.style.display = 'flex';
    }
    if (input) {
        input.value = '';
        setTimeout(() => input.focus(), 100);
    }
    updateAllViews();
}

// Coach Mode Logic
export function updateModeToggleButton() {
    const icon = document.getElementById('mode-toggle-icon');
    const label = document.getElementById('mode-toggle-label');
    const btn = document.getElementById('btn-mode-toggle');
    const footerIndicator = document.getElementById('footer-mode-indicator');
    const footerCoachBtn = document.getElementById('btn-footer-coach-toggle');

    if (isCoachMode) {
        if (icon) icon.textContent = "⚡";
        if (label) label.textContent = "Coach Mode (Active)";
        if (btn) btn.className = "inline-flex items-center space-x-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-3 py-1.5 rounded-full text-[11px] font-bold text-amber-300 transition shadow backdrop-blur-sm active:scale-95";
        if (footerIndicator) {
            footerIndicator.textContent = "Mode: Coach Mode ⚡";
            footerIndicator.className = "px-3 py-1.5 rounded-full text-[11px] font-bold bg-amber-950/80 border border-amber-500/40 text-amber-300";
        }
        if (footerCoachBtn) {
            footerCoachBtn.innerHTML = `<span>🔒 Exit Coach Mode</span>`;
            footerCoachBtn.className = "inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-bold transition shadow-sm active:scale-95";
        }
    } else {
        if (icon) icon.textContent = "🔒";
        if (label) label.textContent = "Spectator Mode";
        if (btn) btn.className = "inline-flex items-center space-x-1.5 bg-black/60 hover:bg-black/80 border border-white/15 px-3 py-1.5 rounded-full text-[11px] font-bold text-gray-300 transition shadow backdrop-blur-sm active:scale-95";
        if (footerIndicator) {
            footerIndicator.textContent = "Mode: Spectator Mode 🔒";
            footerIndicator.className = "px-3 py-1.5 rounded-full text-[11px] font-bold bg-zinc-900 border border-zinc-700 text-zinc-400";
        }
        if (footerCoachBtn) {
            footerCoachBtn.innerHTML = `<span>⚡ Coach Mode</span>`;
            footerCoachBtn.className = "inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-zinc-700 hover:border-amber-500/40 text-xs font-bold transition shadow-sm active:scale-95";
        }
    }

    // Toggle coach action buttons and controls across views
    const trackerActions = document.getElementById('tracker-coach-actions');
    const periodControls = document.getElementById('match-period-controls');
    const timerControls = document.getElementById('match-timer-controls');
    const archiveControls = document.getElementById('match-archive-controls');
    const motmSelectContainer = document.getElementById('motm-select-container');
    const pkUsControls = document.getElementById('pk-coach-buttons-us');
    const pkThemControls = document.getElementById('pk-coach-buttons-them');
    const resetPkBtn = document.getElementById('btn-reset-shootout');
    const addEventBtn = document.getElementById('btn-add-event') || document.getElementById('btn-open-add-event');
    const editStandingsBtn = document.getElementById('btn-open-edit-standings');

    if (trackerActions) trackerActions.style.display = isCoachMode ? 'grid' : 'none';
    if (periodControls) periodControls.style.display = 'flex';
    if (timerControls) timerControls.style.display = isCoachMode ? 'flex' : 'none';
    if (archiveControls) archiveControls.style.display = isCoachMode ? 'flex' : 'none';
    if (motmSelectContainer) motmSelectContainer.style.display = isCoachMode ? 'flex' : 'none';
    if (pkUsControls) pkUsControls.style.display = isCoachMode ? 'block' : 'none';
    if (pkThemControls) pkThemControls.style.display = isCoachMode ? 'block' : 'none';
    if (resetPkBtn) resetPkBtn.style.display = isCoachMode ? 'inline-block' : 'none';
    if (addEventBtn) addEventBtn.style.display = isCoachMode ? 'inline-flex' : 'none';
    if (editStandingsBtn) editStandingsBtn.style.display = isCoachMode ? 'inline-flex' : 'none';

    const rosterModeBadge = document.getElementById('roster-mode-badge');
    if (rosterModeBadge) {
        if (isCoachMode) {
            rosterModeBadge.textContent = "⚡ Coach Controls Active";
            rosterModeBadge.className = "hidden sm:inline-flex items-center px-2.5 py-1 rounded-xl text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40";
        } else {
            rosterModeBadge.textContent = "🔒 Enter PIN 1414 to Edit";
            rosterModeBadge.className = "hidden sm:inline-flex items-center px-2.5 py-1 rounded-xl text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700";
        }
    }
}

export function toggleCoachMode() {
    if (isCoachMode) {
        isCoachMode = false;
        setSavedCoachMode(false);
        updateAllViews();
    } else {
        openCoachPinModal();
    }
}

export function openCoachPinModal(onSuccess) {
    if (typeof onSuccess === 'function') {
        pendingCoachAction = onSuccess;
    }
    const modal = document.getElementById('coach-pin-modal');
    const input = document.getElementById('coach-pin-input');
    const err = document.getElementById('coach-pin-error');
    if (modal) modal.classList.remove('hidden');
    if (err) err.classList.add('hidden');
    if (input) {
        input.value = '';
        setTimeout(() => input.focus(), 100);
    }
}

export function closeCoachPinModal() {
    const modal = document.getElementById('coach-pin-modal');
    if (modal) modal.classList.add('hidden');
}

export function submitCoachPin(event) {
    if (event) {
        if (typeof event.preventDefault === 'function') event.preventDefault();
        if (typeof event.stopPropagation === 'function') event.stopPropagation();
    }
    const input = document.getElementById('coach-pin-input');
    const err = document.getElementById('coach-pin-error');
    const pin = (input?.value || '').trim();

    if (pin === '1414') {
        isCoachMode = true;
        setSavedCoachMode(true);
        closeCoachPinModal();
        updateAllViews();
        if (typeof pendingCoachAction === 'function') {
            const act = pendingCoachAction;
            pendingCoachAction = null;
            act();
        } else if (pendingCoachAction === 'openPreGameRosterModal') {
            pendingCoachAction = null;
            setMatchPeriod('Pre-Game', leagueStandings, scheduleEvents);
            openPreGameRosterModal();
        }
    } else {
        if (err) err.classList.remove('hidden');
        if (input) {
            input.value = '';
            input.focus();
        }
    }
    return false;
}

// Cloud Config Modal Logic
export function openCloudConfigModal() {
    const modal = document.getElementById('cloud-config-modal');
    if (modal) modal.classList.remove('hidden');
}

export function closeCloudConfigModal() {
    const modal = document.getElementById('cloud-config-modal');
    if (modal) modal.classList.add('hidden');
}

export function applyCustomFirebaseConfig(event) {
    if (event) event.preventDefault();
    const jsonStr = document.getElementById('custom-firebase-json')?.value.trim();
    if (jsonStr) {
        try {
            const parsed = JSON.parse(jsonStr);
            localStorage.setItem('rfc14_custom_firebase', JSON.stringify(parsed));
            window.location.reload();
        } catch {
            alert("Invalid JSON format for Firebase configuration.");
        }
    }
}

export function toggleVideoMute() {
    const vid = document.getElementById('player-banner-video');
    const lbl = document.getElementById('label-unmute');
    if (vid) {
        vid.muted = !vid.muted;
        if (lbl) lbl.textContent = vid.muted ? "Unmute" : "Mute";
    }
}

// Guest Player Modal Handlers
export function openAddGuestModal() {
    const modal = document.getElementById('add-guest-modal');
    if (modal) modal.classList.remove('hidden');
    const jerseyInput = document.getElementById('guest-jersey-input');
    if (jerseyInput) {
        jerseyInput.value = '';
        setTimeout(() => jerseyInput.focus(), 100);
    }
}

export function closeAddGuestModal() {
    const modal = document.getElementById('add-guest-modal');
    if (modal) modal.classList.add('hidden');
}

export function submitAddGuestPlayer(e) {
    if (e) {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    const jerseyInput = document.getElementById('guest-jersey-input');
    const nameInput = document.getElementById('guest-name-input');
    const posInput = document.getElementById('guest-position-select');
    const notesInput = document.getElementById('guest-notes-input');

    const jersey = jerseyInput?.value?.trim();
    const name = nameInput?.value?.trim();
    const position = posInput?.value?.trim();
    const notes = notesInput?.value?.trim();

    const success = addGuestPlayer({ jersey, name, position, notes }, matchState, () => {
        savePersistentData(matchState, leagueStandings, scheduleEvents);
        updateAllViews();
        renderPreGameRosterModalList();
    });

    if (success) {
        if (jerseyInput) jerseyInput.value = '';
        if (nameInput) nameInput.value = '';
        if (notesInput) notesInput.value = '';
        closeAddGuestModal();
    }
    return false;
}

// Expose Global Helper Methods to window for HTML event bindings
window.switchTab = switchTab;
window.handleFamilyPassSubmit = handleFamilyPassSubmit;
window.relockSite = relockSite;
window.toggleCoachMode = toggleCoachMode;
window.openCoachPinModal = openCoachPinModal;
window.closeCoachPinModal = closeCoachPinModal;
window.submitCoachPin = submitCoachPin;
window.toggleVideoMute = toggleVideoMute;

// Roster & Attendance window bindings
window.openPlayerModal = (jersey) => openPlayerModal(jersey, matchState);
window.closePlayerModal = closePlayerModal;
window.openFamilyPhotoLightbox = openFamilyPhotoLightbox;
window.closeFamilyPhotoLightbox = closeFamilyPhotoLightbox;
window.openEditFamilyModal = openEditFamilyModal;
window.closeEditFamilyModal = closeEditFamilyModal;
window.saveFamilyDetails = (e) => saveFamilyDetails(e, matchState);
window.handleProfilePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) processFamilyPhotoFile(file, matchState);
};
window.savePlayerVideoUrl = () => savePlayerVideoUrl(matchState);

export function handlePreGameButtonClick() {
    if (!isCoachMode) {
        pendingCoachAction = 'openPreGameRosterModal';
        openCoachPinModal();
        return;
    }
    setMatchPeriod('Pre-Game', leagueStandings, scheduleEvents);
    openPreGameRosterModal();
}

export function handlePeriodSelect(period) {
    if (!isCoachMode) {
        pendingCoachAction = () => setMatchPeriod(period, leagueStandings, scheduleEvents);
        openCoachPinModal();
        return;
    }
    setMatchPeriod(period, leagueStandings, scheduleEvents);
}

export function manageAvailabilityAndCallUps() {
    if (!isCoachMode) {
        pendingCoachAction = 'openPreGameRosterModal';
        openCoachPinModal();
        return;
    }
    openPreGameRosterModal();
}

export function openPreGameRosterModal() {
    renderPreGameRosterModalList();
    const modal = document.getElementById('pre-game-roster-modal');
    if (modal) modal.classList.remove('hidden');
}

export function closePreGameRosterModal() {
    const modal = document.getElementById('pre-game-roster-modal');
    if (modal) modal.classList.add('hidden');
    updateAllViews();
}

export function renderPreGameRosterModalList() {
    const listEl = document.getElementById('pregame-player-list');
    const countAvailEl = document.getElementById('pregame-count-available');
    const countAbsentEl = document.getElementById('pregame-count-absent');
    const countGuestsEl = document.getElementById('pregame-count-guests');

    const allPlayers = getAllRosterPlayers(matchState);
    const availablePlayers = getAvailablePlayers(matchState);
    const availCount = availablePlayers.length;
    const absentCount = allPlayers.length - availCount;
    const guestCount = allPlayers.filter(p => p.isGuest).length;

    if (countAvailEl) countAvailEl.textContent = `${availCount} Available`;
    if (countAbsentEl) countAbsentEl.textContent = `${absentCount} Absent`;
    if (countGuestsEl) countGuestsEl.textContent = `${guestCount} Call-Up${guestCount === 1 ? '' : 's'}`;

    if (!listEl) return;

    if (allPlayers.length === 0) {
        listEl.innerHTML = `<p class="text-xs text-zinc-500 italic text-center py-6">No players registered on the roster.</p>`;
        return;
    }

    listEl.innerHTML = allPlayers.map(p => {
        const isAvail = isPlayerAvailable(p.jersey, matchState);
        return `
        <div class="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700/80 transition">
            <div class="flex items-center space-x-3 min-w-0">
                <div class="w-10 h-10 rounded-xl ${p.isGuest ? 'bg-amber-600/90 border border-amber-400/50' : 'bg-[#003C71] border border-blue-400/40'} text-white flex items-center justify-center font-black text-sm shadow-md flex-shrink-0">
                    #${p.jersey}
                </div>
                <div class="min-w-0">
                    <div class="flex items-center space-x-2">
                        <span class="font-extrabold text-xs sm:text-sm text-white truncate">#${p.jersey} ${p.name}</span>
                        ${p.isGuest 
                            ? `<span class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">⭐ Call-Up</span>` 
                            : `<span class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-zinc-800 text-zinc-400">Official</span>`}
                    </div>
                    <div class="flex items-center space-x-2 text-[10px] text-zinc-400 mt-0.5">
                        <span class="text-blue-300 font-semibold">${p.position}</span>
                        ${p.notes ? `<span>•</span><span class="truncate italic text-zinc-500">${p.notes}</span>` : ''}
                    </div>
                </div>
            </div>

            <div class="flex items-center space-x-2 flex-shrink-0">
                <button type="button" onclick="window.togglePreGamePlayerAttendance(${p.jersey})" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 active:scale-95 ${
                    isAvail 
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm' 
                        : 'bg-zinc-800 hover:bg-rose-950/70 border border-zinc-700 hover:border-rose-500/50 text-zinc-400 hover:text-rose-200'
                }">
                    <span>${isAvail ? '✓' : '✕'}</span>
                    <span>${isAvail ? 'Available' : 'Absent'}</span>
                </button>
                ${p.isGuest ? `
                    <button type="button" onclick="window.removeGuestPlayer(${p.jersey})" class="p-1.5 rounded-xl bg-zinc-800 hover:bg-rose-950 border border-zinc-700 hover:border-rose-500/50 text-zinc-400 hover:text-rose-300 text-xs font-bold transition" title="Remove Call-Up">
                        &times;
                    </button>
                ` : ''}
            </div>
        </div>
        `;
    }).join('');
}

export function togglePreGamePlayerAttendance(jersey) {
    if (!isCoachMode) {
        pendingCoachAction = () => togglePreGamePlayerAttendance(jersey);
        openCoachPinModal();
        return;
    }
    togglePlayerAttendance(jersey, matchState, () => {
        savePersistentData(matchState, leagueStandings, scheduleEvents);
        renderPreGameRosterModalList();
        updateAllViews();
    });
}

export function markAllPreGameAttendance(status) {
    if (!isCoachMode) {
        pendingCoachAction = () => markAllPreGameAttendance(status);
        openCoachPinModal();
        return;
    }
    markAllAttendance(status, matchState, () => {
        savePersistentData(matchState, leagueStandings, scheduleEvents);
        renderPreGameRosterModalList();
        updateAllViews();
    });
}

export function toggleCurrentModalPlayerAttendance() {
    if (!activePlayerCard) return;
    window.togglePlayerAttendance(activePlayerCard.jersey);
}

window.handlePreGameButtonClick = handlePreGameButtonClick;
window.handlePeriodSelect = handlePeriodSelect;
window.manageAvailabilityAndCallUps = manageAvailabilityAndCallUps;
window.openPreGameRosterModal = openPreGameRosterModal;
window.closePreGameRosterModal = closePreGameRosterModal;
window.renderPreGameRosterModalList = renderPreGameRosterModalList;
window.togglePreGamePlayerAttendance = togglePreGamePlayerAttendance;
window.markAllPreGameAttendance = markAllPreGameAttendance;
window.toggleCurrentModalPlayerAttendance = toggleCurrentModalPlayerAttendance;

window.togglePlayerAttendance = (jersey) => {
    if (!isCoachMode) {
        openCoachPinModal();
        return;
    }
    togglePlayerAttendance(jersey, matchState, () => {
        savePersistentData(matchState, leagueStandings, scheduleEvents);
        updateAllViews();
        renderPreGameRosterModalList();
        if (activePlayerCard && activePlayerCard.jersey === jersey) {
            refreshActivePlayerModalUI(jersey, matchState);
        }
    });
};

window.markAllAttendance = (status) => {
    if (!isCoachMode) {
        openCoachPinModal();
        return;
    }
    markAllAttendance(status, matchState, () => {
        savePersistentData(matchState, leagueStandings, scheduleEvents);
        updateAllViews();
        renderPreGameRosterModalList();
    });
};

window.openAddGuestModal = () => {
    if (!isCoachMode) {
        openCoachPinModal();
        return;
    }
    openAddGuestModal();
};

window.closeAddGuestModal = closeAddGuestModal;
window.submitAddGuestPlayer = submitAddGuestPlayer;

window.removeGuestPlayer = (jersey) => {
    if (!isCoachMode) {
        openCoachPinModal();
        return;
    }
    removeGuestPlayer(jersey, matchState, () => {
        savePersistentData(matchState, leagueStandings, scheduleEvents);
        updateAllViews();
        renderPreGameRosterModalList();
    });
};

// Match Tracker window bindings
window.toggleMatchTimer = () => toggleMatchTimer(leagueStandings, scheduleEvents);
window.startTimer = () => startTimer(leagueStandings, scheduleEvents);
window.pauseTimer = pauseTimer;
window.resetTimer = () => resetTimer(leagueStandings, scheduleEvents);
window.adjustStat = (key, amt) => adjustStat(key, amt, leagueStandings, scheduleEvents);
window.setMatchPeriod = (period) => setMatchPeriod(period, leagueStandings, scheduleEvents);
window.resumeMatchFromFinal = () => resumeMatchFromFinal(leagueStandings, scheduleEvents);
window.recordShootoutKick = (team, scored) => recordShootoutKick(team, scored, leagueStandings, scheduleEvents);
window.resetShootout = () => resetShootout(leagueStandings, scheduleEvents);
window.setMatchMOTM = (jersey) => setMatchMOTM(jersey, leagueStandings, scheduleEvents);

window.openGoalModal = openGoalModal;
window.closeGoalModal = closeGoalModal;
window.confirmRockiesGoal = (e) => confirmRockiesGoal(e, leagueStandings, scheduleEvents, updateAllViews);

window.openOpponentGoalModal = openOpponentGoalModal;
window.closeOpponentGoalModal = closeOpponentGoalModal;
window.confirmOpponentGoal = (e) => confirmOpponentGoal(e, leagueStandings, scheduleEvents, updateAllViews);

window.openDefensiveModal = openDefensiveModal;
window.closeDefensiveModal = closeDefensiveModal;
window.confirmDefensiveStop = (e) => confirmDefensiveStop(e, leagueStandings, scheduleEvents, updateAllViews);

window.deleteMatchEvent = (id) => deleteMatchEvent(id, leagueStandings, scheduleEvents, updateAllViews);
window.archiveMatchToHistory = () => archiveMatchToHistory(leagueStandings, scheduleEvents, updateAllViews);
window.resetNewMatch = () => resetNewMatch(leagueStandings, scheduleEvents, updateAllViews);

window.openEditMatchModal = openEditMatchModal;
window.closeEditMatchModal = closeEditMatchModal;
window.saveEditedMatch = (e) => saveEditedMatch(e, leagueStandings, scheduleEvents, updateAllViews);
window.deletePastMatch = () => deletePastMatch(leagueStandings, scheduleEvents, updateAllViews);
window.deletePastMatchEvent = (id) => deletePastMatchEvent(id, leagueStandings, scheduleEvents, updateAllViews);

window.openVideoClipModal = openVideoClipModal;
window.closeVideoClipModal = closeVideoClipModal;

// Schedule window bindings
window.filterSchedule = (type) => filterSchedule(type, leagueStandings, isCoachMode);
window.togglePastEventsSchedule = () => togglePastEventsSchedule(leagueStandings, isCoachMode);
window.startMatchFromSchedule = (opp) => {
    matchState.opponentName = opp || 'Opponent';
    const oppNameDisplay = document.getElementById('opponent-name-display');
    if (oppNameDisplay) oppNameDisplay.textContent = matchState.opponentName;
    switchTab('tracker');
};
window.openAddEventModal = openAddEventModal;
window.closeAddEventModal = closeAddEventModal;
window.saveNewScheduleEvent = () => saveNewScheduleEvent();
window.deleteScheduleEvent = (id) => deleteScheduleEvent(id);

// Standings window bindings
window.openEditStandingsModal = openEditStandingsModal;
window.closeEditStandingsModal = closeEditStandingsModal;
window.saveEditedStandings = () => saveEditedStandings(matchState, scheduleEvents, updateAllViews);
window.addStandingsTeam = addStandingsTeam;
window.deleteStandingsTeam = deleteStandingsTeam;
window.handleStandingsScreenshotUpload = handleStandingsScreenshotUpload;
window.confirmApplyAiStandings = () => confirmApplyAiStandings(matchState, scheduleEvents, updateAllViews);

// Cloud window bindings
window.openCloudConfigModal = openCloudConfigModal;
window.closeCloudConfigModal = closeCloudConfigModal;
window.applyCustomFirebaseConfig = applyCustomFirebaseConfig;
window.updateAllViews = updateAllViews;

function setupDomEventListeners() {
    // Programmatic event listener bindings to guarantee form handling
    const passForm = document.getElementById('family-pass-form');
    if (passForm) {
        passForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleFamilyPassSubmit(e);
        });
    }

    const passBtn = document.getElementById('btn-family-pass-submit');
    if (passBtn) {
        passBtn.addEventListener('click', (e) => {
            const form = document.getElementById('family-pass-form');
            if (form) {
                e.preventDefault();
                handleFamilyPassSubmit(e);
            }
        });
    }

    const coachPinForm = document.getElementById('coach-pin-form');
    if (coachPinForm) {
        coachPinForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitCoachPin(e);
        });
    }

    const modeBtn = document.getElementById('btn-mode-toggle');
    if (modeBtn) {
        modeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleCoachMode();
        });
    }

    const relockBtn = document.getElementById('btn-footer-relock');
    if (relockBtn) {
        relockBtn.addEventListener('click', (e) => {
            e.preventDefault();
            relockSite();
        });
    }

    const footerCoachBtn = document.getElementById('btn-footer-coach-toggle');
    if (footerCoachBtn) {
        footerCoachBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleCoachMode();
        });
    }
}

export function syncGateVisibility() {
    const unlocked = isPasscodeUnlocked();
    const gate = document.getElementById('family-pass-gate');
    if (gate) {
        if (unlocked) {
            gate.classList.add('hidden');
            gate.style.display = 'none';
        } else {
            gate.classList.remove('hidden');
            gate.style.display = 'flex';
        }
    }
}

// Initialize on DOM Ready
function onAppInit() {
    // Check if passcode is already unlocked via localStorage, cookie, or sessionStorage
    syncGateVisibility();

    // Setup direct event listeners
    setupDomEventListeners();

    // Initialize Firebase Realtime Sync
    initFirebase({
        onMatchCenterDoc: (data) => {
            if (data) {
                updateMatchState(data);
                updateAllViews();
            }
        },
        onTeamPortalDoc: (data) => {
            if (data?.standingsJson) {
                try {
                    const parsed = JSON.parse(data.standingsJson);
                    if (Array.isArray(parsed)) {
                        updateLeagueStandings(parsed);
                        renderStandings(isCoachMode);
                    }
                } catch {}
            }
            if (data?.scheduleJson) {
                try {
                    const parsed = JSON.parse(data.scheduleJson);
                    if (Array.isArray(parsed)) {
                        updateScheduleEvents(parsed);
                        renderSchedule(leagueStandings, isCoachMode);
                    }
                } catch {}
            }
        },
        onPlayerProfilesDocs: (profiles) => {
            profiles.forEach(p => {
                applyProfileDocToRoster(p.id, p);
            });
            renderRoster(matchState, isCoachMode);
            renderLeaderboard(matchState);
        }
    });

    // Initial render of all views
    updateAllViews();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onAppInit);
} else {
    onAppInit();
}

