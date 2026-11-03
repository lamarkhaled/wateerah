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
            const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
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
        <li class="list-item" style="padding: 10px 14px; background: transparent; border-bottom: 1px dashed var(--border-color); border-radius: 0;">
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

window.renderCareRoutines = () => {
    const state = window.appState.dailyRecords[window.currentDateStr] || {};
    const hList = state.healthRoutine || [];
    const sList = state.skinRoutine || [];

    const renderList = (list, type) => list.map((item, idx) => `
        <li class="list-item ${item.done ? 'completed' : ''}" style="padding: 10px 14px; background: transparent; border-bottom: 1px dashed var(--border-color); border-radius: 0;">
            <div class="item-left">
                <div class="checkbox" onclick="window.toggleCareRoutine('${type}', ${idx})">${item.done ? '✓' : ''}</div>
                <span style="font-size: 0.85rem;">${item.text}</span>
            </div>
            <button class="delete-btn" onclick="window.deleteCareRoutine('${type}', ${idx})">&times;</button>
        </li>
    `).join('');

    const hEl = document.getElementById('healthRoutineList');
    const sEl = document.getElementById('skinRoutineList');
    if(hEl) hEl.innerHTML = renderList(hList, 'health') || '<div style="font-size:0.8rem; color:var(--text-secondary); text-align:center;">القائمة فارغة</div>';
    if(sEl) sEl.innerHTML = renderList(sList, 'skin') || '<div style="font-size:0.8rem; color:var(--text-secondary); text-align:center;">القائمة فارغة</div>';
};

window.addCareRoutine = (type) => {
    const input = document.getElementById(type === 'health' ? 'newHealthTask' : 'newSkinTask');
    if(!input) return;
    const val = input.value.trim();
    if(!val) return;
    const state = window.appState.dailyRecords[window.currentDateStr];
    if(type === 'health') {
        if(!state.healthRoutine) state.healthRoutine = [];
        state.healthRoutine.push({text: val, done: false});
    } else {
        if(!state.skinRoutine) state.skinRoutine = [];
        state.skinRoutine.push({text: val, done: false});
    }
    input.value = '';
    document.getElementById(type === 'health' ? 'addHealthForm' : 'addSkinForm').style.display = 'none';
    document.getElementById(type === 'health' ? 'addHealthPlusBtn' : 'addSkinPlusBtn').style.display = 'flex';
    window.renderCareRoutines();
    window.autoSave();
};

window.toggleCareRoutine = (type, idx) => {
    const state = window.appState.dailyRecords[window.currentDateStr];
    const list = type === 'health' ? state.healthRoutine : state.skinRoutine;
    list[idx].done = !list[idx].done;
    window.renderCareRoutines();
    window.autoSave();
};

window.deleteCareRoutine = (type, idx) => {
    const state = window.appState.dailyRecords[window.currentDateStr];
    const list = type === 'health' ? state.healthRoutine : state.skinRoutine;
    list.splice(idx, 1);
    window.renderCareRoutines();
    window.autoSave();
};

window.renderMatrix = () => {
    if (!window.appState.matrixTasks) window.appState.matrixTasks = [];
    const doEl = document.getElementById('matrix-do');
    const scheduleEl = document.getElementById('matrix-schedule');
    const delegateEl = document.getElementById('matrix-delegate');
    const dropEl = document.getElementById('matrix-drop');

    if(!doEl) return;
    doEl.innerHTML = ''; scheduleEl.innerHTML = ''; delegateEl.innerHTML = ''; dropEl.innerHTML = '';
    
    let counts = { do: 0, schedule: 0, delegate: 0, drop: 0 };

    window.appState.matrixTasks.forEach((task, idx) => {
        counts[task.type]++;
        const html = `
            <li class="list-item" style="padding: 10px 14px; margin-bottom: 6px; background: transparent; border-bottom: 1px dashed var(--border-color); border-radius:0;">
                <div class="item-left" style="font-size: 0.85rem;">${task.text}</div>
                <button class="delete-btn" onclick="window.deleteMatrixTask(${idx})">&times;</button>
            </li>
        `;
        if (task.type === 'do') doEl.innerHTML += html;
        if (task.type === 'schedule') scheduleEl.innerHTML += html;
        if (task.type === 'delegate') delegateEl.innerHTML += html;
        if (task.type === 'drop') dropEl.innerHTML += html;
    });

    ['do', 'schedule', 'delegate', 'drop'].forEach(key => {
        const cEl = document.getElementById(`count-${key}`);
        if(cEl) cEl.innerText = counts[key];
    });
};

