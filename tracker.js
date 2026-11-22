import { players, getAllRosterPlayers, getAvailablePlayers, isPlayerAvailable } from './roster.js';
import { savePersistentData, resolveFirebaseMediaUrl } from './firebase.js';
import {
    CURRENT_TEAM_ID,
    getActiveTeamConfig,
    getTeamStorageKey,
    getTeamStorageItem,
    setTeamStorageItem
} from './tenant.js';

const ALBION14_PAST_MATCHES_SEED = [
    {
        id: 1792877536561,
        opponent: "CWFC B2014 Green",
        date: "Oct 24, 2026",
        scoreUs: 5,
        scoreThem: 0,
        motmJersey: 11,
        motmName: "Tristan D'Mello",
        events: [
            {
                id: 1792877082141,
                time: "62:49",
                type: "goal",
                scorerJersey: 1,
                scorerName: "Haaris Nathoo",
                assistJersey: null,
                assistName: null,
                finish: "Header 🗣️",
                phase: "Open Play ⚡",
                tag: "Henry's header",
                video: ""
            },
            {
                id: 1792875486049,
                time: "36:13",
                type: "goal",
                scorerJersey: 11,
                scorerName: "Tristan D'Mello",
                assistJersey: 70,
                assistName: "Esteban Bazurto",
                finish: "Right Foot 👟",
                phase: "Open Play ⚡",
                tag: "Right Foot 👟",
                video: ""
            },
            {
                id: 1792875178828,
                time: "28:07",
                type: "defense",
                playerJersey: 4,
                playerName: "Logan Martens",
                action: "Goal-Line Clearance 🧤",
                note: "",
                video: ""
            },
            {
                id: 1792874571033,
                time: "17:59",
                type: "goal",
                scorerJersey: 35,
                scorerName: "Nyle Zachary",
                assistJersey: 52,
                assistName: "Sam Campbell",
                finish: "Right Foot 👟",
                phase: "Open Play ⚡",
                tag: "Trivella",
                video: ""
            },
            {
                id: 1792873977034,
                time: "08:05",
                type: "goal",
                scorerJersey: 4,
                scorerName: "Logan Martens",
                assistJersey: 70,
                assistName: "Esteban Bazurto",
                finish: "Tap-in / Rebound 🎯",
                phase: "Open Play ⚡",
                tag: "Tap-in / Rebound 🎯",
                video: ""
            },
            {
                id: 1792873862581,
                time: "06:10",
                type: "goal",
                scorerJersey: 70,
                scorerName: "Esteban Bazurto",
                assistJersey: 35,
                assistName: "Nyle Zachary",
                finish: "Header 🗣️",
                phase: "Throw-in / Set Piece 📐",
                tag: "Header 🗣️",
                video: ""
            }
        ],
        stats: {
            savesThem: 1,
            savesUs: 4,
            cornersUs: 0,
            sotUs: 8,
            cornersThem: 0,
            shotsThem: 1,
            sotThem: 2,
            shotsUs: 5
        }
    },
    {
        id: 1792541273920,
        opponent: "SWU Atletico 14",
        date: "Oct 20, 2026",
        scoreUs: 2,
        scoreThem: 6,
        motmJersey: 22,
        motmName: "Yazed (Zezo) Manasrah",
        events: [
            {
                id: 1792541236649,
                time: "36:46",
                type: "opp_goal",
                oppName: "SWU Atletico 14",
                note: ""
            },
            {
                id: 1792541235207,
                time: "36:45",
                type: "opp_goal",
                oppName: "SWU Atletico 14",
                note: ""
            },
            {
                id: 1792541230812,
                time: "36:40",
                type: "goal",
                scorerJersey: 5,
                scorerName: "Elijah Amoako",
                assistJersey: null,
                assistName: null,
                finish: "Tap-in / Rebound 🎯",
                phase: "Corner Kick 🚩",
                tag: "Tap-in / Rebound 🎯",
                video: ""
            },
            {
                id: 1792541184646,
                time: "35:54",
                type: "goal",
                scorerJersey: 52,
                scorerName: "Sam Campbell",
                assistJersey: null,
                assistName: null,
                finish: "Left Foot 👟",
                phase: "Penalty Kick 🥅",
                tag: "Rocket 💥",
                video: "firestore://mediaChunks/vid_1792541179575_rj0r4?chunks=6"
            },
            {
                id: 1792541120836,
                time: "00:13",
                type: "opp_goal",
                oppName: "SWU Atletico 14",
                note: ""
            },
            {
                id: 1792541119371,
                time: "00:11",
                type: "opp_goal",
                oppName: "SWU Atletico 14",
                note: ""
            },
            {
                id: 1792541117753,
                time: "00:10",
                type: "opp_goal",
                oppName: "SWU Atletico 14",
                note: ""
            },
            {
                id: 1792541115806,
                time: "00:08",
                type: "opp_goal",
                oppName: "SWU Atletico 14",
                note: ""
            }
        ],
        stats: {
            shotsUs: 2,
            cornersThem: 0,
            sotThem: 6,
            shotsThem: 6,
            savesThem: 0,
            sotUs: 2,
            savesUs: 1,
            cornersUs: 0
        }
    }
];

export const initialPastMatches = CURRENT_TEAM_ID === 'albion14' ? ALBION14_PAST_MATCHES_SEED : [];

function getActiveTeamLabels() {
    const cfg = getActiveTeamConfig();
    return {
        teamName: cfg.name || 'Our Team',
        shortName: cfg.shortName || cfg.clubShortName || cfg.name || 'Team',
        leagueName: cfg.leagueName || 'CMSA',
        defaultOpponent: cfg.defaultOpponent || 'Opponent'
    };
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function replaceZizouText(val) {
    return typeof val === 'string' ? val.replace(/Zizou/gi, 'Zezo') : val;
}

function migrateEventsNames(events) {
    if (!Array.isArray(events)) return;
    events.forEach(ev => {
        if (!ev || typeof ev !== 'object') return;
        if (ev.scorerName) ev.scorerName = replaceZizouText(ev.scorerName);
        if (ev.assistName) ev.assistName = replaceZizouText(ev.assistName);
        if (ev.playerName) ev.playerName = replaceZizouText(ev.playerName);
        if (ev.tag) ev.tag = replaceZizouText(ev.tag);
        if (ev.note) ev.note = replaceZizouText(ev.note);
    });
}

function migratePlayerNames(state) {
    if (!state || typeof state !== 'object') return state;
    migrateEventsNames(state.events);
    if (Array.isArray(state.history)) {
        state.history.forEach(m => {
            if (!m || typeof m !== 'object') return;
            if (m.motmName) m.motmName = replaceZizouText(m.motmName);
            migrateEventsNames(m.events);
        });
    }
    if (Array.isArray(state.guestPlayers)) {
        state.guestPlayers.forEach(g => {
            if (g && g.name) g.name = replaceZizouText(g.name);
        });
    }
    return state;
}

function createEmptyStats() {
    return { shotsUs: 0, shotsThem: 0, sotUs: 0, sotThem: 0, savesUs: 0, savesThem: 0, cornersUs: 0, cornersThem: 0 };
}

function ensureStatsObj(target) {
    if (!target.stats || typeof target.stats !== 'object') {
        target.stats = createEmptyStats();
    } else {
        target.stats = {
            shotsUs: Number(target.stats.shotsUs) || 0,
            shotsThem: Number(target.stats.shotsThem) || 0,
            sotUs: Number(target.stats.sotUs) || 0,
            sotThem: Number(target.stats.sotThem) || 0,
            savesUs: Number(target.stats.savesUs) || 0,
            savesThem: Number(target.stats.savesThem) || 0,
            cornersUs: Number(target.stats.cornersUs) || 0,
            cornersThem: Number(target.stats.cornersThem) || 0
        };
    }
    return target.stats;
}

function getMatchById(matchId) {
    if (matchId === null || matchId === undefined || matchId === 'live') {
        return matchState;
    }
    return matchState.history.find(m => m.id === matchId) || null;
}

export let matchState = (() => {
    const labels = getActiveTeamLabels();
    const isAlbion14 = CURRENT_TEAM_ID === 'albion14';
    let state = null;
    try {
        const saved = getTeamStorageItem('match_state', 'rfc14_match_state');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && typeof parsed === 'object') {
                // Verify Albion 14 state is not corrupt with legacy mock id 101
                const isCorruptLegacy = isAlbion14 &&
                    Array.isArray(parsed.history) &&
                    parsed.history.some(m => m.id === 101 || (m.motmJersey === 4 && m.opponent?.includes('CWFC')));
                if (!isCorruptLegacy) {
                    state = parsed;
                }
            }
        }
    } catch {}

    if (!state || typeof state !== 'object') {
        state = {
            scoreUs: 0,
            scoreThem: 0,
            opponentName: labels.defaultOpponent,
            timerSeconds: 0,
            timerRunning: false,
            period: "1st Half",
            isFinal: false,
            motmJersey: null,
            events: [],
            shootout: { active: false, usKicks: [], themKicks: [] },
            stats: createEmptyStats(),
            history: isAlbion14 ? JSON.parse(JSON.stringify(ALBION14_PAST_MATCHES_SEED)) : [],
            attendance: {},
            guestPlayers: []
        };
    }

    if (!Array.isArray(state.history)) {
        state.history = isAlbion14 ? JSON.parse(JSON.stringify(ALBION14_PAST_MATCHES_SEED)) : [];
    } else if (isAlbion14 && state.history.length === 0) {
        state.history = JSON.parse(JSON.stringify(ALBION14_PAST_MATCHES_SEED));
    }

    if (!state.attendance || typeof state.attendance !== 'object') {
        state.attendance = {};
    }
    if (!Array.isArray(state.guestPlayers)) {
        state.guestPlayers = [];
    }
    ensureStatsObj(state);
    migratePlayerNames(state);
    try {
        localStorage.setItem(getTeamStorageKey('match_state'), JSON.stringify(state));
    } catch {}
    return state;
})();

let timerInterval = null;
let currentEditingEventId = null;
let currentEditMatchId = null;
let activeReviewMatchId = undefined; // undefined = closed, null = live match, number = archived match ID
let activeEventDetailCtx = null; // { matchId: null|number, eventId: number|null, eventType: string, isNew: boolean }

export function updateMatchState(newState) {
    matchState = migratePlayerNames({ ...matchState, ...newState });
    ensureStatsObj(matchState);
}

