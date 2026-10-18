// assets/js/main.js
import { auth, db, ADMIN_EMAIL } from './firebase-config.js';
import { doc, setDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

// استدعاء باقي الملفات لتعمل
import './ui.js';
import './widgets.js';
import './auth.js';
import './admin.js';

window.unverifiedUserObject = null;
window.userProfile = { name: 'لمار', planType: 'الباقة الأساسية', isPro: false, expiryDate: '', totalSubDays: 30, trialUsed: false };
window.appState = {
  hasStarted: false, theme: 'default', activeWidgets: [],
  widgetOrder: ['widget-vision', 'widget-kanban', 'widget-focus', 'widget-habits', 'widget-finance', 'widget-journal'],
  focusGoal: '', journal: '', habits: [], visionBoard: [], kanbanTasks: [], wallets: [], wishlist: [], subscriptions: []
};

// تهيئة واجهة الاشتراك
window.setupPricingModal = function() {
  const isSubscribed = window.userProfile.isPro;
  document.getElementById('pricingViewUnsubscribed').style.display = isSubscribed ? 'none' : 'block';
  document.getElementById('pricingViewSubscribed').style.display = isSubscribed ? 'block' : 'none';
  
  const trialBox = document.getElementById('oneTimeTrialBox');
  trialBox.style.display = (!isSubscribed && !window.userProfile.trialUsed) ? 'block' : 'none';

  if (isSubscribed && window.userProfile.expiryDate) {
    const now = new Date();
    const expiry = new Date(window.userProfile.expiryDate);
    const diffDays = Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)));
    const totalDays = window.userProfile.totalSubDays || 30;
    
    document.getElementById('daysRemainingText').innerText = `${diffDays} يوم متبقي`;
    document.getElementById('subProgressBarFill').style.width = `${Math.min(100, Math.round((diffDays / totalDays) * 100))}%`;
    document.getElementById('subActiveDetails').innerHTML = `الباقة: <strong>${window.userProfile.planType}</strong><br>تاريخ الانتهاء: <strong>${window.userProfile.expiryDate}</strong>`;
  }
};

window.updateSubscriptionUI = function() {
  if (window.userProfile.isPro && window.userProfile.expiryDate && window.userProfile.expiryDate !== 'دائم') {
    if (new Date() > new Date(window.userProfile.expiryDate)) {
      window.userProfile.isPro = false; window.userProfile.planType = 'الباقة الأساسية';
    }
  }
  document.getElementById('planBadge').innerText = window.userProfile.isPro ? window.userProfile.planType : 'الباقة الأساسية';
  document.getElementById('upgradeBtn').innerText = window.userProfile.isPro ? 'إدارة الاشتراك' : 'تفعيل الاشتراك';
  window.updateDayNightGreeting();
};

let saveTimer;
window.autoSave = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => window.saveCurrentWateerah(false), 700); };

window.saveCurrentWateerah = async (manual) => {
  window.appState.focusGoal = document.getElementById('focusGoalInput')?.value || '';
  window.appState.journal = document.getElementById('journalText')?.value || '';
  localStorage.setItem('wateerah_local_state', JSON.stringify(window.appState));

  const user = auth.currentUser;
  if (!user) { if(manual) window.showToast('تم الحفظ محلياً على جهازك'); return; }
  try {
    await setDoc(doc(db, "users", user.uid), {
      email: user.email, profile: window.userProfile, state: window.appState, updatedAt: new Date().toISOString()
    }, { merge: true });
    if(manual) window.showToast('تم الحفظ والمزامنة سحابياً');
  } catch(e) { console.error(e); }
};

window.saveProfile = async () => {
  window.userProfile.name = document.getElementById('profileNameInput').value.trim() || 'صديقنا';
  document.getElementById('headerUserName').innerText = window.userProfile.name;
  document.getElementById('headerAvatar').innerText = window.userProfile.name[0];
  window.updateSubscriptionUI(); window.closeModal('profileModal'); window.saveCurrentWateerah(true);
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
      document.getElementById('activeGlassMessage').style.display = 'none';
      document.getElementById('emptyGlassMessage').style.display = 'flex';
      return;
    }

    document.getElementById('activeGlassMessage').style.display = 'block';
    document.getElementById('emptyGlassMessage').style.display = 'none';
    document.getElementById('glassMessageText').innerText = data.message;
    
    const imgEl = document.getElementById('glassMessageImg');
    if (data.imageUrl) { imgEl.src = data.imageUrl; imgEl.style.display = 'block'; }
    else { imgEl.style.display = 'none'; }

    if (data.duration > 0) {
      const left = Math.max(1, Math.ceil(data.duration - elapsedMin));
      document.getElementById('msgRemainingTime').innerText = `تختفي بعد ${left} د`;
    } else document.getElementById('msgRemainingTime').innerText = '';
  });
}

// التشغيل الأساسي
const savedLocal = localStorage.getItem('wateerah_local_state');
if (savedLocal) { try { window.appState = { ...window.appState, ...JSON.parse(savedLocal) }; } catch(e) {} }

window.updateDayNightGreeting();
window.applyTheme(window.appState.theme || 'default');
window.renderWorkspaceVisibility();
window.initWidgetsDragAndDrop();
listenToCloudMessages();

onAuthStateChanged(auth, async (user) => {
  if (user && (user.emailVerified || user.email === ADMIN_EMAIL)) {
    document.getElementById('guestAuthBtn').style.display = 'none';
    document.getElementById('userProfilePill').style.display = 'flex';
    document.getElementById('syncIndicator').innerText = 'متصل ومتزامن سحابياً';
    document.getElementById('profileUidDisplay').value = user.uid;

    if (user.email === ADMIN_EMAIL) document.getElementById('adminPanelBtn').style.display = 'inline-flex';

    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if(snap.exists()) {
        const d = snap.data();
        if(d.profile) window.userProfile = { ...window.userProfile, ...d.profile };
        if(d.state) window.appState = { ...window.appState, ...d.state };
      }
    } catch(e) { console.error(e); }

    window.applyTheme(window.appState.theme || 'default');
    window.updateSubscriptionUI();
    document.getElementById('headerUserName').innerText = window.userProfile.name || user.email;
    document.getElementById('headerAvatar').innerText = (window.userProfile.name || 'ل')[0];
    document.getElementById('profileNameInput').value = window.userProfile.name || '';
    document.getElementById('focusGoalInput').value = window.appState.focusGoal || '';
    document.getElementById('journalText').value = window.appState.journal || '';
    window.renderWorkspaceVisibility();
    window.renderLists();
  } else {
    window.updateSubscriptionUI();
    window.renderWorkspaceVisibility();
    window.renderLists();
  }
});
