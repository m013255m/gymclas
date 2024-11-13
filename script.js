// تسجيل الدخول والتحقق من المستخدم
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === "admin" && password === "1234") { // بيانات مبدئية
        localStorage.setItem("loggedIn", true);
        showAdminPage();
    } else {
        alert("بيانات الدخول غير صحيحة");
    }
});

// إظهار واجهة الأدمن إذا كان مسجلاً الدخول
function showAdminPage() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('adminPage').style.display = 'flex';
}

if (localStorage.getItem("loggedIn")) {
    showAdminPage();
}

// تسجيل الخروج
document.getElementById('logoutButton').addEventListener('click', function() {
    localStorage.removeItem("loggedIn");
    location.reload();
});

// CRUD للأعضاء
document.getElementById('memberForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const member = {
        fullName: e.target.fullName.value,
        email: e.target.email.value,
        age: e.target.age.value,
        phone: e.target.phone.value,
        address: e.target.address.value,
    };

    let members = JSON.parse(localStorage.getItem("members")) || [];
    members.push(member);
    localStorage.setItem("members", JSON.stringify(members));

    renderMembers();
    e.target.reset();
});

function renderMembers() {
    const memberTable = document.getElementById
