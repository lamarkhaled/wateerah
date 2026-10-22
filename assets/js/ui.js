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
  
  const userName = window.userProfile?.name || 'صديقنا';
  const wTxt = document.getElementById('welcomeText'); 
  if(wTxt) wTxt.innerText = `${greetingWord}، أهلاً بك يا ${userName}.`;
  
  const oTxt = document.getElementById('onboardingGreeting'); 
  if(oTxt) oTxt.innerText = `${greetingWord}، أهلاً بك في وتيرة`;
  
  const pTxt = document.getElementById('onboardingTimePill'); 
  if(pTxt) pTxt.innerText = isMorning ? 'الفترة الصباحية' : 'الفترة المسائية';
  
  const dTxt = document.getElementById('dayNightSubtext'); 
  if(dTxt) dTxt.innerText = isMorning ? 'بداية يوم مشرقة، رتّب أولوياتك بهدوء.' : 'أمسية هادئة، راجع إنجازاتك وخطط للغد.';
};

window.applyTheme = function(name) {
  if(name === 'default') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', name);
  window.appState.theme = name; document.querySelectorAll('[data-theme-btn]').forEach(b => b.classList.toggle('active', b.getAttribute('data-theme-btn') === name));
};

window.setTheme = (name, btn) => { 
  if (name === 'dark' && !window.userProfile?.isPro) {
    window.showToast('مظهر "سكون ليلي" حصري للمشتركين في الباقة المتقدمة 🌟');
    window.openModal('pricingModal');
    return;
  }
  window.applyTheme(name); window.autoSave(); 
};

window.selectOnboardingTheme = (themeName, el) => { document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active')); el.classList.add('active'); window.applyTheme(themeName); };

window.startWorkspaceFirstTime = () => { window.appState.hasStarted = true; localStorage.setItem('wateerah_local_state', JSON.stringify(window.appState)); window.renderWorkspaceVisibility(); window.autoSave(); };

window.renderWorkspaceVisibility = function() {
  const onb = document.getElementById('onboardingScreen'); const mainW = document.getElementById('mainWorkspace');
  if (!window.appState.hasStarted) { onb.classList.remove('hidden-el'); mainW.classList.add('hidden-el'); }
  else { onb.classList.add('hidden-el'); mainW.classList.remove('hidden-el'); window.goHome(); }
};

// ================= نظام التطبيقات والشاشة الرئيسية =================
window.renderActiveWidgets = function() {
  const AVAILABLE_APPS = [
    { id: 'widget-vision', name: 'الأهداف', icon: '🎯', desc: 'لوحة الأهداف والمقاصد' },
    { id: 'widget-kanban', name: 'المهام', icon: '📋', desc: 'إدارة المهام المتنقلة' },
    { id: 'widget-finance', name: 'المالية', icon: '💰', desc: 'إدارة المالية (حصري)' },
    { id: 'widget-journal', name: 'التدوين', icon: '📝', desc: 'مساحة حرة للكتابة' },
    { id: 'widget-focus', name: 'التركيز', icon: '🧭', desc: 'تحديد الهدف الأهم' },
    { id: 'widget-habits', name: 'العادات', icon: '✨', desc: 'متتبع العادات اليومية' }
  ];

  const active = window.appState.activeWidgets || [];
  const launcher = document.getElementById('appLauncherGrid');
  const emptyState = document.getElementById('emptyWorkspaceState');

  if (active.length === 0) {
    emptyState.classList.remove('hidden-el');
    launcher.style.display = 'none';
  } else {
    emptyState.classList.add('hidden-el');
    launcher.style.display = 'grid';
  }

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

  // إخفاء جميع صفحات التطبيقات
  document.querySelectorAll('.widget-card').forEach(card => card.style.display = 'none');
  document.getElementById('pageContainer').style.display = 'none';
};

window.openPage = function(wId) {
  if (wId === 'widget-finance' && !window.userProfile?.isPro) {
    window.showToast('تطبيق "المالية" حصري للمشتركين 🌟');
    window.openModal('pricingModal');
    return;
  }
  document.getElementById('appLauncherGrid').style.display = 'none';
  document.getElementById('emptyWorkspaceState').classList.add('hidden-el');
  document.getElementById('pageContainer').style.display = 'block';

  document.querySelectorAll('.widget-card').forEach(card => card.style.display = 'none');
  const target = document.getElementById(wId);
  if(target) target.style.display = 'block';

  document.getElementById('homeBtnContainer').style.display = 'flex';
  document.getElementById('toolbarToolsContainer').style.display = 'none';
};

window.goHome = function() {
  window.renderActiveWidgets();
  document.getElementById('homeBtnContainer').style.display = 'none';
  document.getElementById('toolbarToolsContainer').style.display = 'flex';
};

window.renderWidgetLibraryModal = function() {
  const AVAILABLE_APPS = [
    { id: 'widget-vision', name: 'الأهداف', icon: '🎯', desc: 'لوحة الأهداف والمقاصد' },
    { id: 'widget-kanban', name: 'المهام', icon: '📋', desc: 'إدارة المهام المتنقلة' },
    { id: 'widget-finance', name: 'المالية', icon: '💰', desc: 'إدارة المالية (حصري للمشتركين)' },
    { id: 'widget-journal', name: 'التدوين', icon: '📝', desc: 'مساحة حرة للكتابة والصور' },
    { id: 'widget-focus', name: 'التركيز', icon: '🧭', desc: 'تحديد الهدف الأهم لليوم' },
    { id: 'widget-habits', name: 'العادات', icon: '✨', desc: 'متتبع العادات اليومية' }
  ];
  const active = window.appState.activeWidgets || [];
  document.getElementById('widgetLibraryList').innerHTML = AVAILABLE_APPS.map(w => {
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
};

window.addWidgetToWorkspace = (wId) => { 
  if (wId === 'widget-finance' && !window.userProfile?.isPro) {
    window.showToast('تطبيق "المالية" حصري للمشتركين 🌟');
    window.openModal('pricingModal');
    return;
  }
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
  if (id === 'pricingModal' && window.setupPricingModal) window.setupPricingModal();
  if (id === 'adminModal' && window.loadAdminUsers) { await window.loadAdminUsers(); await window.loadAdminCodes(); }
  document.getElementById(id).classList.add('open');
};
window.closeModal = id => document.getElementById(id).classList.remove('open');
window.openAuthModal = () => { window.switchToLogin(); window.openModal('authModal'); };
window.switchToLogin = () => { document.getElementById('viewLogin').style.display = 'block'; document.getElementById('viewRegister').style.display = 'none'; };
window.switchToRegister = () => { document.getElementById('viewLogin').style.display = 'none'; document.getElementById('viewRegister').style.display = 'block'; };
window.openResetModal = () => { window.closeModal('authModal'); window.openModal('resetModal'); };

window.dismissGlassMessage = () => { 
  document.getElementById('activeGlassMessage').style.display = 'none'; 
  document.getElementById('emptyGlassMessage').style.display = 'flex'; 
};
