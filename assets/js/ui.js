window.showToast = function(msg) {
  const c = document.getElementById('toastContainer');
  if(!c) return;
  const t = document.createElement('div'); t.className = 'toast'; t.innerText = msg;
  c.appendChild(t); 
  setTimeout(() => t.remove(), 7000); 
};

window.updateDayNightGreeting = function() {
  const hour = new Date().getHours(); 
  const isMorning = hour >= 4 && hour < 17; 
  const greetingWord = isMorning ? 'صباح الخير' : 'مساء الخير';
  
  if (!isMorning) document.body.classList.add('night-mode-glow'); 
  else document.body.classList.remove('night-mode-glow');
  
  const userName = window.userProfile?.name || 'مستخدم';
  const wTxt = document.getElementById('welcomeText'); 
  if(wTxt) wTxt.innerText = `${greetingWord}، أهلاً بك يا ${userName}.`;
};

window.applyTheme = function(name) {
  if(name === 'default') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', name);
  window.appState.theme = name; document.querySelectorAll('[data-theme-btn]').forEach(b => b.classList.toggle('active', b.getAttribute('data-theme-btn') === name));
};

window.setTheme = (name, btn) => { window.applyTheme(name); window.autoSave(); };
window.selectOnboardingTheme = (themeName, el) => { document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active')); el.classList.add('active'); window.applyTheme(themeName); };

window.startWorkspaceFirstTime = () => { 
  window.appState.hasStarted = true; 
  localStorage.setItem('wateerah_local_state', JSON.stringify(window.appState)); 
  window.renderWorkspaceVisibility(); 
  window.autoSave(); 
};

window.renderWorkspaceVisibility = function() {
  const onb = document.getElementById('onboardingScreen'); 
  const mainW = document.getElementById('mainWorkspace');
  
  if (!window.appState.hasStarted) { 
    if(onb) onb.classList.remove('hidden-el'); 
    if(mainW) mainW.classList.add('hidden-el'); 
  } else { 
    if(onb) onb.classList.add('hidden-el'); 
    if(mainW) mainW.classList.remove('hidden-el'); 
    const pageContainer = document.getElementById('pageContainer');
    if (!pageContainer || pageContainer.style.display !== 'block') {
        window.goHome(); 
    }
  }
};

window.renderActiveWidgets = function() {
  const AVAILABLE_APPS = [
    { id: 'widget-vision', name: 'الأهداف', desc: 'لوحة الأهداف والمقاصد' },
    { id: 'widget-kanban', name: 'المهام', desc: 'إدارة المهام المتنقلة' },
    { id: 'widget-business', name: 'الأعمال', desc: 'إدارة المشاريع والحملات' },
    { id: 'widget-finance', name: 'المالية', desc: 'إدارة المالية الشاملة' },
    { id: 'widget-journal', name: 'التدوين', desc: 'مساحة حرة للكتابة' },
    { id: 'widget-focus', name: 'التركيز', desc: 'تحديد الهدف الأهم' },
    { id: 'widget-habits', name: 'العادات', desc: 'متتبع العادات اليومية' },
    { id: 'widget-rhythm', name: 'إيقاع الإنجاز', desc: 'مؤقت عمل عميق وروتين يومي' }
  ];

  if (!window.appState.activeWidgets || window.appState.activeWidgets.length === 0) {
    window.appState.activeWidgets = ['widget-vision', 'widget-kanban', 'widget-business', 'widget-focus', 'widget-habits', 'widget-finance', 'widget-journal', 'widget-rhythm'];
  }

  const active = window.appState.activeWidgets;
  const launcher = document.getElementById('appLauncherGrid');
  const emptyState = document.getElementById('emptyWorkspaceState');

  if(emptyState) emptyState.classList.add('hidden-el');
  if(launcher) {
    launcher.style.display = 'grid';
    launcher.innerHTML = active.map(wId => {
      const info = AVAILABLE_APPS.find(w => w.id === wId);
      if(!info) return '';
      return `
        <div class="app-icon-card" onclick="window.openPage('${wId}')">
          <div class="app-icon-title">${info.name}</div>
        </div>
      `;
    }).join('');
  }
};

window.openPage = function(wId) {
  const launcher = document.getElementById('appLauncherGrid'); if (launcher) launcher.style.display = 'none';
  const emptyState = document.getElementById('emptyWorkspaceState'); if (emptyState) emptyState.classList.add('hidden-el');
  const pageContainer = document.getElementById('pageContainer'); if (pageContainer) pageContainer.style.display = 'block';

  document.querySelectorAll('.widget-card').forEach(card => { 
    card.classList.add('hidden-el'); 
    card.style.display = 'none'; 
  });
  
  const target = document.getElementById(wId);
  if(target) { 
    target.classList.remove('hidden-el'); 
    target.style.display = 'block'; 
  }

  try {
      if (wId === 'widget-finance' && window.renderLists) window.renderLists();
      if (wId === 'widget-business' && window.renderBusinessWidget) { window.renderBusinessWidget(); window.renderBusinessDetailsView(); }
      if (wId === 'widget-vision' && window.renderVisionBoard) window.renderVisionBoard();
      if (wId === 'widget-kanban' && window.renderKanbanBoard) window.renderKanbanBoard();
      if (wId === 'widget-habits' && window.renderLists) window.renderLists();
      if (wId === 'widget-rhythm' && window.renderRoutines) window.renderRoutines();
  } catch(e) {}

  const homeBtn = document.getElementById('homeBtnContainer');
  const toolsBtn = document.getElementById('toolbarToolsContainer');
  if (homeBtn) homeBtn.style.display = 'flex';
  if (toolsBtn) toolsBtn.style.display = 'none';
};

window.goHome = function() {
  const pageContainer = document.getElementById('pageContainer'); if (pageContainer) pageContainer.style.display = 'none';
  document.querySelectorAll('.widget-card').forEach(card => { card.classList.add('hidden-el'); card.style.display = 'none'; });
  window.renderActiveWidgets();
  
  const homeBtn = document.getElementById('homeBtnContainer');
  const toolsBtn = document.getElementById('toolbarToolsContainer');
  if (homeBtn) homeBtn.style.display = 'none';
  if (toolsBtn) toolsBtn.style.display = 'flex';
};

window.renderWidgetLibraryModal = function() {
  const AVAILABLE_APPS = [
    { id: 'widget-vision', name: 'الأهداف', desc: 'لوحة الأهداف والمقاصد' },
    { id: 'widget-kanban', name: 'المهام', desc: 'إدارة المهام المتنقلة' },
    { id: 'widget-business', name: 'الأعمال', desc: 'إدارة المشاريع والحملات' },
    { id: 'widget-finance', name: 'المالية', desc: 'إدارة المالية الشاملة' },
    { id: 'widget-journal', name: 'التدوين', desc: 'مساحة حرة للكتابة' },
    { id: 'widget-focus', name: 'التركيز', desc: 'تحديد الهدف الأهم' },
    { id: 'widget-habits', name: 'العادات', desc: 'متتبع العادات اليومية' },
    { id: 'widget-rhythm', name: 'إيقاع الإنجاز', desc: 'مؤقت عمل عميق وروتين يومي' }
  ];
  const active = window.appState.activeWidgets || [];
  const libraryList = document.getElementById('widgetLibraryList');
  if (libraryList) {
    libraryList.innerHTML = AVAILABLE_APPS.map(w => {
      const isAdded = active.includes(w.id);
      return `
        <div class="list-item" style="padding: 12px 16px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div>
              <div style="font-weight: 600; font-size: 0.95rem;">${w.name}</div>
              <div style="font-size: 0.78rem; color: var(--text-secondary);">${w.desc}</div>
            </div>
          </div>
          ${isAdded ? `<button class="btn btn-danger" onclick="window.removeWidget('${w.id}')">إزالة</button>` : `<button class="btn btn-primary" onclick="window.addWidgetToWorkspace('${w.id}')">تنزيل</button>`}
        </div>
      `;
    }).join('');
  }
};

window.addWidgetToWorkspace = (wId) => { 
  if (!window.appState.activeWidgets) window.appState.activeWidgets = []; 
  if (!window.appState.activeWidgets.includes(wId)) window.appState.activeWidgets.push(wId); 
  window.renderActiveWidgets(); window.renderWidgetLibraryModal(); window.autoSave(); 
};

window.removeWidget = (wId) => { 
  window.appState.activeWidgets = (window.appState.activeWidgets || []).filter(id => id !== wId); 
  window.renderActiveWidgets(); window.renderWidgetLibraryModal(); window.autoSave(); 
};

window.openModal = async function(id) {
  if (id === 'addWidgetModal' && window.renderWidgetLibraryModal) window.renderWidgetLibraryModal();
  if (id === 'pricingModal' && window.setupPricingModal) window.setupPricingModal();
  
  const modal = document.getElementById(id); 
  if (modal) {
      modal.classList.add('open');
      if (id === 'authModal') modal.style.display = 'flex';
  }
};

window.closeModal = function(id) {
  const modal = document.getElementById(id); 
  if (modal) {
      modal.classList.remove('open');
      if (id === 'authModal') modal.style.display = 'none';
  }
};

// إيقاع الإنجاز (Timer & Routine)
window.timerInterval = null;
window.timerTime = 25 * 60;
window.timerMode = 'work';

window.formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

window.updateTimerDisplay = () => {
    const d = document.getElementById('timerDisplay');
    if(d) d.innerText = window.formatTimer(window.timerTime);
};

window.setTimerMode = (mode) => {
    window.pauseTimer();
    window.timerMode = mode;
    window.timerTime = mode === 'work' ? 25 * 60 : 5 * 60;
    document.getElementById('mode-work')?.classList.toggle('active', mode === 'work');
    document.getElementById('mode-break')?.classList.toggle('active', mode === 'break');
    window.updateTimerDisplay();
};

window.startTimer = () => {
    if(window.timerInterval) return;
    window.timerInterval = setInterval(() => {
        if(window.timerTime > 0) {
            window.timerTime--;
            window.updateTimerDisplay();
        } else {
            window.pauseTimer();
            window.showToast('انتهى الوقت المحدد!');
        }
    }, 1000);
};

window.pauseTimer = () => {
    clearInterval(window.timerInterval);
    window.timerInterval = null;
};

window.resetTimer = () => {
    window.setTimerMode(window.timerMode);
};

window.renderRoutines = () => {
    const state = window.appState.dailyRecords[window.currentDateStr] || {};
    const mList = state.morningRoutine || [];
    const eList = state.eveningRoutine || [];

    const renderList = (list, type) => list.map((item, idx) => `
        <li class="list-item ${item.done ? 'completed' : ''}" style="padding: 8px 12px; margin-bottom: 8px;">
            <div class="item-left">
                <div class="checkbox" onclick="window.toggleRoutine('${type}', ${idx})">${item.done ? '✓' : ''}</div>
                <span style="font-size: 0.85rem;">${item.text}</span>
            </div>
            <button class="delete-btn" onclick="window.deleteRoutine('${type}', ${idx})">&times;</button>
        </li>
    `).join('');

    document.getElementById('morningRoutineList').innerHTML = renderList(mList, 'morning') || '<div style="font-size:0.8rem; color:var(--text-secondary); text-align:center;">القائمة فارغة</div>';
    document.getElementById('eveningRoutineList').innerHTML = renderList(eList, 'evening') || '<div style="font-size:0.8rem; color:var(--text-secondary); text-align:center;">القائمة فارغة</div>';
};

window.addRoutine = (type) => {
    const input = document.getElementById(type === 'morning' ? 'newMorningTask' : 'newEveningTask');
    const val = input.value.trim();
    if(!val) return;
    const state = window.appState.dailyRecords[window.currentDateStr];
    if(type === 'morning') {
        if(!state.morningRoutine) state.morningRoutine = [];
        state.morningRoutine.push({text: val, done: false});
    } else {
        if(!state.eveningRoutine) state.eveningRoutine = [];
        state.eveningRoutine.push({text: val, done: false});
    }
    input.value = '';
    window.renderRoutines();
    window.autoSave();
};

window.toggleRoutine = (type, idx) => {
    const state = window.appState.dailyRecords[window.currentDateStr];
    const list = type === 'morning' ? state.morningRoutine : state.eveningRoutine;
    list[idx].done = !list[idx].done;
    window.renderRoutines();
    window.autoSave();
};

window.deleteRoutine = (type, idx) => {
    const state = window.appState.dailyRecords[window.currentDateStr];
    const list = type === 'morning' ? state.morningRoutine : state.eveningRoutine;
    list.splice(idx, 1);
    window.renderRoutines();
    window.autoSave();
};
