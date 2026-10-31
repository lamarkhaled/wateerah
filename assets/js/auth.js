import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// دالة التبديل بين نماذج شاشة القفل (تسجيل دخول، إنشاء حساب، استعادة كلمة المرور)
window.switchAuthView = function(view) {
  const loginView = document.getElementById('viewLogin');
  const regView = document.getElementById('viewRegister');
  const resetView = document.getElementById('viewReset');
  const title = document.getElementById('authModalTitle');
  const sub = document.getElementById('authModalSub');

  if(!loginView || !regView || !resetView) return;

  loginView.style.display = 'none';
  regView.style.display = 'none';
  resetView.style.display = 'none';

  if (view === 'login') {
    loginView.style.display = 'block';
    if(title) title.innerText = 'منصة وتيرة 🔒';
    if(sub) sub.innerText = 'المنصة محمية. سجلي دخولك للوصول إلى مساحتك.';
  } else if (view === 'register') {
    regView.style.display = 'block';
    if(title) title.innerText = 'إنشاء حساب جديد ✨';
    if(sub) sub.innerText = 'أنشئي حسابك الخاص لتبدئي مزامنة بياناتك بسلاسة.';
  } else if (view === 'reset') {
    resetView.style.display = 'block';
    if(title) title.innerText = 'استعادة كلمة المرور 🔑';
    if(sub) sub.innerText = 'أدخلي بريدك الإلكتروني لإرسال رابط استعادة كلمة المرور.';
  }
};

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

window.handleRegister = async () => {
  const nameInput = document.getElementById('regName');
  const emailInput = document.getElementById('regEmail');
  const passInput = document.getElementById('regPassword');
  if(!emailInput || !passInput) return;

  const name = nameInput ? nameInput.value.trim() : 'لمار';
  const email = emailInput.value.trim();
  const pass = passInput.value;

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    window.userProfile.name = name || 'لمار';
    
    // حفظ ملف المستخدم الأولي في السحابة
    await setDoc(doc(db, "users", cred.user.uid), { 
      email: email, 
      profile: window.userProfile, 
      state: window.appState, 
      createdAt: new Date().toISOString() 
    });

    window.showToast('تم إنشاء الحساب بنجاح! أهلاً بكِ 🌟');
    window.closeModal('authModal');
    location.reload();
  } catch(e) {
    window.showToast('خطأ في التسجيل: ' + e.message);
  }
};

window.handleResetPassword = async () => {
  const emailInput = document.getElementById('resetEmail');
  if(!emailInput) return;
  const email = emailInput.value.trim();
  if(!email) return window.showToast('أدخلي بريدك الإلكتروني أولاً');

  try {
    await sendPasswordResetEmail(auth, email);
    window.showToast('تم إرسال رابط استعادة كلمة المرور إلى بريدك 📩');
    window.switchAuthView('login');
  } catch(e) {
    window.showToast('البريد غير مسجل أو حدث خطأ');
  }
};

window.handleLogout = async () => { 
  try {
    await signOut(auth); 
  } catch(e) {}
  localStorage.removeItem('wateerah_local_state'); 
  location.reload(); 
};
