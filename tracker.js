import { players } from './roster.js';
import { savePersistentData, resolveFirebaseMediaUrl } from './firebase.js';

export const initialPastMatches = [
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
        motmName: "Yazed (Zizou) Manasrah",
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

export let matchState = (() => {
    let state = null;
    try {
        const saved = localStorage.getItem('rfc14_match_state');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Verify not corrupt with fake mock id
            if (parsed && Array.isArray(parsed.history) && !parsed.history.some(m => m.id === 101 || (m.motmJersey === 4 && m.opponent?.includes('CWFC')))) {
                state = parsed;
            }
        }
    } catch {}

    if (!state || typeof state !== 'object') {
        state = {
            scoreUs: 0,
            scoreThem: 0,
            opponentName: "CWFC B2014 Green",
            timerSeconds: 0,
            timerRunning: false,
            period: "1st Half",
            isFinal: false,
            motmJersey: null,
            events: [],
            shootout: { active: false, usKicks: [], themKicks: [] },
            stats: { shotsUs: 0, shotsThem: 0, sotUs: 0, sotThem: 0, savesUs: 0, savesThem: 0, cornersUs: 0, cornersThem: 0 },
            history: JSON.parse(JSON.stringify(initialPastMatches))
        };
    }

    if (!Array.isArray(state.history) || state.history.length === 0) {
        state.history = JSON.parse(JSON.stringify(initialPastMatches));
    }
    return state;
})();

let timerInterval = null;
let currentEditingEventId = null;
let currentEditMatchId = null;

export function updateMatchState(newState) {
    matchState = { ...matchState, ...newState };
}

