// assets/js/auth.js
import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signOut } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import { doc, setDoc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

window.handleRegister = async () => {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pass = document.getElementById('regPassword').value;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await sendEmailVerification(cred.user);
    
    window.userProfile.name = name || 'صديقنا';
    window.userProfile.isPro = true;
    window.userProfile.planType = 'تجربة مجانية ✨';
    window.userProfile.trialUsed = true;
    
    const trialExpiry = new Date();
    trialExpiry.setDate(trialExpiry.getDate() + 2);
    window.userProfile.expiryDate = trialExpiry.toISOString().slice(0, 10).replace(/-/g, '/');

    await setDoc(doc(db, "users", cred.user.uid), { 
      email, profile: window.userProfile, state: window.appState, status: 'نشط', createdAt: new Date().toISOString() 
    });

    window.showToast('تم إنشاء الحساب ومنحك يومين تجربة مجانية');
    window.closeModal('authModal');
  } catch(e) { window.showToast('خطأ في التسجيل: ' + e.message); }
};

window.handleLogin = async () => {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPassword').value;
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    if (!cred.user.emailVerified && cred.user.email !== "wateerahapp@gmail.com") {
      window.unverifiedUserObject = cred.user;
      window.closeModal('authModal');
      window.openModal('verificationNoticeModal');
      await signOut(auth);
      return;
    }
    window.closeModal('authModal');
    window.showToast('مرحباً بك مجدداً!');
  } catch(e) { window.showToast('بيانات الدخول غير صحيحة'); }
};

window.handleLogout = async () => { await signOut(auth); location.reload(); };

window.handleResetPassword = async () => {
  const email = document.getElementById('resetEmail').value.trim();
  if(!email) return window.showToast('أدخل البريد الإلكتروني');
  try {
    await sendPasswordResetEmail(auth, email);
    window.showToast('تم إرسال رابط الاستعادة');
    window.closeModal('resetModal');
  } catch(e) { window.showToast('البريد غير مسجل'); }
};

window.resendVerificationEmailDirectly = async () => {
  if(!window.unverifiedUserObject) return window.showToast('سجل دخولك أولاً لإعادة الإرسال');
  try {
    await sendEmailVerification(window.unverifiedUserObject);
    window.showToast('تم إرسال رابط التفعيل إلى بريدك');
    window.closeModal('verificationNoticeModal');
  } catch(e) { window.showToast('انتظر قليلاً قبل المحاولة مجدداً'); }
};

window.activateOneTimeFreeTrial = async () => {
  if (!auth.currentUser) return window.showToast('يرجى تسجيل الدخول أولاً لتفعيل التجربة');
  if (window.userProfile.trialUsed) return window.showToast('لقد استخدمت التجربة المجانية مسبقاً');

  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 2);

  window.userProfile.isPro = true;
  window.userProfile.trialUsed = true;
  window.userProfile.totalSubDays = 2;
  window.userProfile.planType = 'تجربة مجانية (يومين)';
  window.userProfile.expiryDate = expiry.toISOString().slice(0, 10);

  window.updateSubscriptionUI();
  await window.saveCurrentWateerah(true);
  window.closeModal('pricingModal');
  window.showToast('تم تفعيل التجربة المجانية لمدة يومين');
};

window.activateUserSubscriptionWithCode = async (inputId = 'userActivationCodeInput') => {
  const codeInput = document.getElementById(inputId);
  const code = codeInput ? codeInput.value.trim() : '';
  if(!code) return window.showToast('أدخل الكود أولاً');
  if(!auth.currentUser) return window.showToast('سجل دخولك أولاً');

  try {
    const codeRef = doc(db, "activationCodes", code);
    const snap = await getDoc(codeRef);
    if(!snap.exists()) return window.showToast('الكود غير صحيح أو تم استخدامه مسبقاً');

    const days = parseInt(snap.data().days) || 30;
    let startDate = new Date();
    
    if (window.userProfile.isPro && window.userProfile.expiryDate && window.userProfile.expiryDate !== 'دائم') {
       const currentExpiry = new Date(window.userProfile.expiryDate);
       if (currentExpiry > startDate) startDate = currentExpiry; 
    }

    const expiryDate = new Date(startDate);
    expiryDate.setDate(expiryDate.getDate() + days);

    window.userProfile.isPro = true;
    window.userProfile.planType = 'عضوية نشطة';
    window.userProfile.expiryDate = expiryDate.toISOString().slice(0, 10);
    
    const now = new Date();
    window.userProfile.totalSubDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    await deleteDoc(codeRef);
    await window.saveCurrentWateerah(true);
    window.updateSubscriptionUI();
    
    if(document.getElementById('userActivationCodeInput')) document.getElementById('userActivationCodeInput').value = '';
    if(document.getElementById('userRenewalCodeInput')) document.getElementById('userRenewalCodeInput').value = '';

    window.openModal('pricingModal');
    window.showToast(`تم تفعيل وتمديد الاشتراك بنجاح لـ ${days} يوم!`);
  } catch(e) { window.showToast('حدث خطأ أثناء التفعيل'); }
};