export function formatTimer(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

export function updatePeriodButtonsHighlight(currentPeriod) {
    const periodButtons = [
        { id: 'btn-period-pregame', period: 'Pre-Game', activeClass: 'bg-amber-500 text-zinc-950 font-black shadow-md ring-2 ring-amber-400' },
        { id: 'btn-period-1st-half', period: '1st Half', activeClass: 'bg-[var(--brand-primary)] text-white font-black shadow-md ring-2 ring-blue-400' },
        { id: 'btn-period-halftime', period: 'Halftime', activeClass: 'bg-zinc-700 text-white font-black shadow-md ring-2 ring-zinc-400' },
        { id: 'btn-period-2nd-half', period: '2nd Half', activeClass: 'bg-[var(--brand-primary)] text-white font-black shadow-md ring-2 ring-blue-400' },
        { id: 'btn-period-penalties', period: 'Penalties', activeClass: 'bg-purple-700 text-white font-black shadow-md ring-2 ring-purple-400' },
        { id: 'btn-period-full-time', period: 'Full Time', activeClass: 'bg-emerald-700 text-white font-black shadow-md ring-2 ring-emerald-400' }
    ];

    periodButtons.forEach(btnInfo => {
        const el = document.getElementById(btnInfo.id);
        if (!el) return;
        if (!el.dataset.defaultClass) {
            el.dataset.defaultClass = el.className;
        }
        if (btnInfo.period === currentPeriod) {
            el.className = `px-3.5 py-1.5 rounded-lg text-xs transition active:scale-95 ${btnInfo.activeClass}`;
        } else {
            el.className = el.dataset.defaultClass;
        }
    });
}

export function setMatchPeriod(period, leagueStandings, scheduleEvents) {
    matchState.period = period;
    const badge = document.getElementById('match-period-badge');
    if (badge) {
        badge.textContent = period;
        if (period === 'Pre-Game') {
            badge.className = "px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-amber-500/20 border border-amber-500/50 text-amber-300";
        } else if (period === 'Penalties') {
            badge.className = "px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-purple-900/80 border border-purple-400/40 text-purple-200";
        } else if (period === 'Full Time') {
            badge.className = "px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-emerald-900/80 border border-emerald-400/40 text-emerald-200";
        } else {
            badge.className = "px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-blue-900/80 border border-blue-400/40 text-blue-200";
        }
    }

    const shootoutCard = document.getElementById('shootout-card');
    if (period === 'Penalties') {
        matchState.shootout.active = true;
        if (shootoutCard) shootoutCard.classList.remove('hidden');
        pauseTimer();
    } else {
        if (shootoutCard) shootoutCard.classList.add('hidden');
    }

    if (period === 'Pre-Game') {
        pauseTimer();
        matchState.isFinal = false;
    } else if (period === '2nd Half' && matchState.timerSeconds < 35 * 60) {
        matchState.timerSeconds = 35 * 60;
        const display = document.getElementById('timer-display');
        if (display) display.textContent = formatTimer(matchState.timerSeconds);
    } else if (period === 'Halftime') {
        pauseTimer();
    } else if (period === 'Full Time') {
        pauseTimer();
        matchState.isFinal = true;
    }

    updatePeriodButtonsHighlight(period);
    updateMatchFinalBanner();
    savePersistentData(matchState, leagueStandings, scheduleEvents);
}

export function updateMatchFinalBanner() {
    const banner = document.getElementById('box-final-match-banner');
    const resultText = document.getElementById('final-banner-result-text');
    const headerText = document.getElementById('match-header-status-text');
    const pulseDot = document.getElementById('match-live-pulse-dot');
    const endBtnLabel = document.getElementById('btn-end-match-label');
    const { shortName, leagueName } = getActiveTeamLabels();

    if (matchState.period === 'Full Time' || matchState.isFinal) {
        if (banner) banner.classList.remove('hidden');
        if (resultText) {
            const us = matchState.scoreUs;
            const them = matchState.scoreThem;
            const outcome = us > them ? `${shortName} WIN 🎉` : (us === them ? 'DRAW 🤝' : 'Opponent WIN');
            resultText.textContent = `FINAL SCORE: ${shortName} ${us} - ${them} ${matchState.opponentName} (${outcome})`;
        }
        if (headerText) headerText.textContent = "MATCH COMPLETED (FINAL)";
        if (pulseDot) pulseDot.className = "inline-block w-2.5 h-2.5 rounded-full bg-emerald-400";
        if (endBtnLabel) endBtnLabel.textContent = "Archive Match";
    } else {
        if (banner) banner.classList.add('hidden');
        if (headerText) headerText.textContent = `${leagueName.toUpperCase()} LEAGUE MATCH`;
        if (pulseDot) pulseDot.className = "inline-block w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping";
        if (endBtnLabel) endBtnLabel.textContent = "End Match";
    }
}

export function resumeMatchFromFinal(leagueStandings, scheduleEvents) {
    matchState.isFinal = false;
    matchState.period = "2nd Half";
    const badge = document.getElementById('match-period-badge');
    if (badge) badge.textContent = "2nd Half";
    updateMatchFinalBanner();
    savePersistentData(matchState, leagueStandings, scheduleEvents);
}

export function toggleMatchTimer(leagueStandings, scheduleEvents) {
    if (matchState.timerRunning) {
        pauseTimer();
    } else {
        startTimer(leagueStandings, scheduleEvents);
    }
}

export function startTimer(leagueStandings, scheduleEvents) {
    matchState.timerRunning = true;
    const btn = document.getElementById('btn-toggle-timer');
    if (btn) {
        btn.textContent = '⏸ Pause';
        btn.className = 'px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold shadow transition';
    }
    if (!timerInterval) {
        timerInterval = setInterval(() => {
            matchState.timerSeconds++;
            const display = document.getElementById('timer-display');
            if (display) display.textContent = formatTimer(matchState.timerSeconds);
            if (matchState.timerSeconds % 5 === 0) {
                savePersistentData(matchState, leagueStandings, scheduleEvents);
            }
        }, 1000);
    }
}

export function pauseTimer() {
    matchState.timerRunning = false;
    const btn = document.getElementById('btn-toggle-timer');
    if (btn) {
        btn.textContent = '▶ Resume';
        btn.className = 'px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shadow transition';
    }
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

export function resetTimer(leagueStandings, scheduleEvents) {
    pauseTimer();
    matchState.timerSeconds = 0;
    const display = document.getElementById('timer-display');
    if (display) display.textContent = '00:00';
    savePersistentData(matchState, leagueStandings, scheduleEvents);
}

// Adjust Stats
export function adjustStat(key, amount, leagueStandings, scheduleEvents) {
    if (!matchState.stats) {
        matchState.stats = { shotsUs: 0, shotsThem: 0, sotUs: 0, sotThem: 0, savesUs: 0, savesThem: 0, cornersUs: 0, cornersThem: 0 };
    }
    matchState.stats[key] = Math.max(0, (matchState.stats[key] || 0) + amount);
    renderStatsComparison();
    savePersistentData(matchState, leagueStandings, scheduleEvents);
}

export function renderStatsComparison() {
    const s = matchState.stats || { shotsUs: 0, shotsThem: 0, sotUs: 0, sotThem: 0, savesUs: 0, savesThem: 0, cornersUs: 0, cornersThem: 0 };
    const sotUs = document.getElementById('stat-sot-us');
    const sotThem = document.getElementById('stat-sot-them');
    const shotsUs = document.getElementById('stat-shots-us');
    const shotsThem = document.getElementById('stat-shots-them');
    const savesUs = document.getElementById('stat-saves-us');
    const savesThem = document.getElementById('stat-saves-them');
    const cornersUs = document.getElementById('stat-corners-us');
    const cornersThem = document.getElementById('stat-corners-them');

    if (sotUs) sotUs.textContent = s.sotUs;
    if (sotThem) sotThem.textContent = s.sotThem;
    if (shotsUs) shotsUs.textContent = s.shotsUs;
    if (shotsThem) shotsThem.textContent = s.shotsThem;
    if (savesUs) savesUs.textContent = s.savesUs;
    if (savesThem) savesThem.textContent = s.savesThem;
    if (cornersUs) cornersUs.textContent = s.cornersUs;
    if (cornersThem) cornersThem.textContent = s.cornersThem;

    updateBar('bar-sot-us', 'bar-sot-them', s.sotUs, s.sotThem);
    updateBar('bar-shots-us', 'bar-shots-them', s.shotsUs, s.shotsThem);
    updateBar('bar-saves-us', 'bar-saves-them', s.savesUs, s.savesThem);
    updateBar('bar-corners-us', 'bar-corners-them', s.cornersUs, s.cornersThem);
}

function updateBar(usId, themId, usVal, themVal) {
    const usEl = document.getElementById(usId) || document.getElementById('stat-' + usId);
    const themEl = document.getElementById(themId) || document.getElementById('stat-' + themId);
    const total = usVal + themVal;
    if (total === 0) {
        if (usEl) usEl.style.width = '50%';
        if (themEl) themEl.style.width = '50%';
    } else {
        const usPct = Math.round((usVal / total) * 100);
        if (usEl) usEl.style.width = `${usPct}%`;
        if (themEl) themEl.style.width = `${100 - usPct}%`;
    }
}

// Penalty Shootout
export function recordShootoutKick(team, scored, leagueStandings, scheduleEvents) {
    if (!matchState.shootout) matchState.shootout = { active: true, usKicks: [], themKicks: [] };
    if (team === 'us') matchState.shootout.usKicks.push(scored);
    else matchState.shootout.themKicks.push(scored);
    renderShootout();
    savePersistentData(matchState, leagueStandings, scheduleEvents);
}

export function resetShootout(leagueStandings, scheduleEvents) {
    matchState.shootout = { active: true, usKicks: [], themKicks: [] };
    renderShootout();
    savePersistentData(matchState, leagueStandings, scheduleEvents);
}

export function setMatchMOTM(jersey, leagueStandings, scheduleEvents) {
    matchState.motmJersey = jersey ? parseInt(jersey, 10) : null;
    const motmBox = document.getElementById('motm-name-display');
    if (motmBox) {
        if (matchState.motmJersey) {
            const allPlayers = getAllRosterPlayers(matchState);
            const p = allPlayers.find(r => r.jersey === matchState.motmJersey);
            motmBox.textContent = p ? `Man of the Match: #${p.jersey} ${p.name} 🎖️` : 'Man of the Match: Assigned';
        } else {
            motmBox.textContent = "Man of the Match: Not Crowned Yet";
        }
    }
    savePersistentData(matchState, leagueStandings, scheduleEvents);
}

export function renderShootout() {
    const sh = matchState.shootout || { active: false, usKicks: [], themKicks: [] };
    const usWins = sh.usKicks.filter(Boolean).length;
    const themWins = sh.themKicks.filter(Boolean).length;
    const display = document.getElementById('shootout-score-display');
    if (display) display.textContent = `${usWins} - ${themWins} PK`;

    const usBubble = document.getElementById('pk-bubbles-us');
    const themBubble = document.getElementById('pk-bubbles-them');
    if (usBubble) usBubble.innerHTML = renderKickBubbles(sh.usKicks);
    if (themBubble) themBubble.innerHTML = renderKickBubbles(sh.themKicks);
}

function renderKickBubbles(kicks) {
    let html = '';
    for (let i = 0; i < Math.max(5, kicks.length); i++) {
        if (i < kicks.length) {
            html += kicks[i] 
                ? `<span class="w-5 h-5 rounded-full bg-emerald-500 text-[10px] font-black text-white flex items-center justify-center">✓</span>` 
                : `<span class="w-5 h-5 rounded-full bg-rose-500 text-[10px] font-black text-white flex items-center justify-center">✗</span>`;
        } else {
            html += `<span class="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700"></span>`;
        }
    }
    return html;
}

// Live Match Opponent Inline Edit
export function toggleEditLiveOpponent() {
    const box = document.getElementById('edit-live-opponent-box');
    const input = document.getElementById('input-live-opponent');
    if (!box || !input) return;
    const isHidden = box.classList.contains('hidden');
    if (isHidden) {
        input.value = matchState.opponentName || '';
        box.classList.remove('hidden');
        if (!input.dataset.enterBound) {
            input.dataset.enterBound = '1';
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    window.saveLiveOpponentName?.();
                } else if (e.key === 'Escape') {
                    box.classList.add('hidden');
                }
            });
        }
        setTimeout(() => {
            input.focus();
            input.select();
        }, 30);
    } else {
        box.classList.add('hidden');
    }
}

export function saveLiveOpponentName(leagueStandings, scheduleEvents, onUpdate) {
    const box = document.getElementById('edit-live-opponent-box');
    const input = document.getElementById('input-live-opponent');
    const nextName = input?.value.trim();
    if (nextName) {
        matchState.opponentName = nextName;
        savePersistentData(matchState, leagueStandings, scheduleEvents);
    }
    if (box) box.classList.add('hidden');
    if (typeof onUpdate === 'function') onUpdate();
}

// Safely play video clip attached to a live or archived event
export function playEventVideo(matchId, eventId) {
    const target = getMatchById(matchId);
    if (!target || !Array.isArray(target.events)) return;
    const ev = target.events.find(e => e.id === eventId);
    if (!ev || !ev.video) return;
    const title = ev.type === 'goal'
        ? `#${ev.scorerJersey} ${ev.scorerName} Goal`
        : ev.type === 'defense'
            ? `#${ev.playerJersey} ${ev.playerName} Defensive Stop`
            : `${ev.oppName || 'Opponent'} Goal`;
    openVideoClipModal(ev.video, title, ev.time || '');
}

