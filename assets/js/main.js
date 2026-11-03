import { auth, db } from './firebase-config.js';
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const ADMIN_EMAIL = "wateerahapp@gmail.com";

window.unverifiedUserObject = null;
window.activeVisionIndex = null;
window.draggedKanbanIndex = null;

window.currentDateObj = new Date();
window.currentDateStr = window.currentDateObj.toISOString().slice(0, 10);

window.userProfile = { name: 'مستخدم', planType: 'الباقة الأساسية', isPro: false, expiryDate: '', totalSubDays: 0, trialUsed: false };
window.appState = {
  hasStarted: true, theme: 'default', 
  activeWidgets: ['widget-vision', 'widget-matrix', 'widget-kanban', 'widget-business', 'widget-care', 'widget-finance', 'widget-journal', 'widget-focus', 'widget-habits'], 
  widgetOrder: ['widget-vision', 'widget-matrix', 'widget-kanban', 'widget-business', 'widget-care', 'widget-finance', 'widget-journal', 'widget-focus', 'widget-habits'],
  dailyRecords: {}, notes: [], allocations: [
      { label: 'الاحتياجات', percent: 50 },
      { label: 'الرغبات', percent: 30 },
      { label: 'الادخار', percent: 20 }
  ], monthlyExpenses: [], incomeSources: [], incomeTarget: 5000,
  visionBoard: [], kanbanTasks: [], banks: [], wishlist: [], subscriptions: [], business: { projects: [], campaigns: [] },
  matrixTasks: []
};

let saveTimer; 
window.autoSave = () => { 
  clearTimeout(saveTimer); 
  saveTimer = setTimeout(() => window.saveCurrentWateerah(false), 800); 
};

window.saveCurrentWateerah = async (manual) => {
  if (!window.appState.dailyRecords) window.appState.dailyRecords = {};
  const todayRec = window.appState.dailyRecords[window.currentDateStr] || {};
  window.appState.dailyRecords[window.currentDateStr] = { 
      focusGoal: document.getElementById('focusGoalInput')?.value || '', 
      habits: window.appState.habits || [],
      healthRoutine: todayRec.healthRoutine || [],
      skinRoutine: todayRec.skinRoutine || []
  };
  localStorage.setItem('wateerah_local_state', JSON.stringify(window.appState));
  
  const user = auth.currentUser;
  if (!user || user.email === ADMIN_EMAIL) return;
  try { await setDoc(doc(db, "users", user.uid), { email: user.email, profile: window.userProfile, state: window.appState, updatedAt: new Date().toISOString() }, { merge: true }); } catch(e) {}
};

window.loadTodayDate = function() {
  window.currentDateObj = new Date();
  window.currentDateStr = window.currentDateObj.toISOString().slice(0, 10);
  const liveDate = document.getElementById('liveDateText');
  if (liveDate) liveDate.innerText = window.currentDateObj.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
  
  const daily = window.appState.dailyRecords[window.currentDateStr] || { focusGoal: '', habits: [], healthRoutine: [], skinRoutine: [] };
  if (!daily.healthRoutine) daily.healthRoutine = [];
  if (!daily.skinRoutine) daily.skinRoutine = [];
  window.appState.dailyRecords[window.currentDateStr] = daily;
  
  window.appState.habits = daily.habits || [];
  const focusInput = document.getElementById('focusGoalInput');
  if(focusInput) focusInput.value = daily.focusGoal || '';
  
  if(window.renderLists) window.renderLists();
  if(window.renderNotesList) window.renderNotesList();
  if(window.renderCareRoutines) window.renderCareRoutines();
  if(window.renderMatrix) window.renderMatrix();
  if(window.renderBanks) window.renderBanks();
  if(window.renderSubscriptions) window.renderSubscriptions();
  if(window.renderAllocations) window.renderAllocations();
};

