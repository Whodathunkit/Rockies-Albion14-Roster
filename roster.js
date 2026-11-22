import { savePlayerProfileToFirebase, resolveFirebaseMediaUrl } from './firebase.js';
import {
    CURRENT_TEAM_ID,
    getActiveTeamConfig,
    getTeamStorageKey,
    getTeamStorageItem,
    setTeamStorageItem
} from './tenant.js';

// Albion 14 Official 12-Player Roster Seed (only seeded when CURRENT_TEAM_ID === 'albion14')
const ALBION14_SEED_PLAYERS = [
    { id: 1, jersey: 1, name: "Haaris Nathoo", position: "Goalkeeper", parents: "Rizwan & Rabea", siblings: "", photo: "", videoUrl: "" },
    { id: 3, jersey: 3, name: "Nael Salazar Simon", position: "GK/Winger", parents: "Paulina & Armando", siblings: "", photo: "", videoUrl: "" },
    { id: 4, jersey: 4, name: "Logan Martens", position: "Defense", parents: "Tyler & Rosie", siblings: "", photo: "", videoUrl: "" },
    { id: 5, jersey: 5, name: "Elijah Amoako", position: "Striker", parents: "Franklin & Linda", siblings: "", photo: "", videoUrl: "" },
    { id: 11, jersey: 11, name: "Tristan D'Mello", position: "Winger/Striker", parents: "Melvin & Charlotte", siblings: "", photo: "", videoUrl: "" },
    { id: 22, jersey: 22, name: "Yazed (Zezo) Manasrah", position: "Defense/Midfield", parents: "Family Manasrah", siblings: "", photo: "", videoUrl: "" },
    { id: 35, jersey: 35, name: "Nyle Zachary", position: "Midfield/Forward", parents: "Hug Saleh", siblings: "", photo: "", videoUrl: "" },
    { id: 52, jersey: 52, name: "Sam Campbell", position: "Defense", parents: "Scot & Luba", siblings: "", photo: "", videoUrl: "" },
    { id: 58, jersey: 58, name: "Harrison Locke", position: "Midfield", parents: "Paul & Lauren", siblings: "", photo: "", videoUrl: "" },
    { id: 62, jersey: 62, name: "Elnathan (Nathan) Udoh", position: "Defense/Midfield", parents: "Emmanuel & Dépéjú", siblings: "", photo: "", videoUrl: "" },
    { id: 65, jersey: 65, name: "Nicholas Lai", position: "Defense", parents: "Andy & Bonnie", siblings: "", photo: "", videoUrl: "" },
    { id: 70, jersey: 70, name: "Esteban Bazurto", position: "Midfield/Winger", parents: "Family Bazurto", siblings: "", photo: "", videoUrl: "" }
];