// Live Match Scoreboard Render
export function renderMatchTracker(isCoachMode) {
    const scoreUsEl = document.getElementById('score-us');
    const scoreThemEl = document.getElementById('score-them');
    const oppNameEl = document.getElementById('opponent-name-display');
    const timerDisplayEl = document.getElementById('timer-display');
    const periodBadgeEl = document.getElementById('match-period-badge');

    if (scoreUsEl) scoreUsEl.textContent = matchState.scoreUs;
    if (scoreThemEl) scoreThemEl.textContent = matchState.scoreThem;
    if (oppNameEl) oppNameEl.textContent = matchState.opponentName;
    if (timerDisplayEl && !matchState.timerRunning) {
        timerDisplayEl.textContent = formatTimer(matchState.timerSeconds || 0);
    }
    const currentPeriod = matchState.period || "1st Half";
    if (periodBadgeEl) {
        periodBadgeEl.textContent = currentPeriod;
        if (currentPeriod === 'Pre-Game') {
            periodBadgeEl.className = "px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-amber-500/20 border border-amber-500/50 text-amber-300";
        } else if (currentPeriod === 'Penalties') {
            periodBadgeEl.className = "px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-purple-900/80 border border-purple-400/40 text-purple-200";
        } else if (currentPeriod === 'Full Time') {
            periodBadgeEl.className = "px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-emerald-900/80 border border-emerald-400/40 text-emerald-200";
        } else {
            periodBadgeEl.className = "px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-blue-900/80 border border-blue-400/40 text-blue-200";
        }
    }
    updatePeriodButtonsHighlight(currentPeriod);
    updateMatchFinalBanner();

    const allPlayers = getAllRosterPlayers(matchState);
    const availablePlayers = getAvailablePlayers(matchState);

    // Update Game Squad Header Bar in Tracker
    const squadCountEl = document.getElementById('tracker-squad-count');
    const absentCountEl = document.getElementById('tracker-absent-count');
    if (squadCountEl) {
        if (availablePlayers.length === 0) {
            squadCountEl.className = "px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-500/40 text-[11px] font-bold";
            squadCountEl.textContent = "0 Available (All Absent)";
        } else {
            squadCountEl.className = "px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold";
            squadCountEl.textContent = `${availablePlayers.length} Available`;
        }
    }
    if (absentCountEl) {
        const total = allPlayers.length;
        const absent = total - availablePlayers.length;
        const guestCount = allPlayers.filter(p => p.isGuest).length;
        absentCountEl.textContent = `${absent} Absent${guestCount > 0 ? ` • ${guestCount} Guest Call-Up(s)` : ''}`;
    }

    const motmBox = document.getElementById('motm-name-display');
    if (motmBox) {
        if (matchState.motmJersey) {
            const p = allPlayers.find(r => r.jersey === matchState.motmJersey);
            motmBox.textContent = p ? `Man of the Match: #${p.jersey} ${p.name} 🎖️` : 'Man of the Match: Assigned';
        } else {
            motmBox.textContent = "Man of the Match: Not Crowned Yet";
        }
    }

    // MOTM Select: STRICTLY available players only (plus currently assigned MOTM if marked absent later)
    const motmSelect = document.getElementById('motm-player-select');
    if (motmSelect) {
        if (availablePlayers.length === 0) {
            motmSelect.innerHTML = '<option value="">⚠️ No players marked available</option>';
        } else {
            motmSelect.innerHTML = '<option value="">Select MOTM...</option>' + availablePlayers.map(p => 
                `<option value="${p.jersey}" ${matchState.motmJersey === p.jersey ? 'selected' : ''}>#${p.jersey} ${escapeHtml(p.name)}${p.isGuest ? ' (Guest)' : ''}</option>`
            ).join('');
        }
    }

    const timeline = document.getElementById('match-timeline-list');
    const eventCount = document.getElementById('match-event-count');
    if (eventCount) eventCount.textContent = `${matchState.events.length} Events Logged`;

    if (timeline) {
        if (matchState.events.length === 0) {
            timeline.innerHTML = `<p class="text-xs text-zinc-500 italic text-center py-4">No match events logged yet.</p>`;
        } else {
            timeline.innerHTML = matchState.events.map(ev => renderTimelineEventCard(ev, null, isCoachMode, true)).join('');
        }
    }

    renderStatsComparison();
    renderShootout();
    renderPastMatches(isCoachMode);
}

function renderTimelineEventCard(ev, matchId, isCoachMode, showDeleteOnCard = false) {
    const matchArg = matchId === null ? 'null' : String(matchId);
    const actionCue = isCoachMode
        ? `<span class="text-[10px] font-bold text-zinc-400 group-hover:text-blue-300 bg-zinc-900/80 border border-zinc-700/70 px-1.5 py-0.5 rounded-md transition">✎ Edit</span>`
        : `<span class="text-[10px] font-semibold text-zinc-400 group-hover:text-zinc-200 transition">Details ›</span>`;

    if (ev.type === 'goal') {
        const phase = ev.phase ? escapeHtml(ev.phase) : '';
        const finish = ev.finish ? escapeHtml(ev.finish) : '';
        const tag = ev.tag ? escapeHtml(ev.tag) : '';
        const phaseFinish = phase && finish ? `${phase} ➔ ${finish}` : (phase || finish || tag);
        const showSeparateTag = tag && tag !== finish && tag !== phase;
        return `
        <div onclick="window.openEventDetailModal(${matchArg}, ${ev.id})" class="group cursor-pointer flex items-center justify-between gap-2 p-3 rounded-2xl bg-blue-950/40 hover:bg-blue-950/70 border border-blue-500/30 hover:border-blue-400/60 transition">
            <div class="flex items-center space-x-3 min-w-0">
                <span class="text-lg shrink-0">⚽</span>
                <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-1.5">
                        <span class="text-xs font-black text-white">#${escapeHtml(ev.scorerJersey)} ${escapeHtml(ev.scorerName)}</span>
                        ${phaseFinish ? `<span class="text-[10px] bg-amber-950 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold">${phaseFinish}</span>` : ''}
                        ${showSeparateTag ? `<span class="text-[10px] bg-blue-900/90 text-blue-200 border border-blue-500/30 px-1.5 py-0.2 rounded font-bold">✨ ${tag}</span>` : ''}
                        ${ev.video ? `<button type="button" onclick="event.stopPropagation(); window.playEventVideo(${matchArg}, ${ev.id})" class="text-[10px] bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-500/40 px-1.5 py-0.2 rounded font-bold flex items-center space-x-1"><span>▶</span><span>Clip</span></button>` : ''}
                    </div>
                    <p class="text-[10px] text-zinc-400 mt-0.5 truncate">
                        ${ev.assistName ? `Assist: #${escapeHtml(ev.assistJersey)} ${escapeHtml(ev.assistName)}` : 'Unassisted (Solo)'}
                    </p>
                </div>
            </div>
            <div class="flex items-center space-x-2 shrink-0">
                <span class="text-xs font-mono font-bold text-amber-400">${escapeHtml(ev.time || '--:--')}</span>
                ${actionCue}
                ${showDeleteOnCard && isCoachMode ? `<button type="button" onclick="event.stopPropagation(); window.deleteMatchEvent(${ev.id})" class="text-zinc-500 hover:text-rose-400 text-sm px-1" title="Delete Event">&times;</button>` : ''}
            </div>
        </div>
        `;
    } else if (ev.type === 'opp_goal') {
        return `
        <div onclick="window.openEventDetailModal(${matchArg}, ${ev.id})" class="group cursor-pointer flex items-center justify-between gap-2 p-3 rounded-2xl bg-rose-950/40 hover:bg-rose-950/70 border border-rose-500/30 hover:border-rose-400/60 transition">
            <div class="flex items-center space-x-3 min-w-0">
                <span class="text-lg shrink-0">🥅</span>
                <div class="min-w-0">
                    <span class="text-xs font-black text-rose-300">${escapeHtml(ev.oppName || 'Opponent')} Goal</span>
                    ${ev.note ? `<p class="text-[10px] text-zinc-400 mt-0.5 truncate">${escapeHtml(ev.note)}</p>` : ''}
                </div>
            </div>
            <div class="flex items-center space-x-2 shrink-0">
                <span class="text-xs font-mono font-bold text-amber-400">${escapeHtml(ev.time || '--:--')}</span>
                ${actionCue}
                ${showDeleteOnCard && isCoachMode ? `<button type="button" onclick="event.stopPropagation(); window.deleteMatchEvent(${ev.id})" class="text-zinc-500 hover:text-rose-400 text-sm px-1" title="Delete Event">&times;</button>` : ''}
            </div>
        </div>
        `;
    } else {
        return `
        <div onclick="window.openEventDetailModal(${matchArg}, ${ev.id})" class="group cursor-pointer flex items-center justify-between gap-2 p-3 rounded-2xl bg-teal-950/30 hover:bg-teal-950/60 border border-teal-500/30 hover:border-teal-400/60 transition">
            <div class="flex items-center space-x-3 min-w-0">
                <span class="text-lg shrink-0">🛡️</span>
                <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-1.5">
                        <span class="text-xs font-black text-white">#${escapeHtml(ev.playerJersey)} ${escapeHtml(ev.playerName)}</span>
                        <span class="text-[10px] bg-teal-900 text-teal-200 px-1.5 py-0.2 rounded font-bold">${escapeHtml(ev.action || 'Defensive Stop')}</span>
                        ${ev.video ? `<button type="button" onclick="event.stopPropagation(); window.playEventVideo(${matchArg}, ${ev.id})" class="text-[10px] bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-500/40 px-1.5 py-0.2 rounded font-bold flex items-center space-x-1"><span>▶</span><span>Clip</span></button>` : ''}
                    </div>
                    ${ev.note ? `<p class="text-[10px] text-zinc-400 mt-0.5 truncate">${escapeHtml(ev.note)}</p>` : ''}
                </div>
            </div>
            <div class="flex items-center space-x-2 shrink-0">
                <span class="text-xs font-mono font-bold text-amber-400">${escapeHtml(ev.time || '--:--')}</span>
                ${actionCue}
                ${showDeleteOnCard && isCoachMode ? `<button type="button" onclick="event.stopPropagation(); window.deleteMatchEvent(${ev.id})" class="text-zinc-500 hover:text-rose-400 text-sm px-1" title="Delete Event">&times;</button>` : ''}
            </div>
        </div>
        `;
    }
}

// Past Match Records
export function renderPastMatches(isCoachMode) {
    const list = document.getElementById('past-matches-list');
    if (!list) return;

    if (!matchState.history || matchState.history.length === 0) {
        list.innerHTML = `<p class="text-xs text-zinc-500 italic text-center py-2">No past matches recorded yet.</p>`;
        return;
    }

    list.innerHTML = matchState.history.map(m => {
        const isWin = m.scoreUs > m.scoreThem;
        const isDraw = m.scoreUs === m.scoreThem;
        const st = m.stats || createEmptyStats();
        const evCount = Array.isArray(m.events) ? m.events.length : 0;
        return `
        <div onclick="window.openMatchReviewModal(${m.id})" class="group cursor-pointer p-3.5 rounded-2xl bg-zinc-950 hover:bg-zinc-900/90 border border-zinc-800 hover:border-blue-500/40 text-xs transition space-y-2.5">
            <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                        <span class="font-extrabold text-white text-sm group-hover:text-blue-200 transition">vs ${escapeHtml(m.opponent)}</span>
                        <span class="${isWin ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' : (isDraw ? 'bg-amber-950 text-amber-300 border-amber-500/40' : 'bg-rose-950 text-rose-300 border-rose-500/40')} border text-[10px] px-1.5 py-0.2 rounded font-bold uppercase">
                            ${isWin ? 'WIN' : (isDraw ? 'DRAW' : 'LOSS')}
                        </span>
                    </div>
                    <p class="text-[11px] text-zinc-400 mt-0.5">${escapeHtml(m.date)} • ${m.motmName && m.motmName !== 'Unassigned' ? `🎖️ MOTM: <span class="text-amber-300 font-semibold">${escapeHtml(m.motmName)}</span>` : 'No MOTM recorded'}</p>
                </div>
                <div class="text-right shrink-0">
                    <span class="text-lg font-black text-white font-mono tracking-tight">${m.scoreUs} - ${m.scoreThem}</span>
                </div>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/80">
                <div class="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-zinc-400">
                    <span class="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800">SOT <strong class="text-blue-300">${st.sotUs || 0}</strong>-<strong class="text-amber-300">${st.sotThem || 0}</strong></span>
                    <span class="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800">Shots <strong class="text-blue-300">${st.shotsUs || 0}</strong>-<strong class="text-amber-300">${st.shotsThem || 0}</strong></span>
                    <span class="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800">Saves <strong class="text-blue-300">${st.savesUs || 0}</strong>-<strong class="text-amber-300">${st.savesThem || 0}</strong></span>
                    <span class="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800">${evCount} Events</span>
                </div>
                <div class="flex items-center space-x-2">
                    <button type="button" onclick="event.stopPropagation(); window.openMatchReviewModal(${m.id})" class="px-2.5 py-1 rounded-lg bg-[var(--brand-primary)] hover:bg-blue-700 border border-blue-400/40 text-[10px] font-extrabold text-white transition shadow-sm">
                        📋 Full Review
                    </button>
                    ${isCoachMode ? `<button type="button" onclick="event.stopPropagation(); window.openEditMatchModal(${m.id})" class="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-[10px] font-bold text-amber-300 transition">✏️ Edit Match</button>` : ''}
                </div>
            </div>
        </div>
        `;
    }).join('');
}

// Goal Recording Form Handling
export function openGoalModal() {
    const selScorer = document.getElementById('goal-scorer-select');
    const selAssist = document.getElementById('goal-assist-select');
    const availablePlayers = getAvailablePlayers(matchState);

    if (selScorer) {
        if (availablePlayers.length === 0) {
            selScorer.innerHTML = '<option value="">⚠️ No players marked available (Check in on Roster)</option>';
        } else {
            selScorer.innerHTML = availablePlayers.map(p => 
                `<option value="${p.jersey}">#${p.jersey} ${escapeHtml(p.name)} (${escapeHtml(p.position)})${p.isGuest ? ' [Guest Call-Up]' : ''}</option>`
            ).join('');
        }
    }
    if (selAssist) {
        selAssist.innerHTML = '<option value="">None (Solo / Unassisted)</option>' + availablePlayers.map(p => 
            `<option value="${p.jersey}">#${p.jersey} ${escapeHtml(p.name)}${p.isGuest ? ' [Guest Call-Up]' : ''}</option>`
        ).join('');
    }
    const tagInput = document.getElementById('goal-tag-input');
    const videoInput = document.getElementById('goal-video-input');
    const timeInput = document.getElementById('goal-time-input');
    if (tagInput) tagInput.value = '';
    if (videoInput) videoInput.value = '';
    if (timeInput) timeInput.value = '';

    const modal = document.getElementById('goal-modal');
    if (modal) modal.classList.remove('hidden');
}

