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
                pageContent.innerHTML = '<h2 style="color:#fff;text-align:center;">Stránka Strojvedoucí je ve vývooji.</h2>';
                background.style.background = "url('/Pictures/1185.png') center center/cover no-repeat";
                break;
            case 'vypravci':
                pageTitle.textContent = 'Výpravčí';
                pageContent.innerHTML = '<h2 style="color:#fff;text-align:center;">Stránka Výpravčí je ve vývoji Děkuji za trpělivost.</h2>';
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
                renderEmployeesTable();
                break;
            default:
                pageTitle.textContent = 'Přehled';
                pageContent.innerHTML = '';
                background.style.background = "url('/Pictures/1182.png') center center/cover no-repeat";
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
    // Získání access tokenu z URL fragmentu
    const hash = window.location.hash;
    let accessToken = null;
    if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1));
        accessToken = params.get('access_token');
    }

    if (accessToken) {
        // Načtení uživatelských dat z Discord API
        fetch('https://discord.com/api/users/@me', {
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        })
            .then(res => res.json())
            .then(user => {
                // Skrytí modálního okna
                if (modal) modal.style.display = 'none';
                // Zobrazení profilu v panelu vlevo dole
                showDiscordProfile(user);
            })
            .catch(() => {
                if (modal) modal.style.display = 'flex';
            });
    } else {
        // Pokud není token, zobraz modal
        if (modal) modal.style.display = 'flex';
    }
});

function showDiscordProfile(user) {
    // Vytvoření/umístění do pravého horního rohu
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

    // Zápis uživatele do Firebase Realtime Database
    // Zápis uživatele do Firebase Realtime Database (pouze pokud existuje)
    if (user && user.id && user.username) {
        db.ref('users/' + user.id).update({
            username: user.username,
            avatar: user.avatar,
            id: user.id
        });
    }

    // Navázání event handleru na profile-clickable až po zápisu do Firebase
    const clickable = document.getElementById('profile-clickable');
    if (clickable) {
        clickable.onclick = () => {
            document.getElementById('work-modal').classList.add('active');
            // Obsluha zavření modalu
            const closeBtn = document.getElementById('work-modal-close');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    document.getElementById('work-modal').classList.remove('active');
                };
            }
            // Obsluha tlačítek příchod/odchod
            const arrivalBtn = document.getElementById('work-arrival');
            if (arrivalBtn) {
                arrivalBtn.onclick = () => {
                    document.getElementById('work-modal').classList.remove('active');
                    // Označení uživatele jako "ve službě"
                    db.ref('users/' + user.id).update({ working: true });
                    // Odeslání zprávy na Discord webhook
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
                    // Označení uživatele jako "mimo službu"
                    db.ref('users/' + user.id).update({ working: false });
                    // Odeslání zprávy na Discord webhook
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
            console.log('Modal by měl být aktivní:', document.getElementById('work-modal').classList);
        }
    } else {
        console.warn('profile-clickable nenalezen, event handler nenavázán!');
    }
}


// Funkce pro vykreslení tabulky zaměstnanců na stránce Přehled
function renderEmployeesTable() {
    const tableBody = document.querySelector('#employees-table tbody');
    if (!tableBody) return;

    db.ref('users').on('value', snapshot => {
        const users = snapshot.val() || {};
        const userList = Object.values(users);
        tableBody.innerHTML = '';
        
        if (userList.length > 0) {
            userList.sort((a, b) => {
                // Přesune uživatele s working: true na začátek
                return (b.working === true) - (a.working === true);
            });

            userList.forEach(user => {
                const tr = document.createElement('tr');
                const statusColor = user.working ? '#43b581' : '#f04747'; // Zelená pro "ve službě", červená pro "mimo službu"
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


setPage();