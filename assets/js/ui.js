// assets/js/ui.js

window.showToast = function(msg) {
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div'); t.className = 'toast'; t.innerText = msg;
  c.appendChild(t); setTimeout(() => t.remove(), 3200);
};

window.updateDayNightGreeting = function() {
  const hour = new Date().getHours();
  const isMorning = hour >= 4 && hour < 17;
  const greetingWord = isMorning ? 'صباح الخير' : 'مساء الخير';
  const periodLabel = isMorning ? 'الفترة الصباحية' : 'الفترة المسائية';
  
  if (!isMorning) document.body.classList.add('night-mode-glow');
  else document.body.classList.remove('night-mode-glow');

  const userName = window.userProfile?.name || 'صديقنا';
  if(document.getElementById('welcomeText')) document.getElementById('welcomeText').innerText = `${greetingWord}، أهلاً بك يا ${userName}.`;
  if(document.getElementById('onboardingGreeting')) document.getElementById('onboardingGreeting').innerText = `${greetingWord}، أهلاً بك في وتيرة`;
  if(document.getElementById('onboardingTimePill')) document.getElementById('onboardingTimePill').innerText = periodLabel;
  if(document.getElementById('dayNightSubtext')) document.getElementById('dayNightSubtext').innerText = isMorning ? 'بداية يوم مشرقة، رتّب أولوياتك بهدوء.' : 'أمسية هادئة، راجع إنجازاتك وخطط للغد.';
  
  const todayStr = new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
  if(document.getElementById('liveDateText')) document.getElementById('liveDateText').innerText = todayStr;
};

window.applyTheme = function(name) {
  if(name === 'default') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', name);
  window.appState.theme = name;
  document.querySelectorAll('[data-theme-btn]').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-theme-btn') === name);
  });
};

window.setTheme = (name, btn) => { window.applyTheme(name); window.autoSave(); };

window.selectOnboardingTheme = (themeName, el) => {
  document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  window.applyTheme(themeName);
};

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
    onb.classList.remove('hidden-el'); mainW.classList.add('hidden-el');
  } else {
    onb.classList.add('hidden-el'); mainW.classList.remove('hidden-el');
    window.renderActiveWidgets();
  }
};

window.renderActiveWidgets = function() {
  const AVAILABLE_WIDGETS = [
    { id: 'widget-vision', name: 'لوحة الأهداف', desc: 'بورد واقعي مع صور وخطط' },
    { id: 'widget-kanban', name: 'المهام المتنقلة', desc: 'أعمدة للحالات مع الأولوية' },
    { id: 'widget-focus', name: 'بوصلة التركيز', desc: 'تحديد الهدف الأهم لليوم' },
    { id: 'widget-habits', name: 'متتبع العادات', desc: 'قائمة العادات اليومية' },
    { id: 'widget-finance', name: 'إدارة المالية', desc: 'المحافظ، والاشتراكات، والتوزيع' },
    { id: 'widget-journal', name: 'مساحة التدوين', desc: 'تدوين حر للأفكار' }
  ];
  const active = window.appState.activeWidgets || [];
  const order = window.appState.widgetOrder || AVAILABLE_WIDGETS.map(w => w.id);
  const grid = document.getElementById('bentoGrid');
  const emptyState = document.getElementById('emptyWorkspaceState');

  if (active.length === 0) emptyState.classList.remove('hidden-el');
  else emptyState.classList.add('hidden-el');

  order.forEach(wId => {
    const el = document.getElementById(wId);
    if (el) {
      grid.appendChild(el);
      if (active.includes(wId)) el.classList.remove('hidden-el');
      else el.classList.add('hidden-el');
    }
  });

  document.getElementById('activeWidgetsChips').innerHTML = active.map(wId => {
    const info = AVAILABLE_WIDGETS.find(w => w.id === wId);
    return info ? `<span class="chip active" style="font-size:0.72rem; padding:4px 10px;">${info.name}</span>` : '';
  }).join('');
};

window.initWidgetsDragAndDrop = function() {
  const grid = document.getElementById('bentoGrid');
  let draggedCard = null;
  grid.querySelectorAll('.widget-card').forEach(card => {
    card.addEventListener('dragstart', (e) => {
      if (e.target.classList.contains('kanban-card')) return;
      draggedCard = card; setTimeout(() => card.classList.add('dragging'), 0);
    });
    card.addEventListener('dragend', () => {
      if (!draggedCard) return;
      draggedCard.classList.remove('dragging'); draggedCard = null;
      window.appState.widgetOrder = Array.from(grid.querySelectorAll('.widget-card')).map(c => c.getAttribute('data-widget-id'));
      window.autoSave();
    });
    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (!draggedCard || draggedCard === card) return;
      const bounding = card.getBoundingClientRect();
      const offset = e.clientY - bounding.top;
      if (offset > bounding.height / 2) card.after(draggedCard);
      else card.before(draggedCard);
    });
  });
};

window.openModal = async id => {
  if (id === 'addWidgetModal') window.renderWidgetLibraryModal();
  if (id === 'pricingModal') window.setupPricingModal();
  if (id === 'adminModal' && window.loadAdminUsers) {
    await window.loadAdminUsers();
    await window.loadAdminCodes();
  }
  document.getElementById(id).classList.add('open');
};
window.closeModal = id => document.getElementById(id).classList.remove('open');
window.openAuthModal = () => { window.switchToLogin(); window.openModal('authModal'); };
window.switchToLogin = () => { document.getElementById('viewLogin').style.display = 'block'; document.getElementById('viewRegister').style.display = 'none'; };
window.switchToRegister = () => { document.getElementById('viewLogin').style.display = 'none'; document.getElementById('viewRegister').style.display = 'block'; };
window.openResetModal = () => { window.closeModal('authModal'); window.openModal('resetModal'); };
window.dismissGlassMessage = () => { document.getElementById('activeGlassMessage').style.display = 'none'; document.getElementById('emptyGlassMessage').style.display = 'flex'; };
window.toggleWidget = (id, btn) => { document.getElementById(id).classList.toggle('hidden-widget'); btn.classList.toggle('active'); };
