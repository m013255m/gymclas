const validAdmin = {
    username: "halok",
    password: "halok"
};

document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (username === validAdmin.username && password === validAdmin.password) {
        localStorage.setItem("adminLoggedIn", "true");
        window.location.href = "admin.html"; // Redirect to Admin Panel after login
    } else {
        document.getElementById("error-message").style.display = "block";
    }
});

document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', () => {
        document.querySelectorAll('.content > div').forEach(section => {
            section.style.display = 'none';
        });

        const target = link.getAttribute('href').substring(1);
        document.getElementById(target).style.display = 'block';
    });
});

document.getElementById('dashboard').style.display = 'block';

document.getElementById('memberForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const fullName = e.target.fullName.value;
    const age = e.target.age.value;
    const phone = e.target.phone.value;
    const address = e.target.address.value;

    const row = document.createElement
