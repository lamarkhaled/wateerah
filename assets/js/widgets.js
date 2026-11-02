// --- ضغط الصور لرفعها من الجوال بسرعة وبدون مشاكل ---
window.compressAndAddVision = function(file, title, date) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function(event) {
        const img = new Image();
        img.src = event.target.result;
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800; const MAX_HEIGHT = 800;
            let width = img.width; let height = img.height;

            if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
            } else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
            
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.6); // ضغط الصورة لـ 60%
            saveVisionToState(title, date, dataUrl);
        }
    }
};

window.addVisionItem = function() {
    const title = document.getElementById('newVisionTitle').value.trim();
    const date = document.getElementById('newVisionDate').value;
    const fileInput = document.getElementById('newVisionImgFile');

    if (!title) return window.showToast('الرجاء إدخال عنوان الهدف');

    if (fileInput.files && fileInput.files[0]) {
        window.compressAndAddVision(fileInput.files[0], title, date);
    } else {
        saveVisionToState(title, date, '');
    }
};

function saveVisionToState(title, date, imgData) {
    if (!window.appState.visionBoard) window.appState.visionBoard = [];
    window.appState.visionBoard.push({ title, date, img: imgData, plan: '', tasks: [], progress: 0 });
    
    document.getElementById('newVisionTitle').value = '';
    document.getElementById('newVisionDate').value = '';
    document.getElementById('newVisionImgFile').value = '';
    const imgText = document.getElementById('visionImgText');
    if(imgText) imgText.innerText = '📷 إرفاق صورة';
    const imgLabel = document.getElementById('visionImgLabel');
    if(imgLabel) {
        imgLabel.style.borderColor = 'var(--border-color)';
        imgLabel.style.color = 'var(--text-secondary)';
    }
    window.renderVisionBoard();
    window.autoSave();
}

window.renderVisionBoard = function() {
    if (!window.appState.visionBoard) window.appState.visionBoard = [];
    const container = document.getElementById('corkboardContainer');
    if (!container) return;

    container.innerHTML = window.appState.visionBoard.map((item, idx) => {
        const imgHtml = item.img ? `<img src="${item.img}" style="width:100%; height:120px; object-fit:cover; border-radius:8px; margin-bottom:8px;">` : `<div style="width:100%; height:80px; background:var(--bg-primary); border-radius:8px; margin-bottom:8px; display:flex; align-items:center; justify-content:center; color:var(--text-secondary);">بدون صورة</div>`;
        return `
        <div class="vision-pin-card" onclick="window.openVisionDetail(${idx})" style="background:var(--bg-subtle); padding:12px; border-radius:12px; border:1px solid var(--border-color); cursor:pointer;">
            ${imgHtml}
            <div style="font-weight:bold; font-size:0.95rem;">${item.title}</div>
            <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:4px;">${item.date || 'بدون تاريخ'}</div>
        </div>`;
    }).join('');
};

window.openVisionDetail = function(idx) {
    window.activeVisionIndex = idx;
    const item = window.appState.visionBoard[idx];
    document.getElementById('vModalTitle').innerText = item.title;
    document.getElementById('vModalDate').value = item.date || '';
    document.getElementById('vModalPlan').value = item.plan || '';
    const imgEl = document.getElementById('vModalImg');
    if (item.img) { imgEl.src = item.img; imgEl.style.display = 'block'; }
    else { imgEl.style.display = 'none'; }
    window.renderVisionTasks();
    window.openModal('visionDetailModal');
};

window.saveVisionModalChanges = () => {
    if (window.activeVisionIndex === null) return;
    const item = window.appState.visionBoard[window.activeVisionIndex];
    item.date = document.getElementById('vModalDate').value;
    item.plan = document.getElementById('vModalPlan').value;
    window.renderVisionBoard(); window.autoSave();
};

window.deleteCurrentVisionItem = () => {
    if (window.activeVisionIndex === null) return;
    window.appState.visionBoard.splice(window.activeVisionIndex, 1);
    window.closeModal('visionDetailModal');
    window.renderVisionBoard(); window.autoSave();
};