function loadInitialRosterPlayers() {
    try {
        const cachedRoster = localStorage.getItem(getTeamStorageKey('roster_players'));
        if (cachedRoster) {
            const parsed = JSON.parse(cachedRoster);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch {}

    // Only seed hardcoded Albion 14 roster when active team is albion14
    if (CURRENT_TEAM_ID === 'albion14') {
        return ALBION14_SEED_PLAYERS.map(p => ({ ...p }));
    }

    // For all other teams, check if team-scoped player profiles already hold roster records
    try {
        const rawProfiles = localStorage.getItem(getTeamStorageKey('player_profiles'));
        if (rawProfiles) {
            const parsed = JSON.parse(rawProfiles);
            if (parsed && typeof parsed === 'object') {
                const derived = Object.values(parsed)
                    .filter(p => p && p.name && (p.jersey !== undefined && p.jersey !== null))
                    .map(p => ({
                        id: Number(p.id || p.jersey),
                        jersey: Number(p.jersey),
                        name: String(p.name),
                        position: String(p.position || 'Player'),
                        parents: String(p.parents || ''),
                        siblings: String(p.siblings || ''),
                        notes: String(p.notes || ''),
                        photo: String(p.photo || ''),
                        videoUrl: String(p.videoUrl || ''),
                        isGuest: Boolean(p.isGuest)
                    }))
                    .sort((a, b) => a.jersey - b.jersey);
                if (derived.length > 0) return derived;
            }
        }
    } catch {}

    return [];
}

export const players = loadInitialRosterPlayers();

export let guestPlayers = (() => {
    try {
        const saved = getTeamStorageItem('guest_players', 'rfc14_guest_players');
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
})();

export let playerAttendanceMap = (() => {
    try {
        const saved = getTeamStorageItem('player_attendance', 'rfc14_player_attendance');
        return saved ? JSON.parse(saved) : {};
    } catch {
        return {};
    }
})();

export function getAllRosterPlayers(matchState) {
    const activeGuests = (matchState?.guestPlayers && Array.isArray(matchState.guestPlayers))
        ? matchState.guestPlayers
        : guestPlayers;
    return [...players, ...activeGuests];
}

export function isPlayerAvailable(jersey, matchState) {
    const jNum = Number(jersey);
    if (matchState?.attendance && matchState.attendance[jNum] !== undefined) {
        return matchState.attendance[jNum] !== 'absent';
    }
    if (playerAttendanceMap[jNum] !== undefined) {
        return playerAttendanceMap[jNum] !== 'absent';
    }
    return true; // Default to available
}

export function getAvailablePlayers(matchState) {
    return getAllRosterPlayers(matchState).filter(p => isPlayerAvailable(p.jersey, matchState));
}

export function togglePlayerAttendance(jersey, matchState, onUpdate) {
    const jNum = Number(jersey);
    const currentlyAvailable = isPlayerAvailable(jNum, matchState);
    const nextStatus = currentlyAvailable ? 'absent' : 'attending';

    playerAttendanceMap[jNum] = nextStatus;
    setTeamStorageItem('player_attendance', playerAttendanceMap);

    if (matchState) {
        if (!matchState.attendance) matchState.attendance = {};
        matchState.attendance[jNum] = nextStatus;
    }

    if (typeof onUpdate === 'function') onUpdate();
}

export function markAllAttendance(status, matchState, onUpdate) {
    const all = getAllRosterPlayers(matchState);
    all.forEach(p => {
        const jNum = Number(p.jersey);
        playerAttendanceMap[jNum] = status;
        if (matchState) {
            if (!matchState.attendance) matchState.attendance = {};
            matchState.attendance[jNum] = status;
        }
    });
    setTeamStorageItem('player_attendance', playerAttendanceMap);
    if (typeof onUpdate === 'function') onUpdate();
}

export function addGuestPlayer(guestData, matchState, onUpdate) {
    const jersey = parseInt(guestData.jersey, 10);
    if (isNaN(jersey) || jersey < 0) {
        alert('Please enter a valid jersey number.');
        return false;
    }
    const name = (guestData.name || '').trim();
    if (!name) {
        alert('Please enter a player name.');
        return false;
    }

    const all = getAllRosterPlayers(matchState);
    if (all.some(p => Number(p.jersey) === jersey)) {
        const existing = all.find(p => Number(p.jersey) === jersey);
        alert(`Jersey #${jersey} is already in use by ${existing.name}. Please select a different number.`);
        return false;
    }

    const newGuest = {
        id: Date.now(),
        jersey,
        name,
        position: guestData.position || 'Guest Player',
        parents: guestData.notes ? `Call-Up: ${guestData.notes}` : 'Call-Up Guest Player',
        siblings: '',
        photo: '',
        videoUrl: '',
        isGuest: true,
        notes: guestData.notes || 'Call-Up Player'
    };

    guestPlayers.push(newGuest);
    setTeamStorageItem('guest_players', guestPlayers);

    if (matchState) {
        if (!Array.isArray(matchState.guestPlayers)) matchState.guestPlayers = [];
        matchState.guestPlayers.push(newGuest);
        if (!matchState.attendance) matchState.attendance = {};
        matchState.attendance[jersey] = 'attending';
    }
    playerAttendanceMap[jersey] = 'attending';
    setTeamStorageItem('player_attendance', playerAttendanceMap);

    if (typeof onUpdate === 'function') onUpdate();
    return true;
}

export function removeGuestPlayer(jersey, matchState, onUpdate) {
    const jNum = Number(jersey);
    guestPlayers = guestPlayers.filter(p => Number(p.jersey) !== jNum);
    setTeamStorageItem('guest_players', guestPlayers);

    if (matchState && Array.isArray(matchState.guestPlayers)) {
        matchState.guestPlayers = matchState.guestPlayers.filter(p => Number(p.jersey) !== jNum);
        if (matchState.attendance) delete matchState.attendance[jNum];
    }
    delete playerAttendanceMap[jNum];
    setTeamStorageItem('player_attendance', playerAttendanceMap);

    if (typeof onUpdate === 'function') onUpdate();
}

export let playerProfilesMap = (() => {
    try {
        const saved = getTeamStorageItem('player_profiles', 'rfc14_player_profiles');
        return saved ? JSON.parse(saved) : {};
    } catch {
        return {};
    }
})();

export let activePlayerCard = null;

export function applyProfileDocToRoster(docId, data) {
    const jerseyNum = parseInt(docId, 10) || Number(data?.jersey);
    if (!jerseyNum) return;
    playerProfilesMap[jerseyNum] = { ...(playerProfilesMap[jerseyNum] || {}), ...data, jersey: jerseyNum };
    setTeamStorageItem('player_profiles', playerProfilesMap);

    const rosterPlayer = players.find(p => Number(p.jersey) === jerseyNum);
    if (rosterPlayer) {
        if (data.name !== undefined && data.name) rosterPlayer.name = data.name;
        if (data.position !== undefined && data.position) rosterPlayer.position = data.position;
        if (data.parents !== undefined) rosterPlayer.parents = data.parents;
        if (data.siblings !== undefined) rosterPlayer.siblings = data.siblings;
        if (data.notes !== undefined) rosterPlayer.notes = data.notes;
        if (data.photo !== undefined) rosterPlayer.photo = data.photo;
        if (data.videoUrl !== undefined) rosterPlayer.videoUrl = data.videoUrl;
        if (data.isGuest !== undefined) rosterPlayer.isGuest = Boolean(data.isGuest);
    } else if (data?.name) {
        // Hydrate Firestore-defined player into active squad roster (supports teams without hardcoded seeds)
        players.push({
            id: Number(data.id || jerseyNum),
            jersey: jerseyNum,
            name: String(data.name),
            position: String(data.position || 'Player'),
            parents: String(data.parents || ''),
            siblings: String(data.siblings || ''),
            notes: String(data.notes || ''),
            photo: String(data.photo || ''),
            videoUrl: String(data.videoUrl || ''),
            isGuest: Boolean(data.isGuest)
        });
        players.sort((a, b) => Number(a.jersey) - Number(b.jersey));
    }
    setTeamStorageItem('roster_players', players);
}

// Player Stat Calculation Logic
export function getPlayerGoals(jersey, matchState) {
    let count = 0;
    const jNum = Number(jersey);
    (matchState?.history || []).forEach(m => {
        (m.events || []).forEach(e => {
            if (e.type === 'goal' && e.scorerJersey !== null && e.scorerJersey !== undefined && Number(e.scorerJersey) === jNum) count++;
        });
    });
    (matchState?.events || []).forEach(e => {
        if (e.type === 'goal' && e.scorerJersey !== null && e.scorerJersey !== undefined && Number(e.scorerJersey) === jNum) count++;
    });
    return count;
}

export function getPlayerAssists(jersey, matchState) {
    let count = 0;
    const jNum = Number(jersey);
    (matchState?.history || []).forEach(m => {
        (m.events || []).forEach(e => {
            if (e.type === 'goal' && e.assistJersey !== null && e.assistJersey !== undefined && Number(e.assistJersey) === jNum) count++;
        });
    });
    (matchState?.events || []).forEach(e => {
        if (e.type === 'goal' && e.assistJersey !== null && e.assistJersey !== undefined && Number(e.assistJersey) === jNum) count++;
    });
    return count;
}

export function isDefenderOrGK(position) {
    if (!position || typeof position !== 'string') return false;
    const p = position.toLowerCase();
    return p.includes('goalkeeper') || /\bgk\b/.test(p) || p.includes('defense') || p.includes('defender') || /\bdef\b/.test(p);
}

export function getPlayerCleanSheets(player, matchState) {
    if (!player || !isDefenderOrGK(player.position)) return 0;
    let count = 0;
    (matchState?.history || []).forEach(m => {
        const us = Number(m.scoreUs ?? 0);
        const them = Number(m.scoreThem ?? 0);
        if (us > them && them === 0) count++;
    });
    if (matchState?.isFinal || matchState?.period === 'Full Time') {
        const us = Number(matchState.scoreUs ?? 0);
        const them = Number(matchState.scoreThem ?? 0);
        if (us > them && them === 0) count++;
    }
    return count;
}

export function getPlayerStops(jersey, matchState) {
    let count = 0;
    const jNum = Number(jersey);
    const isDefEvent = (e) => {
        if (!e) return false;
        if (e.type === 'defense' || e.type === 'stop' || e.type === 'clearance') return true;
        if (e.action && typeof e.action === 'string') {
            const a = e.action.toLowerCase();
            return a.includes('clearance') || a.includes('stop') || a.includes('save') || a.includes('block') || a.includes('tackle');
        }
        return false;
    };

    (matchState?.history || []).forEach(m => {
        (m.events || []).forEach(e => {
            const ej = Number(e.playerJersey ?? e.jersey);
            if (isDefEvent(e) && ej === jNum) count++;
        });
    });
    (matchState?.events || []).forEach(e => {
        const ej = Number(e.playerJersey ?? e.jersey);
        if (isDefEvent(e) && ej === jNum) count++;
    });
    return count;
}

export function getPlayerMOTMCount(jersey, matchState) {
    let count = 0;
    const jNum = Number(jersey);
    (matchState?.history || []).forEach(m => {
        if (Number(m.motmJersey) === jNum) count++;
    });
    if (Number(matchState?.motmJersey) === jNum) count++;
    return count;
}

export function getPlayerRecentHighlights(jersey, matchState) {
    const items = [];
    const activeOpp = matchState?.opponentName || 'Opponent';
    const jNum = Number(jersey);
    const allPlayers = getAllRosterPlayers(matchState);
    const player = allPlayers.find(p => p.jersey === jNum);

    if (Number(matchState?.motmJersey) === jNum) {
        items.push({
            icon: '🎖️',
            label: 'Man of the Match',
            detail: `vs ${activeOpp}`,
            time: 'Live',
            badgeClass: 'bg-amber-950/70 text-amber-300 border-amber-500/30',
            video: ''
        });
    }

    const isDef = (e) => {
        if (!e) return false;
        if (e.type === 'defense' || e.type === 'stop' || e.type === 'clearance') return true;
        if (e.action && typeof e.action === 'string') {
            const a = e.action.toLowerCase();
            return a.includes('clearance') || a.includes('stop') || a.includes('save') || a.includes('block') || a.includes('tackle');
        }
        return false;
    };

    (matchState?.events || []).forEach(ev => {
        if (ev.type === 'goal' && Number(ev.scorerJersey) === jNum) {
            items.push({
                icon: '⚽',
                label: `Goal (${ev.tag || ev.finish || 'Goal'})`,
                detail: `${ev.phase ? ev.phase + ' • ' : ''}vs ${activeOpp}`,
                time: ev.time || '',
                badgeClass: 'bg-blue-950/70 text-blue-200 border-blue-500/30',
                video: ev.video || ''
            });
        } else if (ev.type === 'goal' && Number(ev.assistJersey) === jNum) {
            items.push({
                icon: '👟',
                label: `Assist (#${ev.scorerJersey} ${ev.scorerName ? ev.scorerName.split(' ')[0] : ''})`,
                detail: `vs ${activeOpp}`,
                time: ev.time || '',
                badgeClass: 'bg-indigo-950/70 text-indigo-200 border-indigo-500/30',
                video: ev.video || ''
            });
        } else if (isDef(ev) && Number(ev.playerJersey ?? ev.jersey) === jNum) {
            items.push({
                icon: '🧤',
                label: ev.action || 'Defensive Heroics',
                detail: `${ev.note ? ev.note + ' • ' : ''}vs ${activeOpp}`,
                time: ev.time || '',
                badgeClass: 'bg-teal-950/70 text-teal-200 border-teal-500/30',
                video: ev.video || ''
            });
        }
    });

    (matchState?.history || []).forEach(m => {
        const opp = m.opponent || 'Opponent';
        const us = Number(m.scoreUs ?? 0);
        const them = Number(m.scoreThem ?? 0);

        if (Number(m.motmJersey) === jNum) {
            items.push({
                icon: '🎖️',
                label: 'Man of the Match',
                detail: `vs ${opp}`,
                time: m.date || 'Final',
                badgeClass: 'bg-amber-950/70 text-amber-300 border-amber-500/30',
                video: ''
            });
        }

        if (player && isDefenderOrGK(player.position) && us > them && them === 0) {
            items.push({
                icon: '🛡️',
                label: 'Clean Sheet Victory',
                detail: `W ${us}-${them} vs ${opp}`,
                time: m.date || 'Final',
                badgeClass: 'bg-teal-950/70 text-teal-300 border-teal-500/30',
                video: ''
            });
        }
        (m.events || []).forEach(ev => {
            if (ev.type === 'goal' && Number(ev.scorerJersey) === jNum) {
                items.push({
                    icon: '⚽',
                    label: `Goal (${ev.tag || ev.finish || 'Goal'})`,
                    detail: `${ev.phase ? ev.phase + ' • ' : ''}vs ${opp}`,
                    time: ev.time || m.date || '',
                    badgeClass: 'bg-blue-950/70 text-blue-200 border-blue-500/30',
                    video: ev.video || ''
                });
            } else if (ev.type === 'goal' && Number(ev.assistJersey) === jNum) {
                items.push({
                    icon: '👟',
                    label: `Assist (#${ev.scorerJersey} ${ev.scorerName ? ev.scorerName.split(' ')[0] : ''})`,
                    detail: `vs ${opp}`,
                    time: ev.time || m.date || '',
                    badgeClass: 'bg-indigo-950/70 text-indigo-200 border-indigo-500/30',
                    video: ev.video || ''
                });
            } else if (isDef(ev) && Number(ev.playerJersey ?? ev.jersey) === jNum) {
                items.push({
                    icon: '🛡️',
                    label: ev.action || 'Defensive Heroics',
                    detail: `${ev.note ? ev.note + ' • ' : ''}vs ${opp}`,
                    time: ev.time || m.date || '',
                    badgeClass: 'bg-teal-950/70 text-teal-200 border-teal-500/30',
                    video: ev.video || ''
                });
            }
        });
    });

    return items;
}

function escapeRosterHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function isCoachModeUnlockedLocal(explicitFlag = false) {
    if (explicitFlag) return true;
    try {
        if (localStorage.getItem(getTeamStorageKey('coach_mode')) === 'true') return true;
    } catch {}
    try {
        if (sessionStorage.getItem(getTeamStorageKey('coach_mode')) === 'true') return true;
    } catch {}
    return false;
}

// Render Roster Grid
export function renderRoster(matchState, isCoachMode = false) {
    const grid = document.getElementById('roster-grid');
    if (!grid) return;

    const coachActive = isCoachModeUnlockedLocal(isCoachMode);
    const coachHeaderActions = document.getElementById('roster-coach-actions');
    if (coachHeaderActions) {
        coachHeaderActions.classList.toggle('hidden', !coachActive);
        coachHeaderActions.classList.toggle('flex', coachActive);
    }

    const all = getAllRosterPlayers(matchState);
    const activeConfig = getActiveTeamConfig();

    if (all.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full p-8 text-center bg-zinc-900/70 border border-zinc-800 rounded-2xl space-y-4">
                <div class="w-12 h-12 rounded-2xl bg-[var(--brand-primary)]/30 border border-blue-500/30 flex items-center justify-center text-2xl mx-auto">
                    👥
                </div>
                <div class="space-y-1">
                    <p class="text-sm sm:text-base font-extrabold text-white">No players added for ${escapeRosterHtml(activeConfig.name)} yet</p>
                    <p class="text-xs text-zinc-400 max-w-md mx-auto">
                        ${coachActive
                            ? 'Add players one by one or paste a CSV roster to populate your squad and sync directly to Firestore.'
                            : `Unlock Coach Mode to add players or bulk import your ${escapeRosterHtml(activeConfig.name)} roster.`}
                    </p>
                </div>
                ${coachActive ? `
                    <div class="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                        <button type="button" onclick="window.openAddPlayerModal()" class="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] border border-blue-400/50 text-white text-xs font-extrabold shadow-lg transition active:scale-95">
                            <span>+ Add Player</span>
                        </button>
                        <button type="button" onclick="window.openImportCsvModal()" class="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-100 text-xs font-extrabold shadow transition active:scale-95">
                            <span>📥 Import CSV</span>
                        </button>
                    </div>
                ` : `
                    <div class="pt-1">
                        <button type="button" onclick="window.toggleCoachMode()" class="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs font-extrabold transition active:scale-95">
                            <span>⚡ Unlock Coach Mode to Add Players</span>
                        </button>
                    </div>
                `}
            </div>
        `;
        const countEl = document.getElementById('roster-player-count');
        if (countEl) countEl.textContent = '0 Players';
        return;
    }

    grid.innerHTML = all.map(p => {
        const goals = getPlayerGoals(p.jersey, matchState);
        const assists = getPlayerAssists(p.jersey, matchState);
        const stops = getPlayerStops(p.jersey, matchState);
        const motms = getPlayerMOTMCount(p.jersey, matchState);
        const isDefOrGK = isDefenderOrGK(p.position);
        const cleanSheets = isDefOrGK ? getPlayerCleanSheets(p, matchState) : 0;
        const prof = playerProfilesMap[p.jersey] || {};
        const customPhoto = prof.photo !== undefined ? prof.photo : p.photo;
        const customVideo = prof.videoUrl !== undefined ? prof.videoUrl : p.videoUrl;
        const rawParents = (prof.parents !== undefined && String(prof.parents).trim() !== '') ? prof.parents : p.parents;
        const parentsText = rawParents && String(rawParents).trim() !== '' ? String(rawParents) : 'Family';
        const notesText = (prof.notes !== undefined && String(prof.notes).trim() !== '') ? String(prof.notes) : (p.notes || '');
        const safeName = escapeRosterHtml(p.name || `Player #${p.jersey}`);
        const safePos = escapeRosterHtml(p.position || 'Player');
        const safeNotes = escapeRosterHtml(notesText);
        const safeParents = escapeRosterHtml(parentsText);
        const recentHighlights = getPlayerRecentHighlights(p.jersey, matchState).slice(0, 2);

        return `
        <div onclick="window.openPlayerModal(${Number(p.jersey)})" class="bg-zinc-900 border border-zinc-800/90 hover:border-blue-500/50 rounded-2xl p-4 shadow-xl hover:shadow-2xl transition duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden">
            <div class="flex items-start justify-between">
                <div class="pr-2">
                    <div class="flex flex-wrap items-center gap-1.5">
                        <h3 class="text-sm font-extrabold text-white group-hover:text-blue-400 transition">${safeName}</h3>
                        ${p.isGuest ? `<span class="text-[9px] bg-amber-500/20 border border-amber-500/40 text-amber-300 px-1.5 py-0.2 rounded font-black tracking-wider uppercase">★ Call-Up</span>` : ''}
                        ${customVideo ? `<span class="text-[10px] bg-blue-950 border border-blue-500/40 text-blue-300 px-1.5 py-0.2 rounded font-bold">▶ Clip</span>` : ''}
                    </div>
                    <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">${safePos}${safeNotes ? ` • ${safeNotes}` : ''}</p>
                    <p class="text-[11px] text-zinc-400 mt-2">👨‍👩‍👦 ${safeParents}</p>
                </div>
                <div class="flex flex-col items-end space-y-1 flex-shrink-0">
                    <div class="w-10 h-10 rounded-xl ${p.isGuest ? 'bg-amber-600/90 border border-amber-400/50' : 'bg-[var(--brand-primary)] border border-blue-400/40'} flex items-center justify-center text-sm font-black text-white shadow-md">
                        #${Number(p.jersey)}
                    </div>
                </div>
            </div>

            ${recentHighlights.length > 0 ? `
            <div class="mt-2.5 pt-2 border-t border-zinc-800/60 space-y-1.5">
                <p class="text-[9px] font-black uppercase tracking-wider text-zinc-500">Recent Highlights</p>
                ${recentHighlights.map(h => `
                    <div class="flex items-center justify-between px-2 py-1 rounded-lg border ${h.badgeClass} text-[10px]">
                        <div class="flex items-center space-x-1.5 truncate pr-1">
                            <span>${h.icon}</span>
                            <span class="font-bold truncate">${h.label}</span>
                            <span class="text-[9px] opacity-75 truncate">• ${h.detail}</span>
                        </div>
                        ${h.time ? `<span class="text-[9px] font-mono text-amber-400/90 flex-shrink-0 ml-1">${h.time}</span>` : ''}
                    </div>
                `).join('')}
            </div>
            ` : ''}

            <div class="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-bold">
                <div class="flex items-center space-x-2 text-zinc-300">
                    <span>⚽ ${goals}</span>
                    <span>👟 ${assists}</span>
                    <span>🛡️ ${stops}</span>
                    ${isDefOrGK && cleanSheets > 0 ? `<span class="text-teal-300 font-extrabold" title="Clean Sheets">🧤 ${cleanSheets} CS</span>` : ''}
                </div>
                <div class="flex items-center space-x-1">
                    ${motms > 0 ? `<span class="bg-amber-950/80 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded text-[10px]">🎖️ ${motms}</span>` : ''}
                    ${customPhoto ? `<span class="bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded text-[10px]">📷 Photo</span>` : ''}
                </div>
            </div>
        </div>
        `;
    }).join('');

    const countEl = document.getElementById('roster-player-count');
    if (countEl) {
        countEl.textContent = `${all.length} Players`;
    }
}

// Player Modal Management
export function openPlayerModal(jersey, matchState) {
    const all = getAllRosterPlayers(matchState);
    const player = all.find(p => p.jersey === Number(jersey));
    if (!player) return;
    activePlayerCard = player;
    refreshActivePlayerModalUI(jersey, matchState);
    const modal = document.getElementById('player-modal');
    if (modal) modal.classList.remove('hidden');
}

export function closePlayerModal() {
    const modal = document.getElementById('player-modal');
    if (modal) modal.classList.add('hidden');
    activePlayerCard = null;
}

export function refreshActivePlayerModalUI(jersey, matchState) {
    const all = getAllRosterPlayers(matchState);
    const player = all.find(p => p.jersey === Number(jersey));
    if (!player) return;
    const prof = playerProfilesMap[jersey] || {};

    const nameEl = document.getElementById('modal-player-name');
    const posEl = document.getElementById('modal-player-position');
    const jerEl = document.getElementById('modal-player-jersey');
    const goalsEl = document.getElementById('modal-stat-goals');
    const assistsEl = document.getElementById('modal-stat-assists');
    const stopsEl = document.getElementById('modal-stat-stops');
    const motmEl = document.getElementById('modal-stat-motm');
    const csBox = document.getElementById('modal-stat-cs-box');
    const csEl = document.getElementById('modal-stat-cs');
    const statsGrid = document.getElementById('modal-stats-grid');

    if (nameEl) nameEl.textContent = player.name + (player.isGuest ? ' (Guest Call-Up)' : '');
    if (posEl) posEl.textContent = player.position + (player.notes ? ` • ${player.notes}` : '');
    if (jerEl) jerEl.textContent = `#${player.jersey}`;
    if (goalsEl) goalsEl.textContent = getPlayerGoals(player.jersey, matchState);
    if (assistsEl) assistsEl.textContent = getPlayerAssists(player.jersey, matchState);
    if (stopsEl) stopsEl.textContent = getPlayerStops(player.jersey, matchState);
    if (motmEl) motmEl.textContent = getPlayerMOTMCount(player.jersey, matchState);

    const isDef = isDefenderOrGK(player.position);
    if (csBox && csEl) {
        if (isDef) {
            csBox.classList.remove('hidden');
            csEl.textContent = getPlayerCleanSheets(player, matchState);
            if (statsGrid) statsGrid.className = "grid grid-cols-5 gap-2 text-center";
        } else {
            csBox.classList.add('hidden');
            if (statsGrid) statsGrid.className = "grid grid-cols-4 gap-2 text-center";
        }
    }

    const savedParents = prof.parents !== undefined ? prof.parents : (player.parents || 'Not listed');
    const savedSiblings = prof.siblings !== undefined ? prof.siblings : (player.siblings || 'None recorded');
    const parentsEl = document.getElementById('modal-family-parents');
    const siblingsEl = document.getElementById('modal-family-siblings');
    if (parentsEl) parentsEl.textContent = savedParents;
    if (siblingsEl) siblingsEl.textContent = savedSiblings || 'None recorded';

    const allHighlights = getPlayerRecentHighlights(player.jersey, matchState);
    const hlContainer = document.getElementById('modal-player-recent-highlights');
    const hlCount = document.getElementById('modal-highlights-count');
    if (hlCount) hlCount.textContent = `${allHighlights.length} ${allHighlights.length === 1 ? 'Highlight' : 'Highlights'}`;

    if (hlContainer) {
        if (allHighlights.length === 0) {
            hlContainer.innerHTML = `<p class="text-[11px] text-zinc-500 italic py-1">No match highlights recorded yet this season.</p>`;
        } else {
            hlContainer.innerHTML = allHighlights.map(h => `
                <div class="flex items-center justify-between p-2 rounded-xl border ${h.badgeClass}">
                    <div class="flex items-center space-x-2 min-w-0 pr-2">
                        <span class="text-sm flex-shrink-0">${h.icon}</span>
                        <div class="min-w-0">
                            <p class="text-[11px] font-extrabold text-white truncate">${h.label}</p>
                            <p class="text-[10px] opacity-80 truncate">${h.detail}</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-1.5 flex-shrink-0">
                        ${h.video ? `<button type="button" onclick="window.openVideoClipModal('${h.video}', '${player.name} - ${h.label}', '${h.time}')" class="px-1.5 py-0.5 rounded bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-500/40 text-[9px] font-bold">▶ Clip</button>` : ''}
                        ${h.time ? `<span class="text-[10px] font-mono font-bold text-amber-400">${h.time}</span>` : ''}
                    </div>
                </div>
            `).join('');
        }
    }

    const banner = document.getElementById('modal-player-media-banner');
    const customVid = prof.videoUrl !== undefined ? prof.videoUrl : player.videoUrl;

    if (banner) {
        if (customVid) {
            banner.innerHTML = `
                <div class="relative w-full h-full flex items-center justify-center">
                    <video id="player-banner-video" autoplay loop muted playsinline class="w-full h-full object-cover"></video>
                    <button onclick="window.toggleVideoMute()" id="btn-unmute-video" class="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/75 hover:bg-black border border-white/20 text-white text-[11px] font-bold shadow flex items-center space-x-1">
                        <span>🔊</span><span id="label-unmute">Unmute</span>
                    </button>
                </div>
            `;
            const vidEl = document.getElementById('player-banner-video');
            resolveFirebaseMediaUrl(customVid).then(resolvedUrl => {
                if (vidEl && resolvedUrl) {
                    vidEl.src = resolvedUrl;
                }
            });
        } else {
            banner.innerHTML = `
                <div class="text-center p-4">
                    <div class="w-16 h-16 rounded-2xl bg-[var(--brand-primary)] border border-blue-400 flex items-center justify-center text-2xl font-black text-white mx-auto mb-2 shadow">
                        #${player.jersey}
                    </div>
                    <h4 class="text-base font-black text-white">${player.name}</h4>
                    <p class="text-xs font-bold text-blue-300 uppercase tracking-widest">${player.position}</p>
                </div>
            `;
        }
    }

    const familyThumb = document.getElementById('modal-family-photo-thumb');
    const photo = prof.photo !== undefined ? prof.photo : player.photo;
    if (familyThumb) {
        if (photo) {
            familyThumb.innerHTML = `<img src="${photo}" alt="Family" class="w-full h-full object-cover" />`;
        } else {
            familyThumb.innerHTML = `<span class="text-2xl">👨‍👩‍👦</span>`;
        }
    }

    const videoInput = document.getElementById('modal-player-video-input');
    if (videoInput) videoInput.value = customVid || '';
}

export function openFamilyPhotoLightbox() {
    if (!activePlayerCard) return;
    const prof = playerProfilesMap[activePlayerCard.jersey] || {};
    const photo = prof.photo !== undefined ? prof.photo : activePlayerCard.photo;
    if (!photo) return;

    const img = document.getElementById('family-lightbox-img');
    const title = document.getElementById('family-lightbox-title');
    const sub = document.getElementById('family-lightbox-sub');
    const modal = document.getElementById('family-lightbox-modal');

    if (img) img.src = photo;
    if (title) title.textContent = `${activePlayerCard.name}'s Family`;
    const parents = prof.parents !== undefined ? prof.parents : (activePlayerCard.parents || 'Not listed');
    const siblings = prof.siblings !== undefined ? prof.siblings : activePlayerCard.siblings;
    if (sub) sub.textContent = `Parents: ${parents} ${siblings ? `• Siblings: ${siblings}` : ''}`;
    if (modal) modal.classList.remove('hidden');
}

export function closeFamilyPhotoLightbox() {
    const modal = document.getElementById('family-lightbox-modal');
    if (modal) modal.classList.add('hidden');
}

export function openEditFamilyModal() {
    if (!activePlayerCard) return;
    const prof = playerProfilesMap[activePlayerCard.jersey] || {};
    const parents = prof.parents !== undefined ? prof.parents : (activePlayerCard.parents || '');
    const siblings = prof.siblings !== undefined ? prof.siblings : (activePlayerCard.siblings || '');

    const pInput = document.getElementById('input-family-parents');
    const sInput = document.getElementById('input-family-siblings');
    const modal = document.getElementById('edit-family-modal');

    if (pInput) pInput.value = parents;
    if (sInput) sInput.value = siblings;
    if (modal) modal.classList.remove('hidden');
}

export function closeEditFamilyModal() {
    const modal = document.getElementById('edit-family-modal');
    if (modal) modal.classList.add('hidden');
}

export async function saveFamilyDetails(e, matchState) {
    if (e) e.preventDefault();
    if (!activePlayerCard) return;
    const pInput = document.getElementById('input-family-parents');
    const sInput = document.getElementById('input-family-siblings');
    const parents = pInput?.value.trim() || '';
    const siblings = sInput?.value.trim() || '';

    await savePlayerProfileToFirebase(activePlayerCard.jersey, { parents, siblings }, playerProfilesMap);
    closeEditFamilyModal();
    refreshActivePlayerModalUI(activePlayerCard.jersey, matchState);
    renderRoster(matchState);
}

export async function processFamilyPhotoFile(file, matchState) {
    if (!file || !activePlayerCard) return;
    const targetJersey = activePlayerCard.jersey;

    const reader = new FileReader();
    reader.onload = (evt) => {
        const img = new Image();
        img.onload = async () => {
            const canvas = document.createElement('canvas');
            const maxDim = 600;
            let w = img.width, h = img.height;
            if (w > h && w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim; }
            else if (h > maxDim) { w = Math.round((w * maxDim) / h); h = maxDim; }
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            const b64DataUrl = canvas.toDataURL('image/jpeg', 0.75);

            await savePlayerProfileToFirebase(targetJersey, { photo: b64DataUrl }, playerProfilesMap);
            if (activePlayerCard && activePlayerCard.jersey === targetJersey) {
                refreshActivePlayerModalUI(targetJersey, matchState);
            }
            renderRoster(matchState);
        };
        img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
}

export async function savePlayerVideoUrl(matchState) {
    if (!activePlayerCard) return;
    const input = document.getElementById('modal-player-video-input');
    const val = (input?.value || '').trim();
    await savePlayerProfileToFirebase(activePlayerCard.jersey, { videoUrl: val }, playerProfilesMap);
    refreshActivePlayerModalUI(activePlayerCard.jersey, matchState);
    renderRoster(matchState);
}

// ============================================================================
// Coach Mode: Add Single Player & Bulk CSV Roster Import
// ============================================================================

function upsertLocalRosterPlayer(playerRecord, matchState = null) {
    const jerseyNum = Number(playerRecord.jersey);
    const normalized = {
        id: jerseyNum,
        jersey: jerseyNum,
        name: String(playerRecord.name || '').trim(),
        position: String(playerRecord.position || 'Player').trim() || 'Player',
        parents: String(playerRecord.parents || '').trim(),
        siblings: String(playerRecord.siblings || '').trim(),
        notes: String(playerRecord.notes || '').trim(),
        photo: String(playerRecord.photo || ''),
        videoUrl: String(playerRecord.videoUrl || ''),
        isGuest: Boolean(playerRecord.isGuest)
    };

    const existingIdx = players.findIndex(p => Number(p.jersey) === jerseyNum);
    if (existingIdx >= 0) {
        players[existingIdx] = {
            ...players[existingIdx],
            ...normalized,
            photo: normalized.photo || players[existingIdx].photo || '',
            videoUrl: normalized.videoUrl || players[existingIdx].videoUrl || '',
            siblings: normalized.siblings || players[existingIdx].siblings || ''
        };
    } else {
        players.push(normalized);
    }

    players.sort((a, b) => Number(a.jersey) - Number(b.jersey));
    setTeamStorageItem('roster_players', players);

    // Ensure new player defaults to attending for match tracking
    if (playerAttendanceMap[jerseyNum] === undefined) {
        playerAttendanceMap[jerseyNum] = 'attending';
        setTeamStorageItem('player_attendance', playerAttendanceMap);
    }
    if (matchState) {
        if (!matchState.attendance) matchState.attendance = {};
        if (matchState.attendance[jerseyNum] === undefined) {
            matchState.attendance[jerseyNum] = 'attending';
        }
    }

    return players.find(p => Number(p.jersey) === jerseyNum);
}

export function openAddPlayerModal() {
    const modal = document.getElementById('add-player-modal');
    const form = document.getElementById('add-player-form');
    const errorEl = document.getElementById('add-player-error');
    if (form) form.reset();
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.add('hidden');
    }
    if (modal) modal.classList.remove('hidden');
    const jerseyInput = document.getElementById('add-player-jersey');
    if (jerseyInput) {
        setTimeout(() => jerseyInput.focus(), 80);
    }
}

export function closeAddPlayerModal() {
    const modal = document.getElementById('add-player-modal');
    if (modal) modal.classList.add('hidden');
}

export async function submitAddPlayer(event, matchState, onUpdate) {
    if (event) {
        if (typeof event.preventDefault === 'function') event.preventDefault();
        if (typeof event.stopPropagation === 'function') event.stopPropagation();
    }

    const jerseyInput = document.getElementById('add-player-jersey');
    const nameInput = document.getElementById('add-player-name');
    const positionInput = document.getElementById('add-player-position');
    const parentsInput = document.getElementById('add-player-parents');
    const notesInput = document.getElementById('add-player-notes');
    const guestToggle = document.getElementById('add-player-is-guest');
    const errorEl = document.getElementById('add-player-error');
    const submitBtn = document.getElementById('btn-submit-add-player');

    const showError = (msg) => {
        if (errorEl) {
            errorEl.textContent = msg;
            errorEl.classList.remove('hidden');
        }
    };

    const rawJersey = (jerseyInput?.value || '').trim();
    const jersey = parseInt(rawJersey, 10);
    if (rawJersey === '' || Number.isNaN(jersey) || jersey < 0 || jersey > 999) {
        showError('Please enter a valid jersey number between 0 and 999.');
        jerseyInput?.focus();
        return false;
    }

    const name = (nameInput?.value || '').trim();
    if (!name) {
        showError('Please enter the player name.');
        nameInput?.focus();
        return false;
    }

    const existing = getAllRosterPlayers(matchState).find(p => Number(p.jersey) === jersey);
    if (existing) {
        showError(`Jersey #${jersey} is already assigned to ${existing.name}. Please choose a unique number.`);
        jerseyInput?.focus();
        return false;
    }

    if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.add('hidden');
    }

    const position = (positionInput?.value || '').trim() || 'Player';
    const parents = (parentsInput?.value || '').trim();
    const notes = (notesInput?.value || '').trim();
    const isGuest = Boolean(guestToggle?.checked);

    const newPlayer = upsertLocalRosterPlayer({
        jersey,
        name,
        position,
        parents,
        notes,
        isGuest
    }, matchState);

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
    }

    try {
        await savePlayerProfileToFirebase(jersey, {
            jersey,
            name: newPlayer.name,
            position: newPlayer.position,
            parents: newPlayer.parents,
            siblings: newPlayer.siblings,
            notes: newPlayer.notes,
            isGuest: newPlayer.isGuest
        }, playerProfilesMap);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '+ Add Player';
        }
    }

    closeAddPlayerModal();
    renderRoster(matchState, true);
    if (typeof onUpdate === 'function') onUpdate();
    return false;
}

