import { savePlayerProfileToFirebase, resolveFirebaseMediaUrl } from './firebase.js';

// Official 12-Player Roster
export const players = [
    { id: 1, jersey: 1, name: "Haaris Nathoo", position: "Goalkeeper", parents: "Rizwan & Rabea", siblings: "", photo: "", videoUrl: "" },
    { id: 3, jersey: 3, name: "Nael Salazar Simon", position: "GK/Winger", parents: "Paulina & Armando", siblings: "", photo: "", videoUrl: "" },
    { id: 4, jersey: 4, name: "Logan Martens", position: "Defense", parents: "Tyler & Rosie", siblings: "", photo: "", videoUrl: "" },
    { id: 5, jersey: 5, name: "Elijah Amoako", position: "Striker", parents: "Franklin & Linda", siblings: "", photo: "", videoUrl: "" },
    { id: 11, jersey: 11, name: "Tristan D'Mello", position: "Winger/Striker", parents: "Melvin & Charlotte", siblings: "", photo: "", videoUrl: "" },
    { id: 22, jersey: 22, name: "Yazed (Zizou) Manasrah", position: "Defense/Midfield", parents: "Family Manasrah", siblings: "", photo: "", videoUrl: "" },
    { id: 35, jersey: 35, name: "Nyle Zachary", position: "Midfield/Forward", parents: "Hug Saleh", siblings: "", photo: "", videoUrl: "" },
    { id: 52, jersey: 52, name: "Sam Campbell", position: "Defense", parents: "Scot & Luba", siblings: "", photo: "", videoUrl: "" },
    { id: 58, jersey: 58, name: "Harrison Locke", position: "Midfield", parents: "Paul & Lauren", siblings: "", photo: "", videoUrl: "" },
    { id: 62, jersey: 62, name: "Elnathan (Nathan) Udoh", position: "Defense/Midfield", parents: "Emmanuel & Dépéjú", siblings: "", photo: "", videoUrl: "" },
    { id: 65, jersey: 65, name: "Nicholas Lai", position: "Defense", parents: "Andy & Bonnie", siblings: "", photo: "", videoUrl: "" },
    { id: 70, jersey: 70, name: "Esteban Bazurto", position: "Midfield/Winger", parents: "Family Bazurto", siblings: "", photo: "", videoUrl: "" }
];

export let playerProfilesMap = (() => {
    try {
        const saved = localStorage.getItem('rfc14_player_profiles');
        return saved ? JSON.parse(saved) : {};
    } catch {
        return {};
    }
})();

export let activePlayerCard = null;

export function applyProfileDocToRoster(docId, data) {
    const jerseyNum = parseInt(docId, 10) || data.jersey;
    if (!jerseyNum) return;
    playerProfilesMap[jerseyNum] = { ...(playerProfilesMap[jerseyNum] || {}), ...data, jersey: jerseyNum };
    const rosterPlayer = players.find(p => p.jersey === jerseyNum);
    if (rosterPlayer) {
        if (data.parents !== undefined) rosterPlayer.parents = data.parents;
        if (data.siblings !== undefined) rosterPlayer.siblings = data.siblings;
        if (data.photo !== undefined) rosterPlayer.photo = data.photo;
        if (data.videoUrl !== undefined) rosterPlayer.videoUrl = data.videoUrl;
    }
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
    return p.includes('goalkeeper') || p.includes('gk') || p.includes('defense') || p.includes('defender');
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
    const player = players.find(p => p.jersey === jNum);

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

// Render Roster Grid
export function renderRoster(matchState) {
    const grid = document.getElementById('roster-grid');
    if (!grid) return;

    grid.innerHTML = players.map(p => {
        const goals = getPlayerGoals(p.jersey, matchState);
        const assists = getPlayerAssists(p.jersey, matchState);
        const stops = getPlayerStops(p.jersey, matchState);
        const motms = getPlayerMOTMCount(p.jersey, matchState);
        const isDefOrGK = isDefenderOrGK(p.position);
        const cleanSheets = isDefOrGK ? getPlayerCleanSheets(p, matchState) : 0;
        const prof = playerProfilesMap[p.jersey] || {};
        const customPhoto = prof.photo !== undefined ? prof.photo : p.photo;
        const customVideo = prof.videoUrl !== undefined ? prof.videoUrl : p.videoUrl;
        const parentsText = prof.parents !== undefined ? prof.parents : (p.parents || 'Family');
        const recentHighlights = getPlayerRecentHighlights(p.jersey, matchState).slice(0, 2);

        return `
        <div onclick="window.openPlayerModal(${p.jersey})" class="bg-zinc-900 border border-zinc-800/90 hover:border-blue-500/50 rounded-2xl p-4 shadow-xl hover:shadow-2xl transition duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden">
            <div class="flex items-start justify-between">
                <div class="pr-2">
                    <div class="flex items-center space-x-1.5">
                        <h3 class="text-sm font-extrabold text-white group-hover:text-blue-400 transition">${p.name}</h3>
                        ${customVideo ? `<span class="text-[10px] bg-blue-950 border border-blue-500/40 text-blue-300 px-1.5 py-0.2 rounded font-bold">▶ Clip</span>` : ''}
                    </div>
                    <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">${p.position}</p>
                    <p class="text-[11px] text-zinc-400 mt-2">👨‍👩‍👦 ${parentsText}</p>
                </div>
                <div class="w-10 h-10 rounded-xl bg-[#003C71] border border-blue-400/40 flex items-center justify-center text-sm font-black text-white shadow-md flex-shrink-0">
                    #${p.jersey}
                </div>
            </div>

            ${recentHighlights.length > 0 ? `
            <div class="mt-3 pt-2.5 border-t border-zinc-800/60 space-y-1.5">
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
    if (countEl) countEl.textContent = `${players.length} Players`;
}

// Player Modal Management
export function openPlayerModal(jersey, matchState) {
    const player = players.find(p => p.jersey === jersey);
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
    const player = players.find(p => p.jersey === jersey);
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

    if (nameEl) nameEl.textContent = player.name;
    if (posEl) posEl.textContent = player.position;
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
                    <div class="w-16 h-16 rounded-2xl bg-[#003C71] border border-blue-400 flex items-center justify-center text-2xl font-black text-white mx-auto mb-2 shadow">
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
