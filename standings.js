import { players, getAllRosterPlayers } from './roster.js';
import { savePersistentData } from './firebase.js';

// Default CMSA Boys U13 Tier 2 Standings (18 Teams - Synced with latest CMSA official table)
export const initialLeagueStandings = [
    { id: 1, rank: 1, name: "Blizzard Alliance 14 Boys", team: "Blizzard Alliance 14 Boys", gp: 2, w: 2, t: 0, l: 0, pts: 6, gf: 11, ga: 4, gd: 7, isUs: false },
    { id: 2, rank: 2, name: "Foothills 2014 Prospects", team: "Foothills 2014 Prospects", gp: 2, w: 2, t: 0, l: 0, pts: 6, gf: 9, ga: 4, gd: 5, isUs: false },
    { id: 3, rank: 3, name: "Villains Cyclones 14", team: "Villains Cyclones 14", gp: 2, w: 2, t: 0, l: 0, pts: 6, gf: 9, ga: 5, gd: 4, isUs: false },
    { id: 4, rank: 4, name: "EMFC Juventus 14", team: "EMFC Juventus 14", gp: 2, w: 2, t: 0, l: 0, pts: 6, gf: 11, ga: 8, gd: 3, isUs: false },
    { id: 5, rank: 5, name: "CalGlen Royals 14", team: "CalGlen Royals 14", gp: 2, w: 2, t: 0, l: 0, pts: 6, gf: 9, ga: 7, gd: 2, isUs: false },
    { id: 6, rank: 6, name: "SWU Barca 14B", team: "SWU Barca 14B", gp: 2, w: 1, t: 0, l: 1, pts: 3, gf: 9, ga: 5, gd: 4, isUs: false },
    { id: 7, rank: 7, name: "SWU Atletico 14B", team: "SWU Atletico 14B", gp: 2, w: 1, t: 0, l: 1, pts: 3, gf: 9, ga: 7, gd: 2, isUs: false },
    { id: 8, rank: 8, name: "Blizzard United 14 Boys", team: "Blizzard United 14 Boys", gp: 2, w: 1, t: 0, l: 1, pts: 3, gf: 6, ga: 5, gd: 1, isUs: false },
    { id: 9, rank: 9, name: "Rockies Albion 14", team: "Rockies Albion 14", gp: 2, w: 1, t: 0, l: 1, pts: 3, gf: 7, ga: 6, gd: 1, isUs: true },
    { id: 10, rank: 10, name: "WHU West Hills Gunners 14", team: "WHU West Hills Gunners 14", gp: 2, w: 1, t: 0, l: 1, pts: 3, gf: 9, ga: 9, gd: 0, isUs: false },
    { id: 11, rank: 11, name: "Airdrie F.C. Dynamo 14", team: "Airdrie F.C. Dynamo 14", gp: 2, w: 1, t: 0, l: 1, pts: 3, gf: 9, ga: 9, gd: 0, isUs: false },
    { id: 12, rank: 12, name: "MUSC Storm 14", team: "MUSC Storm 14", gp: 2, w: 1, t: 0, l: 1, pts: 3, gf: 5, ga: 6, gd: -1, isUs: false },
    { id: 13, rank: 13, name: "Chinooks FC Premiers 2014", team: "Chinooks FC Premiers 2014", gp: 2, w: 0, t: 1, l: 1, pts: 1, gf: 3, ga: 5, gd: -2, isUs: false },
    { id: 14, rank: 14, name: "New Frontier SC 2014 Boys (Keith)", team: "New Frontier SC 2014 Boys (Keith)", gp: 2, w: 0, t: 1, l: 1, pts: 1, gf: 5, ga: 7, gd: -2, isUs: false },
    { id: 15, rank: 15, name: "RANGERS ATHLETICS 14", team: "RANGERS ATHLETICS 14", gp: 2, w: 0, t: 0, l: 2, pts: 0, gf: 5, ga: 8, gd: -3, isUs: false },
    { id: 16, rank: 16, name: "Spartans Admirals", team: "Spartans Admirals", gp: 2, w: 0, t: 0, l: 2, pts: 0, gf: 7, ga: 12, gd: -5, isUs: false },
    { id: 17, rank: 17, name: "CCFC Calgary City FC Whitecaps 2014", team: "CCFC Calgary City FC Whitecaps 2014", gp: 2, w: 0, t: 0, l: 2, pts: 0, gf: 5, ga: 11, gd: -6, isUs: false },
    { id: 18, rank: 18, name: "CWFC B2014 Green", team: "CWFC B2014 Green", gp: 2, w: 0, t: 0, l: 2, pts: 0, gf: 2, ga: 12, gd: -10, isUs: false }
];

