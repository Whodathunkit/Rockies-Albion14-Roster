import { savePersistentData } from './firebase.js';
import { getOpponentStanding } from './standings.js';
import {
    CURRENT_TEAM_ID,
    getActiveTeamConfig,
    resolveFacilityAddress,
    getKitRuleForEventType,
    getTeamStorageKey,
    getTeamStorageItem,
    setTeamStorageItem
} from './tenant.js';

// Official Albion 14 CMSA 2026-2027 Season Schedule Seed (only seeded when CURRENT_TEAM_ID === 'albion14')
const ALBION14_SCHEDULE_SEED = [
            { id: 1, type: "game", title: "CMSA Match vs SWU Atletico 14", opponent: "SWU Atletico 14", isHome: true, date: "Saturday, Oct 17, 2026", kickoff: "3:30 PM - 4:45 PM", arrival: "3:00 PM (30 min prior)", location: "Shane Homes West Soccer Dome (Field 4 7v7)", mapUrl: "https://maps.google.com/?q=Shane+Homes+West+Soccer+Dome+Calgary", jerseyKit: "Black Kit" },
            { id: 2, type: "pdp", title: "Player Development Program (PDP)", opponent: "", date: "Tuesday, Oct 20, 2026", kickoff: "7:15 PM - 8:15 PM", arrival: "7:00 PM (15 min prior)", location: "Royal Oak School (Indoor Gym)", mapUrl: "https://maps.google.com/?q=Royal+Oak+School+Calgary", jerseyKit: "Grey/Blue Training Kit & Size 5 Ball" },
            { id: 3, type: "practice", title: "Team Tactical Practice", opponent: "", date: "Thursday, Oct 22, 2026", kickoff: "7:30 PM - 8:30 PM", arrival: "7:15 PM (15 min prior)", location: "Captain Nichola Goddard School (Main Gym)", mapUrl: "https://maps.google.com/?q=Captain+Nichola+Goddard+School+Calgary", jerseyKit: "Grey/Blue Training Kit & Size 5 Ball" },
            { id: 4, type: "game", title: "CMSA Match @ CWFC B2014 Green", opponent: "CWFC B2014 Green", isHome: false, date: "Saturday, Oct 24, 2026", kickoff: "2:15 PM - 3:30 PM", arrival: "1:45 PM (30 min prior)", location: "Shane Homes West Soccer Dome (Field 2 7v7)", mapUrl: "https://maps.google.com/?q=Shane+Homes+West+Soccer+Dome+Calgary", jerseyKit: "Black Kit" },
            { id: 5, type: "pdp", title: "Player Development Program (PDP)", opponent: "", date: "Tuesday, Oct 27, 2026", kickoff: "7:15 PM - 8:15 PM", arrival: "7:00 PM (15 min prior)", location: "Royal Oak School (Indoor Gym)", mapUrl: "https://maps.google.com/?q=Royal+Oak+School+Calgary", jerseyKit: "Grey/Blue Training Kit & Size 5 Ball" },
            { id: 6, type: "performance", title: "Rockies Performance Session", opponent: "", date: "Wednesday, Oct 28, 2026", kickoff: "6:00 PM - 7:00 PM", arrival: "5:45 PM (15 min prior)", location: "Calgary West Soccer Centre (Field 2a)", mapUrl: "https://maps.google.com/?q=Calgary+West+Soccer+Centre", jerseyKit: "Black Training Kit & Size 5 Ball" },
            { id: 7, type: "practice", title: "Team Tactical Practice", opponent: "", date: "Thursday, Oct 29, 2026", kickoff: "7:30 PM - 8:30 PM", arrival: "7:15 PM (15 min prior)", location: "Captain Nichola Goddard School (Main Gym)", mapUrl: "https://maps.google.com/?q=Captain+Nichola+Goddard+School+Calgary", jerseyKit: "Grey/Blue Training Kit & Size 5 Ball" },
            { id: 8, type: "pdp", title: "Player Development Program (PDP)", opponent: "", date: "Tuesday, Nov 3, 2026", kickoff: "7:15 PM - 8:15 PM", arrival: "7:00 PM (15 min prior)", location: "Royal Oak School (Indoor Gym)", mapUrl: "https://maps.google.com/?q=Royal+Oak+School+Calgary", jerseyKit: "Grey/Blue Training Kit & Size 5 Ball" },
            { id: 9, type: "performance", title: "Rockies Performance Session", opponent: "", date: "Wednesday, Nov 4, 2026", kickoff: "6:00 PM - 7:00 PM", arrival: "5:45 PM (15 min prior)", location: "Calgary West Soccer Centre (Field 2a)", mapUrl: "https://maps.google.com/?q=Calgary+West+Soccer+Centre", jerseyKit: "Black Training Kit & Size 5 Ball" },
            { id: 10, type: "game", title: "CMSA Match vs SWU Barca 14B", opponent: "SWU Barca 14B", isHome: true, date: "Saturday, Nov 7, 2026", kickoff: "12:00 PM - 1:15 PM", arrival: "11:30 AM (30 min prior)", location: "Shouldice Athletic Park (#02/SW Field)", mapUrl: "https://maps.google.com/?q=Shouldice+Athletic+Park+Calgary", jerseyKit: "Black Kit" },
            { id: 11, type: "practice", title: "Team Practice (Makeup for Gym Closure)", opponent: "", date: "Sunday, Nov 8, 2026", kickoff: "5:00 PM - 6:00 PM", arrival: "4:45 PM (15 min prior)", location: "Bearspaw Community Association Gym", mapUrl: "https://maps.google.com/?q=Bearspaw+Community+Association", jerseyKit: "Grey/Blue Training Kit & Size 5 Ball" },
            { id: 12, type: "pdp", title: "Player Development Program (PDP)", opponent: "", date: "Tuesday, Nov 10, 2026", kickoff: "7:15 PM - 8:15 PM", arrival: "7:00 PM (15 min prior)", location: "Royal Oak School (Indoor Gym)", mapUrl: "https://maps.google.com/?q=Royal+Oak+School+Calgary", jerseyKit: "Grey/Blue Training Kit & Size 5 Ball" },
            { id: 13, type: "game", title: "CMSA Match @ Blizzard United 14 Boys", opponent: "Blizzard United 14 Boys", isHome: false, date: "Saturday, Nov 14, 2026", kickoff: "8:15 PM - 9:30 PM", arrival: "7:45 PM (30 min prior)", location: "Shane Homes West Soccer Dome (Field 2 7v7)", mapUrl: "https://maps.google.com/?q=Shane+Homes+West+Soccer+Dome+Calgary", jerseyKit: "Black Kit" },
            { id: 14, type: "performance", title: "Rockies Performance Session", opponent: "", date: "Sunday, Nov 15, 2026", kickoff: "5:00 PM - 6:00 PM", arrival: "4:45 PM (15 min prior)", location: "Bearspaw Community Association Gym", mapUrl: "https://maps.google.com/?q=Bearspaw+Community+Association", jerseyKit: "Black Training Kit & Size 5 Ball" },
            { id: 15, type: "pdp", title: "Player Development Program (PDP)", opponent: "", date: "Tuesday, Nov 17, 2026", kickoff: "7:15 PM - 8:15 PM", arrival: "7:00 PM (15 min prior)", location: "Royal Oak School (Indoor Gym)", mapUrl: "https://maps.google.com/?q=Royal+Oak+School+Calgary", jerseyKit: "Grey/Blue Training Kit & Size 5 Ball" },
            { id: 16, type: "performance", title: "Rockies Performance Session", opponent: "", date: "Wednesday, Nov 18, 2026", kickoff: "6:00 PM - 7:00 PM", arrival: "5:45 PM (15 min prior)", location: "Calgary West Soccer Centre (Field 2a)", mapUrl: "https://maps.google.com/?q=Calgary+West+Soccer+Centre", jerseyKit: "Black Training Kit & Size 5 Ball" },
            { id: 17, type: "practice", title: "Team Tactical Practice", opponent: "", date: "Thursday, Nov 19, 2026", kickoff: "7:30 PM - 8:30 PM", arrival: "7:15 PM (15 min prior)", location: "Captain Nichola Goddard School (Main Gym)", mapUrl: "https://maps.google.com/?q=Captain+Nichola+Goddard+School+Calgary", jerseyKit: "Grey/Blue Training Kit & Size 5 Ball" },
            { id: 18, type: "game", title: "CMSA Match @ CCFC Calgary City FC Whitecaps 2014", opponent: "CCFC Calgary City FC Whitecaps 2014", isHome: false, date: "Saturday, Nov 21, 2026", kickoff: "10:30 AM - 11:45 AM", arrival: "10:00 AM (30 min prior)", location: "Foothills Macron Centre (Field B)", mapUrl: "https://maps.google.com/?q=Foothills+Macron+Centre+Calgary", jerseyKit: "Black Kit" },
            { id: 19, type: "pdp", title: "Player Development Program (PDP)", opponent: "", date: "Tuesday, Nov 24, 2026", kickoff: "7:15 PM - 8:15 PM", arrival: "7:00 PM (15 min prior)", location: "Royal Oak School (Indoor Gym)", mapUrl: "https://maps.google.com/?q=Royal+Oak+School+Calgary", jerseyKit: "Grey/Blue Training Kit & Size 5 Ball" },
            { id: 20, type: "performance", title: "Rockies Performance Session", opponent: "", date: "Wednesday, Nov 25, 2026", kickoff: "6:00 PM - 7:00 PM", arrival: "5:45 PM (15 min prior)", location: "Calgary West Soccer Centre (Field 2a)", mapUrl: "https://maps.google.com/?q=Calgary+West+Soccer+Centre", jerseyKit: "Black Training Kit & Size 5 Ball" },
            { id: 21, type: "game", title: "CMSA Match vs CalGlen Royals 14", opponent: "CalGlen Royals 14", isHome: true, date: "Saturday, Nov 28, 2026", kickoff: "5:00 PM - 6:15 PM", arrival: "4:30 PM (30 min prior)", location: "Shouldice Athletic Park (#01/NW Field)", mapUrl: "https://maps.google.com/?q=Shouldice+Athletic+Park+Calgary", jerseyKit: "Black Kit" },
            { id: 22, type: "pdp", title: "Player Development Program (PDP)", opponent: "", date: "Tuesday, Dec 1, 2026", kickoff: "7:15 PM - 8:15 PM", arrival: "7:00 PM (15 min prior)", location: "Royal Oak School (Indoor Gym)", mapUrl: "https://maps.google.com/?q=Royal+Oak+School+Calgary", jerseyKit: "Grey/Blue Training Kit & Size 5 Ball" },
            { id: 23, type: "practice", title: "Team Tactical Practice", opponent: "", date: "Thursday, Dec 3, 2026", kickoff: "7:30 PM - 8:30 PM", arrival: "7:15 PM (15 min prior)", location: "Captain Nichola Goddard School (Main Gym)", mapUrl: "https://maps.google.com/?q=Captain+Nichola+Goddard+School+Calgary", jerseyKit: "Grey/Blue Training Kit & Size 5 Ball" },
            { id: 24, type: "practice", title: "Special Team Practice (In Lieu of Game)", opponent: "", date: "Saturday, Dec 5, 2026", kickoff: "4:00 PM - 5:00 PM", arrival: "3:45 PM (15 min prior)", location: "Edge School (Field 1)", mapUrl: "https://maps.google.com/?q=Edge+School+Calgary", jerseyKit: "Grey/Blue Training Kit & Size 5 Ball" },
            { id: 25, type: "performance", title: "Rockies Performance Session", opponent: "", date: "Sunday, Dec 6, 2026", kickoff: "5:00 PM - 6:00 PM", arrival: "4:45 PM (15 min prior)", location: "Bearspaw Community Association Gym", mapUrl: "https://maps.google.com/?q=Bearspaw+Community+Association", jerseyKit: "Black Training Kit & Size 5 Ball" },
            { id: 26, type: "pdp", title: "Player Development Program (PDP)", opponent: "", date: "Tuesday, Dec 8, 2026", kickoff: "7:15 PM - 8:15 PM", arrival: "7:00 PM (15 min prior)", location: "Royal Oak School (Indoor Gym)", mapUrl: "https://maps.google.com/?q=Royal+Oak+School+Calgary", jerseyKit: "Grey/Blue Training Kit & Size 5 Ball" },
            { id: 27, type: "performance", title: "Rockies Performance Session", opponent: "", date: "Wednesday, Dec 9, 2026", kickoff: "6:00 PM - 7:00 PM", arrival: "5:45 PM (15 min prior)", location: "Calgary West Soccer Centre (Field 2a)", mapUrl: "https://maps.google.com/?q=Calgary+West+Soccer+Centre", jerseyKit: "Black Training Kit & Size 5 Ball" },
            { id: 28, type: "game", title: "CMSA Match @ MUSC Storm 14", opponent: "MUSC Storm 14", isHome: false, date: "Saturday, Dec 12, 2026", kickoff: "9:30 AM - 10:45 AM", arrival: "9:00 AM (30 min prior)", location: "Shouldice Athletic Park (#01/NW Field)", mapUrl: "https://maps.google.com/?q=Shouldice+Athletic+Park+Calgary", jerseyKit: "Black Kit" },
            { id: 29, type: "practice", title: "Team Practice (Makeup for Gym Closure)", opponent: "", date: "Sunday, Dec 13, 2026", kickoff: "6:00 PM - 7:00 PM", arrival: "5:45 PM (15 min prior)", location: "Bearspaw Community Association Gym", mapUrl: "https://maps.google.com/?q=Bearspaw+Community+Association", jerseyKit: "Grey/Blue Training Kit & Size 5 Ball" },
            { id: 30, type: "pdp", title: "Player Development Program (PDP)", opponent: "", date: "Tuesday, Dec 15, 2026", kickoff: "7:15 PM - 8:15 PM", arrival: "7:00 PM (15 min prior)", location: "Royal Oak School (Indoor Gym)", mapUrl: "https://maps.google.com/?q=Royal+Oak+School+Calgary", jerseyKit: "Grey/Blue Training Kit & Size 5 Ball" },
            { id: 31, type: "performance", title: "Rockies Performance Session", opponent: "", date: "Wednesday, Dec 16, 2026", kickoff: "6:00 PM - 7:00 PM", arrival: "5:45 PM (15 min prior)", location: "Calgary West Soccer Centre (Field 2a)", mapUrl: "https://maps.google.com/?q=Calgary+West+Soccer+Centre", jerseyKit: "Black Training Kit & Size 5 Ball" },
            { id: 32, type: "game", title: "CMSA Match vs Airdrie F.C. Dynamo 14", opponent: "Airdrie F.C. Dynamo 14", isHome: true, date: "Saturday, Dec 19, 2026", kickoff: "12:00 PM - 1:15 PM", arrival: "11:30 AM (30 min prior)", location: "Shane Homes West Soccer Dome (Field 3 7v7)", mapUrl: "https://maps.google.com/?q=Shane+Homes+West+Soccer+Dome+Calgary", jerseyKit: "Black Kit" },
            { id: 33, type: "game", title: "CMSA Match vs Blizzard Alliance 14 Boys", opponent: "Blizzard Alliance 14 Boys", isHome: true, date: "Saturday, Jan 2, 2027", kickoff: "6:15 PM - 7:30 PM", arrival: "5:45 PM (30 min prior)", location: "Shouldice Athletic Park (#02/SW Field)", mapUrl: "https://maps.google.com/?q=Shouldice+Athletic+Park+Calgary", jerseyKit: "Black Kit" },
            { id: 34, type: "game", title: "CMSA Match @ Villains Cyclones 14", opponent: "Villains Cyclones 14", isHome: false, date: "Saturday, Jan 9, 2027", kickoff: "10:30 AM - 11:45 AM", arrival: "10:00 AM (30 min prior)", location: "Foothills Macron Centre (Field B)", mapUrl: "https://maps.google.com/?q=Foothills+Macron+Centre+Calgary", jerseyKit: "Black Kit" },
            { id: 35, type: "game", title: "CMSA Match vs RANGERS ATHLETICS 14", opponent: "RANGERS ATHLETICS 14", isHome: true, date: "Saturday, Jan 16, 2027", kickoff: "1:15 PM - 2:30 PM", arrival: "12:45 PM (30 min prior)", location: "MaxWell Soccer Centre (MSC Dome SE 7v7)", mapUrl: "https://maps.google.com/?q=MaxWell+Soccer+Centre+Calgary", jerseyKit: "Black Kit" },
            { id: 36, type: "game", title: "CMSA Match vs New Frontier SC 14 Boys (Shaw)", opponent: "New Frontier SC 14 Boys (Shaw)", isHome: true, date: "Saturday, Jan 30, 2027", kickoff: "5:45 PM - 7:00 PM", arrival: "5:15 PM (30 min prior)", location: "Shane Homes West Soccer Dome (Field 1 7v7)", mapUrl: "https://maps.google.com/?q=Shane+Homes+West+Soccer+Dome+Calgary", jerseyKit: "Black Kit" },
            { id: 37, type: "game", title: "CMSA Match @ EMFC Juventus 14", opponent: "EMFC Juventus 14", isHome: false, date: "Saturday, Feb 20, 2027", kickoff: "11:45 AM - 1:00 PM", arrival: "11:15 AM (30 min prior)", location: "Foothills Macron Centre (Field B)", mapUrl: "https://maps.google.com/?q=Foothills+Macron+Centre+Calgary", jerseyKit: "Black Kit" },
            { id: 38, type: "game", title: "CMSA Match @ Chinooks FC Premiers 2014", opponent: "Chinooks FC Premiers 2014", isHome: false, date: "Saturday, Feb 27, 2027", kickoff: "11:45 AM - 1:00 PM", arrival: "11:15 AM (30 min prior)", location: "Foothills Macron Centre (Field B)", mapUrl: "https://maps.google.com/?q=Foothills+Macron+Centre+Calgary", jerseyKit: "Black Kit" }
];

