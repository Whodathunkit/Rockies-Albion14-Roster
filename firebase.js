import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, getDocs, setDoc, onSnapshot, collection } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import {
    CURRENT_TEAM_ID,
    CURRENT_CLUB_ID,
    getActiveTeamConfig,
    getTeamStorageKey,
    getTeamStorageItem,
    setTeamStorageItem
} from "./tenant.js";

const defaultProjectId = "rockies-albion-14";

function resolveCustomFirebaseConfig() {
    if (typeof window !== 'undefined' && window.__firebase_config) {
        try {
            return typeof window.__firebase_config === 'string'
                ? JSON.parse(window.__firebase_config)
                : window.__firebase_config;
        } catch {
            // Fall through to localStorage / defaults
        }
    }
    try {
        const stored = getTeamStorageItem('custom_firebase', 'rfc14_custom_firebase');
        if (stored) {
            return JSON.parse(stored);
        }
    } catch {
        // Ignore malformed localStorage config
    }
    return null;
}

const envConfig = resolveCustomFirebaseConfig();

// Firebase configuration with API key & credentials
export const firebaseConfig = envConfig || {
    apiKey: "AIzaSyBiHCsbZ_d36OyxaZpivk8tifKazvwLhCs",
    authDomain: `${defaultProjectId}.firebaseapp.com`,
    projectId: defaultProjectId,
    storageBucket: `${defaultProjectId}.firebasestorage.app`,
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:albion14"
};

export let app = null;
export let db = null;
export let auth = null;
export let currentUser = null;
export let cancelUploadRequested = false;
export const resolvedMediaCache = {};

let listenersInitialized = false;
let activeUnsubscribers = [];
let authStateUnsubscribe = null;

// ============================================================================
// Multi-Tenant Path & Legacy Bridge Helpers
// ============================================================================

function getLegacyAppId(teamId = CURRENT_TEAM_ID) {
    if (typeof window !== 'undefined' && window.__app_id) {
        return window.__app_id;
    }
    const config = getActiveTeamConfig(teamId);
    return config?.firestore?.legacyAppId || 'rockies-albion-14';
}

function isLegacyBridgeEnabled(teamId = CURRENT_TEAM_ID) {
    if (teamId === 'albion14') return true;
    const config = getActiveTeamConfig(teamId);
    return Boolean(config?.firestore?.useLegacyCollectionBridge);
}

/**
 * Returns canonical dynamic Firestore path builders scoped to the active team.
 */
export function getTeamFirestorePaths(teamId = CURRENT_TEAM_ID) {
    return {
        clubId: CURRENT_CLUB_ID,
        teamId,
        playersCollection: () => collection(db, 'teams', teamId, 'players'),
        playerDoc: (jersey) => doc(db, 'teams', teamId, 'players', String(jersey)),
        matchCenterDoc: () => doc(db, 'teams', teamId, 'matchCenter', 'activeMatch'),
        configDoc: (docName = 'portal') => doc(db, 'teams', teamId, 'config', String(docName)),
        mediaChunkDoc: (mediaId, index) => doc(db, 'teams', teamId, 'mediaChunks', `${mediaId}_${index}`),
        sessionDoc: (uid) => doc(db, 'teams', teamId, 'sessions', String(uid))
    };
}

function getLegacyFirestorePaths(teamId = CURRENT_TEAM_ID) {
    const legacyAppId = getLegacyAppId(teamId);
    return {
        playersCollection: () => collection(db, 'artifacts', legacyAppId, 'public', 'data', 'playerProfiles'),
        playerDoc: (jersey) => doc(db, 'artifacts', legacyAppId, 'public', 'data', 'playerProfiles', String(jersey)),
        matchCenterDoc: () => doc(db, 'artifacts', legacyAppId, 'public', 'data', 'matchCenter', 'activeMatch'),
        portalConfigDoc: () => doc(db, 'artifacts', legacyAppId, 'public', 'data', 'teamPortal', 'config'),
        profilesBackupDoc: () => doc(db, 'artifacts', legacyAppId, 'public', 'data', 'teamPortal', 'profilesBackup'),
        mediaChunkDoc: (mediaId, index) => doc(db, 'artifacts', legacyAppId, 'public', 'data', 'mediaChunks', `${mediaId}_${index}`),
        sessionDoc: (uid) => doc(db, 'artifacts', legacyAppId, 'users', String(uid), 'preferences', 'session')
    };
}

