// إخفاء واجهة التحميل بعد تحميل الصفحة
window.addEventListener('load', function() {
    document.getElementById('loadingPage').style.display = 'none';
});

// تسجيل الدخول وإظهار لوحة التحكم
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    document.getElementById('loadingPage').style.display = 'flex';

    setTimeout(() => {
        if (username === 'admin' && password === '12345') {
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('controlPanel').style.display = 'flex';
        } else {
            document.getElementById('error-message').style.display = 'block';
        }
        document.getElementById('loadingPage').style.display = 'none';
    }, 2000);
});

// تفعيل التنقل بين الأقسام
document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', function() {
        document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
        document.querySelector(this.getAttribute('href')).classList.add('active');
    });
});

// إضافة عضو جديد
document.getElementById('memberForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const table = document.getElementById('membersTable').querySelector('tbody');
    const newRow = table.insertRow();
    newRow.innerHTML = `
        <td>${this.fullName.value}</td>
        <td>${this.email.value}</td>
        <td>${this.age.value}</td>
        <td>${this.phone.value}</td>
    `;
    this.reset();
});
