// ============================================================================
// Multi-Club, Multi-Team Tenant Resolution & Configuration Layer
// Static ES6+ module for Calgary Rockies FC (and future multi-club expansion)
// ============================================================================

export const ACTIVE_TEAM_STORAGE_KEY = 'rockies_active_team';
export const ACTIVE_CLUB_STORAGE_KEY = 'rockies_active_club';
export const DEFAULT_CLUB_ID = 'rockies';
export const DEFAULT_TEAM_ID = 'albion14';

// Dedicated UI Utility Accents (NOT club brand colors)
// Strictly reserved for Man of the Match awards, yellow cards, trophies, and Coach Mode toggle.
export const UI_ACCENTS = {
    gold: '#FFB81C'
};

// Canonical Calgary Rockies FC Club Defaults
// Official Club Brand Palette: Royal Blue (#003C71), Black (#000000), and White (#FFFFFF).
// Teams inherit all club assets, brand colors, facility directory, and kit defaults
// unless they explicitly supply a team-level override.
export const CLUB_DEFAULTS = {
    clubId: 'rockies',
    clubName: 'Calgary Rockies FC',
    shortName: 'Rockies',
    leagueName: 'CMSA',
    season: '2026-2027 Indoor Season',
    websiteUrl: 'https://rockiessoccer.ca',
    crestUrl: 'https://rockiessoccer.ca/wp-content/uploads/2023/02/Calgary-Rockies-FC-Royal-Blue-Medium.png',
    crestFallbackText: 'RFC',
    brandColors: {
        primary: '#003C71',
        secondary: '#000000',
        white: '#FFFFFF',
        primaryHover: '#004d91',
        primaryGlow: 'rgba(0, 60, 113, 0.4)',
        background: '#090d16',
        text: '#f3f4f6'
    },
    uiAccents: {
        gold: UI_ACCENTS.gold
    },
    arrivalRules: {
        gameMinutes: 30,
        trainingMinutes: 15,
        ballSize: 'Size 5'
    },
    kitRules: {
        matches: 'Black Kit',
        practice: 'Grey/Blue Training Kit & Size 5 Ball',
        pdp: 'Grey/Blue Training Kit & Size 5 Ball',
        performance: 'Black Training Kit & Size 5 Ball',
        bannerSummary: [
            { label: 'ALL Matches', value: 'Black Kit', accentClass: 'text-amber-400' },
            { label: 'PDP & Team Practice', value: 'Grey/Blue Training Kit', accentClass: 'text-blue-300' },
            { label: 'Performance', value: 'Black Training Kit Only', accentClass: 'text-zinc-300' }
        ]
    },
    links: {
        clubWebsite: 'https://rockiessoccer.ca',
        whatsappUrl: '',
        instagramUrl: '',
        instagramHandle: '',
        cmsaStandingsUrl: ''
    },
    // Standard Calgary soccer & indoor gym facilities shared across Calgary Rockies FC squads
    venues: [
        {
            id: 'shane-homes-cwsc',
            name: 'Shane Homes West Soccer Dome',
            aliases: ['shane homes', 'calgary west', 'cwsc', 'west soccer dome'],
            address: '11014 Bearspaw Dam Rd NW, Calgary'
        },
        {
            id: 'royal-oak-school',
            name: 'Royal Oak School (Indoor Gym)',
            aliases: ['royal oak'],
            address: '9100 Royal Oak Way NW, Calgary'
        },
        {
            id: 'captain-nichola-goddard',
            name: 'Captain Nichola Goddard School (Main Gym)',
            aliases: ['captain nichola', 'nichola goddard'],
            address: '405 Panatella Blvd NW, Calgary'
        },
        {
            id: 'bearspaw-community',
            name: 'Bearspaw Community Association Gym',
            aliases: ['bearspaw'],
            address: '253220 Bearspaw Rd, Calgary'
        },
        {
            id: 'shouldice-athletic-park',
            name: 'Shouldice Athletic Park',
            aliases: ['shouldice'],
            address: '1515 Home Rd NW, Calgary'
        },
        {
            id: 'foothills-macron-centre',
            name: 'Foothills Macron Centre',
            aliases: ['macron', 'foothills'],
            address: '111 Aerial Place NE, Calgary'
        },
        {
            id: 'edge-school',
            name: 'Edge School',
            aliases: ['edge school'],
            address: '33055 Township Rd 250, Calgary'
        },
        {
            id: 'maxwell-soccer-centre',
            name: 'MaxWell Soccer Centre',
            aliases: ['maxwell', 'msc dome'],
            address: '7000 48 St SE, Calgary'
        },
        {
            id: 'vivo-rec-centre',
            name: 'Vivo Recreation Centre',
            aliases: ['vivo'],
            address: '11950 Country Village Link NE, Calgary'
        },
        {
            id: 'genesis-centre',
            name: 'Genesis Centre',
            aliases: ['genesis'],
            address: '7555 Falconridge Blvd NE, Calgary'
        }
    ]
};