export const initialScheduleEvents = CURRENT_TEAM_ID === 'albion14' ? ALBION14_SCHEDULE_SEED : [];

export function parseEventDate(dateStr) {
    if (!dateStr) return null;
    let cleaned = String(dateStr).replace(/^[A-Za-z]+,\s*/, '').trim();
    if (!/\b(202[0-9]|203[0-9])\b/.test(cleaned)) {
        const monthMatch = cleaned.match(/^[A-Za-z]+/);
        const monthName = monthMatch ? monthMatch[0].toLowerCase() : '';
        const isSpring = ['jan', 'january', 'feb', 'february', 'mar', 'march', 'apr', 'april', 'may'].some(m => monthName.startsWith(m));
        cleaned = `${cleaned}, ${isSpring ? '2027' : '2026'}`;
    }
    const parsed = new Date(cleaned);
    return isNaN(parsed.getTime()) ? null : parsed;
}

export function isFutureOrTodayEvent(dateStr) {
    if (!dateStr) return true;
    const parsed = parseEventDate(dateStr);
    if (!parsed) return true;
    // Keep events from today until the end of the day (23:59:59)
    const eventEndOfDay = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 23, 59, 59, 999);
    return eventEndOfDay >= new Date();
}

export function normalizeScheduleEvent(ev, idx = 0) {
    const activeConfig = getActiveTeamConfig();
    const leagueName = activeConfig.leagueName || 'CMSA';
    const gameArrivalMin = activeConfig.arrivalRules?.gameMinutes || 30;
    const trainArrivalMin = activeConfig.arrivalRules?.trainingMinutes || 15;

    if (!ev || typeof ev !== 'object') {
        const fallbackLoc = activeConfig.trainingDefaults?.practice?.defaultLocation || 'Calgary West Soccer Centre';
        const fallbackAddr = resolveFacilityAddress(fallbackLoc, activeConfig);
        return {
            id: idx + 1,
            type: 'practice',
            title: 'Team Tactical Practice',
            opponent: '',
            isHome: true,
            date: 'TBD',
            kickoff: 'TBD',
            arrival: `${trainArrivalMin} min prior`,
            location: fallbackLoc,
            address: fallbackAddr,
            mapUrl: `https://maps.google.com/?q=${encodeURIComponent(fallbackAddr || fallbackLoc)}`,
            jerseyKit: getKitRuleForEventType('practice', activeConfig)
        };
    }

    const eventType = ev.type || 'game';
    const isGame = eventType === 'game';
    const isHome = ev.isHome ?? (ev.homeAway === 'Home' || !ev.opponent?.startsWith('@'));

    // Resolve default kit dynamically from active Club/Team configuration
    const defaultKit = getKitRuleForEventType(eventType, activeConfig);
    let resolvedKit = String(ev.jerseyKit || ev.uniformKit || defaultKit).trim();

    // Automatic migration of legacy Albion 14 stored uniform strings
    if (CURRENT_TEAM_ID === 'albion14') {
        if (isGame && (resolvedKit.includes('Royal Blue') || resolvedKit.includes('Away Alternate'))) {
            resolvedKit = getKitRuleForEventType('game', activeConfig);
        } else if (eventType === 'pdp' && resolvedKit.includes('Black Training Kit')) {
            resolvedKit = getKitRuleForEventType('pdp', activeConfig);
        }
    }

    let resolvedAddress = String(ev.address || '').trim();
    if (!resolvedAddress && ev.location) {
        resolvedAddress = resolveFacilityAddress(ev.location, activeConfig);
    }

    const mapQuery = resolvedAddress || ev.location || 'Calgary';
    const mapUrl = `https://maps.google.com/?q=${encodeURIComponent(mapQuery)}`;

    return {
        id: Number(ev.id) || idx + 1,
        type: eventType,
        title: String(ev.title || (isGame ? `${leagueName} Match ${isHome ? 'vs' : '@'} ${ev.opponent || 'Opponent'}` : 'Team Practice')).trim(),
        opponent: String(ev.opponent || '').trim(),
        isHome: Boolean(isHome),
        date: String(ev.date || 'TBD').trim(),
        kickoff: String(ev.kickoff || ev.time || 'TBD').trim(),
        arrival: String(ev.arrival || (isGame ? `${gameArrivalMin} min prior` : `${trainArrivalMin} min prior`)).trim(),
        location: String(ev.location || 'Calgary').trim(),
        address: resolvedAddress,
        mapUrl: mapUrl,
        jerseyKit: resolvedKit
    };
}

