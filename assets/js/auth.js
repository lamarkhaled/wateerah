import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const ADMIN_EMAIL = "wateerahapp@gmail.com";
auth.languageCode = 'ar';

window.switchAuthView = function(view) {
  const loginView = document.getElementById('viewLogin');
  const regView = document.getElementById('viewRegister');
  const resetView = document.getElementById('viewReset');
  const sub = document.getElementById('authModalSub');

  if(!loginView || !regView || !resetView) return;
  loginView.style.display = 'none'; regView.style.display = 'none'; resetView.style.display = 'none';

  if (view === 'login') {
    loginView.style.display = 'block';
    if(sub) sub.innerText = 'سجل دخولك للوصول إلى مساحتك الخاصة';
  } else if (view === 'register') {
    regView.style.display = 'block';
    if(sub) sub.innerText = 'أنشئ حسابك الجديد لتبدأ الترتيب';
  } else if (view === 'reset') {
    resetView.style.display = 'block';
    if(sub) sub.innerText = 'أدخل بريدك لإرسال رابط الاستعادة';
  }
};

function getLocalYYYYMMDD(dateObj = new Date()) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return parseInt(`${y}${m}${d}`, 10);
}

window.updateSubscriptionUI = function() {
  if (window.userProfile && window.userProfile.isPro && window.userProfile.expiryDate && window.userProfile.expiryDate !== 'دائم') {
    const todayNum = getLocalYYYYMMDD(new Date());
    const expiryNum = getLocalYYYYMMDD(new Date(window.userProfile.expiryDate.replace(/\//g, '-')));

    if (todayNum >= expiryNum) { 
      window.userProfile.isPro = false; 
      window.userProfile.planType = 'الباقة الأساسية'; 
      window.userProfile.expiryDate = ''; 
      window.userProfile.totalSubDays = 0;
      if (window.saveCurrentWateerah) window.saveCurrentWateerah(true);
    }
  }
  
  const badge = document.getElementById('planBadge'); 
  if(badge) badge.innerText = window.userProfile?.isPro ? window.userProfile.planType : 'الباقة الأساسية';
  
  const upg = document.getElementById('upgradeBtn'); 
  if(upg) upg.innerText = window.userProfile?.isPro ? 'إدارة الاشتراك' : 'تفعيل الاشتراك';
  
  if(window.updateDayNightGreeting) window.updateDayNightGreeting();
};

window.setupPricingModal = function() {
  window.updateSubscriptionUI(); 
  const isSubscribed = window.userProfile?.isPro || false;
  const unsubView = document.getElementById('pricingViewUnsubscribed');
  const subView = document.getElementById('pricingViewSubscribed');
  const trialBox = document.getElementById('oneTimeTrialBox');
  const pbBg = document.getElementById('subProgressBarBg');
  
  if (unsubView) unsubView.style.display = isSubscribed ? 'none' : 'block';
  if (subView) subView.style.display = isSubscribed ? 'block' : 'none';
  if (trialBox) trialBox.style.display = (!isSubscribed && !window.userProfile?.trialUsed) ? 'block' : 'none';

  if (isSubscribed && window.userProfile.expiryDate) {
    const isLifetime = window.userProfile.expiryDate === 'دائم';
    const daysRem = document.getElementById('daysRemainingText'); 
    const prog = document.getElementById('subProgressBarFill'); 
    const det = document.getElementById('subActiveDetails'); 
    
    if (isLifetime) {
        if(daysRem) daysRem.innerText = `اشتراك مدى الحياة`;
        if(pbBg) pbBg.style.display = 'none';
        if(det) det.innerHTML = `الباقة: <strong>${window.userProfile.planType}</strong><br>تاريخ الانتهاء: <strong>صلاحية دائمة</strong>`;
    } else {
        if(pbBg) pbBg.style.display = 'block';
        const now = new Date(); now.setHours(0,0,0,0);
        const expiryDate = new Date(window.userProfile.expiryDate.replace(/\//g, '-')); expiryDate.setHours(0,0,0,0);
        let diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) return window.updateSubscriptionUI();

        const totalDays = window.userProfile.totalSubDays || 30;
        if(daysRem) daysRem.innerText = `${diffDays} يوم متبقي`;
        if(prog) prog.style.width = `${Math.min(100, Math.max(0, Math.round((diffDays / totalDays) * 100)))}%`;
        if(det) det.innerHTML = `الباقة: <strong>${window.userProfile.planType}</strong><br>تاريخ الانتهاء: <strong>${window.userProfile.expiryDate}</strong>`;
    }
  }
};

window.handleRegister = async () => {
  const name = document.getElementById('regName')?.value.trim(); 
  const email = document.getElementById('regEmail')?.value.trim(); 
  const pass = document.getElementById('regPassword')?.value;
  if(!email || !pass) return window.showToast('يرجى تعبئة كافة الحقول المطلوبة');

  try {
    document.getElementById('authModal').style.display = 'none';
    await signOut(auth); localStorage.removeItem('wateerah_local_state');
    const cred = await createUserWithEmailAndPassword(auth, email, pass); 
    
    window.userProfile = { name: name || 'مستخدم', isPro: false, planType: 'الباقة الأساسية', trialUsed: false, totalSubDays: 0, expiryDate: '' };
    window.appState = {
      hasStarted: true, theme: 'default', 
      activeWidgets: ['widget-vision', 'widget-kanban', 'widget-business', 'widget-focus', 'widget-habits', 'widget-finance', 'widget-journal', 'widget-glowup'], 
      widgetOrder: ['widget-vision', 'widget-kanban', 'widget-business', 'widget-focus', 'widget-habits', 'widget-finance', 'widget-journal', 'widget-glowup'],
      dailyRecords: {}, notes: [], allocations: [], monthlyExpenses: [], incomeSources: [], incomeTarget: 5000,
      visionBoard: [], kanbanTasks: [], banks: [], wishlist: [], subscriptions: [], business: { projects: [], campaigns: [] }
    };

    await setDoc(doc(db, "users", cred.user.uid), { email, profile: window.userProfile, state: window.appState, status: 'نشط', createdAt: new Date().toISOString() });
    window.showToast('تم التسجيل والدخول بنجاح!');
  } catch(e) { 
    document.getElementById('authModal').style.display = 'flex';
    window.showToast('حدث خطأ في التسجيل، تأكد من صحة البريد.'); 
  }
};

window.handleLogin = async () => {
  const email = document.getElementById('loginEmail')?.value.trim(); 
  const pass = document.getElementById('loginPassword')?.value;
  if(!email || !pass) return window.showToast('يرجى إدخال البريد وكلمة المرور');

  try {
    await signInWithEmailAndPassword(auth, email, pass);
    document.getElementById('authModal').style.display = 'none';
    window.showToast('مرحباً بك مجدداً!');
  } catch(e) { window.showToast('عذراً، البريد الإلكتروني أو كلمة المرور غير صحيحة.'); }
};

window.handleLogout = async () => { await signOut(auth); localStorage.removeItem('wateerah_local_state'); location.reload(); };

window.handleResetPassword = async () => { 
    const email = document.getElementById('resetEmail')?.value.trim(); 
    if(!email) return window.showToast('يرجى إدخال البريد الإلكتروني أولاً.'); 
    try { await sendPasswordResetEmail(auth, email); window.showToast('تم إرسال الرابط.'); window.switchAuthView('login'); } 
    catch(e) { window.showToast('البريد غير مسجل.'); } 
};

window.activateOneTimeFreeTrial = async () => {
  if (!auth.currentUser) return window.showToast('يجب تسجيل الدخول لتفعيل التجربة.'); 
  if (window.userProfile.trialUsed) return window.showToast('عذراً، لقد استخدمت التجربة المجانية مسبقاً.');
  const expiry = new Date(); expiry.setDate(expiry.getDate() + 2);
  window.userProfile.isPro = true; window.userProfile.trialUsed = true; window.userProfile.totalSubDays = 2; window.userProfile.planType = 'تجربة مجانية'; 
  window.userProfile.expiryDate = `${expiry.getFullYear()}-${String(expiry.getMonth() + 1).padStart(2, '0')}-${String(expiry.getDate()).padStart(2, '0')}`;
  window.updateSubscriptionUI(); await window.saveCurrentWateerah(true); window.closeModal('pricingModal'); window.showToast('تم التفعيل بنجاح!');
};

window.activateUserSubscriptionWithCode = async (inputId = 'userActivationCodeInput') => {
  const code = document.getElementById(inputId)?.value.trim();
  if(!code) return window.showToast('الرجاء إدخال كود التفعيل.'); 
  if(!auth.currentUser) return window.showToast('يجب تسجيل الدخول أولاً.');
  try {
    const codeRef = doc(db, "activationCodes", code); const snap = await getDoc(codeRef);
    if(!snap.exists() || snap.data().status === 'used') return window.showToast('عذراً، الكود غير صحيح أو مستخدم مسبقاً.');
    
    const data = snap.data();
    window.userProfile.isPro = true; window.userProfile.planType = 'عضوية نشطة'; 

    if (data.days === 'lifetime') {
        window.userProfile.expiryDate = 'دائم';
        window.userProfile.totalSubDays = 9999;
    } else {
        const days = parseInt(data.days) || 30; let startDate = new Date();
        const todayNum = getLocalYYYYMMDD(startDate);
        if (window.userProfile.expiryDate && window.userProfile.expiryDate !== 'دائم') { 
          const expNum = getLocalYYYYMMDD(new Date(window.userProfile.expiryDate.replace(/\//g, '-')));
          if (expNum > todayNum) startDate = new Date(window.userProfile.expiryDate.replace(/\//g, '-')); 
        }
        const expiryDate = new Date(startDate); expiryDate.setDate(expiryDate.getDate() + days);
        window.userProfile.expiryDate = `${expiryDate.getFullYear()}-${String(expiryDate.getMonth() + 1).padStart(2, '0')}-${String(expiryDate.getDate()).padStart(2, '0')}`;
        window.userProfile.totalSubDays = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
    }
    
    await setDoc(codeRef, { status: 'used', usedBy: auth.currentUser.email, usedByName: window.userProfile.name, usedAt: new Date().toISOString() }, { merge: true });
    
    await window.saveCurrentWateerah(true); window.updateSubscriptionUI();
    if(document.getElementById('userActivationCodeInput')) document.getElementById('userActivationCodeInput').value = ''; 
    if(document.getElementById('userRenewalCodeInput')) document.getElementById('userRenewalCodeInput').value = '';
    window.openModal('pricingModal'); 
    window.showToast(data.days === 'lifetime' ? 'تهانينا! تم تفعيل الاشتراك مدى الحياة.' : `تم تمديد الاشتراك لـ ${data.days} يوم.`);
  } catch(e) { window.showToast('حدث خطأ أثناء تفعيل الكود.'); }
};
