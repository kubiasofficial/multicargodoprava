// Firebase inicializace
const firebaseConfig = {
    apiKey: "ATasYBexZoBfDYNqIu2r5RM9v8sNV6cV1dJU",
    authDomain: "multicargodoprava-fe1d5.firebaseapp.com",
    databaseURL: "https://multicargodoprava-fe1d5-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "multicargodoprava-fe1d5",
    storageBucket: "multicargodoprava-fe1d5.appspot.com",
    messagingSenderId: "353118042486",
    appId: "1:353118042486:web:abdf8ba27613d27ddde257"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Firebase Authentication
if (!firebase.auth) {
    alert('Chybí Firebase Auth SDK! Přidejte <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script> do index.html.');
}
const auth = firebase.auth();

// SPA navigation (zatím jen přehled, ostatní stránky prázdné)
const pageTitle = document.querySelector('.page-title');
const pageContent = document.getElementById('page-content');
const navBtns = document.querySelectorAll('.nav-btn');


function setPage(page) {
    const background = document.getElementById('background');
    // Fade out
    pageContent.classList.remove('fade-in');
    pageContent.classList.add('fade-out');
    setTimeout(() => {
        switch (page) {
            case 'strojvedouci':
                pageTitle.textContent = 'Strojvedoucí';
                pageContent.innerHTML = '<h2 style="color:#fff;text-align:center;">Stránka Strojvedoucí je ve vývoji.</h2>';
                background.style.background = "url('/Pictures/1185.png') center center/cover no-repeat";
                break;
            case 'vypravci':
                pageTitle.textContent = 'Výpravčí';
                pageContent.innerHTML = '<h2 style="color:#fff;text-align:center;">Stránka Výpravčí je ve vývoji. Děkuji za trpělivost.</h2>';
                background.style.background = "url('/Pictures/Koluszki.png') center center/cover no-repeat";
                break;
            case 'ridic':
                pageTitle.textContent = 'Řidič';
                pageContent.innerHTML = '<h2 style="color:#fff;text-align:center;">Stránka Řidič je ve vývoji.</h2>';
                background.style.background = "url('/Pictures/bus.png') center center/cover no-repeat";
                break;
            case 'prehled':
                pageTitle.textContent = 'Přehled';
                pageContent.innerHTML = `
                    <h2 style="color:#fff;text-align:center;">Zaměstnanci</h2>
                    <div id="employees-table-container" style="margin:0 auto;max-width:600px;background:rgba(0,0,0,0.5);border-radius:8px;padding:16px;">
                        <table id="employees-table" style="width:100%;color:#fff;text-align:left;">
                            <thead>
                                <tr><th>Avatar</th><th>Jméno</th></tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                `;
                background.style.background = "url('/Pictures/1182.png') center center/cover no-repeat";
                renderEmployeesTable(); // Zde se volá funkce pro vykreslení tabulky
                break;
            default:
                // Zajištění, že se při startu načte správná stránka
                pageTitle.textContent = 'Přehled';
                pageContent.innerHTML = ''; // Bude nahrazeno obsahem z renderEmployeesTable()
                background.style.background = "url('/Pictures/1182.png') center center/cover no-repeat";
                renderEmployeesTable(); // Volání i pro defaultní případ
                break;
        }
        // Fade in
        pageContent.classList.remove('fade-out');
        pageContent.classList.add('fade-in');
    }, 300);
}

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        setPage(btn.dataset.page);
    });
});

// Discord OAuth2 login logic
window.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('discord-modal');
    const hash = window.location.hash;
    let accessToken = null;
    if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1));
        accessToken = params.get('access_token');
    }

    if (accessToken) {
        fetch('https://discord.com/api/users/@me', {
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        })
            .then(res => res.json())
            .then(user => {
                if (modal) modal.style.display = 'none';
                showDiscordProfile(user);
            })
            .catch(() => {
                if (modal) modal.style.display = 'flex';
            });
    } else {
        if (modal) modal.style.display = 'flex';
    }
});

