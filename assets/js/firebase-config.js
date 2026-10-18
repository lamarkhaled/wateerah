import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB00VedBbLRBhjkMTSxkbXFY16gMJS_I6E",
  authDomain: "wateerah-f0f36.firebaseapp.com",
  databaseURL: "https://wateerah-f0f36-default-rtdb.firebaseio.com",
  projectId: "wateerah-f0f36",
  storageBucket: "wateerah-f0f36.firebasestorage.app",
  messagingSenderId: "470896604513",
  appId: "1:470896604513:web:2d1fe5fc94e03253f08120"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const ADMIN_EMAIL = "wateerahapp@gmail.com";
