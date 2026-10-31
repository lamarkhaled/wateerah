import { auth, db, ADMIN_EMAIL } from './firebase-config.js';
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

window.unverifiedUserObject = null;
window.activeVisionIndex = null;
window.draggedKanbanIndex = null;
window.isDataLoadedFromCloud = false; 

window.currentDateObj = new Date();
window.currentDateStr = window.currentDateObj.toISOString().slice(0, 10);

window.userProfile = { name: 'لمار', planType: 'الباقة المتقدمة', isPro: true, expiryDate: 'دائم', totalSubDays: 365, trialUsed: true };
window.appState = {
  hasStarted: true, 
  theme: 'default', 
  activeWidgets: ['widget-vision', 'widget-kanban', 'widget-business', 'widget-focus', 'widget-habits', 'widget-finance', 'widget-journal'], 
  widgetOrder: ['widget-vision', 'widget-kanban', 'widget-business', 'widget-focus', 'widget-habits', 'widget-finance', 'widget-journal'],
  dailyRecords: {}, notes: [], allocations: [], monthlyExpenses: [], incomeSources: [], incomeTarget: 5000,
  visionBoard: [], kanbanTasks: [], banks: [], wishlist: [], subscriptions: [], business: { projects: [], campaigns: [] }
};

let saveTimer; 
window.autoSave = () => { 
  clearTimeout(saveTimer); 
  saveTimer = setTimeout(() => window.saveCurrentWateerah(false), 800); 
};

window.saveCurrentWateerah = async (manual) => {
  if (!window.appState.dailyRecords) window.appState.dailyRecords = {};
  window.appState.dailyRecords[window.currentDateStr] = { focusGoal: document.getElementById('focusGoalInput')?.value || '', habits: window.appState.habits || [] };
  localStorage.setItem('wateerah_local_state', JSON.stringify(window.appState));
  
  const user = auth.currentUser;
  if (!user) return;
  try { 
    await setDoc(doc(db, "users", user.uid), { email: user.email, profile: window.userProfile, state: window.appState, updatedAt: new Date().toISOString() }, { merge: true }); 
  } catch(e) {}
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
};

window.saveProfile = async () => {
  const nameInput = document.getElementById('profileNameInput');
  window.userProfile.name = nameInput ? nameInput.value.trim() : 'لمار';
  const headerName = document.getElementById('headerUserName');
  const headerAvatar = document.getElementById('headerAvatar');
  if(headerName) headerName.innerText = window.userProfile.name; 
  if(headerAvatar) headerAvatar.innerText = window.userProfile.name[0];
  if(window.closeModal) window.closeModal('profileModal'); 
  window.saveCurrentWateerah(true);
};

const savedLocal = localStorage.getItem('wateerah_local_state');
if (savedLocal) { try { window.appState = { ...window.appState, ...JSON.parse(savedLocal) }; } catch(e) {} }

setTimeout(() => { 
  if(window.updateDayNightGreeting) window.updateDayNightGreeting(); 
  if(window.applyTheme) window.applyTheme(window.appState.theme || 'default'); 
  if(window.renderWorkspaceVisibility) window.renderWorkspaceVisibility(); 
  window.loadTodayDate();
}, 100);

onAuthStateChanged(auth, async (user) => {
  const authModal = document.getElementById('authModal');
  const lockBtn = document.getElementById('lockScreenBtn');
  const profilePill = document.getElementById('userProfilePill');
  const adminBtn = document.getElementById('adminPanelBtn');

  if (user) {
    if(authModal) authModal.style.display = 'none'; // إخفاء صفحة الدخول بالكامل
    if(lockBtn) lockBtn.style.display = 'inline-block';
    if(profilePill) profilePill.style.display = 'flex';

    if (user.email === ADMIN_EMAIL) { if(adminBtn) adminBtn.style.display = 'inline-flex'; } 
    else { if(adminBtn) adminBtn.style.display = 'none'; }

    const uidDisp = document.getElementById('profileUidDisplay'); 
    if(uidDisp) uidDisp.value = user.uid;

    try { 
      const snap = await getDoc(doc(db, "users", user.uid)); 
      if(snap.exists()) { 
        const d = snap.data(); 
        if(d.profile) window.userProfile = { ...window.userProfile, ...d.profile }; 
        if(d.state && Object.keys(d.state).length > 0) {
           window.appState = { ...window.appState, ...d.state };
           localStorage.setItem('wateerah_local_state', JSON.stringify(window.appState));
        }
      } 
    } catch(e) {}
    
    const headerName = document.getElementById('headerUserName');
    const headerAvatar = document.getElementById('headerAvatar');
    const profileNameInput = document.getElementById('profileNameInput');
    if(headerName) headerName.innerText = window.userProfile.name || user.email; 
    if(headerAvatar) headerAvatar.innerText = (window.userProfile.name || 'ل')[0]; 
    if(profileNameInput) profileNameInput.value = window.userProfile.name || '';
    
    window.loadTodayDate();
    if(window.updateDayNightGreeting) window.updateDayNightGreeting(); 
    if(window.applyTheme) window.applyTheme(window.appState.theme || 'default'); 
    if(window.renderWorkspaceVisibility) window.renderWorkspaceVisibility();
  } else {
    // إظهار صفحة الدخول بكامل الشاشة ومنع رؤية التطبيق
    if(authModal) authModal.style.display = 'flex';
    if(lockBtn) lockBtn.style.display = 'none';
    if(profilePill) profilePill.style.display = 'none';
    if(adminBtn) adminBtn.style.display = 'none';
  }
});