// Load team-scoped schedule with versioned cache check; only seed 38-event schedule for albion14
export let scheduleEvents = (() => {
    try {
        const saved =
            getTeamStorageItem('schedule_v4', 'rfc14_schedule_v4') ||
            getTeamStorageItem('schedule_v3', 'rfc14_schedule_v3') ||
            getTeamStorageItem('schedule', 'rfc14_schedule');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
                if (parsed.length === 0 && CURRENT_TEAM_ID !== 'albion14') {
                    return [];
                }
                if (parsed.length > 0 && parsed[0].kickoff) {
                    const normalized = parsed.map((e, idx) => normalizeScheduleEvent(e, idx));
                    setTeamStorageItem('schedule_v4', normalized);
                    return normalized;
                }
            }
        }
    } catch {}

    if (CURRENT_TEAM_ID === 'albion14') {
        const initial = ALBION14_SCHEDULE_SEED.map((e, idx) => normalizeScheduleEvent(e, idx));
        setTeamStorageItem('schedule_v4', initial);
        return initial;
    }

    return [];
})();

export let currentScheduleFilter = 'all';
export let showOnlyFutureEvents = true; // User request: "we only want to see current day and future events"

export function updateScheduleEvents(newEvents) {
    if (Array.isArray(newEvents)) {
        scheduleEvents = newEvents.map((e, idx) => normalizeScheduleEvent(e, idx));
    }
}