window.saveProfile = async () => {
  const nameInput = document.getElementById('profileNameInput');
  window.userProfile.name = nameInput ? nameInput.value.trim() : 'مستخدم';
  const headerName = document.getElementById('headerUserName');
  const headerAvatar = document.getElementById('headerAvatar');
  if(headerName) headerName.innerText = window.userProfile.name; 
  if(headerAvatar) headerAvatar.innerText = window.userProfile.name[0];
  if(window.closeModal) window.closeModal('profileModal'); 
  window.saveCurrentWateerah(true);
};

const savedLocal = localStorage.getItem('wateerah_local_state');
if (savedLocal) { try { window.appState = { ...window.appState, ...JSON.parse(savedLocal) }; } catch(e) {} }

onAuthStateChanged(auth, async (user) => {
  const authModal = document.getElementById('authModal');
  const lockBtn = document.getElementById('lockScreenBtn');
  const profilePill = document.getElementById('userProfilePill');
  const planBadge = document.getElementById('planBadge');
  const upgradeBtn = document.getElementById('upgradeBtn');
  
  const mainWorkspace = document.getElementById('mainWorkspace');
  const adminWorkspace = document.getElementById('adminWorkspace');
  const onboardingScreen = document.getElementById('onboardingScreen');

  if (user) {
    if(authModal) authModal.style.display = 'none'; 
    if(lockBtn) lockBtn.style.display = 'inline-block';
    
    if (user.email === ADMIN_EMAIL) {
        if(mainWorkspace) { mainWorkspace.classList.add('hidden-el'); mainWorkspace.style.display = 'none'; }
        if(onboardingScreen) { onboardingScreen.classList.add('hidden-el'); onboardingScreen.style.display = 'none'; }
        if(adminWorkspace) { adminWorkspace.classList.remove('hidden-el'); adminWorkspace.style.display = 'block'; }
        
        if(profilePill) profilePill.style.display = 'none';
        if(planBadge) planBadge.style.display = 'none';
        if(upgradeBtn) upgradeBtn.style.display = 'none';
        
        setTimeout(() => { if(window.loadActiveCodesPage) window.loadActiveCodesPage(); }, 500);
        return; 
    }

    if(adminWorkspace) { adminWorkspace.classList.add('hidden-el'); adminWorkspace.style.display = 'none'; }
    if(profilePill) profilePill.style.display = 'flex';
    if(planBadge) planBadge.style.display = 'inline-block';
    if(upgradeBtn) upgradeBtn.style.display = 'inline-block';

    try { 
      const snap = await getDoc(doc(db, "users", user.uid)); 
      if(snap.exists()) { 
        const d = snap.data(); 
        if(d.profile) window.userProfile = { ...window.userProfile, ...d.profile }; 
        if(d.state && Object.keys(d.state).length > 0) window.appState = { ...window.appState, ...d.state };
      } 
    } catch(e) {}
    
    if (window.updateSubscriptionUI) window.updateSubscriptionUI();
    const headerName = document.getElementById('headerUserName');
    const headerAvatar = document.getElementById('headerAvatar');
    const profileNameInput = document.getElementById('profileNameInput');
    
    if(headerName) headerName.innerText = window.userProfile.name || user.email; 
    if(headerAvatar) headerAvatar.innerText = (window.userProfile.name || 'م')[0]; 
    if(profileNameInput) profileNameInput.value = window.userProfile.name || '';
    
    window.loadTodayDate();
    if(window.updateDayNightGreeting) window.updateDayNightGreeting(); 
    if(window.applyTheme) window.applyTheme(window.appState.theme || 'default'); 
    if(window.renderWorkspaceVisibility) window.renderWorkspaceVisibility();
  } else {
    if (authModal) authModal.style.display = 'flex';
    if(lockBtn) lockBtn.style.display = 'none';
    if(profilePill) profilePill.style.display = 'none';
    if(adminWorkspace) adminWorkspace.style.display = 'none';
  }
});