window.addVisionSubTask = () => {
    if (window.activeVisionIndex === null) return;
    const input = document.getElementById('vModalNewTaskInput');
    const txt = input.value.trim();
    if (!txt) return;
    const item = window.appState.visionBoard[window.activeVisionIndex];
    if (!item.tasks) item.tasks = [];
    item.tasks.push({ text: txt, done: false });
    input.value = '';
    window.renderVisionTasks(); window.autoSave();
};

window.renderVisionTasks = () => {
    if (window.activeVisionIndex === null) return;
    const item = window.appState.visionBoard[window.activeVisionIndex];
    const list = document.getElementById('vModalTasksList');
    if(!list) return;
    
    let completed = 0;
    list.innerHTML = (item.tasks || []).map((t, idx) => {
        if(t.done) completed++;
        return `
        <li class="list-item" style="padding: 6px; margin-bottom: 6px; background: transparent; border: 1px dashed var(--border-color);">
            <div class="item-left" style="display:flex; align-items:center; gap:8px;">
                <div class="checkbox" onclick="window.toggleVisionSubTask(${idx})">${t.done ? '✓' : ''}</div>
                <span style="${t.done ? 'text-decoration:line-through; color:var(--text-secondary);' : ''}">${t.text}</span>
            </div>
            <button class="delete-btn" onclick="window.deleteVisionSubTask(${idx})">&times;</button>
        </li>`;
    }).join('');

    const pct = item.tasks && item.tasks.length > 0 ? Math.round((completed / item.tasks.length) * 100) : 0;
    document.getElementById('vModalProgressBar').style.width = `${pct}%`;
    document.getElementById('vModalPercentBadge').innerText = `${pct}% مكتمل`;
};

window.toggleVisionSubTask = (idx) => {
    const item = window.appState.visionBoard[window.activeVisionIndex];
    item.tasks[idx].done = !item.tasks[idx].done;
    window.renderVisionTasks(); window.autoSave();
};

window.deleteVisionSubTask = (idx) => {
    const item = window.appState.visionBoard[window.activeVisionIndex];
    item.tasks.splice(idx, 1);
    window.renderVisionTasks(); window.autoSave();
};

// --- العادات ---
window.addHabit = () => {
    const input = document.getElementById('newHabitInput');
    const v = input.value.trim();
    if (!v) return;
    if (!window.appState.habits) window.appState.habits = [];
    window.appState.habits.push({ text: v, done: false });
    input.value = '';
    window.renderLists(); window.autoSave();
};

window.deleteHabit = (idx) => { window.appState.habits.splice(idx, 1); window.renderLists(); window.autoSave(); };
window.toggleHabit = (idx) => { window.appState.habits[idx].done = !window.appState.habits[idx].done; window.renderLists(); window.autoSave(); };

window.renderLists = () => {
    const habitsList = document.getElementById('habitsList');
    if(habitsList) {
        habitsList.innerHTML = (window.appState.habits || []).map((h, idx) => `
            <li class="list-item ${h.done ? 'completed' : ''}" style="background:var(--bg-subtle);">
                <div class="item-left">
                    <div class="checkbox" onclick="window.toggleHabit(${idx})">${h.done ? '✓' : ''}</div>
                    <span>${h.text}</span>
                </div>
                <button class="delete-btn" onclick="window.deleteHabit(${idx})">&times;</button>
            </li>
        `).join('');
    }
    
    // توزيع الميزانية إذا كان في واجهة المالية
    const totalInput = document.getElementById('totalIncomeInput');
    const distGrid = document.getElementById('distributionResults');
    if (totalInput && distGrid) {
        const total = parseFloat(totalInput.value) || 0;
        const dist = [
            { label: 'الاحتياجات (50%)', val: total * 0.5, color: '#3b82f6' },
            { label: 'الرغبات (30%)', val: total * 0.3, color: '#f59e0b' },
            { label: 'الادخار/الاستثمار (20%)', val: total * 0.2, color: '#10b981' }
        ];
        distGrid.innerHTML = dist.map(d => `
            <div style="background:var(--bg-subtle); padding:10px; border-radius:12px; border:1px solid var(--border-color); text-align:center;">
                <div style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:4px;">${d.label}</div>
                <div style="font-size:1.05rem; font-weight:bold; color:${d.color}; direction:ltr;">${d.val.toFixed(2)}</div>
            </div>
        `).join('');
    }
};