export function closeGoalModal() {
    const modal = document.getElementById('goal-modal');
    if (modal) modal.classList.add('hidden');
    currentEditingEventId = null;
}

export function confirmRockiesGoal(e, leagueStandings, scheduleEvents, onUpdate) {
    if (e) e.preventDefault();
    const scorerJersey = parseInt(document.getElementById('goal-scorer-select').value);
    const assistVal = document.getElementById('goal-assist-select').value;
    const assistJersey = assistVal ? parseInt(assistVal) : null;
    const phase = document.getElementById('goal-phase-select').value;
    const finish = document.getElementById('goal-finish-select').value;
    const customTag = document.getElementById('goal-tag-input').value.trim();
    const video = document.getElementById('goal-video-input').value.trim();
    const manualTime = document.getElementById('goal-time-input')?.value.trim();

    const allPlayers = getAllRosterPlayers(matchState);
    const scorer = allPlayers.find(p => p.jersey === scorerJersey);
    const assist = assistJersey ? allPlayers.find(p => p.jersey === assistJersey) : null;
    const timeString = manualTime || formatTimer(matchState.timerSeconds);

    const newEvent = {
        id: Date.now(),
        type: 'goal',
        time: timeString,
        scorerJersey,
        scorerName: scorer ? scorer.name : "Scorer",
        assistJersey,
        assistName: assist ? assist.name : null,
        phase,
        finish,
        tag: customTag || finish,
        video
    };

    matchState.scoreUs++;
    matchState.stats.shotsUs = (matchState.stats.shotsUs || 0) + 1;
    matchState.stats.sotUs = (matchState.stats.sotUs || 0) + 1;
    matchState.events.unshift(newEvent);

    closeGoalModal();
    savePersistentData(matchState, leagueStandings, scheduleEvents);
    if (typeof onUpdate === 'function') onUpdate();
}

// Opponent Goal Recording
export function openOpponentGoalModal() {
    const inputName = document.getElementById('opponent-goal-name-input');
    const inputNote = document.getElementById('opponent-goal-note-input');
    const inputTime = document.getElementById('opponent-goal-time-input');
    if (inputName) inputName.value = matchState.opponentName || 'Opponent';
    if (inputNote) inputNote.value = '';
    if (inputTime) inputTime.value = '';
    const modal = document.getElementById('opponent-goal-modal');
    if (modal) modal.classList.remove('hidden');
}

export function closeOpponentGoalModal() {
    const modal = document.getElementById('opponent-goal-modal');
    if (modal) modal.classList.add('hidden');
}

export function confirmOpponentGoal(e, leagueStandings, scheduleEvents, onUpdate) {
    if (e) e.preventDefault();
    const oppName = document.getElementById('opponent-goal-name-input').value.trim() || matchState.opponentName;
    const note = document.getElementById('opponent-goal-note-input').value.trim();
    const manualTime = document.getElementById('opponent-goal-time-input')?.value.trim();
    const timeString = manualTime || formatTimer(matchState.timerSeconds);

    const newEvent = {
        id: Date.now(),
        type: 'opp_goal',
        time: timeString,
        oppName,
        note
    };

    matchState.scoreThem++;
    matchState.stats.shotsThem = (matchState.stats.shotsThem || 0) + 1;
    matchState.stats.sotThem = (matchState.stats.sotThem || 0) + 1;
    matchState.events.unshift(newEvent);

    closeOpponentGoalModal();
    savePersistentData(matchState, leagueStandings, scheduleEvents);
    if (typeof onUpdate === 'function') onUpdate();
}

// Defensive Play Recording
export function openDefensiveModal() {
    const selDef = document.getElementById('defense-player-select');
    const availablePlayers = getAvailablePlayers(matchState);

    if (selDef) {
        if (availablePlayers.length === 0) {
            selDef.innerHTML = '<option value="">⚠️ No players marked available (Check in on Roster)</option>';
        } else {
            selDef.innerHTML = availablePlayers.map(p => 
                `<option value="${p.jersey}">#${p.jersey} ${escapeHtml(p.name)} (${escapeHtml(p.position)})${p.isGuest ? ' [Guest Call-Up]' : ''}</option>`
            ).join('');
        }
    }
    const noteInput = document.getElementById('defense-note-input');
    const videoInput = document.getElementById('defense-video-input');
    const timeInput = document.getElementById('defense-time-input');
    if (noteInput) noteInput.value = '';
    if (videoInput) videoInput.value = '';
    if (timeInput) timeInput.value = '';

    const modal = document.getElementById('defensive-modal');
    if (modal) modal.classList.remove('hidden');
}

export function closeDefensiveModal() {
    const modal = document.getElementById('defensive-modal');
    if (modal) modal.classList.add('hidden');
}

export function confirmDefensiveStop(e, leagueStandings, scheduleEvents, onUpdate) {
    if (e) e.preventDefault();
    const playerJersey = parseInt(document.getElementById('defense-player-select').value);
    const action = document.getElementById('defense-type-select').value;
    const note = document.getElementById('defense-note-input').value.trim();
    const video = document.getElementById('defense-video-input')?.value.trim() || '';
    const manualTime = document.getElementById('defense-time-input')?.value.trim();
    
    const allPlayers = getAllRosterPlayers(matchState);
    const p = allPlayers.find(r => r.jersey === playerJersey);
    const timeString = manualTime || formatTimer(matchState.timerSeconds);

    const newEvent = {
        id: Date.now(),
        type: 'defense',
        time: timeString,
        playerJersey,
        playerName: p ? p.name : "Defender",
        action,
        note,
        video
    };

    matchState.stats.savesUs = (matchState.stats.savesUs || 0) + 1;
    matchState.events.unshift(newEvent);

    closeDefensiveModal();
    savePersistentData(matchState, leagueStandings, scheduleEvents);
    if (typeof onUpdate === 'function') onUpdate();
}

// Delete Single Match Event
export function deleteMatchEvent(id, leagueStandings, scheduleEvents, onUpdate) {
    matchState.events = matchState.events.filter(e => e.id !== id);
    let us = 0, them = 0;
    matchState.events.forEach(ev => {
        if (ev.type === 'goal') us++;
        if (ev.type === 'opp_goal') them++;
    });
    matchState.scoreUs = us;
    matchState.scoreThem = them;
    savePersistentData(matchState, leagueStandings, scheduleEvents);
    if (typeof onUpdate === 'function') onUpdate();
}

// Archive Match
export function archiveMatchToHistory(leagueStandings, scheduleEvents, onUpdate) {
    const allPlayers = getAllRosterPlayers(matchState);
    const motmP = allPlayers.find(p => p.jersey === matchState.motmJersey);
    const archivedShootout = matchState.shootout && (matchState.shootout.active || matchState.shootout.usKicks?.length || matchState.shootout.themKicks?.length)
        ? JSON.parse(JSON.stringify(matchState.shootout))
        : null;

    matchState.history.unshift({
        id: Date.now(),
        opponent: matchState.opponentName || 'Opponent',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        scoreUs: matchState.scoreUs,
        scoreThem: matchState.scoreThem,
        motmJersey: matchState.motmJersey,
        motmName: motmP ? motmP.name : 'Unassigned',
        events: JSON.parse(JSON.stringify(matchState.events || [])),
        stats: { ...ensureStatsObj(matchState) },
        shootout: archivedShootout
    });

    matchState.scoreUs = 0;
    matchState.scoreThem = 0;
    matchState.timerSeconds = 0;
    matchState.timerRunning = false;
    matchState.period = "1st Half";
    matchState.isFinal = false;
    matchState.motmJersey = null;
    matchState.events = [];
    matchState.shootout = { active: false, usKicks: [], themKicks: [] };
    matchState.stats = createEmptyStats();

    pauseTimer();
    savePersistentData(matchState, leagueStandings, scheduleEvents);
    if (typeof onUpdate === 'function') onUpdate();
}

// Reset Match
export function resetNewMatch(leagueStandings, scheduleEvents, onUpdate) {
    matchState.scoreUs = 0;
    matchState.scoreThem = 0;
    matchState.timerSeconds = 0;
    matchState.timerRunning = false;
    matchState.period = "1st Half";
    matchState.isFinal = false;
    matchState.motmJersey = null;
    matchState.events = [];
    matchState.shootout = { active: false, usKicks: [], themKicks: [] };
    matchState.stats = createEmptyStats();

    pauseTimer();
    savePersistentData(matchState, leagueStandings, scheduleEvents);
    if (typeof onUpdate === 'function') onUpdate();
}

// Video Clip Lightbox
export async function openVideoClipModal(url, title, subtitle) {
    if (!url) return;
    const modal = document.getElementById('video-clip-modal');
    const titleEl = document.getElementById('video-clip-title');
    const subEl = document.getElementById('video-clip-subtitle');
    const container = document.getElementById('video-clip-media-container');

    if (titleEl) titleEl.textContent = title || "Match Highlight Clip";
    if (subEl) subEl.textContent = subtitle || "";
    if (container) {
        container.innerHTML = `<p class="text-xs text-zinc-400 py-8 animate-pulse">Loading video from Firebase...</p>`;
    }
    if (modal) modal.classList.remove('hidden');

    const playableUrl = await resolveFirebaseMediaUrl(url);
    if (container) {
        if (playableUrl) {
            container.innerHTML = `<video src="${escapeHtml(playableUrl)}" controls autoplay playsinline class="w-full h-auto max-h-[60vh] object-contain rounded-xl"></video>`;
        } else {
            container.innerHTML = `<p class="text-xs text-rose-400 py-8">Could not load video stream.</p>`;
        }
    }
}

export function closeVideoClipModal() {
    const modal = document.getElementById('video-clip-modal');
    const container = document.getElementById('video-clip-media-container');
    if (container) container.innerHTML = '';
    if (modal) modal.classList.add('hidden');
}

// ================= EDIT PAST MATCH MODAL =================

const EDIT_STAT_FIELDS = [
    ['edit-match-sot-us', 'sotUs'],
    ['edit-match-sot-them', 'sotThem'],
    ['edit-match-shots-us', 'shotsUs'],
    ['edit-match-shots-them', 'shotsThem'],
    ['edit-match-saves-us', 'savesUs'],
    ['edit-match-saves-them', 'savesThem'],
    ['edit-match-corners-us', 'cornersUs'],
    ['edit-match-corners-them', 'cornersThem']
];