// Club Registry (extensible for onboarding additional clubs alongside Calgary Rockies FC)
export const CLUB_REGISTRY = {
    rockies: CLUB_DEFAULTS
};

// Known Team ID Aliases (handles hyphenated or alternate URL slugs gracefully)
const TEAM_ID_ALIASES = {
    'albion-14': 'albion14',
    'rockies-albion-14': 'albion14',
    'rfc14': 'albion14',
    'alliance-11': 'alliance11',
    'rockies-alliance-11': 'alliance11',
    'rfc11': 'alliance11'
};

// Team Registry
export const TEAM_REGISTRY = {
    albion14: {
        teamId: 'albion14',
        clubId: 'rockies',
        name: 'Rockies Albion 14',
        fullName: 'Calgary Rockies FC Albion 14',
        squadTitle: 'Calgary Rockies FC Albion 14 Squad',
        shortName: 'Rockies',
        division: 'CMSA Boys U13 Tier 2',
        ageGroup: 'U13',
        gender: 'Boys',
        tier: 'Tier 2',
        season: '2026-2027 Indoor Season',
        bannerPhotoUrl: './videos/albion-14-team-pic.jpeg',
        officials: [
            {
                name: 'Kevin Diaz Lizama',
                role: 'HEAD COACH',
                subtitle: 'Tactics, Lineups & Training',
                badgeVariant: 'blue',
                email: '',
                showWhatsapp: false
            },
            {
                name: 'Tyler Martens',
                role: 'TEAM MANAGER',
                subtitle: 'Scheduling, Roster & Operations',
                badgeVariant: 'amber',
                email: 'tyler.martens@gmail.com',
                showWhatsapp: true
            }
        ],
        links: {
            whatsappUrl: 'https://chat.whatsapp.com/C25kmFXbEfQGhgOFiqK7In',
            instagramUrl: 'https://www.instagram.com/calgaryrockiesalbion14?knvt=MWJ5ejk0aWs3MWZy',
            instagramHandle: '@calgaryrockiesalbion14',
            cmsaStandingsUrl: ''
        },
        auth: {
            familyPasscodes: ['albion14', '1414', 'rockies14'],
            coachPin: '1414'
        },
        kitRules: {
            matches: 'Black Kit',
            practice: 'Grey/Blue Training Kit & Size 5 Ball',
            pdp: 'Grey/Blue Training Kit & Size 5 Ball',
            performance: 'Black Training Kit & Size 5 Ball',
            bannerSummary: [
                { label: 'ALL Matches', value: 'Black Kit', accentClass: 'text-amber-400' },
                { label: 'PDP & Team Practice', value: 'Grey/Blue Training Kit', accentClass: 'text-blue-300' },
                { label: 'Performance', value: 'Black Training Kit Only', accentClass: 'text-zinc-300' }
            ]
        },
        trainingDefaults: {
            game: {
                locationPlaceholder: 'Shane Homes West Soccer Dome (Field 2 7v7)',
                addressPlaceholder: '11014 Bearspaw Dam Rd NW, Calgary',
                timePlaceholder: '1:00 PM - 2:15 PM',
                opponentPlaceholder: 'e.g. SWU Atletico 14B'
            },
            pdp: {
                defaultLocation: 'Royal Oak School (Indoor Gym)',
                defaultAddress: '9100 Royal Oak Way NW, Calgary',
                defaultTime: '7:15 PM - 8:15 PM'
            },
            performance: {
                defaultLocation: 'Calgary West Soccer Centre (Field 2a)',
                defaultAddress: '11014 Bearspaw Dam Rd NW, Calgary',
                defaultTime: '6:00 PM - 7:00 PM'
            },
            practice: {
                defaultLocation: 'Captain Nichola Goddard School (Main Gym)',
                defaultAddress: '405 Panatella Blvd NW, Calgary',
                defaultTime: '7:30 PM - 8:30 PM'
            }
        },
        standingsMatchKeywords: ['rockies albion 14', 'albion 14', 'rockies'],
        defaultOpponent: 'CWFC B2014 Green',
        brandingOverrides: {},
        firestore: {
            legacyAppId: 'rockies-albion-14',
            useLegacyCollectionBridge: true
        }
    },

    alliance11: {
        teamId: 'alliance11',
        clubId: 'rockies',
        name: 'Rockies Alliance 11',
        fullName: 'Calgary Rockies FC Alliance 11',
        squadTitle: 'Calgary Rockies FC Alliance 11 Squad',
        shortName: 'Rockies',
        division: 'CMSA Girls U17 Tier 3',
        ageGroup: 'U17',
        gender: 'Girls',
        tier: 'Tier 3',
        season: '2026-2027 Indoor Season',
        bannerPhotoUrl: '',
        officials: [
            {
                name: 'William Fru',
                role: 'HEAD COACH',
                subtitle: 'Tactics, Lineups & Training',
                badgeVariant: 'blue',
                email: '',
                showWhatsapp: false
            },
            {
                name: 'Tyler Martens',
                role: 'TEAM MANAGER',
                subtitle: 'Scheduling, Roster & Operations',
                badgeVariant: 'amber',
                email: 'tyler.martens@gmail.com',
                showWhatsapp: true
            }
        ],
        links: {
            whatsappUrl: 'https://chat.whatsapp.com/C25kmFXbEfQGhgOFiqK7In',
            instagramUrl: '',
            instagramHandle: '',
            cmsaStandingsUrl: ''
        },
        auth: {
            familyPasscodes: ['alliance11', 'rockies11', '2011'],
            coachPin: '2011'
        },
        kitRules: {
            matches: 'Royal Blue Home Kit',
            practice: 'Grey/Blue Training Kit & Size 5 Ball',
            pdp: 'Grey/Blue Training Kit & Size 5 Ball',
            performance: 'Grey/Blue Training Kit & Size 5 Ball',
            bannerSummary: [
                { label: 'Matches', value: 'Royal Blue', accentClass: 'text-amber-400' },
                { label: 'PDP & Team Practice', value: 'Grey/Blue Training Kit', accentClass: 'text-blue-300' },
                { label: 'Performance', value: 'Grey/Blue Training Kit', accentClass: 'text-zinc-300' }
            ]
        },
        trainingDefaults: {
            game: {
                locationPlaceholder: 'Shane Homes West Soccer Dome',
                addressPlaceholder: '11014 Bearspaw Dam Rd NW, Calgary',
                timePlaceholder: '2:00 PM - 3:15 PM',
                opponentPlaceholder: 'e.g. Opponent U17 Squad'
            },
            pdp: {
                defaultLocation: 'Calgary West Soccer Centre',
                defaultAddress: '11014 Bearspaw Dam Rd NW, Calgary',
                defaultTime: '7:00 PM - 8:00 PM'
            },
            performance: {
                defaultLocation: 'Calgary West Soccer Centre',
                defaultAddress: '11014 Bearspaw Dam Rd NW, Calgary',
                defaultTime: '6:00 PM - 7:00 PM'
            },
            practice: {
                defaultLocation: 'Calgary West Soccer Centre',
                defaultAddress: '11014 Bearspaw Dam Rd NW, Calgary',
                defaultTime: '7:30 PM - 8:30 PM'
            }
        },
        standingsMatchKeywords: ['rockies alliance 11', 'alliance 11', 'rockies'],
        defaultOpponent: 'Opponent',
        brandingOverrides: {},
        firestore: {
            legacyAppId: null,
            useLegacyCollectionBridge: false
        }
    }
};