// --- الأعمال (البزنس) ---
window.renderBusinessWidget = () => {
    if (!window.appState.business) window.appState.business = { projects: [], campaigns: [] };
    const pCount = window.appState.business.projects.length;
    const cCount = window.appState.business.campaigns.length;
    let income = 0;
    window.appState.business.projects.forEach(p => { income += parseFloat(p.price) || 0; });
    
    const summaryCard = document.getElementById('businessSummaryCard');
    if (summaryCard) {
        summaryCard.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:16px;">
                <div style="background:var(--bg-subtle); padding:16px; border-radius:12px; flex:1; margin-left:8px; text-align:center; border:1px solid var(--border-color);">
                    <div style="font-size:1.8rem; margin-bottom:4px;">${pCount}</div>
                    <div style="font-size:0.8rem; color:var(--text-secondary);">مشاريع نشطة</div>
                </div>
                <div style="background:var(--bg-subtle); padding:16px; border-radius:12px; flex:1; text-align:center; border:1px solid var(--border-color);">
                    <div style="font-size:1.8rem; margin-bottom:4px; color:var(--accent-color);">${income}</div>
                    <div style="font-size:0.8rem; color:var(--text-secondary);">إيرادات متوقعة</div>
                </div>
            </div>
            <button class="btn btn-primary" style="width:100%; justify-content:center;" onclick="window.openPage('businessDetailsPage')">إدارة الأعمال والتفاصيل</button>
        `;
    }
};

window.renderBusinessDetailsView = () => {
    const pList = document.getElementById('businessProjectsList');
    const cList = document.getElementById('businessCampaignsList');
    
    if (pList) {
        pList.innerHTML = window.appState.business.projects.map((p, idx) => `
            <li class="list-item" style="padding:12px; margin-bottom:8px; border-radius:12px; background:var(--bg-subtle);">
                <div style="display:flex; flex-direction:column; gap:4px;">
                    <span style="font-weight:bold;">${p.name}</span>
                    <span style="font-size:0.75rem; color:var(--text-secondary);">${p.type} | التسليم: ${p.date || 'غير محدد'}</span>
                </div>
                <div style="display:flex; align-items:center; gap:12px;">
                    <span style="font-weight:bold; color:var(--accent-color);">${p.price} ر.س</span>
                    <button class="delete-btn" onclick="window.deleteBusinessProject(${idx})">&times;</button>
                </div>
            </li>
        `).join('') || '<div style="font-size:0.8rem; color:var(--text-secondary); text-align:center; padding:10px;">لا توجد مشاريع حالياً</div>';
    }
    
    if (cList) {
        cList.innerHTML = window.appState.business.campaigns.map((c, idx) => `
            <li class="list-item" style="padding:12px; margin-bottom:8px; border-radius:12px; background:var(--bg-subtle);">
                <div style="display:flex; flex-direction:column; gap:4px;">
                    <span style="font-weight:bold;">${c.name}</span>
                    <span style="font-size:0.75rem; color:var(--text-secondary);">النشر: ${c.date || 'غير محدد'}</span>
                </div>
                <div style="display:flex; align-items:center; gap:12px;">
                    <span style="font-size:0.75rem; padding:4px 8px; border-radius:8px; background:var(--bg-primary);">${c.platform}</span>
                    <button class="delete-btn" onclick="window.deleteBusinessCampaign(${idx})">&times;</button>
                </div>
            </li>
        `).join('') || '<div style="font-size:0.8rem; color:var(--text-secondary); text-align:center; padding:10px;">لا توجد حملات حالياً</div>';
    }
};

window.closeBusinessDetails = () => { window.openPage('widget-business'); };
window.addBusinessProject = () => {
    const name = document.getElementById('newProjectName').value.trim();
    const type = document.getElementById('newProjectType').value;
    const price = document.getElementById('newProjectPrice').value;
    const date = document.getElementById('newProjectDate').value;
    if(!name) return;
    window.appState.business.projects.push({name, type, price, date});
    document.getElementById('newProjectName').value=''; document.getElementById('newProjectPrice').value=''; document.getElementById('newProjectDate').value='';
    window.renderBusinessDetailsView(); window.renderBusinessWidget(); window.autoSave();
};
window.deleteBusinessProject = (idx) => { window.appState.business.projects.splice(idx,1); window.renderBusinessDetailsView(); window.renderBusinessWidget(); window.autoSave(); };
window.addBusinessCampaign = () => {
    const name = document.getElementById('newCampaignName').value.trim();
    const platform = document.getElementById('newCampaignPlatform').value;
    const date = document.getElementById('newCampaignDate').value;
    if(!name) return;
    window.appState.business.campaigns.push({name, platform, date});
    document.getElementById('newCampaignName').value=''; document.getElementById('newCampaignDate').value='';
    window.renderBusinessDetailsView(); window.renderBusinessWidget(); window.autoSave();
};
window.deleteBusinessCampaign = (idx) => { window.appState.business.campaigns.splice(idx,1); window.renderBusinessDetailsView(); window.renderBusinessWidget(); window.autoSave(); };

// --- البنوك ---
window.renderBanks = () => {
    if(!window.appState.banks) window.appState.banks = [];
    const container = document.getElementById('banksContainer');
    let total = 0;
    if(container) {
        container.innerHTML = window.appState.banks.map((b, idx) => {
            total += parseFloat(b.balance) || 0;
            return `<div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:var(--bg-subtle); border-radius:12px; border:1px solid var(--border-color);">
                <span style="font-weight:600;">${b.name}</span>
                <div style="display:flex; align-items:center; gap:8px;">
                    <input type="number" value="${b.balance}" onchange="window.updateBankBalance(${idx}, this.value)" style="width:80px; padding:6px; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-primary);">
                    <button class="delete-btn" onclick="window.deleteBank(${idx})">&times;</button>
                </div>
            </div>`;
        }).join('');
    }
    const overview = document.getElementById('banksTotalOverview');
    if(overview) overview.innerText = `مجموع الأرصدة: ${total} ر.س`;
};
window.addBank = () => { const name = document.getElementById('newBankName').value.trim(); if(!name) return; if(!window.appState.banks) window.appState.banks = []; window.appState.banks.push({ name, balance: 0 }); document.getElementById('newBankName').value = ''; window.renderBanks(); window.autoSave(); };
window.updateBankBalance = (idx, val) => { window.appState.banks[idx].balance = val; window.renderBanks(); window.autoSave(); };
window.deleteBank = (idx) => { window.appState.banks.splice(idx, 1); window.renderBanks(); window.autoSave(); };

// --- الاشتراكات ---
window.renderSubscriptions = () => {
    if(!window.appState.subscriptions) window.appState.subscriptions = [];
    const list = document.getElementById('subscriptionsList');
    if(list) {
        list.innerHTML = window.appState.subscriptions.map((s, idx) => `
            <li class="list-item" style="padding:10px 14px; background:transparent; border-bottom:1px dashed var(--border-color); border-radius:0;">
                <span style="font-weight:600; font-size:0.85rem;">${s.name}</span>
                <div style="display:flex; align-items:center; gap:12px;">
                    <span style="font-weight:bold; font-size:0.85rem;">${s.cost} ر.س</span>
                    <button class="delete-btn" onclick="window.deleteSubscription(${idx})">&times;</button>
                </div>
            </li>
        `).join('') || '<div style="font-size:0.8rem; color:var(--text-secondary); text-align:center; padding:10px;">لا توجد اشتراكات</div>';
    }
};
window.addSubscription = () => {
    const name = document.getElementById('newSubName').value.trim();
    const cost = document.getElementById('newSubCost').value;
    if(!name || !cost) return;
    if(!window.appState.subscriptions) window.appState.subscriptions = [];
    window.appState.subscriptions.push({name, cost: parseFloat(cost)||0});
    document.getElementById('newSubName').value = ''; document.getElementById('newSubCost').value = '';
    window.renderSubscriptions(); window.autoSave();
};
window.deleteSubscription = (idx) => { window.appState.subscriptions.splice(idx,1); window.renderSubscriptions(); window.autoSave(); };

// --- الكانبان ---
window.renderKanbanBoard = function() {
  if (!window.appState.kanbanTasks) window.appState.kanbanTasks = [];
  const cols = { idea: [], scheduled: [], progress: [], done: [] };
  window.appState.kanbanTasks.forEach((task, idx) => { const st = cols[task.status] ? task.status : 'idea'; cols[st].push({ ...task, idx }); });

  const priorityLabel = { do: 'عاجل ومهم', schedule: 'جدولها', delegate: 'تفوّيض', drop: 'غير مهم' };
  const priorityStyle = {
      do: 'background:#fee2e2; color:#ef4444; padding:2px 8px; border-radius:12px; font-size:0.75rem; font-weight:bold;',
      schedule: 'background:#e0f2fe; color:#3b82f6; padding:2px 8px; border-radius:12px; font-size:0.75rem; font-weight:bold;',
      delegate: 'background:#fef3c7; color:#f59e0b; padding:2px 8px; border-radius:12px; font-size:0.75rem; font-weight:bold;',
      drop: 'background:#f3f4f6; color:#6b7280; padding:2px 8px; border-radius:12px; font-size:0.75rem; font-weight:bold;'
  };

  ['idea', 'scheduled', 'progress', 'done'].forEach(colKey => {
    const countEl = document.getElementById(`count-${colKey}`);
    const wrapEl = document.getElementById(`col-${colKey}`);
    if(countEl) countEl.innerText = cols[colKey].length;
    if(wrapEl) {
      wrapEl.innerHTML = cols[colKey].map(item => `
        <div class="kanban-card" draggable="true" ondragstart="window.dragKanbanCard(event, ${item.idx})">
          <div class="kanban-card-title">${item.title}</div>
          <div class="kanban-badges" style="display:flex; gap:6px; margin-top:8px;">
            <span style="${priorityStyle[item.priority] || priorityStyle['schedule']}">${priorityLabel[item.priority] || 'مهم ومجدول'}</span>
            ${item.date ? `<span style="background:var(--bg-subtle); color:var(--text-secondary); padding:2px 8px; border-radius:12px; font-size:0.75rem;">${item.date}</span>` : ''}
          </div>
          <div class="kanban-card-footer" style="margin-top:12px; display:flex; justify-content:space-between; align-items:center;">
            <select style="font-size:0.75rem; padding:4px; border-radius:4px;" onchange="window.changeKanbanStatus(${item.idx}, this.value)">
                <option value="idea" ${item.status==='idea'?'selected':''}>فكرة</option>
                <option value="scheduled" ${item.status==='scheduled'?'selected':''}>مجدول</option>
                <option value="progress" ${item.status==='progress'?'selected':''}>تنفيذ</option>
                <option value="done" ${item.status==='done'?'selected':''}>مكتمل</option>
            </select>
            <button class="delete-btn" onclick="window.deleteKanbanTask(${item.idx})">&times;</button>
          </div>
        </div>`).join('');
    }
  });
};

window.addKanbanTask = () => {
  const title = document.getElementById('newKanbanTitle').value.trim(); 
  const status = document.getElementById('newKanbanStatus').value; 
  const priority = document.getElementById('newKanbanPriority').value; 
  const date = document.getElementById('newKanbanDate').value;
  if (!title) return window.showToast('أدخل عنوان المهمة');
  if (!window.appState.kanbanTasks) window.appState.kanbanTasks = [];
  window.appState.kanbanTasks.push({ title, status, priority, date }); 
  document.getElementById('newKanbanTitle').value = ''; 
  window.renderKanbanBoard(); window.autoSave();
};

window.changeKanbanStatus = (idx, newStatus) => { window.appState.kanbanTasks[idx].status = newStatus; window.renderKanbanBoard(); window.autoSave(); };
window.deleteKanbanTask = (idx) => { window.appState.kanbanTasks.splice(idx, 1); window.renderKanbanBoard(); window.autoSave(); };
window.dragKanbanCard = (e, idx) => { e.stopPropagation(); window.draggedKanbanIndex = idx; };
window.allowKanbanDrop = (e) => { e.preventDefault(); };
window.dropKanbanCard = (e, targetStatus) => { e.preventDefault(); if (window.draggedKanbanIndex === null) return; window.appState.kanbanTasks[window.draggedKanbanIndex].status = targetStatus; window.draggedKanbanIndex = null; window.renderKanbanBoard(); window.autoSave(); };