// ============================================================================
// Sync Badge Helper
// ============================================================================

export function setSyncBadge(statusText, dotColorClass) {
    const dot = document.getElementById('connection-status-dot');
    const text = document.getElementById('connection-status-text');
    const modalDetail = document.getElementById('cloud-modal-status-detail');

    if (dot && dotColorClass) dot.className = `w-1.5 h-1.5 rounded-full ${dotColorClass}`;
    if (text && statusText) text.textContent = statusText;
    if (modalDetail && statusText) modalDetail.textContent = statusText;
}

export function requestUploadCancel() {
    cancelUploadRequested = true;
}

// ============================================================================
// Chunked Video Upload & Resolution (Team-Scoped + Albion 14 Legacy Bridge)
// ============================================================================

export async function uploadVideoToFirestoreChunks(file, onProgress) {
    if (!db || !currentUser) {
        // Fallback for offline/local preview: return object URL
        const localUrl = URL.createObjectURL(file);
        if (typeof onProgress === 'function') onProgress(100);
        return localUrl;
    }

    const maxBytes = 20 * 1024 * 1024; // 20MB limit
    if (file.size > maxBytes) {
        throw new Error("Video file is larger than 20MB. Please trim the clip to a shorter highlight.");
    }

    cancelUploadRequested = false;

    const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    const base64Index = dataUrl.indexOf(',');
    const metaHeader = dataUrl.substring(0, base64Index + 1);
    const rawBase64 = dataUrl.substring(base64Index + 1);

    const chunkSize = 450 * 1024;
    const totalChunks = Math.ceil(rawBase64.length / chunkSize);
    const mediaId = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const paths = getTeamFirestorePaths(CURRENT_TEAM_ID);
    let completedChunks = 0;
    const batchSize = 3;

    for (let i = 0; i < totalChunks; i += batchSize) {
        if (cancelUploadRequested) {
            throw new Error("Upload cancelled.");
        }
        const batchPromises = [];
        for (let j = i; j < Math.min(i + batchSize, totalChunks); j++) {
            const chunkData = rawBase64.substring(j * chunkSize, (j + 1) * chunkSize);
            const chunkDocRef = paths.mediaChunkDoc(mediaId, j);
            batchPromises.push(
                setDoc(chunkDocRef, {
                    clubId: CURRENT_CLUB_ID,
                    teamId: CURRENT_TEAM_ID,
                    mediaId,
                    index: j,
                    totalChunks,
                    metaHeader,
                    mimeType: file.type || 'video/mp4',
                    data: chunkData,
                    updatedBy: currentUser.uid,
                    createdAt: Date.now()
                }).then(() => {
                    completedChunks++;
                    if (typeof onProgress === 'function') {
                        onProgress(Math.round((completedChunks / totalChunks) * 100));
                    }
                })
            );
        }
        await Promise.all(batchPromises);
    }

    const firestoreUri = `firestore://mediaChunks/${mediaId}?chunks=${totalChunks}`;
    resolvedMediaCache[firestoreUri] = URL.createObjectURL(file);
    return firestoreUri;
}