export function adjustEditMatchStat(inputId, delta) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const current = parseInt(input.value, 10) || 0;
    input.value = String(Math.max(0, current + delta));
}

function syncEditMatchModalFromMatch(match) {
    if (!match) return;
    const scoreUsInput = document.getElementById('edit-match-score-us');
    const scoreThemInput = document.getElementById('edit-match-score-them');
    if (scoreUsInput) scoreUsInput.value = match.scoreUs;
    if (scoreThemInput) scoreThemInput.value = match.scoreThem;
    const st = ensureStatsObj(match);
    EDIT_STAT_FIELDS.forEach(([elId, key]) => {
        const el = document.getElementById(elId);
        if (el) el.value = st[key] || 0;
    });
}

export function openEditMatchModal(id) {
    const match = matchState.history.find(m => m.id === id);
    if (!match) return;
    currentEditMatchId = id;

    const oppInput = document.getElementById('edit-match-opponent');
    const dateInput = document.getElementById('edit-match-date');
    const motmSelect = document.getElementById('edit-match-motm');

    if (oppInput) oppInput.value = match.opponent || '';
    if (dateInput) dateInput.value = match.date || '';
    syncEditMatchModalFromMatch(match);

    if (motmSelect) {
        const allPlayers = getAllRosterPlayers(matchState);
        let optionsHtml = '<option value="">None</option>' + allPlayers.map(p =>
            `<option value="${p.jersey}" ${match.motmJersey === p.jersey ? 'selected' : ''}>#${p.jersey} ${escapeHtml(p.name)}${p.isGuest ? ' (Guest)' : ''}</option>`
        ).join('');
        if (match.motmJersey && !allPlayers.some(p => p.jersey === match.motmJersey)) {
            optionsHtml += `<option value="${match.motmJersey}" selected>#${match.motmJersey} ${escapeHtml(match.motmName || 'Player')}</option>`;
        }
        motmSelect.innerHTML = optionsHtml;
    }

    renderEditMatchEvents();
    const modal = document.getElementById('edit-past-match-modal');
    if (modal) modal.classList.remove('hidden');
}

export function closeEditMatchModal() {
    const modal = document.getElementById('edit-past-match-modal');
    if (modal) modal.classList.add('hidden');
    currentEditMatchId = null;
}

export function renderEditMatchEvents() {
    const list = document.getElementById('edit-match-timeline-list');
    if (!list || !currentEditMatchId) return;
    const match = matchState.history.find(m => m.id === currentEditMatchId);
    if (!match || !Array.isArray(match.events) || match.events.length === 0) {
        list.innerHTML = `<p class="text-[10px] text-zinc-500 italic text-center py-4">No events logged yet. Use the buttons above to add one.</p>`;
        return;
    }
    list.innerHTML = match.events.map(ev => {
        let icon = '🛡️';
        let title = `#${ev.playerJersey || '?'} ${ev.playerName || 'Defender'}`;
        let sub = [ev.action, ev.note].filter(Boolean).join(' • ');
        let borderCls = 'bg-teal-950/25 border-teal-500/30 hover:border-teal-400/60';

        if (ev.type === 'goal') {
            icon = '⚽';
            title = `#${ev.scorerJersey || '?'} ${ev.scorerName || 'Scorer'}`;
            const meta = [
                ev.assistName ? `Ast: #${ev.assistJersey} ${ev.assistName}` : 'Solo',
                ev.phase,
                ev.finish,
                ev.tag && ev.tag !== ev.finish ? `✨ ${ev.tag}` : ''
            ].filter(Boolean);
            sub = meta.join(' • ');
            borderCls = 'bg-blue-950/35 border-blue-500/30 hover:border-blue-400/60';
        } else if (ev.type === 'opp_goal') {
            icon = '🥅';
            title = `${ev.oppName || match.opponent || 'Opponent'} Goal`;
            sub = ev.note || 'Opponent goal';
            borderCls = 'bg-rose-950/35 border-rose-500/30 hover:border-rose-400/60';
        }

        return `
        <div onclick="window.openEventDetailModal(${match.id}, ${ev.id})" class="group cursor-pointer flex items-center justify-between gap-2 p-2.5 rounded-xl border ${borderCls} text-xs transition">
            <div class="flex items-center space-x-2.5 min-w-0">
                <span class="text-sm shrink-0">${icon}</span>
                <div class="min-w-0">
                    <div class="flex items-center space-x-1.5">
                        <p class="font-bold text-white text-[11px] truncate">${escapeHtml(title)}</p>
                        ${ev.video ? `<span class="text-[9px] text-sky-300 bg-sky-950 border border-sky-500/30 px-1 rounded">🎬</span>` : ''}
                    </div>
                    <p class="text-[10px] text-zinc-400 truncate">${escapeHtml(sub)}</p>
                </div>
            </div>
            <div class="flex items-center space-x-2 shrink-0">
                <span class="text-[10px] font-mono font-bold text-amber-400">${escapeHtml(ev.time || '--:--')}</span>
                <span class="text-[10px] text-blue-300 font-bold opacity-80 group-hover:opacity-100">✎</span>
                <button type="button" onclick="event.stopPropagation(); window.deletePastMatchEvent(${ev.id})" class="text-zinc-500 hover:text-rose-400 text-sm px-1" title="Delete Event">&times;</button>
            </div>
        </div>
        `;
    }).join('');
}

export function openAddPastMatchEvent(eventType, isCoachMode) {
    if (!currentEditMatchId) return;
    openEventDetailModal(currentEditMatchId, null, isCoachMode, eventType);
}

export function deletePastMatchEvent(eventId, leagueStandings, scheduleEvents, onUpdate) {
    if (!currentEditMatchId) return;
    const match = matchState.history.find(m => m.id === currentEditMatchId);
    if (!match || !Array.isArray(match.events)) return;
    const removed = match.events.find(e => e.id === eventId);
    match.events = match.events.filter(e => e.id !== eventId);
    if (removed) {
        if (removed.type === 'goal') {
            match.scoreUs = Math.max(0, (match.scoreUs || 0) - 1);
        } else if (removed.type === 'opp_goal') {
            match.scoreThem = Math.max(0, (match.scoreThem || 0) - 1);
        }
        syncEditMatchModalFromMatch(match);
    }
    renderEditMatchEvents();
    savePersistentData(matchState, leagueStandings, scheduleEvents);
    if (typeof onUpdate === 'function') onUpdate();
}

export function saveEditedMatch(e, leagueStandings, scheduleEvents, onUpdate) {
    if (e) e.preventDefault();
    if (!currentEditMatchId) return;
    const match = matchState.history.find(m => m.id === currentEditMatchId);
    if (match) {
        const opp = document.getElementById('edit-match-opponent')?.value.trim();
        const d = document.getElementById('edit-match-date')?.value.trim();
        const us = Math.max(0, parseInt(document.getElementById('edit-match-score-us')?.value, 10) || 0);
        const them = Math.max(0, parseInt(document.getElementById('edit-match-score-them')?.value, 10) || 0);
        const motmVal = document.getElementById('edit-match-motm')?.value;

        match.opponent = opp || match.opponent;
        match.date = d || match.date;
        match.scoreUs = us;
        match.scoreThem = them;
        match.motmJersey = motmVal ? parseInt(motmVal, 10) : null;
        const allPlayers = getAllRosterPlayers(matchState);
        const motmP = allPlayers.find(p => p.jersey === match.motmJersey);
        match.motmName = motmP ? motmP.name : (match.motmJersey ? match.motmName || 'Assigned' : 'Unassigned');

        const st = ensureStatsObj(match);
        EDIT_STAT_FIELDS.forEach(([elId, key]) => {
            const el = document.getElementById(elId);
            if (el) st[key] = Math.max(0, parseInt(el.value, 10) || 0);
        });
    }

    closeEditMatchModal();
    savePersistentData(matchState, leagueStandings, scheduleEvents);
    if (typeof onUpdate === 'function') onUpdate();
}

export function deletePastMatch(leagueStandings, scheduleEvents, onUpdate) {
    if (!currentEditMatchId) return;
    const deletedId = currentEditMatchId;
    matchState.history = matchState.history.filter(m => m.id !== deletedId);
    if (activeReviewMatchId === deletedId) {
        closeMatchReviewModal();
    }
    closeEditMatchModal();
    savePersistentData(matchState, leagueStandings, scheduleEvents);
    if (typeof onUpdate === 'function') onUpdate();
}

// ================= EVENT DETAILS & EDIT MODAL =================

const GOAL_PHASE_OPTIONS = [
    'Open Play',
    'Counter Attack',
    'Corner Kick',
    'Free Kick',
    'Throw-in / Set Piece',
    'Penalty'
];

const GOAL_FINISH_OPTIONS = [
    'Right Foot',
    'Left Foot',
    'Header',
    'Tap-in',
    'Volley'
];

const DEFENSE_ACTION_OPTIONS = [
    'Key Defensive Tackle',
    'Diving Goalkeeper Save',
    'Goal Line Clearance',
    'Crucial Interception',
    'Shot Block'
];

function populateSelectWithOptions(selectEl, options, currentVal) {
    if (!selectEl) return;
    const list = [...options];
    if (currentVal && !list.includes(currentVal)) {
        list.unshift(currentVal);
    }
    selectEl.innerHTML = list.map(opt =>
        `<option value="${escapeHtml(opt)}" ${opt === currentVal ? 'selected' : ''}>${escapeHtml(opt)}</option>`
    ).join('');
}

function populatePlayerSelect(selectEl, selectedJersey, selectedName, allowNone = false) {
    if (!selectEl) return;
    const allPlayers = getAllRosterPlayers(matchState);
    let html = allowNone ? '<option value="">None (Solo / Unassisted)</option>' : '';
    const hasSelected = selectedJersey !== null && selectedJersey !== undefined && selectedJersey !== '';
    const existsInRoster = hasSelected && allPlayers.some(p => p.jersey === Number(selectedJersey));

    html += allPlayers.map(p =>
        `<option value="${p.jersey}" ${hasSelected && p.jersey === Number(selectedJersey) ? 'selected' : ''}>#${p.jersey} ${escapeHtml(p.name)} (${escapeHtml(p.position)})${p.isGuest ? ' [Guest]' : ''}</option>`
    ).join('');

    if (hasSelected && !existsInRoster) {
        html += `<option value="${escapeHtml(selectedJersey)}" selected>#${escapeHtml(selectedJersey)} ${escapeHtml(selectedName || 'Player')} [Archived]</option>`;
    }
    selectEl.innerHTML = html;
}

export function openEventDetailModal(matchId, eventId, isCoachMode, newEventType = null) {
    const target = getMatchById(matchId);
    if (!target) return;

    let eventType = newEventType;
    const isNew = !!newEventType;

    if (!isNew) {
        const ev = (target.events || []).find(e => e.id === eventId);
        if (!ev) return;
        eventType = ev.type || 'defense';
    }

    activeEventDetailCtx = {
        matchId: matchId === 'live' ? null : matchId,
        eventId: isNew ? null : eventId,
        eventType,
        isNew
    };

    renderEventDetailModalContent(isCoachMode);
    const modal = document.getElementById('event-detail-modal');
    if (modal) modal.classList.remove('hidden');
}

export function closeEventDetailModal() {
    const modal = document.getElementById('event-detail-modal');
    if (modal) modal.classList.add('hidden');
    activeEventDetailCtx = null;
}

export function refreshEventDetailModalMode(isCoachMode) {
    const modal = document.getElementById('event-detail-modal');
    if (!activeEventDetailCtx || !modal || modal.classList.contains('hidden')) return;
    renderEventDetailModalContent(isCoachMode);
}

