window.showToast = function(msg) {
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div'); t.className = 'toast'; t.innerText = msg;
  c.appendChild(t); setTimeout(() => t.remove(), 3200);
};

window.updateDayNightGreeting = function() {
  const hour = new Date().getHours(); const isMorning = hour >= 4 && hour < 17; const greetingWord = isMorning ? 'صباح الخير' : 'مساء الخير';
  if (!isMorning) document.body.classList.add('night-mode-glow'); else document.body.classList.remove('night-mode-glow');
  const userName = window.userProfile?.name || 'صديقنا';
  const wTxt = document.getElementById('welcomeText'); if(wTxt) wTxt.innerText = `${greetingWord}، أهلاً بك يا ${userName}.`;
  const oTxt = document.getElementById('onboardingGreeting'); if(oTxt) oTxt.innerText = `${greetingWord}، أهلاً بك في وتيرة`;
  const pTxt = document.getElementById('onboardingTimePill'); if(pTxt) pTxt.innerText = isMorning ? 'الفترة الصباحية' : 'الفترة المسائية';
  const dTxt = document.getElementById('dayNightSubtext'); if(dTxt) dTxt.innerText = isMorning ? 'بداية يوم مشرقة، رتّب أولوياتك بهدوء.' : 'أمسية هادئة، راجع إنجازاتك وخطط للغد.';
};

window.applyTheme = function(name) {
  if(name === 'default') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', name);
  window.appState.theme = name; document.querySelectorAll('[data-theme-btn]').forEach(b => b.classList.toggle('active', b.getAttribute('data-theme-btn') === name));
};

window.setTheme = (name, btn) => { 
  // قفل مظهر سكون ليلي لغير المشتركين
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
  else { onb.classList.add('hidden-el'); mainW.classList.remove('hidden-el'); window.renderActiveWidgets(); }
};

window.renderActiveWidgets = function() {
  const AVAILABLE_WIDGETS = [ { id: 'widget-vision', name: 'لوحة الأهداف', desc: 'بورد واقعي مع صور وخطط' }, { id: 'widget-kanban', name: 'المهام المتنقلة', desc: 'أعمدة للحالات مع الأولوية' }, { id: 'widget-focus', name: 'بوصلة التركيز', desc: 'تحديد الهدف الأهم لليوم' }, { id: 'widget-habits', name: 'متتبع العادات', desc: 'قائمة العادات اليومية' }, { id: 'widget-finance', name: 'إدارة المالية', desc: 'المحافظ، الأمنيات، والاشتراكات' }, { id: 'widget-journal', name: 'مساحة التدوين', desc: 'تدوين حر للأفكار' } ];
  const active = window.appState.activeWidgets || []; const order = window.appState.widgetOrder || AVAILABLE_WIDGETS.map(w => w.id);
  const grid = document.getElementById('bentoGrid'); const emptyState = document.getElementById('emptyWorkspaceState');
  if (active.length === 0) emptyState.classList.remove('hidden-el'); else emptyState.classList.add('hidden-el');
  order.forEach(wId => { const el = document.getElementById(wId); if (el) { grid.appendChild(el); if (active.includes(wId)) el.classList.remove('hidden-el'); else el.classList.add('hidden-el'); } });
  document.getElementById('activeWidgetsChips').innerHTML = active.map(wId => { const info = AVAILABLE_WIDGETS.find(w => w.id === wId); return info ? `<span class="chip active" style="font-size:0.72rem; padding:4px 10px;">${info.name}</span>` : ''; }).join('');
};

window.renderWidgetLibraryModal = function() {
  const AVAILABLE_WIDGETS = [ { id: 'widget-vision', name: 'لوحة الأهداف', desc: 'بورد واقعي مع صور وخطط' }, { id: 'widget-kanban', name: 'المهام المتنقلة', desc: 'أعمدة للحالات مع الأولوية' }, { id: 'widget-focus', name: 'بوصلة التركيز', desc: 'تحديد الهدف الأهم لليوم' }, { id: 'widget-habits', name: 'متتبع العادات', desc: 'قائمة العادات اليومية' }, { id: 'widget-finance', name: 'إدارة المالية (حصري)', desc: 'المحافظ، الأمنيات، والاشتراكات' }, { id: 'widget-journal', name: 'مساحة التدوين', desc: 'تدوين حر للأفكار' } ];
  const active = window.appState.activeWidgets || [];
  document.getElementById('widgetLibraryList').innerHTML = AVAILABLE_WIDGETS.map(w => {
    const isAdded = active.includes(w.id);
    return `<div class="list-item" style="padding: 12px 16px;"><div><div style="font-weight: 600; font-size: 0.9rem;">${w.name}</div><div style="font-size: 0.76rem; color: var(--text-secondary);">${w.desc}</div></div>${isAdded ? `<button class="btn btn-danger" onclick="window.removeWidget('${w.id}')">إزالة</button>` : `<button class="btn btn-primary" onclick="window.addWidgetToWorkspace('${w.id}')">إضافة</button>`}</div>`;
  }).join('');
};

window.addWidgetToWorkspace = (wId) => { 
  // قفل أداة المالية لغير المشتركين
  if (wId === 'widget-finance' && !window.userProfile?.isPro) {
    window.showToast('أداة "إدارة المالية الشاملة" حصرية للمشتركين 🌟');
    window.openModal('pricingModal');
    return;
  }
  if (!window.appState.activeWidgets) window.appState.activeWidgets = []; 
  if (!window.appState.activeWidgets.includes(wId)) window.appState.activeWidgets.push(wId); 
  window.renderActiveWidgets(); window.renderWidgetLibraryModal(); window.autoSave(); 
};

window.removeWidget = (wId) => { window.appState.activeWidgets = (window.appState.activeWidgets || []).filter(id => id !== wId); window.renderActiveWidgets(); window.renderWidgetLibraryModal(); window.autoSave(); };

window.initWidgetsDragAndDrop = function() {
  const grid = document.getElementById('bentoGrid'); let draggedCard = null;
  grid.querySelectorAll('.widget-card').forEach(card => {
    card.addEventListener('dragstart', (e) => { if (e.target.classList.contains('kanban-card')) return; draggedCard = card; setTimeout(() => card.classList.add('dragging'), 0); });
    card.addEventListener('dragend', () => { if (!draggedCard) return; draggedCard.classList.remove('dragging'); draggedCard = null; window.appState.widgetOrder = Array.from(grid.querySelectorAll('.widget-card')).map(c => c.getAttribute('data-widget-id')); window.autoSave(); });
    card.addEventListener('dragover', (e) => { e.preventDefault(); if (!draggedCard || draggedCard === card) return; const bounding = card.getBoundingClientRect(); const offset = e.clientY - bounding.top; if (offset > bounding.height / 2) card.after(draggedCard); else card.before(draggedCard); });
  });
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

window.switchTab = function(tabName) {
  if (!event) return;
  
  // قفل تاب المالية في الجوال لغير المشتركين
  if (tabName === 'finance' && !window.userProfile?.isPro) {
    window.showToast('قسم "المالية" حصري للمشتركين 🌟');
    window.openModal('pricingModal');
    return;
  }

  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.currentTarget.classList.add('active');

  if (window.innerWidth <= 768) {
    document.querySelectorAll('.widget-card').forEach(card => card.classList.remove('active-tab-item'));
    document.querySelectorAll('.tab-' + tabName).forEach(el => el.classList.add('active-tab-item'));
  }
};
