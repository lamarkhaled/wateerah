import { auth, db, ADMIN_EMAIL } from './firebase-config.js';
import { doc, setDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

window.unverifiedUserObject = null;
window.activeVisionIndex = null;
window.draggedKanbanIndex = null;

// المتغيرات للتحكم بالتاريخ
window.currentDateObj = new Date();
window.currentDateStr = window.currentDateObj.toISOString().slice(0, 10);

window.userProfile = { name: 'لمار', planType: 'الباقة الأساسية', isPro: false, expiryDate: '', totalSubDays: 30, trialUsed: false };
window.appState = {
  hasStarted: false, theme: 'default', activeWidgets: [], widgetOrder: ['widget-vision', 'widget-kanban', 'widget-focus', 'widget-habits', 'widget-finance', 'widget-journal'],
  dailyRecords: {}, // هذا السجل السحري الذي سيحفظ تقدم كل يوم على حدة
  visionBoard: [], kanbanTasks: [], banks: [], wishlist: [], subscriptions: []
};

let saveTimer; window.autoSave = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => window.saveCurrentWateerah(false), 700); };

window.saveCurrentWateerah = async (manual) => {
  // حفظ بيانات اليوم الحالي في السجل اليومي قبل المزامنة
  if (!window.appState.dailyRecords) window.appState.dailyRecords = {};
  window.appState.dailyRecords[window.currentDateStr] = {
    focusGoal: document.getElementById('focusGoalInput')?.value || '',
    journal: document.getElementById('journalText')?.value || '',
    habits: window.appState.habits || []
  };

  localStorage.setItem('wateerah_local_state', JSON.stringify(window.appState));
  const user = auth.currentUser;
  if (!user) { if(manual && window.showToast) window.showToast('تم الحفظ محلياً'); return; }
  try { await setDoc(doc(db, "users", user.uid), { email: user.email, profile: window.userProfile, state: window.appState, updatedAt: new Date().toISOString() }, { merge: true }); if(manual && window.showToast) window.showToast('تم الحفظ والمزامنة سحابياً'); } catch(e) {}
};

// الدالة السحرية لتغيير التاريخ وفتح صفحة جديدة
window.changeDate = function(offset) {
  // 1. احفظ اليوم الحالي قبل ما ننتقل
  if (!window.appState.dailyRecords) window.appState.dailyRecords = {};
  window.appState.dailyRecords[window.currentDateStr] = {
    focusGoal: document.getElementById('focusGoalInput')?.value || '',
    journal: document.getElementById('journalText')?.value || '',
    habits: window.appState.habits || []
  };

  // 2. غير التاريخ
  if (offset === 0) { window.currentDateObj = new Date(); } 
  else { window.currentDateObj.setDate(window.currentDateObj.getDate() + offset); }
  
  window.currentDateStr = window.currentDateObj.toISOString().slice(0, 10);
  const todayStr = new Date().toISOString().slice(0, 10);
  
  const dateLabel = document.getElementById('dateLabel');
  if (dateLabel) dateLabel.innerText = (window.currentDateStr === todayStr) ? 'اليوم' : 'يوم آخر';
  
  const liveDate = document.getElementById('liveDateText');
  if (liveDate) liveDate.innerText = window.currentDateObj.toLocaleDateString('ar-SA', { weekday: 'long', month: 'short', day: 'numeric' });

  // 3. اسحب بيانات اليوم الجديد
  const daily = window.appState.dailyRecords[window.currentDateStr] || { focusGoal: '', journal: '', habits: [] };
  window.appState.habits = daily.habits || [];
  
  const focusInput = document.getElementById('focusGoalInput');
  if(focusInput) focusInput.value = daily.focusGoal || '';
  
  const journalInput = document.getElementById('journalText');
  if(journalInput) journalInput.value = daily.journal || '';
  
  if(window.renderLists) window.renderLists();
  window.saveCurrentWateerah(false);
};