function renderEventDetailModalContent(isCoachMode) {
    if (!activeEventDetailCtx) return;
    const { matchId, eventId, eventType, isNew } = activeEventDetailCtx;
    const target = getMatchById(matchId);
    if (!target) {
        closeEventDetailModal();
        return;
    }

    const ev = isNew
        ? (eventType === 'goal'
            ? { type: 'goal', time: matchId === null ? formatTimer(matchState.timerSeconds || 0) : '', scorerJersey: '', scorerName: '', assistJersey: null, assistName: null, phase: 'Open Play', finish: 'Right Foot', tag: '', video: '' }
            : eventType === 'opp_goal'
                ? { type: 'opp_goal', time: matchId === null ? formatTimer(matchState.timerSeconds || 0) : '', oppName: target.opponent || target.opponentName || 'Opponent', note: '' }
                : { type: 'defense', time: matchId === null ? formatTimer(matchState.timerSeconds || 0) : '', playerJersey: '', playerName: '', action: 'Key Defensive Tackle', note: '', video: '' })
        : (target.events || []).find(e => e.id === eventId);

    if (!ev) {
        closeEventDetailModal();
        return;
    }

    const badgeEl = document.getElementById('ev-detail-type-badge');
    const titleEl = document.getElementById('ev-detail-modal-title');
    const subtitleEl = document.getElementById('ev-detail-context-subtitle');
    const videoBar = document.getElementById('ev-detail-video-preview-bar');
    const watchBtn = document.getElementById('ev-detail-watch-clip-btn');
    const readonlyView = document.getElementById('ev-detail-readonly-view');
    const readonlyBody = document.getElementById('ev-detail-readonly-body');
    const editForm = document.getElementById('ev-detail-edit-form');
    const goalFields = document.getElementById('ev-detail-goal-fields');
    const oppFields = document.getElementById('ev-detail-opp-fields');
    const defFields = document.getElementById('ev-detail-def-fields');
    const deleteBtn = document.getElementById('ev-detail-delete-btn');
    const saveBtn = document.getElementById('ev-detail-save-btn');

    const matchLabel = matchId === null
        ? `Live Match vs ${matchState.opponentName || 'Opponent'}`
        : `vs ${target.opponent || 'Opponent'} (${target.date || 'Archived'})`;

    const { shortName } = getActiveTeamLabels();

    if (badgeEl) {
        if (eventType === 'goal') {
            badgeEl.textContent = `⚽ ${shortName} Goal`;
            badgeEl.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-950 text-blue-300 border border-blue-500/40';
        } else if (eventType === 'opp_goal') {
            badgeEl.textContent = '🥅 Opponent Goal';
            badgeEl.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-950 text-rose-300 border border-rose-500/40';
        } else {
            badgeEl.textContent = '🛡️ Defensive Stop / Save';
            badgeEl.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-500/40';
        }
    }

    if (titleEl) {
        if (isNew) {
            titleEl.textContent = eventType === 'goal' ? `Add ${shortName} Goal` : eventType === 'opp_goal' ? 'Add Opponent Goal' : 'Add Defensive Stop';
        } else {
            titleEl.textContent = isCoachMode ? 'Inspect & Edit Event' : 'Event Details';
        }
    }
    if (subtitleEl) subtitleEl.textContent = matchLabel;

    if (videoBar && watchBtn) {
        if (!isNew && ev.video) {
            videoBar.classList.remove('hidden');
            watchBtn.onclick = () => playEventVideo(matchId, ev.id);
        } else {
            videoBar.classList.add('hidden');
            watchBtn.onclick = null;
        }
    }

    if (!isCoachMode && !isNew) {
        if (editForm) editForm.classList.add('hidden');
        if (readonlyView) readonlyView.classList.remove('hidden');

        if (readonlyBody) {
            const row = (label, value, highlight = '') => `
                <div class="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/90">
                    <span class="text-[11px] font-bold text-zinc-400 uppercase tracking-wider shrink-0">${label}</span>
                    <span class="text-xs font-bold text-right ${highlight || 'text-white'}">${value}</span>
                </div>
            `;

            if (eventType === 'goal') {
                readonlyBody.innerHTML = [
                    row('Goal Scorer', `#${escapeHtml(ev.scorerJersey)} ${escapeHtml(ev.scorerName)}`, 'text-blue-300'),
                    row('Assist', ev.assistName ? `#${escapeHtml(ev.assistJersey)} ${escapeHtml(ev.assistName)}` : 'Unassisted (Solo)'),
                    row('Match Time', escapeHtml(ev.time || 'Not recorded'), 'text-amber-400 font-mono'),
                    row('Play Phase', escapeHtml(ev.phase || 'Not specified')),
                    row('Finish Type', escapeHtml(ev.finish || 'Not specified')),
                    row('Highlight Tag', escapeHtml(ev.tag || 'None')),
                    row('Video Clip', ev.video ? 'Attached (use Play Clip above)' : 'None', ev.video ? 'text-sky-300' : 'text-zinc-500')
                ].join('');
            } else if (eventType === 'opp_goal') {
                readonlyBody.innerHTML = [
                    row('Opponent / Scorer', escapeHtml(ev.oppName || target.opponent || 'Opponent'), 'text-rose-300'),
                    row('Match Time', escapeHtml(ev.time || 'Not recorded'), 'text-amber-400 font-mono'),
                    row('Notes', escapeHtml(ev.note || 'No notes recorded'), ev.note ? 'text-white' : 'text-zinc-500')
                ].join('');
            } else {
                readonlyBody.innerHTML = [
                    row('Player', `#${escapeHtml(ev.playerJersey)} ${escapeHtml(ev.playerName)}`, 'text-emerald-300'),
                    row('Action Type', escapeHtml(ev.action || 'Defensive Stop')),
                    row('Match Time', escapeHtml(ev.time || 'Not recorded'), 'text-amber-400 font-mono'),
                    row('Coach Note', escapeHtml(ev.note || 'No notes recorded'), ev.note ? 'text-white' : 'text-zinc-500'),
                    row('Video Clip', ev.video ? 'Attached (use Play Clip above)' : 'None', ev.video ? 'text-sky-300' : 'text-zinc-500')
                ].join('');
            }
        }
        return;
    }

    // Coach Mode (Editable form)
    if (readonlyView) readonlyView.classList.add('hidden');
    if (editForm) editForm.classList.remove('hidden');

    if (goalFields) goalFields.classList.toggle('hidden', eventType !== 'goal');
    if (oppFields) oppFields.classList.toggle('hidden', eventType !== 'opp_goal');
    if (defFields) defFields.classList.toggle('hidden', eventType !== 'defense');

    const goalScorerSel = document.getElementById('ev-edit-goal-scorer');
    const goalAssistSel = document.getElementById('ev-edit-goal-assist');
    const goalPhaseSel = document.getElementById('ev-edit-goal-phase');
    const goalFinishSel = document.getElementById('ev-edit-goal-finish');
    const goalTagInput = document.getElementById('ev-edit-goal-tag');
    const goalVideoInput = document.getElementById('ev-edit-goal-video');

    const oppNameInput = document.getElementById('ev-edit-opp-name');
    const oppNoteInput = document.getElementById('ev-edit-opp-note');

    const defPlayerSel = document.getElementById('ev-edit-def-player');
    const defActionSel = document.getElementById('ev-edit-def-action');
    const defNoteInput = document.getElementById('ev-edit-def-note');
    const defVideoInput = document.getElementById('ev-edit-def-video');

    const timeInput = document.getElementById('ev-edit-time');

    if (goalScorerSel) goalScorerSel.required = (eventType === 'goal');
    if (defPlayerSel) defPlayerSel.required = (eventType === 'defense');

    if (eventType === 'goal') {
        populatePlayerSelect(goalScorerSel, ev.scorerJersey, ev.scorerName, false);
        populatePlayerSelect(goalAssistSel, ev.assistJersey, ev.assistName, true);
        populateSelectWithOptions(goalPhaseSel, GOAL_PHASE_OPTIONS, ev.phase || 'Open Play');
        populateSelectWithOptions(goalFinishSel, GOAL_FINISH_OPTIONS, ev.finish || 'Right Foot');
        if (goalTagInput) goalTagInput.value = ev.tag || '';
        if (goalVideoInput) goalVideoInput.value = ev.video || '';
    } else if (eventType === 'opp_goal') {
        if (oppNameInput) oppNameInput.value = ev.oppName || target.opponent || target.opponentName || 'Opponent';
        if (oppNoteInput) oppNoteInput.value = ev.note || '';
    } else {
        populatePlayerSelect(defPlayerSel, ev.playerJersey, ev.playerName, false);
        populateSelectWithOptions(defActionSel, DEFENSE_ACTION_OPTIONS, ev.action || 'Key Defensive Tackle');
        if (defNoteInput) defNoteInput.value = ev.note || '';
        if (defVideoInput) defVideoInput.value = ev.video || '';
    }

    if (timeInput) timeInput.value = ev.time || '';
    if (deleteBtn) deleteBtn.classList.toggle('hidden', isNew);
    if (saveBtn) {
        saveBtn.textContent = isNew ? 'Add Event' : 'Save Changes';
        saveBtn.className = eventType === 'opp_goal'
            ? 'flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow transition'
            : eventType === 'defense'
                ? 'flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow transition'
                : 'flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow transition';
    }
}

export function saveEventDetail(e, leagueStandings, scheduleEvents, onUpdate) {
    if (e) e.preventDefault();
    if (!activeEventDetailCtx) return;

    const { matchId, eventId, eventType, isNew } = activeEventDetailCtx;
    const target = getMatchById(matchId);
    if (!target) return;
    if (!Array.isArray(target.events)) target.events = [];

    const allPlayers = getAllRosterPlayers(matchState);
    const timeVal = document.getElementById('ev-edit-time')?.value.trim() || (matchId === null ? formatTimer(matchState.timerSeconds || 0) : '00:00');

    let updatedEv = null;

    if (eventType === 'goal') {
        const scorerJersey = parseInt(document.getElementById('ev-edit-goal-scorer')?.value, 10);
        const assistRaw = document.getElementById('ev-edit-goal-assist')?.value;
        const assistJersey = assistRaw ? parseInt(assistRaw, 10) : null;
        const phase = document.getElementById('ev-edit-goal-phase')?.value || 'Open Play';
        const finish = document.getElementById('ev-edit-goal-finish')?.value || 'Right Foot';
        const customTag = document.getElementById('ev-edit-goal-tag')?.value.trim() || '';
        const video = document.getElementById('ev-edit-goal-video')?.value.trim() || '';

        const existing = !isNew ? target.events.find(ev => ev.id === eventId) : null;
        const scorerObj = allPlayers.find(p => p.jersey === scorerJersey);
        const assistObj = assistJersey !== null ? allPlayers.find(p => p.jersey === assistJersey) : null;

        updatedEv = {
            id: isNew ? Date.now() : eventId,
            type: 'goal',
            time: timeVal,
            scorerJersey: Number.isNaN(scorerJersey) ? (existing?.scorerJersey ?? 0) : scorerJersey,
            scorerName: scorerObj ? scorerObj.name : (existing && existing.scorerJersey === scorerJersey ? existing.scorerName : 'Scorer'),
            assistJersey,
            assistName: assistObj ? assistObj.name : (assistJersey !== null && existing && existing.assistJersey === assistJersey ? existing.assistName : null),
            phase,
            finish,
            tag: customTag || finish,
            video
        };
    } else if (eventType === 'opp_goal') {
        const oppName = document.getElementById('ev-edit-opp-name')?.value.trim() || target.opponent || target.opponentName || 'Opponent';
        const note = document.getElementById('ev-edit-opp-note')?.value.trim() || '';
        updatedEv = {
            id: isNew ? Date.now() : eventId,
            type: 'opp_goal',
            time: timeVal,
            oppName,
            note
        };
    } else {
        const playerJersey = parseInt(document.getElementById('ev-edit-def-player')?.value, 10);
        const action = document.getElementById('ev-edit-def-action')?.value || 'Key Defensive Tackle';
        const note = document.getElementById('ev-edit-def-note')?.value.trim() || '';
        const video = document.getElementById('ev-edit-def-video')?.value.trim() || '';
        const existing = !isNew ? target.events.find(ev => ev.id === eventId) : null;
        const playerObj = allPlayers.find(p => p.jersey === playerJersey);

        updatedEv = {
            id: isNew ? Date.now() : eventId,
            type: 'defense',
            time: timeVal,
            playerJersey: Number.isNaN(playerJersey) ? (existing?.playerJersey ?? 0) : playerJersey,
            playerName: playerObj ? playerObj.name : (existing && existing.playerJersey === playerJersey ? existing.playerName : 'Defender'),
            action,
            note,
            video
        };
    }

    if (isNew) {
        target.events.unshift(updatedEv);
        const st = ensureStatsObj(target);
        if (eventType === 'goal') {
            target.scoreUs = (target.scoreUs || 0) + 1;
            st.shotsUs += 1;
            st.sotUs += 1;
        } else if (eventType === 'opp_goal') {
            target.scoreThem = (target.scoreThem || 0) + 1;
            st.shotsThem += 1;
            st.sotThem += 1;
        } else if (eventType === 'defense') {
            st.savesUs += 1;
        }
    } else {
        const idx = target.events.findIndex(ev => ev.id === eventId);
        if (idx !== -1) {
            target.events[idx] = updatedEv;
        }
    }

    if (matchId === null) {
        // Live match scores always mirror live events
        let us = 0, them = 0;
        matchState.events.forEach(ev => {
            if (ev.type === 'goal') us++;
            if (ev.type === 'opp_goal') them++;
        });
        matchState.scoreUs = us;
        matchState.scoreThem = them;
    } else if (currentEditMatchId === matchId) {
        syncEditMatchModalFromMatch(target);
        renderEditMatchEvents();
    }

    closeEventDetailModal();
    savePersistentData(matchState, leagueStandings, scheduleEvents);
    if (typeof onUpdate === 'function') onUpdate();
}