// Parse a single RFC-4180 CSV line (handles quoted commas and escaped double quotes)
function parseCsvLine(line) {
    const cells = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
            if (ch === '"') {
                if (line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                current += ch;
            }
        } else if (ch === '"') {
            inQuotes = true;
        } else if (ch === ',') {
            cells.push(current.trim());
            current = '';
        } else {
            current += ch;
        }
    }
    cells.push(current.trim());
    return cells;
}

export function parseRosterCsvText(rawText) {
    const lines = String(rawText || '')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);

    const validRows = [];
    const errors = [];
    const seenJerseys = new Set();

    lines.forEach((line, idx) => {
        const cols = parseCsvLine(line);
        if (cols.length === 0) return;

        // Skip optional header row (e.g. "jersey, name, position, parents, notes")
        const firstColLower = (cols[0] || '').toLowerCase().replace(/^#/, '').trim();
        if (
            idx === 0 &&
            (firstColLower === 'jersey' || firstColLower === 'number' || firstColLower === 'no' || firstColLower === 'jersey number')
        ) {
            return;
        }

        const cleanJerseyStr = (cols[0] || '').replace(/^#/, '').trim();
        const jersey = parseInt(cleanJerseyStr, 10);
        const name = (cols[1] || '').trim();
        const position = (cols[2] || '').trim() || 'Player';
        const parents = (cols[3] || '').trim();
        const notes = (cols.slice(4).join(', ') || '').trim();

        if (cleanJerseyStr === '' || Number.isNaN(jersey) || jersey < 0 || jersey > 999) {
            errors.push(`Line ${idx + 1}: Invalid jersey number "${cols[0] || ''}"`);
            return;
        }
        if (!name) {
            errors.push(`Line ${idx + 1}: Missing player name for #${jersey}`);
            return;
        }
        if (seenJerseys.has(jersey)) {
            errors.push(`Line ${idx + 1}: Duplicate jersey #${jersey} inside CSV (skipped)`);
            return;
        }

        seenJerseys.add(jersey);
        validRows.push({
            jersey,
            name,
            position,
            parents,
            notes,
            isGuest: false
        });
    });

    return { validRows, errors };
}

export function openImportCsvModal() {
    const modal = document.getElementById('import-csv-modal');
    const textarea = document.getElementById('csv-paste-input');
    const fileInput = document.getElementById('csv-file-input');
    const statusEl = document.getElementById('csv-import-status');
    const previewEl = document.getElementById('csv-import-preview');

    if (textarea) textarea.value = '';
    if (fileInput) fileInput.value = '';
    if (statusEl) {
        statusEl.textContent = '';
        statusEl.classList.add('hidden');
    }
    if (previewEl) {
        previewEl.innerHTML = '';
        previewEl.classList.add('hidden');
    }
    if (modal) modal.classList.remove('hidden');
    if (textarea) setTimeout(() => textarea.focus(), 80);
}

export function closeImportCsvModal() {
    const modal = document.getElementById('import-csv-modal');
    if (modal) modal.classList.add('hidden');
}

export function updateCsvImportPreview() {
    const textarea = document.getElementById('csv-paste-input');
    const previewEl = document.getElementById('csv-import-preview');
    const statusEl = document.getElementById('csv-import-status');
    if (!textarea || !previewEl) return;

    const raw = textarea.value.trim();
    if (!raw) {
        previewEl.innerHTML = '';
        previewEl.classList.add('hidden');
        if (statusEl) statusEl.classList.add('hidden');
        return;
    }

    const { validRows, errors } = parseRosterCsvText(raw);
    previewEl.classList.remove('hidden');

    const rowsPreviewHtml = validRows.slice(0, 6).map(r => `
        <div class="flex items-center justify-between text-[11px] py-1 border-b border-zinc-800/70 last:border-b-0">
            <div class="flex items-center space-x-2 min-w-0">
                <span class="px-1.5 py-0.5 rounded bg-[var(--brand-primary)] text-white font-black font-mono text-[10px]">#${r.jersey}</span>
                <span class="font-bold text-white truncate">${escapeRosterHtml(r.name)}</span>
                <span class="text-blue-300 text-[10px] font-semibold">${escapeRosterHtml(r.position)}</span>
            </div>
            <span class="text-[10px] text-zinc-400 truncate max-w-[140px]">${escapeRosterHtml(r.parents || r.notes || '—')}</span>
        </div>
    `).join('');

    const moreCount = validRows.length > 6 ? `<p class="text-[10px] text-zinc-400 pt-1">…and ${validRows.length - 6} more player${validRows.length - 6 === 1 ? '' : 's'}</p>` : '';
    const errorsHtml = errors.length > 0
        ? `<div class="mt-2 p-2 rounded-lg bg-rose-950/60 border border-rose-500/40 text-[10px] text-rose-200 space-y-0.5">${errors.slice(0, 4).map(err => `<p>• ${escapeRosterHtml(err)}</p>`).join('')}${errors.length > 4 ? `<p>• …+${errors.length - 4} more issue(s)</p>` : ''}</div>`
        : '';

    previewEl.innerHTML = `
        <div class="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
            <div class="flex items-center justify-between pb-1 border-b border-zinc-800">
                <span class="text-[11px] font-extrabold text-emerald-400">Ready to Import: ${validRows.length} Player${validRows.length === 1 ? '' : 's'}</span>
                ${errors.length > 0 ? `<span class="text-[10px] font-bold text-rose-400">${errors.length} skipped</span>` : ''}
            </div>
            ${validRows.length > 0 ? rowsPreviewHtml + moreCount : '<p class="text-[11px] text-zinc-500 italic py-1">No valid rows detected yet.</p>'}
            ${errorsHtml}
        </div>
    `;
}

export function handleCsvFileSelect(event) {
    const file = event?.target?.files?.[0];
    if (!file) return;
    const textarea = document.getElementById('csv-paste-input');
    const reader = new FileReader();
    reader.onload = (e) => {
        if (textarea) {
            textarea.value = String(e.target?.result || '');
            updateCsvImportPreview();
        }
    };
    reader.readAsText(file);
}

export async function submitCsvRosterImport(event, matchState, onUpdate) {
    if (event) {
        if (typeof event.preventDefault === 'function') event.preventDefault();
        if (typeof event.stopPropagation === 'function') event.stopPropagation();
    }

    const textarea = document.getElementById('csv-paste-input');
    const overwriteToggle = document.getElementById('csv-overwrite-existing');
    const statusEl = document.getElementById('csv-import-status');
    const submitBtn = document.getElementById('btn-submit-import-csv');

    const showStatus = (msg, isError = false) => {
        if (!statusEl) return;
        statusEl.textContent = msg;
        statusEl.className = isError
            ? 'text-xs font-semibold text-rose-300 bg-rose-950/60 border border-rose-500/40 rounded-xl px-3 py-2'
            : 'text-xs font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 rounded-xl px-3 py-2';
        statusEl.classList.remove('hidden');
    };

    const { validRows } = parseRosterCsvText(textarea?.value || '');
    if (validRows.length === 0) {
        showStatus('Please paste or upload at least one valid CSV row (jersey, name, position, parents, notes).', true);
        return false;
    }

    const allowOverwrite = Boolean(overwriteToggle?.checked);
    const existingJerseys = new Set(players.map(p => Number(p.jersey)));
    const rowsToImport = allowOverwrite
        ? validRows
        : validRows.filter(r => !existingJerseys.has(Number(r.jersey)));

    if (rowsToImport.length === 0) {
        showStatus('All jersey numbers in this CSV already exist on the roster. Enable "Update existing players" to overwrite them.', true);
        return false;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = `Importing ${rowsToImport.length}...`;
    }

    try {
        // 1. Update local roster state immediately
        const upsertedPlayers = rowsToImport.map(row => upsertLocalRosterPlayer(row, matchState));

        // 2. Batch-save player profiles to Firestore (teams/${CURRENT_TEAM_ID}/players/${jersey})
        const batchSize = 5;
        for (let i = 0; i < upsertedPlayers.length; i += batchSize) {
            const batch = upsertedPlayers.slice(i, i + batchSize);
            await Promise.all(
                batch.map(p => savePlayerProfileToFirebase(p.jersey, {
                    jersey: p.jersey,
                    name: p.name,
                    position: p.position,
                    parents: p.parents,
                    siblings: p.siblings,
                    notes: p.notes,
                    isGuest: p.isGuest
                }, playerProfilesMap))
            );
        }

        renderRoster(matchState, true);
        if (typeof onUpdate === 'function') onUpdate();
        closeImportCsvModal();
    } catch (err) {
        console.warn('Bulk CSV import error:', err);
        showStatus('Failed to import some rows. Please check your connection and try again.', true);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '📥 Import Players';
        }
    }

    return false;
}