// Optional runtime overrides hydrated dynamically from Firestore (clubs/{clubId} & teams/{teamId})
let runtimeClubOverrides = null;
let runtimeTeamOverrides = null;

// ============================================================================
// Internal Sanitization & Safe Storage Helpers
// ============================================================================

function sanitizeTenantSlug(raw) {
    if (!raw || typeof raw !== 'string') return '';
    const cleaned = raw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!cleaned) return '';
    return TEAM_ID_ALIASES[cleaned] || cleaned;
}

function safeReadLocalStorage(key) {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

function safeWriteLocalStorage(key, value) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
        window.localStorage.setItem(key, value);
    } catch {
        // Ignore storage quota or private browsing errors
    }
}

function readSearchParam(paramNames) {
    if (typeof window === 'undefined' || !window.location || !window.location.search) {
        return '';
    }
    try {
        const params = new URLSearchParams(window.location.search);
        for (const name of paramNames) {
            const val = params.get(name);
            if (val && val.trim()) {
                return val.trim();
            }
        }
    } catch {
        return '';
    }
    return '';
}

function stripLeadingHash(hex) {
    return String(hex || '#003C71').replace(/^#/, '');
}

function hexToRgba(hex, alpha = 0.4) {
    const clean = stripLeadingHash(hex);
    const expanded = clean.length === 3
        ? clean.split('').map(ch => ch + ch).join('')
        : clean;
    if (!/^[0-9a-f]{6}$/i.test(expanded)) {
        return `rgba(0, 60, 113, ${alpha})`;
    }
    const r = parseInt(expanded.slice(0, 2), 16);
    const g = parseInt(expanded.slice(2, 4), 16);
    const b = parseInt(expanded.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ============================================================================
// URL & Cache Tenant Resolution
// ============================================================================

export function resolveClubId(teamId = null) {
    const queryClub = sanitizeTenantSlug(readSearchParam(['c', 'club']));
    if (queryClub) {
        safeWriteLocalStorage(ACTIVE_CLUB_STORAGE_KEY, queryClub);
        return queryClub;
    }

    if (teamId && TEAM_REGISTRY[teamId]?.clubId) {
        const derivedClub = TEAM_REGISTRY[teamId].clubId;
        safeWriteLocalStorage(ACTIVE_CLUB_STORAGE_KEY, derivedClub);
        return derivedClub;
    }

    const cachedClub = sanitizeTenantSlug(safeReadLocalStorage(ACTIVE_CLUB_STORAGE_KEY));
    if (cachedClub) {
        return cachedClub;
    }

    safeWriteLocalStorage(ACTIVE_CLUB_STORAGE_KEY, DEFAULT_CLUB_ID);
    return DEFAULT_CLUB_ID;
}

export function resolveTeamId() {
    // 1. Highest priority: URL query parameter (?t= or ?team=)
    const queryTeam = sanitizeTenantSlug(readSearchParam(['t', 'team']));
    if (queryTeam) {
        safeWriteLocalStorage(ACTIVE_TEAM_STORAGE_KEY, queryTeam);
        return queryTeam;
    }

    // 2. Fallback: Previously cached team selection in localStorage
    const cachedTeam = sanitizeTenantSlug(safeReadLocalStorage(ACTIVE_TEAM_STORAGE_KEY));
    if (cachedTeam) {
        return cachedTeam;
    }

    // 3. Default fallback: albion14 (ensures existing bookmarks continue working)
    safeWriteLocalStorage(ACTIVE_TEAM_STORAGE_KEY, DEFAULT_TEAM_ID);
    return DEFAULT_TEAM_ID;
}

// Active resolved tenant IDs for the current session
export const CURRENT_TEAM_ID = resolveTeamId();
export const CURRENT_CLUB_ID = resolveClubId(CURRENT_TEAM_ID);

// ============================================================================
// Storage Key Isolation
// ============================================================================

/**
 * Generates an isolated storage key scoped to the active team.
 * Format: rfc_${CURRENT_TEAM_ID}_${suffix}
 * Replaces legacy, un-scoped rfc14_* keys across localStorage/sessionStorage/cookies.
 */
export function getTeamStorageKey(suffix, teamIdOverride = null) {
    const teamId = sanitizeTenantSlug(teamIdOverride) || CURRENT_TEAM_ID;
    const cleanSuffix = String(suffix || '').trim().replace(/^_+/, '');
    return cleanSuffix ? `rfc_${teamId}_${cleanSuffix}` : `rfc_${teamId}`;
}

/**
 * Reads a scoped localStorage key with optional one-way fallback to a legacy rfc14_* key
 * strictly when running as the default albion14 squad.
 */
export function getTeamStorageItem(suffix, legacyKey = null) {
    const scopedKey = getTeamStorageKey(suffix);
    const scopedValue = safeReadLocalStorage(scopedKey);
    if (scopedValue !== null) {
        return scopedValue;
    }
    if (legacyKey && CURRENT_TEAM_ID === DEFAULT_TEAM_ID) {
        const legacyValue = safeReadLocalStorage(legacyKey);
        if (legacyValue !== null) {
            safeWriteLocalStorage(scopedKey, legacyValue);
            return legacyValue;
        }
    }
    return null;
}

/**
 * Writes a value to the active team's isolated localStorage key.
 */
export function setTeamStorageItem(suffix, value) {
    const scopedKey = getTeamStorageKey(suffix);
    safeWriteLocalStorage(scopedKey, typeof value === 'string' ? value : JSON.stringify(value));
}

// ============================================================================
// Branding Inheritance & Effective Team Configuration
// ============================================================================

function buildDynamicFallbackTeam(teamId, club) {
    const prettyLabel = teamId
        .replace(/([a-z])([0-9])/gi, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (ch) => ch.toUpperCase())
        .trim();

    return {
        teamId,
        clubId: club.clubId,
        name: `${club.shortName} ${prettyLabel}`,
        fullName: `${club.clubName} ${prettyLabel}`,
        squadTitle: `${club.clubName} ${prettyLabel} Squad`,
        shortName: club.shortName,
        division: `${club.leagueName} Team Portal`,
        ageGroup: '',
        gender: '',
        tier: '',
        season: club.season,
        bannerPhotoUrl: '',
        officials: [],
        links: {},
        auth: {
            familyPasscodes: [teamId, club.clubId],
            coachPin: '1414'
        },
        kitRules: {},
        trainingDefaults: {
            game: {
                locationPlaceholder: 'Home Soccer Facility',
                addressPlaceholder: 'Facility Street Address, Calgary',
                timePlaceholder: '1:00 PM - 2:15 PM',
                opponentPlaceholder: 'e.g. Opponent FC'
            },
            pdp: {
                defaultLocation: 'Calgary West Soccer Centre',
                defaultAddress: '11014 Bearspaw Dam Rd NW, Calgary',
                defaultTime: '7:15 PM - 8:15 PM'
            },
            performance: {
                defaultLocation: 'Calgary West Soccer Centre',
                defaultAddress: '11014 Bearspaw Dam Rd NW, Calgary',
                defaultTime: '6:00 PM - 7:00 PM'
            },
            practice: {
                defaultLocation: 'Calgary West Soccer Centre',
                defaultAddress: '11014 Bearspaw Dam Rd NW, Calgary',
                defaultTime: '7:30 PM - 8:30 PM'
            }
        },
        standingsMatchKeywords: [prettyLabel.toLowerCase(), teamId, club.shortName.toLowerCase()],
        defaultOpponent: 'Opponent',
        brandingOverrides: {},
        firestore: {
            legacyAppId: null,
            useLegacyCollectionBridge: false
        }
    };
}

/**
 * Allows cloud-loaded Firestore Club/Team documents to layer live overrides
 * on top of the static registry defaults at runtime.
 */
export function setRuntimeTenantOverrides(clubOverrides = null, teamOverrides = null) {
    runtimeClubOverrides = clubOverrides && typeof clubOverrides === 'object' ? clubOverrides : null;
    runtimeTeamOverrides = teamOverrides && typeof teamOverrides === 'object' ? teamOverrides : null;
}

/**
 * Merges CLUB_DEFAULTS -> registered Club -> registered Team -> optional runtime overrides.
 * Returns the complete effective configuration for the active squad.
 */
export function getActiveTeamConfig(teamIdOverride = null) {
    const resolvedTeamId = sanitizeTenantSlug(teamIdOverride) || CURRENT_TEAM_ID;
    const isKnownTeam = Boolean(TEAM_REGISTRY[resolvedTeamId]);
    const baseClubId = TEAM_REGISTRY[resolvedTeamId]?.clubId || CURRENT_CLUB_ID || DEFAULT_CLUB_ID;
    const staticClub = CLUB_REGISTRY[baseClubId] || CLUB_DEFAULTS;

    // Layer 1: Club Defaults + Runtime Club Overrides
    const mergedClubBrandColors = {
        ...CLUB_DEFAULTS.brandColors,
        ...(staticClub.brandColors || staticClub.colors || {}),
        ...(runtimeClubOverrides?.brandColors || runtimeClubOverrides?.colors || {})
    };

    const mergedClub = {
        ...CLUB_DEFAULTS,
        ...staticClub,
        ...(runtimeClubOverrides || {}),
        brandColors: mergedClubBrandColors,
        uiAccents: {
            ...UI_ACCENTS,
            ...(CLUB_DEFAULTS.uiAccents || {}),
            ...(staticClub.uiAccents || {}),
            ...(runtimeClubOverrides?.uiAccents || {})
        },
        arrivalRules: {
            ...CLUB_DEFAULTS.arrivalRules,
            ...(staticClub.arrivalRules || {}),
            ...(runtimeClubOverrides?.arrivalRules || {})
        },
        kitRules: {
            ...CLUB_DEFAULTS.kitRules,
            ...(staticClub.kitRules || {}),
            ...(runtimeClubOverrides?.kitRules || {})
        },
        links: {
            ...CLUB_DEFAULTS.links,
            ...(staticClub.links || {}),
            ...(runtimeClubOverrides?.links || {})
        },
        venues: Array.isArray(runtimeClubOverrides?.venues) && runtimeClubOverrides.venues.length > 0
            ? runtimeClubOverrides.venues
            : (staticClub.venues || CLUB_DEFAULTS.venues)
    };

    // Layer 2: Registered Team + Runtime Team Overrides
    const staticTeam = TEAM_REGISTRY[resolvedTeamId] || buildDynamicFallbackTeam(resolvedTeamId, mergedClub);
    const teamOverrides = runtimeTeamOverrides || {};

    const teamBrandOverrides = {
        ...(staticTeam.brandingOverrides?.brandColors || staticTeam.brandingOverrides?.colors || {}),
        ...(teamOverrides.brandingOverrides?.brandColors || teamOverrides.brandingOverrides?.colors || {})
    };

    const effectiveBrandColors = {
        ...mergedClub.brandColors,
        ...teamBrandOverrides
    };

    // Derive primary glow automatically if primary color was overridden without an explicit primaryGlow
    if (
        effectiveBrandColors.primary &&
        effectiveBrandColors.primary.toLowerCase() !== CLUB_DEFAULTS.brandColors.primary.toLowerCase() &&
        !teamBrandOverrides.primaryGlow &&
        !runtimeClubOverrides?.brandColors?.primaryGlow
    ) {
        effectiveBrandColors.primaryGlow = hexToRgba(effectiveBrandColors.primary, 0.4);
    }

    const effectiveUiAccents = {
        ...UI_ACCENTS,
        ...(mergedClub.uiAccents || {}),
        ...(staticTeam.uiAccents || {}),
        ...(teamOverrides.uiAccents || {})
    };

    const effectiveCrestUrl =
        teamOverrides.brandingOverrides?.crestUrl ||
        staticTeam.brandingOverrides?.crestUrl ||
        mergedClub.crestUrl;

    const primaryHex = stripLeadingHash(effectiveBrandColors.primary);
    const effectiveSquadTitle = teamOverrides.squadTitle || staticTeam.squadTitle || `${mergedClub.clubName} ${staticTeam.name}`;
    const effectiveBannerUrl = teamOverrides.bannerPhotoUrl !== undefined
        ? teamOverrides.bannerPhotoUrl
        : (staticTeam.bannerPhotoUrl || '');

    const effectiveKitRules = {
        ...mergedClub.kitRules,
        ...(staticTeam.kitRules || {}),
        ...(teamOverrides.kitRules || {}),
        bannerSummary:
            teamOverrides.kitRules?.bannerSummary ||
            staticTeam.kitRules?.bannerSummary ||
            mergedClub.kitRules.bannerSummary
    };

    const effectiveLinks = {
        ...mergedClub.links,
        ...(staticTeam.links || {}),
        ...(teamOverrides.links || {})
    };

    const effectiveAuth = {
        familyPasscodes:
            teamOverrides.auth?.familyPasscodes ||
            staticTeam.auth?.familyPasscodes ||
            [resolvedTeamId],
        coachPin:
            teamOverrides.auth?.coachPin ||
            staticTeam.auth?.coachPin ||
            '1414'
    };

    const effectiveVenues = [
        ...(mergedClub.venues || []),
        ...(staticTeam.venues || []),
        ...(teamOverrides.venues || [])
    ];

    const effectiveFirestore = {
        clubDocPath: `clubs/${mergedClub.clubId}`,
        teamDocPath: `clubs/${mergedClub.clubId}/teams/${resolvedTeamId}`,
        playersCollectionPath: `clubs/${mergedClub.clubId}/teams/${resolvedTeamId}/players`,
        matchCenterDocPath: `clubs/${mergedClub.clubId}/teams/${resolvedTeamId}/matchCenter/activeMatch`,
        mediaChunksCollectionPath: `clubs/${mergedClub.clubId}/teams/${resolvedTeamId}/mediaChunks`,
        legacyAppId: staticTeam.firestore?.legacyAppId || null,
        useLegacyCollectionBridge: Boolean(staticTeam.firestore?.useLegacyCollectionBridge)
    };

    return {
        clubId: mergedClub.clubId,
        teamId: resolvedTeamId,
        isDefaultTeam: resolvedTeamId === DEFAULT_TEAM_ID,
        isKnownTeam,
        clubName: mergedClub.clubName,
        clubShortName: mergedClub.shortName,
        leagueName: teamOverrides.leagueName || staticTeam.leagueName || mergedClub.leagueName,
        name: teamOverrides.name || staticTeam.name,
        fullName: teamOverrides.fullName || staticTeam.fullName,
        squadTitle: effectiveSquadTitle,
        shortName: teamOverrides.shortName || staticTeam.shortName || mergedClub.shortName,
        division: teamOverrides.division || staticTeam.division,
        ageGroup: teamOverrides.ageGroup || staticTeam.ageGroup || '',
        gender: teamOverrides.gender || staticTeam.gender || '',
        tier: teamOverrides.tier || staticTeam.tier || '',
        season: teamOverrides.season || staticTeam.season || mergedClub.season,
        brandColors: effectiveBrandColors,
        uiAccents: effectiveUiAccents,
        branding: {
            crestUrl: effectiveCrestUrl,
            crestFallbackText:
                teamOverrides.brandingOverrides?.crestFallbackText ||
                staticTeam.brandingOverrides?.crestFallbackText ||
                mergedClub.crestFallbackText,
            crestFallbackUrl: `https://placehold.co/80x80/${primaryHex}/ffffff?text=${encodeURIComponent(mergedClub.crestFallbackText || 'FC')}`,
            bannerPhotoUrl: effectiveBannerUrl,
            bannerFallbackUrl: `https://placehold.co/1200x616/${primaryHex}/ffffff?text=${encodeURIComponent(effectiveSquadTitle)}`,
            brandColors: effectiveBrandColors,
            colors: effectiveBrandColors
        },
        arrivalRules: {
            ...mergedClub.arrivalRules,
            ...(staticTeam.arrivalRules || {}),
            ...(teamOverrides.arrivalRules || {})
        },
        kitRules: effectiveKitRules,
        officials: Array.isArray(teamOverrides.officials) && teamOverrides.officials.length > 0
            ? teamOverrides.officials
            : (staticTeam.officials || []),
        links: effectiveLinks,
        venues: effectiveVenues,
        trainingDefaults: {
            ...(staticTeam.trainingDefaults || {}),
            ...(teamOverrides.trainingDefaults || {})
        },
        auth: effectiveAuth,
        standingsMatchKeywords:
            teamOverrides.standingsMatchKeywords ||
            staticTeam.standingsMatchKeywords ||
            [resolvedTeamId],
        defaultOpponent: teamOverrides.defaultOpponent || staticTeam.defaultOpponent || 'Opponent',
        firestore: effectiveFirestore
    };
}

// ============================================================================
// Utility Helpers for Theme Injection, Facility Lookup & Squad Switching
// ============================================================================

/**
 * Injects resolved Club/Team brand palette tokens and dedicated UI utility accents
 * onto :root CSS custom properties.
 */
export function applyTeamThemeVariables(config = null) {
    if (typeof document === 'undefined' || !document.documentElement) return;
    const active = config || getActiveTeamConfig();
    const brandColors = active.brandColors || active.branding?.brandColors || CLUB_DEFAULTS.brandColors;
    const accentGold = active.uiAccents?.gold || UI_ACCENTS.gold;
    const root = document.documentElement;

    root.style.setProperty('--brand-primary', brandColors.primary || '#003C71');
    root.style.setProperty('--brand-secondary', brandColors.secondary || '#000000');
    root.style.setProperty('--brand-white', brandColors.white || '#FFFFFF');
    root.style.setProperty('--brand-primary-hover', brandColors.primaryHover || '#004d91');
    root.style.setProperty('--brand-primary-glow', brandColors.primaryGlow || 'rgba(0, 60, 113, 0.4)');
    root.style.setProperty('--accent-gold', accentGold);
    root.style.setProperty('--brand-bg', brandColors.background || '#090d16');
    root.style.setProperty('--brand-text', brandColors.text || '#f3f4f6');
}

/**
 * Resolves a standard Calgary facility street address from a venue/gym name.
 */
export function resolveFacilityAddress(locationName, config = null) {
    if (!locationName || typeof locationName !== 'string') return '';
    const active = config || getActiveTeamConfig();
    const lower = locationName.toLowerCase();
    const venues = active.venues || CLUB_DEFAULTS.venues;

    for (const venue of venues) {
        if (venue.name && lower.includes(venue.name.toLowerCase())) {
            return venue.address;
        }
        if (Array.isArray(venue.aliases) && venue.aliases.some(alias => lower.includes(alias.toLowerCase()))) {
            return venue.address;
        }
    }
    return '';
}

/**
 * Returns the configured uniform kit string for a given schedule event type.
 */
export function getKitRuleForEventType(eventType, config = null) {
    const active = config || getActiveTeamConfig();
    const kits = active.kitRules || CLUB_DEFAULTS.kitRules;
    if (eventType === 'game') return kits.matches || CLUB_DEFAULTS.kitRules.matches;
    if (eventType === 'performance') return kits.performance || CLUB_DEFAULTS.kitRules.performance;
    if (eventType === 'pdp') return kits.pdp || CLUB_DEFAULTS.kitRules.pdp;
    return kits.practice || CLUB_DEFAULTS.kitRules.practice;
}

/**
 * Returns all registered squads (optionally filtered by clubId) for UI team switchers.
 */
export function getAvailableTeams(clubId = null) {
    return Object.values(TEAM_REGISTRY)
        .filter(t => !clubId || t.clubId === clubId)
        .map(t => ({
            teamId: t.teamId,
            clubId: t.clubId,
            name: t.name,
            division: t.division,
            season: t.season
        }));
}

/**
 * Builds a shareable static URL for a specific team (and optional club) using query params.
 */
export function buildTeamUrl(teamId, clubId = null) {
    const targetTeam = sanitizeTenantSlug(teamId) || DEFAULT_TEAM_ID;
    const targetClub = sanitizeTenantSlug(clubId) || TEAM_REGISTRY[targetTeam]?.clubId || CURRENT_CLUB_ID;
    if (typeof window === 'undefined' || !window.location) {
        return `?c=${encodeURIComponent(targetClub)}&t=${encodeURIComponent(targetTeam)}`;
    }
    const url = new URL(window.location.href);
    url.searchParams.set('c', targetClub);
    url.searchParams.set('t', targetTeam);
    url.searchParams.delete('team');
    url.searchParams.delete('club');
    return url.toString();
}

/**
 * Persists a new team selection to localStorage and navigates to its URL so all modules re-hydrate cleanly.
 */
export function switchActiveTeam(teamId, clubId = null) {
    const targetTeam = sanitizeTenantSlug(teamId) || DEFAULT_TEAM_ID;
    const targetClub = sanitizeTenantSlug(clubId) || TEAM_REGISTRY[targetTeam]?.clubId || CURRENT_CLUB_ID;
    safeWriteLocalStorage(ACTIVE_TEAM_STORAGE_KEY, targetTeam);
    safeWriteLocalStorage(ACTIVE_CLUB_STORAGE_KEY, targetClub);
    if (typeof window !== 'undefined' && window.location) {
        window.location.href = buildTeamUrl(targetTeam, targetClub);
    }
}