export function normalizeStandingItem(team, idx = 0) {
    if (!team || typeof team !== 'object') {
        return {
            id: idx + 1,
            rank: idx + 1,
            name: `Team ${idx + 1}`,
            team: `Team ${idx + 1}`,
            gp: 0, w: 0, l: 0, t: 0, gf: 0, ga: 0, gd: 0, pts: 0, isUs: false
        };
    }
    const teamName = String(team.name || team.team || team.teamName || team.club || `Team ${idx + 1}`).trim();
    const gp = Number(team.gp ?? team.played ?? 0) || 0;
    const w = Number(team.w ?? team.wins ?? 0) || 0;
    const l = Number(team.l ?? team.losses ?? 0) || 0;
    const t = Number(team.t ?? team.ties ?? team.d ?? team.draws ?? 0) || 0;
    const gf = Number(team.gf ?? team.goalsFor ?? 0) || 0;
    const ga = Number(team.ga ?? team.goalsAgainst ?? 0) || 0;
    const gd = (team.gd !== undefined) ? Number(team.gd) || 0 : (gf - ga);
    const pts = (team.pts !== undefined) ? Number(team.pts) || 0 : ((w * 3) + (t * 1));
    const isUs = Boolean(team.isUs || (typeof teamName === 'string' && teamName.toLowerCase().includes('rockies')));

    return {
        id: team.id || idx + 1,
        rank: team.rank || idx + 1,
        name: teamName,
        team: teamName,
        gp, w, l, t, gf, ga, gd, pts, isUs
    };
}

export let leagueStandings = (() => {
    try {
        const saved = localStorage.getItem('rfc14_standings_v4');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0 && (parsed[0].name || parsed[0].team)) {
                return parsed.map((item, idx) => normalizeStandingItem(item, idx));
            }
        }
    } catch {}
    return initialLeagueStandings.map((item, idx) => normalizeStandingItem(item, idx));
})();

export function updateLeagueStandings(newStandings) {
    if (Array.isArray(newStandings)) {
        leagueStandings = newStandings.map((item, idx) => normalizeStandingItem(item, idx));
    }
}

export function saveLeagueStandings(matchState, scheduleEvents) {
    try {
        localStorage.setItem('rfc14_standings_v4', JSON.stringify(leagueStandings));
        localStorage.setItem('rfc14_standings', JSON.stringify(leagueStandings));
    } catch {}
    if (matchState && scheduleEvents) {
        savePersistentData(matchState, leagueStandings, scheduleEvents);
    }
}

export function getSortedStandings() {
    return [...leagueStandings]
        .map((t, idx) => normalizeStandingItem(t, idx))
        .sort((a, b) => {
            const ptsA = (a.w * 3) + a.t;
            const ptsB = (b.w * 3) + b.t;
            if (ptsB !== ptsA) return ptsB - ptsA;
            const gdA = a.gf - a.ga;
            const gdB = b.gf - b.ga;
            if (gdB !== gdA) return gdB - gdA;
            return b.gf - a.gf;
        })
        .map((team, idx) => {
            const gd = team.gf - team.ga;
            return {
                ...team,
                rank: idx + 1,
                pts: (team.w * 3) + team.t,
                gd,
                gdDisplay: gd > 0 ? `+${gd}` : `${gd}`
            };
        });
}

