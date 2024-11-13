document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // بيانات تسجيل الدخول
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // بيانات المستخدمين المتاحة
    const validUsername = 'admin';
    const validPassword = '12345';

    // التحقق من صحة البيانات
    if (username === validUsername && password === validPassword) {
        // إخفاء صفحة تسجيل الدخول
        document.getElementById('loginPage').style.display = 'none';
        // عرض لوحة التحكم
        document.getElementById('controlPanel').style.display = 'flex';
    } else {
        // عرض رسالة الخطأ إذا كانت البيانات غير صحيحة
        document.getElementById('error-message').style.display = 'block';
    }
});

// إضافة منطق التبديل بين الأقسام
document.querySelectorAll('.sidebar ul li a').forEach(link => {
    link.addEventListener('click', () => {
        document.querySelectorAll('.content > div').forEach(section => {
            section.style.display = 'none';
        });

        const target = link.getAttribute('href').substring(1);
        document.getElementById(target).style.display = 'block';
    });
});

document.getElementById('dashboard').style.display = 'block'; // إظهار لوحة التحكم بشكل افتراضي