export function saveScheduleEvents(matchState, leagueStandings) {
    try {
        localStorage.setItem(getTeamStorageKey('schedule_v4'), JSON.stringify(scheduleEvents));
        setTeamStorageItem('schedule_v4', scheduleEvents);
    } catch {}
    savePersistentData(matchState || null, leagueStandings || null, scheduleEvents);
}

export function togglePastEventsSchedule(leagueStandings, isCoachMode) {
    showOnlyFutureEvents = !showOnlyFutureEvents;
    const label = document.getElementById('toggle-past-events-label');
    if (label) {
        label.textContent = showOnlyFutureEvents ? 'Current Day & Future' : 'All Season Events';
        label.className = showOnlyFutureEvents ? 'text-amber-400 font-extrabold' : 'text-blue-300 font-extrabold';
    }
    renderSchedule(leagueStandings, isCoachMode);
}

export function filterSchedule(filterType, leagueStandings, isCoachMode) {
    currentScheduleFilter = filterType;
    ['all', 'game', 'practice'].forEach(t => {
        const btn = document.getElementById(`sched-filter-${t}`);
        if (btn) {
            if (t === filterType) {
                btn.className = 'px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-black shadow border border-blue-400/50';
            } else {
                btn.className = 'px-3.5 py-1.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 transition font-bold';
            }
        }
    });
    renderSchedule(leagueStandings, isCoachMode);
}

