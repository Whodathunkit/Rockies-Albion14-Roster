import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot, collection } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'rockies-albion-14';
const defaultProjectId = "rockies-albion-14";
const envConfig = typeof window !== 'undefined' && window.__firebase_config ? JSON.parse(window.__firebase_config) : null;

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

// Sync Badge Helper
export function setSyncBadge(statusText, dotColorClass) {
    const dot = document.getElementById('connection-status-dot');
    const text = document.getElementById('connection-status-text');
    const modalDetail = document.getElementById('cloud-modal-status-detail');

    if (dot && dotColorClass) dot.className = `w-1.5 h-1.5 rounded-full ${dotColorClass}`;
    if (text && statusText) text.textContent = statusText;
    if (modalDetail && statusText) modalDetail.textContent = statusText;
}

// Chunked video uploader to Firestore
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

    let completedChunks = 0;
    const batchSize = 3;

    for (let i = 0; i < totalChunks; i += batchSize) {
        if (cancelUploadRequested) {
            throw new Error("Upload cancelled.");
        }
        const batchPromises = [];
        for (let j = i; j < Math.min(i + batchSize, totalChunks); j++) {
            const chunkData = rawBase64.substring(j * chunkSize, (j + 1) * chunkSize);
            const chunkDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'mediaChunks', `${mediaId}_${j}`);
            batchPromises.push(
                setDoc(chunkDocRef, {
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

// Media Chunk Resolver
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

        const chunkPromises = [];
        for (let i = 0; i < totalChunks; i++) {
            const chunkDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'mediaChunks', `${mediaId}_${i}`);
            chunkPromises.push(getDoc(chunkDocRef));
        }

        const snaps = await Promise.all(chunkPromises);
        const orderedChunks = new Array(totalChunks);
        let mimeType = 'video/mp4';

        for (let i = 0; i < snaps.length; i++) {
            const snap = snaps[i];
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

// Cookie Helper
export function setUnlockCookie(unlocked) {
    if (unlocked) {
        document.cookie = "rfc14_unlocked=1; max-age=31536000; path=/; SameSite=Lax";
        localStorage.setItem('rfc14_unlocked', '1');
    } else {
        document.cookie = "rfc14_unlocked=; max-age=0; path=/; SameSite=Lax";
        localStorage.removeItem('rfc14_unlocked');
    }
}

export function hasUnlockCookie() {
    return document.cookie.split(';').some(c => c.trim().startsWith('rfc14_unlocked=1')) ||
           localStorage.getItem('rfc14_unlocked') === '1';
}

export async function checkCloudUserUnlock(uid) {
    if (hasUnlockCookie()) {
        const gate = document.getElementById('family-pass-gate');
        if (gate) gate.classList.add('hidden');
        return;
    }
    if (!db || !uid) return;
    try {
        const sessionRef = doc(db, 'artifacts', appId, 'users', uid, 'preferences', 'session');
        const snap = await getDoc(sessionRef);
        if (snap.exists() && snap.data().unlocked === true) {
            setUnlockCookie(true);
            const gate = document.getElementById('family-pass-gate');
            if (gate) gate.classList.add('hidden');
        }
    } catch (e) {}
}

export async function saveCloudUserUnlock(unlocked) {
    setUnlockCookie(unlocked);
    if (!db || !currentUser) return;
    try {
        const sessionRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'preferences', 'session');
        await setDoc(sessionRef, { unlocked, updatedAt: Date.now() }, { merge: true });
    } catch (e) {}
}

// Database Persistence Helpers
export async function savePersistentData(matchState, leagueStandings, scheduleEvents) {
    if (!db || !currentUser) {
        localStorage.setItem('rfc14_match_state', JSON.stringify(matchState));
        localStorage.setItem('rfc14_standings', JSON.stringify(leagueStandings));
        localStorage.setItem('rfc14_schedule', JSON.stringify(scheduleEvents));
        return;
    }
    try {
        const cleanMatchState = JSON.parse(JSON.stringify(matchState));
        const matchDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'matchCenter', 'activeMatch');
        await setDoc(matchDocRef, cleanMatchState, { merge: true });

        const portalDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'teamPortal', 'config');
        await setDoc(portalDocRef, {
            standingsJson: JSON.stringify(leagueStandings),
            scheduleJson: JSON.stringify(scheduleEvents),
            updatedAt: Date.now()
        }, { merge: true });
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
        updatedAt: Date.now()
    };

    localStorage.setItem('rfc14_player_profiles', JSON.stringify(playerProfilesMap));

    if (!db || !currentUser) return;
    try {
        setSyncBadge("Saving...", "bg-sky-400 animate-pulse");
        const playerDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'playerProfiles', String(jersey));
        await setDoc(playerDocRef, playerProfilesMap[jersey], { merge: true });

        const profilesBackupRef = doc(db, 'artifacts', appId, 'public', 'data', 'teamPortal', 'profilesBackup');
        await setDoc(profilesBackupRef, {
            profilesJson: JSON.stringify(playerProfilesMap),
            updatedAt: Date.now()
        }, { merge: true });

        setSyncBadge("Firebase Live", "bg-emerald-400 animate-pulse");
    } catch (err) {
        console.warn("Player profile save error:", err);
    }
}

