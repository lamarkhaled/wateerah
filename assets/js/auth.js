import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const ADMIN_EMAIL = "wateerahapp@gmail.com";

window.updateSubscriptionUI = function() {
  // التحقق الدقيق من انتهاء الاشتراك بمقارنة الأيام بشكل صحيح
  if (window.userProfile.isPro && window.userProfile.expiryDate && window.userProfile.expiryDate !== 'دائم') {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // تصفير الوقت لليوم الحالي
    
    const expiry = new Date(window.userProfile.expiryDate);
    expiry.setHours(0, 0, 0, 0); // تصفير الوقت لتاريخ الانتهاء
    
    const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    
    // إذا انتهى التاريخ أو الأيام المتبقية 0 أو أقل
    if (now > expiry || diffDays <= 0) { 
      window.userProfile.isPro = false; 
      window.userProfile.planType = 'الباقة الأساسية'; 
      // حفظ التحديث فوراً ليعود العميل كعضو مجاني
      if (window.saveCurrentWateerah) window.saveCurrentWateerah(false);
    }
  }
  
  const badge = document.getElementById('planBadge'); 
  if(badge) badge.innerText = window.userProfile.isPro ? window.userProfile.planType : 'الباقة الأساسية';
  
  const upg = document.getElementById('upgradeBtn'); 
  if(upg) upg.innerText = window.userProfile.isPro ? 'إدارة الاشتراك' : 'تفعيل الاشتراك';
  
  if(window.updateDayNightGreeting) window.updateDayNightGreeting();
};

window.setupPricingModal = function() {
  // تحديث حالة الاشتراك أولاً قبل فتح النافذة لضمان عدم عرض 0 يوم
  window.updateSubscriptionUI();
  
  const isSubscribed = window.userProfile.isPro;
  document.getElementById('pricingViewUnsubscribed').style.display = isSubscribed ? 'none' : 'block';
  document.getElementById('pricingViewSubscribed').style.display = isSubscribed ? 'block' : 'none';
  
  const trialBox = document.getElementById('oneTimeTrialBox');
  if(trialBox) trialBox.style.display = (!isSubscribed && !window.userProfile.trialUsed) ? 'block' : 'none';

  if (isSubscribed && window.userProfile.expiryDate) {
    const now = new Date(); 
    now.setHours(0, 0, 0, 0);
    const expiry = new Date(window.userProfile.expiryDate);
    expiry.setHours(0, 0, 0, 0);
    
    const diffDays = Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)));
    const totalDays = window.userProfile.totalSubDays || 30;
    
    const daysRem = document.getElementById('daysRemainingText'); 
    if(daysRem) daysRem.innerText = `${diffDays} يوم متبقي`;
    
    const prog = document.getElementById('subProgressBarFill'); 
    if(prog) prog.style.width = `${Math.min(100, Math.round((diffDays / totalDays) * 100))}%`;
    
    const det = document.getElementById('subActiveDetails'); 
    if(det) det.innerHTML = `الباقة: <strong>${window.userProfile.planType}</strong><br>تاريخ الانتهاء: <strong>${window.userProfile.expiryDate}</strong>`;
  }
};

window.handleRegister = async () => {
  const name = document.getElementById('regName').value.trim(); const email = document.getElementById('regEmail').value.trim(); const pass = document.getElementById('regPassword').value;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass); await sendEmailVerification(cred.user);
    window.userProfile.name = name || 'صديقنا'; window.userProfile.isPro = true; window.userProfile.planType = 'تجربة مجانية'; window.userProfile.trialUsed = true;
    const trialExpiry = new Date(); trialExpiry.setDate(trialExpiry.getDate() + 2); window.userProfile.expiryDate = trialExpiry.toISOString().slice(0, 10).replace(/-/g, '/');
    await setDoc(doc(db, "users", cred.user.uid), { email, profile: window.userProfile, state: window.appState, status: 'نشط', createdAt: new Date().toISOString() });
    window.showToast('تم إنشاء الحساب ومنحك تجربة مجانية'); window.closeModal('authModal');
  } catch(e) { window.showToast('خطأ: ' + e.message); }
};

