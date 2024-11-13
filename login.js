document.getElementById("loginForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const email = document.getElementById("email").value;

    // تحقق من البيانات المدخلة
    if (username === "halok" && password === "user" && email === "m0132552023654@gmail.com") {
        localStorage.setItem("user_id", "halok"); // حفظ اسم المستخدم في localStorage
        window.location.href = "admin_dashboard.html";
    } else {
        document.getElementById("error-message").style.display = "block";
    }
});
