import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const ADMIN_EMAIL = "wateerahapp@gmail.com";

window.handleLogin = async () => {
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPassword');
  if(!emailInput || !passInput) return;
  
  const email = emailInput.value.trim(); 
  const pass = passInput.value;
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    window.closeModal('authModal'); 
    window.showToast('مرحباً بك مجدداً!');
    location.reload();
  } catch(e) { 
    window.showToast('بيانات الدخول غير صحيحة'); 
  }
};

window.handleLogout = async () => { 
  try {
    await signOut(auth); 
  } catch(e) {}
  location.reload(); 
};
