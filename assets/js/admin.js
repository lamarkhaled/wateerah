import { db, auth } from './firebase-config.js';
import { doc, setDoc, getDocs, collection, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

window.generateActivationCodePage = async function() {
    let codeStr = document.getElementById('adminCodeInputPage').value.trim();
    const days = parseInt(document.getElementById('adminDaysSelectPage').value) || 30;

    if (!codeStr) {
        const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
        codeStr = `WAT-${randomString}-${days}`;
    }

    try {
        await setDoc(doc(db, "activationCodes", codeStr), {
            days: days,
            createdAt: new Date().toISOString()
        });
        if(window.showToast) window.showToast(`تم إنشاء الكود بنجاح: ${codeStr}`);
        document.getElementById('adminCodeInputPage').value = '';
        window.loadActiveCodesPage(); 
    } catch (error) {
        if(window.showToast) window.showToast("حدث خطأ أثناء حفظ الكود.");
    }
};

window.loadActiveCodesPage = async function() {
    const listEl = document.getElementById('adminCodesListPage');
    if (!listEl) return;
    
    listEl.innerHTML = '<li style="text-align:center; padding:10px; color:var(--text-secondary);">جاري التحميل...</li>';
    
    try {
        const querySnapshot = await getDocs(collection(db, "activationCodes"));
        if (querySnapshot.empty) {
            listEl.innerHTML = '<li style="text-align:center; padding:10px; color:var(--text-secondary);">لا توجد أكواد نشطة حالياً.</li>';
            return;
        }

        let html = '';
        querySnapshot.forEach((docSnap) => {
            const code = docSnap.id;
            const data = docSnap.data();
            html += `
                <li class="list-item" style="padding: 14px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; border-radius: 12px; background: var(--bg-subtle);">
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        <span style="font-weight: 700; color: var(--accent-color); font-size: 1.1rem;">${code}</span>
                        <span style="font-size: 0.85rem; color: var(--text-secondary);">صالح لمدة: ${data.days} يوم</span>
                    </div>
                    <div style="display:flex; gap: 8px;">
                        <button class="btn btn-subtle" onclick="navigator.clipboard.writeText('${code}'); window.showToast('تم النسخ');">نسخ</button>
                        <button class="btn btn-danger" onclick="window.deleteAdminCodePage('${code}')">إلغاء</button>
                    </div>
                </li>
            `;
        });
        listEl.innerHTML = html;

    } catch (error) {
        listEl.innerHTML = '<li style="text-align:center; padding:10px; color:var(--danger-color);">حدث خطأ في جلب الأكواد.</li>';
    }
};

window.deleteAdminCodePage = async function(code) {
    if(!confirm('تأكيد حذف الكود نهائياً؟')) return;
    try {
        await deleteDoc(doc(db, "activationCodes", code));
        if(window.showToast) window.showToast("تم إلغاء الكود بنجاح.");
        window.loadActiveCodesPage(); 
    } catch (error) {
        if(window.showToast) window.showToast("حدث خطأ أثناء الحذف.");
    }
};
