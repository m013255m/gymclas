// Login functionality with loading icon
document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loadingIcon = document.getElementById('loadingIcon');

    loadingIcon.style.display = 'block';

    setTimeout(() => {
        if (username === 'admin' && password === '12345') {
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('controlPanel').style.display = 'flex';
        } else {
            document.getElementById('error-message').style.display = 'block';
        }
        loadingIcon.style.display = 'none';
    }, 2000);
});

// Section toggling
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
