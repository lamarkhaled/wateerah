import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const ADMIN_EMAIL = "wateerahapp@gmail.com";

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
    // 1. تسجيل الخروج الإجباري أولاً لضمان عدم تداخل أي جلسة سابقة
    await signOut(auth);
    localStorage.removeItem('wateerah_local_state');

    // 2. إنشاء حساب جديد ونظيف تماماً
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    
    window.userProfile = { name: name || 'لمار', planType: 'الباقة المتقدمة', isPro: true, expiryDate: 'دائم', totalSubDays: 365, trialUsed: true };
    window.appState = {
      hasStarted: true, 
      theme: 'default', 
      activeWidgets: ['widget-vision', 'widget-kanban', 'widget-business', 'widget-focus', 'widget-habits', 'widget-finance', 'widget-journal'], 
      widgetOrder: ['widget-vision', 'widget-kanban', 'widget-business', 'widget-focus', 'widget-habits', 'widget-finance', 'widget-journal'],
      dailyRecords: {}, notes: [], allocations: [], monthlyExpenses: [], incomeSources: [], incomeTarget: 5000,
      visionBoard: [], kanbanTasks: [], banks: [], wishlist: [], subscriptions: [], business: { projects: [], campaigns: [] }
    };
    
    // حفظ الحساب الجديد في السحابة بمعفاه المستقل (UID)
    await setDoc(doc(db, "users", cred.user.uid), { 
      email: email, 
      profile: window.userProfile, 
      state: window.appState, 
      createdAt: new Date().toISOString() 
    });

    localStorage.setItem('wateerah_local_state', JSON.stringify(window.appState));
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
