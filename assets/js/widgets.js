window.renderVisionBoard = function() {
  const board = document.getElementById('corkboardContainer');
  if (!window.appState.visionBoard || window.appState.visionBoard.length === 0) { if(board) board.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: rgba(255,255,255,0.85); padding: 60px 20px; font-size: 0.92rem;">اللوح الخشبي فارغ حالياً.</div>`; return; }
  if(board) board.innerHTML = window.appState.visionBoard.map((item, idx) => {
    const tasks = item.tasks || []; const doneCount = tasks.filter(t => t.done).length; const pct = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : (item.manualPct || 0);
    return `<div class="polaroid-item" onclick="window.openVisionDetail(${idx})"><div class="board-pin"></div><img class="polaroid-img" src="${item.img}" onerror="this.src='https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500'"><div class="polaroid-caption"><span>${item.title}</span><span style="font-size: 0.78rem; font-weight: 700; color: #1F4E3D;">${pct}%</span></div><div class="polaroid-meta"><span>${item.targetDate || 'بدون تاريخ'}</span><span>${tasks.length} مهام</span></div><div class="polaroid-progress-bg"><div class="polaroid-progress-fill" style="width: ${pct}%;"></div></div></div>`;
  }).join('');
};

window.addVisionItem = () => {
  const title = document.getElementById('newVisionTitle').value.trim();
  const targetDate = document.getElementById('newVisionDate').value;
  const fileInput = document.getElementById('newVisionImgFile');
  const file = fileInput ? fileInput.files[0] : null;
  if (!title) return window.showToast('أدخل عنوان الهدف');

  const finalizeSave = (imgData) => {
    if (!window.appState.visionBoard) window.appState.visionBoard = [];
    window.appState.visionBoard.push({ title, img: imgData || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500', targetDate: targetDate || '', plan: '', tasks: [] });
    document.getElementById('newVisionTitle').value = '';
    if(fileInput) fileInput.value = '';
    document.getElementById('newVisionDate').value = '';
    if(document.getElementById('addVisionForm')) document.getElementById('addVisionForm').style.display = 'none';
    if(document.getElementById('addVisionPlusBtn')) document.getElementById('addVisionPlusBtn').style.display = 'flex';
    window.renderVisionBoard(); window.autoSave(); window.showToast('تم تثبيت الهدف');
  };
  if (file) { if (file.size > 2.5 * 1024 * 1024) return window.showToast('حجم الصورة كبير جداً (الحد الأقصى 2.5 ميجابايت).'); const reader = new FileReader(); reader.onload = (e) => finalizeSave(e.target.result); reader.readAsDataURL(file); } else { finalizeSave(''); }
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
  window.appState.kanbanTasks.push({ title, status, priority, date }); document.getElementById('newKanbanTitle').value = ''; 
  if(document.getElementById('addKanbanForm')) document.getElementById('addKanbanForm').style.display = 'none';
  if(document.getElementById('addKanbanPlusBtn')) document.getElementById('addKanbanPlusBtn').style.display = 'flex';
  window.renderKanbanBoard(); window.autoSave();
};
window.changeKanbanStatus = (idx, newStatus) => { window.appState.kanbanTasks[idx].status = newStatus; window.renderKanbanBoard(); window.autoSave(); };
window.deleteKanbanTask = (idx) => { window.appState.kanbanTasks.splice(idx, 1); window.renderKanbanBoard(); window.autoSave(); };
window.dragKanbanCard = (e, idx) => { e.stopPropagation(); window.draggedKanbanIndex = idx; };
window.allowKanbanDrop = (e) => { e.preventDefault(); };
window.dropKanbanCard = (e, targetStatus) => { e.preventDefault(); if (window.draggedKanbanIndex === null) return; window.appState.kanbanTasks[window.draggedKanbanIndex].status = targetStatus; window.draggedKanbanIndex = null; window.renderKanbanBoard(); window.autoSave(); };

window.currentBankIndex = null;

window.renderBanksList = function() {
  const container = document.getElementById('banksContainer');
  const overview = document.getElementById('banksTotalOverview');
  if (!container) return;
  if (!window.appState.banks) window.appState.banks = [];
  let grandTotal = 0;
  if (window.appState.banks.length === 0) {
    container.innerHTML = `<div style="text-align:center; color:var(--text-secondary); font-size:0.85rem; padding:20px;">لا توجد بنوك مضافة بعد.</div>`;
    if(overview) overview.innerHTML = `مجموع الأرصدة الكلي: 0 ر.س`;
    return;
  }
  container.innerHTML = window.appState.banks.map((bank, bIdx) => {
    let bankTotal = 0;
    (bank.accounts || []).forEach(acc => { bankTotal += parseFloat(acc.balance) || 0; });
    grandTotal += bankTotal;
    return `
      <div onclick="window.openBankDetails(${bIdx})" style="background: var(--bg-glass-strong); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 18px 20px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: var(--transition); box-shadow: var(--shadow-ios);">
         <div style="font-weight: 700; font-size: 1.05rem; color: var(--text-primary); display:flex; align-items:center; gap:10px;">
           <span style="font-size:1.4rem;">🏦</span>
           <span>${bank.name}</span>
         </div>
         <div style="display: flex; align-items: center; gap: 14px;">
           <span style="font-size: 1rem; font-weight: 700; color: var(--accent-color);">${bankTotal} ر.س</span>
           <span style="font-size:1.1rem; color:var(--text-secondary);">❯</span>
         </div>
      </div>
    `;
  }).join('');
  if(overview) { overview.innerHTML = `مجموع الأرصدة الكلي: <strong style="color: var(--accent-color); font-size: 1.1rem;">${grandTotal}</strong> ر.س`; }
};

window.openBankDetails = function(bIdx) {
  window.currentBankIndex = bIdx;
  document.getElementById('widget-finance').style.display = 'none';
  const detailsPage = document.getElementById('bankDetailsPage');
  if(detailsPage) { detailsPage.classList.remove('hidden-el'); detailsPage.style.display = 'block'; }
  window.renderBankDetailsView();
};

window.closeBankDetails = function() {
  window.currentBankIndex = null;
  const detailsPage = document.getElementById('bankDetailsPage');
  if(detailsPage) { detailsPage.style.display = 'none'; detailsPage.classList.add('hidden-el'); }
  const financePage = document.getElementById('widget-finance');
  if(financePage) { financePage.classList.remove('hidden-el'); financePage.style.display = 'block'; }
  window.renderBanksList(); window.calculateDistribution();
};

window.renderBankDetailsView = function() {
  if (window.currentBankIndex === null) return;
  const bank = window.appState.banks[window.currentBankIndex];
  if (!bank) return window.closeBankDetails();

  let bankTotal = 0;
  (bank.accounts || []).forEach(acc => { bankTotal += parseFloat(acc.balance) || 0; });
  
  const titleEl = document.getElementById('activeBankTitle');
  const totalEl = document.getElementById('activeBankTotal');
  if(titleEl) titleEl.innerText = bank.name;
  if(totalEl) totalEl.innerText = bankTotal + ' ر.س';

  const accountsList = document.getElementById('activeBankAccountsList');
  if(!accountsList) return;

  if (!bank.accounts || bank.accounts.length === 0) {
    accountsList.innerHTML = `<div style="text-align:center; color:var(--text-secondary); font-size:0.85rem; padding:20px;">لا توجد حسابات مضافة بهذا البنك.</div>`;
    return;
  }

  accountsList.innerHTML = bank.accounts.map((acc, aIdx) => {
    const balance = parseFloat(acc.balance) || 0;
    const target = parseFloat(acc.target) || 0;
    const pct = target > 0 ? Math.min(100, Math.round((balance / target) * 100)) : 0;
    const progressHtml = target > 0 ? `<div class="progress-bar-bg" style="height: 6px; margin-top: 10px;"><div class="progress-bar-fill" style="width: ${pct}%;"></div></div><div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px; text-align: left;">الهدف: ${target} ر.س (${pct}%)</div>` : '';

    return `
      <div style="background: var(--bg-subtle); border: 1px solid var(--border-color); border-radius: 14px; padding: 18px; margin-bottom: 14px; position: relative;">
        <button class="delete-btn" style="position: absolute; top: 14px; left: 14px; font-size: 1.2rem;" onclick="window.deleteAccountFromDetails(${aIdx})">&times;</button>
        
        <div style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px; padding-left: 28px;">
          <input type="text" value="${acc.name}" onchange="window.updateAccountDetail(${aIdx}, 'name', this.value)" style="font-weight: 700; font-size: 1.05rem; border: none; background: transparent; color: var(--text-primary); outline: none;" placeholder="اسم الحساب">
          <input type="text" value="${acc.purpose || ''}" onchange="window.updateAccountDetail(${aIdx}, 'purpose', this.value)" style="font-size: 0.82rem; color: var(--text-secondary); border: none; background: transparent; outline: none; margin-top: -2px;" placeholder="الغرض من الحساب (اختياري)...">
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="font-size: 1.4rem; font-weight: 700; color: var(--accent-color);">${balance} <span style="font-size: 0.8rem; color: var(--text-secondary);">ر.س</span></div>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-subtle" style="padding: 4px 12px; font-size: 1.1rem; font-weight: bold; color: var(--danger-color);" onclick="window.addAccountTransaction(${aIdx}, 'sub')">-</button>
            <button class="btn btn-primary" style="padding: 4px 12px; font-size: 1.1rem; font-weight: bold;" onclick="window.addAccountTransaction(${aIdx}, 'add')">+</button>
            <button class="btn btn-subtle" style="padding: 4px 10px; font-size: 0.75rem;" onclick="window.openAccountHistory(${aIdx})">السجل 🗓️</button>
          </div>
        </div>
        ${progressHtml}
      </div>
    `;
  }).join('');
};

window.addBank = () => {
  const name = document.getElementById('newBankName').value.trim();
  if (!name) return window.showToast('أدخل اسم البنك');
  if (!window.appState.banks) window.appState.banks = [];
  window.appState.banks.push({ name, accounts: [] });
  document.getElementById('newBankName').value = '';
  if(document.getElementById('addBankForm')) document.getElementById('addBankForm').style.display = 'none';
  if(document.getElementById('addBankPlusBtn')) document.getElementById('addBankPlusBtn').style.display = 'flex';
  window.renderLists(); window.autoSave(); window.showToast('تمت إضافة البنك بنجاح');
};

window.deleteCurrentBank = () => {
  if (window.currentBankIndex === null) return;
  if(confirm('هل أنت متأكد من حذف هذا البنك بكافة الحسابات التي بداخله؟')) { 
    window.appState.banks.splice(window.currentBankIndex, 1); 
    window.autoSave(); window.showToast('تم حذف البنك'); window.closeBankDetails();
  }
};

window.addAccountToCurrentBank = () => { 
  if (window.currentBankIndex === null) return;
  const nameEl = document.getElementById('newAccName'); const purposeEl = document.getElementById('newAccPurpose'); const targetEl = document.getElementById('newAccTarget'); const balEl = document.getElementById('newAccBalance'); 
  const name = nameEl.value.trim(); const purpose = purposeEl.value.trim(); const target = parseFloat(targetEl.value) || 0; const balance = parseFloat(balEl.value) || 0; 
  if (!name) return window.showToast('أدخل اسم الحساب'); 
  if (!window.appState.banks[window.currentBankIndex].accounts) window.appState.banks[window.currentBankIndex].accounts = [];
  window.appState.banks[window.currentBankIndex].accounts.push({ name, purpose, target, balance, history: [] }); 
  nameEl.value = ''; purposeEl.value = ''; targetEl.value = ''; balEl.value = ''; 
  if(document.getElementById('addAccForm')) document.getElementById('addAccForm').style.display = 'none';
  if(document.getElementById('addAccPlusBtn')) document.getElementById('addAccPlusBtn').style.display = 'flex';
  window.renderBankDetailsView(); window.autoSave(); 
};

window.updateAccountDetail = (aIdx, field, val) => {
   if (window.currentBankIndex === null) return;
   window.appState.banks[window.currentBankIndex].accounts[aIdx][field] = val; window.autoSave();
};

window.deleteAccountFromDetails = (aIdx) => { 
  if (window.currentBankIndex === null) return;
  if(confirm('متأكد من حذف الحساب؟')) { window.appState.banks[window.currentBankIndex].accounts.splice(aIdx, 1); window.renderBankDetailsView(); window.autoSave(); }
};

window.addAccountTransaction = (aIdx, type) => {
   if (window.currentBankIndex === null) return;
   const account = window.appState.banks[window.currentBankIndex].accounts[aIdx];
   const amountStr = prompt(`أدخل المبلغ الذي تريد ${type === 'add' ? 'إضافته' : 'سحبه'} بالريال:`);
   if (!amountStr) return;
   const amount = parseFloat(amountStr);
   if (isNaN(amount) || amount <= 0) return window.showToast('مبلغ غير صحيح');
   const reason = prompt('ما هو السبب / التفاصيل؟') || 'بدون تفاصيل';
   if (!account.history) account.history = [];
   const dateStr = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
   account.history.unshift({ type: type, amount: amount, reason: reason, date: dateStr });
   if (type === 'add') account.balance = (parseFloat(account.balance) || 0) + amount; else account.balance = (parseFloat(account.balance) || 0) - amount;
   window.renderBankDetailsView(); window.autoSave();
};

window.openAccountHistory = (aIdx) => {
   if (window.currentBankIndex === null) return;
   const account = window.appState.banks[window.currentBankIndex].accounts[aIdx];
   const container = document.getElementById('accountHistoryContent');
   document.getElementById('accountHistoryTitle').innerText = `سجل: ${account.name}`;
   if (!account.history || account.history.length === 0) {
      container.innerHTML = '<div style="text-align:center; padding:40px 20px; color:var(--text-secondary); font-size:0.9rem;">لا يوجد سجل حركات لهذا الحساب بعد.</div>';
   } else {
      container.innerHTML = account.history.map(tx => {
         const isAdd = tx.type === 'add';
         const color = isAdd ? 'var(--accent-color)' : 'var(--danger-color)';
         const sign = isAdd ? '+' : '-';
         return `
           <div style="background:var(--bg-glass-strong); padding:14px; border-radius:12px; border:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
             <div><div style="font-weight:700; margin-bottom:4px;">${tx.reason}</div><div style="font-size:0.75rem; color:var(--text-secondary);">${tx.date}</div></div>
             <div style="font-weight:700; color:${color};" dir="ltr">${sign} ${tx.amount}</div>
           </div>
         `;
      }).join('');
   }
   window.openModal('accountHistoryModal');
};

window.renderAllocations = function() {
  const container = document.getElementById('allocationsContainer');
  if (!container) return;
  if (!window.appState.allocations || window.appState.allocations.length === 0) {
    window.appState.allocations = [
      {name: 'التزامات ومصاريف', pct: 40}, {name: 'ادخار وطوارئ', pct: 30}, {name: 'استثمار', pct: 20}, {name: 'صدقات', pct: 10}
    ];
  }
  const incomeEl = document.getElementById('totalIncomeInput');
  const income = incomeEl ? (parseFloat(incomeEl.value) || 0) : 5000;
  let totalPct = 0;
  container.innerHTML = window.appState.allocations.map((al, idx) => {
    const p = parseFloat(al.pct) || 0; totalPct += p; const amount = (income * (p / 100)).toFixed(2);
    return `<div class="list-item" style="padding: 10px 14px; background: var(--bg-subtle);"><div class="item-left" style="gap: 12px; flex: 1; flex-wrap: wrap;"><input type="text" class="item-text-input" value="${al.name}" onchange="window.updateAllocation(${idx}, 'name', this.value)" style="font-weight: 700; flex: 1.5; min-width: 100px;" placeholder="اسم البند"><div style="display: flex; align-items: center; gap: 4px; flex: 1;"><input type="number" class="item-text-input" value="${al.pct}" onchange="window.updateAllocation(${idx}, 'pct', this.value)" style="color: var(--accent-color); font-weight: 700; width: 60px; text-align: left; background: var(--bg-primary); padding: 4px; border-radius: 6px; border: 1px solid var(--border-color);"> <span style="font-size: 0.8rem; font-weight: 700;">%</span></div><span style="font-size: 0.9rem; font-weight: 700; color: var(--accent-color); flex: 1.5; text-align: left; border-right: 1px solid var(--border-color); padding-right: 12px; min-width: 90px;">${amount} ر.س</span></div><button class="delete-btn" onclick="window.deleteAllocation(${idx})">&times;</button></div>`;
  }).join('');
  const warning = document.getElementById('allocationWarning'); const currTotal = document.getElementById('currentTotalPct'); const summary = document.getElementById('allocationSummary');
  if (warning && currTotal && summary) {
    if (totalPct > 100) { warning.style.display = 'block'; currTotal.innerText = totalPct; summary.innerText = `تجاوزت الحد! (المتبقي: ${100 - totalPct}%)`; summary.style.color = 'var(--danger-color)';
    } else { warning.style.display = 'none'; summary.innerText = `إجمالي الموزع: ${totalPct}% | المتبقي: ${100 - totalPct}%`; summary.style.color = 'var(--text-secondary)'; }
  }
};
window.addAllocation = () => { const nameEl = document.getElementById('newAllocName'); const pctEl = document.getElementById('newAllocPct'); const name = nameEl.value.trim(); const pct = parseFloat(pctEl.value) || 0; if (!name) return window.showToast('أدخل اسم البند للتوزيع'); if (!window.appState.allocations) window.appState.allocations = []; window.appState.allocations.push({name, pct}); nameEl.value = ''; pctEl.value = ''; if(document.getElementById('addAllocForm')) document.getElementById('addAllocForm').style.display = 'none'; if(document.getElementById('addAllocPlusBtn')) document.getElementById('addAllocPlusBtn').style.display = 'flex'; window.renderAllocations(); window.autoSave(); };
window.updateAllocation = (idx, field, val) => { if (field === 'pct') val = parseFloat(val) || 0; window.appState.allocations[idx][field] = val; window.renderAllocations(); window.autoSave(); };
window.deleteAllocation = (idx) => { window.appState.allocations.splice(idx, 1); window.renderAllocations(); window.autoSave(); };

window.renderWishlist = function() {
  const container = document.getElementById('wishlistCardsContainer');
  if (!container) return;
  if (!window.appState.wishlist || window.appState.wishlist.length === 0) { container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color:var(--text-secondary); font-size:0.85rem; padding: 20px;">لا توجد أمنيات مضافة حالياً. ادخر لهدفك القادم!</div>'; return; }
  container.innerHTML = window.appState.wishlist.map((w, idx) => {
    const cost = parseFloat(w.cost) || 0; const saved = parseFloat(w.savedAmount) || 0; const pct = cost > 0 ? Math.min(100, Math.round((saved / cost) * 100)) : 0;
    const imgHtml = w.image ? `<img src="${w.image}" style="width: 75px; height: 75px; object-fit: cover; border-radius: 12px; box-shadow: var(--shadow-ios);">` : `<div style="width: 75px; height: 75px; border-radius: 12px; background: var(--bg-primary); display: flex; align-items: center; justify-content: center; font-size: 1.8rem; border: 1px dashed var(--border-color);">🎁</div>`;
    const linkHtml = w.link ? `<a href="${w.link}" target="_blank" style="color: var(--accent-color); font-size: 0.72rem; text-decoration: none; display: flex; align-items: center; gap: 4px; background: var(--bg-primary); padding: 4px 8px; border-radius: 6px;">🔗 رابط</a>` : '';
    const storeHtml = w.store ? `<span style="font-size: 0.72rem; color: var(--text-secondary); background: var(--bg-primary); padding: 4px 8px; border-radius: 6px;">🏪 ${w.store}</span>` : '';
    return `
      <div style="background: var(--bg-glass-strong); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; position: relative;">
        <button class="delete-btn" style="position: absolute; top: 12px; left: 12px; z-index: 2;" onclick="window.deleteWishlistItem(${idx})">&times;</button>
        <div style="display: flex; gap: 14px; margin-bottom: 16px;">
          ${imgHtml}
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 700; font-size: 1.05rem; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-left: 20px;">${w.title}</div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">${storeHtml} ${linkHtml}</div>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; margin-bottom: 8px;">
          <span>المُجَمَّع: <strong style="color: var(--accent-color);">${saved}</strong> ر.س</span>
          <span>الهدف: <strong>${cost}</strong> ر.س</span>
        </div>
        <div class="progress-bar-bg" style="height: 8px; margin-bottom: 12px;"><div class="progress-bar-fill" style="width: ${pct}%;"></div></div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.8rem; font-weight: 700; color: ${pct === 100 ? 'var(--accent-color)' : 'var(--text-secondary)'};">${pct}%</span>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-subtle" style="padding: 4px 12px; font-size: 1rem; font-weight: bold;" onclick="window.updateWishlistAmount(${idx}, -1)">-</button>
            <button class="btn btn-primary" style="padding: 4px 12px; font-size: 1rem; font-weight: bold;" onclick="window.updateWishlistAmount(${idx}, 1)">+</button>
            <button class="btn btn-subtle" style="padding: 4px 10px; font-size: 0.75rem;" onclick="window.promptWishlistAmount(${idx})">تعديل ✏️</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
};
window.addWishlistItem = () => {
  const t = document.getElementById('newWishTitle').value.trim(); const c = document.getElementById('newWishCost').value; const s = document.getElementById('newWishStore').value.trim(); const l = document.getElementById('newWishLink').value.trim(); const fileInput = document.getElementById('newWishImgFile'); const file = fileInput ? fileInput.files[0] : null;
  if (!t) return window.showToast('أدخل اسم الغرض');
  const finalizeAdd = (imgData) => {
    if (!window.appState.wishlist) window.appState.wishlist = []; window.appState.wishlist.push({ title: t, cost: parseFloat(c)||0, store: s, link: l, image: imgData, savedAmount: 0 });
    document.getElementById('newWishTitle').value = ''; document.getElementById('newWishCost').value = ''; document.getElementById('newWishStore').value = ''; document.getElementById('newWishLink').value = ''; if (fileInput) fileInput.value = '';
    if(document.getElementById('addWishForm')) document.getElementById('addWishForm').style.display = 'none'; if(document.getElementById('addWishPlusBtn')) document.getElementById('addWishPlusBtn').style.display = 'flex';
    window.renderLists(); window.autoSave(); window.showToast('تمت الإضافة لقائمة الأمنيات');
  };
  if (file) { if (file.size > 2.5 * 1024 * 1024) return window.showToast('حجم الصورة كبير جداً'); const reader = new FileReader(); reader.onload = (e) => finalizeAdd(e.target.result); reader.readAsDataURL(file); } else { finalizeAdd(''); }
};
window.deleteWishlistItem = (idx) => { if(confirm('هل أنت متأكد من حذف هذه الأمنية؟')) { window.appState.wishlist.splice(idx, 1); window.renderLists(); window.autoSave(); } };
window.updateWishlistAmount = (idx, amount) => { let current = parseFloat(window.appState.wishlist[idx].savedAmount) || 0; let cost = parseFloat(window.appState.wishlist[idx].cost) || 0; current += amount; if(current < 0) current = 0; if(current > cost) current = cost; window.appState.wishlist[idx].savedAmount = current; window.renderLists(); window.autoSave(); };
window.promptWishlistAmount = (idx) => { let current = parseFloat(window.appState.wishlist[idx].savedAmount) || 0; let cost = parseFloat(window.appState.wishlist[idx].cost) || 0; let val = prompt('أدخل المبلغ المُجمّع يدوياً بالريال:', current); if (val !== null) { let parsed = parseFloat(val); if (!isNaN(parsed)) { if(parsed < 0) parsed = 0; if(parsed > cost) parsed = cost; window.appState.wishlist[idx].savedAmount = parsed; window.renderLists(); window.autoSave(); } } };

window.renderMonthlyExpenses = function() {
  const listContainer = document.getElementById('monthlyExpensesList');
  if (!listContainer) return;
  if (!window.appState.monthlyExpenses) window.appState.monthlyExpenses = [];
  let total = 0; let paid = 0;
  listContainer.innerHTML = window.appState.monthlyExpenses.map((exp, i) => {
    const amount = parseFloat(exp.amount) || 0; total += amount; if (exp.paid) paid += amount;
    return `<li class="list-item ${exp.paid ? 'completed' : ''}">
      <div class="item-left"><div class="checkbox" onclick="window.toggleMonthlyExpense(${i})">${exp.paid ? '✓' : ''}</div><input type="text" class="item-text-input" value="${exp.name}" onchange="window.appState.monthlyExpenses[${i}].name=this.value; window.autoSave(); window.renderMonthlyExpenses();"><span style="font-size:0.8rem; font-weight:600; color: ${exp.paid ? 'var(--text-secondary)' : 'var(--danger-color)'}; margin-right: 8px;">${amount} ر.س</span></div>
      <button class="delete-btn" onclick="window.deleteMonthlyExpense(${i})">&times;</button>
    </li>`;
  }).join('');
  if (window.appState.monthlyExpenses.length === 0) { listContainer.innerHTML = '<li style="text-align:center; color:var(--text-secondary); font-size:0.8rem; padding: 10px;">لا توجد مصاريف مضافة.</li>'; }
  const remaining = total - paid; const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const pText = document.getElementById('expenseProgressText'); const rText = document.getElementById('expenseRemainingText'); const tText = document.getElementById('expenseTotalText'); const paidText = document.getElementById('expensePaidText'); const pBar = document.getElementById('expenseProgressBar');
  if(pText) pText.innerText = pct + '%'; if(rText) rText.innerText = remaining; if(tText) tText.innerText = total; if(paidText) paidText.innerText = paid; if(pBar) pBar.style.width = pct + '%';
};
window.addMonthlyExpense = () => { const nEl = document.getElementById('newExpenseName'); const aEl = document.getElementById('newExpenseAmount'); const name = nEl.value.trim(); const amount = parseFloat(aEl.value) || 0; if (!name) return window.showToast('أدخل اسم المصروف'); if (!window.appState.monthlyExpenses) window.appState.monthlyExpenses = []; window.appState.monthlyExpenses.push({ name, amount, paid: false }); nEl.value = ''; aEl.value = ''; if(document.getElementById('addExpenseForm')) document.getElementById('addExpenseForm').style.display = 'none'; if(document.getElementById('addExpensePlusBtn')) document.getElementById('addExpensePlusBtn').style.display = 'flex'; window.renderMonthlyExpenses(); window.autoSave(); };
window.toggleMonthlyExpense = (i) => { window.appState.monthlyExpenses[i].paid = !window.appState.monthlyExpenses[i].paid; window.renderMonthlyExpenses(); window.autoSave(); };
window.deleteMonthlyExpense = (i) => { window.appState.monthlyExpenses.splice(i, 1); window.renderMonthlyExpenses(); window.autoSave(); };

window.renderLists = function() {
  window.renderVisionBoard(); window.renderKanbanBoard(); window.renderBanksList(); 
  if (window.currentBankIndex !== null) window.renderBankDetailsView();
  window.renderAllocations(); window.renderWishlist(); window.renderMonthlyExpenses(); 
  document.getElementById('habitsList').innerHTML = (window.appState.habits || []).map((h, i) => `<li class="list-item ${h.done ? 'completed' : ''}"><div class="item-left"><div class="checkbox" onclick="window.toggleHabit(${i})">${h.done ? '✓' : ''}</div><input type="text" class="item-text-input" value="${h.text}" onchange="window.appState.habits[${i}].text=this.value; window.autoSave()"></div><button class="delete-btn" onclick="window.appState.habits.splice(${i},1); window.renderLists(); window.autoSave()">&times;</button></li>`).join('');
  document.getElementById('subscriptionsList').innerHTML = (window.appState.subscriptions || []).map((s, i) => `<li class="list-item"><div class="item-left"><input type="text" class="item-text-input" value="${s.name}" onchange="window.appState.subscriptions[${i}].name=this.value; window.autoSave()"><span style="font-size:0.8rem; font-weight:600;">${s.cost} ر.س</span></div><button class="delete-btn" onclick="window.appState.subscriptions.splice(${i},1); window.renderLists(); window.autoSave()">&times;</button></li>`).join('');
};
window.toggleHabit = (i) => { window.appState.habits[i].done = !window.appState.habits[i].done; window.renderLists(); window.autoSave(); };
window.addHabit = () => { if (!window.userProfile?.isPro && (window.appState.habits || []).length >= 3) { window.showToast('النسخة المجانية تتيح 3 عادات.'); window.openModal('pricingModal'); return; } const el = document.getElementById('newHabitInput'); if(!el.value.trim()) return; window.appState.habits.push({text:el.value.trim(), done:false}); el.value=''; if(document.getElementById('addHabitForm')) document.getElementById('addHabitForm').style.display = 'none'; if(document.getElementById('addHabitPlusBtn')) document.getElementById('addHabitPlusBtn').style.display = 'flex'; window.renderLists(); window.autoSave(); };
window.addSubscription = () => { const n = document.getElementById('newSubName'); const c = document.getElementById('newSubCost'); if(!n.value.trim())return; window.appState.subscriptions.push({name:n.value.trim(), cost:parseFloat(c.value)||0}); n.value=''; c.value=''; if(document.getElementById('addSubForm')) document.getElementById('addSubForm').style.display = 'none'; if(document.getElementById('addSubPlusBtn')) document.getElementById('addSubPlusBtn').style.display = 'flex'; window.renderLists(); window.autoSave(); };
window.calculateDistribution = () => { window.renderAllocations(); };

window.currentActiveNoteId = null;
window.renderNotesList = function() {
  if (!window.appState.notes) window.appState.notes = []; const listContainer = document.getElementById('notesListView'); if (!listContainer) return;
  if (window.appState.notes.length === 0) { listContainer.innerHTML = '<div style="text-align:center; color:var(--text-secondary); padding:60px 20px; font-size:0.95rem;">لا توجد تدوينات.<br>اضغط على 📝 لإنشاء تدوينة جديدة.</div>'; return; }
  const sortedNotes = [...window.appState.notes].sort((a, b) => b.updatedAt - a.updatedAt);
  listContainer.innerHTML = sortedNotes.map(note => {
    const dateObj = new Date(note.updatedAt); const dateStr = dateObj.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
    const tempDiv = document.createElement('div'); tempDiv.innerHTML = note.content || 'تدوينة جديدة'; let rawText = tempDiv.textContent || tempDiv.innerText || '';
    const title = rawText.split('\n')[0].substring(0, 30) || 'بدون عنوان';
    let snippet = rawText.replace(title, '').trim().substring(0, 40); if(snippet.length >= 40) snippet += '...'; if(snippet === '') snippet = 'لا يوجد نص إضافي';
    return `<div class="note-list-item" onclick="window.openNote('${note.id}')"><div style="font-weight: 700; font-size: 1rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${title}</div><div style="display: flex; gap: 10px; font-size: 0.85rem; color: var(--text-secondary);"><span style="font-weight: 500;">${dateStr}</span><span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0.8;">${snippet}</span></div></div>`;
  }).join('');
};
window.showNotesList = function() { document.getElementById('notesListView').style.display = 'block'; document.getElementById('noteEditorView').style.display = 'none'; window.currentActiveNoteId = null; window.renderNotesList(); };
window.createNewNote = function() { if (!window.appState.notes) window.appState.notes = []; const newNote = { id: 'note_' + Date.now(), content: '', updatedAt: Date.now() }; window.appState.notes.unshift(newNote); window.autoSave(); window.openNote(newNote.id); };
window.openNote = function(id) { window.currentActiveNoteId = id; const note = window.appState.notes.find(n => n.id === id); if (!note) return; document.getElementById('notesListView').style.display = 'none'; document.getElementById('noteEditorView').style.display = 'flex'; const dateObj = new Date(note.updatedAt); const timeStr = dateObj.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }); const dateStr = dateObj.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', year: 'numeric' }); document.getElementById('currentNoteDate').innerText = `${dateStr} في ${timeStr}`; const editor = document.getElementById('noteContentEditable'); editor.innerHTML = note.content; setTimeout(() => { editor.focus(); if (typeof window.getSelection !== "undefined" && typeof document.createRange !== "undefined") { const range = document.createRange(); range.selectNodeContents(editor); range.collapse(false); const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); } }, 50); };
window.autoSaveNote = function() { if (!window.currentActiveNoteId) return; const noteIndex = window.appState.notes.findIndex(n => n.id === window.currentActiveNoteId); if (noteIndex > -1) { const editor = document.getElementById('noteContentEditable'); window.appState.notes[noteIndex].content = editor.innerHTML; window.appState.notes[noteIndex].updatedAt = Date.now(); window.autoSave(); } };
window.deleteCurrentNote = function() { if (!window.currentActiveNoteId) return; if (confirm('هل أنت متأكد من حذف هذه التدوينة نهائياً؟')) { window.appState.notes = window.appState.notes.filter(n => n.id !== window.currentActiveNoteId); window.autoSave(); window.showNotesList(); } };
window.addNoteImage = function(event) { const file = event.target.files[0]; if (!file) return; if (file.size > 2.5 * 1024 * 1024) return window.showToast('حجم الصورة كبير جداً.'); const reader = new FileReader(); reader.onload = function(e) { const imgTag = `<br><img src="${e.target.result}"><br>`; const editor = document.getElementById('noteContentEditable'); editor.innerHTML += imgTag; window.autoSaveNote(); editor.scrollTop = editor.scrollHeight; }; reader.readAsDataURL(file); event.target.value = ''; };
setTimeout(() => { if (window.renderNotesList) window.renderNotesList(); }, 800);
