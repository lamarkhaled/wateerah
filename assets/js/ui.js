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
    if(emptyState) emptyState.classList.remove('hidden-el');
    if(launcher) launcher.style.display = 'none';
  } else {
    if(emptyState) emptyState.classList.add('hidden-el');
    if(launcher) launcher.style.display = 'grid';
  }

  if(launcher) {
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
  if (wId === 'widget-finance' && !window.userProfile?.isPro) {
    window.showToast('تطبيق "المالية" حصري للمشتركين 🌟');
    window.openModal('pricingModal');
    return;
  }
  
  // إخفاء الشاشة الرئيسية
  const launcher = document.getElementById('appLauncherGrid');
  if (launcher) launcher.style.display = 'none';
  
  const emptyState = document.getElementById('emptyWorkspaceState');
  if (emptyState) emptyState.classList.add('hidden-el');
  
  const pageContainer = document.getElementById('pageContainer');
  if (pageContainer) pageContainer.style.display = 'block';

  // التأكد من إخفاء الكلاس الإجباري عن جميع البطاقات
  document.querySelectorAll('.widget-card').forEach(card => {
    card.classList.add('hidden-el');
    card.style.display = 'none';
  });
  
  // إظهار الصفحة المستهدفة فقط وإزالة الإخفاء عنها
  const target = document.getElementById(wId);
  if(target) {
    target.classList.remove('hidden-el');
    target.style.display = 'block';
  }

  // تبديل أزرار الشريط العلوي
  const homeBtn = document.getElementById('homeBtnContainer');
  const toolsBtn = document.getElementById('toolbarToolsContainer');
  if (homeBtn) homeBtn.style.display = 'flex';
  if (toolsBtn) toolsBtn.style.display = 'none';
};

window.goHome = function() {
  const pageContainer = document.getElementById('pageContainer');
  if (pageContainer) pageContainer.style.display = 'none';
  
  // إعادة إخفاء جميع الصفحات
  document.querySelectorAll('.widget-card').forEach(card => {
    card.classList.add('hidden-el');
    card.style.display = 'none';
  });

  // إعادة بناء وعرض الشاشة الرئيسية
  window.renderActiveWidgets();
  
  // تبديل أزرار الشريط العلوي
  const homeBtn = document.getElementById('homeBtnContainer');
  const toolsBtn = document.getElementById('toolbarToolsContainer');
  if (homeBtn) homeBtn.style.display = 'none';
  if (toolsBtn) toolsBtn.style.display = 'flex';
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
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('open');
};

window.closeModal = id => {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('open');
};

window.openAuthModal = () => { window.switchToLogin(); window.openModal('authModal'); };
window.switchToLogin = () => { 
  const vLogin = document.getElementById('viewLogin');
  const vReg = document.getElementById('viewRegister');
  if(vLogin) vLogin.style.display = 'block'; 
  if(vReg) vReg.style.display = 'none'; 
};
window.switchToRegister = () => { 
  const vLogin = document.getElementById('viewLogin');
  const vReg = document.getElementById('viewRegister');
  if(vLogin) vLogin.style.display = 'none'; 
  if(vReg) vReg.style.display = 'block'; 
};
window.openResetModal = () => { window.closeModal('authModal'); window.openModal('resetModal'); };

window.dismissGlassMessage = () => { 
  const aMsg = document.getElementById('activeGlassMessage');
  const eMsg = document.getElementById('emptyGlassMessage');
  if(aMsg) aMsg.style.display = 'none'; 
  if(eMsg) eMsg.style.display = 'flex'; 
};