export function deleteEventFromDetailModal(leagueStandings, scheduleEvents, onUpdate) {
    if (!activeEventDetailCtx || activeEventDetailCtx.isNew) return;
    const { matchId, eventId } = activeEventDetailCtx;
    const target = getMatchById(matchId);
    if (!target || !Array.isArray(target.events)) return;

    const removed = target.events.find(ev => ev.id === eventId);
    target.events = target.events.filter(ev => ev.id !== eventId);

    if (matchId === null) {
        let us = 0, them = 0;
        matchState.events.forEach(ev => {
            if (ev.type === 'goal') us++;
            if (ev.type === 'opp_goal') them++;
        });
        matchState.scoreUs = us;
        matchState.scoreThem = them;
    } else if (removed) {
        if (removed.type === 'goal') {
            target.scoreUs = Math.max(0, (target.scoreUs || 0) - 1);
        } else if (removed.type === 'opp_goal') {
            target.scoreThem = Math.max(0, (target.scoreThem || 0) - 1);
        }
        if (currentEditMatchId === matchId) {
            syncEditMatchModalFromMatch(target);
            renderEditMatchEvents();
        }
    }

    closeEventDetailModal();
    savePersistentData(matchState, leagueStandings, scheduleEvents);
    if (typeof onUpdate === 'function') onUpdate();
}

// ================= FULL MATCH REVIEW MODAL =================

export function openMatchReviewModal(matchId, isCoachMode) {
    const normalizedId = matchId === 'live' ? null : matchId;
    const target = getMatchById(normalizedId);
    if (!target) return;

    activeReviewMatchId = normalizedId;
    renderMatchReviewContent(isCoachMode);

    const modal = document.getElementById('match-review-modal');
    if (modal) modal.classList.remove('hidden');
}

export function closeMatchReviewModal() {
    const modal = document.getElementById('match-review-modal');
    if (modal) modal.classList.add('hidden');
    activeReviewMatchId = undefined;
}

export function refreshOpenMatchReview(isCoachMode) {
    const modal = document.getElementById('match-review-modal');
    if (activeReviewMatchId === undefined || !modal || modal.classList.contains('hidden')) return;
    renderMatchReviewContent(isCoachMode);
}

export function adjustReviewStat(matchId, key, amount, leagueStandings, scheduleEvents, onUpdate) {
    const normalizedId = matchId === 'live' ? null : matchId;
    const target = getMatchById(normalizedId);
    if (!target) return;
    const st = ensureStatsObj(target);
    st[key] = Math.max(0, (st[key] || 0) + amount);
    if (normalizedId !== null && currentEditMatchId === normalizedId) {
        syncEditMatchModalFromMatch(target);
    }
    savePersistentData(matchState, leagueStandings, scheduleEvents);
    if (typeof onUpdate === 'function') onUpdate();
}

function buildPlayerBoxScore(match) {
    const allPlayers = getAllRosterPlayers(matchState);
    const map = new Map();

    const ensureEntry = (jersey, fallbackName) => {
        const key = String(jersey ?? fallbackName ?? 'unknown');
        if (!map.has(key)) {
            const rosterMatch = allPlayers.find(p => p.jersey === Number(jersey));
            map.set(key, {
                jersey: jersey ?? '?',
                name: rosterMatch ? rosterMatch.name : (fallbackName || 'Player'),
                position: rosterMatch ? rosterMatch.position : '',
                goals: 0,
                assists: 0,
                stops: 0,
                isMotm: false
            });
        }
        return map.get(key);
    };

    (match.events || []).forEach(ev => {
        if (ev.type === 'goal') {
            const scorer = ensureEntry(ev.scorerJersey, ev.scorerName);
            scorer.goals += 1;
            if (ev.assistName || (ev.assistJersey !== null && ev.assistJersey !== undefined)) {
                const assister = ensureEntry(ev.assistJersey, ev.assistName);
                assister.assists += 1;
            }
        } else if (ev.type === 'defense') {
            const def = ensureEntry(ev.playerJersey, ev.playerName);
            def.stops += 1;
        }
    });

    if (match.motmJersey) {
        const rosterMotm = allPlayers.find(p => p.jersey === Number(match.motmJersey));
        const motmEntry = ensureEntry(match.motmJersey, match.motmName || rosterMotm?.name || 'MOTM');
        motmEntry.isMotm = true;
    }

    return Array.from(map.values()).sort((a, b) => {
        const scoreB = b.goals * 4 + b.assists * 3 + b.stops * 2 + (b.isMotm ? 1 : 0);
        const scoreA = a.goals * 4 + a.assists * 3 + a.stops * 2 + (a.isMotm ? 1 : 0);
        if (scoreB !== scoreA) return scoreB - scoreA;
        return Number(a.jersey) - Number(b.jersey);
    });
}

function renderReviewStatRow(label, usKey, themKey, usVal, themVal, matchArg, isCoachMode) {
    const total = usVal + themVal;
    const usPct = total === 0 ? 50 : Math.round((usVal / total) * 100);
    const themPct = 100 - usPct;

    return `
    <div class="space-y-1.5">
        <div class="flex items-center justify-between gap-2 text-xs font-bold">
            <div class="flex items-center space-x-1.5 min-w-[84px]">
                ${isCoachMode ? `<button type="button" onclick="window.adjustReviewStat(${matchArg}, '${usKey}', -1)" class="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-black text-xs flex items-center justify-center border border-zinc-700 active:scale-95">−</button>` : ''}
                <span class="min-w-6 text-center font-black text-sm text-blue-300 font-mono">${usVal}</span>
                ${isCoachMode ? `<button type="button" onclick="window.adjustReviewStat(${matchArg}, '${usKey}', 1)" class="w-6 h-6 rounded-lg bg-blue-900/80 hover:bg-blue-800 text-blue-200 font-black text-xs flex items-center justify-center border border-blue-500/50 active:scale-95">+</button>` : ''}
            </div>
            <div class="text-center flex-1">
                <span class="text-[11px] text-zinc-300 uppercase font-extrabold tracking-wider">${label}</span>
                ${total > 0 ? `<span class="block text-[9px] font-mono text-zinc-500">${usPct}% — ${themPct}%</span>` : ''}
            </div>
            <div class="flex items-center justify-end space-x-1.5 min-w-[84px]">
                ${isCoachMode ? `<button type="button" onclick="window.adjustReviewStat(${matchArg}, '${themKey}', -1)" class="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-black text-xs flex items-center justify-center border border-zinc-700 active:scale-95">−</button>` : ''}
                <span class="min-w-6 text-center font-black text-sm text-amber-300 font-mono">${themVal}</span>
                ${isCoachMode ? `<button type="button" onclick="window.adjustReviewStat(${matchArg}, '${themKey}', 1)" class="w-6 h-6 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-amber-200 font-black text-xs flex items-center justify-center border border-amber-500/50 active:scale-95">+</button>` : ''}
            </div>
        </div>
        <div class="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
            <div class="bg-blue-600 h-full transition-all duration-300" style="width: ${usPct}%;"></div>
            <div class="bg-amber-500 h-full transition-all duration-300" style="width: ${themPct}%;"></div>
        </div>
    </div>
    `;
}

