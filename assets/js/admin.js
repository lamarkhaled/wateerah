import { db, auth } from './firebase-config.js';
import { doc, setDoc, getDocs, getDoc, collection, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const ADMIN_EMAIL = "wateerahapp@gmail.com";

window.generateActivationCodePage = async function() {
    if (auth.currentUser?.email !== ADMIN_EMAIL) return;
    let codeStr = document.getElementById('adminCodeInputPage').value.trim();
    const daysVal = document.getElementById('adminDaysSelectPage').value;
    const days = daysVal === 'lifetime' ? 'lifetime' : parseInt(daysVal);

    if (!codeStr) {
        const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
        codeStr = `WAT-${randomString}`;
    }

    try {
        await setDoc(doc(db, "activationCodes", codeStr), {
            days: days,
            status: 'active',
            createdAt: new Date().toISOString()
        });
        if(window.showToast) window.showToast(`تم إنشاء الكود: ${codeStr}`);
        document.getElementById('adminCodeInputPage').value = '';
        window.loadActiveCodesPage(); 
    } catch (error) {
        if(window.showToast) window.showToast("خطأ أثناء الحفظ.");
    }
};

window.loadActiveCodesPage = async function() {
    if (auth.currentUser?.email !== ADMIN_EMAIL) return;
    const activeList = document.getElementById('adminCodesListPage');
    const usedList = document.getElementById('adminUsedCodesListPage');
    if (!activeList || !usedList) return;
    
    activeList.innerHTML = '<li style="text-align:center; padding:10px;">جاري التحميل...</li>';
    usedList.innerHTML = '<li style="text-align:center; padding:10px;">جاري التحميل...</li>';
    
    try {
        const querySnapshot = await getDocs(collection(db, "activationCodes"));
        let activeHtml = '';
        let usedHtml = '';

        querySnapshot.forEach((docSnap) => {
            const code = docSnap.id;
            const data = docSnap.data();
            const durationText = data.days === 'lifetime' ? 'مدى الحياة' : `${data.days} يوم`;

            if (data.status === 'used') {
                usedHtml += `
                    <li class="list-item" style="padding: 14px; margin-bottom: 8px; border-radius: 12px; background: var(--bg-subtle);">
                        <div style="display:flex; justify-content: space-between; align-items: center;">
                            <div style="display:flex; flex-direction:column; gap:6px;">
                                <span style="font-weight: 700; color: var(--text-secondary); text-decoration: line-through;">${code}</span>
                                <span style="font-size: 0.85rem; color: var(--accent-color);">استخدمه: ${data.usedByName || data.usedBy}</span>
                            </div>
                            <button class="btn btn-danger" onclick="window.deleteAdminCodePage('${code}')">حذف السجل</button>
                        </div>
                    </li>`;
            } else {
                activeHtml += `
                    <li class="list-item" style="padding: 14px; margin-bottom: 8px; border-radius: 12px; background: var(--bg-subtle);">
                        <div style="display:flex; justify-content: space-between; align-items: center;">
                            <div style="display:flex; flex-direction:column; gap:6px;">
                                <span style="font-weight: 700; color: var(--accent-color); font-size: 1.1rem;">${code}</span>
                                <span style="font-size: 0.85rem; color: var(--text-secondary);">المدة: ${durationText}</span>
                            </div>
                            <div style="display:flex; gap: 8px;">
                                <button class="btn btn-subtle" onclick="navigator.clipboard.writeText('${code}'); window.showToast('تم النسخ');">نسخ</button>
                                <button class="btn btn-danger" onclick="window.deleteAdminCodePage('${code}')">إلغاء</button>
                            </div>
                        </div>
                    </li>`;
            }
        });
        activeList.innerHTML = activeHtml || '<li style="text-align:center; padding:10px;">لا توجد أكواد نشطة.</li>';
        usedList.innerHTML = usedHtml || '<li style="text-align:center; padding:10px;">لا توجد أكواد مستخدمة.</li>';
    } catch (error) {
        activeList.innerHTML = '<li style="text-align:center; padding:10px;">خطأ في جلب الأكواد.</li>';
    }
};

window.deleteAdminCodePage = async function(code) {
    if (auth.currentUser?.email !== ADMIN_EMAIL) return;
    if(!confirm('تأكيد الحذف نهائياً؟')) return;
    try {
        await deleteDoc(doc(db, "activationCodes", code));
        if(window.showToast) window.showToast("تم الحذف.");
        window.loadActiveCodesPage(); 
    } catch (error) {}
};

// إدارة المستخدمين
window.loadAdminUsersList = async function() {
    if (auth.currentUser?.email !== ADMIN_EMAIL) return;
    const usersList = document.getElementById('adminUsersList');
    if (!usersList) return;
    usersList.innerHTML = '<li style="text-align:center; padding:10px;">جاري تحميل المستخدمين...</li>';
    
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        let html = '';
        querySnapshot.forEach((docSnap) => {
            const uid = docSnap.id;
            const data = docSnap.data();
            if (data.email === ADMIN_EMAIL) return; 

            const profile = data.profile || {};
            const isLifetime = profile.expiryDate === 'دائم';
            const plan = profile.isPro ? (isLifetime ? 'مدى الحياة' : 'نشط') : 'أساسي';
            const expiry = profile.isPro ? (isLifetime ? 'صلاحية دائمة' : profile.expiryDate) : 'منتهي';

            html += `
            <li class="list-item" style="padding: 14px; margin-bottom: 8px; border-radius: 12px; background: var(--bg-subtle);">
                <div style="display:flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        <span style="font-weight: 700; font-size: 1rem;">${profile.name || 'مستخدم'}</span>
                        <span style="font-size: 0.8rem; color: var(--text-secondary);">${data.email}</span>
                        <span style="font-size: 0.85rem; color: var(--accent-color);">الباقة: ${plan} | الانتهاء: ${expiry}</span>
                    </div>
                    <div style="display:flex; gap: 6px; flex-wrap: wrap;">
                        <button class="btn btn-primary" style="padding: 6px; font-size: 0.75rem;" onclick="window.modifyUserSub('${uid}', 30)">+30 يوم</button>
                        <button class="btn btn-primary" style="padding: 6px; font-size: 0.75rem;" onclick="window.modifyUserSub('${uid}', 'lifetime')">مدى الحياة</button>
                        <button class="btn btn-danger" style="padding: 6px; font-size: 0.75rem;" onclick="window.modifyUserSub('${uid}', 'cancel')">حذف الاشتراك</button>
                    </div>
                </div>
            </li>`;
        });
        usersList.innerHTML = html || '<li style="text-align:center; padding:10px;">لا يوجد مستخدمين مسجلين.</li>';
    } catch (e) { usersList.innerHTML = 'خطأ'; }
};