export async function resolveFirebaseMediaUrl(url) {
    if (!url || !url.startsWith('firestore://mediaChunks/')) {
        return url || '';
    }
    if (resolvedMediaCache[url]) {
        return resolvedMediaCache[url];
    }
    if (!db || !currentUser) return '';

    try {
        const withoutPrefix = url.replace('firestore://mediaChunks/', '');
        const [mediaId, queryStr] = withoutPrefix.split('?');
        const params = new URLSearchParams(queryStr || '');
        const totalChunks = parseInt(params.get('chunks') || '1', 10);

        const paths = getTeamFirestorePaths(CURRENT_TEAM_ID);
        const primarySnaps = await Promise.all(
            Array.from({ length: totalChunks }, (_, i) => getDoc(paths.mediaChunkDoc(mediaId, i)))
        );

        let resolvedSnaps = primarySnaps;
        const missingInPrimary = primarySnaps.some(snap => !snap.exists());

        // Legacy fallback bridge for Albion 14 historical video uploads
        if (missingInPrimary && isLegacyBridgeEnabled(CURRENT_TEAM_ID)) {
            const legacyPaths = getLegacyFirestorePaths(CURRENT_TEAM_ID);
            resolvedSnaps = await Promise.all(
                primarySnaps.map((snap, i) =>
                    snap.exists() ? Promise.resolve(snap) : getDoc(legacyPaths.mediaChunkDoc(mediaId, i))
                )
            );
        }

        const orderedChunks = new Array(totalChunks);
        let mimeType = 'video/mp4';

        for (let i = 0; i < resolvedSnaps.length; i++) {
            const snap = resolvedSnaps[i];
            if (!snap.exists()) {
                throw new Error(`Missing video chunk ${i}`);
            }
            const d = snap.data();
            if (d.mimeType) mimeType = d.mimeType;
            orderedChunks[i] = d.data;
        }

        const fullBase64 = orderedChunks.join('');
        const byteCharacters = atob(fullBase64);
        const byteArrays = [];
        const sliceSize = 8192;
        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            byteArrays.push(new Uint8Array(byteNumbers));
        }

        const blob = new Blob(byteArrays, { type: mimeType });
        const objectUrl = URL.createObjectURL(blob);
        resolvedMediaCache[url] = objectUrl;
        return objectUrl;
    } catch (err) {
        console.warn("Error resolving Firestore video chunks:", err);
        return '';
    }
}

// ============================================================================
// Team-Scoped Session Unlock Helpers (Cookie + localStorage + Firestore)
// ============================================================================

export function setUnlockCookie(unlocked) {
    const scopedKey = getTeamStorageKey('unlocked');
    if (unlocked) {
        try {
            document.cookie = `${scopedKey}=1; max-age=31536000; path=/; SameSite=Lax`;
        } catch {}
        setTeamStorageItem('unlocked', '1');
    } else {
        try {
            document.cookie = `${scopedKey}=; max-age=0; path=/; SameSite=Lax`;
            if (isLegacyBridgeEnabled(CURRENT_TEAM_ID)) {
                document.cookie = "rfc14_unlocked=; max-age=0; path=/; SameSite=Lax";
            }
        } catch {}
        try {
            localStorage.removeItem(scopedKey);
            if (isLegacyBridgeEnabled(CURRENT_TEAM_ID)) {
                localStorage.removeItem('rfc14_unlocked');
            }
        } catch {}
    }
}

export function hasUnlockCookie() {
    const scopedKey = getTeamStorageKey('unlocked');
    try {
        const cookies = document.cookie.split(';').map(c => c.trim());
        if (cookies.some(c => c.startsWith(`${scopedKey}=1`))) {
            return true;
        }
        if (isLegacyBridgeEnabled(CURRENT_TEAM_ID) && cookies.some(c => c.startsWith('rfc14_unlocked=1'))) {
            return true;
        }
    } catch {}

    return getTeamStorageItem('unlocked', 'rfc14_unlocked') === '1';
}

export async function checkCloudUserUnlock(uid) {
    if (hasUnlockCookie()) {
        const gate = document.getElementById('family-pass-gate');
        if (gate) gate.classList.add('hidden');
        return;
    }
    if (!db || !uid) return;

    try {
        const paths = getTeamFirestorePaths(CURRENT_TEAM_ID);
        let snap = await getDoc(paths.sessionDoc(uid));

        // Legacy fallback bridge strictly for albion14
        if ((!snap.exists() || snap.data()?.unlocked !== true) && isLegacyBridgeEnabled(CURRENT_TEAM_ID)) {
            const legacyPaths = getLegacyFirestorePaths(CURRENT_TEAM_ID);
            const legacySnap = await getDoc(legacyPaths.sessionDoc(uid));
            if (legacySnap.exists() && legacySnap.data()?.unlocked === true) {
                snap = legacySnap;
            }
        }

        if (snap.exists() && snap.data()?.unlocked === true) {
            setUnlockCookie(true);
            const gate = document.getElementById('family-pass-gate');
            if (gate) gate.classList.add('hidden');
        }
    } catch (e) {
        console.warn("Session unlock lookup error:", e);
    }
}