function showDiscordProfile(user) {
    let container = document.getElementById('discord-profile-container');
    if (!container) {
        alert('Chyba: Element pro profil nebyl nalezen.');
        return;
    }
    let profileDiv = document.getElementById('discord-profile');
    if (!profileDiv) {
        profileDiv = document.createElement('div');
        profileDiv.id = 'discord-profile';
        container.appendChild(profileDiv);
    }

    if (!user || !user.id || !user.username) {
        profileDiv.innerHTML = `
            <div id="profile-clickable" style="display:flex;align-items:center;gap:12px;cursor:pointer;">
                <span style='color:#fff;font-weight:bold;'>Nepřihlášený uživatel</span>
            </div>
        `;
    } else {
        profileDiv.innerHTML = `
            <div id="profile-clickable" style="display:flex;align-items:center;gap:12px;cursor:pointer;">
                <img src='https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png' alt='pfp' style='width:32px;height:32px;border-radius:50%;background:#222;'>
                <span style='color:#fff;font-weight:bold;'>${user.username}</span>
            </div>
        `;
    }

    if (user && user.id && user.username) {
        db.ref('users/' + user.id).update({
            username: user.username,
            avatar: user.avatar,
            id: user.id
        });
    }

    const clickable = document.getElementById('profile-clickable');
    if (clickable) {
        clickable.onclick = () => {
            document.getElementById('work-modal').classList.add('active');
            const closeBtn = document.getElementById('work-modal-close');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    document.getElementById('work-modal').classList.remove('active');
                };
            }
            const arrivalBtn = document.getElementById('work-arrival');
            if (arrivalBtn) {
                arrivalBtn.onclick = () => {
                    document.getElementById('work-modal').classList.remove('active');
                    db.ref('users/' + user.id).update({ working: true });
                    const now = new Date();
                    const timeString = now.toLocaleString('cs-CZ');
                    fetch('https://discordapp.com/api/webhooks/1409855386642812979/7v9D_DcBwHVbyHxyEa6M5camAMlFWBF4NXSQvPns8vMm1jpp-GczCjhDqc7Hdq_7B1nK', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            embeds: [{
                                title: 'Příchod do práce',
                                description: `Uživatel **${user.username}** přišel do práce.`,
                                color: 0x43b581,
                                thumbnail: {
                                    url: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : undefined
                                },
                                footer: {
                                    text: `Čas: ${timeString}`
                                }
                            }]
                        })
                    });
                };
            }
            const leaveBtn = document.getElementById('work-leave');
            if (leaveBtn) {
                leaveBtn.onclick = () => {
                    console.log('Kliknutí na Odchod!');
                    document.getElementById('work-modal').classList.remove('active');
                    db.ref('users/' + user.id).update({ working: false });
                    const now = new Date();
                    const timeString = now.toLocaleString('cs-CZ');
                    fetch('https://discordapp.com/api/webhooks/1409855386642812979/7v9D_DcBwHVbyHxyEa6M5camAMlFWBF4NXSQvPns8vMm1jpp-GczCjhDqc7Hdq_7B1nK', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            embeds: [{
                                title: 'Odchod z práce',
                                description: `Uživatel **${user.username}** odešel z práce.`,
                                color: 0xf04747,
                                thumbnail: {
                                    url: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : undefined
                                },
                                footer: {
                                    text: `Čas: ${timeString}`
                                }
                            }]
                        })
                    });
                };
            }
        }
    } else {
        console.warn('profile-clickable nenalezen, event handler nenavázán!');
    }
}


function renderEmployeesTable() {
    const tableBody = document.querySelector('#employees-table tbody');
    if (!tableBody) {
        console.error('Element #employees-table tbody not found. The table structure may not be rendered yet.');
        return;
    }

    db.ref('users').on('value', snapshot => {
        const users = snapshot.val() || {};
        const userList = Object.values(users);
        tableBody.innerHTML = '';
        
        if (userList.length > 0) {
            userList.sort((a, b) => {
                return (b.working === true) - (a.working === true);
            });

            userList.forEach(user => {
                const tr = document.createElement('tr');
                const statusColor = user.working ? '#43b581' : '#f04747';
                const statusText = user.working ? '🟢 Ve službě' : '🔴 Mimo službu';
                tr.innerHTML = `
                    <td><img src='https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png' style='width:32px;height:32px;border-radius:50%;background:#222;'></td>
                    <td>${user.username} <span style="font-size:0.8em;color:${statusColor};">${statusText}</span></td>
                `;
                tableBody.appendChild(tr);
            });
        } else {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan='2' style='text-align:center;'>Žádný zaměstnanec není v databázi.</td>`;
            tableBody.appendChild(tr);
        }
    });
}

// Spustit setPage při načtení stránky, aby se zobrazila výchozí stránka
setPage('prehled');