// بيانات الإدمن (username and password)
const adminUsername = 'halok';
const adminPassword = 'admin123';

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // التحقق من صحة البيانات
    if (username === adminUsername && password === adminPassword) {
        // تخزين البيانات في localStorage وتوجيه المستخدم إلى لوحة التحكم
        localStorage.setItem('isAdmin', true);
        window.location.href = 'admin-dashboard.html'; // توجه إلى لوحة تحكم الإدمن
    } else {
        document.getElementById('errorMessage').style.display = 'block';
    }
});