export function getOpponentStanding(opponentName) {
    if (!opponentName || typeof opponentName !== 'string') return null;
    const sorted = getSortedStandings();
    const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const target = norm(opponentName);
    if (!target) return null;

    let idx = sorted.findIndex(t => norm(t.name) === target || norm(t.team) === target);
    if (idx === -1) {
        idx = sorted.findIndex(t => {
            const tNorm = norm(t.name || t.team);
            return tNorm && (tNorm.includes(target) || target.includes(tNorm));
        });
    }
    // Specific match-up heuristics for CMSA abbreviations
    if (idx === -1) {
        if (target.includes('atletico')) idx = sorted.findIndex(t => norm(t.name).includes('atletico'));
        else if (target.includes('cwfc')) idx = sorted.findIndex(t => norm(t.name).includes('cwfc'));
        else if (target.includes('whitecaps') || target.includes('ccfc')) idx = sorted.findIndex(t => norm(t.name).includes('whitecaps'));
        else if (target.includes('calglen')) idx = sorted.findIndex(t => norm(t.name).includes('calglen'));
        else if (target.includes('musc') || target.includes('storm')) idx = sorted.findIndex(t => norm(t.name).includes('storm'));
        else if (target.includes('airdrie')) idx = sorted.findIndex(t => norm(t.name).includes('airdrie'));
        else if (target.includes('blizzard')) idx = sorted.findIndex(t => norm(t.name).includes('blizzard') && norm(t.name).includes('alliance'));
        else if (target.includes('villains')) idx = sorted.findIndex(t => norm(t.name).includes('villains'));
        else if (target.includes('rangers')) idx = sorted.findIndex(t => norm(t.name).includes('rangers'));
        else if (target.includes('frontier')) idx = sorted.findIndex(t => norm(t.name).includes('frontier'));
        else if (target.includes('emfc') || target.includes('juventus')) idx = sorted.findIndex(t => norm(t.name).includes('juventus'));
        else if (target.includes('chinooks')) idx = sorted.findIndex(t => norm(t.name).includes('chinooks'));
    }

    if (idx === -1) return null;
    const team = sorted[idx];
    const gp = team.gp !== undefined ? team.gp : (team.w + team.l + team.t);
    const pts = (team.w * 3) + team.t;
    const gd = team.gf - team.ga;
    const gdDisplay = gd > 0 ? `+${gd}` : `${gd}`;

    return {
        ...team,
        rank: idx + 1,
        gp,
        pts,
        gd,
        gdDisplay,
        name: team.name || team.team
    };
}

