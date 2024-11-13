
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
    const age = e.target.age.value;
    const phone = e.target.phone.value;
    const address = e.target.address.value;

    const row = document.createElement('tr');
    row.innerHTML = `<td>${fullName}</td><td>${age}</td><td>${phone}</td><td>${address}</td>`;
    document.getElementById('memberTable').appendChild(row);

    e.target.reset();
});

document.getElementById('subscriptionForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const memberName = e.target.memberName.value;
    const subscriptionType = e.target.subscriptionType.value;
    const startDate = e.target.startDate.value;
    const endDate = e.target.endDate.value;

    const row = document.createElement('tr');
    row.innerHTML = `<td>${memberName}</td><td>${subscriptionType}</td><td>${startDate}</td><td>${endDate}</td>`;
    document.getElementById('subscriptionTable').appendChild(row);

    e.target.reset();
});
