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
      if (wId === 'widget-kanban' && window.renderKanbanBoard) window.renderKanbanBoard();
      if (wId === 'widget-habits' && window.renderLists) window.renderLists();
      if (wId === 'widget-care' && window.renderCareRoutines) window.renderCareRoutines();
      if (wId === 'widget-matrix' && window.renderMatrix) window.renderMatrix();
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
    { id: 'widget-vision', name: 'الأهداف', desc: 'لوحة الأهداف والمقاصد', icon: '🎯' },
    { id: 'widget-matrix', name: 'مصفوفة الأولويات', desc: 'تصنيف المهام بذكاء', icon: '📊' },
    { id: 'widget-kanban', name: 'المهام', desc: 'إدارة المهام المتنقلة', icon: '📋' },
    { id: 'widget-business', name: 'الأعمال', desc: 'إدارة المشاريع والحملات', icon: '💼' },
    { id: 'widget-care', name: 'الصحة والعناية', desc: 'تتبع بروتوكول العناية الشخصية', icon: '🌿' },
    { id: 'widget-finance', name: 'المالية', desc: 'إدارة المالية الشاملة', icon: '💰' },
    { id: 'widget-journal', name: 'التدوين', desc: 'مساحة حرة للكتابة', icon: '📝' },
    { id: 'widget-focus', name: 'التركيز', desc: 'تحديد الهدف الأهم', icon: '🧭' },
    { id: 'widget-habits', name: 'العادات', desc: 'متتبع العادات اليومية', icon: '✨' }
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

window.prepareSubscriptionForm = function() {
    const bankSelect = document.getElementById('newSubBank');
    if(bankSelect) {
        if(!window.appState.banks || window.appState.banks.length === 0) {
            bankSelect.innerHTML = '<option value="">لا توجد بنوك مسجلة</option>';
            bankSelect.disabled = true;
        } else {
            bankSelect.disabled = false;
            bankSelect.innerHTML = window.appState.banks.map((b, idx) => `<option value="${idx}">${b.name}</option>`).join('');
        }
    }
};

window.resendVerificationEmailDirectly = async () => { 
    window.showToast('تم إرسال رابط التفعيل إلى بريدك.'); 
    window.closeModal('verificationNoticeModal'); 
};

window.returnToLogin = () => { 
    window.closeModal('verificationNoticeModal'); 
    window.switchAuthView('login'); 
};

window.createNewNote = function() {
    document.getElementById('notesListView').style.display = 'none';
    document.getElementById('noteEditorView').style.display = 'flex';
    document.getElementById('noteContentEditable').innerHTML = '';
    document.getElementById('currentNoteDate').innerText = new Date().toLocaleDateString('ar-SA');
    window.activeNoteIndex = -1;
};

window.showNotesList = function() {
    document.getElementById('noteEditorView').style.display = 'none';
    document.getElementById('notesListView').style.display = 'block';
    if(window.renderNotesList) window.renderNotesList();
};

window.autoSaveNote = function() {
    const content = document.getElementById('noteContentEditable').innerHTML;
    if(!window.appState.notes) window.appState.notes = [];
    if(window.activeNoteIndex === -1) {
        window.appState.notes.unshift({ date: new Date().toISOString(), content });
        window.activeNoteIndex = 0;
    } else {
        window.appState.notes[window.activeNoteIndex].content = content;
    }
    window.autoSave();
};

window.deleteCurrentNote = function() {
    if(window.activeNoteIndex > -1) {
        window.appState.notes.splice(window.activeNoteIndex, 1);
        window.autoSave();
    }
    window.showNotesList();
};

window.renderNotesList = function() {
    if(!window.appState.notes) window.appState.notes = [];
    const list = document.getElementById('notesListView');
    if(list) {
        list.innerHTML = window.appState.notes.map((n, idx) => {
            const preview = n.content.replace(/<[^>]*>?/gm, '').substring(0, 40) + '...';
            const d = new Date(n.date).toLocaleDateString('ar-SA');
            return `<div class="note-list-item" onclick="window.openNote(${idx})">
                <div style="font-size:0.75rem; color:var(--text-secondary);">${d}</div>
                <div style="font-size:0.9rem; font-weight:600;">${preview}</div>
            </div>`;
        }).join('') || '<div style="padding:20px; text-align:center; color:var(--text-secondary); font-size:0.85rem;">لا توجد ملاحظات</div>';
    }
};

window.openNote = function(idx) {
    window.activeNoteIndex = idx;
    document.getElementById('notesListView').style.display = 'none';
    document.getElementById('noteEditorView').style.display = 'flex';
    document.getElementById('noteContentEditable').innerHTML = window.appState.notes[idx].content;
    document.getElementById('currentNoteDate').innerText = new Date(window.appState.notes[idx].date).toLocaleDateString('ar-SA');
};