export async function saveCloudUserUnlock(unlocked) {
    setUnlockCookie(unlocked);
    if (!db || !currentUser) return;

    try {
        const paths = getTeamFirestorePaths(CURRENT_TEAM_ID);
        await setDoc(paths.sessionDoc(currentUser.uid), {
            clubId: CURRENT_CLUB_ID,
            teamId: CURRENT_TEAM_ID,
            unlocked: Boolean(unlocked),
            updatedAt: Date.now()
        }, { merge: true });
    } catch (e) {
        console.warn("Session unlock save error:", e);
    }
}

// ============================================================================
// Team-Scoped Database & LocalStorage Persistence Helpers
// ============================================================================

export async function savePersistentData(matchState, leagueStandings, scheduleEvents) {
    let cleanMatch = (matchState && typeof matchState === 'object' && !Array.isArray(matchState)) ? matchState : null;
    let cleanStandings = Array.isArray(leagueStandings) ? leagueStandings : null;
    let cleanSchedule = Array.isArray(scheduleEvents) ? scheduleEvents : (Array.isArray(matchState) ? matchState : null);

    if (!cleanMatch) {
        try {
            const raw = getTeamStorageItem('match_state', 'rfc14_match_state');
            if (raw) cleanMatch = JSON.parse(raw);
        } catch {}
    }
    if (!cleanStandings) {
        try {
            const raw = getTeamStorageItem('standings', 'rfc14_standings');
            if (raw) cleanStandings = JSON.parse(raw);
        } catch {}
    }
    if (!cleanSchedule) {
        try {
            const raw =
                getTeamStorageItem('schedule_v4', 'rfc14_schedule_v4') ||
                getTeamStorageItem('schedule', 'rfc14_schedule');
            if (raw) cleanSchedule = JSON.parse(raw);
        } catch {}
    }

    if (cleanMatch) {
        setTeamStorageItem('match_state', cleanMatch);
    }
    if (cleanStandings) {
        setTeamStorageItem('standings', cleanStandings);
    }
    if (cleanSchedule) {
        setTeamStorageItem('schedule_v4', cleanSchedule);
    }

    if (!db || !currentUser) {
        return;
    }

    try {
        const paths = getTeamFirestorePaths(CURRENT_TEAM_ID);

        if (cleanMatch) {
            const matchDocRef = paths.matchCenterDoc();
            await setDoc(matchDocRef, {
                ...JSON.parse(JSON.stringify(cleanMatch)),
                clubId: CURRENT_CLUB_ID,
                teamId: CURRENT_TEAM_ID,
                updatedAt: Date.now()
            }, { merge: true });
        }

        const portalUpdates = {
            clubId: CURRENT_CLUB_ID,
            teamId: CURRENT_TEAM_ID,
            updatedAt: Date.now()
        };
        if (cleanStandings) portalUpdates.standingsJson = JSON.stringify(cleanStandings);
        if (cleanSchedule) portalUpdates.scheduleJson = JSON.stringify(cleanSchedule);

        const portalDocRef = paths.configDoc('portal');
        await setDoc(portalDocRef, portalUpdates, { merge: true });
    } catch (err) {
        console.warn("Save error:", err);
    }
}

export async function savePlayerProfileToFirebase(jersey, profileUpdates, playerProfilesMap) {
    if (!playerProfilesMap[jersey]) {
        playerProfilesMap[jersey] = { jersey };
    }
    const cleanUpdates = JSON.parse(JSON.stringify(profileUpdates));
    playerProfilesMap[jersey] = {
        ...playerProfilesMap[jersey],
        ...cleanUpdates,
        jersey,
        clubId: CURRENT_CLUB_ID,
        teamId: CURRENT_TEAM_ID,
        updatedAt: Date.now()
    };

    setTeamStorageItem('player_profiles', playerProfilesMap);

    if (!db || !currentUser) return;

    try {
        const paths = getTeamFirestorePaths(CURRENT_TEAM_ID);
        setSyncBadge("Saving...", "bg-sky-400 animate-pulse");

        const playerDocRef = paths.playerDoc(jersey);
        await setDoc(playerDocRef, playerProfilesMap[jersey], { merge: true });

        const profilesBackupRef = paths.configDoc('profilesBackup');
        await setDoc(profilesBackupRef, {
            clubId: CURRENT_CLUB_ID,
            teamId: CURRENT_TEAM_ID,
            profilesJson: JSON.stringify(playerProfilesMap),
            updatedAt: Date.now()
        }, { merge: true });

        setSyncBadge("Firebase Live", "bg-emerald-400 animate-pulse");
    } catch (err) {
        console.warn("Player profile save error:", err);
    }
}

