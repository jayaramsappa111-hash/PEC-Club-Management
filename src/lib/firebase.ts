import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
  type DocumentData
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';
import type { Club, Membership, Event, EventRegistration, EventAttendance, Certificate, Project, Resource } from '../types';

// Build Firebase configuration using environment variables or fallback JSON configuration
const getFirebaseConfig = () => {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};
  if (metaEnv.VITE_FIREBASE_API_KEY) {
    return {
      apiKey: metaEnv.VITE_FIREBASE_API_KEY,
      authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || `${metaEnv.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: metaEnv.VITE_FIREBASE_PROJECT_ID,
      storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || `${metaEnv.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
      messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: metaEnv.VITE_FIREBASE_APP_ID,
    };
  }
  return firebaseConfigJson;
};

const resolvedConfig = getFirebaseConfig();

// Initialize Firebase App singleton safely
let app;
try {
  app = getApps().length > 0 ? getApp() : initializeApp(resolvedConfig);
} catch (e) {
  console.warn('[Firebase Auth] Initialization warning:', e);
  app = getApps().length > 0 ? getApp() : initializeApp({ apiKey: "demo-api-key", authDomain: "demo-app.firebaseapp.com", projectId: "demo-app" });
}

// Initialize and export Auth and Firestore instances for use across the application
export const auth = getAuth(app);

// Configure local persistence
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('[Firebase Auth] Persistence initialization warning:', err);
});

export const db = getFirestore(app);

// Google Provider configuration
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// ==========================================
// FIRESTORE COLLECTIONS & SCHEMA DEFINITIONS
// ==========================================

export const COLLECTIONS = {
  CLUBS: 'clubs',
  MEMBERSHIPS: 'memberships',
  EVENTS: 'events',
  EVENT_REGISTRATIONS: 'event_registrations',
  EVENT_ATTENDANCE: 'event_attendance',
  CERTIFICATES: 'certificates',
  PROJECTS: 'projects',
  RESOURCES: 'resources',
  USERS: 'users',
} as const;

export interface FirestoreClubDocument extends Omit<Club, 'id'> {
  updated_at_timestamp?: Timestamp;
}

export interface FirestoreMembershipDocument extends Omit<Membership, 'id'> {
  created_at_timestamp?: Timestamp;
}

export interface FirestoreEventDocument extends Omit<Event, 'id'> {
  created_at_timestamp?: Timestamp;
}

export interface FirestoreAttendeeDocument extends Omit<EventAttendance, 'id'> {
  timestamp?: Timestamp;
}

// ==========================================
// REAL-TIME FIRESTORE SUBSCRIPTIONS & HELPERS
// ==========================================

/**
 * Subscribe to real-time updates for all 35 university clubs
 */
export function subscribeToClubs(callback: (clubs: Club[]) => void): Unsubscribe {
  const clubsRef = collection(db, COLLECTIONS.CLUBS);
  const q = query(clubsRef, orderBy('name', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const clubs: Club[] = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<Club, 'id'>)
    }));
    callback(clubs);
  }, (err) => {
    console.warn('[Firestore] Real-time clubs subscription warning:', err);
  });
}

/**
 * Subscribe to real-time events for a specific club or all events
 */
export function subscribeToEvents(clubId?: string, callback?: (events: Event[]) => void): Unsubscribe {
  const eventsRef = collection(db, COLLECTIONS.EVENTS);
  const q = clubId 
    ? query(eventsRef, where('club_id', '==', clubId))
    : query(eventsRef, orderBy('start_datetime', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const events: Event[] = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<Event, 'id'>)
    }));
    if (callback) callback(events);
  }, (err) => {
    console.warn('[Firestore] Real-time events subscription warning:', err);
  });
}

/**
 * Subscribe to real-time student memberships
 */
export function subscribeToMemberships(userId?: string, callback?: (memberships: Membership[]) => void): Unsubscribe {
  const membershipsRef = collection(db, COLLECTIONS.MEMBERSHIPS);
  const q = userId
    ? query(membershipsRef, where('user_id', '==', userId))
    : query(membershipsRef, orderBy('joined_at', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const memberships: Membership[] = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<Membership, 'id'>)
    }));
    if (callback) callback(memberships);
  }, (err) => {
    console.warn('[Firestore] Real-time memberships subscription warning:', err);
  });
}

/**
 * Subscribe to real-time event attendees
 */
export function subscribeToAttendees(eventId: string, callback: (attendees: EventAttendance[]) => void): Unsubscribe {
  const attendanceRef = collection(db, COLLECTIONS.EVENT_ATTENDANCE);
  const q = query(attendanceRef, where('event_id', '==', eventId));

  return onSnapshot(q, (snapshot) => {
    const attendees: EventAttendance[] = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<EventAttendance, 'id'>)
    }));
    callback(attendees);
  }, (err) => {
    console.warn('[Firestore] Real-time attendees subscription warning:', err);
  });
}

/**
 * Save or sync a club document to Firestore
 */
export async function saveClubToFirestore(club: Club): Promise<void> {
  const docRef = doc(db, COLLECTIONS.CLUBS, club.id);
  await setDoc(docRef, {
    ...club,
    updated_at_timestamp: Timestamp.now()
  }, { merge: true });
}

/**
 * Save or sync an event document to Firestore
 */
export async function saveEventToFirestore(event: Event): Promise<void> {
  const docRef = doc(db, COLLECTIONS.EVENTS, event.id);
  await setDoc(docRef, {
    ...event,
    created_at_timestamp: Timestamp.now()
  }, { merge: true });
}

/**
 * Save membership registration doc in Firestore
 */
export async function saveMembershipToFirestore(membership: Membership): Promise<void> {
  const docRef = doc(db, COLLECTIONS.MEMBERSHIPS, membership.id);
  await setDoc(docRef, {
    ...membership,
    created_at_timestamp: Timestamp.now()
  }, { merge: true });
}

/**
 * Record attendee check-in in real-time Firestore collection
 */
export async function recordAttendeeInFirestore(attendance: EventAttendance): Promise<void> {
  const docRef = doc(db, COLLECTIONS.EVENT_ATTENDANCE, attendance.id);
  await setDoc(docRef, {
    ...attendance,
    timestamp: Timestamp.now()
  }, { merge: true });
}

export {
  app,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type FirebaseUser
};