export function renderSchedule(leagueStandings, isCoachMode) {
    const list = document.getElementById('schedule-cards-list') || document.getElementById('schedule-event-list');
    const coachBtn = document.getElementById('btn-add-event') || document.getElementById('btn-open-add-event');

    if (coachBtn) {
        coachBtn.style.display = isCoachMode ? 'inline-flex' : 'none';
    }

    if (!list) return;

    const filtered = scheduleEvents.filter(ev => {
        if (showOnlyFutureEvents && !isFutureOrTodayEvent(ev.date)) return false;
        if (currentScheduleFilter === 'all') return true;
        if (currentScheduleFilter === 'game') return ev.type === 'game';
        if (currentScheduleFilter === 'practice') return ev.type === 'practice' || ev.type === 'pdp' || ev.type === 'performance';
        return ev.type === currentScheduleFilter;
    });

    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="p-8 text-center bg-zinc-900/60 rounded-3xl border border-zinc-800 space-y-3">
                <p class="text-sm text-zinc-400 font-medium">No scheduled events match this filter.</p>
                ${showOnlyFutureEvents ? `
                    <button onclick="window.togglePastEventsSchedule()" class="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition border border-zinc-700 shadow">
                        Show Past Events
                    </button>
                ` : ''}
            </div>
        `;
        return;
    }

    const activeConfig = getActiveTeamConfig();
    const leagueName = activeConfig.leagueName || 'CMSA';

    list.innerHTML = filtered.map(ev => {
        const isGame = ev.type === 'game';
        const isPDP = ev.type === 'pdp';
        const isPerf = ev.type === 'performance';

        let badgeLabel = `⚽ ${leagueName} Match`;
        let badgeClass = 'bg-blue-950 text-blue-300 border-blue-500/50';

        if (isPDP) {
            badgeLabel = '🎯 PDP Clinic';
            badgeClass = 'bg-purple-950 text-purple-300 border-purple-500/50';
        } else if (isPerf) {
            badgeLabel = '⚡ Performance';
            badgeClass = 'bg-amber-950 text-amber-300 border-amber-500/50';
        } else if (!isGame) {
            badgeLabel = '🏃 Team Practice';
            badgeClass = 'bg-emerald-950 text-emerald-300 border-emerald-500/50';
        }

        const oppStats = isGame ? getOpponentStanding(ev.opponent || ev.title) : null;

        return `
            <div class="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3.5 relative overflow-hidden transition hover:border-zinc-700">
                
                <!-- Header: Type Badge, Date, Kickoff & Arrival -->
                <div class="flex items-start justify-between gap-3">
                    <div class="space-y-1">
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="${badgeClass} border text-[11px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                                ${badgeLabel}
                            </span>
                            <span class="text-xs sm:text-sm font-extrabold text-white">${ev.date}</span>
                        </div>
                        <h3 class="text-base sm:text-lg font-black text-white tracking-tight mt-1 flex items-center space-x-2">
                            <span>${ev.title}</span>
                            ${isGame ? `
                                <span class="text-[10px] uppercase font-black px-2 py-0.5 rounded-md ${ev.isHome ? 'bg-blue-900 text-blue-100 border border-blue-400/40' : 'bg-zinc-800 text-zinc-300 border border-zinc-700'}">
                                    ${ev.isHome ? 'HOME' : 'AWAY'}
                                </span>
                            ` : ''}
                        </h3>
                    </div>

                    <div class="text-right flex-shrink-0">
                        <span class="text-xs sm:text-sm font-black text-amber-400 font-mono bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 block shadow-sm">
                            ${ev.kickoff}
                        </span>
                        <p class="text-[11px] text-zinc-400 font-semibold mt-1">
                            Arrive: <strong class="text-white font-bold">${ev.arrival}</strong>
                        </p>
                        ${isCoachMode ? `
                            <div class="flex items-center justify-end space-x-2 mt-1">
                                <button type="button" onclick="window.openEditEventModal(${ev.id})" class="text-xs text-blue-400 hover:text-blue-300 font-bold transition flex items-center space-x-1" title="Edit this fixture or practice">
                                    <span>✏️</span> <span>Edit</span>
                                </button>
                                <span class="text-zinc-600">•</span>
                                <button type="button" onclick="window.deleteScheduleEvent(${ev.id})" class="text-xs text-rose-400 hover:text-rose-300 font-bold transition" title="Delete fixture">
                                    <span>&times; Delete</span>
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- OPPONENT STANDINGS: Prominent, Large, and Easy to Read -->
                ${isGame && oppStats ? `
                    <div class="bg-zinc-950/95 border border-zinc-800 rounded-2xl p-3.5 sm:p-4 shadow-inner space-y-3">
                        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
                            <div class="flex items-center space-x-2.5">
                                <button type="button" onclick="window.switchTab('standings')" class="px-3 py-1 rounded-xl bg-amber-950/90 hover:bg-amber-900 border border-amber-500/50 text-xs sm:text-sm font-black text-amber-300 font-mono tracking-wider transition shadow-sm flex items-center space-x-1" title="View Full Standings Table">
                                    <span>🏆 Rank #${oppStats.rank}</span>
                                </button>
                                <div>
                                    <span class="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">Opposition Record</span>
                                    <span class="text-sm sm:text-base font-black text-white">${oppStats.name}</span>
                                </div>
                            </div>
                            <div class="flex items-center space-x-2">
                                <span class="px-3.5 py-1 rounded-xl bg-blue-950 border border-blue-500/50 text-blue-200 text-sm sm:text-base font-black font-mono shadow">
                                    ${oppStats.pts} PTS
                                </span>
                            </div>
                        </div>

                        <!-- Opponent Stats Grid: Bold, high contrast, readable -->
                        <div class="grid grid-cols-4 sm:grid-cols-7 gap-2 text-center font-mono">
                            <div class="bg-zinc-900/90 border border-zinc-800 rounded-xl px-2 py-1.5 shadow-sm">
                                <div class="text-[10px] font-sans font-extrabold text-zinc-400 uppercase tracking-wider">GP</div>
                                <div class="text-sm sm:text-base font-black text-zinc-200">${oppStats.gp}</div>
                            </div>
                            <div class="bg-zinc-900/90 border border-zinc-800 rounded-xl px-2 py-1.5 shadow-sm">
                                <div class="text-[10px] font-sans font-extrabold text-emerald-400 uppercase tracking-wider">Wins</div>
                                <div class="text-sm sm:text-base font-black text-emerald-400">${oppStats.w}</div>
                            </div>
                            <div class="bg-zinc-900/90 border border-zinc-800 rounded-xl px-2 py-1.5 shadow-sm">
                                <div class="text-[10px] font-sans font-extrabold text-rose-400 uppercase tracking-wider">Losses</div>
                                <div class="text-sm sm:text-base font-black text-rose-400">${oppStats.l}</div>
                            </div>
                            <div class="bg-zinc-900/90 border border-zinc-800 rounded-xl px-2 py-1.5 shadow-sm">
                                <div class="text-[10px] font-sans font-extrabold text-amber-300 uppercase tracking-wider">Ties</div>
                                <div class="text-sm sm:text-base font-black text-amber-300">${oppStats.t}</div>
                            </div>
                            <div class="bg-zinc-900/90 border border-zinc-800 rounded-xl px-2 py-1.5 shadow-sm">
                                <div class="text-[10px] font-sans font-extrabold text-zinc-400 uppercase tracking-wider">GF</div>
                                <div class="text-sm sm:text-base font-bold text-zinc-300">${oppStats.gf}</div>
                            </div>
                            <div class="bg-zinc-900/90 border border-zinc-800 rounded-xl px-2 py-1.5 shadow-sm">
                                <div class="text-[10px] font-sans font-extrabold text-zinc-400 uppercase tracking-wider">GA</div>
                                <div class="text-sm sm:text-base font-bold text-zinc-300">${oppStats.ga}</div>
                            </div>
                            <div class="bg-zinc-900/90 border border-zinc-800 rounded-xl px-2 py-1.5 shadow-sm col-span-2 sm:col-span-1">
                                <div class="text-[10px] font-sans font-extrabold uppercase tracking-wider ${oppStats.gd >= 0 ? 'text-emerald-400' : 'text-rose-400'}">GD</div>
                                <div class="text-sm sm:text-base font-black ${oppStats.gd > 0 ? 'text-emerald-400' : (oppStats.gd < 0 ? 'text-rose-400' : 'text-zinc-300')}">${oppStats.gdDisplay}</div>
                            </div>
                        </div>
                    </div>
                ` : ''}

                <!-- Footer: Location & Directions, Uniform Kit, Coach Action -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2.5 border-t border-zinc-800/80 text-xs">
                    <div class="flex flex-col sm:flex-row sm:items-center gap-1.5 text-zinc-300">
                        <div class="flex items-center space-x-2">
                            <span class="font-bold text-white">📍 ${ev.location}</span>
                            <a href="${ev.mapUrl}" target="_blank" rel="noopener noreferrer" class="px-2 py-0.5 rounded-md bg-blue-950/80 hover:bg-blue-900 border border-blue-500/40 text-blue-300 hover:text-white font-bold text-[11px] transition inline-flex items-center space-x-1" title="Open GPS directions in Google Maps">
                                <span>🗺️</span>
                                <span>Maps ↗</span>
                            </a>
                        </div>
                        ${ev.address && ev.address !== ev.location ? `
                            <span class="text-[11px] text-zinc-400 font-medium sm:before:content-['•'] sm:before:mr-1.5">
                                ${ev.address}
                            </span>
                        ` : ''}
                    </div>

                    <div class="flex flex-wrap items-center gap-2">
                        <span class="text-xs font-semibold ${
                            ev.jerseyKit.includes('Black Kit')
                                ? 'text-zinc-100 bg-zinc-950 border border-zinc-700 shadow-sm'
                                : (ev.jerseyKit.includes('Grey/Blue')
                                    ? 'text-blue-300 bg-blue-950/60 border border-blue-500/40 shadow-sm'
                                    : 'text-amber-300 bg-amber-950/50 border border-amber-500/40 shadow-sm')
                        } px-3 py-1 rounded-xl flex items-center space-x-1.5">
                            <span>👕</span>
                            <span class="font-extrabold">${ev.jerseyKit}</span>
                        </span>
                        ${isGame && isCoachMode ? `
                            <button type="button" onclick="window.startMatchFromSchedule('${ev.opponent}')" class="px-3.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow active:scale-95 transition flex items-center space-x-1">
                                <span>⚡ Start in Tracker</span>
                            </button>
                        ` : ''}
                    </div>
                </div>

            </div>
        `;
    }).join('');
}

