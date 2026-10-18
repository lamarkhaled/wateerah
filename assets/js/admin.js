// assets/js/admin.js
import { db } from './firebase-config.js';
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

window.toggleTargetEmailBox = val => {
  document.getElementById('adminSpecificEmailBox').style.display = val === 'SPECIFIC' ? 'block' : 'none';
};

window.adminSendCloudMessage = async () => {
  const target = document.getElementById('adminNotifTarget').value;
  const specificTarget = document.getElementById('adminTargetUserEmail').value.trim();
  const message = document.getElementById('adminWidgetMsg').value.trim();
  const imageUrl = document.getElementById('adminWidgetImgUrl').value.trim();
  const duration = parseInt(document.getElementById('adminWidgetDuration').value) || 0;

  if(!message) return window.showToast('اكتب نص الرسالة أولاً');

  const payload = {
    message, imageUrl, duration,
    target: target === 'ALL' ? 'ALL' : specificTarget,
    timestamp: Date.now()
  };

  try {
    await setDoc(doc(db, "notifications", "activeMessage"), payload);
    window.showToast('تم إرسال الرسالة فوراً عبر السحابة');
    window.closeModal('adminModal');
  } catch(e) { window.showToast('حدث خطأ في إرسال الرسالة'); }
};

window.adminGenerateActivationCode = async () => {
  const code = document.getElementById('adminNewActivationCode').value.trim();
  const days = parseInt(document.getElementById('adminCodeCustomDays').value) || 30;
  if(!code) return window.showToast('أدخل رمز الكود');
  try {
    await setDoc(doc(db, "activationCodes", code), { code, days, createdAt: new Date().toISOString() });
    document.getElementById('adminNewActivationCode').value = '';
    window.showToast('تم حفظ الكود بنجاح');
    window.loadAdminCodes();
  } catch(e) { window.showToast('خطأ في حفظ الكود'); }
};

window.loadAdminCodes = async function() {
  const el = document.getElementById('adminCodesList');
  try {
    const snap = await getDocs(collection(db, "activationCodes"));
    let html = '';
    snap.forEach(d => {
      const c = d.data();
      html += `<div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px solid var(--border-color);">
        <span><strong>${c.code}</strong> (${c.days} يوم)</span>
        <button class="btn btn-danger" style="padding:2px 8px; font-size:0.7rem;" onclick="adminDeleteCode('${c.code}')">حذف</button>
      </div>`;
    });
    el.innerHTML = html || 'لا توجد أكواد نشطة.';
  } catch(e) {}
};

window.adminDeleteCode = async code => {
  await deleteDoc(doc(db, "activationCodes", code));
  window.loadAdminCodes();
};

window.loadAdminUsers = async function() {
  const listEl = document.getElementById('adminUsersList');
  try {
    const snap = await getDocs(collection(db, "users"));
    let html = '';
    snap.forEach(d => {
      const u = d.data();
      const email = u.email || d.id;
      html += `<div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid var(--border-color);">
        <div>
          <strong>${email}</strong><br>
          <span style="font-size:0.72rem; color:var(--text-secondary);">UID: ${d.id} | ${u.profile?.planType || 'أساسي'} (${u.profile?.expiryDate || '-'})</span>
        </div>
        <button class="btn btn-subtle" style="padding:4px 10px; font-size:0.72rem;" onclick="adminEditUserSubscription('${d.id}')">تعديل</button>
      </div>`;
    });
    listEl.innerHTML = html || 'لا يوجد مشتركين.';
  } catch(e) { listEl.innerHTML = 'تعذر التحميل.'; }
};

window.adminEditUserSubscription = async uid => {
  const days = prompt("أدخل عدد أيام الاشتراك الجديدة لهذا المشترك:");
  if(!days) return;
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + (parseInt(days) || 30));
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if(snap.exists()) {
    let p = snap.data().profile || {};
    p.isPro = true; p.totalSubDays = parseInt(days) || 30;
    p.planType = `عضوية نشطة`; p.expiryDate = expiry.toISOString().slice(0, 10);
    await setDoc(userRef, { profile: p }, { merge: true });
    window.showToast('تم تحديث اشتراك العميل');
    window.loadAdminUsers();
  }
};
