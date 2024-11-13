// التحقق إذا كان الإدمن قد سجل دخوله
if (!localStorage.getItem('isAdmin')) {
    window.location.href = 'login.html'; // إذا لم يكن مسجلاً الدخول يتم توجيه المستخدم إلى صفحة الدخول
}

// حفظ المستخدمين في localStorage
function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

// استرجاع المستخدمين من localStorage
function getUsers() {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : [];
}

// إضافة مستخدم جديد
function createUser() {
    const username = prompt("أدخل اسم المستخدم:");
    const password = prompt("أدخل كلمة المرور:");

    const users = getUsers();
    users.push({ username, password });
    saveUsers(users);

    alert('تم إضافة المستخدم بنجاح!');
    loadUsers();
}

// عرض المستخدمين في الجدول
function loadUsers() {
    const users = getUsers();
    const userTable = document.getElementById('userTable').getElementsByTagName('tbody')[0];
    
    // مسح الجدول الحالي
    userTable.innerHTML = '';

    // إضافة البيانات الجديدة للمستخدمين
    users.forEach(user => {
        const row = userTable.insertRow();
        row.innerHTML = `<td>${user.username}</td><td>${user.password}</td>`;
    });
}

// تسجيل الخروج
function logout() {
    localStorage.removeItem('isAdmin');
    window.location.href = 'login.html'; // العودة إلى صفحة الدخول
}

// تحميل المستخدمين عند تحميل الصفحة
loadUsers();
