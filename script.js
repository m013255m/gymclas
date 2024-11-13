
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

document.getElementById('memberForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const fullName = e.target.fullName.value;
    const email = e.target.email.value;
    const age = e.target.age.value;
    const phone = e.target.phone.value;
    const address = e.target.address.value;

    const row = document.createElement('tr');
    row.innerHTML = `<td>${fullName}</td><td>${email}</td><td>${age}</td><td>${phone}</td><td>${address}</td>`;
    document.getElementById('memberTable').appendChild(row);

    e.target.reset();
});