window.addMatrixTask = () => {
    const textEl = document.getElementById('newMatrixTitle');
    const typeEl = document.getElementById('newMatrixType');
    if(!textEl.value.trim()) return;
    
    if (!window.appState.matrixTasks) window.appState.matrixTasks = [];
    window.appState.matrixTasks.push({ text: textEl.value.trim(), type: typeEl.value });
    
    textEl.value = '';
    document.getElementById('addMatrixForm').style.display = 'none';
    document.getElementById('addMatrixPlusBtn').style.display = 'flex';
    window.renderMatrix();
    window.autoSave();
};

window.deleteMatrixTask = (idx) => {
    window.appState.matrixTasks.splice(idx, 1);
    window.renderMatrix();
    window.autoSave();
};

window.activeBankIndex = null;

// دالة عرض البنوك بالتصميم الناعم والأنيق
window.renderBanks = () => {
    if(!window.appState.banks) window.appState.banks = [];
    const container = document.getElementById('banksContainer');
    let totalAllBanks = 0;
    
    if(container) {
        container.innerHTML = window.appState.banks.map((b, idx) => {
            let bankTotal = 0;
            (b.accounts || []).forEach(acc => bankTotal += parseFloat(acc.balance) || 0);
            (b.transactions || []).forEach(tx => {
                if (tx.type === 'in') bankTotal += parseFloat(tx.amount) || 0;
                if (tx.type === 'out') bankTotal -= parseFloat(tx.amount) || 0;
            });
            totalAllBanks += bankTotal;
            
            return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--bg-subtle); border-radius: 16px; border: none; cursor: pointer; transition: transform 0.2s;" onclick="window.openBankDetails(${idx})">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 40px; height: 40px; background: #fff; border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.05); font-size: 1.2rem;">🏦</div>
                    <span style="font-weight: 600; font-size: 1rem;">${b.name}</span>
                </div>
                <div style="display:flex; align-items:center; gap:16px;">
                    <span style="font-weight: bold; font-size: 1.05rem;">${bankTotal} ر.س</span>
                    <button class="delete-btn" style="background: rgba(239, 68, 68, 0.1); border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;" onclick="event.stopPropagation(); window.deleteBank(${idx})">&times;</button>
                </div>
            </div>`;
        }).join('') || '<div style="font-size:0.85rem; color:var(--text-secondary); text-align:center; padding:20px; background: var(--bg-subtle); border-radius: 16px;">لا توجد بنوك مسجلة</div>';
    }
    const overview = document.getElementById('banksTotalOverview');
    if(overview) overview.innerText = `مجموع الأرصدة: ${totalAllBanks} ر.س`;
};

window.addBank = () => {
    const name = document.getElementById('newBankName').value.trim();
    if(!name) return window.showToast('الرجاء كتابة اسم البنك');
    if(!window.appState.banks) window.appState.banks = [];
    window.appState.banks.push({ name, accounts: [], transactions: [] });
    document.getElementById('newBankName').value = '';
    document.getElementById('addBankForm').style.display = 'none';
    document.getElementById('addBankPlusBtn').style.display = 'flex';
    window.renderBanks();
    window.autoSave();
};

window.deleteBank = (idx) => {
    window.appState.banks.splice(idx, 1);
    window.renderBanks();
    window.autoSave();
};

window.openBankDetails = (idx) => {
    window.activeBankIndex = idx;
    const bank = window.appState.banks[idx];
    document.getElementById('activeBankTitle').innerText = bank.name;
    document.getElementById('widget-finance').style.display = 'none';
    document.getElementById('widget-finance').classList.add('hidden-el');
    document.getElementById('bankDetailsPage').style.display = 'block';
    document.getElementById('bankDetailsPage').classList.remove('hidden-el');
    window.renderBankDetailsView();
};

window.closeBankDetails = () => {
    window.activeBankIndex = null;
    document.getElementById('bankDetailsPage').style.display = 'none';
    document.getElementById('bankDetailsPage').classList.add('hidden-el');
    document.getElementById('widget-finance').style.display = 'block';
    document.getElementById('widget-finance').classList.remove('hidden-el');
    window.renderBanks();
};

// تصميم الحسابات الفرعية الناعم
window.renderBankDetailsView = () => {
    if(window.activeBankIndex === null) return;
    const bank = window.appState.banks[window.activeBankIndex];
    
    const accList = document.getElementById('bankAccountsList');
    if(accList) {
        accList.innerHTML = (bank.accounts || []).map((acc, idx) => `
            <li style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--bg-subtle); border-radius: 16px; margin-bottom: 12px;">
                <span style="font-weight:600; font-size: 0.95rem;">${acc.name}</span>
                <div style="display:flex; align-items:center; gap:16px;">
                    <span style="font-weight:bold; font-size: 1.05rem; color:var(--text-primary);">${acc.balance} ر.س</span>
                    <button class="delete-btn" style="background: rgba(239, 68, 68, 0.1); border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;" onclick="window.deleteBankAccount(${idx})">&times;</button>
                </div>
            </li>
        `).join('') || '<div style="font-size:0.85rem; color:var(--text-secondary); text-align:center; padding:20px; background: var(--bg-subtle); border-radius: 16px;">لا توجد حسابات فرعية</div>';
    }
    
    const txList = document.getElementById('bankTransactionsList');
    if(txList) {
        txList.innerHTML = (bank.transactions || []).map((tx, idx) => {
            const color = tx.type === 'in' ? '#22c55e' : '#ef4444';
            const sign = tx.type === 'in' ? '+' : '-';
            return `
            <li style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--bg-subtle); border-radius: 16px; margin-bottom: 12px;">
                <span style="font-weight:600; font-size: 0.95rem;">${tx.desc}</span>
                <div style="display:flex; align-items:center; gap:16px;">
                    <span style="font-weight:bold; font-size: 1.05rem; color:${color}; direction:ltr;">${sign}${tx.amount} ر.س</span>
                    <button class="delete-btn" style="background: rgba(239, 68, 68, 0.1); border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;" onclick="window.deleteBankTransaction(${idx})">&times;</button>
                </div>
            </li>
            `;
        }).join('') || '<div style="font-size:0.85rem; color:var(--text-secondary); text-align:center; padding:20px; background: var(--bg-subtle); border-radius: 16px;">لا توجد حركات مسجلة</div>';
    }
};

window.addBankAccount = () => {
    if(window.activeBankIndex === null) return;
    const name = document.getElementById('newBankAccountName').value.trim();
    const bal = parseFloat(document.getElementById('newBankAccountBalance').value) || 0;
    if(!name) return;
    const bank = window.appState.banks[window.activeBankIndex];
    if(!bank.accounts) bank.accounts = [];
    bank.accounts.push({ name, balance: bal });
    document.getElementById('newBankAccountName').value = '';
    document.getElementById('newBankAccountBalance').value = '';
    document.getElementById('addBankAccountForm').style.display = 'none';
    document.getElementById('addBankAccountPlusBtn').style.display = 'flex';
    window.renderBankDetailsView(); window.autoSave();
};

window.deleteBankAccount = (idx) => {
    if(window.activeBankIndex === null) return;
    window.appState.banks[window.activeBankIndex].accounts.splice(idx, 1);
    window.renderBankDetailsView(); window.autoSave();
};

window.addBankTransaction = () => {
    if(window.activeBankIndex === null) return;
    const type = document.getElementById('newBankTxType').value;
    const desc = document.getElementById('newBankTxDesc').value.trim();
    const amount = parseFloat(document.getElementById('newBankTxAmount').value) || 0;
    if(!desc || !amount) return;
    const bank = window.appState.banks[window.activeBankIndex];
    if(!bank.transactions) bank.transactions = [];
    bank.transactions.push({ type, desc, amount });
    document.getElementById('newBankTxDesc').value = '';
    document.getElementById('newBankTxAmount').value = '';
    document.getElementById('addBankTxForm').style.display = 'none';
    document.getElementById('addBankTxPlusBtn').style.display = 'flex';
    window.renderBankDetailsView(); window.autoSave();
};

window.deleteBankTransaction = (idx) => {
    if(window.activeBankIndex === null) return;
    window.appState.banks[window.activeBankIndex].transactions.splice(idx, 1);
    window.renderBankDetailsView(); window.autoSave();
};

window.renderAllocations = () => {
    if(!window.appState.allocations) window.appState.allocations = [
        { label: 'الاحتياجات', percent: 50 },
        { label: 'الرغبات', percent: 30 },
        { label: 'الادخار', percent: 20 }
    ];

    const totalInput = document.getElementById('totalIncomeInput');
    const distGrid = document.getElementById('allocationResults');
    const remEl = document.getElementById('remainingPercent');
    
    if(!distGrid) return;
    
    const total = parseFloat(totalInput?.value) || 0;
    let usedPercent = 0;
    
    distGrid.innerHTML = window.appState.allocations.map((a, idx) => {
        usedPercent += parseFloat(a.percent);
        const val = total * (a.percent / 100);
        return `
            <div style="background:var(--bg-subtle); padding:10px; border-radius:12px; border:1px solid var(--border-color); text-align:center; position:relative;">
                <button class="delete-btn" style="position:absolute; top:4px; left:4px;" onclick="window.deleteAllocation(${idx})">&times;</button>
                <div style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:4px;">${a.label} (${a.percent}%)</div>
                <div style="font-size:1.05rem; font-weight:bold; color:var(--accent-color); direction:ltr;">${val.toFixed(2)}</div>
            </div>
        `;
    }).join('');

    const rem = 100 - usedPercent;
    if(remEl) {
        remEl.innerText = `${rem}%`;
        remEl.style.color = rem < 0 ? 'var(--danger-color)' : 'var(--accent-color)';
        if(rem < 0) window.showToast('تنبيه: مجموع النسب يتجاوز 100%!');
    }
};

window.addAllocation = () => {
    const name = document.getElementById('newAllocName').value.trim();
    const pct = parseFloat(document.getElementById('newAllocPercent').value);
    
    if(!name || isNaN(pct)) return window.showToast('الرجاء إدخال اسم ونسبة صحيحة');
    
    let usedPercent = 0;
    window.appState.allocations.forEach(a => usedPercent += parseFloat(a.percent));
    
    if (usedPercent + pct > 100) return window.showToast(`لا يمكنك تجاوز 100%. المتبقي المسموح هو ${100 - usedPercent}%`);
    
    window.appState.allocations.push({ label: name, percent: pct });
    document.getElementById('newAllocName').value = '';
    document.getElementById('newAllocPercent').value = '';
    window.renderAllocations(); window.autoSave();
};

window.deleteAllocation = (idx) => {
    window.appState.allocations.splice(idx, 1);
    window.renderAllocations(); window.autoSave();
};

// تصميم الاشتراكات المتقدمة والأنيقة
window.renderSubscriptions = () => {
    if(!window.appState.subscriptions) window.appState.subscriptions = [];
    const list = document.getElementById('subscriptionsList');
    let totalCost = 0;
    if(!list) return;

    list.innerHTML = window.appState.subscriptions.map((s, idx) => {
        totalCost += parseFloat(s.cost) || 0;
        const startDate = new Date(s.date);
        let endDate = new Date(s.date);
        let cycleText = '';
        
        if(s.cycle === 'monthly') { endDate.setMonth(endDate.getMonth() + 1); cycleText = 'شهري'; }
        else { endDate.setFullYear(endDate.getFullYear() + 1); cycleText = 'سنوي'; }
        
        const now = new Date();
        const diffTime = endDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let statusHtml = '';
        if (diffDays <= 3 && diffDays >= 0) statusHtml = `<span style="color:var(--danger-color); font-size:0.75rem; font-weight:bold; background: rgba(239, 68, 68, 0.1); padding: 2px 8px; border-radius: 8px;">ينتهي خلال ${diffDays} أيام</span>`;
        else if (diffDays < 0) statusHtml = `<span style="color:var(--danger-color); font-size:0.75rem; font-weight:bold; background: rgba(239, 68, 68, 0.1); padding: 2px 8px; border-radius: 8px;">منتهي</span>`;
        else statusHtml = `<span style="color:var(--text-secondary); font-size:0.75rem; background: rgba(0,0,0,0.05); padding: 2px 8px; border-radius: 8px;">باقي ${diffDays} يوم</span>`;

        const bankName = s.bankIdx !== '' && window.appState.banks[s.bankIdx] ? window.appState.banks[s.bankIdx].name : 'بدون بنك';

        return `
            <li style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--bg-subtle); border-radius: 16px; margin-bottom: 12px;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="width: 40px; height: 40px; background: #fff; border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.05); font-size: 1.2rem;">🔄</div>
                    <div style="display:flex; flex-direction:column; gap:4px;">
                        <span style="font-weight:600; font-size:0.95rem;">${s.name} <span style="font-size:0.7rem; color: var(--text-secondary); font-weight: normal;">(${cycleText})</span></span>
                        <div style="display:flex; gap: 6px; align-items: center;">
                            <span style="font-size:0.75rem; color:var(--text-secondary);">🏦 ${bankName}</span>
                            ${statusHtml}
                        </div>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:12px;">
                    <span style="font-weight:bold; font-size:1.05rem;">${s.cost} ر.س</span>
                    <button class="delete-btn" style="background: rgba(239, 68, 68, 0.1); border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;" onclick="window.deleteSubscription(${idx})">&times;</button>
                </div>
            </li>
        `;
    }).join('') || '<div style="font-size:0.85rem; color:var(--text-secondary); text-align:center; padding:20px; background: var(--bg-subtle); border-radius: 16px;">لا توجد اشتراكات</div>';
    
    const totalValEl = document.getElementById('subsTotalValue');
    if (totalValEl) totalValEl.innerText = totalCost + ' ر.س';
};

window.addSubscription = () => {
    const name = document.getElementById('newSubName').value.trim();
    const cost = parseFloat(document.getElementById('newSubCost').value);
    const cycle = document.getElementById('newSubCycle').value;
    const bankIdx = document.getElementById('newSubBank').value;
    const date = document.getElementById('newSubDate').value;
    
    if(!name || isNaN(cost) || !date) return window.showToast('الرجاء تعبئة الاسم والسعر والتاريخ');
    
    if(!window.appState.subscriptions) window.appState.subscriptions = [];
    window.appState.subscriptions.push({name, cost, cycle, bankIdx, date});
    
    document.getElementById('newSubName').value = ''; 
    document.getElementById('newSubCost').value = '';
    document.getElementById('newSubDate').value = '';
    
    document.getElementById('addSubForm').style.display = 'none';
    document.getElementById('addSubPlusBtn').style.display = 'flex';
    
    window.renderSubscriptions(); window.autoSave();
};

window.deleteSubscription = (idx) => {
    window.appState.subscriptions.splice(idx, 1);
    window.renderSubscriptions(); window.autoSave();
};

window.addIncome = () => {
    const name = document.getElementById('newIncomeName').value.trim();
    const amount = document.getElementById('newIncomeAmount').value;
    const date = document.getElementById('newIncomeDate').value;
    if(!name || !amount) return;
    if(!window.appState.incomeSources) window.appState.incomeSources = [];
    window.appState.incomeSources.push({name, amount: parseFloat(amount), date});
    document.getElementById('newIncomeName').value = '';
    document.getElementById('newIncomeAmount').value = '';
    document.getElementById('newIncomeDate').value = '';
    document.getElementById('addIncomeForm').style.display = 'none';
    document.getElementById('addIncomePlusBtn').style.display = 'flex';
    window.renderLists(); window.autoSave();
};

window.deleteIncome = (idx) => { window.appState.incomeSources.splice(idx, 1); window.renderLists(); window.autoSave(); };

window.addWishlistItem = () => {
    const title = document.getElementById('newWishTitle').value.trim();
    const cost = document.getElementById('newWishCost').value;
    const priority = document.getElementById('newWishPriority').value;
    const link = document.getElementById('newWishLink').value.trim();
    if (!title || !cost) return;
    if (!window.appState.wishlist) window.appState.wishlist = [];
    window.appState.wishlist.push({ title, cost: parseFloat(cost)||0, priority, link });
    document.getElementById('newWishTitle').value = '';
    document.getElementById('newWishCost').value = '';
    document.getElementById('newWishLink').value = '';
    document.getElementById('addWishForm').style.display = 'none';
    document.getElementById('addWishPlusBtn').style.display = 'flex';
    window.renderLists(); window.autoSave();
};

window.deleteWishlistItem = (idx) => { window.appState.wishlist.splice(idx, 1); window.renderLists(); window.autoSave(); };

window.renderLists = () => {
    const habitsList = document.getElementById('habitsList');
    if(habitsList) {
        habitsList.innerHTML = (window.appState.habits || []).map((h, idx) => `
            <li class="list-item ${h.done ? 'completed' : ''}" style="padding: 10px 14px; background: transparent; border-bottom: 1px dashed var(--border-color); border-radius: 0;">
                <div class="item-left">
                    <div class="checkbox" onclick="window.toggleHabit(${idx})">${h.done ? '✓' : ''}</div>
                    <span>${h.text}</span>
                </div>
                <button class="delete-btn" onclick="window.deleteHabit(${idx})">&times;</button>
            </li>
        `).join('');
    }
    
    let totalIncome = 0;
    const incList = document.getElementById('incomeSourcesList');
    if(incList) {
        incList.innerHTML = (window.appState.incomeSources || []).map((inc, idx) => {
            totalIncome += parseFloat(inc.amount) || 0;
            return `
            <li class="list-item" style="padding: 10px 14px; background: transparent; border-bottom: 1px dashed var(--border-color); border-radius: 0;">
                <span style="font-weight:600; font-size:0.85rem;">${inc.name}</span>
                <div style="display:flex; align-items:center; gap:12px;">
                    <span style="color:var(--accent-color); font-weight:bold; font-size:0.85rem;">${inc.amount} ر.س</span>
                    <button class="delete-btn" onclick="window.deleteIncome(${idx})">&times;</button>
                </div>
            </li>`;
        }).join('');
        const sumCard = document.getElementById('incomeSummaryCard');
        if (sumCard) {
            sumCard.innerHTML = `<div style="font-weight:bold; margin-top:8px;">إجمالي الدخل المُسجل: ${totalIncome} ر.س</div>`;
        }
    }

    const wList = document.getElementById('wishlistList');
    if (wList) {
        let wishTotal = 0;
        const priorityColors = { high: '#ef4444', medium: '#f59e0b', low: '#3b82f6' };
        const priorityLabels = { high: 'قصوى', medium: 'متوسطة', low: 'منخفضة' };

        wList.innerHTML = (window.appState.wishlist || []).map((w, idx) => {
            wishTotal += w.cost;
            const linkHtml = w.link ? `<a href="${w.link}" target="_blank" style="margin-right:8px; font-size:0.75rem; color:var(--accent-color); text-decoration:none;">🔗 الرابط</a>` : '';
            return `
            <li class="list-item" style="padding: 10px 14px; background: transparent; border-bottom: 1px dashed var(--border-color); border-radius: 0;">
                <div class="item-left" style="display:flex; flex-direction:column; gap:4px;">
                    <span style="font-weight: 600; font-size:0.85rem;">${w.title}</span>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:0.7rem; padding:2px 6px; border-radius:8px; background:var(--bg-subtle); color:${priorityColors[w.priority] || '#333'}">${priorityLabels[w.priority] || 'عادية'}</span>
                        ${linkHtml}
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:12px;">
                    <span style="font-weight: bold; font-size:0.85rem;">${w.cost} ر.س</span>
                    <button class="delete-btn" onclick="window.deleteWishlistItem(${idx})">&times;</button>
                </div>
            </li>
            `;
        }).join('');
        const totalEl = document.getElementById('wishlistTotal');
        if (totalEl) totalEl.innerText = wishTotal.toFixed(2) + ' ر.س';
    }
};

window.addHabit = () => {
    const input = document.getElementById('newHabitInput');
    const v = input.value.trim();
    if (!v) return;
    if (!window.appState.habits) window.appState.habits = [];
    window.appState.habits.push({ text: v, done: false });
    input.value = '';
    document.getElementById('addHabitForm').style.display = 'none';
    document.getElementById('addHabitPlusBtn').style.display = 'flex';
    window.renderLists(); window.autoSave();
};

window.deleteHabit = (idx) => { window.appState.habits.splice(idx, 1); window.renderLists(); window.autoSave(); };
window.toggleHabit = (idx) => { window.appState.habits[idx].done = !window.appState.habits[idx].done; window.renderLists(); window.autoSave(); };

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
  document.getElementById('addKanbanForm').style.display = 'none';
  document.getElementById('addKanbanPlusBtn').style.display = 'flex';
  window.renderKanbanBoard(); window.autoSave();
};

window.changeKanbanStatus = (idx, newStatus) => { window.appState.kanbanTasks[idx].status = newStatus; window.renderKanbanBoard(); window.autoSave(); };
window.deleteKanbanTask = (idx) => { window.appState.kanbanTasks.splice(idx, 1); window.renderKanbanBoard(); window.autoSave(); };
window.dragKanbanCard = (e, idx) => { e.stopPropagation(); window.draggedKanbanIndex = idx; };
window.allowKanbanDrop = (e) => { e.preventDefault(); };
window.dropKanbanCard = (e, targetStatus) => { e.preventDefault(); if (window.draggedKanbanIndex === null) return; window.appState.kanbanTasks[window.draggedKanbanIndex].status = targetStatus; window.draggedKanbanIndex = null; window.renderKanbanBoard(); window.autoSave(); };

window.renderBusinessWidget = () => {
    if (!window.appState.business) window.appState.business = { projects: [], campaigns: [] };
    const pCount = window.appState.business.projects.length;
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
