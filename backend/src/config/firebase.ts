import admin from 'firebase-admin';

let firebaseApp: admin.app.App;

export function initFirebase(): admin.app.App {
  if (admin.apps.length === 0) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
  } else {
    firebaseApp = admin.apps[0] as admin.app.App;
  }
  return firebaseApp;
}

export function getFirebaseAdmin(): admin.auth.Auth {
  if (!firebaseApp) {
    initFirebase();
  }
  return admin.auth();
}

export function getFirebaseMessaging(): admin.messaging.Messaging {
  if (!firebaseApp) {
    initFirebase();
  }
  return admin.messaging(firebaseApp);
}

export default admin;
