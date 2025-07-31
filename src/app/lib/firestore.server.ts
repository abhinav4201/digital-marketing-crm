import { initializeApp, getApps, cert, App, getApp } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth as getAdminAuth, Auth } from "firebase-admin/auth";

let adminApp: App | undefined;
let adminDb: Firestore | undefined;
let adminAuth: Auth | undefined;

const getServiceAccount = () => {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error(
      "The FIREBASE_PRIVATE_KEY environment variable is not set."
    );
  }
  return {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  };
};

try {
  if (getApps().length === 0) {
    adminApp = initializeApp({
      credential: cert(getServiceAccount()),
    });
  } else {
    adminApp = getApp();
  }

  // Only initialize these if the app was successfully initialized
  if (adminApp) {
    adminDb = getFirestore(adminApp);
    adminAuth = getAdminAuth(adminApp);
  }
} catch (error) {
  console.error("Firebase Admin SDK initialization error:", error);
  // If initialization fails, the exports will remain undefined.
}

export { adminDb, adminAuth };