export function handleEventTypeChange() {
    const activeConfig = getActiveTeamConfig();
    const defaults = activeConfig.trainingDefaults || {};
    const type = document.getElementById('new-event-type')?.value || 'practice';
    const opponentLabel = document.getElementById('new-event-opponent-label');
    const opponentInput = document.getElementById('new-event-opponent');
    const homeAwayGroup = document.getElementById('new-event-homeaway-group');
    const kitInput = document.getElementById('new-event-kit');
    const locationInput = document.getElementById('new-event-location');
    const addressInput = document.getElementById('new-event-address');
    const timeInput = document.getElementById('new-event-time');

    const knownDefaultLocs = [
        defaults.pdp?.defaultLocation,
        defaults.performance?.defaultLocation,
        defaults.practice?.defaultLocation
    ].filter(Boolean);
    const knownDefaultAddrs = [
        defaults.pdp?.defaultAddress,
        defaults.performance?.defaultAddress,
        defaults.practice?.defaultAddress
    ].filter(Boolean);

    const isAutoLocation = !locationInput?.value || knownDefaultLocs.includes(locationInput.value);
    const isAutoAddress = !addressInput?.value || knownDefaultAddrs.includes(addressInput.value);

    if (kitInput) {
        kitInput.value = getKitRuleForEventType(type, activeConfig);
    }

    if (type === 'game') {
        const gameDef = defaults.game || {};
        if (opponentLabel) opponentLabel.textContent = 'Opponent Team Name *';
        if (opponentInput) {
            opponentInput.placeholder = gameDef.opponentPlaceholder || 'e.g. Opponent FC';
        }
        if (homeAwayGroup) homeAwayGroup.style.display = 'block';
        if (locationInput) locationInput.placeholder = gameDef.locationPlaceholder || 'Home Soccer Facility';
        if (addressInput) addressInput.placeholder = gameDef.addressPlaceholder || resolveFacilityAddress(gameDef.locationPlaceholder || '', activeConfig) || 'Facility Street Address';
        if (timeInput && !timeInput.value) timeInput.placeholder = gameDef.timePlaceholder || '1:00 PM - 2:15 PM';
    } else if (type === 'pdp') {
        const pdpDef = defaults.pdp || {};
        const pdpLoc = pdpDef.defaultLocation || 'Calgary West Soccer Centre';
        const pdpAddr = pdpDef.defaultAddress || resolveFacilityAddress(pdpLoc, activeConfig);
        if (opponentLabel) opponentLabel.textContent = 'Session Focus (Optional)';
        if (opponentInput) {
            opponentInput.placeholder = 'e.g. Technical Footwork & Passing (or leave blank)';
        }
        if (homeAwayGroup) homeAwayGroup.style.display = 'none';
        if (locationInput && isAutoLocation) locationInput.value = pdpLoc;
        if (addressInput && isAutoAddress) addressInput.value = pdpAddr;
        if (timeInput && !timeInput.value) timeInput.value = pdpDef.defaultTime || '7:15 PM - 8:15 PM';
    } else if (type === 'performance') {
        const perfDef = defaults.performance || {};
        const perfLoc = perfDef.defaultLocation || 'Calgary West Soccer Centre';
        const perfAddr = perfDef.defaultAddress || resolveFacilityAddress(perfLoc, activeConfig);
        if (opponentLabel) opponentLabel.textContent = 'Session Focus (Optional)';
        if (opponentInput) {
            opponentInput.placeholder = 'e.g. Speed, Agility & Strength (or leave blank)';
        }
        if (homeAwayGroup) homeAwayGroup.style.display = 'none';
        if (locationInput && isAutoLocation) locationInput.value = perfLoc;
        if (addressInput && isAutoAddress) addressInput.value = perfAddr;
        if (timeInput && !timeInput.value) timeInput.value = perfDef.defaultTime || '6:00 PM - 7:00 PM';
    } else {
        // practice
        const pracDef = defaults.practice || {};
        const pracLoc = pracDef.defaultLocation || 'Calgary West Soccer Centre';
        const pracAddr = pracDef.defaultAddress || resolveFacilityAddress(pracLoc, activeConfig);
        if (opponentLabel) opponentLabel.textContent = 'Practice Topic / Focus (Optional)';
        if (opponentInput) {
            opponentInput.placeholder = 'e.g. Shooting, Finishing & Defensive Shape (or leave blank)';
        }
        if (homeAwayGroup) homeAwayGroup.style.display = 'none';
        if (locationInput && isAutoLocation) locationInput.value = pracLoc;
        if (addressInput && isAutoAddress) addressInput.value = pracAddr;
        if (timeInput && !timeInput.value) timeInput.value = pracDef.defaultTime || '7:30 PM - 8:30 PM';
    }
}

