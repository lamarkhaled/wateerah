import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

window.switchAuthView = function(view) {
  const loginView = document.getElementById('viewLogin');
  const regView = document.getElementById('viewRegister');
  const resetView = document.getElementById('viewReset');
  const sub = document.getElementById('authModalSub');

  if(!loginView || !regView || !resetView) return;

  loginView.style.display = 'none';
  regView.style.display = 'none';
  resetView.style.display = 'none';

  if (view === 'login') {
    loginView.style.display = 'block';
    if(sub) sub.innerText = 'سجلي دخولك للوصول إلى مساحتك الخاصة';
  } else if (view === 'register') {
    regView.style.display = 'block';
    if(sub) sub.innerText = 'أنشئي حسابك الجديد لتبدئي ترتيب حياتك';
  } else if (view === 'reset') {
    resetView.style.display = 'block';
    if(sub) sub.innerText = 'أدخلي بريدك لإرسال رابط الاستعادة';
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

  const name = nameInput ? nameInput.value.trim() : 'صديقنا';
  const email = emailInput.value.trim();
  const pass = passInput.value;

  try {
    await signOut(auth);
    localStorage.removeItem('wateerah_local_state');

    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    
    window.userProfile = { name: name, planType: 'الباقة المتقدمة', isPro: true, expiryDate: 'دائم', totalSubDays: 365, trialUsed: true };
    window.appState = {
      hasStarted: true, 
      theme: 'default', 
      activeWidgets: ['widget-vision', 'widget-kanban', 'widget-business', 'widget-focus', 'widget-habits', 'widget-finance', 'widget-journal'], 
      widgetOrder: ['widget-vision', 'widget-kanban', 'widget-business', 'widget-focus', 'widget-habits', 'widget-finance', 'widget-journal'],
      dailyRecords: {}, notes: [], allocations: [], monthlyExpenses: [], incomeSources: [], incomeTarget: 5000,
      visionBoard: [], kanbanTasks: [], banks: [], wishlist: [], subscriptions: [], business: { projects: [], campaigns: [] }
    };
    
    await setDoc(doc(db, "users", cred.user.uid), { 
      email: email, 
      profile: window.userProfile, 
      state: window.appState, 
      createdAt: new Date().toISOString() 
    });

    localStorage.setItem('wateerah_local_state', JSON.stringify(window.appState));
    window.showToast('تم إنشاء الحساب بنجاح! أهلاً بكِ 🌟');
    location.reload();
  } catch(e) {
    window.showToast('خطأ في التسجيل: تأكدي من صحة البريد');
  }
};

window.handleResetPassword = async () => {
  const emailInput = document.getElementById('resetEmail');
  if(!emailInput) return;
  const email = emailInput.value.trim();
  if(!email) return window.showToast('أدخلي بريدك الإلكتروني أولاً');

  try {
    await sendPasswordResetEmail(auth, email);
    window.showToast('تم إرسال رابط استعادة كلمة المرور 📩');
    window.switchAuthView('login');
  } catch(e) {
    window.showToast('البريد غير مسجل أو حدث خطأ');
  }
};

window.handleLogout = async () => { 
  try { await signOut(auth); } catch(e) {}
  localStorage.removeItem('wateerah_local_state'); 
  location.reload(); 
};
