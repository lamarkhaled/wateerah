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
    { id: 'widget-vision', name: 'الأهداف', desc: 'لوحة الأهداف والمقاصد', icon: '🎯' },
    { id: 'widget-matrix', name: 'مصفوفة الأولويات', desc: 'تصنيف المهام بذكاء', icon: '📊' },
    { id: 'widget-kanban', name: 'المهام', desc: 'إدارة المهام المتنقلة', icon: '📋' },
    { id: 'widget-business', name: 'الأعمال', desc: 'إدارة المشاريع والحملات', icon: '💼' },
    { id: 'widget-care', name: 'الصحة والعناية', desc: 'روتين الصحة والبشرة', icon: '🌿' },
    { id: 'widget-finance', name: 'المالية', desc: 'إدارة المالية الشاملة', icon: '💰' },
    { id: 'widget-journal', name: 'التدوين', desc: 'مساحة حرة للكتابة', icon: '📝' },
    { id: 'widget-focus', name: 'التركيز', desc: 'تحديد الهدف الأهم', icon: '🧭' },
    { id: 'widget-habits', name: 'العادات', desc: 'متتبع العادات اليومية', icon: '✨' }
  ];

  if (!window.appState.activeWidgets || window.appState.activeWidgets.length === 0) {
    window.appState.activeWidgets = ['widget-vision', 'widget-matrix', 'widget-kanban', 'widget-business', 'widget-care', 'widget-finance', 'widget-journal', 'widget-focus', 'widget-habits'];
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
          <div class="app-icon" style="font-size: 24px; margin-bottom: 8px;">${info.icon}</div>
          <div class="app-icon-title">${info.name}</div>
        </div>
      `;
    }).join('');
  }
};

/* تحديث أزرار التنقل السفلية */
window.updateMobileTabs = function(activeId) {
  document.querySelectorAll('.ios-tab-bar .tab-btn').forEach(btn => {
    if(btn.getAttribute('data-tab') === activeId) {
        btn.classList.add('active');
    } else {
        btn.classList.remove('active');
    }
  });
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
      if (wId === 'widget-finance') { window.renderLists(); window.renderBanks(); window.renderAllocations(); window.renderSubscriptions(); }
      if (wId === 'widget-business' && window.renderBusinessWidget) { window.renderBusinessWidget(); window.renderBusinessDetailsView(); }
      if (wId === 'widget-vision' && window.renderVisionBoard) window.renderVisionBoard();
