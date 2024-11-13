document.querySelectorAll('.sidebar ul li a').forEach(link => {
    link.addEventListener('click', () => {
        document.querySelectorAll('.content > div').forEach(section => {
            section.style.display = 'none';
        });

        const target = link.getAttribute('href').substring(1);
        document.getElementById(target).style.display = 'block';
    });
});

document.getElementById('dashboard').style.display = 'block';

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const username = e.target.username.value;
    const password = e.target.password.value;

    // التحقق من صحة بيانات تسجيل الدخول
    if (username === 'admin' && password === 'admin123') {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('controlPanel').style.display = 'flex';
    } else {
        document.getElementById('error-message').style.display = 'block';
    }
});

document.getElementById('memberForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const fullName = e.target.fullName.value;
    const email = e.target.email.value;
    const age = e.target.age.value;
    const phone = e.target.phone.value;
    const address = e.target.address.value;
    
    const table = document.getElementById('memberTable');
    const row = table.insertRow();
    
    row.insertCell(0).textContent = fullName;
    row.insertCell(1).textContent = email;
    row.insertCell(2).textContent = age;
    row.insertCell(3).textContent = phone;
    row.insertCell(4).textContent = address;
    
    e.target.reset();  // إعادة تعيين الحقول بعد الإضافة
});
