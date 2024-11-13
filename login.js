
document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;

    fetch('users.json')
        .then(response => response.json())
        .then(users => {
            const user = users.find(u => u.username === username && u.password === password);
            if (user) {
                if (user.role === "admin") {
                    localStorage.setItem("userRole", "admin");
                    window.location.href = 'admin_panel.html';
                } else {
                    document.getElementById('loginError').innerText = "ليس لديك صلاحيات الوصول إلى لوحة التحكم.";
                    document.getElementById('loginError').style.display = 'block';
                }
            } else {
                document.getElementById('loginError').innerText = "بيانات الدخول غير صحيحة.";
                document.getElementById('loginError').style.display = 'block';
            }
        });
});