// ============================================================================
// Realtime Sync Lifecycle & Listener Teardown
// ============================================================================

export function teardownRealtimeSync() {
    if (activeUnsubscribers.length > 0) {
        activeUnsubscribers.forEach((unsub) => {
            try {
                if (typeof unsub === 'function') {
                    unsub();
                }
            } catch (err) {
                console.warn("Error detaching Firestore listener:", err);
            }
        });
        activeUnsubscribers = [];
    }
    listenersInitialized = false;
}

function dispatchMatchData(onDataSync, data) {
    if (!data || !onDataSync) return;
    if (typeof onDataSync.onMatchCenterDoc === 'function') {
        onDataSync.onMatchCenterDoc(data);
    } else if (typeof onDataSync === 'function') {
        onDataSync('match', data);
    }
}

function dispatchPortalData(onDataSync, data) {
    if (!data || !onDataSync) return;
    if (typeof onDataSync.onTeamPortalDoc === 'function') {
        onDataSync.onTeamPortalDoc(data);
    } else if (typeof onDataSync === 'function') {
        onDataSync('portal', data);
    }
}

function dispatchProfilesData(onDataSync, profilesList, updatesMap) {
    if (!onDataSync) return;
    if (typeof onDataSync.onPlayerProfilesDocs === 'function') {
        onDataSync.onPlayerProfilesDocs(profilesList);
    } else if (typeof onDataSync === 'function') {
        onDataSync('profiles', updatesMap);
    }
}

/**
 * Attaches real-time Firestore listeners scoped to the active team.
 * For albion14, seamlessly falls back to legacy artifacts/rockies-albion-14/public/data/...
 * reads whenever the new team-scoped document/collection is not yet populated.
 * Returns an unsubscribe cleanup function to cleanly detach all listeners on context switch.
 */