window.saveProfile = async () => {
  window.userProfile.name = document.getElementById('profileNameInput')?.value.trim() || 'صديقنا';
  document.getElementById('headerUserName').innerText = window.userProfile.name; document.getElementById('headerAvatar').innerText = window.userProfile.name[0];
  if(window.updateSubscriptionUI) window.updateSubscriptionUI(); 
  if(window.closeModal) window.closeModal('profileModal'); 
  window.saveCurrentWateerah(true);
};

function listenToCloudMessages() {
  onSnapshot(doc(db, "notifications", "activeMessage"), (snap) => {
    if (!snap.exists()) return;
    const data = snap.data(); const user = auth.currentUser; const myEmail = user ? user.email : ''; const myUid = user ? user.uid : '';
    if (!(data.target === 'ALL' || data.target === myEmail || data.target === myUid)) return;
    const elapsedMin = (Date.now() - data.timestamp) / (1000 * 60);
    if (data.duration > 0 && elapsedMin >= data.duration) { const a = document.getElementById('activeGlassMessage'); const e = document.getElementById('emptyGlassMessage'); if(a) a.style.display = 'none'; if(e) e.style.display = 'flex'; return; }
    const a = document.getElementById('activeGlassMessage'); const e = document.getElementById('emptyGlassMessage'); if(a) a.style.display = 'block'; if(e) e.style.display = 'none';
    const txt = document.getElementById('glassMessageText'); if(txt) txt.innerText = data.message;
    const imgEl = document.getElementById('glassMessageImg'); if (data.imageUrl && imgEl) { imgEl.src = data.imageUrl; imgEl.style.display = 'block'; } else if(imgEl) { imgEl.style.display = 'none'; }
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
  
  // تشغيل التاريخ والصفحة الأولى
  window.changeDate(0);
  if (window.innerWidth <= 768) {
    document.querySelectorAll('.widget-card').forEach(card => card.classList.remove('active-tab-item'));
    document.querySelectorAll('.tab-home').forEach(el => el.classList.add('active-tab-item'));
  }
}, 200);

onAuthStateChanged(auth, async (user) => {
  setTimeout(async () => {
      if (user && (user.emailVerified || user.email === ADMIN_EMAIL)) {
        const guestBtn = document.getElementById('guestAuthBtn'); if(guestBtn) guestBtn.style.display = 'none';
        const pill = document.getElementById('userProfilePill'); if(pill) pill.style.display = 'flex';
        const syncInd = document.getElementById('syncIndicator'); if(syncInd) syncInd.innerText = 'متصل ومتزامن سحابياً';
        const uidDisp = document.getElementById('profileUidDisplay'); if(uidDisp) uidDisp.value = user.uid;

        if (user.email === ADMIN_EMAIL) { const adminBtn = document.getElementById('adminPanelBtn'); if(adminBtn) adminBtn.style.display = 'inline-flex'; }

        try { const snap = await getDoc(doc(db, "users", user.uid)); if(snap.exists()) { const d = snap.data(); if(d.profile) window.userProfile = { ...window.userProfile, ...d.profile }; if(d.state) window.appState = { ...window.appState, ...d.state }; } } catch(e) {}
        if(window.applyTheme) window.applyTheme(window.appState.theme || 'default'); 
        if(window.updateSubscriptionUI) window.updateSubscriptionUI();
        
        document.getElementById('headerUserName').innerText = window.userProfile.name || user.email; document.getElementById('headerAvatar').innerText = (window.userProfile.name || 'ل')[0]; document.getElementById('profileNameInput').value = window.userProfile.name || '';
        
        window.changeDate(0);
        if(window.renderWorkspaceVisibility) window.renderWorkspaceVisibility(); 
      } else { 
        if(window.updateSubscriptionUI) window.updateSubscriptionUI(); 
        if(window.renderWorkspaceVisibility) window.renderWorkspaceVisibility(); 
        window.changeDate(0);
      }
  }, 200);
});
