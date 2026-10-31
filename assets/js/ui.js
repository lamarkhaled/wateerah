window.showToast = function(msg) {
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div'); t.className = 'toast'; t.innerText = msg;
  c.appendChild(t); setTimeout(() => t.remove(), 3200);
};

window.updateDayNightGreeting = function() {
  const hour = new Date().getHours(); 
  const isMorning = hour >= 4 && hour < 17; 
  const greetingWord = isMorning ? 'صباح الخير ☀️' : 'مساء الخير 🌙';
  
  if (!isMorning) document.body.classList.add('night-mode-glow'); 
  else document.body.classList.remove('night-mode-glow');
  
  const userName = window.userProfile?.name || 'لمار';
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
    { id: 'widget-vision', name: 'الأهداف', icon: '🎯', desc: 'لوحة الأهداف والمقاصد' },
    { id: 'widget-kanban', name: 'المهام', icon: '📋', desc: 'إدارة المهام المتنقلة' },
    { id: 'widget-business', name: 'الأعمال', icon: '💼', desc: 'إدارة المشاريع والحملات' },
    { id: 'widget-finance', name: 'المالية', icon: '💰', desc: 'إدارة المالية الشاملة' },
    { id: 'widget-journal', name: 'التدوين', icon: '📝', desc: 'مساحة حرة للكتابة' },
    { id: 'widget-focus', name: 'التركيز', icon: '🧭', desc: 'تحديد الهدف الأهم' },
    { id: 'widget-habits', name: 'العادات', icon: '✨', desc: 'متتبع العادات اليومية' }
  ];

  if (!window.appState.activeWidgets || window.appState.activeWidgets.length === 0) {
    window.appState.activeWidgets = ['widget-vision', 'widget-kanban', 'widget-business', 'widget-focus', 'widget-habits', 'widget-finance', 'widget-journal'];
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
          <div class="app-icon">${info.icon}</div>
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

  document.querySelectorAll('.widget-card').forEach(card => { card.classList.add('hidden-el'); card.style.display = 'none'; });
  const target = document.getElementById(wId);
  if(target) { target.classList.remove('hidden-el'); target.style.display = 'block'; }

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
    { id: 'widget-vision', name: 'الأهداف', icon: '🎯', desc: 'لوحة الأهداف والمقاصد' },
    { id: 'widget-kanban', name: 'المهام', icon: '📋', desc: 'إدارة المهام المتنقلة' },
    { id: 'widget-business', name: 'الأعمال', icon: '💼', desc: 'إدارة المشاريع والحملات' },
    { id: 'widget-finance', name: 'المالية', icon: '💰', desc: 'إدارة المالية الشاملة' },
    { id: 'widget-journal', name: 'التدوين', icon: '📝', desc: 'مساحة حرة للكتابة' },
    { id: 'widget-focus', name: 'التركيز', icon: '🧭', desc: 'تحديد الهدف الأهم لليوم' },
    { id: 'widget-habits', name: 'العادات', icon: '✨', desc: 'متتبع العادات اليومية' }
  ];
  const active = window.appState.activeWidgets || [];
  const libraryList = document.getElementById('widgetLibraryList');
  if (libraryList) {
    libraryList.innerHTML = AVAILABLE_APPS.map(w => {
      const isAdded = active.includes(w.id);
      return `
        <div class="list-item" style="padding: 12px 16px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="font-size:1.8rem;">${w.icon}</span>
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

window.openModal = async id => {
  if (id === 'addWidgetModal') window.renderWidgetLibraryModal();
  const modal = document.getElementById(id); if (modal) modal.classList.add('open');
};

window.closeModal = id => {
  const modal = document.getElementById(id); if (modal) modal.classList.remove('open');
};

window.openAuthModal = () => { window.openModal('authModal'); };