window.modifyUserSub = async function(uid, action) {
    if(!confirm('هل أنت متأكد من إجراء هذا التعديل على المستخدم؟')) return;
    try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return;

        let data = userSnap.data();
        let profile = data.profile || {};

        if (action === 'cancel') {
            profile.isPro = false;
            profile.planType = 'الباقة الأساسية';
            profile.expiryDate = '';
        } else if (action === 'lifetime') {
            profile.isPro = true;
            profile.planType = 'عضوية نشطة';
            profile.expiryDate = 'دائم';
        } else if (typeof action === 'number') {
            profile.isPro = true;
            profile.planType = 'عضوية نشطة';
            let currentExp = new Date();
            if (profile.expiryDate && profile.expiryDate !== 'دائم') {
                const parsed = new Date(profile.expiryDate.replace(/-/g, '/'));
                if (parsed > currentExp) currentExp = parsed;
            }
            currentExp.setDate(currentExp.getDate() + action);
            profile.expiryDate = currentExp.toISOString().slice(0, 10);
        }

        await updateDoc(userRef, { profile: profile });
        if(window.showToast) window.showToast("تم تحديث اشتراك المستخدم بنجاح.");
        window.loadAdminUsersList();
    } catch (error) {
        if(window.showToast) window.showToast("خطأ أثناء التعديل.");
    }
};

const originalLoadCodes = window.loadActiveCodesPage;
window.loadActiveCodesPage = function() {
    if(originalLoadCodes) originalLoadCodes();
    window.loadAdminUsersList();
};