export function renderStandings(isCoachMode) {
    const tbody = document.getElementById('standings-table-body');
    const coachBtn = document.getElementById('btn-open-edit-standings');
    if (coachBtn) {
        coachBtn.style.display = isCoachMode ? 'inline-flex' : 'none';
    }

    if (!tbody) return;

    const sorted = getSortedStandings();
    tbody.innerHTML = sorted.map(team => {
        const teamName = team.team || 'Unknown Team';
        const isRockies = Boolean(team.isUs || (typeof teamName === 'string' && teamName.toLowerCase().includes('rockies')));
        const rowClass = isRockies 
            ? 'bg-[#003C71]/40 border-l-4 border-blue-400 font-bold text-white' 
            : 'border-b border-zinc-800/60 hover:bg-zinc-800/30 text-zinc-300';
        
        return `
            <tr class="${rowClass} transition text-xs">
                <td class="py-2.5 px-3 text-center font-extrabold ${team.rank <= 3 ? 'text-amber-400' : 'text-zinc-500'}">
                    ${team.rank}
                </td>
                <td class="py-2.5 px-3">
                    <div class="flex items-center space-x-2">
                        ${isRockies 
                            ? `<span class="w-2 h-2 rounded-full bg-blue-400 ring-4 ring-blue-500/20"></span>` 
                            : `<span class="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>`}
                        <span class="${isRockies ? 'text-white font-black' : 'text-zinc-200 font-semibold'}">${teamName}</span>
                        ${isRockies ? `<span class="text-[9px] uppercase px-1.5 py-0.5 rounded bg-blue-900 border border-blue-500/40 text-blue-200 font-bold">Our Team</span>` : ''}
                    </div>
                </td>
                <td class="py-2.5 px-2 text-center text-zinc-400 font-mono">${team.gp}</td>
                <td class="py-2.5 px-2 text-center text-emerald-400 font-bold font-mono">${team.w}</td>
                <td class="py-2.5 px-2 text-center text-amber-400 font-mono">${team.t}</td>
                <td class="py-2.5 px-2 text-center text-rose-400 font-mono">${team.l}</td>
                <td class="py-2.5 px-2 text-center text-zinc-400 hidden sm:table-cell font-mono">${team.gf}</td>
                <td class="py-2.5 px-2 text-center text-zinc-400 hidden sm:table-cell font-mono">${team.ga}</td>
                <td class="py-2.5 px-2 text-center font-mono ${team.gd > 0 ? 'text-emerald-400' : (team.gd < 0 ? 'text-rose-400' : 'text-zinc-400')}">
                    ${team.gd > 0 ? '+' + team.gd : team.gd}
                </td>
                <td class="py-2.5 px-3 text-center font-black text-amber-400 text-sm font-mono">${team.pts}</td>
            </tr>
        `;
    }).join('');
}

// Edit Standings Modal Logic
export function openEditStandingsModal() {
    const modal = document.getElementById('edit-standings-modal');
    const container = document.getElementById('edit-standings-list');
    if (!modal || !container) return;

    container.innerHTML = leagueStandings.map((team, idx) => `
        <div class="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
            <div class="flex items-center justify-between">
                <input type="text" value="${team.team}" data-idx="${idx}" data-field="team" class="bg-zinc-900 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg border border-zinc-700 w-2/3 focus:outline-none focus:border-blue-500">
                <button type="button" onclick="window.deleteStandingsTeam(${idx})" class="text-rose-400 hover:text-rose-300 text-xs font-semibold px-2 py-1">Delete</button>
            </div>
            <div class="grid grid-cols-7 gap-1 text-center text-[10px]">
                <div>
                    <label class="block text-zinc-500 font-bold">GP</label>
                    <input type="number" value="${team.gp}" data-idx="${idx}" data-field="gp" class="w-full bg-zinc-900 border border-zinc-700 rounded px-1 py-1 text-center text-white text-xs">
                </div>
                <div>
                    <label class="block text-emerald-500 font-bold">W</label>
                    <input type="number" value="${team.w}" data-idx="${idx}" data-field="w" class="w-full bg-zinc-900 border border-zinc-700 rounded px-1 py-1 text-center text-white text-xs">
                </div>
                <div>
                    <label class="block text-amber-500 font-bold">T</label>
                    <input type="number" value="${team.t}" data-idx="${idx}" data-field="t" class="w-full bg-zinc-900 border border-zinc-700 rounded px-1 py-1 text-center text-white text-xs">
                </div>
                <div>
                    <label class="block text-rose-500 font-bold">L</label>
                    <input type="number" value="${team.l}" data-idx="${idx}" data-field="l" class="w-full bg-zinc-900 border border-zinc-700 rounded px-1 py-1 text-center text-white text-xs">
                </div>
                <div>
                    <label class="block text-zinc-500 font-bold">GF</label>
                    <input type="number" value="${team.gf}" data-idx="${idx}" data-field="gf" class="w-full bg-zinc-900 border border-zinc-700 rounded px-1 py-1 text-center text-white text-xs">
                </div>
                <div>
                    <label class="block text-zinc-500 font-bold">GA</label>
                    <input type="number" value="${team.ga}" data-idx="${idx}" data-field="ga" class="w-full bg-zinc-900 border border-zinc-700 rounded px-1 py-1 text-center text-white text-xs">
                </div>
                <div>
                    <label class="block text-amber-400 font-bold">PTS</label>
                    <input type="number" value="${team.pts}" data-idx="${idx}" data-field="pts" class="w-full bg-zinc-900 border border-zinc-700 rounded px-1 py-1 text-center text-white text-xs font-bold">
                </div>
            </div>
        </div>
    `).join('');

    modal.classList.remove('hidden');
}

export function closeEditStandingsModal() {
    const modal = document.getElementById('edit-standings-modal');
    if (modal) modal.classList.add('hidden');
}

export function addStandingsTeam() {
    leagueStandings.push({
        rank: leagueStandings.length + 1,
        team: "New CMSA Team",
        gp: 0, w: 0, l: 0, t: 0, gf: 0, ga: 0, gd: 0, pts: 0
    });
    openEditStandingsModal();
}

export function deleteStandingsTeam(index) {
    leagueStandings.splice(index, 1);
    openEditStandingsModal();
}

export function saveEditedStandings(matchState, scheduleEvents, onUpdate) {
    const container = document.getElementById('edit-standings-list');
    if (!container) return;

    const inputs = container.querySelectorAll('input[data-idx]');
    inputs.forEach(inp => {
        const idx = parseInt(inp.getAttribute('data-idx'), 10);
        const field = inp.getAttribute('data-field');
        if (leagueStandings[idx]) {
            if (field === 'team') {
                leagueStandings[idx].team = inp.value.trim() || leagueStandings[idx].team;
            } else {
                leagueStandings[idx][field] = parseInt(inp.value, 10) || 0;
            }
        }
    });

    // Recompute GD
    leagueStandings.forEach(t => {
        t.gd = (t.gf || 0) - (t.ga || 0);
        if (!t.pts && (t.w || t.t)) {
            t.pts = (t.w * 3) + (t.t * 1);
        }
    });

    closeEditStandingsModal();
    savePersistentData(matchState, leagueStandings, scheduleEvents);
    if (typeof onUpdate === 'function') onUpdate();
}

// AI Standings Scanner
let pendingScannedStandings = null;

export async function handleStandingsScreenshotUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const statusEl = document.getElementById('ai-scanner-status');
    const previewContainer = document.getElementById('ai-scanned-preview');
    const applyBtn = document.getElementById('btn-apply-ai-standings');

    if (applyBtn) applyBtn.classList.add('hidden');
    if (previewContainer) {
        previewContainer.classList.add('hidden');
        previewContainer.innerHTML = '';
    }

    if (statusEl) {
        statusEl.innerHTML = `
            <div class="flex items-center space-x-2 text-blue-400 font-semibold py-1">
                <span class="inline-block w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
                <span>Reading image & parsing table with Gemini AI...</span>
            </div>
        `;
    }

    try {
        const reader = new FileReader();
        const base64Promise = new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
        });
        reader.readAsDataURL(file);
        const dataUrl = await base64Promise;

        const response = await fetch('/api/parse-standings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                imageBase64: dataUrl,
                mimeType: file.type || 'image/jpeg'
            })
        });

        const data = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.standings)) {
            throw new Error(data.error || 'Failed to extract standings from screenshot.');
        }

        pendingScannedStandings = data.standings.map((t, idx) => normalizeStandingItem(t, idx));

        if (statusEl) {
            statusEl.innerHTML = `
                <div class="text-xs text-emerald-400 font-bold flex items-center space-x-1.5 py-1">
                    <span>✓</span> <span>Successfully extracted ${pendingScannedStandings.length} teams from CMSA screenshot!</span>
                </div>
            `;
        }

        if (previewContainer) {
            previewContainer.classList.remove('hidden');
            previewContainer.innerHTML = `
                <div class="p-3 bg-zinc-950 border border-emerald-500/40 rounded-xl space-y-2 max-h-60 overflow-y-auto">
                    <div class="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                        <span class="text-xs font-bold text-emerald-400">Preview of AI Extracted Table (${pendingScannedStandings.length} Teams):</span>
                        <span class="text-[10px] text-zinc-400">Click "Apply Scanned Table" below to save</span>
                    </div>
                    <table class="w-full text-left text-[11px]">
                        <thead>
                            <tr class="text-zinc-500 border-b border-zinc-800 text-[10px]">
                                <th class="py-1 px-1">#</th>
                                <th class="py-1 px-1">Team</th>
                                <th class="py-1 px-1 text-center">GP</th>
                                <th class="py-1 px-1 text-center">W</th>
                                <th class="py-1 px-1 text-center">T</th>
                                <th class="py-1 px-1 text-center">L</th>
                                <th class="py-1 px-1 text-center font-bold text-amber-400">PTS</th>
                                <th class="py-1 px-1 text-center">GF</th>
                                <th class="py-1 px-1 text-center">GA</th>
                                <th class="py-1 px-1 text-center">GD</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-zinc-900">
                            ${pendingScannedStandings.map(t => {
                                const isRockies = t.isUs || t.team.toLowerCase().includes('rockies');
                                return `
                                <tr class="${isRockies ? 'bg-blue-950/60 font-bold text-blue-200' : 'text-zinc-300'}">
                                    <td class="py-1 px-1 text-zinc-500">${t.rank}</td>
                                    <td class="py-1 px-1 font-semibold truncate max-w-[150px]">${t.team}</td>
                                    <td class="py-1 px-1 text-center font-mono text-zinc-300">${t.gp}</td>
                                    <td class="py-1 px-1 text-center font-mono text-emerald-400">${t.w}</td>
                                    <td class="py-1 px-1 text-center font-mono text-amber-400">${t.t}</td>
                                    <td class="py-1 px-1 text-center font-mono text-rose-400">${t.l}</td>
                                    <td class="py-1 px-1 text-center font-mono font-black text-amber-300">${t.pts}</td>
                                    <td class="py-1 px-1 text-center font-mono text-zinc-400">${t.gf}</td>
                                    <td class="py-1 px-1 text-center font-mono text-zinc-400">${t.ga}</td>
                                    <td class="py-1 px-1 text-center font-mono ${t.gd > 0 ? 'text-emerald-400' : (t.gd < 0 ? 'text-rose-400' : 'text-zinc-400')}">
                                        ${t.gd > 0 ? `+${t.gd}` : t.gd}
                                    </td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        if (applyBtn) {
            applyBtn.classList.remove('hidden');
            applyBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    } catch (err) {
        console.error('AI Standings extraction error:', err);
        if (statusEl) {
            statusEl.innerHTML = `
                <div class="text-xs text-rose-400 font-semibold flex items-center space-x-1.5 py-1">
                    <span>✕</span> <span>${err.message || 'Error parsing table from image'}. Please try again.</span>
                </div>
            `;
        }
    }
}

export function confirmApplyAiStandings(matchState, scheduleEvents, onUpdate) {
    if (pendingScannedStandings && pendingScannedStandings.length > 0) {
        leagueStandings = pendingScannedStandings.map((t, idx) => normalizeStandingItem(t, idx));
        saveLeagueStandings();
        savePersistentData(matchState, leagueStandings, scheduleEvents);
        pendingScannedStandings = null;
        closeEditStandingsModal();
        if (typeof onUpdate === 'function') onUpdate();
    }
}

// Helper: Check if a position string qualifies as Goalkeeper or Defense
export function isDefenderOrGK(position) {
    if (!position || typeof position !== 'string') return false;
    const p = position.toLowerCase();
    return p.includes('goalkeeper') || p.includes('gk') || p.includes('defense') || p.includes('defender');
}

// Helper: Calculate total Clean Sheets won by the team (a win for us with 0 goals against)
export function getCleanSheetCount(matchState) {
    let cleanSheetWins = 0;
    (matchState?.history || []).forEach(m => {
        const us = Number(m.scoreUs ?? 0);
        const them = Number(m.scoreThem ?? 0);
        if (us > them && them === 0) {
            cleanSheetWins++;
        }
    });
    if (matchState?.isFinal || matchState?.period === 'Full Time') {
        const us = Number(matchState.scoreUs ?? 0);
        const them = Number(matchState.scoreThem ?? 0);
        if (us > them && them === 0) {
            cleanSheetWins++;
        }
    }
    return cleanSheetWins;
}

// Leaderboard Logic
export function renderLeaderboard(matchState) {
    const bootContainer = document.getElementById('leaderboard-golden-boot');
    const playContainer = document.getElementById('leaderboard-playmakers');
    const stopContainer = document.getElementById('leaderboard-defenders');
    const cleanSheetContainer = document.getElementById('leaderboard-clean-sheets');
    const motmContainer = document.getElementById('leaderboard-motm');

    const cleanSheetWins = getCleanSheetCount(matchState);

    const isDefensiveEvent = (e) => {
        if (!e) return false;
        if (e.type === 'defense' || e.type === 'stop' || e.type === 'save' || e.type === 'clearance') return true;
        if (e.action && typeof e.action === 'string') {
            const a = e.action.toLowerCase();
            return a.includes('clearance') || a.includes('stop') || a.includes('save') || a.includes('block') || a.includes('tackle');
        }
        return false;
    };

    const matchesPlayer = (e, p) => {
        if (!e || !p) return false;
        const j = e.playerJersey ?? e.jersey ?? e.defenderJersey;
        if (j !== undefined && j !== null && Number(j) === Number(p.jersey)) return true;
        if (e.playerName && typeof e.playerName === 'string') {
            const en = e.playerName.toLowerCase();
            const pn = p.name.toLowerCase();
            if (en.includes(pn) || pn.includes(en) || en.includes(pn.split(' ')[0])) return true;
        }
        return false;
    };

    const matchesScorer = (e, p) => {
        if (!e || e.type !== 'goal') return false;
        if (e.scorerJersey !== null && e.scorerJersey !== undefined && Number(e.scorerJersey) === Number(p.jersey)) return true;
        if (e.scorerName && typeof e.scorerName === 'string') {
            const sn = e.scorerName.toLowerCase();
            const pn = p.name.toLowerCase();
            if (sn.includes(pn) || pn.includes(sn)) return true;
        }
        return false;
    };

    const matchesAssist = (e, p) => {
        if (!e || e.type !== 'goal') return false;
        if (e.assistJersey !== null && e.assistJersey !== undefined && Number(e.assistJersey) === Number(p.jersey)) return true;
        if (e.assistName && typeof e.assistName === 'string') {
            const an = e.assistName.toLowerCase();
            const pn = p.name.toLowerCase();
            if (an.includes(pn) || pn.includes(an)) return true;
        }
        return false;
    };

    // Aggregate stats for all players (including active call-ups)
    const statsList = getAllRosterPlayers(matchState).map(p => {
        let goals = 0;
        let assists = 0;
        let stops = 0;
        let motms = 0;
        const defensiveHighlights = [];

        // Current match events
        (matchState?.events || []).forEach(e => {
            if (matchesScorer(e, p)) goals++;
            if (matchesAssist(e, p)) assists++;
            if (isDefensiveEvent(e) && matchesPlayer(e, p)) {
                stops++;
                if (e.action) defensiveHighlights.push(e.action);
            }
        });

        // History matches
        (matchState?.history || []).forEach(m => {
            (m.events || []).forEach(e => {
                if (matchesScorer(e, p)) goals++;
                if (matchesAssist(e, p)) assists++;
                if (isDefensiveEvent(e) && matchesPlayer(e, p)) {
                    stops++;
                    if (e.action) defensiveHighlights.push(e.action);
                }
            });
            if (m.motmJersey !== null && m.motmJersey !== undefined && Number(m.motmJersey) === Number(p.jersey)) {
                motms++;
            } else if (m.motmName && typeof m.motmName === 'string' && m.motmName.toLowerCase().includes(p.name.toLowerCase())) {
                motms++;
            }
        });

        // Clean sheets: assigned to Goalkeepers and Defenders if the game ended as a win for us with 0 goals against
        const cleanSheets = isDefenderOrGK(p.position) ? cleanSheetWins : 0;

        return { 
            player: p, 
            goals, 
            assists, 
            stops, 
            cleanSheets, 
            motms, 
            defensiveHighlights: [...new Set(defensiveHighlights)] 
        };
    });

    // 1. Top Goal Scorers
    const topScorers = [...statsList].sort((a, b) => b.goals - a.goals);
    if (bootContainer) {
        bootContainer.innerHTML = topScorers.slice(0, 5).map((item, idx) => `
            <div class="flex items-center justify-between p-2.5 rounded-xl border ${idx === 0 && item.goals > 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-zinc-900 border-zinc-800'}">
                <div class="flex items-center space-x-2.5">
                    <span class="w-5 text-center text-xs font-black ${idx === 0 && item.goals > 0 ? 'text-amber-400' : 'text-zinc-500'}">#${idx + 1}</span>
                    <span class="w-6 h-6 rounded-full bg-blue-900 text-blue-300 flex items-center justify-center font-bold text-[10px]">${item.player.jersey}</span>
                    <span class="text-xs font-bold text-white">${item.player.name}</span>
                </div>
                <span class="text-sm font-extrabold text-amber-400 font-mono">${item.goals} <span class="text-[10px] text-zinc-500 font-normal">G</span></span>
            </div>
        `).join('');
    }

    // 2. Top Assist Providers
    const topAssists = [...statsList].sort((a, b) => b.assists - a.assists);
    if (playContainer) {
        playContainer.innerHTML = topAssists.slice(0, 5).map((item, idx) => `
            <div class="flex items-center justify-between p-2.5 rounded-xl border ${idx === 0 && item.assists > 0 ? 'bg-blue-500/10 border-blue-500/30' : 'bg-zinc-900 border-zinc-800'}">
                <div class="flex items-center space-x-2.5">
                    <span class="w-5 text-center text-xs font-black ${idx === 0 && item.assists > 0 ? 'text-blue-400' : 'text-zinc-500'}">#${idx + 1}</span>
                    <span class="w-6 h-6 rounded-full bg-blue-900 text-blue-300 flex items-center justify-center font-bold text-[10px]">${item.player.jersey}</span>
                    <span class="text-xs font-bold text-white">${item.player.name}</span>
                </div>
                <span class="text-sm font-extrabold text-blue-400 font-mono">${item.assists} <span class="text-[10px] text-zinc-500 font-normal">A</span></span>
            </div>
        `).join('');
    }

    // 3. Top Defensive Heroics & Saves (Shows Logan's goalline clearance & top stops)
    const topStops = [...statsList]
        .sort((a, b) => {
            if (b.stops !== a.stops) return b.stops - a.stops;
            // Prioritize defenders if stops are tied
            if (isDefenderOrGK(b.player.position) && !isDefenderOrGK(a.player.position)) return 1;
            if (!isDefenderOrGK(b.player.position) && isDefenderOrGK(a.player.position)) return -1;
            return a.player.jersey - b.player.jersey;
        });

    if (stopContainer) {
        stopContainer.innerHTML = topStops.slice(0, 6).map((item, idx) => {
            const hasStops = item.stops > 0;
            const highlightText = item.defensiveHighlights.length > 0 
                ? item.defensiveHighlights.join(', ') 
                : (isDefenderOrGK(item.player.position) ? 'Defensive Anchor' : '');

            return `
                <div class="flex items-center justify-between p-2.5 rounded-xl border ${hasStops ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-zinc-900 border-zinc-800'}">
                    <div class="flex items-center space-x-2.5">
                        <span class="w-5 text-center text-xs font-black ${hasStops ? 'text-emerald-400' : 'text-zinc-500'}">${hasStops ? '🧤' : `#${idx + 1}`}</span>
                        <span class="w-6 h-6 rounded-full bg-blue-900 text-blue-300 flex items-center justify-center font-bold text-[10px]">${item.player.jersey}</span>
                        <div>
                            <span class="text-xs font-bold text-white block">${item.player.name}</span>
                            ${highlightText ? `<span class="text-[10px] text-emerald-400 font-semibold block">${highlightText}</span>` : `<span class="text-[10px] text-zinc-500 block">${item.player.position}</span>`}
                        </div>
                    </div>
                    <span class="text-sm font-extrabold ${hasStops ? 'text-emerald-400' : 'text-zinc-500'} font-mono">${item.stops} <span class="text-[10px] text-zinc-500 font-normal">Stops</span></span>
                </div>
            `;
        }).join('');
    }

    // 4. Clean Sheets (Assigned to anyone with Goalkeeper, GK, or Defense as position on clean sheet wins)
    const cleanSheetList = [...statsList]
        .filter(item => isDefenderOrGK(item.player.position))
        .sort((a, b) => {
            if (b.cleanSheets !== a.cleanSheets) return b.cleanSheets - a.cleanSheets;
            return a.player.jersey - b.player.jersey;
        });

    if (cleanSheetContainer) {
        cleanSheetContainer.innerHTML = cleanSheetList.map((item) => {
            const hasCS = item.cleanSheets > 0;
            return `
                <div class="flex items-center justify-between p-2.5 rounded-xl border ${hasCS ? 'bg-teal-500/10 border-teal-500/30' : 'bg-zinc-900 border-zinc-800'}">
                    <div class="flex items-center space-x-2.5">
                        <span class="w-5 text-center text-xs font-black ${hasCS ? 'text-teal-300' : 'text-zinc-600'}">🛡️</span>
                        <span class="w-6 h-6 rounded-full bg-blue-900 text-blue-300 flex items-center justify-center font-bold text-[10px]">${item.player.jersey}</span>
                        <div>
                            <span class="text-xs font-bold text-white block">${item.player.name}</span>
                            <span class="text-[10px] text-zinc-400 font-semibold">${item.player.position}</span>
                        </div>
                    </div>
                    <span class="text-sm font-extrabold ${hasCS ? 'text-teal-300' : 'text-zinc-500'} font-mono">
                        ${item.cleanSheets} <span class="text-[10px] text-zinc-500 font-normal">CS</span>
                    </span>
                </div>
            `;
        }).join('');
    }

    // 5. Man of the Match Honours
    const motmWinners = [...statsList].filter(item => item.motms > 0).sort((a, b) => b.motms - a.motms);
    if (motmContainer) {
        if (motmWinners.length === 0) {
            motmContainer.innerHTML = `<div class="p-3 text-center text-xs text-zinc-500 italic">No Man of the Match honours awarded yet.</div>`;
        } else {
            motmContainer.innerHTML = motmWinners.map((item, idx) => `
                <div class="flex items-center justify-between p-2.5 rounded-xl border bg-amber-500/10 border-amber-500/30">
                    <div class="flex items-center space-x-2.5">
                        <span class="w-5 text-center text-xs font-black text-amber-400">⭐</span>
                        <span class="w-6 h-6 rounded-full bg-blue-900 text-blue-300 flex items-center justify-center font-bold text-[10px]">${item.player.jersey}</span>
                        <div>
                            <span class="text-xs font-bold text-white block">${item.player.name}</span>
                            <span class="text-[10px] text-zinc-400 block">${item.player.position}</span>
                        </div>
                    </div>
                    <span class="text-sm font-extrabold text-amber-400 font-mono">${item.motms} <span class="text-[10px] text-zinc-400 font-normal">MOTM</span></span>
                </div>
            `).join('');
        }
    }
}
