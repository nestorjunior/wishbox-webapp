import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  browserLocalPersistence,
  type Auth,
} from "firebase/auth";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);

export const firebaseApp = hasFirebaseConfig
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const storage = firebaseApp ? getStorage(firebaseApp) : null;

export async function uploadImageToStorage(
  uri: string,
  fileName: string,
): Promise<string> {
  return uploadFileToStorage(uri, `products/${fileName}`);
}

export async function uploadAvatarToStorage(
  uri: string,
  fileName: string,
): Promise<string> {
  return uploadFileToStorage(uri, fileName);
}

async function uploadFileToStorage(
  uri: string,
  storagePath: string,
): Promise<string> {
  if (!storage) {
    throw new Error("Firebase Storage não está configurado.");
  }

  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error("Não foi possível carregar a imagem selecionada.");
  }

  const blob = await response.blob();
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, blob);

  return getDownloadURL(storageRef);
}

function createAuth(app: FirebaseApp): Auth {
  const auth = getAuth(app);
  if (typeof window !== "undefined") {
    // Persist the session across reloads/tabs, mirroring the mobile app's persisted session.
    void auth.setPersistence(browserLocalPersistence);
  }
  return auth;
}

export const auth = firebaseApp ? createAuth(firebaseApp) : null;
export const isFirebaseConfigured = hasFirebaseConfig;

const authEmulatorUrl = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL;

if (auth && authEmulatorUrl) {
  try {
    connectAuthEmulator(auth, authEmulatorUrl, { disableWarnings: true });
  } catch {
    // Ignore reconnect errors in fast refresh.
  }
}
