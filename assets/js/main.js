import { auth, db, ADMIN_EMAIL } from './firebase-config.js';
import { doc, setDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

window.unverifiedUserObject = null;
window.activeVisionIndex = null;
window.draggedKanbanIndex = null;

window.currentDateObj = new Date();
window.currentDateStr = window.currentDateObj.toISOString().slice(0, 10);

window.userProfile = { name: 'لمار', planType: 'الباقة الأساسية', isPro: false, expiryDate: '', totalSubDays: 30, trialUsed: false };
window.appState = {
  hasStarted: false, theme: 'default', activeWidgets: [], widgetOrder: ['widget-vision', 'widget-kanban', 'widget-focus', 'widget-habits', 'widget-finance', 'widget-journal'],
  dailyRecords: {}, 
  notes: [],
  visionBoard: [], kanbanTasks: [], banks: [], wishlist: [], subscriptions: []
};

let saveTimer; window.autoSave = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => window.saveCurrentWateerah(false), 700); };

window.saveCurrentWateerah = async (manual) => {
  if (!window.appState.dailyRecords) window.appState.dailyRecords = {};
  window.appState.dailyRecords[window.currentDateStr] = {
    focusGoal: document.getElementById('focusGoalInput')?.value || '',
    habits: window.appState.habits || []
  };

  localStorage.setItem('wateerah_local_state', JSON.stringify(window.appState));
  const user = auth.currentUser;
  if (!user) { if(manual && window.showToast) window.showToast('تم الحفظ محلياً'); return; }
  try { await setDoc(doc(db, "users", user.uid), { email: user.email, profile: window.userProfile, state: window.appState, updatedAt: new Date().toISOString() }, { merge: true }); if(manual && window.showToast) window.showToast('تم الحفظ والمزامنة سحابياً'); } catch(e) {}
};

window.loadTodayDate = function() {
  window.currentDateObj = new Date();
  window.currentDateStr = window.currentDateObj.toISOString().slice(0, 10);
  
  const liveDate = document.getElementById('liveDateText');
  if (liveDate) liveDate.innerText = window.currentDateObj.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });

  const daily = window.appState.dailyRecords[window.currentDateStr] || { focusGoal: '', habits: [] };
  window.appState.habits = daily.habits || [];
  
  const focusInput = document.getElementById('focusGoalInput');
  if(focusInput) focusInput.value = daily.focusGoal || '';
  
  if(window.renderLists) window.renderLists();
  if(window.renderNotesList) window.renderNotesList();
  window.saveCurrentWateerah(false);
};

window.openHistoryModal = function(type) {
  const container = document.getElementById('historyModalContent');
  const title = document.getElementById('historyModalTitle');
  container.innerHTML = '';
  
  window.saveCurrentWateerah(false);
  
  const records = window.appState.dailyRecords || {};
  const dates = Object.keys(records).sort((a, b) => new Date(b) - new Date(a));
  
  let hasContent = false;

  dates.forEach(date => {
    const data = records[date];
    let contentHTML = '';
    
    const dateObj = new Date(date);
    const displayDate = dateObj.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });

    if (type === 'focus' && data.focusGoal && data.focusGoal.trim() !== '') {
      title.innerText = 'سجل التركيز';
      contentHTML = `<div style="background:var(--bg-glass-strong); padding:14px; border-radius:12px; border:1px solid var(--border-color);"><div style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:6px;">${displayDate}</div><div style="font-weight:600; color:var(--accent-color);">${data.focusGoal}</div></div>`;
      hasContent = true;
    } 
    else if (type === 'habits' && data.habits && data.habits.length > 0) {
      title.innerText = 'سجل العادات';
      const habitsList = data.habits.map(h => `<li style="display:flex; align-items:center; gap:8px; margin-bottom:6px;"><span style="color:${h.done ? 'var(--accent-color)' : 'var(--text-secondary)'}; font-weight:bold;">${h.done ? '✓' : '—'}</span><span style="${h.done ? 'text-decoration:line-through; opacity:0.6;' : ''}">${h.text}</span></li>`).join('');
      contentHTML = `<div style="background:var(--bg-glass-strong); padding:14px; border-radius:12px; border:1px solid var(--border-color);"><div style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:10px;">${displayDate}</div><ul style="list-style:none; padding:0; margin:0; font-size:0.9rem;">${habitsList}</ul></div>`;
      hasContent = true;
    }
    
    if (contentHTML) container.innerHTML += contentHTML;
  });
  
  if (!hasContent) {
    container.innerHTML = '<div style="text-align:center; padding:40px 20px; color:var(--text-secondary); font-size:0.9rem;">لا توجد سجلات سابقة محفوظة بعد.</div>';
  }
  
  window.openModal('historyModal');
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
  
  window.loadTodayDate();
  
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
        
        window.loadTodayDate();
        if(window.renderWorkspaceVisibility) window.renderWorkspaceVisibility(); 
      } else { 
        if(window.updateSubscriptionUI) window.updateSubscriptionUI(); 
        if(window.renderWorkspaceVisibility) window.renderWorkspaceVisibility(); 
        window.loadTodayDate();
      }
  }, 200);
});