function renderMatchReviewContent(isCoachMode) {
    const container = document.getElementById('match-review-content');
    if (!container) return;

    const match = getMatchById(activeReviewMatchId);
    if (!match) {
        closeMatchReviewModal();
        return;
    }

    const isLive = activeReviewMatchId === null;
    const matchArg = isLive ? 'null' : String(match.id);
    const opponent = isLive ? (match.opponentName || 'Opponent') : (match.opponent || 'Opponent');
    const dateLabel = isLive ? (match.isFinal || match.period === 'Full Time' ? 'Full Time (Unarchived)' : `Live • ${match.period || '1st Half'} (${formatTimer(match.timerSeconds || 0)})`) : (match.date || 'Archived Match');
    const scoreUs = match.scoreUs || 0;
    const scoreThem = match.scoreThem || 0;
    const isWin = scoreUs > scoreThem;
    const isDraw = scoreUs === scoreThem;
    const resultLabel = isLive && !match.isFinal && match.period !== 'Full Time' ? 'IN PROGRESS' : (isWin ? 'WIN' : isDraw ? 'DRAW' : 'LOSS');
    const resultClass = resultLabel === 'IN PROGRESS'
        ? 'bg-blue-950 text-blue-300 border-blue-500/40'
        : isWin
            ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
            : isDraw
                ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                : 'bg-rose-950 text-rose-300 border-rose-500/40';

    const st = ensureStatsObj(match);
    const events = Array.isArray(match.events) ? match.events : [];
    const allPlayers = getAllRosterPlayers(matchState);

    let motmDisplay = 'Not Crowned';
    if (match.motmJersey) {
        const mp = allPlayers.find(p => p.jersey === Number(match.motmJersey));
        const mName = mp ? mp.name : (match.motmName || 'Assigned');
        motmDisplay = `#${match.motmJersey} ${mName}`;
    } else if (match.motmName && match.motmName !== 'Unassigned') {
        motmDisplay = match.motmName;
    }

    // Derived analytics KPIs
    const totalUsShots = Math.max(st.shotsUs, st.sotUs);
    const shotAccPct = totalUsShots > 0 ? Math.min(100, Math.round((st.sotUs / totalUsShots) * 100)) : null;
    const conversionDenom = st.sotUs > 0 ? st.sotUs : totalUsShots;
    const conversionPct = conversionDenom > 0 ? Math.min(100, Math.round((scoreUs / conversionDenom) * 100)) : null;
    const saveDenom = st.savesUs + scoreThem;
    const saveRatePct = saveDenom > 0 ? Math.round((st.savesUs / saveDenom) * 100) : null;
    const isCleanSheet = scoreThem === 0 && (scoreUs > 0 || !isLive || match.isFinal || events.length > 0 || st.savesUs > 0);

    const goalsCount = events.filter(e => e.type === 'goal').length;
    const stopsCount = events.filter(e => e.type === 'defense').length;
    const oppGoalsCount = events.filter(e => e.type === 'opp_goal').length;

    const boxScore = buildPlayerBoxScore(match);

    const { teamName, shortName } = getActiveTeamLabels();

    // Penalty Shootout section if present
    const sh = match.shootout;
    const hasShootout = sh && (sh.active || (sh.usKicks && sh.usKicks.length > 0) || (sh.themKicks && sh.themKicks.length > 0));
    const shootoutHtml = hasShootout ? `
        <div class="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-2">
            <div class="flex items-center justify-between">
                <span class="text-[11px] font-black uppercase tracking-wider text-purple-300">🎯 Penalty Shootout</span>
                <span class="text-xs font-mono font-black text-white">${(sh.usKicks || []).filter(Boolean).length} - ${(sh.themKicks || []).filter(Boolean).length} PK</span>
            </div>
            <div class="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                    <span class="text-blue-300 font-bold block mb-1">${escapeHtml(shortName)}</span>
                    <div class="flex flex-wrap gap-1">${renderKickBubbles(sh.usKicks || [])}</div>
                </div>
                <div>
                    <span class="text-amber-300 font-bold block mb-1">${escapeHtml(opponent)}</span>
                    <div class="flex flex-wrap gap-1">${renderKickBubbles(sh.themKicks || [])}</div>
                </div>
            </div>
        </div>
    ` : '';

    container.innerHTML = `
        <!-- Top Header -->
        <div class="flex flex-wrap items-start justify-between gap-2 border-b border-zinc-800 pb-3">
            <div>
                <div class="flex flex-wrap items-center gap-2">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${resultClass}">${resultLabel}</span>
                    <span class="text-[11px] font-semibold text-zinc-400">${escapeHtml(dateLabel)}</span>
                </div>
                <h3 class="text-lg sm:text-xl font-black text-white mt-1">Full Match Review</h3>
            </div>
            <div class="flex items-center space-x-1.5">
                <button type="button" onclick="window.copyMatchReviewSummary(${matchArg}, this)" class="px-2.5 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold transition">
                    📋 Copy Summary
                </button>
                ${!isLive && isCoachMode ? `
                    <button type="button" onclick="window.openEditMatchModal(${match.id})" class="px-2.5 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/35 border border-amber-500/40 text-amber-300 text-[11px] font-bold transition">
                        ✏️ Edit Match
                    </button>
                ` : ''}
                ${!isCoachMode ? `
                    <button type="button" onclick="window.unlockCoachToEditEvent()" class="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-amber-300 text-[11px] font-bold transition" title="Unlock Coach Mode to edit stats and events">
                        🔓 Edit
                    </button>
                ` : ''}
                <button type="button" onclick="window.closeMatchReviewModal()" class="text-zinc-400 hover:text-white text-xl font-bold px-1.5 leading-none">&times;</button>
            </div>
        </div>

        <!-- Scoreboard Hero -->
        <div class="p-4 sm:p-5 rounded-2xl brand-review-hero border border-blue-500/25 space-y-3">
            <div class="grid grid-cols-7 items-center text-center gap-2">
                <div class="col-span-3 space-y-1">
                    <span class="text-[10px] font-black uppercase tracking-widest text-blue-300">${escapeHtml(teamName)}</span>
                    <div class="text-4xl sm:text-5xl font-black text-white font-mono">${scoreUs}</div>
                </div>
                <div class="col-span-1 text-xs font-black text-zinc-500 uppercase">VS</div>
                <div class="col-span-3 space-y-1">
                    <span class="text-[10px] font-black uppercase tracking-widest text-amber-300 truncate block">${escapeHtml(opponent)}</span>
                    <div class="text-4xl sm:text-5xl font-black text-white font-mono">${scoreThem}</div>
                </div>
            </div>
            <div class="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-white/10 text-xs">
                <span class="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 font-bold">
                    <span>🎖️</span>
                    <span>MOTM: ${escapeHtml(motmDisplay)}</span>
                </span>
                ${isCleanSheet ? `
                    <span class="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-400/35 text-teal-300 font-bold">
                        <span>🧤</span>
                        <span>Clean Sheet</span>
                    </span>
                ` : ''}
            </div>
        </div>

        ${shootoutHtml}

        <!-- Derived Analytics KPIs -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div class="p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
                <span class="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">Shot Accuracy</span>
                <span class="text-lg font-black font-mono text-blue-300">${shotAccPct !== null ? `${shotAccPct}%` : '—'}</span>
                <span class="block text-[10px] text-zinc-500">${st.sotUs} on target / ${totalUsShots}</span>
            </div>
            <div class="p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
                <span class="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">Conversion</span>
                <span class="text-lg font-black font-mono text-emerald-300">${conversionPct !== null ? `${conversionPct}%` : '—'}</span>
                <span class="block text-[10px] text-zinc-500">${scoreUs}G on ${conversionDenom} ${st.sotUs > 0 ? 'SOT' : 'shots'}</span>
            </div>
            <div class="p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
                <span class="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">GK Save Rate</span>
                <span class="text-lg font-black font-mono text-teal-300">${saveRatePct !== null ? `${saveRatePct}%` : '—'}</span>
                <span class="block text-[10px] text-zinc-500">${st.savesUs} saves • ${scoreThem} GA</span>
            </div>
            <div class="p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
                <span class="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">Logged Events</span>
                <span class="text-lg font-black font-mono text-amber-300">${events.length}</span>
                <span class="block text-[10px] text-zinc-500">${goalsCount}G • ${stopsCount}D • ${oppGoalsCount} Opp</span>
            </div>
        </div>

        <!-- Complete Team Statistics Comparison -->
        <div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3.5">
            <div class="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div>
                    <h4 class="text-xs font-black uppercase tracking-wider text-white">📊 Match Statistics</h4>
                    ${isCoachMode ? `<p class="text-[10px] text-emerald-400 mt-0.5">Coach Mode active — adjust any stat directly below.</p>` : ''}
                </div>
                <div class="flex items-center space-x-3 text-[11px] font-bold">
                    <span class="text-blue-400">${escapeHtml(shortName)}</span>
                    <span class="text-zinc-500">vs</span>
                    <span class="text-amber-400 truncate max-w-[110px]">${escapeHtml(opponent)}</span>
                </div>
            </div>
            <div class="space-y-3">
                ${renderReviewStatRow('Shots on Target', 'sotUs', 'sotThem', st.sotUs, st.sotThem, matchArg, isCoachMode)}
                ${renderReviewStatRow('Total Shots', 'shotsUs', 'shotsThem', st.shotsUs, st.shotsThem, matchArg, isCoachMode)}
                ${renderReviewStatRow('Goalkeeper Saves', 'savesUs', 'savesThem', st.savesUs, st.savesThem, matchArg, isCoachMode)}
                ${renderReviewStatRow('Corner Kicks', 'cornersUs', 'cornersThem', st.cornersUs, st.cornersThem, matchArg, isCoachMode)}
            </div>
        </div>

        <!-- Player Performance Box Score -->
        <div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div class="flex items-center justify-between border-b border-zinc-800 pb-2">
                <h4 class="text-xs font-black uppercase tracking-wider text-white">⭐ Player Box Score</h4>
                <span class="text-[10px] text-zinc-500">${boxScore.length} contributor${boxScore.length === 1 ? '' : 's'}</span>
            </div>
            ${boxScore.length === 0 ? `
                <p class="text-xs text-zinc-500 italic text-center py-3">No individual player events recorded for this match yet.</p>
            ` : `
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr class="border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-400">
                                <th class="py-2 pr-2">Player</th>
                                <th class="py-2 px-2 text-center text-blue-300">G</th>
                                <th class="py-2 px-2 text-center text-sky-300">A</th>
                                <th class="py-2 px-2 text-center text-emerald-300">Stops</th>
                                <th class="py-2 pl-2 text-right text-amber-300">Award</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-zinc-800/60">
                            ${boxScore.map(p => `
                                <tr>
                                    <td class="py-2 pr-2 font-bold text-white">
                                        <span class="text-zinc-400 font-mono mr-1">#${escapeHtml(p.jersey)}</span>${escapeHtml(p.name)}
                                    </td>
                                    <td class="py-2 px-2 text-center font-mono font-black ${p.goals > 0 ? 'text-blue-300' : 'text-zinc-600'}">${p.goals}</td>
                                    <td class="py-2 px-2 text-center font-mono font-black ${p.assists > 0 ? 'text-sky-300' : 'text-zinc-600'}">${p.assists}</td>
                                    <td class="py-2 px-2 text-center font-mono font-black ${p.stops > 0 ? 'text-emerald-300' : 'text-zinc-600'}">${p.stops}</td>
                                    <td class="py-2 pl-2 text-right">
                                        ${p.isMotm ? `<span class="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-[10px] font-black text-amber-300">🎖️ MOTM</span>` : `<span class="text-zinc-700">—</span>`}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        </div>

        <!-- Complete Play-by-Play Timeline -->
        <div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
                <div>
                    <h4 class="text-xs font-black uppercase tracking-wider text-white">⏱️ Complete Play-by-Play (${events.length})</h4>
                    <p class="text-[10px] text-zinc-400 mt-0.5">Tap any event to see all recorded details${isCoachMode ? ' or edit/delete it' : ''}.</p>
                </div>
                ${isCoachMode ? `
                    <div class="flex items-center space-x-1.5">
                        <button type="button" onclick="window.openEventDetailModal(${matchArg}, null, 'goal')" class="px-2 py-1 rounded-lg bg-blue-900/70 hover:bg-blue-800 border border-blue-500/40 text-[10px] font-bold text-blue-200">+ ⚽ Goal</button>
                        <button type="button" onclick="window.openEventDetailModal(${matchArg}, null, 'opp_goal')" class="px-2 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-[10px] font-bold text-rose-200">+ 🥅 Opp</button>
                        <button type="button" onclick="window.openEventDetailModal(${matchArg}, null, 'defense')" class="px-2 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-[10px] font-bold text-emerald-200">+ 🛡️ Stop</button>
                    </div>
                ` : ''}
            </div>
            <div class="space-y-2">
                ${events.length === 0
                    ? `<p class="text-xs text-zinc-500 italic text-center py-4">No events logged for this match.</p>`
                    : events.map(ev => renderTimelineEventCard(ev, activeReviewMatchId, isCoachMode, false)).join('')
                }
            </div>
        </div>
    `;
}

export async function copyMatchReviewSummary(matchId, btnEl) {
    const normalizedId = matchId === 'live' ? null : matchId;
    const match = getMatchById(normalizedId);
    if (!match) return;

    const isLive = normalizedId === null;
    const opponent = isLive ? (match.opponentName || 'Opponent') : (match.opponent || 'Opponent');
    const dateStr = isLive ? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : (match.date || '');
    const st = ensureStatsObj(match);
    const events = Array.isArray(match.events) ? match.events : [];
    const allPlayers = getAllRosterPlayers(matchState);

    let motmText = 'Not Assigned';
    if (match.motmJersey) {
        const mp = allPlayers.find(p => p.jersey === Number(match.motmJersey));
        motmText = `#${match.motmJersey} ${mp ? mp.name : (match.motmName || '')}`.trim();
    } else if (match.motmName && match.motmName !== 'Unassigned') {
        motmText = match.motmName;
    }

    const { teamName, shortName } = getActiveTeamLabels();

    const lines = [
        `⚽ ${teamName} vs ${opponent}`,
        `📅 ${dateStr}`,
        `🏆 Final Score: ${shortName} ${match.scoreUs || 0} - ${match.scoreThem || 0} ${opponent}`,
        `🎖️ MOTM: ${motmText}`,
        ``,
        `📊 Match Stats (${shortName} vs ${opponent}):`,
        `• Shots on Target: ${st.sotUs} - ${st.sotThem}`,
        `• Total Shots: ${st.shotsUs} - ${st.shotsThem}`,
        `• GK Saves: ${st.savesUs} - ${st.savesThem}`,
        `• Corner Kicks: ${st.cornersUs} - ${st.cornersThem}`
    ];

    const goals = events.filter(e => e.type === 'goal');
    if (goals.length > 0) {
        lines.push(``, `⚽ ${shortName} Goals:`);
        goals.forEach(g => {
            const ast = g.assistName ? ` (Ast: #${g.assistJersey} ${g.assistName})` : ' (Solo)';
            const details = [g.phase, g.finish, g.tag && g.tag !== g.finish ? g.tag : ''].filter(Boolean).join(' • ');
            lines.push(`• [${g.time || '--:--'}] #${g.scorerJersey} ${g.scorerName}${ast}${details ? ` — ${details}` : ''}`);
        });
    }

    const stops = events.filter(e => e.type === 'defense');
    if (stops.length > 0) {
        lines.push(``, `🛡️ Defensive Stops:`);
        stops.forEach(d => {
            lines.push(`• [${d.time || '--:--'}] #${d.playerJersey} ${d.playerName} — ${d.action}${d.note ? ` (${d.note})` : ''}`);
        });
    }

    const summaryText = lines.join('\n');
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(summaryText);
        } else {
            const ta = document.createElement('textarea');
            ta.value = summaryText;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
        if (btnEl) {
            const orig = btnEl.innerHTML;
            btnEl.innerHTML = '✓ Copied!';
            setTimeout(() => { btnEl.innerHTML = orig; }, 1800);
        }
    } catch {}
}