export function handleDatepickerChange(pickerVal) {
    if (!pickerVal) return;
    const parts = pickerVal.split('-');
    if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        if (!isNaN(d.getTime())) {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const dayName = days[d.getDay()];
            const monthName = months[d.getMonth()];
            const dateNum = d.getDate();
            const year = d.getFullYear();
            const formatted = `${dayName}, ${monthName} ${dateNum < 10 ? '0' + dateNum : dateNum}, ${year}`;
            const textInput = document.getElementById('new-event-date');
            if (textInput) textInput.value = formatted;
        }
    }
}

export function openAddEventModal() {
    const modal = document.getElementById('modal-add-event') || document.getElementById('add-event-modal');
    if (modal) {
        const editIdInput = document.getElementById('edit-event-id');
        if (editIdInput) editIdInput.value = '';
        const titleEl = document.getElementById('add-event-modal-title');
        if (titleEl) titleEl.textContent = 'Add Schedule Event';
        const submitBtn = document.getElementById('add-event-submit-btn');
        if (submitBtn) submitBtn.textContent = 'Save Event';

        const form = modal.querySelector('form');
        if (form) form.reset();

        modal.classList.remove('hidden');
        handleEventTypeChange();
        const dateInput = document.getElementById('new-event-date');
        const pickerInput = document.getElementById('new-event-date-picker');
        if (pickerInput) {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            pickerInput.value = `${yyyy}-${mm}-${dd}`;
            if (dateInput && !dateInput.value) {
                handleDatepickerChange(pickerInput.value);
            }
        }
    }
}