export function formatTimer(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

export function setMatchPeriod(period, leagueStandings, scheduleEvents) {
    matchState.period = period;
    const badge = document.getElementById('match-period-badge');
    if (badge) badge.textContent = period;

    const shootoutCard = document.getElementById('shootout-card');
    if (period === 'Penalties') {
        matchState.shootout.active = true;
        if (shootoutCard) shootoutCard.classList.remove('hidden');
        pauseTimer();
    } else {
        if (shootoutCard) shootoutCard.classList.add('hidden');
    }

    if (period === '2nd Half' && matchState.timerSeconds < 35 * 60) {
        matchState.timerSeconds = 35 * 60;
        const display = document.getElementById('timer-display');
        if (display) display.textContent = formatTimer(matchState.timerSeconds);
    } else if (period === 'Halftime') {
        pauseTimer();
    } else if (period === 'Full Time') {
        pauseTimer();
        matchState.isFinal = true;
    }

    updateMatchFinalBanner();
    savePersistentData(matchState, leagueStandings, scheduleEvents);
}

export function updateMatchFinalBanner() {
    const banner = document.getElementById('box-final-match-banner');
    const resultText = document.getElementById('final-banner-result-text');
    const headerText = document.getElementById('match-header-status-text');
    const pulseDot = document.getElementById('match-live-pulse-dot');
    const endBtnLabel = document.getElementById('btn-end-match-label');

    if (matchState.period === 'Full Time' || matchState.isFinal) {
        if (banner) banner.classList.remove('hidden');
        if (resultText) {
            const us = matchState.scoreUs;
            const them = matchState.scoreThem;
            const outcome = us > them ? 'Rockies WIN 🎉' : (us === them ? 'DRAW 🤝' : 'Opponent WIN');
            resultText.textContent = `FINAL SCORE: Rockies ${us} - ${them} ${matchState.opponentName} (${outcome})`;
        }
        if (headerText) headerText.textContent = "MATCH COMPLETED (FINAL)";
        if (pulseDot) pulseDot.className = "inline-block w-2.5 h-2.5 rounded-full bg-emerald-400";
        if (endBtnLabel) endBtnLabel.textContent = "Archive Match";
    } else {
        if (banner) banner.classList.add('hidden');
        if (headerText) headerText.textContent = "CMSA LEAGUE MATCH";
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
    const usEl = document.getElementById(usId);
    const themEl = document.getElementById(themId);
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
            const p = players.find(r => r.jersey === matchState.motmJersey);
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
    if (timerDisplayEl) timerDisplayEl.textContent = formatTimer(matchState.timerSeconds);
    if (periodBadgeEl) periodBadgeEl.textContent = matchState.period || "1st Half";

    updateMatchFinalBanner();

    const motmBox = document.getElementById('motm-name-display');
    if (motmBox) {
        if (matchState.motmJersey) {
            const p = players.find(r => r.jersey === matchState.motmJersey);
            motmBox.textContent = p ? `Man of the Match: #${p.jersey} ${p.name} 🎖️` : 'Man of the Match: Assigned';
        } else {
            motmBox.textContent = "Man of the Match: Not Crowned Yet";
        }
    }

    const motmSelect = document.getElementById('motm-player-select');
    if (motmSelect) {
        motmSelect.innerHTML = '<option value="">Select MOTM...</option>' + players.map(p => `<option value="${p.jersey}" ${matchState.motmJersey === p.jersey ? 'selected' : ''}>#${p.jersey} ${p.name}</option>`).join('');
    }

    const timeline = document.getElementById('match-timeline-list');
    const eventCount = document.getElementById('match-event-count');
    if (eventCount) eventCount.textContent = `${matchState.events.length} Events Logged`;

    if (timeline) {
        if (matchState.events.length === 0) {
            timeline.innerHTML = `<p class="text-xs text-zinc-500 italic text-center py-4">No match events logged yet.</p>`;
        } else {
            timeline.innerHTML = matchState.events.map(ev => {
                if (ev.type === 'goal') {
                    const originText = ev.phase ? `${ev.phase} ➔ ` : '';
                    const finishText = ev.finish || ev.tag || '';
                    return `
                    <div class="flex items-center justify-between p-3 rounded-2xl bg-blue-950/40 border border-blue-500/30">
                        <div class="flex items-center space-x-3">
                            <span class="text-lg">⚽</span>
                            <div>
                                <div class="flex flex-wrap items-center gap-1.5">
                                    <span class="text-xs font-black text-white">#${ev.scorerJersey} ${ev.scorerName}</span>
                                    ${originText ? `<span class="text-[10px] bg-amber-950 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold">${originText}${finishText}</span>` : `<span class="text-[10px] bg-blue-900 text-blue-200 px-1.5 py-0.2 rounded font-bold">${ev.tag}</span>`}
                                    ${ev.video ? `<button onclick="window.openVideoClipModal('${ev.video}', '#${ev.scorerJersey} ${ev.scorerName} Goal', '${ev.time}')" class="text-[10px] bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-500/40 px-1.5 py-0.2 rounded font-bold flex items-center space-x-1"><span>▶</span><span>Clip</span></button>` : ''}
                                </div>
                                <p class="text-[10px] text-zinc-400 mt-0.5">
                                    ${ev.assistName ? `Assist: #${ev.assistJersey} ${ev.assistName}` : 'Unassisted (Solo)'}
                                </p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="text-xs font-mono font-bold text-amber-400">${ev.time}</span>
                            ${isCoachMode ? `<button onclick="window.deleteMatchEvent(${ev.id})" class="text-zinc-500 hover:text-rose-400 text-sm px-1" title="Delete Event">&times;</button>` : ''}
                        </div>
                    </div>
                    `;
                } else if (ev.type === 'opp_goal') {
                    return `
                    <div class="flex items-center justify-between p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30">
                        <div class="flex items-center space-x-3">
                            <span class="text-lg">⚽</span>
                            <div>
                                <span class="text-xs font-black text-rose-300">${ev.oppName} Goal</span>
                                ${ev.note ? `<p class="text-[10px] text-zinc-400 mt-0.5">${ev.note}</p>` : ''}
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="text-xs font-mono font-bold text-amber-400">${ev.time}</span>
                            ${isCoachMode ? `<button onclick="window.deleteMatchEvent(${ev.id})" class="text-zinc-500 hover:text-rose-400 text-sm px-1" title="Delete Event">&times;</button>` : ''}
                        </div>
                    </div>
                    `;
                } else {
                    return `
                    <div class="flex items-center justify-between p-3 rounded-2xl bg-teal-950/30 border border-teal-500/30">
                        <div class="flex items-center space-x-3">
                            <span class="text-lg">🛡️</span>
                            <div>
                                <div class="flex flex-wrap items-center gap-1.5">
                                    <span class="text-xs font-black text-white">#${ev.playerJersey} ${ev.playerName}</span>
                                    <span class="text-[10px] bg-teal-900 text-teal-200 px-1.5 py-0.2 rounded font-bold">${ev.action}</span>
                                    ${ev.video ? `<button onclick="window.openVideoClipModal('${ev.video}', '#${ev.playerJersey} ${ev.playerName} Defensive Stop', '${ev.time}')" class="text-[10px] bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-500/40 px-1.5 py-0.2 rounded font-bold flex items-center space-x-1"><span>▶</span><span>Clip</span></button>` : ''}
                                </div>
                                ${ev.note ? `<p class="text-[10px] text-zinc-400 mt-0.5">${ev.note}</p>` : ''}
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="text-xs font-mono font-bold text-amber-400">${ev.time}</span>
                            ${isCoachMode ? `<button onclick="window.deleteMatchEvent(${ev.id})" class="text-zinc-500 hover:text-rose-400 text-sm px-1" title="Delete Event">&times;</button>` : ''}
                        </div>
                    </div>
                    `;
                }
            }).join('');
        }
    }

    renderStatsComparison();
    renderShootout();
    renderPastMatches(isCoachMode);
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
        return `
        <div class="flex items-center justify-between p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs">
            <div>
                <div class="flex items-center space-x-2">
                    <span class="font-extrabold text-white">vs ${m.opponent}</span>
                    <span class="${isWin ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' : (isDraw ? 'bg-amber-950 text-amber-300 border-amber-500/40' : 'bg-rose-950 text-rose-300 border-rose-500/40')} border text-[10px] px-1.5 py-0.2 rounded font-bold uppercase">
                        ${isWin ? 'WIN' : (isDraw ? 'DRAW' : 'LOSS')}
                    </span>
                </div>
                <p class="text-[10px] text-zinc-400 mt-0.5">${m.date} • ${m.motmName ? `🎖️ MOTM: ${m.motmName}` : 'No MOTM recorded'}</p>
            </div>
            <div class="text-right">
                <span class="text-sm font-black text-white font-mono">${m.scoreUs} - ${m.scoreThem}</span>
                ${isCoachMode ? `<button onclick="window.openEditMatchModal(${m.id})" class="block w-full text-right mt-1.5 text-[10px] text-blue-400 hover:text-blue-300 font-bold underline transition">Edit Match</button>` : ''}
            </div>
        </div>
        `;
    }).join('');
}

// Goal Recording Form Handling
export function openGoalModal() {
    const selScorer = document.getElementById('goal-scorer-select');
    const selAssist = document.getElementById('goal-assist-select');
    if (selScorer) {
        selScorer.innerHTML = players.map(p => `<option value="${p.jersey}">#${p.jersey} ${p.name} (${p.position})</option>`).join('');
    }
    if (selAssist) {
        selAssist.innerHTML = '<option value="">None (Solo / Unassisted)</option>' + players.map(p => `<option value="${p.jersey}">#${p.jersey} ${p.name}</option>`).join('');
    }
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

    const scorer = players.find(p => p.jersey === scorerJersey);
    const assist = assistJersey ? players.find(p => p.jersey === assistJersey) : null;
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
    if (inputName) inputName.value = matchState.opponentName || 'Opponent';
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
    if (selDef) {
        selDef.innerHTML = players.map(p => `<option value="${p.jersey}">#${p.jersey} ${p.name} (${p.position})</option>`).join('');
    }
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
    const p = players.find(r => r.jersey === playerJersey);
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
    const motmP = players.find(p => p.jersey === matchState.motmJersey);
    matchState.history.unshift({
        id: Date.now(),
        opponent: matchState.opponentName || 'Opponent',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        scoreUs: matchState.scoreUs,
        scoreThem: matchState.scoreThem,
        motmJersey: matchState.motmJersey,
        motmName: motmP ? motmP.name : 'Unassigned',
        events: [...matchState.events],
        stats: { ...matchState.stats }
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
    matchState.stats = { shotsUs: 0, shotsThem: 0, sotUs: 0, sotThem: 0, savesUs: 0, savesThem: 0, cornersUs: 0, cornersThem: 0 };

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
    matchState.stats = { shotsUs: 0, shotsThem: 0, sotUs: 0, sotThem: 0, savesUs: 0, savesThem: 0, cornersUs: 0, cornersThem: 0 };

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
            container.innerHTML = `<video src="${playableUrl}" controls autoplay playsinline class="w-full h-auto max-h-[60vh] object-contain rounded-xl"></video>`;
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

// Edit Past Match Modal
export function openEditMatchModal(id) {
    const match = matchState.history.find(m => m.id === id);
    if (!match) return;
    currentEditMatchId = id;

    const oppInput = document.getElementById('edit-match-opponent');
    const dateInput = document.getElementById('edit-match-date');
    const scoreUsInput = document.getElementById('edit-match-score-us');
    const scoreThemInput = document.getElementById('edit-match-score-them');
    const motmSelect = document.getElementById('edit-match-motm');

    if (oppInput) oppInput.value = match.opponent || '';
    if (dateInput) dateInput.value = match.date || '';
    if (scoreUsInput) scoreUsInput.value = match.scoreUs;
    if (scoreThemInput) scoreThemInput.value = match.scoreThem;

    if (motmSelect) {
        motmSelect.innerHTML = '<option value="">None</option>' + players.map(p => `<option value="${p.jersey}" ${match.motmJersey === p.jersey ? 'selected' : ''}>#${p.jersey} ${p.name}</option>`).join('');
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
    if (!match || !match.events || match.events.length === 0) {
        list.innerHTML = `<p class="text-[10px] text-zinc-500 italic text-center py-4">No events logged.</p>`;
        return;
    }
    list.innerHTML = match.events.map(ev => `
        <div class="flex items-center justify-between p-2 rounded-lg border bg-zinc-900 border-zinc-800 text-xs">
            <div>
                <p class="font-bold text-white text-[11px]">${ev.scorerName || ev.action || 'Event'}</p>
                <p class="text-[9px] text-zinc-400">${ev.time}</p>
            </div>
            <button type="button" onclick="window.deletePastMatchEvent(${ev.id})" class="text-zinc-500 hover:text-rose-400 text-sm px-1">&times;</button>
        </div>
    `).join('');
}

export function deletePastMatchEvent(eventId, leagueStandings, scheduleEvents, onUpdate) {
    if (!currentEditMatchId) return;
    const match = matchState.history.find(m => m.id === currentEditMatchId);
    if (!match) return;
    match.events = match.events.filter(e => e.id !== eventId);
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
        const us = parseInt(document.getElementById('edit-match-score-us')?.value, 10) || 0;
        const them = parseInt(document.getElementById('edit-match-score-them')?.value, 10) || 0;
        const motmVal = document.getElementById('edit-match-motm')?.value;

        match.opponent = opp || match.opponent;
        match.date = d || match.date;
        match.scoreUs = us;
        match.scoreThem = them;
        match.motmJersey = motmVal ? parseInt(motmVal, 10) : null;
        const motmP = players.find(p => p.jersey === match.motmJersey);
        match.motmName = motmP ? motmP.name : 'Unassigned';
    }

    closeEditMatchModal();
    savePersistentData(matchState, leagueStandings, scheduleEvents);
    if (typeof onUpdate === 'function') onUpdate();
}

export function deletePastMatch(leagueStandings, scheduleEvents, onUpdate) {
    if (!currentEditMatchId) return;
    matchState.history = matchState.history.filter(m => m.id !== currentEditMatchId);
    closeEditMatchModal();
    savePersistentData(matchState, leagueStandings, scheduleEvents);
    if (typeof onUpdate === 'function') onUpdate();
}
