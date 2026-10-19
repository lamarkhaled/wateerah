window.renderVisionBoard = function() {
  const board = document.getElementById('corkboardContainer');
  if (!window.appState.visionBoard || window.appState.visionBoard.length === 0) { if(board) board.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: rgba(255,255,255,0.85); padding: 60px 20px; font-size: 0.92rem;">اللوح الخشبي فارغ حالياً.</div>`; return; }
  if(board) board.innerHTML = window.appState.visionBoard.map((item, idx) => {
    const tasks = item.tasks || []; const doneCount = tasks.filter(t => t.done).length; const pct = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : (item.manualPct || 0);
    return `<div class="polaroid-item" onclick="window.openVisionDetail(${idx})"><div class="board-pin"></div><img class="polaroid-img" src="${item.img}" onerror="this.src='https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500'"><div class="polaroid-caption"><span>${item.title}</span><span style="font-size: 0.78rem; font-weight: 700; color: #1F4E3D;">${pct}%</span></div><div class="polaroid-meta"><span>${item.targetDate || 'بدون تاريخ'}</span><span>${tasks.length} مهام</span></div><div class="polaroid-progress-bg"><div class="polaroid-progress-fill" style="width: ${pct}%;"></div></div></div>`;
  }).join('');
};

window.addVisionItem = () => {
  const title = document.getElementById('newVisionTitle').value.trim(); const img = document.getElementById('newVisionImg').value.trim(); const targetDate = document.getElementById('newVisionDate').value;
  if (!title) return window.showToast('أدخل عنوان الهدف');
  if (!window.appState.visionBoard) window.appState.visionBoard = [];
  window.appState.visionBoard.push({ title, img: img || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500', targetDate: targetDate || '', plan: '', tasks: [] });
  document.getElementById('newVisionTitle').value = ''; document.getElementById('newVisionImg').value = ''; document.getElementById('newVisionDate').value = ''; window.renderVisionBoard(); window.autoSave(); window.showToast('تم تثبيت الهدف');
};

window.openVisionDetail = (idx) => {
  window.activeVisionIndex = idx; const item = window.appState.visionBoard[idx]; if (!item) return;
  document.getElementById('vModalImg').src = item.img; document.getElementById('vModalTitle').innerText = item.title; document.getElementById('vModalDate').value = item.targetDate || ''; document.getElementById('vModalPlan').value = item.plan || '';
  window.renderVisionModalTasks(); window.openModal('visionDetailModal');
};

window.renderVisionModalTasks = function() {
  if (window.activeVisionIndex === null) return; const item = window.appState.visionBoard[window.activeVisionIndex]; if (!item.tasks) item.tasks = [];
  const doneCount = item.tasks.filter(t => t.done).length; const pct = item.tasks.length > 0 ? Math.round((doneCount / item.tasks.length) * 100) : 0;
  document.getElementById('vModalPercentBadge').innerText = `${pct}% مكتمل`; document.getElementById('vModalProgressBar').style.width = `${pct}%`;
  document.getElementById('vModalTasksList').innerHTML = item.tasks.map((t, tIdx) => `<li class="list-item ${t.done ? 'completed' : ''}"><div class="item-left"><div class="checkbox" onclick="window.toggleVisionSubTask(${tIdx})">${t.done ? '✓' : ''}</div><span style="font-size: 0.86rem;">${t.text}</span></div><button class="delete-btn" onclick="window.deleteVisionSubTask(${tIdx})">&times;</button></li>`).join('');
};

window.addVisionSubTask = () => { if (window.activeVisionIndex === null) return; const input = document.getElementById('vModalNewTaskInput'); if (!input.value.trim()) return; window.appState.visionBoard[window.activeVisionIndex].tasks.push({ text: input.value.trim(), done: false }); input.value = ''; window.renderVisionModalTasks(); window.renderVisionBoard(); window.autoSave(); };
window.toggleVisionSubTask = (tIdx) => { const item = window.appState.visionBoard[window.activeVisionIndex]; item.tasks[tIdx].done = !item.tasks[tIdx].done; window.renderVisionModalTasks(); window.renderVisionBoard(); window.autoSave(); };
window.deleteVisionSubTask = (tIdx) => { window.appState.visionBoard[window.activeVisionIndex].tasks.splice(tIdx, 1); window.renderVisionModalTasks(); window.renderVisionBoard(); window.autoSave(); };
window.saveVisionModalChanges = () => { if (window.activeVisionIndex === null) return; const item = window.appState.visionBoard[window.activeVisionIndex]; item.targetDate = document.getElementById('vModalDate').value; item.plan = document.getElementById('vModalPlan').value; window.renderVisionBoard(); window.autoSave(); };
window.deleteCurrentVisionItem = () => { if (window.activeVisionIndex === null) return; window.appState.visionBoard.splice(window.activeVisionIndex, 1); window.activeVisionIndex = null; window.closeModal('visionDetailModal'); window.renderVisionBoard(); window.autoSave(); };

window.renderKanbanBoard = function() {
  if (!window.appState.kanbanTasks) window.appState.kanbanTasks = [];
  const cols = { idea: [], scheduled: [], progress: [], done: [] };
  window.appState.kanbanTasks.forEach((task, idx) => { const st = cols[task.status] ? task.status : 'idea'; cols[st].push({ ...task, idx }); });
  const priorityLabel = { urgent: 'عاجل', normal: 'غير عاجل', low: 'غير مهم' }; const priorityClass = { urgent: 'p-urgent', normal: 'p-normal', low: 'p-low' };

  ['idea', 'scheduled', 'progress', 'done'].forEach(colKey => {
    const countEl = document.getElementById(`count-${colKey}`); const wrapEl = document.getElementById(`col-${colKey}`);
    if(countEl) countEl.innerText = cols[colKey].length;
    if(wrapEl) wrapEl.innerHTML = cols[colKey].map(item => `<div class="kanban-card" draggable="true" ondragstart="window.dragKanbanCard(event, ${item.idx})"><div class="kanban-card-title">${item.title}</div><div class="kanban-badges"><span class="priority-badge ${priorityClass[item.priority] || 'p-normal'}">${priorityLabel[item.priority] || 'غير عاجل'}</span>${item.date ? `<span class="date-badge">${item.date}</span>` : ''}</div><div class="kanban-card-footer"><select onchange="window.changeKanbanStatus(${item.idx}, this.value)"><option value="idea" ${item.status==='idea'?'selected':''}>فكرة</option><option value="scheduled" ${item.status==='scheduled'?'selected':''}>مجدول</option><option value="progress" ${item.status==='progress'?'selected':''}>قيد التنفيذ</option><option value="done" ${item.status==='done'?'selected':''}>مكتمل</option></select><button class="delete-btn" onclick="window.deleteKanbanTask(${item.idx})">&times;</button></div></div>`).join('');
  });
};

window.addKanbanTask = () => {
  const title = document.getElementById('newKanbanTitle').value.trim(); const status = document.getElementById('newKanbanStatus').value; const priority = document.getElementById('newKanbanPriority').value; const date = document.getElementById('newKanbanDate').value;
  if (!title) return window.showToast('أدخل عنوان المهمة');
  if (!window.appState.kanbanTasks) window.appState.kanbanTasks = [];
  window.appState.kanbanTasks.push({ title, status, priority, date }); document.getElementById('newKanbanTitle').value = ''; window.renderKanbanBoard(); window.autoSave();
};

window.changeKanbanStatus = (idx, newStatus) => { window.appState.kanbanTasks[idx].status = newStatus; window.renderKanbanBoard(); window.autoSave(); };
window.deleteKanbanTask = (idx) => { window.appState.kanbanTasks.splice(idx, 1); window.renderKanbanBoard(); window.autoSave(); };
window.dragKanbanCard = (e, idx) => { e.stopPropagation(); window.draggedKanbanIndex = idx; };
window.allowKanbanDrop = (e) => { e.preventDefault(); };
window.dropKanbanCard = (e, targetStatus) => { e.preventDefault(); if (window.draggedKanbanIndex === null) return; window.appState.kanbanTasks[window.draggedKanbanIndex].status = targetStatus; window.draggedKanbanIndex = null; window.renderKanbanBoard(); window.autoSave(); };

window.renderBanksList = function() {
  const container = document.getElementById('banksContainer');
  if (!container) return;
  if (!window.appState.banks) window.appState.banks = [];

  if (window.appState.banks.length === 0) {
    container.innerHTML = `<div style="text-align:center; color:var(--text-secondary); font-size:0.8rem; padding:10px;">لا توجد بنوك مضافة بعد.</div>`;
    return;
  }

  container.innerHTML = window.appState.banks.map((bank, bIdx) => `
    <div style="background: var(--bg-glass-strong); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 10px;">
        <input type="text" value="${bank.name}" onchange="window.updateBankName(${bIdx}, this.value)" style="font-weight: 700; border: none; background: transparent; color: var(--text-primary); outline: none; font-size: 1rem; width: 70%;" placeholder="اسم البنك...">
        <button class="delete-btn" style="font-size: 0.75rem;" onclick="window.deleteBank(${bIdx})">حذف البنك</button>
      </div>
      <ul class="item-list" style="margin-bottom: 12px;">
        ${(bank.accounts || []).map((acc, aIdx) => `
          <li class="list-item" style="padding: 8px 12px; background: transparent;">
            <div class="item-left" style="gap: 8px;">
              <input type="text" class="item-text-input" value="${acc.name}" onchange="window.updateAccountName(${bIdx},${aIdx}, this.value)" style="font-weight: 500;" placeholder="اسم الحساب">
              <input type="number" class="item-text-input" value="${acc.balance}" onchange="window.updateAccountBalance(${bIdx},${aIdx}, this.value)" style="color: var(--accent-color); font-weight: 700; max-width: 80px;" placeholder="الرصيد">
              <span style="font-size: 0.75rem; color: var(--text-secondary);">ر.س</span>
            </div>
            <button class="delete-btn" onclick="window.deleteAccount(${bIdx},${aIdx})">&times;</button>
          </li>
        `).join('')}
      </ul>
      <div class="add-row" style="margin-top: 0;">
        <input type="text" id="newAccName_${bIdx}" placeholder="حساب جديد..." style="font-size: 0.8rem; padding: 8px;">
        <input type="number" id="newAccBalance_${bIdx}" placeholder="الرصيد" style="font-size: 0.8rem; padding: 8px;">
        <button class="btn btn-subtle" style="font-size: 0.8rem;" onclick="window.addAccount(${bIdx})">إضافة</button>
      </div>
    </div>
  `).join('');
};

window.addBank = () => {
  const name = document.getElementById('newBankName').value.trim();
  if (!name) return window.showToast('أدخل اسم البنك');
  if (!window.appState.banks) window.appState.banks = [];
  window.appState.banks.push({ name, accounts: [] });
  document.getElementById('newBankName').value = '';
  window.renderLists(); window.autoSave(); window.showToast('تمت إضافة البنك بنجاح');
};

window.deleteBank = (bIdx) => {
  if(confirm('هل أنت متأكد من حذف هذا البنك بكافة الحسابات التي بداخله؟')) {
    window.appState.banks.splice(bIdx, 1); window.renderLists(); window.autoSave(); window.showToast('تم حذف البنك');
  }
};
window.updateBankName = (bIdx, val) => { window.appState.banks[bIdx].name = val; window.autoSave(); };
window.addAccount = (bIdx) => {
  const nameEl = document.getElementById(`newAccName_${bIdx}`); const balEl = document.getElementById(`newAccBalance_${bIdx}`);
  const name = nameEl.value.trim(); const balance = parseFloat(balEl.value) || 0;
  if (!name) return window.showToast('أدخل اسم الحساب');
  window.appState.banks[bIdx].accounts.push({ name, balance });
  nameEl.value = ''; balEl.value = ''; window.renderLists(); window.autoSave();
};
window.deleteAccount = (bIdx, aIdx) => { window.appState.banks[bIdx].accounts.splice(aIdx, 1); window.renderLists(); window.autoSave(); };
window.updateAccountName = (bIdx, aIdx, val) => { window.appState.banks[bIdx].accounts[aIdx].name = val; window.autoSave(); };
window.updateAccountBalance = (bIdx, aIdx, val) => { window.appState.banks[bIdx].accounts[aIdx].balance = parseFloat(val) || 0; window.autoSave(); window.calculateDistribution(); };

window.renderLists = function() {
  window.renderVisionBoard(); 
  window.renderKanbanBoard();
  window.renderBanksList(); 

  document.getElementById('habitsList').innerHTML = (window.appState.habits || []).map((h, i) => `<li class="list-item ${h.done ? 'completed' : ''}"><div class="item-left"><div class="checkbox" onclick="window.toggleHabit(${i})">${h.done ? '✓' : ''}</div><input type="text" class="item-text-input" value="${h.text}" onchange="window.appState.habits[${i}].text=this.value; window.autoSave()"></div><button class="delete-btn" onclick="window.appState.habits.splice(${i},1); window.renderLists(); window.autoSave()">&times;</button></li>`).join('');
  document.getElementById('wishlistList').innerHTML = (window.appState.wishlist || []).map((w, i) => `<li class="list-item"><div class="item-left"><input type="text" class="item-text-input" value="${w.title}" onchange="window.appState.wishlist[${i}].title=this.value; window.autoSave()"><span style="font-size:0.8rem; font-weight:600; color:var(--danger-color);">${w.cost} ر.س</span></div><button class="delete-btn" onclick="window.appState.wishlist.splice(${i},1); window.renderLists(); window.autoSave()">&times;</button></li>`).join('');
  document.getElementById('subscriptionsList').innerHTML = (window.appState.subscriptions || []).map((s, i) => `<li class="list-item"><div class="item-left"><input type="text" class="item-text-input" value="${s.name}" onchange="window.appState.subscriptions[${i}].name=this.value; window.autoSave()"><span style="font-size:0.8rem; font-weight:600;">${s.cost} ر.س</span></div><button class="delete-btn" onclick="window.appState.subscriptions.splice(${i},1); window.renderLists(); window.autoSave()">&times;</button></li>`).join('');
  window.calculateDistribution();
};

window.toggleHabit = (i) => { window.appState.habits[i].done = !window.appState.habits[i].done; window.renderLists(); window.autoSave(); };

window.addHabit = () => { 
  if (!window.userProfile?.isPro && (window.appState.habits || []).length >= 3) {
    window.showToast('النسخة المجانية تتيح 3 عادات كحد أقصى. رقّي باقتك الآن! 🌟');
    window.openModal('pricingModal');
    return;
  }
  const el = document.getElementById('newHabitInput'); 
  if(!el.value.trim()) return; 
  window.appState.habits.push({text:el.value.trim(), done:false}); 
  el.value=''; 
  window.renderLists(); window.autoSave(); 
};

window.addWishlistItem = () => { const t = document.getElementById('newWishTitle'); const c = document.getElementById('newWishCost'); if(!t.value.trim())return; window.appState.wishlist.push({title:t.value.trim(), cost:parseFloat(c.value)||0}); t.value=''; c.value=''; window.renderLists(); window.autoSave(); };
window.addSubscription = () => { const n = document.getElementById('newSubName'); const c = document.getElementById('newSubCost'); if(!n.value.trim())return; window.appState.subscriptions.push({name:n.value.trim(), cost:parseFloat(c.value)||0}); n.value=''; c.value=''; window.renderLists(); window.autoSave(); };

window.calculateDistribution = () => {
  const income = parseFloat(document.getElementById('totalIncomeInput')?.value) || 5000;
  const container = document.getElementById('distributionResults');
  if(container) container.innerHTML = `<div style="background:var(--bg-glass-strong); padding:10px; border-radius:10px; border:1px solid var(--border-color); text-align:center;"><div style="font-size:0.72rem; color:var(--text-secondary);">التزامات (10%)</div><div style="font-weight:700; color:var(--accent-color);">${income*0.1} ر.س</div></div><div style="background:var(--bg-glass-strong); padding:10px; border-radius:10px; border:1px solid var(--border-color); text-align:center;"><div style="font-size:0.72rem; color:var(--text-secondary);">معيشة (25%)</div><div style="font-weight:700; color:var(--accent-color);">${income*0.25} ر.س</div></div><div style="background:var(--bg-glass-strong); padding:10px; border-radius:10px; border:1px solid var(--border-color); text-align:center;"><div style="font-size:0.72rem; color:var(--text-secondary);">أعمال (25%)</div><div style="font-weight:700; color:var(--accent-color);">${income*0.25} ر.س</div></div><div style="background:var(--bg-glass-strong); padding:10px; border-radius:10px; border:1px solid var(--border-color); text-align:center;"><div style="font-size:0.72rem; color:var(--text-secondary);">استثمار (30%)</div><div style="font-weight:700; color:var(--accent-color);">${income*0.3} ر.س</div></div><div style="background:var(--bg-glass-strong); padding:10px; border-radius:10px; border:1px solid var(--border-color); text-align:center;"><div style="font-size:0.72rem; color:var(--text-secondary);">صدقات (10%)</div><div style="font-weight:700; color:var(--accent-color);">${income*0.1} ر.س</div></div>`;
};

// ================= دوال ملاحظات أبل =================
window.currentActiveNoteId = null;

window.renderNotesList = function() {
  if (!window.appState.notes) window.appState.notes = [];
  const listContainer = document.getElementById('notesListView');
  if (!listContainer) return;
  
  if (window.appState.notes.length === 0) {
    listContainer.innerHTML = '<div style="text-align:center; color:var(--text-secondary); padding:60px 20px; font-size:0.95rem;">لا توجد ملاحظات.<br>اضغط على 📝 لإنشاء ملاحظة جديدة.</div>';
    return;
  }
  
  const sortedNotes = [...window.appState.notes].sort((a, b) => b.updatedAt - a.updatedAt);
  
  listContainer.innerHTML = sortedNotes.map(note => {
    const dateObj = new Date(note.updatedAt);
    const dateStr = dateObj.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = note.content || 'ملاحظة جديدة';
    let rawText = tempDiv.textContent || tempDiv.innerText || '';
    const title = rawText.split('\n')[0].substring(0, 30) || 'بدون عنوان';
    let snippet = rawText.replace(title, '').trim().substring(0, 40);
    if(snippet.length >= 40) snippet += '...';
    if(snippet === '') snippet = 'لا يوجد نص إضافي';

    return `
      <div class="note-list-item" onclick="window.openNote('${note.id}')">
        <div style="font-weight: 700; font-size: 1rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${title}</div>
        <div style="display: flex; gap: 10px; font-size: 0.85rem; color: var(--text-secondary);">
          <span style="font-weight: 500;">${dateStr}</span>
          <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0.8;">${snippet}</span>
        </div>
      </div>
    `;
  }).join('');
};

window.showNotesList = function() {
  document.getElementById('notesListView').style.display = 'block';
  document.getElementById('noteEditorView').style.display = 'none';
  window.currentActiveNoteId = null;
  window.renderNotesList();
};

window.createNewNote = function() {
  if (!window.appState.notes) window.appState.notes = [];
  const newNote = { id: 'note_' + Date.now(), content: '', updatedAt: Date.now() };
  window.appState.notes.unshift(newNote); 
  window.autoSave();
  window.openNote(newNote.id);
};

window.openNote = function(id) {
  window.currentActiveNoteId = id;
  const note = window.appState.notes.find(n => n.id === id);
  if (!note) return;
  
  document.getElementById('notesListView').style.display = 'none';
  document.getElementById('noteEditorView').style.display = 'flex';
  
  const dateObj = new Date(note.updatedAt);
  const timeStr = dateObj.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  const dateStr = dateObj.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', year: 'numeric' });
  document.getElementById('currentNoteDate').innerText = `${dateStr} في ${timeStr}`;
  
  const editor = document.getElementById('noteContentEditable');
  editor.innerHTML = note.content;
  
  setTimeout(() => {
    editor.focus();
    if (typeof window.getSelection !== "undefined" && typeof document.createRange !== "undefined") {
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, 50);
};

window.autoSaveNote = function() {
  if (!window.currentActiveNoteId) return;
  const noteIndex = window.appState.notes.findIndex(n => n.id === window.currentActiveNoteId);
  if (noteIndex > -1) {
    const editor = document.getElementById('noteContentEditable');
    window.appState.notes[noteIndex].content = editor.innerHTML;
    window.appState.notes[noteIndex].updatedAt = Date.now();
    window.autoSave();
  }
};

window.deleteCurrentNote = function() {
  if (!window.currentActiveNoteId) return;
  if (confirm('هل أنت متأكد من حذف هذه الملاحظة نهائياً؟')) {
    window.appState.notes = window.appState.notes.filter(n => n.id !== window.currentActiveNoteId);
    window.autoSave();
    window.showNotesList();
  }
};

window.addNoteImage = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 2.5 * 1024 * 1024) {
    if(window.showToast) window.showToast('حجم الصورة كبير جداً. يرجى اختيار صورة أقل من 2.5 ميجابايت.');
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    const imgBase64 = e.target.result;
    const imgTag = `<br><img src="${imgBase64}"><br>`;
    const editor = document.getElementById('noteContentEditable');
    editor.innerHTML += imgTag;
    window.autoSaveNote();
    editor.scrollTop = editor.scrollHeight;
  };
  reader.readAsDataURL(file);
  event.target.value = ''; 
};

setTimeout(() => { if (window.renderNotesList) window.renderNotesList(); }, 800);