window.handleLogin = async () => {
  const email = document.getElementById('loginEmail').value.trim(); const pass = document.getElementById('loginPassword').value;
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    if (!cred.user.emailVerified && cred.user.email !== ADMIN_EMAIL) { window.unverifiedUserObject = cred.user; window.closeModal('authModal'); window.openModal('verificationNoticeModal'); await signOut(auth); return; }
    window.closeModal('authModal'); window.showToast('مرحباً بك مجدداً!');
  } catch(e) { window.showToast('بيانات الدخول غير صحيحة'); }
};

window.handleLogout = async () => { await signOut(auth); location.reload(); };
window.handleResetPassword = async () => { const email = document.getElementById('resetEmail').value.trim(); if(!email) return window.showToast('أدخل البريد'); try { await sendPasswordResetEmail(auth, email); window.showToast('تم إرسال رابط الاستعادة'); window.closeModal('resetModal'); } catch(e) { window.showToast('البريد غير مسجل'); } };
window.resendVerificationEmailDirectly = async () => { if(!window.unverifiedUserObject) return window.showToast('سجل دخولك أولاً'); try { await sendEmailVerification(window.unverifiedUserObject); window.showToast('تم إرسال الرابط'); window.closeModal('verificationNoticeModal'); } catch(e) {} };

window.activateOneTimeFreeTrial = async () => {
  if (!auth.currentUser) return window.showToast('سجل الدخول أولاً'); if (window.userProfile.trialUsed) return window.showToast('استخدمت التجربة مسبقاً');
  const expiry = new Date(); expiry.setDate(expiry.getDate() + 2);
  window.userProfile.isPro = true; window.userProfile.trialUsed = true; window.userProfile.totalSubDays = 2; window.userProfile.planType = 'تجربة مجانية'; window.userProfile.expiryDate = expiry.toISOString().slice(0, 10);
  window.updateSubscriptionUI(); await window.saveCurrentWateerah(true); window.closeModal('pricingModal'); window.showToast('تم تفعيل التجربة');
};

window.activateUserSubscriptionWithCode = async (inputId = 'userActivationCodeInput') => {
  const code = document.getElementById(inputId)?.value.trim();
  if(!code) return window.showToast('أدخل الكود'); if(!auth.currentUser) return window.showToast('سجل الدخول أولاً');
  try {
    const codeRef = doc(db, "activationCodes", code); const snap = await getDoc(codeRef);
    if(!snap.exists()) return window.showToast('الكود غير صحيح أو مستخدم');
    const days = parseInt(snap.data().days) || 30; let startDate = new Date();
    if (window.userProfile.isPro && window.userProfile.expiryDate && window.userProfile.expiryDate !== 'دائم') { const currentExpiry = new Date(window.userProfile.expiryDate); if (currentExpiry > startDate) startDate = currentExpiry; }
    const expiryDate = new Date(startDate); expiryDate.setDate(expiryDate.getDate() + days);
    window.userProfile.isPro = true; window.userProfile.planType = 'عضوية نشطة'; window.userProfile.expiryDate = expiryDate.toISOString().slice(0, 10);
    window.userProfile.totalSubDays = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
    await deleteDoc(codeRef); await window.saveCurrentWateerah(true); window.updateSubscriptionUI();
    if(document.getElementById('userActivationCodeInput')) document.getElementById('userActivationCodeInput').value = ''; if(document.getElementById('userRenewalCodeInput')) document.getElementById('userRenewalCodeInput').value = '';
    window.openModal('pricingModal'); window.showToast(`تم تمديد الاشتراك لـ ${days} يوم!`);
  } catch(e) { window.showToast('حدث خطأ'); }
};