export function setupRealtimeSync(onDataSync, teamId = CURRENT_TEAM_ID) {
    if (!db || !currentUser) {
        return () => {};
    }

    // Always detach any previous listeners cleanly before re-subscribing
    if (listenersInitialized || activeUnsubscribers.length > 0) {
        teardownRealtimeSync();
    }

    listenersInitialized = true;
    const paths = getTeamFirestorePaths(teamId);
    const useLegacyBridge = isLegacyBridgeEnabled(teamId);
    const legacyPaths = useLegacyBridge ? getLegacyFirestorePaths(teamId) : null;

    let hasPrimaryMatch = false;
    let hasPrimaryProfiles = false;
    let hasPrimaryPortal = false;
    let legacyMatchLoaded = false;
    let legacyProfilesLoaded = false;
    let legacyPortalLoaded = false;

    // 1. Match Center / Active Match Listener
    try {
        const unsubMatch = onSnapshot(paths.matchCenterDoc(), async (snap) => {
            if (snap.exists()) {
                hasPrimaryMatch = true;
                dispatchMatchData(onDataSync, snap.data());
                return;
            }

            if (useLegacyBridge && !hasPrimaryMatch && !legacyMatchLoaded && legacyPaths) {
                legacyMatchLoaded = true;
                try {
                    const legacySnap = await getDoc(legacyPaths.matchCenterDoc());
                    if (legacySnap.exists() && !hasPrimaryMatch) {
                        dispatchMatchData(onDataSync, legacySnap.data());
                    }
                } catch (legacyErr) {
                    console.warn("Legacy matchCenter fallback read error:", legacyErr);
                }
            }
        }, (err) => {
            console.warn("Match snapshot error:", err);
        });
        activeUnsubscribers.push(unsubMatch);
    } catch (err) {
        console.warn("Match listener setup error:", err);
    }

    // 2. Player Profiles Collection Listener
    try {
        const unsubProfiles = onSnapshot(paths.playersCollection(), async (snap) => {
            if (!snap.empty) {
                hasPrimaryProfiles = true;
                const updates = {};
                const profilesList = [];
                snap.forEach((docSnap) => {
                    const data = docSnap.data();
                    updates[docSnap.id] = data;
                    profilesList.push({ id: docSnap.id, ...data });
                });
                dispatchProfilesData(onDataSync, profilesList, updates);
                return;
            }

            if (useLegacyBridge && !hasPrimaryProfiles && !legacyProfilesLoaded && legacyPaths) {
                legacyProfilesLoaded = true;
                try {
                    const legacyColSnap = await getDocs(legacyPaths.playersCollection());
                    if (!legacyColSnap.empty && !hasPrimaryProfiles) {
                        const updates = {};
                        const profilesList = [];
                        legacyColSnap.forEach((docSnap) => {
                            const data = docSnap.data();
                            updates[docSnap.id] = data;
                            profilesList.push({ id: docSnap.id, ...data });
                        });
                        dispatchProfilesData(onDataSync, profilesList, updates);
                    } else if (!hasPrimaryProfiles) {
                        // Secondary legacy safety net: profilesBackup document
                        const backupSnap = await getDoc(legacyPaths.profilesBackupDoc());
                        if (backupSnap.exists() && backupSnap.data()?.profilesJson && !hasPrimaryProfiles) {
                            const parsed = JSON.parse(backupSnap.data().profilesJson);
                            const profilesList = Object.entries(parsed).map(([id, data]) => ({ id, ...data }));
                            dispatchProfilesData(onDataSync, profilesList, parsed);
                        }
                    }
                } catch (legacyErr) {
                    console.warn("Legacy playerProfiles fallback read error:", legacyErr);
                }
            }
        }, (err) => {
            console.warn("Profiles snapshot error:", err);
        });
        activeUnsubscribers.push(unsubProfiles);
    } catch (err) {
        console.warn("Profiles listener setup error:", err);
    }

    // 3. Team Portal Config (Standings & Schedule) Listener
    try {
        const unsubPortal = onSnapshot(paths.configDoc('portal'), async (snap) => {
            if (snap.exists()) {
                hasPrimaryPortal = true;
                dispatchPortalData(onDataSync, snap.data());
                return;
            }

            if (useLegacyBridge && !hasPrimaryPortal && !legacyPortalLoaded && legacyPaths) {
                legacyPortalLoaded = true;
                try {
                    const legacySnap = await getDoc(legacyPaths.portalConfigDoc());
                    if (legacySnap.exists() && !hasPrimaryPortal) {
                        dispatchPortalData(onDataSync, legacySnap.data());
                    }
                } catch (legacyErr) {
                    console.warn("Legacy teamPortal config fallback read error:", legacyErr);
                }
            }
        }, (err) => {
            console.warn("Portal snapshot error:", err);
        });
        activeUnsubscribers.push(unsubPortal);
    } catch (err) {
        console.warn("Portal listener setup error:", err);
    }

    return teardownRealtimeSync;
}

// ============================================================================
// Initialize Auth & Real-Time Sync
// ============================================================================

export function initFirebase(onDataSync) {
    try {
        const existingApps = getApps();
        app = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);

        if (typeof authStateUnsubscribe === 'function') {
            try { authStateUnsubscribe(); } catch {}
            authStateUnsubscribe = null;
        }

        const executeAuth = async () => {
            try {
                if (typeof window !== 'undefined' && window.__initial_auth_token) {
                    try {
                        await signInWithCustomToken(auth, window.__initial_auth_token);
                    } catch {
                        await signInAnonymously(auth);
                    }
                } else {
                    await signInAnonymously(auth);
                }

                authStateUnsubscribe = onAuthStateChanged(auth, (user) => {
                    currentUser = user;
                    if (user) {
                        setSyncBadge("Firebase Live", "bg-emerald-400 animate-pulse");
                        setupRealtimeSync(onDataSync, CURRENT_TEAM_ID);
                        checkCloudUserUnlock(user.uid);
                    } else {
                        teardownRealtimeSync();
                        setSyncBadge("Disconnected", "bg-amber-400");
                    }
                });
            } catch (err) {
                console.warn("Auth initialization error:", err);
                setSyncBadge("Local Mode", "bg-amber-400");
            }
        };

        executeAuth();
    } catch (e) {
        console.warn("Firebase initialization error:", e);
        setSyncBadge("Local Mode", "bg-amber-400");
    }

    return () => {
        teardownRealtimeSync();
        if (typeof authStateUnsubscribe === 'function') {
            try { authStateUnsubscribe(); } catch {}
            authStateUnsubscribe = null;
        }
    };
}