// Initialize Auth & Real-Time Sync
export function initFirebase(onDataSync) {
    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);

        const executeAuth = async () => {
            try {
                if (typeof window !== 'undefined' && window.__initial_auth_token) {
                    try {
                        await signInWithCustomToken(auth, window.__initial_auth_token);
                    } catch (customErr) {
                        await signInAnonymously(auth);
                    }
                } else {
                    await signInAnonymously(auth);
                }

                onAuthStateChanged(auth, (user) => {
                    currentUser = user;
                    if (user) {
                        setSyncBadge("Firebase Live", "bg-emerald-400 animate-pulse");
                        setupRealtimeSync(onDataSync);
                        checkCloudUserUnlock(user.uid);
                    } else {
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
}

function setupRealtimeSync(onDataSync) {
    if (!db || !currentUser || listenersInitialized) return;
    listenersInitialized = true;

    try {
        const matchDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'matchCenter', 'activeMatch');
        onSnapshot(matchDocRef, (snap) => {
            if (snap.exists() && onDataSync) {
                const data = snap.data();
                if (typeof onDataSync.onMatchCenterDoc === 'function') {
                    onDataSync.onMatchCenterDoc(data);
                } else if (typeof onDataSync === 'function') {
                    onDataSync('match', data);
                }
            }
        });
    } catch (err) {
        console.warn("Match snapshot error:", err);
    }

    try {
        const profilesColRef = collection(db, 'artifacts', appId, 'public', 'data', 'playerProfiles');
        onSnapshot(profilesColRef, (snap) => {
            const updates = {};
            const profilesList = [];
            snap.forEach((docSnap) => {
                const data = docSnap.data();
                updates[docSnap.id] = data;
                profilesList.push({ id: docSnap.id, ...data });
            });
            if (onDataSync) {
                if (typeof onDataSync.onPlayerProfilesDocs === 'function') {
                    onDataSync.onPlayerProfilesDocs(profilesList);
                } else if (typeof onDataSync === 'function') {
                    onDataSync('profiles', updates);
                }
            }
        });
    } catch (err) {
        console.warn("Profiles snapshot error:", err);
    }

    try {
        const portalDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'teamPortal', 'config');
        onSnapshot(portalDocRef, (snap) => {
            if (snap.exists() && onDataSync) {
                const data = snap.data();
                if (typeof onDataSync.onTeamPortalDoc === 'function') {
                    onDataSync.onTeamPortalDoc(data);
                } else if (typeof onDataSync === 'function') {
                    onDataSync('portal', data);
                }
            }
        });
    } catch (err) {
        console.warn("Portal snapshot error:", err);
    }
}
