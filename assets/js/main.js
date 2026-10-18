// assets/js/main.js
import { auth, db, ADMIN_EMAIL } from './firebase-config.js';
import { doc, setDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

window.unverifiedUserObject = null;
window.userProfile = { name: 'لمار', planType: 'الباقة الأساسية', isPro: false, expiryDate: '', totalSubDays: 30, trialUsed: false };
window.appState = {
  hasStarted: false, theme: 'default', activeWidgets: [],
  widgetOrder: ['widget-vision', 'widget-kanban', 'widget-focus', 'widget-habits', 'widget-finance', 'widget-journal'],
  focusGoal: '', journal: '', habits: [], visionBoard: [], kanbanTasks: [], wallets: [], wishlist: [], subscriptions: []
};

window.setupPricingModal = function() {
  const isSubscribed = window.userProfile.isPro;
  document.getElementById('pricingViewUnsubscribed').style.display = isSubscribed ? 'none' : 'block';
  document.getElementById('pricingViewSubscribed').style.display = isSubscribed ? 'block' : 'none';
  
  const trialBox = document.getElementById('oneTimeTrialBox');
  if(trialBox) trialBox.style.display = (!isSubscribed && !window.userProfile.trialUsed) ? 'block' : 'none';

  if (isSubscribed && window.userProfile.expiryDate) {
    const now = new Date();
    const expiry = new Date(window.userProfile.expiryDate);
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

window.updateSubscriptionUI = function() {
  if (window.userProfile.isPro && window.userProfile.expiryDate && window.userProfile.expiryDate !== 'دائم') {
    if (new Date() > new Date(window.userProfile.expiryDate)) {
      window.userProfile.isPro = false; window.userProfile.planType = 'الباقة الأساسية';
    }
  }
  const badge = document.getElementById('planBadge');
  if(badge) badge.innerText = window.userProfile.isPro ? window.userProfile.planType : 'الباقة الأساسية';
  
  const upg = document.getElementById('upgradeBtn');
  if(upg) upg.innerText = window.userProfile.isPro ? 'إدارة الاشتراك' : 'تفعيل الاشتراك';
  
  if(window.updateDayNightGreeting) window.updateDayNightGreeting();
};

let saveTimer;
window.autoSave = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => window.saveCurrentWateerah(false), 700); };

window.saveCurrentWateerah = async (manual) => {
  window.appState.focusGoal = document.getElementById('focusGoalInput')?.value || '';
  window.appState.journal = document.getElementById('journalText')?.value || '';
  localStorage.setItem('wateerah_local_state', JSON.stringify(window.appState));

  const user = auth.currentUser;
  if (!user) { if(manual && window.showToast) window.showToast('تم الحفظ محلياً على جهازك'); return; }
  try {
    await setDoc(doc(db, "users", user.uid), {
      email: user.email, profile: window.userProfile, state: window.appState, updatedAt: new Date().toISOString()
    }, { merge: true });
    if(manual && window.showToast) window.showToast('تم الحفظ والمزامنة سحابياً');
  } catch(e) { console.error(e); }
};

window.saveProfile = async () => {
  const nameInp = document.getElementById('profileNameInput');
  window.userProfile.name = nameInp ? nameInp.value.trim() || 'صديقنا' : 'صديقنا';
  
  const hdrName = document.getElementById('headerUserName');
  if(hdrName) hdrName.innerText = window.userProfile.name;
  
  const hdrAv = document.getElementById('headerAvatar');
  if(hdrAv) hdrAv.innerText = window.userProfile.name[0];
  
  window.updateSubscriptionUI(); 
  if(window.closeModal) window.closeModal('profileModal'); 
  window.saveCurrentWateerah(true);
};

function listenToCloudMessages() {
  onSnapshot(doc(db, "notifications", "activeMessage"), (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    const user = auth.currentUser;
    const myEmail = user ? user.email : ''; const myUid = user ? user.uid : '';

    const isForMe = data.target === 'ALL' || (myEmail && data.target === myEmail) || (myUid && data.target === myUid);
    if (!isForMe) return;

    const elapsedMin = (Date.now() - data.timestamp) / (1000 * 60);
    if (data.duration > 0 && elapsedMin >= data.duration) {
      const act = document.getElementById('activeGlassMessage');
      const emp = document.getElementById('emptyGlassMessage');
      if(act) act.style.display = 'none';
      if(emp) emp.style.display = 'flex';
      return;
    }

    const act = document.getElementById('activeGlassMessage');
    const emp = document.getElementById('emptyGlassMessage');
    if(act) act.style.display = 'block';
    if(emp) emp.style.display = 'none';
    
    const txt = document.getElementById('glassMessageText');
    if(txt) txt.innerText = data.message;
    
    const imgEl = document.getElementById('glassMessageImg');
    if (data.imageUrl && imgEl) { imgEl.src = data.imageUrl; imgEl.style.display = 'block'; }
    else if(imgEl) { imgEl.style.display = 'none'; }

    const timerEl = document.getElementById('msgRemainingTime');
    if (data.duration > 0 && timerEl) {
      const left = Math.max(1, Math.ceil(data.duration - elapsedMin));
      timerEl.innerText = `تختفي بعد ${left} د`;
    } else if(timerEl) {
      timerEl.innerText = '';
    }
  });
}

const savedLocal = localStorage.getItem('wateerah_local_state');
if (savedLocal) { try { window.appState = { ...window.appState, ...JSON.parse(savedLocal) }; } catch(e) {} }

setTimeout(() => {
    if(window.updateDayNightGreeting) window.updateDayNightGreeting();
    if(window.applyTheme) window.applyTheme(window.appState.theme || 'default');
    if(window.renderWorkspaceVisibility) window.renderWorkspaceVisibility();
    if(window.initWidgetsDragAndDrop) window.initWidgetsDragAndDrop();
    listenToCloudMessages();
}, 150);

onAuthStateChanged(auth, async (user) => {
  setTimeout(async () => {
      if (user && (user.emailVerified || user.email === ADMIN_EMAIL)) {
        const guestBtn = document.getElementById('guestAuthBtn');
        if(guestBtn) guestBtn.style.display = 'none';
        
        const pill = document.getElementById('userProfilePill');
        if(pill) pill.style.display = 'flex';
        
        const syncInd = document.getElementById('syncIndicator');
        if(syncInd) syncInd.innerText = 'متصل ومتزامن سحابياً';
        
        const uidDisp = document.getElementById('profileUidDisplay');
        if(uidDisp) uidDisp.value = user.uid;

        if (user.email === ADMIN_EMAIL) {
          const adminBtn = document.getElementById('adminPanelBtn');
          if(adminBtn) adminBtn.style.display = 'inline-flex';
        }

        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          if(snap.exists()) {
            const d = snap.data();
            if(d.profile) window.userProfile = { ...window.userProfile, ...d.profile };
            if(d.state) window.appState = { ...window.appState, ...d.state };
          }
        } catch(e) { console.error(e); }

        if(window.applyTheme) window.applyTheme(window.appState.theme || 'default');
        window.updateSubscriptionUI();
        
        const hdrName = document.getElementById('headerUserName');
        if(hdrName) hdrName.innerText = window.userProfile.name || user.email;
        
        const hdrAv = document.getElementById('headerAvatar');
        if(hdrAv) hdrAv.innerText = (window.userProfile.name || 'ل')[0];
        
        const prfInp = document.getElementById('profileNameInput');
        if(prfInp) prfInp.value = window.userProfile.name || '';
        
        const fGoal = document.getElementById('focusGoalInput');
        if(fGoal) fGoal.value = window.appState.focusGoal || '';
        
        const jTxt = document.getElementById('journalText');
        if(jTxt) jTxt.value = window.appState.journal || '';
        
        if(window.renderWorkspaceVisibility) window.renderWorkspaceVisibility();
        if(window.renderLists) window.renderLists();
      } else {
        window.updateSubscriptionUI();
        if(window.renderWorkspaceVisibility) window.renderWorkspaceVisibility();
        if(window.renderLists) window.renderLists();
      }
  }, 150);
});