export function openEditEventModal(id) {
    const ev = scheduleEvents.find(e => Number(e.id) === Number(id));
    if (!ev) return;
    const modal = document.getElementById('modal-add-event') || document.getElementById('add-event-modal');
    if (!modal) return;

    const editIdInput = document.getElementById('edit-event-id');
    if (editIdInput) editIdInput.value = String(ev.id);

    const titleEl = document.getElementById('add-event-modal-title');
    if (titleEl) titleEl.textContent = 'Edit Schedule Fixture / Event';

    const submitBtn = document.getElementById('add-event-submit-btn');
    if (submitBtn) submitBtn.textContent = 'Update Event';

    const typeSelect = document.getElementById('new-event-type');
    if (typeSelect) typeSelect.value = ev.type || 'practice';
    handleEventTypeChange();

    const opponentInput = document.getElementById('new-event-opponent');
    if (opponentInput) {
        if (ev.type === 'game') {
            opponentInput.value = ev.opponent || '';
        } else {
            let clean = ev.title;
            const prefixes = [
                'Player Development Program (PDP) - ', 
                'Player Development Program (PDP)', 
                'Rockies Performance Session - ', 
                'Rockies Performance Session', 
                'Team Tactical Practice - ', 
                'Team Tactical Practice',
                'Team Practice - ',
                'Team Practice'
            ];
            for (const p of prefixes) {
                if (clean.startsWith(p)) {
                    clean = clean.substring(p.length);
                    break;
                }
            }
            opponentInput.value = clean.trim();
        }
    }

    const homeAwaySelect = document.getElementById('new-event-homeaway');
    if (homeAwaySelect) homeAwaySelect.value = ev.isHome ? 'Home' : 'Away';

    const dateInput = document.getElementById('new-event-date');
    if (dateInput) dateInput.value = ev.date || '';

    const timeInput = document.getElementById('new-event-time');
    if (timeInput) timeInput.value = ev.kickoff || '';

    const locationInput = document.getElementById('new-event-location');
    if (locationInput) locationInput.value = ev.location || '';

    const addressInput = document.getElementById('new-event-address');
    if (addressInput) addressInput.value = ev.address || '';

    const kitInput = document.getElementById('new-event-kit');
    if (kitInput) kitInput.value = ev.jerseyKit || '';

    modal.classList.remove('hidden');
}

export function closeAddEventModal() {
    const modal = document.getElementById('modal-add-event') || document.getElementById('add-event-modal');
    if (modal) modal.classList.add('hidden');
}

export function saveNewScheduleEvent(event, matchState, leagueStandings, onSaved) {
    if (event) {
        if (typeof event.preventDefault === 'function') event.preventDefault();
        if (typeof event.stopPropagation === 'function') event.stopPropagation();
    }

    const activeConfig = getActiveTeamConfig();
    const leagueName = activeConfig.leagueName || 'CMSA';
    const shortName = activeConfig.shortName || activeConfig.clubShortName || 'Club';
    const gameArrivalMin = activeConfig.arrivalRules?.gameMinutes || 30;
    const trainArrivalMin = activeConfig.arrivalRules?.trainingMinutes || 15;

    const editingId = document.getElementById('edit-event-id')?.value.trim();
    const type = document.getElementById('new-event-type')?.value || 'practice';
    const rawTitleOrOpponent = document.getElementById('new-event-opponent')?.value.trim() || '';
    const dateInput = document.getElementById('new-event-date')?.value.trim() || '';
    const time = document.getElementById('new-event-time')?.value.trim() || '';
    const location = document.getElementById('new-event-location')?.value.trim() || activeConfig.trainingDefaults?.practice?.defaultLocation || 'Calgary West Soccer Centre';
    const address = document.getElementById('new-event-address')?.value.trim() || resolveFacilityAddress(location, activeConfig);
    const isHome = document.getElementById('new-event-homeaway')?.value === 'Home';
    const isGame = type === 'game';
    const isPDP = type === 'pdp';
    const isPerf = type === 'performance';

    if (isGame && !rawTitleOrOpponent) {
        alert('Please enter the opponent team name for this match.');
        return;
    }

    if (!dateInput) {
        alert('Please enter or select a date for the event.');
        return;
    }

    const defaultKitForType = getKitRuleForEventType(type, activeConfig);
    const uniformKit = document.getElementById('new-event-kit')?.value.trim() || defaultKitForType;

    let title = '';
    let opponent = '';

    if (isGame) {
        opponent = rawTitleOrOpponent || 'Opponent';
        title = `${leagueName} Match ${isHome ? 'vs' : '@'} ${opponent}`;
    } else if (isPDP) {
        title = rawTitleOrOpponent ? `Player Development Program (PDP) - ${rawTitleOrOpponent}` : 'Player Development Program (PDP)';
    } else if (isPerf) {
        title = rawTitleOrOpponent ? `${shortName} Performance Session - ${rawTitleOrOpponent}` : `${shortName} Performance Session`;
    } else {
        // practice
        title = rawTitleOrOpponent || 'Team Tactical Practice';
    }

    if (editingId) {
        const idx = scheduleEvents.findIndex(e => String(e.id) === String(editingId));
        if (idx !== -1) {
            scheduleEvents[idx] = normalizeScheduleEvent({
                ...scheduleEvents[idx],
                type,
                title,
                opponent,
                isHome,
                date: dateInput,
                kickoff: time || 'TBD',
                arrival: isGame ? `${gameArrivalMin} min prior` : `${trainArrivalMin} min prior`,
                location,
                address,
                jerseyKit: uniformKit
            });
        }
    } else {
        const newId = Date.now();
        const newEvent = normalizeScheduleEvent({
            id: newId,
            type,
            title,
            opponent,
            isHome,
            date: dateInput,
            kickoff: time || 'TBD',
            arrival: isGame ? `${gameArrivalMin} min prior` : `${trainArrivalMin} min prior`,
            location,
            address,
            jerseyKit: uniformKit
        });
        scheduleEvents.push(newEvent);
    }

    // Sort chronologically so newly added practices and fixtures sit in chronological order
    scheduleEvents.sort((a, b) => {
        const dA = parseEventDate(a.date);
        const dB = parseEventDate(b.date);
        if (dA && dB) return dA.getTime() - dB.getTime();
        if (dA) return -1;
        if (dB) return 1;
        return a.id - b.id;
    });

    saveScheduleEvents(matchState, leagueStandings);
    closeAddEventModal();

    if (typeof onSaved === 'function') {
        onSaved();
    } else {
        window.updateAllViews?.();
    }
}

export function deleteScheduleEvent(id, matchState, leagueStandings, onSaved) {
    if (!confirm('Are you sure you want to remove this fixture?')) return;
    scheduleEvents = scheduleEvents.filter(e => e.id !== id);
    saveScheduleEvents(matchState, leagueStandings);
    if (typeof onSaved === 'function') {
        onSaved();
    } else {
        window.updateAllViews?.();
    }
}
