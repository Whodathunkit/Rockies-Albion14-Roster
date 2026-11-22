import {
    CURRENT_TEAM_ID,
    DEFAULT_TEAM_ID,
    applyTeamThemeVariables,
    getActiveTeamConfig,
    getTeamStorageKey,
    setTeamStorageItem,
    getAvailableTeams,
    switchActiveTeam
} from './tenant.js';

// Hydrate root club/team brand CSS custom properties before any component renders
applyTeamThemeVariables(getActiveTeamConfig());

import { 
    initFirebase, 
    teardownRealtimeSync,
    saveCloudUserUnlock,
    hasUnlockCookie,
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
    openAddPlayerModal,
    closeAddPlayerModal,
    submitAddPlayer,
    openImportCsvModal,
    closeImportCsvModal,
    handleCsvFileSelect,
    updateCsvImportPreview,
    submitCsvRosterImport,
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
    adjustEditMatchStat,
    openAddPastMatchEvent,
    toggleEditLiveOpponent,
    saveLiveOpponentName,
    playEventVideo,
    openEventDetailModal,
    closeEventDetailModal,
    refreshEventDetailModalMode,
    saveEventDetail,
    deleteEventFromDetailModal,
    openMatchReviewModal,
    closeMatchReviewModal,
    refreshOpenMatchReview,
    adjustReviewStat,
    copyMatchReviewSummary,
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
    openEditEventModal,
    closeAddEventModal, 
    saveNewScheduleEvent, 
    deleteScheduleEvent,
    handleEventTypeChange,
    handleDatepickerChange
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
    handlePasteStandingsText,
    syncOfficialCmsaStandings,
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

const PASS_UNLOCKED_KEY = getTeamStorageKey('pass_unlocked');
const COACH_MODE_KEY = getTeamStorageKey('coach_mode');
const LEGACY_PASS_UNLOCKED_KEY = 'rfc14_pass_unlocked';
const LEGACY_COACH_MODE_KEY = 'rfc14_coach_mode';

function isLegacyAuthFallbackAllowed() {
    return CURRENT_TEAM_ID === DEFAULT_TEAM_ID;
}

export function isPasscodeUnlocked() {
    try {
        if (localStorage.getItem(PASS_UNLOCKED_KEY) === 'true') return true;
    } catch {}
    try {
        if (sessionStorage.getItem(PASS_UNLOCKED_KEY) === 'true') return true;
    } catch {}
    try {
        if (getCookie(PASS_UNLOCKED_KEY) === 'true') return true;
    } catch {}
    if (hasUnlockCookie()) return true;

    // One-way legacy migration strictly for default albion14 squad
    if (isLegacyAuthFallbackAllowed()) {
        let legacyUnlocked = false;
        try { if (localStorage.getItem(LEGACY_PASS_UNLOCKED_KEY) === 'true') legacyUnlocked = true; } catch {}
        try { if (!legacyUnlocked && sessionStorage.getItem(LEGACY_PASS_UNLOCKED_KEY) === 'true') legacyUnlocked = true; } catch {}
        try { if (!legacyUnlocked && getCookie(LEGACY_PASS_UNLOCKED_KEY) === 'true') legacyUnlocked = true; } catch {}
        if (legacyUnlocked) {
            setPasscodeUnlocked(true);
            return true;
        }
    }
    return false;
}

export function setPasscodeUnlocked(unlocked) {
    if (unlocked) {
        try { localStorage.setItem(PASS_UNLOCKED_KEY, 'true'); } catch {}
        try { sessionStorage.setItem(PASS_UNLOCKED_KEY, 'true'); } catch {}
        setCookie(PASS_UNLOCKED_KEY, 'true', 30);
    } else {
        try { localStorage.removeItem(PASS_UNLOCKED_KEY); } catch {}
        try { sessionStorage.removeItem(PASS_UNLOCKED_KEY); } catch {}
        deleteCookie(PASS_UNLOCKED_KEY);
        if (isLegacyAuthFallbackAllowed()) {
            try { localStorage.removeItem(LEGACY_PASS_UNLOCKED_KEY); } catch {}
            try { sessionStorage.removeItem(LEGACY_PASS_UNLOCKED_KEY); } catch {}
            deleteCookie(LEGACY_PASS_UNLOCKED_KEY);
        }
    }
}

export function getSavedCoachMode() {
    try {
        if (localStorage.getItem(COACH_MODE_KEY) === 'true') return true;
    } catch {}
    try {
        if (sessionStorage.getItem(COACH_MODE_KEY) === 'true') return true;
    } catch {}
    try {
        if (getCookie(COACH_MODE_KEY) === 'true') return true;
    } catch {}

    // One-way legacy migration strictly for default albion14 squad
    if (isLegacyAuthFallbackAllowed()) {
        let legacyCoach = false;
        try { if (localStorage.getItem(LEGACY_COACH_MODE_KEY) === 'true') legacyCoach = true; } catch {}
        try { if (!legacyCoach && sessionStorage.getItem(LEGACY_COACH_MODE_KEY) === 'true') legacyCoach = true; } catch {}
        try { if (!legacyCoach && getCookie(LEGACY_COACH_MODE_KEY) === 'true') legacyCoach = true; } catch {}
        if (legacyCoach) {
            setSavedCoachMode(true);
            return true;
        }
    }
    return false;
}

export function setSavedCoachMode(active) {
    if (active) {
        try { localStorage.setItem(COACH_MODE_KEY, 'true'); } catch {}
        try { sessionStorage.setItem(COACH_MODE_KEY, 'true'); } catch {}
        setCookie(COACH_MODE_KEY, 'true', 7);
    } else {
        try { localStorage.removeItem(COACH_MODE_KEY); } catch {}
        try { sessionStorage.removeItem(COACH_MODE_KEY); } catch {}
        deleteCookie(COACH_MODE_KEY);
        if (isLegacyAuthFallbackAllowed()) {
            try { localStorage.removeItem(LEGACY_COACH_MODE_KEY); } catch {}
            try { sessionStorage.removeItem(LEGACY_COACH_MODE_KEY); } catch {}
            deleteCookie(LEGACY_COACH_MODE_KEY);
        }
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
    refreshOpenMatchReview(isCoachMode);
    refreshEventDetailModalMode(isCoachMode);
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

// Passcode Gate Logic (Scoped to active team configuration)
export function handleFamilyPassSubmit(event) {
    if (event) {
        if (typeof event.preventDefault === 'function') event.preventDefault();
        if (typeof event.stopPropagation === 'function') event.stopPropagation();
    }
    const input = document.getElementById('family-passcode-input');
    const errorEl = document.getElementById('family-pass-error');
    const gate = document.getElementById('family-pass-gate');

    const entered = (input?.value || '').trim().toLowerCase();
    const config = getActiveTeamConfig();
    const configuredCodes = Array.isArray(config.auth?.familyPasscodes) && config.auth.familyPasscodes.length > 0
        ? config.auth.familyPasscodes
        : [CURRENT_TEAM_ID];
    const validCodes = configuredCodes
        .map(code => String(code || '').trim().toLowerCase())
        .filter(Boolean);

    if (entered && validCodes.includes(entered)) {
        setPasscodeUnlocked(true);
        saveCloudUserUnlock(true);
        if (gate) {
            gate.classList.add('hidden');
            gate.style.display = '';
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
    saveCloudUserUnlock(false);
    setSavedCoachMode(false);
    isCoachMode = false;
    const gate = document.getElementById('family-pass-gate');
    const input = document.getElementById('family-passcode-input');
    const errorEl = document.getElementById('family-pass-error');
    if (errorEl) errorEl.classList.add('hidden');
    if (gate) {
        gate.classList.remove('hidden');
        gate.style.display = '';
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
        if (btn) btn.className = "inline-flex items-center space-x-1.5 coach-mode-active border px-3 py-1.5 rounded-full text-[11px] font-bold transition shadow backdrop-blur-sm active:scale-95";
        if (footerIndicator) {
            footerIndicator.textContent = "Mode: Coach Mode ⚡";
            footerIndicator.className = "px-3 py-1.5 rounded-full text-[11px] font-bold badge-accent-gold border";
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
            footerCoachBtn.className = "inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-[var(--accent-gold)] border border-zinc-700 hover:border-[var(--accent-gold)] text-xs font-bold transition shadow-sm active:scale-95";
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
    const rosterCoachActions = document.getElementById('roster-coach-actions');

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
    if (rosterCoachActions) {
        rosterCoachActions.classList.toggle('hidden', !isCoachMode);
        rosterCoachActions.classList.toggle('flex', isCoachMode);
    }

    const editLiveOppBtn = document.getElementById('btn-edit-live-opponent');
    const editLiveOppBox = document.getElementById('edit-live-opponent-box');
    if (editLiveOppBtn) editLiveOppBtn.classList.toggle('hidden', !isCoachMode);
    if (!isCoachMode && editLiveOppBox) editLiveOppBox.classList.add('hidden');
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
    const expectedPin = String(getActiveTeamConfig().auth?.coachPin || '1414').trim();

    if (pin && pin === expectedPin) {
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
            setTeamStorageItem('custom_firebase', parsed);
            teardownRealtimeSync();
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

window.openAddPlayerModal = () => {
    if (!isCoachMode) {
        openCoachPinModal(() => openAddPlayerModal());
        return;
    }
    openAddPlayerModal();
};
window.closeAddPlayerModal = closeAddPlayerModal;
window.submitAddPlayer = (e) => submitAddPlayer(e, matchState, () => {
    updateAllViews();
    renderPreGameRosterModalList();
});

window.openImportCsvModal = () => {
    if (!isCoachMode) {
        openCoachPinModal(() => openImportCsvModal());
        return;
    }
    openImportCsvModal();
};
window.closeImportCsvModal = closeImportCsvModal;
window.handleCsvFileSelect = handleCsvFileSelect;
window.updateCsvImportPreview = updateCsvImportPreview;
window.submitCsvRosterImport = (e) => submitCsvRosterImport(e, matchState, () => {
    updateAllViews();
    renderPreGameRosterModalList();
});

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
                <div class="w-10 h-10 rounded-xl ${p.isGuest ? 'bg-amber-600/90 border border-amber-400/50' : 'bg-[var(--brand-primary)] border border-blue-400/40'} text-white flex items-center justify-center font-black text-sm shadow-md flex-shrink-0">
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
window.adjustStat = (key, amt) => {
    if (!isCoachMode) {
        openCoachPinModal(() => {
            adjustStat(key, amt, leagueStandings, scheduleEvents);
            refreshOpenMatchReview(isCoachMode);
        });
        return;
    }
    adjustStat(key, amt, leagueStandings, scheduleEvents);
    refreshOpenMatchReview(isCoachMode);
};
window.setMatchPeriod = (period) => setMatchPeriod(period, leagueStandings, scheduleEvents);
window.resumeMatchFromFinal = () => resumeMatchFromFinal(leagueStandings, scheduleEvents);
window.recordShootoutKick = (team, scored) => recordShootoutKick(team, scored, leagueStandings, scheduleEvents);
window.resetShootout = () => resetShootout(leagueStandings, scheduleEvents);
window.setMatchMOTM = (jersey) => {
    setMatchMOTM(jersey, leagueStandings, scheduleEvents);
    refreshOpenMatchReview(isCoachMode);
};

window.toggleEditLiveOpponent = () => {
    if (!isCoachMode) {
        openCoachPinModal(() => toggleEditLiveOpponent());
        return;
    }
    toggleEditLiveOpponent();
};
window.saveLiveOpponentName = () => saveLiveOpponentName(leagueStandings, scheduleEvents, updateAllViews);
window.playEventVideo = playEventVideo;

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
window.adjustEditMatchStat = adjustEditMatchStat;
window.openAddPastMatchEvent = (eventType) => {
    if (!isCoachMode) {
        openCoachPinModal(() => openAddPastMatchEvent(eventType, true));
        return;
    }
    openAddPastMatchEvent(eventType, isCoachMode);
};

// Event Details & Edit Modal window bindings
window.openEventDetailModal = (matchId, eventId, newEventType = null) => {
    if (newEventType && !isCoachMode) {
        openCoachPinModal(() => openEventDetailModal(matchId, eventId, true, newEventType));
        return;
    }
    openEventDetailModal(matchId, eventId, isCoachMode, newEventType);
};
window.closeEventDetailModal = closeEventDetailModal;
window.unlockCoachToEditEvent = () => openCoachPinModal(() => {
    refreshEventDetailModalMode(true);
    refreshOpenMatchReview(true);
});
window.saveEventDetail = (e) => saveEventDetail(e, leagueStandings, scheduleEvents, updateAllViews);
window.deleteEventFromDetailModal = () => deleteEventFromDetailModal(leagueStandings, scheduleEvents, updateAllViews);

// Full Match Review Modal window bindings
window.openMatchReviewModal = (matchId) => openMatchReviewModal(matchId, isCoachMode);
window.closeMatchReviewModal = closeMatchReviewModal;
window.adjustReviewStat = (matchId, key, amt) => {
    if (!isCoachMode) {
        openCoachPinModal(() => adjustReviewStat(matchId, key, amt, leagueStandings, scheduleEvents, updateAllViews));
        return;
    }
    adjustReviewStat(matchId, key, amt, leagueStandings, scheduleEvents, updateAllViews);
};
window.copyMatchReviewSummary = copyMatchReviewSummary;

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
window.openEditEventModal = openEditEventModal;
window.closeAddEventModal = closeAddEventModal;
window.handleEventTypeChange = handleEventTypeChange;
window.handleDatepickerChange = handleDatepickerChange;
window.saveNewScheduleEvent = (e) => saveNewScheduleEvent(e, matchState, leagueStandings, updateAllViews);
window.deleteScheduleEvent = (id) => deleteScheduleEvent(id, matchState, leagueStandings, updateAllViews);

// Standings window bindings
window.openEditStandingsModal = openEditStandingsModal;
window.closeEditStandingsModal = closeEditStandingsModal;
window.saveEditedStandings = () => saveEditedStandings(matchState, scheduleEvents, updateAllViews);
window.addStandingsTeam = addStandingsTeam;
window.deleteStandingsTeam = deleteStandingsTeam;
window.handleStandingsScreenshotUpload = handleStandingsScreenshotUpload;
window.handlePasteStandingsText = handlePasteStandingsText;
window.syncOfficialCmsaStandings = syncOfficialCmsaStandings;
window.confirmApplyAiStandings = () => confirmApplyAiStandings(matchState, scheduleEvents, updateAllViews);

// Cloud window bindings
window.openCloudConfigModal = openCloudConfigModal;
window.closeCloudConfigModal = closeCloudConfigModal;
window.applyCustomFirebaseConfig = applyCustomFirebaseConfig;
window.updateAllViews = updateAllViews;

// ============================================================================
// Dynamic App Shell Hydration & Team Switcher
// ============================================================================

const WHATSAPP_ICON_SVG = `<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M8.53 7.33C8.37 7.33 8.1 7.39 7.87 7.64C7.65 7.89 7.02 8.48 7.02 9.68C7.02 10.88 7.89 12.04 8.01 12.2C8.13 12.37 9.72 14.82 12.16 15.88C14.19 16.76 14.6 16.58 15.05 16.54C15.49 16.5 16.49 15.95 16.7 15.36C16.9 14.77 16.9 14.26 16.84 14.16C16.78 14.05 16.62 13.99 16.38 13.87C16.14 13.75 14.95 13.16 14.73 13.08C14.51 13 14.35 12.96 14.19 13.2C14.02 13.45 13.56 14.05 13.41 14.21C13.27 14.37 13.13 14.39 12.89 14.27C12.65 14.15 11.87 13.9 10.95 13.08C10.23 12.44 9.75 11.65 9.61 11.41C9.47 11.17 9.59 11.04 9.71 10.92C9.82 10.81 9.96 10.63 10.08 10.49C10.2 10.35 10.24 10.25 10.32 10.09C10.4 9.93 10.36 9.79 10.3 9.68C10.24 9.56 9.77 8.39 9.57 7.91C9.37 7.43 9.17 7.5 9.02 7.49C8.88 7.49 8.71 7.33 8.53 7.33Z"/></svg>`;

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function setTextById(id, text) {
    const el = document.getElementById(id);
    if (el && text !== undefined && text !== null) {
        el.textContent = text;
    }
}

function hydrateCrestImage(id, config) {
    const img = document.getElementById(id);
    if (!img) return;
    const crestUrl = config.branding?.crestUrl || '';
    const fallbackUrl = config.branding?.crestFallbackUrl || 'https://placehold.co/80x80/003C71/ffffff?text=FC';
    img.alt = `${config.name} Crest`;
    img.onerror = () => {
        img.onerror = null;
        img.src = fallbackUrl;
    };
    img.src = crestUrl || fallbackUrl;
}

export function renderOfficialsCards(config = getActiveTeamConfig()) {
    const grid = document.getElementById('officials-cards-grid');
    if (!grid) return;

    const officials = Array.isArray(config.officials) ? config.officials : [];
    const whatsappUrl = (config.links?.whatsappUrl || '').trim();

    if (officials.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 text-center text-xs text-zinc-400">
                Team coaching and management contacts will appear here once configured.
            </div>
        `;
        return;
    }

    grid.innerHTML = officials.map((official) => {
        const isAmber = official.badgeVariant === 'amber';
        const badgeClass = isAmber
            ? 'bg-amber-950/80 border border-amber-500/50 text-amber-300'
            : 'bg-blue-900/60 border border-blue-500/40 text-blue-300';
        const email = (official.email || '').trim();
        const showWhatsapp = Boolean(official.showWhatsapp && whatsappUrl);
        const hasActions = showWhatsapp || Boolean(email);

        return `
            <div class="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5 flex items-center justify-between gap-2">
                <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                        <h4 class="text-sm sm:text-base font-extrabold text-white truncate">${escapeHtml(official.name)}</h4>
                        ${official.role ? `<span class="${badgeClass} text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider whitespace-nowrap">${escapeHtml(official.role)}</span>` : ''}
                    </div>
                    ${official.subtitle ? `<p class="text-xs text-zinc-400 mt-0.5">${escapeHtml(official.subtitle)}</p>` : ''}
                </div>
                ${hasActions ? `
                    <div class="flex items-center space-x-1.5 shrink-0">
                        ${showWhatsapp ? `
                            <a href="${escapeHtml(whatsappUrl)}" target="_blank" rel="noopener noreferrer" title="Join ${escapeHtml(config.name)} WhatsApp Chat" class="w-8 h-8 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-[#25D366] flex items-center justify-center transition shadow-sm">
                                ${WHATSAPP_ICON_SVG}
                            </a>
                        ` : ''}
                        ${email ? `
                            <a href="mailto:${escapeHtml(email)}" title="Email ${escapeHtml(official.name)}" class="w-8 h-8 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-500/40 text-blue-200 flex items-center justify-center transition shadow-sm">
                                <span class="text-xs">✉️</span>
                            </a>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function hydrateSocialLinks(config) {
    const whatsappUrl = (config.links?.whatsappUrl || '').trim();
    const instagramUrl = (config.links?.instagramUrl || '').trim();
    const instagramHandle = (config.links?.instagramHandle || '').trim() || 'Instagram';

    // Banner Instagram pill
    const bannerIgLink = document.getElementById('banner-instagram-link');
    const bannerIgHandle = document.getElementById('banner-instagram-handle');
    if (bannerIgLink) {
        if (instagramUrl) {
            bannerIgLink.href = instagramUrl;
            bannerIgLink.title = `Follow ${instagramHandle} on Instagram`;
            if (bannerIgHandle) bannerIgHandle.textContent = instagramHandle;
            bannerIgLink.classList.remove('hidden');
        } else {
            bannerIgLink.classList.add('hidden');
        }
    }

    // Footer social links
    const footerWa = document.getElementById('footer-whatsapp-link');
    if (footerWa) {
        if (whatsappUrl) {
            footerWa.href = whatsappUrl;
            footerWa.title = `Open ${config.name} WhatsApp Group Chat`;
            footerWa.classList.remove('hidden');
        } else {
            footerWa.classList.add('hidden');
        }
    }

    const footerIg = document.getElementById('footer-instagram-link');
    if (footerIg) {
        if (instagramUrl) {
            footerIg.href = instagramUrl;
            footerIg.title = `Follow ${config.name} on Instagram`;
            footerIg.classList.remove('hidden');
        } else {
            footerIg.classList.add('hidden');
        }
    }

    // Floating social buttons & wrapper aside
    const floatingAside = document.getElementById('floating-social-aside');
    const floatingIg = document.getElementById('floating-instagram-btn');
    const floatingWa = document.getElementById('floating-whatsapp-btn');

    if (floatingIg) {
        if (instagramUrl) {
            floatingIg.href = instagramUrl;
            floatingIg.title = `Follow ${config.name} on Instagram`;
            floatingIg.classList.remove('hidden');
        } else {
            floatingIg.classList.add('hidden');
        }
    }

    if (floatingWa) {
        if (whatsappUrl) {
            floatingWa.href = whatsappUrl;
            floatingWa.title = `Open ${config.name} WhatsApp Group Chat`;
            floatingWa.classList.remove('hidden');
        } else {
            floatingWa.classList.add('hidden');
        }
    }

    if (floatingAside) {
        floatingAside.classList.toggle('hidden', !instagramUrl && !whatsappUrl);
    }
}

export function hydrateAppShell(config = getActiveTeamConfig()) {
    // Document title & OpenGraph metadata
    const pageTitle = `${config.name} | Team Portal & Match Center`;
    const pageDesc = `${config.fullName} (${config.division}) team portal, live match tracker, schedule, standings, and leaderboard.`;
    document.title = pageTitle;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', pageDesc);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', pageTitle);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', pageDesc);

    // Crests across gate, header, scoreboard, and footer
    ['gate-crest-img', 'header-crest-img', 'scoreboard-crest-img', 'footer-crest-img'].forEach((id) => {
        hydrateCrestImage(id, config);
    });

    // Passcode Gate & Header copy
    setTextById('gate-team-name', config.name);
    setTextById('gate-team-subtitle', `${config.division} • ${config.season}`);
    setTextById('header-team-name', config.name);
    setTextById('header-division-text', config.division);

    // Roster Officials & Squad Photo Banner
    setTextById('officials-club-name', config.clubName);
    renderOfficialsCards(config);

    setTextById('banner-season-text', config.season);
    setTextById('banner-squad-title', config.squadTitle);
    setTextById('banner-division-badge', config.division);

    const bannerWrapper = document.getElementById('squad-banner-photo-wrapper');
    const bannerImg = document.getElementById('squad-banner-img');
    const bannerUrl = (config.branding?.bannerPhotoUrl || '').trim();
    if (bannerWrapper && bannerImg) {
        if (bannerUrl) {
            bannerImg.alt = `${config.squadTitle} ${config.season}`;
            bannerImg.onerror = () => {
                bannerImg.onerror = null;
                bannerImg.src = config.branding?.bannerFallbackUrl || '';
            };
            bannerImg.src = bannerUrl;
            bannerWrapper.classList.remove('hidden');
        } else {
            bannerWrapper.classList.add('hidden');
        }
    }

    // Live Tracker & Modals labels
    const leagueLabel = (config.leagueName || 'LEAGUE').toUpperCase();
    setTextById('match-header-status-text', `${leagueLabel} LEAGUE MATCH`);
    setTextById('scoreboard-team-name', config.name);
    setTextById('btn-log-goal-label', `Log ${config.shortName} Goal`);
    setTextById('shootout-team-name', config.name);
    setTextById('stats-team-short-name', config.shortName);
    setTextById('goal-modal-title', `Log ${config.shortName} Goal`);
    setTextById('edit-match-our-goals-label', `${config.shortName} Goals`);
    setTextById('edit-match-our-short-name', config.shortName);
    setTextById('ev-detail-type-badge', `⚽ ${config.shortName} Goal`);

    // Schedule Arrival Rules & Uniform Guide
    const arrivalEl = document.getElementById('schedule-arrival-summary');
    if (arrivalEl && config.arrivalRules) {
        const gameMins = escapeHtml(config.arrivalRules.gameMinutes ?? 30);
        const trainMins = escapeHtml(config.arrivalRules.trainingMinutes ?? 15);
        const ballSize = escapeHtml(config.arrivalRules.ballSize || 'Size 5');
        arrivalEl.innerHTML = `Arrive <strong class="text-amber-400">${gameMins} mins early for matches</strong> and <strong class="text-blue-400">${trainMins} mins early for practice/PDP</strong>. Bring your <strong class="text-emerald-400">${ballSize} ball</strong>.`;
    }

    const uniformGuideEl = document.getElementById('schedule-uniform-guide-list');
    if (uniformGuideEl) {
        const summaryItems = Array.isArray(config.kitRules?.bannerSummary) ? config.kitRules.bannerSummary : [];
        uniformGuideEl.innerHTML = summaryItems.map((item) => `
            <span class="bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-700/80">
                <strong class="text-zinc-200">${escapeHtml(item.label)}:</strong> <span class="${escapeHtml(item.accentClass || 'text-blue-300')} font-bold">${escapeHtml(item.value)}</span>
            </span>
        `).join('');
    }

    setTextById('new-event-type-game-opt', `⚽ ${config.leagueName || 'League'} Match`);
    const defaultKitInput = document.getElementById('new-event-kit');
    if (defaultKitInput && config.kitRules?.practice) {
        defaultKitInput.value = config.kitRules.practice;
    }

    // Standings headings
    setTextById('standings-division-heading', `${config.division} Standings`);
    setTextById('edit-standings-modal-title', `Edit ${config.leagueName || 'League'} Standings Table`);

    // Footer team identity & officials summary
    setTextById('footer-team-fullname', config.fullName);
    setTextById('footer-division-season', `${config.division} • ${config.season}`);
    setTextById('footer-portal-copy', `Protected Team Portal for ${config.name} Players, Coaches & Families.`);

    const footerOfficialsEl = document.getElementById('footer-officials-summary');
    if (footerOfficialsEl) {
        const officials = Array.isArray(config.officials) ? config.officials : [];
        const summaryParts = officials
            .filter(o => o && o.name)
            .map(o => {
                const roleLabel = (o.role || 'Staff')
                    .toLowerCase()
                    .replace(/\b\w/g, (ch) => ch.toUpperCase());
                return `${roleLabel}: ${o.name}`;
            });
        footerOfficialsEl.textContent = summaryParts.join(' • ');
        footerOfficialsEl.classList.toggle('hidden', summaryParts.length === 0);
    }

    // Social & Integration buttons (WhatsApp & Instagram)
    hydrateSocialLinks(config);
}

export function renderTeamSwitcher() {
    const teams = getAvailableTeams();
    const activeConfig = getActiveTeamConfig();
    const hasCurrent = teams.some(t => t.teamId === CURRENT_TEAM_ID);
    const optionsList = hasCurrent
        ? teams
        : [...teams, { teamId: CURRENT_TEAM_ID, name: activeConfig.name, division: activeConfig.division }];

    const selectors = [
        document.getElementById('team-switcher-select'),
        document.getElementById('gate-team-switcher-select')
    ];

    selectors.forEach((selectEl) => {
        if (!selectEl) return;
        selectEl.innerHTML = optionsList.map((team) => {
            const label = team.name || team.teamId;
            const selected = team.teamId === CURRENT_TEAM_ID ? ' selected' : '';
            return `<option value="${escapeHtml(team.teamId)}"${selected}>${escapeHtml(label)}</option>`;
        }).join('');
        selectEl.value = CURRENT_TEAM_ID;
    });
}

export function handleTeamSwitch(newTeamId) {
    const cleanTarget = String(newTeamId || '').trim().toLowerCase();
    if (!cleanTarget || cleanTarget === CURRENT_TEAM_ID) return;

    // 1. Cleanly detach all active Firestore listeners and pause timers before navigating
    teardownRealtimeSync();
    try { pauseTimer(); } catch {}

    // 2. Clear transient sessionStorage state for the outgoing squad so reload starts clean
    try {
        sessionStorage.removeItem(PASS_UNLOCKED_KEY);
        sessionStorage.removeItem(COACH_MODE_KEY);
    } catch {}

    // 3. Persist new team selection & reload cleanly into ?c=...&t=newTeamId
    switchActiveTeam(cleanTarget);
}

window.handleTeamSwitch = handleTeamSwitch;

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

    // Ensure Firestore realtime listeners are cleanly detached on page unload / navigation
    window.addEventListener('beforeunload', () => {
        teardownRealtimeSync();
    });
}

export function syncGateVisibility() {
    const unlocked = isPasscodeUnlocked();
    const gate = document.getElementById('family-pass-gate');
    if (gate) {
        gate.style.display = '';
        if (unlocked) {
            gate.classList.add('hidden');
        } else {
            gate.classList.remove('hidden');
        }
    }
}

// Initialize on DOM Ready
function onAppInit() {
    const activeConfig = getActiveTeamConfig();

    // 1. Hydrate root CSS variables, dynamic shell copy, officials, links, and Team Switcher
    applyTeamThemeVariables(activeConfig);
    hydrateAppShell(activeConfig);
    renderTeamSwitcher();

    // 2. Check if passcode is already unlocked for this specific squad
    syncGateVisibility();

    // 3. Setup direct event listeners & unload teardown
    setupDomEventListeners();

    // 4. Initialize Firebase Realtime Sync for active team
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
                    if (Array.isArray(parsed) && parsed.length > 0) {
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

    // 5. Initial render of all views
    updateAllViews();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onAppInit);
} else {
    onAppInit();
}

