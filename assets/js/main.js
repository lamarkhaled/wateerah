import { auth, db, ADMIN_EMAIL } from './firebase-config.js';
import { doc, setDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// تمت إزالة الـ imports الداخلية لمنع التعارض في Vercel

window.unverifiedUserObject = null;
window.activeVisionIndex = null;
window.draggedKanbanIndex = null;

window.userProfile = { name: 'لمار', planType: 'الباقة الأساسية', isPro: false, expiryDate: '', totalSubDays: 30, trialUsed: false };
window.appState = {
  hasStarted: false, theme: 'default', activeWidgets: [], widgetOrder: ['widget-vision', 'widget-kanban', 'widget-focus', 'widget-habits', 'widget-finance', 'widget-journal'],
  focusGoal: '', journal: '', habits: [], visionBoard: [], kanbanTasks: [], banks: [], wishlist: [], subscriptions: []
};

let saveTimer; window.autoSave = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => window.saveCurrentWateerah(false), 700); };

window.saveCurrentWateerah = async (manual) => {
  window.appState.focusGoal = document.getElementById('focusGoalInput')?.value || ''; window.appState.journal = document.getElementById('journalText')?.value || '';
  localStorage.setItem('wateerah_local_state', JSON.stringify(window.appState));
  const user = auth.currentUser;
  if (!user) { if(manual && window.showToast) window.showToast('تم الحفظ محلياً'); return; }
  try { await setDoc(doc(db, "users", user.uid), { email: user.email, profile: window.userProfile, state: window.appState, updatedAt: new Date().toISOString() }, { merge: true }); if(manual && window.showToast) window.showToast('تم الحفظ والمزامنة سحابياً'); } catch(e) {}
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
    const timerEl = document.getElementById('msgRemainingTime'); if (data.duration > 0 && timerEl) timerEl.innerText = `تختفي بعد ${Math.max(1, Math.ceil(data.duration - elapsedMin))} د`; else if(timerEl) timerEl.innerText = '';
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
        
        const hdrName = document.getElementById('headerUserName'); if(hdrName) hdrName.innerText = window.userProfile.name || user.email;
        const hdrAv = document.getElementById('headerAvatar'); if(hdrAv) hdrAv.innerText = (window.userProfile.name || 'ل')[0];
        const prfInp = document.getElementById('profileNameInput'); if(prfInp) prfInp.value = window.userProfile.name || '';
        const fGoal = document.getElementById('focusGoalInput'); if(fGoal) fGoal.value = window.appState.focusGoal || '';
        const jTxt = document.getElementById('journalText'); if(jTxt) jTxt.value = window.appState.journal || '';
        
        if(window.renderWorkspaceVisibility) window.renderWorkspaceVisibility(); 
        if(window.renderLists) window.renderLists();
      } else { 
        if(window.updateSubscriptionUI) window.updateSubscriptionUI(); 
        if(window.renderWorkspaceVisibility) window.renderWorkspaceVisibility(); 
        if(window.renderLists) window.renderLists(); 
      }
  }, 200);
});
